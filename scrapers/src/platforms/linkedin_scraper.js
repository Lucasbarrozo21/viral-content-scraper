const BaseScraper = require('../base_scraper');
const { extractMetrics, generateUniqueId, sanitizeText, detectLanguage } = require('../utils/helpers');

class LinkedInScraper extends BaseScraper {
    constructor(options = {}) {
        super({
            ...options,
            platform: 'linkedin',
            baseUrl: 'https://www.linkedin.com',
            rateLimit: {
                requestsPerMinute: 20,
                requestsPerHour: 300
            }
        });
        
        this.selectors = {
            // Feed posts
            feedPosts: '.feed-shared-update-v2',
            postContent: '.feed-shared-text',
            postAuthor: '.feed-shared-actor__name',
            authorProfile: '.feed-shared-actor__container-link',
            authorTitle: '.feed-shared-actor__description',
            authorImage: '.feed-shared-actor__avatar img',
            postTime: '.feed-shared-actor__sub-description time',
            postImage: '.feed-shared-image__container img',
            postVideo: '.feed-shared-video',
            postDocument: '.feed-shared-document',
            
            // Engagement metrics
            likesCount: '.social-counts-reactions__count',
            commentsCount: '.social-counts-comments .social-counts-comments__count',
            sharesCount: '.social-counts-shares .social-counts-shares__count',
            reactionButton: '.reactions-react-button',
            commentButton: '.comment-button',
            shareButton: '.share-button',
            
            // Comments
            commentsSection: '.comments-comments-list',
            commentItem: '.comment',
            commentAuthor: '.comment__actor-name',
            commentText: '.comment__body',
            commentTime: '.comment__timestamp',
            
            // Company pages
            companyName: '.org-top-card-summary__title',
            companyFollowers: '.org-top-card-summary__follower-count',
            companyDescription: '.org-about-us__description',
            companyPosts: '.org-company-updates-container .feed-shared-update-v2',
            
            // Articles
            articleTitle: '.article-title',
            articleAuthor: '.article-author',
            articleContent: '.article-content',
            articleStats: '.article-stats',
            
            // Search results
            searchResults: '.search-results-container .search-result',
            searchPost: '.search-result__wrapper',
            searchPerson: '.search-result__info',
            searchCompany: '.search-result__info',
            
            // Trending hashtags
            trendingHashtags: '.trending-hashtags',
            hashtagItem: '.hashtag-follow-card',
            hashtagName: '.hashtag-follow-card__name',
            hashtagFollowers: '.hashtag-follow-card__follower-count'
        };
        
        this.postTypes = {
            TEXT: 'text',
            IMAGE: 'image',
            VIDEO: 'video',
            DOCUMENT: 'document',
            ARTICLE: 'article',
            POLL: 'poll',
            EVENT: 'event'
        };
        
        this.contentCategories = {
            LEADERSHIP: 'leadership',
            INDUSTRY_NEWS: 'industry_news',
            COMPANY_UPDATE: 'company_update',
            THOUGHT_LEADERSHIP: 'thought_leadership',
            RECRUITMENT: 'recruitment',
            PRODUCT_LAUNCH: 'product_launch',
            ACHIEVEMENT: 'achievement',
            EDUCATIONAL: 'educational'
        };
    }

    async scrapeFeed(options = {}) {
        const {
            maxPosts = 50,
            minEngagement = 10,
            includeComments = true,
            filterByType = null
        } = options;

        try {
            this.logger.info('Iniciando scraping do feed LinkedIn');
            
            // Navegar para o feed
            await this.page.goto(`${this.baseUrl}/feed/`, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento dos posts
            await this.page.waitForSelector(this.selectors.feedPosts, { timeout: 15000 });
            
            // Scroll para carregar mais posts
            await this.autoScroll(8);
            
            const posts = await this.page.evaluate((selectors, postTypes, minEngagement) => {
                const postElements = document.querySelectorAll(selectors.feedPosts);
                const results = [];
                
                postElements.forEach((element, index) => {
                    try {
                        // Informações básicas do post
                        const contentElement = element.querySelector(selectors.postContent);
                        const authorElement = element.querySelector(selectors.postAuthor);
                        const authorLinkElement = element.querySelector(selectors.authorProfile);
                        const authorTitleElement = element.querySelector(selectors.authorTitle);
                        const authorImageElement = element.querySelector(selectors.authorImage);
                        const timeElement = element.querySelector(selectors.postTime);
                        
                        if (!contentElement || !authorElement) return;
                        
                        const content = contentElement.textContent?.trim();
                        const author = authorElement.textContent?.trim();
                        const authorUrl = authorLinkElement?.href;
                        const authorTitle = authorTitleElement?.textContent?.trim();
                        const authorImage = authorImageElement?.src;
                        const postTime = timeElement?.getAttribute('datetime') || timeElement?.textContent?.trim();
                        
                        // Determinar tipo de post
                        let postType = postTypes.TEXT;
                        const imageElement = element.querySelector(selectors.postImage);
                        const videoElement = element.querySelector(selectors.postVideo);
                        const documentElement = element.querySelector(selectors.postDocument);
                        
                        if (videoElement) postType = postTypes.VIDEO;
                        else if (imageElement) postType = postTypes.IMAGE;
                        else if (documentElement) postType = postTypes.DOCUMENT;
                        
                        // Métricas de engajamento
                        const likesElement = element.querySelector(selectors.likesCount);
                        const commentsElement = element.querySelector(selectors.commentsCount);
                        const sharesElement = element.querySelector(selectors.sharesCount);
                        
                        const likes = this.parseEngagementCount(likesElement?.textContent?.trim() || '0');
                        const comments = this.parseEngagementCount(commentsElement?.textContent?.trim() || '0');
                        const shares = this.parseEngagementCount(sharesElement?.textContent?.trim() || '0');
                        
                        const totalEngagement = likes + comments + shares;
                        
                        // Filtrar por engajamento mínimo
                        if (totalEngagement < minEngagement) return;
                        
                        // Extrair hashtags e menções
                        const hashtags = this.extractHashtags(content);
                        const mentions = this.extractMentions(content);
                        
                        // Mídia anexada
                        const media = [];
                        if (imageElement) {
                            media.push({
                                type: 'image',
                                url: imageElement.src || imageElement.dataset?.src,
                                alt: imageElement.alt
                            });
                        }
                        
                        if (videoElement) {
                            const videoUrl = videoElement.querySelector('video')?.src;
                            const videoPoster = videoElement.querySelector('video')?.poster;
                            media.push({
                                type: 'video',
                                url: videoUrl,
                                poster: videoPoster
                            });
                        }
                        
                        results.push({
                            id: generateUniqueId(),
                            content,
                            postType,
                            author: {
                                name: author,
                                title: authorTitle,
                                profileUrl: authorUrl,
                                image: authorImage
                            },
                            metrics: {
                                likes,
                                comments,
                                shares,
                                totalEngagement
                            },
                            hashtags,
                            mentions,
                            media,
                            postTime,
                            position: index + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar post LinkedIn:', error);
                    }
                });
                
                return results;
            }, this.selectors, this.postTypes, minEngagement);
            
            // Filtrar por tipo se especificado
            let filteredPosts = posts;
            if (filterByType) {
                filteredPosts = posts.filter(p => p.postType === filterByType);
            }
            
            // Limitar quantidade
            filteredPosts = filteredPosts.slice(0, maxPosts);
            
            // Enriquecer com comentários se solicitado
            if (includeComments) {
                for (const post of filteredPosts.slice(0, 10)) { // Limitar aos top 10
                    try {
                        post.topComments = await this.scrapePostComments(post, 3);
                    } catch (error) {
                        this.logger.warn(`Erro ao coletar comentários do post ${post.id}:`, error.message);
                    }
                    
                    await this.randomDelay(1000, 2000);
                }
            }
            
            // Categorizar posts
            filteredPosts.forEach(post => {
                post.category = this.categorizePost(post);
                post.viralScore = this.calculateViralScore(post);
            });
            
            this.logger.info(`Coletados ${filteredPosts.length} posts do LinkedIn`);
            
            return {
                success: true,
                data: {
                    totalPosts: filteredPosts.length,
                    posts: filteredPosts,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping do feed LinkedIn:', error);
            throw error;
        }
    }

    async scrapeCompanyPage(companyUrl, options = {}) {
        const {
            maxPosts = 20,
            includeAbout = true,
            includeEmployees = false
        } = options;

        try {
            this.logger.info(`Coletando dados da empresa: ${companyUrl}`);
            
            await this.page.goto(companyUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento da página
            await this.page.waitForSelector(this.selectors.companyName, { timeout: 10000 });
            
            const companyInfo = await this.page.evaluate((selectors) => {
                const nameElement = document.querySelector(selectors.companyName);
                const followersElement = document.querySelector(selectors.companyFollowers);
                const descriptionElement = document.querySelector(selectors.companyDescription);
                
                return {
                    name: nameElement?.textContent?.trim(),
                    followers: this.parseEngagementCount(followersElement?.textContent?.trim() || '0'),
                    description: descriptionElement?.textContent?.trim(),
                    url: window.location.href
                };
            }, this.selectors);
            
            // Navegar para posts da empresa
            const postsUrl = `${companyUrl}/posts/`;
            await this.page.goto(postsUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar posts
            await this.page.waitForSelector(this.selectors.companyPosts, { timeout: 10000 });
            
            // Scroll para carregar mais posts
            await this.autoScroll(5);
            
            const posts = await this.page.evaluate((selectors, postTypes, maxPosts) => {
                const postElements = document.querySelectorAll(selectors.companyPosts);
                const results = [];
                
                for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
                    const element = postElements[i];
                    
                    try {
                        const contentElement = element.querySelector(selectors.postContent);
                        const timeElement = element.querySelector(selectors.postTime);
                        const likesElement = element.querySelector(selectors.likesCount);
                        const commentsElement = element.querySelector(selectors.commentsCount);
                        const sharesElement = element.querySelector(selectors.sharesCount);
                        
                        if (!contentElement) continue;
                        
                        const content = contentElement.textContent?.trim();
                        const postTime = timeElement?.getAttribute('datetime') || timeElement?.textContent?.trim();
                        
                        const likes = this.parseEngagementCount(likesElement?.textContent?.trim() || '0');
                        const comments = this.parseEngagementCount(commentsElement?.textContent?.trim() || '0');
                        const shares = this.parseEngagementCount(sharesElement?.textContent?.trim() || '0');
                        
                        // Determinar tipo de post
                        let postType = postTypes.TEXT;
                        if (element.querySelector(selectors.postVideo)) postType = postTypes.VIDEO;
                        else if (element.querySelector(selectors.postImage)) postType = postTypes.IMAGE;
                        else if (element.querySelector(selectors.postDocument)) postType = postTypes.DOCUMENT;
                        
                        results.push({
                            id: generateUniqueId(),
                            content,
                            postType,
                            metrics: {
                                likes,
                                comments,
                                shares,
                                totalEngagement: likes + comments + shares
                            },
                            hashtags: this.extractHashtags(content),
                            mentions: this.extractMentions(content),
                            postTime,
                            position: i + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar post da empresa:', error);
                    }
                }
                
                return results;
            }, this.selectors, this.postTypes, maxPosts);
            
            // Categorizar posts da empresa
            posts.forEach(post => {
                post.category = this.categorizePost(post);
                post.viralScore = this.calculateViralScore(post);
            });
            
            this.logger.info(`Coletados ${posts.length} posts da empresa ${companyInfo.name}`);
            
            return {
                success: true,
                data: {
                    company: companyInfo,
                    totalPosts: posts.length,
                    posts: posts,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping da página da empresa:', error);
            throw error;
        }
    }

    async searchContent(query, options = {}) {
        const {
            contentType = 'posts', // posts, people, companies, articles
            maxResults = 20,
            sortBy = 'relevance' // relevance, date
        } = options;

        try {
            this.logger.info(`Buscando conteúdo LinkedIn: "${query}"`);
            
            const searchUrl = `${this.baseUrl}/search/results/${contentType}/?keywords=${encodeURIComponent(query)}`;
            await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar resultados
            await this.page.waitForSelector(this.selectors.searchResults, { timeout: 10000 });
            
            // Scroll para carregar mais resultados
            await this.autoScroll(3);
            
            const searchResults = await this.page.evaluate((selectors, contentType, maxResults) => {
                const resultElements = document.querySelectorAll(selectors.searchResults);
                const results = [];
                
                for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
                    const element = resultElements[i];
                    
                    try {
                        if (contentType === 'posts') {
                            const postElement = element.querySelector(selectors.searchPost);
                            const contentElement = postElement?.querySelector('.feed-shared-text');
                            const authorElement = postElement?.querySelector('.feed-shared-actor__name');
                            const timeElement = postElement?.querySelector('time');
                            
                            if (!contentElement || !authorElement) continue;
                            
                            results.push({
                                type: 'post',
                                content: contentElement.textContent?.trim(),
                                author: authorElement.textContent?.trim(),
                                time: timeElement?.getAttribute('datetime') || timeElement?.textContent?.trim(),
                                position: i + 1
                            });
                            
                        } else if (contentType === 'people') {
                            const personElement = element.querySelector(selectors.searchPerson);
                            const nameElement = personElement?.querySelector('.actor-name');
                            const titleElement = personElement?.querySelector('.subline-level-1');
                            const locationElement = personElement?.querySelector('.subline-level-2');
                            
                            if (!nameElement) continue;
                            
                            results.push({
                                type: 'person',
                                name: nameElement.textContent?.trim(),
                                title: titleElement?.textContent?.trim(),
                                location: locationElement?.textContent?.trim(),
                                position: i + 1
                            });
                            
                        } else if (contentType === 'companies') {
                            const companyElement = element.querySelector(selectors.searchCompany);
                            const nameElement = companyElement?.querySelector('.actor-name');
                            const industryElement = companyElement?.querySelector('.subline-level-1');
                            const locationElement = companyElement?.querySelector('.subline-level-2');
                            
                            if (!nameElement) continue;
                            
                            results.push({
                                type: 'company',
                                name: nameElement.textContent?.trim(),
                                industry: industryElement?.textContent?.trim(),
                                location: locationElement?.textContent?.trim(),
                                position: i + 1
                            });
                        }
                        
                    } catch (error) {
                        console.error('Erro ao processar resultado de busca:', error);
                    }
                }
                
                return results;
            }, this.selectors, contentType, maxResults);
            
            this.logger.info(`Encontrados ${searchResults.length} resultados para "${query}"`);
            
            return {
                success: true,
                data: {
                    query,
                    contentType,
                    totalResults: searchResults.length,
                    results: searchResults,
                    searchedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro na busca de conteúdo LinkedIn:', error);
            throw error;
        }
    }

    async scrapeTrendingHashtags(options = {}) {
        const { maxHashtags = 20 } = options;

        try {
            this.logger.info('Coletando hashtags trending do LinkedIn');
            
            // Navegar para seção de hashtags
            await this.page.goto(`${this.baseUrl}/feed/hashtag/`, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento
            await this.page.waitForSelector(this.selectors.trendingHashtags, { timeout: 10000 });
            
            const hashtags = await this.page.evaluate((selectors, maxHashtags) => {
                const hashtagElements = document.querySelectorAll(selectors.hashtagItem);
                const results = [];
                
                for (let i = 0; i < Math.min(hashtagElements.length, maxHashtags); i++) {
                    const element = hashtagElements[i];
                    
                    try {
                        const nameElement = element.querySelector(selectors.hashtagName);
                        const followersElement = element.querySelector(selectors.hashtagFollowers);
                        
                        if (!nameElement) continue;
                        
                        const name = nameElement.textContent?.trim().replace('#', '');
                        const followers = this.parseEngagementCount(followersElement?.textContent?.trim() || '0');
                        
                        results.push({
                            hashtag: name,
                            followers,
                            position: i + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar hashtag:', error);
                    }
                }
                
                return results;
            }, this.selectors, maxHashtags);
            
            this.logger.info(`Coletadas ${hashtags.length} hashtags trending`);
            
            return {
                success: true,
                data: {
                    totalHashtags: hashtags.length,
                    hashtags: hashtags,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping de hashtags trending:', error);
            throw error;
        }
    }

    async scrapePostComments(post, maxComments = 5) {
        try {
            // Clicar no botão de comentários para expandir
            await this.page.click(this.selectors.commentButton);
            await this.page.waitForSelector(this.selectors.commentsSection, { timeout: 5000 });
            
            const comments = await this.page.evaluate((selectors, maxComments) => {
                const commentElements = document.querySelectorAll(selectors.commentItem);
                const results = [];
                
                for (let i = 0; i < Math.min(commentElements.length, maxComments); i++) {
                    const element = commentElements[i];
                    
                    try {
                        const authorElement = element.querySelector(selectors.commentAuthor);
                        const textElement = element.querySelector(selectors.commentText);
                        const timeElement = element.querySelector(selectors.commentTime);
                        
                        if (!textElement) continue;
                        
                        results.push({
                            author: authorElement?.textContent?.trim(),
                            text: textElement?.textContent?.trim(),
                            time: timeElement?.textContent?.trim(),
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

    parseEngagementCount(countText) {
        if (!countText) return 0;
        
        const text = countText.toLowerCase().replace(/[,.\s]/g, '');
        const number = parseFloat(text);
        
        if (text.includes('k')) return Math.floor(number * 1000);
        if (text.includes('m')) return Math.floor(number * 1000000);
        
        return Math.floor(number) || 0;
    }

    extractHashtags(text) {
        if (!text) return [];
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex);
        return matches ? matches.map(tag => tag.replace('#', '')) : [];
    }

    extractMentions(text) {
        if (!text) return [];
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex);
        return matches ? matches.map(mention => mention.replace('@', '')) : [];
    }

    categorizePost(post) {
        const content = post.content.toLowerCase();
        const { author } = post;
        
        // Análise de palavras-chave para categorização
        if (content.includes('hiring') || content.includes('job') || content.includes('career')) {
            return this.contentCategories.RECRUITMENT;
        }
        
        if (content.includes('launch') || content.includes('product') || content.includes('feature')) {
            return this.contentCategories.PRODUCT_LAUNCH;
        }
        
        if (content.includes('congratulations') || content.includes('achievement') || content.includes('award')) {
            return this.contentCategories.ACHIEVEMENT;
        }
        
        if (content.includes('learn') || content.includes('tip') || content.includes('guide')) {
            return this.contentCategories.EDUCATIONAL;
        }
        
        if (author?.title?.includes('CEO') || author?.title?.includes('Founder') || 
            content.includes('leadership') || content.includes('strategy')) {
            return this.contentCategories.LEADERSHIP;
        }
        
        if (content.includes('industry') || content.includes('market') || content.includes('trend')) {
            return this.contentCategories.INDUSTRY_NEWS;
        }
        
        if (content.includes('company') || content.includes('team') || content.includes('office')) {
            return this.contentCategories.COMPANY_UPDATE;
        }
        
        return this.contentCategories.THOUGHT_LEADERSHIP;
    }

    calculateViralScore(post) {
        const { metrics } = post;
        const { likes = 0, comments = 0, shares = 0 } = metrics;
        
        // Pesos diferentes para cada tipo de engajamento
        const likeWeight = 1;
        const commentWeight = 3; // Comentários têm mais peso
        const shareWeight = 5; // Shares têm o maior peso
        
        const weightedScore = (likes * likeWeight) + (comments * commentWeight) + (shares * shareWeight);
        
        // Normalizar para escala 0-100
        const maxPossibleScore = 10000; // Assumindo valores máximos
        const normalizedScore = Math.min((weightedScore / maxPossibleScore) * 100, 100);
        
        return Math.round(normalizedScore);
    }

    async autoScroll(maxScrolls = 5) {
        for (let i = 0; i < maxScrolls; i++) {
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            await this.randomDelay(3000, 5000);
            
            // Verificar se há mais conteúdo
            const hasMore = await this.page.evaluate(() => {
                const loadingSpinner = document.querySelector('.artdeco-spinner');
                return loadingSpinner && loadingSpinner.style.display !== 'none';
            });
            
            if (!hasMore) break;
        }
    }

    async generateReport(scrapingResults) {
        const report = {
            platform: 'LinkedIn',
            timestamp: new Date().toISOString(),
            summary: {
                totalPosts: 0,
                totalEngagement: 0,
                avgEngagementPerPost: 0,
                topCategories: [],
                viralContent: [],
                topHashtags: []
            },
            insights: [],
            recommendations: []
        };

        // Processar resultados
        if (scrapingResults.posts) {
            report.summary.totalPosts = scrapingResults.posts.length;
            report.summary.totalEngagement = scrapingResults.posts.reduce(
                (sum, p) => sum + (p.metrics?.totalEngagement || 0), 0
            );
            report.summary.avgEngagementPerPost = Math.round(
                report.summary.totalEngagement / report.summary.totalPosts
            );
            
            // Top categorias
            const categories = {};
            scrapingResults.posts.forEach(post => {
                categories[post.category] = (categories[post.category] || 0) + 1;
            });
            
            report.summary.topCategories = Object.entries(categories)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => ({ category, count }));
            
            // Conteúdo viral (top 20% por engajement)
            const sortedByEngagement = scrapingResults.posts
                .sort((a, b) => (b.metrics?.totalEngagement || 0) - (a.metrics?.totalEngagement || 0));
            const viralThreshold = Math.ceil(sortedByEngagement.length * 0.2);
            report.summary.viralContent = sortedByEngagement.slice(0, viralThreshold);
            
            // Top hashtags
            const hashtagCount = {};
            scrapingResults.posts.forEach(post => {
                post.hashtags?.forEach(hashtag => {
                    hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
                });
            });
            
            report.summary.topHashtags = Object.entries(hashtagCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([hashtag, count]) => ({ hashtag, count }));
        }

        // Gerar insights
        report.insights = this.generateInsights(scrapingResults.posts || []);
        report.recommendations = this.generateRecommendations(scrapingResults.posts || []);

        return report;
    }

    generateInsights(posts) {
        const insights = [];
        
        if (posts.length === 0) return insights;
        
        // Análise de tipos de conteúdo
        const typeCount = {};
        posts.forEach(post => {
            typeCount[post.postType] = (typeCount[post.postType] || 0) + 1;
        });
        
        const mostPopularType = Object.entries(typeCount)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostPopularType) {
            insights.push({
                type: 'content_type',
                title: 'Tipo de Conteúdo Dominante',
                description: `${mostPopularType[0]} representa ${Math.round((mostPopularType[1] / posts.length) * 100)}% do conteúdo coletado.`
            });
        }
        
        // Análise de engajamento
        const avgEngagement = posts.reduce((sum, p) => sum + (p.metrics?.totalEngagement || 0), 0) / posts.length;
        insights.push({
            type: 'engagement',
            title: 'Métricas de Engajamento',
            description: `Média de ${Math.round(avgEngagement)} interações por post no LinkedIn.`
        });
        
        // Análise de categorias
        const categories = {};
        posts.forEach(post => {
            categories[post.category] = (categories[post.category] || 0) + 1;
        });
        
        const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];
        if (topCategory) {
            insights.push({
                type: 'category',
                title: 'Categoria Mais Popular',
                description: `${topCategory[0]} é a categoria mais comum, representando ${Math.round((topCategory[1] / posts.length) * 100)}% dos posts.`
            });
        }
        
        return insights;
    }

    generateRecommendations(posts) {
        const recommendations = [];
        
        if (posts.length === 0) return recommendations;
        
        // Recomendação baseada em tipo de conteúdo
        const typeCount = {};
        posts.forEach(post => {
            typeCount[post.postType] = (typeCount[post.postType] || 0) + 1;
        });
        
        const mostPopularType = Object.entries(typeCount)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostPopularType && mostPopularType[0] !== 'text') {
            recommendations.push({
                priority: 'high',
                category: 'content_type',
                title: `Invista em Conteúdo ${mostPopularType[0]}`,
                description: `Posts do tipo ${mostPopularType[0]} têm melhor performance no LinkedIn.`,
                impact: 'high'
            });
        }
        
        // Recomendação de timing
        recommendations.push({
            priority: 'medium',
            category: 'timing',
            title: 'Otimize Horários de Publicação',
            description: 'Analise os horários dos posts com maior engajamento para otimizar sua estratégia.',
            impact: 'medium'
        });
        
        // Recomendação de hashtags
        const hashtagUsage = posts.filter(p => p.hashtags && p.hashtags.length > 0).length;
        const hashtagPercentage = (hashtagUsage / posts.length) * 100;
        
        if (hashtagPercentage > 70) {
            recommendations.push({
                priority: 'high',
                category: 'hashtags',
                title: 'Use Hashtags Estrategicamente',
                description: `${Math.round(hashtagPercentage)}% dos posts usam hashtags. Continue esta prática para maior alcance.`,
                impact: 'medium'
            });
        }
        
        return recommendations;
    }
}

module.exports = LinkedInScraper;

