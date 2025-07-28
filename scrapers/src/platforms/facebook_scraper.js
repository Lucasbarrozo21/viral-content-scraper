const BaseScraper = require('../base_scraper');
const { extractMetrics, generateUniqueId, sanitizeText, detectLanguage } = require('../utils/helpers');

class FacebookScraper extends BaseScraper {
    constructor(options = {}) {
        super({
            ...options,
            platform: 'facebook',
            baseUrl: 'https://www.facebook.com',
            rateLimit: {
                requestsPerMinute: 25,
                requestsPerHour: 400
            }
        });
        
        this.selectors = {
            // Feed posts
            feedPosts: '[data-pagelet="FeedUnit_0"], [role="article"]',
            postContent: '[data-ad-preview="message"], [data-testid="post_message"]',
            postAuthor: '[data-testid="post_author_name"] a, h3 a',
            authorProfile: '[data-testid="post_author_name"] a',
            postTime: '[data-testid="story-subtitle"] a time, abbr[data-utime]',
            postImage: '[data-testid="photo"] img, [role="img"]',
            postVideo: 'video, [data-testid="video-component"]',
            postLink: '[data-testid="post_link"]',
            
            // Engagement metrics
            likesCount: '[data-testid="like_def"] span, [aria-label*="reaction"]',
            commentsCount: '[data-testid="comments_count"], [aria-label*="comment"]',
            sharesCount: '[data-testid="shares_count"], [aria-label*="share"]',
            reactionsButton: '[data-testid="fb-ufi_reactionscount"]',
            commentButton: '[data-testid="UFI2Comment/link"]',
            shareButton: '[data-testid="UFI2SharesCount/link"]',
            
            // Comments
            commentsSection: '[data-testid="UFI2CommentsCount_wrapper"]',
            commentItem: '[data-testid="comment"]',
            commentAuthor: '[data-testid="comment_author_name"]',
            commentText: '[data-testid="comment_text"]',
            commentTime: '[data-testid="comment_timestamp"]',
            
            // Reels
            reelsContainer: '[data-testid="reels_container"]',
            reelItem: '[data-testid="reel_item"]',
            reelVideo: '[data-testid="reel_video"]',
            reelAuthor: '[data-testid="reel_author"]',
            reelDescription: '[data-testid="reel_description"]',
            reelLikes: '[data-testid="reel_likes"]',
            reelComments: '[data-testid="reel_comments"]',
            
            // Pages
            pageName: '[data-testid="page_name"]',
            pageFollowers: '[data-testid="page_followers"]',
            pageAbout: '[data-testid="page_about"]',
            pagePosts: '[data-testid="page_posts"] [role="article"]',
            
            // Groups
            groupName: '[data-testid="group_name"]',
            groupMembers: '[data-testid="group_members"]',
            groupPosts: '[data-testid="group_posts"] [role="article"]',
            
            // Ads Library
            adCard: '[data-testid="ad_card"]',
            adContent: '[data-testid="ad_creative"]',
            adSponsored: '[data-testid="sponsored_label"]',
            adCTA: '[data-testid="ad_cta"]',
            adStats: '[data-testid="ad_stats"]',
            
            // Search results
            searchResults: '[data-testid="search_result"]',
            searchPost: '[data-testid="search_post"]',
            searchPage: '[data-testid="search_page"]',
            searchGroup: '[data-testid="search_group"]'
        };
        
        this.postTypes = {
            TEXT: 'text',
            IMAGE: 'image',
            VIDEO: 'video',
            REEL: 'reel',
            LINK: 'link',
            ALBUM: 'album',
            LIVE: 'live',
            EVENT: 'event',
            POLL: 'poll'
        };
        
        this.contentCategories = {
            PERSONAL: 'personal',
            BUSINESS: 'business',
            NEWS: 'news',
            ENTERTAINMENT: 'entertainment',
            EDUCATION: 'education',
            SPORTS: 'sports',
            TECHNOLOGY: 'technology',
            LIFESTYLE: 'lifestyle',
            MEME: 'meme'
        };
    }

    async scrapeFeed(options = {}) {
        const {
            maxPosts = 50,
            minEngagement = 5,
            includeComments = true,
            filterByType = null
        } = options;

        try {
            this.logger.info('Iniciando scraping do feed Facebook');
            
            // Navegar para o feed
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento dos posts
            await this.page.waitForSelector(this.selectors.feedPosts, { timeout: 15000 });
            
            // Scroll para carregar mais posts
            await this.autoScroll(10);
            
            const posts = await this.page.evaluate((selectors, postTypes, minEngagement) => {
                const postElements = document.querySelectorAll(selectors.feedPosts);
                const results = [];
                
                postElements.forEach((element, index) => {
                    try {
                        // Verificar se é um post válido (não anúncio)
                        const sponsoredElement = element.querySelector('[data-testid="sponsored_label"]');
                        if (sponsoredElement) return; // Pular anúncios
                        
                        // Informações básicas do post
                        const contentElement = element.querySelector(selectors.postContent);
                        const authorElement = element.querySelector(selectors.postAuthor);
                        const timeElement = element.querySelector(selectors.postTime);
                        
                        if (!authorElement) return;
                        
                        const content = contentElement?.textContent?.trim() || '';
                        const author = authorElement.textContent?.trim();
                        const authorUrl = authorElement.href;
                        const postTime = timeElement?.getAttribute('datetime') || 
                                        timeElement?.getAttribute('data-utime') ||
                                        timeElement?.textContent?.trim();
                        
                        // Determinar tipo de post
                        let postType = postTypes.TEXT;
                        const imageElement = element.querySelector(selectors.postImage);
                        const videoElement = element.querySelector(selectors.postVideo);
                        const linkElement = element.querySelector(selectors.postLink);
                        
                        if (videoElement) {
                            // Verificar se é Reel
                            if (element.closest('[data-testid="reels_container"]')) {
                                postType = postTypes.REEL;
                            } else {
                                postType = postTypes.VIDEO;
                            }
                        } else if (imageElement) {
                            // Verificar se é álbum (múltiplas imagens)
                            const imageCount = element.querySelectorAll(selectors.postImage).length;
                            postType = imageCount > 1 ? postTypes.ALBUM : postTypes.IMAGE;
                        } else if (linkElement) {
                            postType = postTypes.LINK;
                        }
                        
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
                            const images = element.querySelectorAll(selectors.postImage);
                            images.forEach(img => {
                                media.push({
                                    type: 'image',
                                    url: img.src || img.dataset?.src,
                                    alt: img.alt
                                });
                            });
                        }
                        
                        if (videoElement) {
                            const videoUrl = videoElement.src || videoElement.querySelector('source')?.src;
                            const videoPoster = videoElement.poster;
                            media.push({
                                type: 'video',
                                url: videoUrl,
                                poster: videoPoster
                            });
                        }
                        
                        if (linkElement) {
                            const linkUrl = linkElement.href;
                            const linkTitle = linkElement.querySelector('[data-testid="link_title"]')?.textContent?.trim();
                            const linkDescription = linkElement.querySelector('[data-testid="link_description"]')?.textContent?.trim();
                            
                            media.push({
                                type: 'link',
                                url: linkUrl,
                                title: linkTitle,
                                description: linkDescription
                            });
                        }
                        
                        results.push({
                            id: generateUniqueId(),
                            content,
                            postType,
                            author: {
                                name: author,
                                profileUrl: authorUrl
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
                        console.error('Erro ao processar post Facebook:', error);
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
            
            this.logger.info(`Coletados ${filteredPosts.length} posts do Facebook`);
            
            return {
                success: true,
                data: {
                    totalPosts: filteredPosts.length,
                    posts: filteredPosts,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping do feed Facebook:', error);
            throw error;
        }
    }

    async scrapeReels(options = {}) {
        const {
            maxReels = 30,
            minViews = 1000
        } = options;

        try {
            this.logger.info('Iniciando scraping de Facebook Reels');
            
            // Navegar para seção de Reels
            await this.page.goto(`${this.baseUrl}/reels/`, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento
            await this.page.waitForSelector(this.selectors.reelsContainer, { timeout: 15000 });
            
            // Scroll para carregar mais Reels
            await this.autoScroll(8);
            
            const reels = await this.page.evaluate((selectors, minViews) => {
                const reelElements = document.querySelectorAll(selectors.reelItem);
                const results = [];
                
                reelElements.forEach((element, index) => {
                    try {
                        const videoElement = element.querySelector(selectors.reelVideo);
                        const authorElement = element.querySelector(selectors.reelAuthor);
                        const descriptionElement = element.querySelector(selectors.reelDescription);
                        const likesElement = element.querySelector(selectors.reelLikes);
                        const commentsElement = element.querySelector(selectors.reelComments);
                        
                        if (!videoElement || !authorElement) return;
                        
                        const description = descriptionElement?.textContent?.trim() || '';
                        const author = authorElement.textContent?.trim();
                        const authorUrl = authorElement.href;
                        
                        const likes = this.parseEngagementCount(likesElement?.textContent?.trim() || '0');
                        const comments = this.parseEngagementCount(commentsElement?.textContent?.trim() || '0');
                        
                        // Estimar views baseado em likes (aproximação)
                        const estimatedViews = likes * 20; // Ratio aproximado
                        
                        if (estimatedViews < minViews) return;
                        
                        const videoUrl = videoElement.src || videoElement.querySelector('source')?.src;
                        const videoPoster = videoElement.poster;
                        
                        results.push({
                            id: generateUniqueId(),
                            description,
                            postType: 'reel',
                            author: {
                                name: author,
                                profileUrl: authorUrl
                            },
                            metrics: {
                                likes,
                                comments,
                                estimatedViews,
                                totalEngagement: likes + comments
                            },
                            hashtags: this.extractHashtags(description),
                            mentions: this.extractMentions(description),
                            media: [{
                                type: 'video',
                                url: videoUrl,
                                poster: videoPoster
                            }],
                            position: index + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar Reel:', error);
                    }
                });
                
                return results;
            }, this.selectors, minViews);
            
            const limitedReels = reels.slice(0, maxReels);
            
            // Categorizar Reels
            limitedReels.forEach(reel => {
                reel.category = this.categorizePost(reel);
                reel.viralScore = this.calculateViralScore(reel);
            });
            
            this.logger.info(`Coletados ${limitedReels.length} Facebook Reels`);
            
            return {
                success: true,
                data: {
                    totalReels: limitedReels.length,
                    reels: limitedReels,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping de Reels:', error);
            throw error;
        }
    }

    async scrapePage(pageUrl, options = {}) {
        const {
            maxPosts = 20,
            includeAbout = true
        } = options;

        try {
            this.logger.info(`Coletando dados da página: ${pageUrl}`);
            
            await this.page.goto(pageUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento da página
            await this.page.waitForSelector(this.selectors.pageName, { timeout: 10000 });
            
            const pageInfo = await this.page.evaluate((selectors) => {
                const nameElement = document.querySelector(selectors.pageName);
                const followersElement = document.querySelector(selectors.pageFollowers);
                const aboutElement = document.querySelector(selectors.pageAbout);
                
                return {
                    name: nameElement?.textContent?.trim(),
                    followers: this.parseEngagementCount(followersElement?.textContent?.trim() || '0'),
                    about: aboutElement?.textContent?.trim(),
                    url: window.location.href
                };
            }, this.selectors);
            
            // Scroll para carregar posts da página
            await this.autoScroll(5);
            
            const posts = await this.page.evaluate((selectors, postTypes, maxPosts) => {
                const postElements = document.querySelectorAll(selectors.pagePosts);
                const results = [];
                
                for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
                    const element = postElements[i];
                    
                    try {
                        const contentElement = element.querySelector(selectors.postContent);
                        const timeElement = element.querySelector(selectors.postTime);
                        const likesElement = element.querySelector(selectors.likesCount);
                        const commentsElement = element.querySelector(selectors.commentsCount);
                        const sharesElement = element.querySelector(selectors.sharesCount);
                        
                        const content = contentElement?.textContent?.trim() || '';
                        const postTime = timeElement?.getAttribute('datetime') || 
                                        timeElement?.getAttribute('data-utime') ||
                                        timeElement?.textContent?.trim();
                        
                        const likes = this.parseEngagementCount(likesElement?.textContent?.trim() || '0');
                        const comments = this.parseEngagementCount(commentsElement?.textContent?.trim() || '0');
                        const shares = this.parseEngagementCount(sharesElement?.textContent?.trim() || '0');
                        
                        // Determinar tipo de post
                        let postType = postTypes.TEXT;
                        if (element.querySelector(selectors.postVideo)) postType = postTypes.VIDEO;
                        else if (element.querySelector(selectors.postImage)) postType = postTypes.IMAGE;
                        else if (element.querySelector(selectors.postLink)) postType = postTypes.LINK;
                        
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
                        console.error('Erro ao processar post da página:', error);
                    }
                }
                
                return results;
            }, this.selectors, this.postTypes, maxPosts);
            
            // Categorizar posts da página
            posts.forEach(post => {
                post.category = this.categorizePost(post);
                post.viralScore = this.calculateViralScore(post);
            });
            
            this.logger.info(`Coletados ${posts.length} posts da página ${pageInfo.name}`);
            
            return {
                success: true,
                data: {
                    page: pageInfo,
                    totalPosts: posts.length,
                    posts: posts,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping da página Facebook:', error);
            throw error;
        }
    }

    async scrapeAdsLibrary(searchTerm, options = {}) {
        const {
            country = 'BR',
            adType = 'all', // all, political, housing, employment
            maxAds = 20
        } = options;

        try {
            this.logger.info(`Buscando anúncios na biblioteca: "${searchTerm}"`);
            
            const adsLibraryUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=${adType}&country=${country}&q=${encodeURIComponent(searchTerm)}`;
            await this.page.goto(adsLibraryUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento dos anúncios
            await this.page.waitForSelector(this.selectors.adCard, { timeout: 15000 });
            
            // Scroll para carregar mais anúncios
            await this.autoScroll(5);
            
            const ads = await this.page.evaluate((selectors, maxAds) => {
                const adElements = document.querySelectorAll(selectors.adCard);
                const results = [];
                
                for (let i = 0; i < Math.min(adElements.length, maxAds); i++) {
                    const element = adElements[i];
                    
                    try {
                        const contentElement = element.querySelector(selectors.adContent);
                        const sponsoredElement = element.querySelector(selectors.adSponsored);
                        const ctaElement = element.querySelector(selectors.adCTA);
                        const statsElement = element.querySelector(selectors.adStats);
                        
                        if (!contentElement) continue;
                        
                        const content = contentElement.textContent?.trim();
                        const advertiser = sponsoredElement?.textContent?.trim();
                        const cta = ctaElement?.textContent?.trim();
                        const stats = statsElement?.textContent?.trim();
                        
                        // Extrair imagens/vídeos do anúncio
                        const media = [];
                        const images = element.querySelectorAll('img');
                        const videos = element.querySelectorAll('video');
                        
                        images.forEach(img => {
                            if (img.src && !img.src.includes('profile')) {
                                media.push({
                                    type: 'image',
                                    url: img.src,
                                    alt: img.alt
                                });
                            }
                        });
                        
                        videos.forEach(video => {
                            media.push({
                                type: 'video',
                                url: video.src,
                                poster: video.poster
                            });
                        });
                        
                        results.push({
                            id: generateUniqueId(),
                            content,
                            advertiser,
                            cta,
                            stats,
                            media,
                            hashtags: this.extractHashtags(content),
                            position: i + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar anúncio:', error);
                    }
                }
                
                return results;
            }, this.selectors, maxAds);
            
            this.logger.info(`Coletados ${ads.length} anúncios para "${searchTerm}"`);
            
            return {
                success: true,
                data: {
                    searchTerm,
                    country,
                    totalAds: ads.length,
                    ads: ads,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping da biblioteca de anúncios:', error);
            throw error;
        }
    }

    async searchContent(query, options = {}) {
        const {
            contentType = 'posts', // posts, pages, groups, videos
            maxResults = 20
        } = options;

        try {
            this.logger.info(`Buscando conteúdo Facebook: "${query}"`);
            
            const searchUrl = `${this.baseUrl}/search/${contentType}/?q=${encodeURIComponent(query)}`;
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
                            const contentElement = postElement?.querySelector('[data-testid="post_message"]');
                            const authorElement = postElement?.querySelector('[data-testid="post_author_name"] a');
                            const timeElement = postElement?.querySelector('time');
                            
                            if (!contentElement || !authorElement) continue;
                            
                            results.push({
                                type: 'post',
                                content: contentElement.textContent?.trim(),
                                author: authorElement.textContent?.trim(),
                                authorUrl: authorElement.href,
                                time: timeElement?.getAttribute('datetime') || timeElement?.textContent?.trim(),
                                position: i + 1
                            });
                            
                        } else if (contentType === 'pages') {
                            const pageElement = element.querySelector(selectors.searchPage);
                            const nameElement = pageElement?.querySelector('[data-testid="page_name"]');
                            const categoryElement = pageElement?.querySelector('[data-testid="page_category"]');
                            const followersElement = pageElement?.querySelector('[data-testid="page_followers"]');
                            
                            if (!nameElement) continue;
                            
                            results.push({
                                type: 'page',
                                name: nameElement.textContent?.trim(),
                                category: categoryElement?.textContent?.trim(),
                                followers: this.parseEngagementCount(followersElement?.textContent?.trim() || '0'),
                                position: i + 1
                            });
                            
                        } else if (contentType === 'groups') {
                            const groupElement = element.querySelector(selectors.searchGroup);
                            const nameElement = groupElement?.querySelector('[data-testid="group_name"]');
                            const membersElement = groupElement?.querySelector('[data-testid="group_members"]');
                            const privacyElement = groupElement?.querySelector('[data-testid="group_privacy"]');
                            
                            if (!nameElement) continue;
                            
                            results.push({
                                type: 'group',
                                name: nameElement.textContent?.trim(),
                                members: this.parseEngagementCount(membersElement?.textContent?.trim() || '0'),
                                privacy: privacyElement?.textContent?.trim(),
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
            this.logger.error('Erro na busca de conteúdo Facebook:', error);
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
        if (text.includes('b')) return Math.floor(number * 1000000000);
        
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
        const content = (post.content || post.description || '').toLowerCase();
        
        // Análise de palavras-chave para categorização
        if (content.includes('funny') || content.includes('lol') || content.includes('meme')) {
            return this.contentCategories.MEME;
        }
        
        if (content.includes('news') || content.includes('breaking') || content.includes('update')) {
            return this.contentCategories.NEWS;
        }
        
        if (content.includes('learn') || content.includes('tip') || content.includes('how to')) {
            return this.contentCategories.EDUCATION;
        }
        
        if (content.includes('business') || content.includes('company') || content.includes('product')) {
            return this.contentCategories.BUSINESS;
        }
        
        if (content.includes('sport') || content.includes('game') || content.includes('match')) {
            return this.contentCategories.SPORTS;
        }
        
        if (content.includes('tech') || content.includes('app') || content.includes('software')) {
            return this.contentCategories.TECHNOLOGY;
        }
        
        if (content.includes('lifestyle') || content.includes('fashion') || content.includes('food')) {
            return this.contentCategories.LIFESTYLE;
        }
        
        if (content.includes('movie') || content.includes('music') || content.includes('show')) {
            return this.contentCategories.ENTERTAINMENT;
        }
        
        return this.contentCategories.PERSONAL;
    }

    calculateViralScore(post) {
        const { metrics } = post;
        const { likes = 0, comments = 0, shares = 0 } = metrics;
        
        // Pesos diferentes para cada tipo de engajamento
        const likeWeight = 1;
        const commentWeight = 2;
        const shareWeight = 4; // Shares têm o maior peso no Facebook
        
        const weightedScore = (likes * likeWeight) + (comments * commentWeight) + (shares * shareWeight);
        
        // Normalizar para escala 0-100
        const maxPossibleScore = 50000; // Assumindo valores máximos para Facebook
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
                const loadingSpinner = document.querySelector('[role="progressbar"]');
                return loadingSpinner && loadingSpinner.style.display !== 'none';
            });
            
            if (!hasMore) break;
        }
    }

    async generateReport(scrapingResults) {
        const report = {
            platform: 'Facebook',
            timestamp: new Date().toISOString(),
            summary: {
                totalPosts: 0,
                totalReels: 0,
                totalAds: 0,
                totalEngagement: 0,
                avgEngagementPerPost: 0,
                topCategories: [],
                viralContent: []
            },
            insights: [],
            recommendations: []
        };

        // Processar resultados
        const allContent = [
            ...(scrapingResults.posts || []),
            ...(scrapingResults.reels || [])
        ];

        if (allContent.length > 0) {
            report.summary.totalPosts = scrapingResults.posts?.length || 0;
            report.summary.totalReels = scrapingResults.reels?.length || 0;
            report.summary.totalEngagement = allContent.reduce(
                (sum, p) => sum + (p.metrics?.totalEngagement || 0), 0
            );
            report.summary.avgEngagementPerPost = Math.round(
                report.summary.totalEngagement / allContent.length
            );
            
            // Top categorias
            const categories = {};
            allContent.forEach(post => {
                categories[post.category] = (categories[post.category] || 0) + 1;
            });
            
            report.summary.topCategories = Object.entries(categories)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => ({ category, count }));
            
            // Conteúdo viral (top 20% por engajement)
            const sortedByEngagement = allContent
                .sort((a, b) => (b.metrics?.totalEngagement || 0) - (a.metrics?.totalEngagement || 0));
            const viralThreshold = Math.ceil(sortedByEngagement.length * 0.2);
            report.summary.viralContent = sortedByEngagement.slice(0, viralThreshold);
        }

        if (scrapingResults.ads) {
            report.summary.totalAds = scrapingResults.ads.length;
        }

        // Gerar insights
        report.insights = this.generateInsights(allContent);
        report.recommendations = this.generateRecommendations(allContent);

        return report;
    }

    generateInsights(content) {
        const insights = [];
        
        if (content.length === 0) return insights;
        
        // Análise de tipos de conteúdo
        const typeCount = {};
        content.forEach(post => {
            typeCount[post.postType] = (typeCount[post.postType] || 0) + 1;
        });
        
        const mostPopularType = Object.entries(typeCount)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostPopularType) {
            insights.push({
                type: 'content_type',
                title: 'Tipo de Conteúdo Dominante',
                description: `${mostPopularType[0]} representa ${Math.round((mostPopularType[1] / content.length) * 100)}% do conteúdo coletado.`
            });
        }
        
        // Análise de Reels vs Posts
        const reels = content.filter(c => c.postType === 'reel');
        const posts = content.filter(c => c.postType !== 'reel');
        
        if (reels.length > 0 && posts.length > 0) {
            const reelsAvgEngagement = reels.reduce((sum, r) => sum + (r.metrics?.totalEngagement || 0), 0) / reels.length;
            const postsAvgEngagement = posts.reduce((sum, p) => sum + (p.metrics?.totalEngagement || 0), 0) / posts.length;
            
            if (reelsAvgEngagement > postsAvgEngagement) {
                insights.push({
                    type: 'performance',
                    title: 'Reels Superam Posts',
                    description: `Reels têm ${Math.round((reelsAvgEngagement / postsAvgEngagement) * 100)}% mais engajamento que posts tradicionais.`
                });
            }
        }
        
        // Análise de engajamento
        const avgEngagement = content.reduce((sum, p) => sum + (p.metrics?.totalEngagement || 0), 0) / content.length;
        insights.push({
            type: 'engagement',
            title: 'Métricas de Engajamento',
            description: `Média de ${Math.round(avgEngagement)} interações por conteúdo no Facebook.`
        });
        
        return insights;
    }

    generateRecommendations(content) {
        const recommendations = [];
        
        if (content.length === 0) return recommendations;
        
        // Recomendação baseada em Reels
        const reels = content.filter(c => c.postType === 'reel');
        if (reels.length > content.length * 0.3) {
            recommendations.push({
                priority: 'high',
                category: 'content_type',
                title: 'Invista em Reels',
                description: 'Reels representam uma parcela significativa do conteúdo viral. Priorize este formato.',
                impact: 'high'
            });
        }
        
        // Recomendação de hashtags
        const hashtagUsage = content.filter(p => p.hashtags && p.hashtags.length > 0).length;
        const hashtagPercentage = (hashtagUsage / content.length) * 100;
        
        if (hashtagPercentage < 50) {
            recommendations.push({
                priority: 'medium',
                category: 'hashtags',
                title: 'Use Mais Hashtags',
                description: `Apenas ${Math.round(hashtagPercentage)}% do conteúdo usa hashtags. Aumente para melhor alcance.`,
                impact: 'medium'
            });
        }
        
        // Recomendação de mídia visual
        const visualContent = content.filter(p => ['image', 'video', 'reel', 'album'].includes(p.postType));
        if (visualContent.length > content.length * 0.8) {
            recommendations.push({
                priority: 'high',
                category: 'visual',
                title: 'Continue Focando em Conteúdo Visual',
                description: `${Math.round((visualContent.length / content.length) * 100)}% do conteúdo viral é visual. Mantenha esta estratégia.`,
                impact: 'high'
            });
        }
        
        return recommendations;
    }
}

module.exports = FacebookScraper;

