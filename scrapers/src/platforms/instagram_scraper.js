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
 * Scraper especializado para Instagram
 * Coleta Reels, Posts, Stories e anúncios
 */
class InstagramScraper extends BaseScraper {
    constructor(config = {}) {
        super('Instagram', {
            ...config,
            delayMin: 3000,
            delayMax: 7000
        });

        this.baseUrl = 'https://www.instagram.com';
        this.endpoints = {
            explore: '/explore/',
            reels: '/reels/',
            hashtag: '/explore/tags/',
            user: '/',
            graphql: '/graphql/query/'
        };

        // Seletores CSS para elementos do Instagram
        this.selectors = {
            // Posts gerais
            post: 'article[role="presentation"]',
            postLink: 'a[href*="/p/"]',
            
            // Reels
            reelContainer: 'div[role="presentation"]',
            reelVideo: 'video',
            reelLink: 'a[href*="/reel/"]',
            
            // Métricas
            likesButton: 'button[aria-label*="curtida"]',
            commentsButton: 'button[aria-label*="comentário"]',
            sharesButton: 'button[aria-label*="compartilhar"]',
            
            // Conteúdo
            caption: 'div[data-testid="post-caption"]',
            username: 'a[role="link"] span',
            timestamp: 'time',
            
            // Navegação
            nextButton: 'button[aria-label="Próximo"]',
            loadMoreButton: 'button:contains("Ver mais")',
            
            // Stories
            storyContainer: 'div[role="button"][tabindex="0"]',
            storyImage: 'img[draggable="false"]',
            storyVideo: 'video[playsinline]'
        };
    }

    /**
     * Inicia o processo de scraping do Instagram
     */
    async scrapeContent(options = {}) {
        const {
            contentTypes = ['reels', 'posts'],
            hashtags = [],
            users = [],
            maxItems = 100,
            minLikes = 1000
        } = options;

        try {
            await this.initialize();
            this.logger.info('Iniciando scraping do Instagram...');

            const results = {
                reels: [],
                posts: [],
                stories: [],
                totalCollected: 0,
                errors: []
            };

            // Scraping por tipo de conteúdo
            for (const contentType of contentTypes) {
                try {
                    switch (contentType) {
                        case 'reels':
                            const reels = await this.scrapeReels({ maxItems, minLikes });
                            results.reels = reels;
                            break;
                            
                        case 'posts':
                            const posts = await this.scrapePosts({ maxItems, minLikes });
                            results.posts = posts;
                            break;
                            
                        case 'stories':
                            const stories = await this.scrapeStories({ maxItems });
                            results.stories = stories;
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
                        results.posts.push(...hashtagContent);
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
                        results.posts.push(...userContent);
                    } catch (error) {
                        results.errors.push({
                            username,
                            error: error.message
                        });
                    }
                }
            }

            results.totalCollected = results.reels.length + results.posts.length + results.stories.length;
            
            // Salvar resultados
            await this.saveData(results, `instagram_scraping_${Date.now()}.json`);
            
            this.logger.info(`Scraping concluído. Total coletado: ${results.totalCollected} itens`);
            return results;

        } catch (error) {
            this.logger.error('Erro no scraping do Instagram:', error);
            throw error;
        } finally {
            await this.close();
        }
    }

    /**
     * Coleta Reels do Instagram
     */
    async scrapeReels(options = {}) {
        const { maxItems = 50, minLikes = 1000 } = options;
        
        try {
            this.logger.info('Coletando Reels do Instagram...');
            
            // Navegar para página de Reels
            await this.navigateToUrl(`${this.baseUrl}/reels/`);
            await delay(3000);

            const reels = [];
            let attempts = 0;
            const maxAttempts = Math.ceil(maxItems / 10);

            while (reels.length < maxItems && attempts < maxAttempts) {
                // Coletar Reels visíveis na página
                const pageReels = await this.extractReelsFromPage();
                
                for (const reel of pageReels) {
                    if (reel.metrics.likes >= minLikes && reels.length < maxItems) {
                        reels.push(reel);
                    }
                }

                // Rolar para carregar mais conteúdo
                await this.scrollPage({ scrolls: 2, delay: 3000 });
                attempts++;
                
                this.logger.info(`Coletados ${reels.length} reels até agora...`);
            }

            this.logger.info(`Total de reels coletados: ${reels.length}`);
            return reels;

        } catch (error) {
            this.logger.error('Erro ao coletar reels:', error);
            return [];
        }
    }

    /**
     * Extrai dados dos Reels da página atual
     */
    async extractReelsFromPage() {
        try {
            return await this.page.evaluate((selectors) => {
                const reels = [];
                const reelElements = document.querySelectorAll('article[role="presentation"]');

                reelElements.forEach((element, index) => {
                    try {
                        // Link do reel
                        const linkElement = element.querySelector('a[href*="/reel/"]');
                        if (!linkElement) return;
                        
                        const url = linkElement.href;
                        const reelId = url.match(/\/reel\/([^\/\?]+)/)?.[1];
                        
                        // Vídeo
                        const videoElement = element.querySelector('video');
                        const videoUrl = videoElement ? videoElement.src : null;
                        
                        // Autor
                        const authorElement = element.querySelector('a[role="link"] span');
                        const author = authorElement ? authorElement.textContent.trim() : 'unknown';
                        
                        // Caption/Descrição
                        const captionElement = element.querySelector('div[data-testid="post-caption"]') ||
                                             element.querySelector('span[dir="auto"]');
                        const caption = captionElement ? captionElement.textContent.trim() : '';
                        
                        // Métricas (aproximadas, Instagram não expõe diretamente)
                        const likesElement = element.querySelector('button[aria-label*="curtida"]') ||
                                           element.querySelector('span[title*="curtida"]');
                        const likesText = likesElement ? likesElement.textContent || likesElement.title : '0';
                        
                        const commentsElement = element.querySelector('button[aria-label*="comentário"]');
                        const commentsText = commentsElement ? commentsElement.textContent : '0';
                        
                        // Timestamp (se disponível)
                        const timeElement = element.querySelector('time');
                        const timestamp = timeElement ? timeElement.dateTime : new Date().toISOString();
                        
                        // Extrair hashtags e menções
                        const hashtags = caption.match(/#[\w\u00C0-\u017F]+/g) || [];
                        const mentions = caption.match(/@[\w\u00C0-\u017F]+/g) || [];
                        
                        const reel = {
                            id: reelId,
                            platform: 'instagram',
                            contentType: 'reel',
                            url: url,
                            videoUrl: videoUrl,
                            author: author,
                            caption: caption,
                            hashtags: hashtags.map(tag => tag.toLowerCase()),
                            mentions: mentions.map(mention => mention.toLowerCase()),
                            metrics: {
                                likes: this.extractNumber(likesText),
                                comments: this.extractNumber(commentsText),
                                shares: 0, // Instagram não expõe shares diretamente
                                views: 0   // Não disponível na página principal
                            },
                            timestamp: timestamp,
                            collectedAt: new Date().toISOString()
                        };
                        
                        reels.push(reel);
                        
                    } catch (error) {
                        console.warn('Erro ao extrair reel:', error);
                    }
                });

                return reels;
            }, this.selectors);

        } catch (error) {
            this.logger.error('Erro ao extrair reels da página:', error);
            return [];
        }
    }

    /**
     * Coleta posts regulares do Instagram
     */
    async scrapePosts(options = {}) {
        const { maxItems = 50, minLikes = 500 } = options;
        
        try {
            this.logger.info('Coletando posts do Instagram...');
            
            // Navegar para página de explorar
            await this.navigateToUrl(`${this.baseUrl}/explore/`);
            await delay(3000);

            const posts = [];
            let attempts = 0;
            const maxAttempts = Math.ceil(maxItems / 12);

            while (posts.length < maxItems && attempts < maxAttempts) {
                const pagePosts = await this.extractPostsFromPage();
                
                for (const post of pagePosts) {
                    if (post.metrics.likes >= minLikes && posts.length < maxItems) {
                        posts.push(post);
                    }
                }

                await this.scrollPage({ scrolls: 3, delay: 2000 });
                attempts++;
                
                this.logger.info(`Coletados ${posts.length} posts até agora...`);
            }

            this.logger.info(`Total de posts coletados: ${posts.length}`);
            return posts;

        } catch (error) {
            this.logger.error('Erro ao coletar posts:', error);
            return [];
        }
    }

    /**
     * Extrai dados dos posts da página atual
     */
    async extractPostsFromPage() {
        try {
            return await this.page.evaluate(() => {
                const posts = [];
                const postElements = document.querySelectorAll('article[role="presentation"]');

                postElements.forEach((element) => {
                    try {
                        // Link do post
                        const linkElement = element.querySelector('a[href*="/p/"]');
                        if (!linkElement) return;
                        
                        const url = linkElement.href;
                        const postId = url.match(/\/p\/([^\/\?]+)/)?.[1];
                        
                        // Imagem principal
                        const imageElement = element.querySelector('img[sizes]');
                        const imageUrl = imageElement ? imageElement.src : null;
                        
                        // Verificar se é carrossel
                        const carouselIndicator = element.querySelector('div[role="button"][aria-label*="slide"]');
                        const isCarousel = !!carouselIndicator;
                        
                        // Autor
                        const authorElement = element.querySelector('a[role="link"] span');
                        const author = authorElement ? authorElement.textContent.trim() : 'unknown';
                        
                        // Caption
                        const captionElement = element.querySelector('div[data-testid="post-caption"]') ||
                                             element.querySelector('span[dir="auto"]');
                        const caption = captionElement ? captionElement.textContent.trim() : '';
                        
                        // Métricas
                        const likesElement = element.querySelector('button[aria-label*="curtida"]');
                        const likesText = likesElement ? likesElement.textContent : '0';
                        
                        const commentsElement = element.querySelector('button[aria-label*="comentário"]');
                        const commentsText = commentsElement ? commentsElement.textContent : '0';
                        
                        // Timestamp
                        const timeElement = element.querySelector('time');
                        const timestamp = timeElement ? timeElement.dateTime : new Date().toISOString();
                        
                        const hashtags = caption.match(/#[\w\u00C0-\u017F]+/g) || [];
                        const mentions = caption.match(/@[\w\u00C0-\u017F]+/g) || [];
                        
                        const post = {
                            id: postId,
                            platform: 'instagram',
                            contentType: isCarousel ? 'carousel' : 'post',
                            url: url,
                            imageUrl: imageUrl,
                            author: author,
                            caption: caption,
                            hashtags: hashtags.map(tag => tag.toLowerCase()),
                            mentions: mentions.map(mention => mention.toLowerCase()),
                            metrics: {
                                likes: this.extractNumber(likesText),
                                comments: this.extractNumber(commentsText),
                                shares: 0,
                                views: 0
                            },
                            timestamp: timestamp,
                            collectedAt: new Date().toISOString()
                        };
                        
                        posts.push(post);
                        
                    } catch (error) {
                        console.warn('Erro ao extrair post:', error);
                    }
                });

                return posts;
            });

        } catch (error) {
            this.logger.error('Erro ao extrair posts da página:', error);
            return [];
        }
    }

    /**
     * Coleta stories (limitado, pois stories são efêmeros)
     */
    async scrapeStories(options = {}) {
        const { maxItems = 20 } = options;
        
        try {
            this.logger.info('Coletando stories do Instagram...');
            
            await this.navigateToUrl(this.baseUrl);
            await delay(3000);

            // Stories aparecem no topo da página inicial
            const stories = await this.page.evaluate(() => {
                const storyElements = document.querySelectorAll('div[role="button"][tabindex="0"]');
                const storiesData = [];

                storyElements.forEach((element, index) => {
                    if (index >= 20) return; // Limitar quantidade
                    
                    try {
                        const imageElement = element.querySelector('img');
                        const usernameElement = element.querySelector('span');
                        
                        if (imageElement && usernameElement) {
                            storiesData.push({
                                id: `story_${index}_${Date.now()}`,
                                platform: 'instagram',
                                contentType: 'story',
                                author: usernameElement.textContent.trim(),
                                thumbnailUrl: imageElement.src,
                                timestamp: new Date().toISOString(),
                                collectedAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.warn('Erro ao extrair story:', error);
                    }
                });

                return storiesData;
            });

            this.logger.info(`Total de stories coletados: ${stories.length}`);
            return stories.slice(0, maxItems);

        } catch (error) {
            this.logger.error('Erro ao coletar stories:', error);
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
            
            const hashtagUrl = `${this.baseUrl}/explore/tags/${hashtag}/`;
            await this.navigateToUrl(hashtagUrl);
            await delay(3000);

            const content = [];
            let scrollAttempts = 0;
            const maxScrolls = 3;

            while (content.length < maxItems && scrollAttempts < maxScrolls) {
                const pageContent = await this.extractPostsFromPage();
                content.push(...pageContent);
                
                await this.scrollPage({ scrolls: 2, delay: 2000 });
                scrollAttempts++;
            }

            return content.slice(0, maxItems);

        } catch (error) {
            this.logger.error(`Erro ao coletar hashtag ${hashtag}:`, error);
            return [];
        }
    }

    /**
     * Coleta conteúdo do perfil de um usuário
     */
    async scrapeUserProfile(username, options = {}) {
        const { maxItems = 20 } = options;
        
        try {
            this.logger.info(`Coletando perfil do usuário: @${username}`);
            
            const profileUrl = `${this.baseUrl}/${username}/`;
            await this.navigateToUrl(profileUrl);
            await delay(3000);

            const content = [];
            let scrollAttempts = 0;
            const maxScrolls = 2;

            while (content.length < maxItems && scrollAttempts < maxScrolls) {
                const pageContent = await this.extractPostsFromPage();
                content.push(...pageContent);
                
                await this.scrollPage({ scrolls: 2, delay: 2000 });
                scrollAttempts++;
            }

            return content.slice(0, maxItems);

        } catch (error) {
            this.logger.error(`Erro ao coletar perfil ${username}:`, error);
            return [];
        }
    }

    /**
     * Detecta se o conteúdo é um anúncio
     */
    async detectAds() {
        try {
            return await this.page.evaluate(() => {
                const ads = [];
                const sponsoredElements = document.querySelectorAll('[data-testid*="sponsored"]');
                
                sponsoredElements.forEach((element) => {
                    const postElement = element.closest('article');
                    if (postElement) {
                        const linkElement = postElement.querySelector('a[href*="/p/"]');
                        if (linkElement) {
                            ads.push({
                                id: `ad_${Date.now()}_${Math.random()}`,
                                platform: 'instagram',
                                contentType: 'ad',
                                url: linkElement.href,
                                isSponsored: true,
                                collectedAt: new Date().toISOString()
                            });
                        }
                    }
                });
                
                return ads;
            });
        } catch (error) {
            this.logger.error('Erro ao detectar anúncios:', error);
            return [];
        }
    }

    /**
     * Processa e valida dados coletados
     */
    processCollectedData(rawData) {
        const processedData = [];
        
        for (const item of rawData) {
            try {
                // Normalizar métricas
                item.metrics = normalizeEngagementMetrics(item.metrics);
                
                // Gerar ID único
                item.uniqueId = generateContentId(item);
                
                // Validar dados
                const validation = validateContent(item);
                if (validation.isValid) {
                    processedData.push(item);
                } else {
                    this.logger.warn('Item inválido ignorado:', validation.errors);
                }
                
            } catch (error) {
                this.logger.error('Erro ao processar item:', error);
            }
        }
        
        return processedData;
    }
}

module.exports = InstagramScraper;

