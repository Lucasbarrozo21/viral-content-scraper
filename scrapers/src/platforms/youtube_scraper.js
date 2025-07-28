const BaseScraper = require('../base_scraper');
const { extractMetrics, generateUniqueId, sanitizeText, detectLanguage } = require('../utils/helpers');

class YouTubeScraper extends BaseScraper {
    constructor(options = {}) {
        super({
            ...options,
            platform: 'youtube',
            baseUrl: 'https://www.youtube.com',
            rateLimit: {
                requestsPerMinute: 30,
                requestsPerHour: 500
            }
        });
        
        this.selectors = {
            // Vídeos trending
            trendingVideos: 'ytd-video-renderer, ytd-grid-video-renderer',
            videoTitle: '#video-title, h3 a#video-title',
            videoLink: 'a#video-title',
            channelName: '#channel-name a, ytd-channel-name a',
            channelLink: '#channel-name a, ytd-channel-name a',
            viewCount: '#metadata-line span:first-child',
            uploadTime: '#metadata-line span:last-child',
            thumbnail: 'img',
            duration: 'span.ytd-thumbnail-overlay-time-status-renderer',
            
            // Shorts específicos
            shortsContainer: 'ytd-reel-shelf-renderer, ytd-shorts-shelf-renderer',
            shortsVideo: 'ytd-reel-item-renderer',
            shortsTitle: '#video-title',
            shortsViews: '#view-count-text',
            
            // Página do vídeo
            videoPlayer: '#movie_player, #player',
            videoDescription: '#description-text, #expand',
            likesCount: '#top-level-buttons-computed button[aria-label*="like"] #text',
            commentsCount: '#count .count-text',
            subscriberCount: '#subscriber-count',
            tags: 'meta[property="og:video:tag"]',
            
            // Comentários
            commentsSection: '#comments #contents',
            commentItem: 'ytd-comment-thread-renderer',
            commentText: '#content-text',
            commentAuthor: '#author-text',
            commentLikes: '#vote-count-middle',
            
            // Busca
            searchResults: 'ytd-video-renderer',
            searchFilters: '#filter-menu a'
        };
        
        this.videoTypes = {
            REGULAR: 'regular',
            SHORT: 'short',
            LIVE: 'live',
            PREMIERE: 'premiere'
        };
        
        this.categories = {
            TRENDING: 'trending',
            GAMING: 'gaming',
            MUSIC: 'music',
            SPORTS: 'sports',
            NEWS: 'news',
            ENTERTAINMENT: 'entertainment'
        };
    }

    async scrapeTrendingVideos(options = {}) {
        const {
            category = 'trending',
            region = 'BR',
            maxVideos = 50,
            includeShorts = true,
            minViews = 10000
        } = options;

        try {
            this.logger.info(`Iniciando scraping de vídeos trending - Categoria: ${category}`);
            
            // Navegar para página de trending
            const trendingUrl = `${this.baseUrl}/feed/trending?gl=${region}`;
            await this.page.goto(trendingUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento dos vídeos
            await this.page.waitForSelector(this.selectors.trendingVideos, { timeout: 10000 });
            
            // Scroll para carregar mais vídeos
            await this.autoScroll(5);
            
            const videos = await this.page.evaluate((selectors, videoTypes, minViews) => {
                const videoElements = document.querySelectorAll(selectors.trendingVideos);
                const results = [];
                
                videoElements.forEach((element, index) => {
                    try {
                        const titleElement = element.querySelector(selectors.videoTitle);
                        const linkElement = element.querySelector(selectors.videoLink);
                        const channelElement = element.querySelector(selectors.channelName);
                        const viewElement = element.querySelector(selectors.viewCount);
                        const timeElement = element.querySelector(selectors.uploadTime);
                        const thumbnailElement = element.querySelector(selectors.thumbnail);
                        const durationElement = element.querySelector(selectors.duration);
                        
                        if (!titleElement || !linkElement) return;
                        
                        const title = titleElement.textContent?.trim();
                        const url = linkElement.href;
                        const videoId = url.match(/(?:watch\?v=|shorts\/)([^&\n?#]+)/)?.[1];
                        
                        if (!title || !videoId) return;
                        
                        // Extrair métricas
                        const viewText = viewElement?.textContent?.trim() || '0';
                        const views = this.parseViewCount(viewText);
                        
                        // Filtrar por views mínimas
                        if (views < minViews) return;
                        
                        const channelName = channelElement?.textContent?.trim();
                        const channelUrl = channelElement?.href;
                        const uploadTime = timeElement?.textContent?.trim();
                        const thumbnail = thumbnailElement?.src || thumbnailElement?.dataset?.src;
                        const duration = durationElement?.textContent?.trim();
                        
                        // Determinar tipo de vídeo
                        let videoType = videoTypes.REGULAR;
                        if (url.includes('/shorts/')) {
                            videoType = videoTypes.SHORT;
                        } else if (duration && this.parseDuration(duration) < 60) {
                            videoType = videoTypes.SHORT;
                        }
                        
                        results.push({
                            id: videoId,
                            title,
                            url,
                            videoType,
                            channel: {
                                name: channelName,
                                url: channelUrl
                            },
                            metrics: {
                                views,
                                viewsText: viewText
                            },
                            uploadTime,
                            thumbnail,
                            duration,
                            position: index + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar vídeo:', error);
                    }
                });
                
                return results;
            }, this.selectors, this.videoTypes, minViews);
            
            // Filtrar apenas Shorts se solicitado
            let filteredVideos = videos;
            if (!includeShorts) {
                filteredVideos = videos.filter(v => v.videoType !== this.videoTypes.SHORT);
            }
            
            // Limitar quantidade
            filteredVideos = filteredVideos.slice(0, maxVideos);
            
            this.logger.info(`Coletados ${filteredVideos.length} vídeos trending`);
            
            // Enriquecer com dados detalhados
            const enrichedVideos = [];
            for (const video of filteredVideos.slice(0, 10)) { // Limitar detalhes aos top 10
                try {
                    const detailedVideo = await this.scrapeVideoDetails(video.url);
                    enrichedVideos.push({
                        ...video,
                        ...detailedVideo
                    });
                } catch (error) {
                    this.logger.warn(`Erro ao obter detalhes do vídeo ${video.id}:`, error.message);
                    enrichedVideos.push(video);
                }
                
                await this.randomDelay(1000, 3000);
            }
            
            return {
                success: true,
                data: {
                    category,
                    region,
                    totalVideos: filteredVideos.length,
                    videos: enrichedVideos.length > 0 ? enrichedVideos : filteredVideos,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping de trending videos:', error);
            throw error;
        }
    }

    async scrapeShorts(options = {}) {
        const {
            maxShorts = 30,
            minViews = 50000,
            category = null
        } = options;

        try {
            this.logger.info('Iniciando scraping de YouTube Shorts');
            
            // Navegar para seção de Shorts
            const shortsUrl = `${this.baseUrl}/shorts`;
            await this.page.goto(shortsUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento
            await this.page.waitForSelector(this.selectors.shortsContainer, { timeout: 15000 });
            
            // Scroll para carregar mais Shorts
            await this.autoScroll(8);
            
            const shorts = await this.page.evaluate((selectors, minViews) => {
                const shortsElements = document.querySelectorAll(selectors.shortsVideo);
                const results = [];
                
                shortsElements.forEach((element, index) => {
                    try {
                        const titleElement = element.querySelector(selectors.shortsTitle);
                        const linkElement = element.querySelector('a[href*="/shorts/"]');
                        const viewElement = element.querySelector(selectors.shortsViews);
                        const thumbnailElement = element.querySelector('img');
                        
                        if (!titleElement || !linkElement) return;
                        
                        const title = titleElement.textContent?.trim();
                        const url = linkElement.href;
                        const videoId = url.match(/shorts\/([^?&\n]+)/)?.[1];
                        
                        if (!title || !videoId) return;
                        
                        const viewText = viewElement?.textContent?.trim() || '0';
                        const views = this.parseViewCount(viewText);
                        
                        if (views < minViews) return;
                        
                        const thumbnail = thumbnailElement?.src || thumbnailElement?.dataset?.src;
                        
                        results.push({
                            id: videoId,
                            title,
                            url,
                            videoType: 'short',
                            metrics: {
                                views,
                                viewsText: viewText
                            },
                            thumbnail,
                            position: index + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar Short:', error);
                    }
                });
                
                return results;
            }, this.selectors, minViews);
            
            const limitedShorts = shorts.slice(0, maxShorts);
            
            this.logger.info(`Coletados ${limitedShorts.length} YouTube Shorts`);
            
            return {
                success: true,
                data: {
                    totalShorts: limitedShorts.length,
                    shorts: limitedShorts,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping de Shorts:', error);
            throw error;
        }
    }

    async scrapeVideoDetails(videoUrl) {
        try {
            this.logger.info(`Coletando detalhes do vídeo: ${videoUrl}`);
            
            await this.page.goto(videoUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento do player e informações
            await this.page.waitForSelector(this.selectors.videoPlayer, { timeout: 10000 });
            
            const videoDetails = await this.page.evaluate((selectors) => {
                const result = {};
                
                // Título e descrição
                const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer');
                result.title = titleElement?.textContent?.trim();
                
                const descElement = document.querySelector(selectors.videoDescription);
                result.description = descElement?.textContent?.trim();
                
                // Métricas de engajamento
                const likesElement = document.querySelector(selectors.likesCount);
                result.likes = this.parseMetricCount(likesElement?.textContent?.trim() || '0');
                
                const commentsElement = document.querySelector(selectors.commentsCount);
                result.comments = this.parseMetricCount(commentsElement?.textContent?.trim() || '0');
                
                // Informações do canal
                const channelElement = document.querySelector('#channel-name a');
                result.channel = {
                    name: channelElement?.textContent?.trim(),
                    url: channelElement?.href
                };
                
                const subscribersElement = document.querySelector(selectors.subscriberCount);
                result.channel.subscribers = this.parseMetricCount(subscribersElement?.textContent?.trim() || '0');
                
                // Tags e categorias
                const tagElements = document.querySelectorAll(selectors.tags);
                result.tags = Array.from(tagElements).map(tag => tag.content);
                
                // Data de upload
                const uploadElement = document.querySelector('#info-strings yt-formatted-string');
                result.uploadDate = uploadElement?.textContent?.trim();
                
                return result;
            }, this.selectors);
            
            // Coletar comentários top
            const topComments = await this.scrapeTopComments(5);
            videoDetails.topComments = topComments;
            
            // Análise de engajamento
            videoDetails.engagementAnalysis = this.analyzeEngagement(videoDetails);
            
            return videoDetails;
            
        } catch (error) {
            this.logger.warn(`Erro ao coletar detalhes do vídeo: ${error.message}`);
            return {};
        }
    }

    async scrapeTopComments(maxComments = 10) {
        try {
            // Scroll até seção de comentários
            await this.page.evaluate(() => {
                const commentsSection = document.querySelector('#comments');
                if (commentsSection) {
                    commentsSection.scrollIntoView();
                }
            });
            
            await this.page.waitForSelector(this.selectors.commentItem, { timeout: 5000 });
            
            const comments = await this.page.evaluate((selectors, maxComments) => {
                const commentElements = document.querySelectorAll(selectors.commentItem);
                const results = [];
                
                for (let i = 0; i < Math.min(commentElements.length, maxComments); i++) {
                    const element = commentElements[i];
                    
                    try {
                        const authorElement = element.querySelector(selectors.commentAuthor);
                        const textElement = element.querySelector(selectors.commentText);
                        const likesElement = element.querySelector(selectors.commentLikes);
                        
                        if (!textElement) continue;
                        
                        results.push({
                            author: authorElement?.textContent?.trim(),
                            text: textElement?.textContent?.trim(),
                            likes: this.parseMetricCount(likesElement?.textContent?.trim() || '0'),
                            position: i + 1
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar comentário:', error);
                    }
                }
                
                return results;
            }, this.selectors, maxComments);
            
            return comments;
            
        } catch (error) {
            this.logger.warn('Erro ao coletar comentários:', error.message);
            return [];
        }
    }

    async searchVideos(query, options = {}) {
        const {
            sortBy = 'relevance', // relevance, upload_date, view_count, rating
            uploadDate = 'any', // hour, today, week, month, year
            duration = 'any', // short, medium, long
            maxResults = 20
        } = options;

        try {
            this.logger.info(`Buscando vídeos: "${query}"`);
            
            const searchUrl = `${this.baseUrl}/results?search_query=${encodeURIComponent(query)}`;
            await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar resultados
            await this.page.waitForSelector(this.selectors.searchResults, { timeout: 10000 });
            
            // Aplicar filtros se necessário
            if (sortBy !== 'relevance' || uploadDate !== 'any' || duration !== 'any') {
                await this.applySearchFilters(sortBy, uploadDate, duration);
            }
            
            const searchResults = await this.page.evaluate((selectors, maxResults) => {
                const resultElements = document.querySelectorAll(selectors.searchResults);
                const results = [];
                
                for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
                    const element = resultElements[i];
                    
                    try {
                        const titleElement = element.querySelector(selectors.videoTitle);
                        const linkElement = element.querySelector(selectors.videoLink);
                        const channelElement = element.querySelector(selectors.channelName);
                        const viewElement = element.querySelector(selectors.viewCount);
                        const timeElement = element.querySelector(selectors.uploadTime);
                        const thumbnailElement = element.querySelector(selectors.thumbnail);
                        const durationElement = element.querySelector(selectors.duration);
                        
                        if (!titleElement || !linkElement) continue;
                        
                        const title = titleElement.textContent?.trim();
                        const url = linkElement.href;
                        const videoId = url.match(/(?:watch\?v=|shorts\/)([^&\n?#]+)/)?.[1];
                        
                        if (!title || !videoId) continue;
                        
                        results.push({
                            id: videoId,
                            title,
                            url,
                            channel: {
                                name: channelElement?.textContent?.trim(),
                                url: channelElement?.href
                            },
                            metrics: {
                                views: this.parseViewCount(viewElement?.textContent?.trim() || '0'),
                                viewsText: viewElement?.textContent?.trim()
                            },
                            uploadTime: timeElement?.textContent?.trim(),
                            thumbnail: thumbnailElement?.src || thumbnailElement?.dataset?.src,
                            duration: durationElement?.textContent?.trim(),
                            position: i + 1
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar resultado de busca:', error);
                    }
                }
                
                return results;
            }, this.selectors, maxResults);
            
            this.logger.info(`Encontrados ${searchResults.length} resultados para "${query}"`);
            
            return {
                success: true,
                data: {
                    query,
                    totalResults: searchResults.length,
                    videos: searchResults,
                    searchedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro na busca de vídeos:', error);
            throw error;
        }
    }

    async applySearchFilters(sortBy, uploadDate, duration) {
        try {
            // Clicar no botão de filtros
            await this.page.click('#filter-menu button[aria-label="Search filters"]');
            await this.page.waitForSelector('#filter-menu ytd-search-filter-group-renderer', { timeout: 5000 });
            
            // Aplicar filtro de ordenação
            if (sortBy !== 'relevance') {
                const sortOptions = {
                    'upload_date': 'Upload date',
                    'view_count': 'View count',
                    'rating': 'Rating'
                };
                
                if (sortOptions[sortBy]) {
                    await this.page.click(`#filter-menu a[title="${sortOptions[sortBy]}"]`);
                    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                }
            }
            
            // Aplicar filtro de data de upload
            if (uploadDate !== 'any') {
                const dateOptions = {
                    'hour': 'Last hour',
                    'today': 'Today',
                    'week': 'This week',
                    'month': 'This month',
                    'year': 'This year'
                };
                
                if (dateOptions[uploadDate]) {
                    await this.page.click(`#filter-menu a[title="${dateOptions[uploadDate]}"]`);
                    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                }
            }
            
            // Aplicar filtro de duração
            if (duration !== 'any') {
                const durationOptions = {
                    'short': 'Short (< 4 minutes)',
                    'medium': 'Medium (4 - 20 minutes)',
                    'long': 'Long (> 20 minutes)'
                };
                
                if (durationOptions[duration]) {
                    await this.page.click(`#filter-menu a[title="${durationOptions[duration]}"]`);
                    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                }
            }
            
        } catch (error) {
            this.logger.warn('Erro ao aplicar filtros de busca:', error.message);
        }
    }

    parseViewCount(viewText) {
        if (!viewText) return 0;
        
        const text = viewText.toLowerCase().replace(/[,.\s]/g, '');
        const number = parseFloat(text);
        
        if (text.includes('k')) return Math.floor(number * 1000);
        if (text.includes('m')) return Math.floor(number * 1000000);
        if (text.includes('b')) return Math.floor(number * 1000000000);
        
        return Math.floor(number) || 0;
    }

    parseMetricCount(metricText) {
        return this.parseViewCount(metricText);
    }

    parseDuration(durationText) {
        if (!durationText) return 0;
        
        const parts = durationText.split(':').map(p => parseInt(p));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1]; // MM:SS
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        }
        
        return 0;
    }

    analyzeEngagement(videoDetails) {
        const { likes = 0, comments = 0, metrics = {} } = videoDetails;
        const { views = 0 } = metrics;
        
        if (views === 0) return { score: 0, level: 'unknown' };
        
        const likeRate = (likes / views) * 100;
        const commentRate = (comments / views) * 100;
        const engagementScore = (likeRate * 0.7) + (commentRate * 0.3);
        
        let level = 'low';
        if (engagementScore > 5) level = 'excellent';
        else if (engagementScore > 2) level = 'high';
        else if (engagementScore > 1) level = 'medium';
        
        return {
            score: Math.round(engagementScore * 100) / 100,
            level,
            likeRate: Math.round(likeRate * 100) / 100,
            commentRate: Math.round(commentRate * 100) / 100
        };
    }

    async autoScroll(maxScrolls = 5) {
        for (let i = 0; i < maxScrolls; i++) {
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            await this.randomDelay(2000, 4000);
            
            // Verificar se há mais conteúdo para carregar
            const hasMore = await this.page.evaluate(() => {
                const spinner = document.querySelector('ytd-continuation-item-renderer');
                return spinner && spinner.style.display !== 'none';
            });
            
            if (!hasMore) break;
        }
    }

    async getChannelInfo(channelUrl) {
        try {
            await this.page.goto(channelUrl, { waitUntil: 'networkidle2' });
            
            const channelInfo = await this.page.evaluate(() => {
                const nameElement = document.querySelector('#channel-name #text');
                const subscribersElement = document.querySelector('#subscriber-count');
                const avatarElement = document.querySelector('#avatar img');
                const bannerElement = document.querySelector('#channel-header-canvas img');
                
                return {
                    name: nameElement?.textContent?.trim(),
                    subscribers: subscribersElement?.textContent?.trim(),
                    avatar: avatarElement?.src,
                    banner: bannerElement?.src,
                    url: window.location.href
                };
            });
            
            return channelInfo;
            
        } catch (error) {
            this.logger.warn('Erro ao obter informações do canal:', error.message);
            return {};
        }
    }

    async generateReport(scrapingResults) {
        const report = {
            platform: 'YouTube',
            timestamp: new Date().toISOString(),
            summary: {
                totalVideos: 0,
                totalShorts: 0,
                totalViews: 0,
                avgEngagement: 0,
                topCategories: [],
                viralContent: []
            },
            insights: [],
            recommendations: []
        };

        // Processar resultados
        if (scrapingResults.videos) {
            report.summary.totalVideos = scrapingResults.videos.length;
            report.summary.totalViews = scrapingResults.videos.reduce((sum, v) => sum + (v.metrics?.views || 0), 0);
        }

        if (scrapingResults.shorts) {
            report.summary.totalShorts = scrapingResults.shorts.length;
        }

        // Identificar conteúdo viral (top 10% por views)
        const allContent = [...(scrapingResults.videos || []), ...(scrapingResults.shorts || [])];
        const sortedByViews = allContent.sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0));
        const viralThreshold = Math.ceil(sortedByViews.length * 0.1);
        report.summary.viralContent = sortedByViews.slice(0, viralThreshold);

        // Gerar insights
        report.insights = this.generateInsights(allContent);
        report.recommendations = this.generateRecommendations(allContent);

        return report;
    }

    generateInsights(content) {
        const insights = [];
        
        if (content.length === 0) return insights;
        
        // Análise de duração
        const shorts = content.filter(c => c.videoType === 'short');
        const regular = content.filter(c => c.videoType === 'regular');
        
        if (shorts.length > regular.length) {
            insights.push({
                type: 'trend',
                title: 'Dominância dos Shorts',
                description: `${Math.round((shorts.length / content.length) * 100)}% do conteúdo viral são Shorts, indicando forte tendência para vídeos curtos.`
            });
        }
        
        // Análise de timing
        const uploadTimes = content.map(c => c.uploadTime).filter(Boolean);
        if (uploadTimes.length > 0) {
            insights.push({
                type: 'timing',
                title: 'Padrões de Upload',
                description: 'Análise dos horários de upload mais eficazes para viralização.'
            });
        }
        
        // Análise de engajamento
        const avgViews = content.reduce((sum, c) => sum + (c.metrics?.views || 0), 0) / content.length;
        insights.push({
            type: 'engagement',
            title: 'Métricas de Engajamento',
            description: `Média de ${this.formatNumber(avgViews)} visualizações por vídeo coletado.`
        });
        
        return insights;
    }

    generateRecommendations(content) {
        const recommendations = [];
        
        // Recomendação baseada em tipo de conteúdo
        const shorts = content.filter(c => c.videoType === 'short');
        if (shorts.length > content.length * 0.6) {
            recommendations.push({
                priority: 'high',
                category: 'content_type',
                title: 'Foque em Shorts',
                description: 'Shorts representam a maioria do conteúdo viral. Priorize este formato.',
                impact: 'high'
            });
        }
        
        // Recomendação de timing
        recommendations.push({
            priority: 'medium',
            category: 'timing',
            title: 'Otimize Horários de Upload',
            description: 'Analise os horários de upload dos vídeos virais para otimizar sua estratégia.',
            impact: 'medium'
        });
        
        // Recomendação de thumbnails
        recommendations.push({
            priority: 'high',
            category: 'visual',
            title: 'Otimize Thumbnails',
            description: 'Thumbnails são cruciais para CTR. Analise padrões visuais dos vídeos coletados.',
            impact: 'high'
        });
        
        return recommendations;
    }

    formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

module.exports = YouTubeScraper;

