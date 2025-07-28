const BaseScraper = require('../base_scraper');
const { 
    delay, 
    sanitizeText, 
    extractNumber, 
    extractHashtags, 
    extractMentions,
    normalizeEngagementMetrics,
    generateContentId,
    validateContent
} = require('../utils/helpers');

/**
 * Scraper especializado para TikTok
 * Coleta vídeos virais, tendências e dados de engajamento
 */
class TikTokScraper extends BaseScraper {
    constructor(config = {}) {
        super('TikTok', {
            ...config,
            delayMin: 2000,
            delayMax: 5000
        });

        this.baseUrl = 'https://www.tiktok.com';
        this.endpoints = {
            trending: '/foryou',
            discover: '/discover',
            hashtag: '/tag/',
            user: '/@',
            video: '/video/',
            music: '/music/'
        };

        // Seletores CSS para elementos do TikTok
        this.selectors = {
            // Vídeos
            videoContainer: 'div[data-e2e="recommend-list-item-container"]',
            videoElement: 'video',
            videoLink: 'a[data-e2e="video-detail-link"]',
            
            // Informações do vídeo
            videoDesc: 'div[data-e2e="video-desc"]',
            videoAuthor: 'span[data-e2e="video-author-uniqueid"]',
            videoMusic: 'div[data-e2e="video-music"]',
            
            // Métricas
            likeButton: 'button[data-e2e="like-button"]',
            likeCount: 'strong[data-e2e="like-count"]',
            commentButton: 'button[data-e2e="comment-button"]',
            commentCount: 'strong[data-e2e="comment-count"]',
            shareButton: 'button[data-e2e="share-button"]',
            shareCount: 'strong[data-e2e="share-count"]',
            
            // Navegação
            nextVideo: 'button[data-e2e="arrow-right"]',
            loadMore: 'button[data-e2e="load-more"]',
            
            // Trending
            trendingItem: 'div[data-e2e="trending-item"]',
            hashtagChallenge: 'div[data-e2e="hashtag-challenge"]',
            
            // Discover
            discoverCard: 'div[data-e2e="discover-card"]',
            discoverHashtag: 'p[data-e2e="discover-hashtag"]',
            discoverCount: 'strong[data-e2e="discover-count"]'
        };

        // Headers específicos para TikTok
        this.tiktokHeaders = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
    }

    /**
     * Inicia o processo de scraping do TikTok
     */
    async scrapeContent(options = {}) {
        const {
            contentTypes = ['trending', 'discover'],
            hashtags = [],
            users = [],
            maxItems = 100,
            minLikes = 10000,
            minViews = 100000
        } = options;

        try {
            await this.initialize();
            this.logger.info('Iniciando scraping do TikTok...');

            // Configurar headers específicos do TikTok
            await this.page.setExtraHTTPHeaders(this.tiktokHeaders);

            const results = {
                trending: [],
                discover: [],
                hashtags: [],
                users: [],
                totalCollected: 0,
                errors: []
            };

            // Scraping por tipo de conteúdo
            for (const contentType of contentTypes) {
                try {
                    switch (contentType) {
                        case 'trending':
                            const trending = await this.scrapeTrending({ maxItems, minLikes, minViews });
                            results.trending = trending;
                            break;
                            
                        case 'discover':
                            const discover = await this.scrapeDiscover({ maxItems });
                            results.discover = discover;
                            break;
                    }
                } catch (error) {
                    results.errors.push({
                        contentType,
                        error: error.message
                    });
                    this.logger.error(`Erro ao coletar ${contentType}:`, error);
                }
            }

            // Scraping por hashtags específicas
            if (hashtags.length > 0) {
                for (const hashtag of hashtags) {
                    try {
                        const hashtagContent = await this.scrapeHashtag(hashtag, { maxItems: 50 });
                        results.hashtags.push({
                            hashtag,
                            content: hashtagContent
                        });
                    } catch (error) {
                        results.errors.push({
                            hashtag,
                            error: error.message
                        });
                    }
                }
            }

            // Scraping por usuários específicos
            if (users.length > 0) {
                for (const username of users) {
                    try {
                        const userContent = await this.scrapeUserProfile(username, { maxItems: 30 });
                        results.users.push({
                            username,
                            content: userContent
                        });
                    } catch (error) {
                        results.errors.push({
                            username,
                            error: error.message
                        });
                    }
                }
            }

            results.totalCollected = results.trending.length + results.discover.length + 
                                   results.hashtags.reduce((sum, h) => sum + h.content.length, 0) +
                                   results.users.reduce((sum, u) => sum + u.content.length, 0);
            
            // Salvar resultados
            await this.saveData(results, `tiktok_scraping_${Date.now()}.json`);
            
            this.logger.info(`Scraping concluído. Total coletado: ${results.totalCollected} itens`);
            return results;

        } catch (error) {
            this.logger.error('Erro no scraping do TikTok:', error);
            throw error;
        } finally {
            await this.close();
        }
    }

    /**
     * Coleta vídeos em trending/For You
     */
    async scrapeTrending(options = {}) {
        const { maxItems = 50, minLikes = 10000, minViews = 100000 } = options;
        
        try {
            this.logger.info('Coletando vídeos trending do TikTok...');
            
            // Navegar para página For You
            await this.navigateToUrl(`${this.baseUrl}/foryou`);
            await delay(5000);

            // Aguardar carregamento dos vídeos
            await this.waitForElement('div[data-e2e="recommend-list-item-container"]', 10000);

            const videos = [];
            let scrollAttempts = 0;
            const maxScrolls = Math.ceil(maxItems / 10);

            while (videos.length < maxItems && scrollAttempts < maxScrolls) {
                // Extrair vídeos da página atual
                const pageVideos = await this.extractVideosFromPage();
                
                for (const video of pageVideos) {
                    if (video.metrics.likes >= minLikes && 
                        video.metrics.views >= minViews && 
                        videos.length < maxItems) {
                        videos.push(video);
                    }
                }

                // Scroll para carregar mais vídeos
                await this.scrollPage({ scrolls: 3, delay: 3000 });
                scrollAttempts++;
                
                this.logger.info(`Coletados ${videos.length} vídeos trending até agora...`);
                
                // Delay adicional para evitar rate limiting
                await delay(2000);
            }

            this.logger.info(`Total de vídeos trending coletados: ${videos.length}`);
            return videos;

        } catch (error) {
            this.logger.error('Erro ao coletar vídeos trending:', error);
            return [];
        }
    }

    /**
     * Extrai dados dos vídeos da página atual
     */
    async extractVideosFromPage() {
        try {
            return await this.page.evaluate(() => {
                const videos = [];
                
                // Tentar diferentes seletores para vídeos do TikTok
                const videoContainers = document.querySelectorAll(
                    'div[data-e2e="recommend-list-item-container"], ' +
                    'div[class*="DivItemContainer"], ' +
                    'div[class*="video-feed-item"]'
                );

                videoContainers.forEach((container, index) => {
                    try {
                        // Link do vídeo
                        const linkElement = container.querySelector('a[href*="@"]') || 
                                          container.querySelector('a[data-e2e="video-detail-link"]');
                        
                        if (!linkElement) return;
                        
                        const url = linkElement.href;
                        const videoId = url.match(/video\/(\d+)/)?.[1] || `video_${Date.now()}_${index}`;
                        
                        // Elemento de vídeo
                        const videoElement = container.querySelector('video');
                        const videoUrl = videoElement ? videoElement.src : null;
                        const videoPoster = videoElement ? videoElement.poster : null;
                        
                        // Autor
                        const authorElement = container.querySelector('span[data-e2e="video-author-uniqueid"]') ||
                                            container.querySelector('a[data-e2e="video-author"]') ||
                                            container.querySelector('[class*="author"]');
                        
                        const author = authorElement ? authorElement.textContent.trim().replace('@', '') : 'unknown';
                        
                        // Descrição do vídeo
                        const descElement = container.querySelector('div[data-e2e="video-desc"]') ||
                                          container.querySelector('[class*="video-desc"]') ||
                                          container.querySelector('[class*="description"]');
                        
                        const description = descElement ? descElement.textContent.trim() : '';
                        
                        // Música/Som
                        const musicElement = container.querySelector('div[data-e2e="video-music"]') ||
                                           container.querySelector('[class*="music"]');
                        const music = musicElement ? musicElement.textContent.trim() : '';
                        
                        // Métricas - TikTok pode ter diferentes estruturas
                        const likeElement = container.querySelector('strong[data-e2e="like-count"]') ||
                                          container.querySelector('[class*="like"] strong') ||
                                          container.querySelector('[aria-label*="like"] strong');
                        
                        const commentElement = container.querySelector('strong[data-e2e="comment-count"]') ||
                                             container.querySelector('[class*="comment"] strong');
                        
                        const shareElement = container.querySelector('strong[data-e2e="share-count"]') ||
                                           container.querySelector('[class*="share"] strong');
                        
                        // Extrair números das métricas
                        const likes = likeElement ? this.extractNumber(likeElement.textContent) : 0;
                        const comments = commentElement ? this.extractNumber(commentElement.textContent) : 0;
                        const shares = shareElement ? this.extractNumber(shareElement.textContent) : 0;
                        
                        // Views (estimativa baseada em likes - TikTok não sempre mostra views)
                        const views = likes > 0 ? Math.max(likes * 10, 1000) : 0;
                        
                        // Extrair hashtags e menções
                        const hashtags = description.match(/#[\w\u00C0-\u017F]+/g) || [];
                        const mentions = description.match(/@[\w\u00C0-\u017F]+/g) || [];
                        
                        const video = {
                            id: videoId,
                            platform: 'tiktok',
                            contentType: 'video',
                            url: url,
                            videoUrl: videoUrl,
                            thumbnailUrl: videoPoster,
                            author: author,
                            description: description,
                            music: music,
                            hashtags: hashtags.map(tag => tag.toLowerCase()),
                            mentions: mentions.map(mention => mention.toLowerCase()),
                            metrics: {
                                likes: likes,
                                comments: comments,
                                shares: shares,
                                views: views
                            },
                            timestamp: new Date().toISOString(),
                            collectedAt: new Date().toISOString()
                        };
                        
                        videos.push(video);
                        
                    } catch (error) {
                        console.warn('Erro ao extrair vídeo:', error);
                    }
                });

                return videos;
            });

        } catch (error) {
            this.logger.error('Erro ao extrair vídeos da página:', error);
            return [];
        }
    }

    /**
     * Coleta dados da página Discover
     */
    async scrapeDiscover(options = {}) {
        const { maxItems = 30 } = options;
        
        try {
            this.logger.info('Coletando dados do Discover TikTok...');
            
            await this.navigateToUrl(`${this.baseUrl}/discover`);
            await delay(3000);

            const discoverData = await this.page.evaluate(() => {
                const items = [];
                
                // Hashtags trending
                const hashtagElements = document.querySelectorAll('div[data-e2e="discover-card"]');
                
                hashtagElements.forEach((element, index) => {
                    try {
                        const hashtagElement = element.querySelector('p[data-e2e="discover-hashtag"]') ||
                                             element.querySelector('[class*="hashtag"]');
                        
                        const countElement = element.querySelector('strong[data-e2e="discover-count"]') ||
                                           element.querySelector('strong');
                        
                        const linkElement = element.querySelector('a');
                        
                        if (hashtagElement) {
                            const hashtag = hashtagElement.textContent.trim();
                            const count = countElement ? this.extractNumber(countElement.textContent) : 0;
                            const url = linkElement ? linkElement.href : '';
                            
                            items.push({
                                id: `discover_${index}_${Date.now()}`,
                                platform: 'tiktok',
                                contentType: 'hashtag_trend',
                                hashtag: hashtag,
                                url: url,
                                viewCount: count,
                                rank: index + 1,
                                collectedAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.warn('Erro ao extrair item do discover:', error);
                    }
                });
                
                return items;
            });

            this.logger.info(`Total de itens discover coletados: ${discoverData.length}`);
            return discoverData.slice(0, maxItems);

        } catch (error) {
            this.logger.error('Erro ao coletar discover:', error);
            return [];
        }
    }

    /**
     * Coleta conteúdo por hashtag específica
     */
    async scrapeHashtag(hashtag, options = {}) {
        const { maxItems = 30 } = options;
        
        try {
            this.logger.info(`Coletando conteúdo da hashtag: #${hashtag}`);
            
            const hashtagUrl = `${this.baseUrl}/tag/${hashtag}`;
            await this.navigateToUrl(hashtagUrl);
            await delay(4000);

            // Aguardar carregamento
            await this.waitForElement('div[data-e2e="challenge-item"]', 8000);

            const content = [];
            let scrollAttempts = 0;
            const maxScrolls = 3;

            while (content.length < maxItems && scrollAttempts < maxScrolls) {
                const pageContent = await this.extractVideosFromPage();
                content.push(...pageContent);
                
                await this.scrollPage({ scrolls: 2, delay: 3000 });
                scrollAttempts++;
            }

            // Adicionar informações da hashtag
            const hashtagInfo = await this.extractHashtagInfo();
            
            return {
                hashtag: hashtag,
                info: hashtagInfo,
                videos: content.slice(0, maxItems)
            };

        } catch (error) {
            this.logger.error(`Erro ao coletar hashtag ${hashtag}:`, error);
            return {
                hashtag: hashtag,
                info: null,
                videos: []
            };
        }
    }

    /**
     * Extrai informações da hashtag
     */
    async extractHashtagInfo() {
        try {
            return await this.page.evaluate(() => {
                const titleElement = document.querySelector('h1[data-e2e="challenge-title"]');
                const descElement = document.querySelector('div[data-e2e="challenge-desc"]');
                const countElement = document.querySelector('strong[data-e2e="challenge-count"]');
                
                return {
                    title: titleElement ? titleElement.textContent.trim() : '',
                    description: descElement ? descElement.textContent.trim() : '',
                    videoCount: countElement ? this.extractNumber(countElement.textContent) : 0,
                    extractedAt: new Date().toISOString()
                };
            });
        } catch (error) {
            this.logger.error('Erro ao extrair info da hashtag:', error);
            return null;
        }
    }

    /**
     * Coleta conteúdo do perfil de um usuário
     */
    async scrapeUserProfile(username, options = {}) {
        const { maxItems = 20 } = options;
        
        try {
            this.logger.info(`Coletando perfil do usuário: @${username}`);
            
            const profileUrl = `${this.baseUrl}/@${username}`;
            await this.navigateToUrl(profileUrl);
            await delay(4000);

            // Extrair informações do perfil
            const profileInfo = await this.extractProfileInfo();
            
            // Extrair vídeos do usuário
            const videos = [];
            let scrollAttempts = 0;
            const maxScrolls = 2;

            while (videos.length < maxItems && scrollAttempts < maxScrolls) {
                const pageVideos = await this.extractVideosFromPage();
                videos.push(...pageVideos);
                
                await this.scrollPage({ scrolls: 2, delay: 3000 });
                scrollAttempts++;
            }

            return {
                username: username,
                profile: profileInfo,
                videos: videos.slice(0, maxItems)
            };

        } catch (error) {
            this.logger.error(`Erro ao coletar perfil ${username}:`, error);
            return {
                username: username,
                profile: null,
                videos: []
            };
        }
    }

    /**
     * Extrai informações do perfil do usuário
     */
    async extractProfileInfo() {
        try {
            return await this.page.evaluate(() => {
                const usernameElement = document.querySelector('h1[data-e2e="user-title"]');
                const nicknameElement = document.querySelector('h2[data-e2e="user-subtitle"]');
                const bioElement = document.querySelector('h2[data-e2e="user-bio"]');
                const followersElement = document.querySelector('strong[data-e2e="followers-count"]');
                const followingElement = document.querySelector('strong[data-e2e="following-count"]');
                const likesElement = document.querySelector('strong[data-e2e="likes-count"]');
                const avatarElement = document.querySelector('span[data-e2e="user-avatar"] img');
                
                return {
                    username: usernameElement ? usernameElement.textContent.trim() : '',
                    nickname: nicknameElement ? nicknameElement.textContent.trim() : '',
                    bio: bioElement ? bioElement.textContent.trim() : '',
                    followers: followersElement ? this.extractNumber(followersElement.textContent) : 0,
                    following: followingElement ? this.extractNumber(followingElement.textContent) : 0,
                    totalLikes: likesElement ? this.extractNumber(likesElement.textContent) : 0,
                    avatarUrl: avatarElement ? avatarElement.src : '',
                    extractedAt: new Date().toISOString()
                };
            });
        } catch (error) {
            this.logger.error('Erro ao extrair info do perfil:', error);
            return null;
        }
    }

    /**
     * Detecta tendências musicais
     */
    async scrapeMusicTrends(options = {}) {
        const { maxItems = 20 } = options;
        
        try {
            this.logger.info('Coletando tendências musicais do TikTok...');
            
            // TikTok não tem uma página específica de música, mas podemos extrair das páginas existentes
            await this.navigateToUrl(`${this.baseUrl}/discover`);
            await delay(3000);

            const musicTrends = await this.page.evaluate(() => {
                const trends = [];
                const musicElements = document.querySelectorAll('[class*="music"], [data-e2e*="music"]');
                
                musicElements.forEach((element, index) => {
                    try {
                        const musicText = element.textContent.trim();
                        if (musicText && musicText.length > 0) {
                            trends.push({
                                id: `music_trend_${index}_${Date.now()}`,
                                platform: 'tiktok',
                                contentType: 'music_trend',
                                title: musicText,
                                rank: index + 1,
                                collectedAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.warn('Erro ao extrair tendência musical:', error);
                    }
                });
                
                return trends;
            });

            return musicTrends.slice(0, maxItems);

        } catch (error) {
            this.logger.error('Erro ao coletar tendências musicais:', error);
            return [];
        }
    }

    /**
     * Analisa padrões de viralização
     */
    analyzeViralPatterns(videos) {
        try {
            const patterns = {
                topHashtags: {},
                topMusic: {},
                avgMetrics: {
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    views: 0
                },
                viralThresholds: {
                    likes: 0,
                    views: 0
                },
                contentTypes: {}
            };

            if (videos.length === 0) return patterns;

            // Analisar hashtags mais populares
            videos.forEach(video => {
                video.hashtags.forEach(hashtag => {
                    patterns.topHashtags[hashtag] = (patterns.topHashtags[hashtag] || 0) + 1;
                });
                
                if (video.music) {
                    patterns.topMusic[video.music] = (patterns.topMusic[video.music] || 0) + 1;
                }
            });

            // Calcular métricas médias
            const totalMetrics = videos.reduce((acc, video) => {
                acc.likes += video.metrics.likes;
                acc.comments += video.metrics.comments;
                acc.shares += video.metrics.shares;
                acc.views += video.metrics.views;
                return acc;
            }, { likes: 0, comments: 0, shares: 0, views: 0 });

            patterns.avgMetrics = {
                likes: Math.round(totalMetrics.likes / videos.length),
                comments: Math.round(totalMetrics.comments / videos.length),
                shares: Math.round(totalMetrics.shares / videos.length),
                views: Math.round(totalMetrics.views / videos.length)
            };

            // Determinar thresholds virais (top 10%)
            const sortedByLikes = videos.sort((a, b) => b.metrics.likes - a.metrics.likes);
            const top10PercentIndex = Math.floor(videos.length * 0.1);
            
            patterns.viralThresholds = {
                likes: sortedByLikes[top10PercentIndex]?.metrics.likes || 0,
                views: sortedByLikes[top10PercentIndex]?.metrics.views || 0
            };

            return patterns;

        } catch (error) {
            this.logger.error('Erro ao analisar padrões virais:', error);
            return {};
        }
    }
}

module.exports = TikTokScraper;

