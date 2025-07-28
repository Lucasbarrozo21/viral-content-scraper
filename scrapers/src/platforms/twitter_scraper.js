const BaseScraper = require('../base_scraper');
const { extractMetrics, generateUniqueId, sanitizeText, detectLanguage } = require('../utils/helpers');

class TwitterScraper extends BaseScraper {
    constructor(options = {}) {
        super({
            ...options,
            platform: 'twitter',
            baseUrl: 'https://twitter.com',
            rateLimit: {
                requestsPerMinute: 30,
                requestsPerHour: 600
            }
        });
        
        this.selectors = {
            // Timeline tweets
            tweets: '[data-testid="tweet"]',
            tweetText: '[data-testid="tweetText"]',
            tweetAuthor: '[data-testid="User-Name"] a',
            authorHandle: '[data-testid="User-Name"] span:last-child',
            authorAvatar: '[data-testid="Tweet-User-Avatar"] img',
            tweetTime: 'time',
            tweetLink: '[data-testid="tweet"] a[href*="/status/"]',
            
            // Media
            tweetImage: '[data-testid="tweetPhoto"] img',
            tweetVideo: '[data-testid="videoPlayer"] video',
            tweetGif: '[data-testid="tweetGif"]',
            quoteTweet: '[data-testid="quoteTweet"]',
            
            // Engagement metrics
            replyCount: '[data-testid="reply"]',
            retweetCount: '[data-testid="retweet"]',
            likeCount: '[data-testid="like"]',
            viewCount: '[data-testid="views"]',
            bookmarkCount: '[data-testid="bookmark"]',
            
            // Thread indicators
            threadIndicator: '[data-testid="threadIndicator"]',
            showThread: '[data-testid="showThread"]',
            
            // Trending
            trendingTopics: '[data-testid="trend"]',
            trendName: '[data-testid="trendName"]',
            trendVolume: '[data-testid="trendVolume"]',
            
            // Search results
            searchResults: '[data-testid="primaryColumn"] [data-testid="tweet"]',
            searchFilters: '[data-testid="searchFilters"]',
            
            // Profile
            profileName: '[data-testid="UserName"]',
            profileHandle: '[data-testid="UserScreenName"]',
            profileBio: '[data-testid="UserDescription"]',
            profileFollowers: '[data-testid="UserFollowers"]',
            profileFollowing: '[data-testid="UserFollowing"]',
            profileTweets: '[data-testid="UserTweets"]',
            
            // Spaces
            spaces: '[data-testid="spaces"]',
            spaceTitle: '[data-testid="spaceTitle"]',
            spaceListeners: '[data-testid="spaceListeners"]',
            
            // Lists
            lists: '[data-testid="list"]',
            listName: '[data-testid="listName"]',
            listMembers: '[data-testid="listMembers"]'
        };
        
        this.tweetTypes = {
            ORIGINAL: 'original',
            REPLY: 'reply',
            RETWEET: 'retweet',
            QUOTE_TWEET: 'quote_tweet',
            THREAD: 'thread'
        };
        
        this.contentCategories = {
            NEWS: 'news',
            ENTERTAINMENT: 'entertainment',
            SPORTS: 'sports',
            TECHNOLOGY: 'technology',
            POLITICS: 'politics',
            BUSINESS: 'business',
            LIFESTYLE: 'lifestyle',
            MEME: 'meme',
            EDUCATIONAL: 'educational',
            PERSONAL: 'personal'
        };
    }

    async scrapeTrending(options = {}) {
        const {
            location = 'Worldwide',
            maxTweets = 50,
            minEngagement = 100
        } = options;

        try {
            this.logger.info('Iniciando scraping de trending topics Twitter');
            
            // Navegar para explore/trending
            await this.page.goto(`${this.baseUrl}/explore/tabs/trending`, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento
            await this.page.waitForSelector(this.selectors.trendingTopics, { timeout: 15000 });
            
            // Coletar trending topics
            const trendingTopics = await this.page.evaluate((selectors) => {
                const trendElements = document.querySelectorAll(selectors.trendingTopics);
                const results = [];
                
                trendElements.forEach((element, index) => {
                    try {
                        const nameElement = element.querySelector(selectors.trendName);
                        const volumeElement = element.querySelector(selectors.trendVolume);
                        
                        if (!nameElement) return;
                        
                        const name = nameElement.textContent?.trim();
                        const volume = volumeElement?.textContent?.trim();
                        
                        results.push({
                            name,
                            volume: this.parseVolumeCount(volume),
                            volumeText: volume,
                            position: index + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar trending topic:', error);
                    }
                });
                
                return results;
            }, this.selectors);
            
            // Para cada trending topic, coletar tweets
            const trendingWithTweets = [];
            
            for (const trend of trendingTopics.slice(0, 10)) { // Limitar aos top 10
                try {
                    const tweets = await this.searchTweets(trend.name, {
                        maxResults: 5,
                        minEngagement
                    });
                    
                    trendingWithTweets.push({
                        ...trend,
                        tweets: tweets.data?.tweets || []
                    });
                    
                } catch (error) {
                    this.logger.warn(`Erro ao coletar tweets para trending "${trend.name}":`, error.message);
                    trendingWithTweets.push(trend);
                }
                
                await this.randomDelay(2000, 4000);
            }
            
            this.logger.info(`Coletados ${trendingWithTweets.length} trending topics`);
            
            return {
                success: true,
                data: {
                    location,
                    totalTrends: trendingWithTweets.length,
                    trends: trendingWithTweets,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping de trending topics:', error);
            throw error;
        }
    }

    async scrapeTimeline(options = {}) {
        const {
            timelineType = 'home', // home, latest, following
            maxTweets = 50,
            minEngagement = 10,
            includeReplies = false
        } = options;

        try {
            this.logger.info(`Iniciando scraping da timeline ${timelineType}`);
            
            // Navegar para timeline específica
            let timelineUrl = `${this.baseUrl}/home`;
            if (timelineType === 'latest') {
                timelineUrl = `${this.baseUrl}/home?f=live`;
            }
            
            await this.page.goto(timelineUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento dos tweets
            await this.page.waitForSelector(this.selectors.tweets, { timeout: 15000 });
            
            // Scroll para carregar mais tweets
            await this.autoScroll(10);
            
            const tweets = await this.page.evaluate((selectors, tweetTypes, minEngagement, includeReplies) => {
                const tweetElements = document.querySelectorAll(selectors.tweets);
                const results = [];
                
                tweetElements.forEach((element, index) => {
                    try {
                        // Verificar se é um tweet válido
                        const textElement = element.querySelector(selectors.tweetText);
                        const authorElement = element.querySelector(selectors.tweetAuthor);
                        const handleElement = element.querySelector(selectors.authorHandle);
                        const timeElement = element.querySelector(selectors.tweetTime);
                        const linkElement = element.querySelector(selectors.tweetLink);
                        
                        if (!authorElement || !timeElement) return;
                        
                        const text = textElement?.textContent?.trim() || '';
                        const author = authorElement.textContent?.trim();
                        const handle = handleElement?.textContent?.trim().replace('@', '');
                        const authorUrl = authorElement.href;
                        const tweetTime = timeElement.getAttribute('datetime');
                        const tweetUrl = linkElement?.href;
                        const tweetId = tweetUrl?.match(/status\/(\d+)/)?.[1];
                        
                        if (!tweetId) return;
                        
                        // Determinar tipo de tweet
                        let tweetType = tweetTypes.ORIGINAL;
                        const isReply = element.querySelector('[data-testid="reply-indicator"]');
                        const isRetweet = element.querySelector('[data-testid="socialContext"]')?.textContent?.includes('retweeted');
                        const isQuoteTweet = element.querySelector(selectors.quoteTweet);
                        const isThread = element.querySelector(selectors.threadIndicator);
                        
                        if (isReply) tweetType = tweetTypes.REPLY;
                        else if (isRetweet) tweetType = tweetTypes.RETWEET;
                        else if (isQuoteTweet) tweetType = tweetTypes.QUOTE_TWEET;
                        else if (isThread) tweetType = tweetTypes.THREAD;
                        
                        // Pular replies se não solicitado
                        if (!includeReplies && tweetType === tweetTypes.REPLY) return;
                        
                        // Métricas de engajamento
                        const replyElement = element.querySelector(selectors.replyCount);
                        const retweetElement = element.querySelector(selectors.retweetCount);
                        const likeElement = element.querySelector(selectors.likeCount);
                        const viewElement = element.querySelector(selectors.viewCount);
                        
                        const replies = this.parseEngagementCount(replyElement?.textContent?.trim() || '0');
                        const retweets = this.parseEngagementCount(retweetElement?.textContent?.trim() || '0');
                        const likes = this.parseEngagementCount(likeElement?.textContent?.trim() || '0');
                        const views = this.parseEngagementCount(viewElement?.textContent?.trim() || '0');
                        
                        const totalEngagement = replies + retweets + likes;
                        
                        // Filtrar por engajamento mínimo
                        if (totalEngagement < minEngagement) return;
                        
                        // Extrair hashtags e menções
                        const hashtags = this.extractHashtags(text);
                        const mentions = this.extractMentions(text);
                        
                        // Mídia anexada
                        const media = [];
                        const images = element.querySelectorAll(selectors.tweetImage);
                        const videos = element.querySelectorAll(selectors.tweetVideo);
                        const gifs = element.querySelectorAll(selectors.tweetGif);
                        
                        images.forEach(img => {
                            media.push({
                                type: 'image',
                                url: img.src,
                                alt: img.alt
                            });
                        });
                        
                        videos.forEach(video => {
                            media.push({
                                type: 'video',
                                url: video.src,
                                poster: video.poster
                            });
                        });
                        
                        gifs.forEach(gif => {
                            const gifUrl = gif.querySelector('img')?.src;
                            if (gifUrl) {
                                media.push({
                                    type: 'gif',
                                    url: gifUrl
                                });
                            }
                        });
                        
                        // Quote tweet se existir
                        let quotedTweet = null;
                        const quoteTweetElement = element.querySelector(selectors.quoteTweet);
                        if (quoteTweetElement) {
                            const quotedTextElement = quoteTweetElement.querySelector(selectors.tweetText);
                            const quotedAuthorElement = quoteTweetElement.querySelector(selectors.tweetAuthor);
                            
                            quotedTweet = {
                                text: quotedTextElement?.textContent?.trim(),
                                author: quotedAuthorElement?.textContent?.trim()
                            };
                        }
                        
                        results.push({
                            id: tweetId,
                            text,
                            tweetType,
                            author: {
                                name: author,
                                handle: handle,
                                profileUrl: authorUrl
                            },
                            metrics: {
                                replies,
                                retweets,
                                likes,
                                views,
                                totalEngagement
                            },
                            hashtags,
                            mentions,
                            media,
                            quotedTweet,
                            tweetTime,
                            tweetUrl,
                            position: index + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar tweet:', error);
                    }
                });
                
                return results;
            }, this.selectors, this.tweetTypes, minEngagement, includeReplies);
            
            // Limitar quantidade
            const limitedTweets = tweets.slice(0, maxTweets);
            
            // Categorizar tweets
            limitedTweets.forEach(tweet => {
                tweet.category = this.categorizeTweet(tweet);
                tweet.viralScore = this.calculateViralScore(tweet);
                tweet.sentiment = this.analyzeSentiment(tweet.text);
            });
            
            this.logger.info(`Coletados ${limitedTweets.length} tweets da timeline`);
            
            return {
                success: true,
                data: {
                    timelineType,
                    totalTweets: limitedTweets.length,
                    tweets: limitedTweets,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping da timeline:', error);
            throw error;
        }
    }

    async searchTweets(query, options = {}) {
        const {
            resultType = 'mixed', // mixed, recent, popular
            maxResults = 20,
            minEngagement = 5,
            dateFilter = null // today, week, month
        } = options;

        try {
            this.logger.info(`Buscando tweets: "${query}"`);
            
            let searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
            
            // Adicionar filtros
            if (resultType === 'recent') {
                searchUrl += '&f=live';
            } else if (resultType === 'popular') {
                searchUrl += '&f=top';
            }
            
            await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar resultados
            await this.page.waitForSelector(this.selectors.searchResults, { timeout: 10000 });
            
            // Aplicar filtro de data se necessário
            if (dateFilter) {
                await this.applyDateFilter(dateFilter);
            }
            
            // Scroll para carregar mais resultados
            await this.autoScroll(5);
            
            const searchResults = await this.page.evaluate((selectors, tweetTypes, maxResults, minEngagement) => {
                const tweetElements = document.querySelectorAll(selectors.searchResults);
                const results = [];
                
                for (let i = 0; i < Math.min(tweetElements.length, maxResults); i++) {
                    const element = tweetElements[i];
                    
                    try {
                        const textElement = element.querySelector(selectors.tweetText);
                        const authorElement = element.querySelector(selectors.tweetAuthor);
                        const handleElement = element.querySelector(selectors.authorHandle);
                        const timeElement = element.querySelector(selectors.tweetTime);
                        const linkElement = element.querySelector(selectors.tweetLink);
                        
                        if (!authorElement || !timeElement) continue;
                        
                        const text = textElement?.textContent?.trim() || '';
                        const author = authorElement.textContent?.trim();
                        const handle = handleElement?.textContent?.trim().replace('@', '');
                        const tweetTime = timeElement.getAttribute('datetime');
                        const tweetUrl = linkElement?.href;
                        const tweetId = tweetUrl?.match(/status\/(\d+)/)?.[1];
                        
                        if (!tweetId) continue;
                        
                        // Métricas de engajamento
                        const replyElement = element.querySelector(selectors.replyCount);
                        const retweetElement = element.querySelector(selectors.retweetCount);
                        const likeElement = element.querySelector(selectors.likeCount);
                        
                        const replies = this.parseEngagementCount(replyElement?.textContent?.trim() || '0');
                        const retweets = this.parseEngagementCount(retweetElement?.textContent?.trim() || '0');
                        const likes = this.parseEngagementCount(likeElement?.textContent?.trim() || '0');
                        
                        const totalEngagement = replies + retweets + likes;
                        
                        if (totalEngagement < minEngagement) continue;
                        
                        results.push({
                            id: tweetId,
                            text,
                            author: {
                                name: author,
                                handle: handle
                            },
                            metrics: {
                                replies,
                                retweets,
                                likes,
                                totalEngagement
                            },
                            hashtags: this.extractHashtags(text),
                            mentions: this.extractMentions(text),
                            tweetTime,
                            tweetUrl,
                            position: i + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar resultado de busca:', error);
                    }
                }
                
                return results;
            }, this.selectors, this.tweetTypes, maxResults, minEngagement);
            
            // Categorizar tweets
            searchResults.forEach(tweet => {
                tweet.category = this.categorizeTweet(tweet);
                tweet.viralScore = this.calculateViralScore(tweet);
                tweet.sentiment = this.analyzeSentiment(tweet.text);
            });
            
            this.logger.info(`Encontrados ${searchResults.length} tweets para "${query}"`);
            
            return {
                success: true,
                data: {
                    query,
                    resultType,
                    totalTweets: searchResults.length,
                    tweets: searchResults,
                    searchedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro na busca de tweets:', error);
            throw error;
        }
    }

    async scrapeThread(tweetUrl, options = {}) {
        const { maxTweets = 20 } = options;

        try {
            this.logger.info(`Coletando thread: ${tweetUrl}`);
            
            await this.page.goto(tweetUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento do tweet principal
            await this.page.waitForSelector(this.selectors.tweets, { timeout: 10000 });
            
            // Clicar em "Show this thread" se disponível
            const showThreadButton = await this.page.$(this.selectors.showThread);
            if (showThreadButton) {
                await showThreadButton.click();
                await this.page.waitForTimeout(2000);
            }
            
            const threadTweets = await this.page.evaluate((selectors, maxTweets) => {
                const tweetElements = document.querySelectorAll(selectors.tweets);
                const results = [];
                
                for (let i = 0; i < Math.min(tweetElements.length, maxTweets); i++) {
                    const element = tweetElements[i];
                    
                    try {
                        const textElement = element.querySelector(selectors.tweetText);
                        const authorElement = element.querySelector(selectors.tweetAuthor);
                        const timeElement = element.querySelector(selectors.tweetTime);
                        const linkElement = element.querySelector(selectors.tweetLink);
                        
                        if (!textElement || !authorElement) continue;
                        
                        const text = textElement.textContent?.trim();
                        const author = authorElement.textContent?.trim();
                        const tweetTime = timeElement?.getAttribute('datetime');
                        const tweetUrl = linkElement?.href;
                        const tweetId = tweetUrl?.match(/status\/(\d+)/)?.[1];
                        
                        if (!tweetId) continue;
                        
                        // Métricas de engajamento
                        const replyElement = element.querySelector(selectors.replyCount);
                        const retweetElement = element.querySelector(selectors.retweetCount);
                        const likeElement = element.querySelector(selectors.likeCount);
                        
                        const replies = this.parseEngagementCount(replyElement?.textContent?.trim() || '0');
                        const retweets = this.parseEngagementCount(retweetElement?.textContent?.trim() || '0');
                        const likes = this.parseEngagementCount(likeElement?.textContent?.trim() || '0');
                        
                        results.push({
                            id: tweetId,
                            text,
                            author: author,
                            metrics: {
                                replies,
                                retweets,
                                likes,
                                totalEngagement: replies + retweets + likes
                            },
                            tweetTime,
                            tweetUrl,
                            threadPosition: i + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar tweet da thread:', error);
                    }
                }
                
                return results;
            }, this.selectors, maxTweets);
            
            this.logger.info(`Coletados ${threadTweets.length} tweets da thread`);
            
            return {
                success: true,
                data: {
                    originalTweetUrl: tweetUrl,
                    totalTweets: threadTweets.length,
                    tweets: threadTweets,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping da thread:', error);
            throw error;
        }
    }

    async scrapeProfile(profileUrl, options = {}) {
        const {
            maxTweets = 20,
            includeReplies = false,
            includeRetweets = true
        } = options;

        try {
            this.logger.info(`Coletando perfil: ${profileUrl}`);
            
            await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento do perfil
            await this.page.waitForSelector(this.selectors.profileName, { timeout: 10000 });
            
            // Coletar informações do perfil
            const profileInfo = await this.page.evaluate((selectors) => {
                const nameElement = document.querySelector(selectors.profileName);
                const handleElement = document.querySelector(selectors.profileHandle);
                const bioElement = document.querySelector(selectors.profileBio);
                const followersElement = document.querySelector(selectors.profileFollowers);
                const followingElement = document.querySelector(selectors.profileFollowing);
                const tweetsElement = document.querySelector(selectors.profileTweets);
                
                return {
                    name: nameElement?.textContent?.trim(),
                    handle: handleElement?.textContent?.trim().replace('@', ''),
                    bio: bioElement?.textContent?.trim(),
                    followers: this.parseEngagementCount(followersElement?.textContent?.trim() || '0'),
                    following: this.parseEngagementCount(followingElement?.textContent?.trim() || '0'),
                    totalTweets: this.parseEngagementCount(tweetsElement?.textContent?.trim() || '0'),
                    url: window.location.href
                };
            }, this.selectors);
            
            // Scroll para carregar tweets do perfil
            await this.autoScroll(5);
            
            // Coletar tweets do perfil
            const profileTweets = await this.page.evaluate((selectors, maxTweets, includeReplies, includeRetweets) => {
                const tweetElements = document.querySelectorAll(selectors.tweets);
                const results = [];
                
                for (let i = 0; i < Math.min(tweetElements.length, maxTweets); i++) {
                    const element = tweetElements[i];
                    
                    try {
                        const textElement = element.querySelector(selectors.tweetText);
                        const timeElement = element.querySelector(selectors.tweetTime);
                        const linkElement = element.querySelector(selectors.tweetLink);
                        
                        if (!textElement || !timeElement) continue;
                        
                        const text = textElement.textContent?.trim();
                        const tweetTime = timeElement.getAttribute('datetime');
                        const tweetUrl = linkElement?.href;
                        const tweetId = tweetUrl?.match(/status\/(\d+)/)?.[1];
                        
                        if (!tweetId) continue;
                        
                        // Verificar tipo de tweet
                        const isReply = element.querySelector('[data-testid="reply-indicator"]');
                        const isRetweet = element.querySelector('[data-testid="socialContext"]')?.textContent?.includes('retweeted');
                        
                        if (!includeReplies && isReply) continue;
                        if (!includeRetweets && isRetweet) continue;
                        
                        // Métricas de engajamento
                        const replyElement = element.querySelector(selectors.replyCount);
                        const retweetElement = element.querySelector(selectors.retweetCount);
                        const likeElement = element.querySelector(selectors.likeCount);
                        
                        const replies = this.parseEngagementCount(replyElement?.textContent?.trim() || '0');
                        const retweets = this.parseEngagementCount(retweetElement?.textContent?.trim() || '0');
                        const likes = this.parseEngagementCount(likeElement?.textContent?.trim() || '0');
                        
                        results.push({
                            id: tweetId,
                            text,
                            metrics: {
                                replies,
                                retweets,
                                likes,
                                totalEngagement: replies + retweets + likes
                            },
                            hashtags: this.extractHashtags(text),
                            mentions: this.extractMentions(text),
                            tweetTime,
                            tweetUrl,
                            isReply: !!isReply,
                            isRetweet: !!isRetweet,
                            position: i + 1,
                            scrapedAt: new Date().toISOString()
                        });
                        
                    } catch (error) {
                        console.error('Erro ao processar tweet do perfil:', error);
                    }
                }
                
                return results;
            }, this.selectors, maxTweets, includeReplies, includeRetweets);
            
            // Categorizar tweets
            profileTweets.forEach(tweet => {
                tweet.category = this.categorizeTweet(tweet);
                tweet.viralScore = this.calculateViralScore(tweet);
                tweet.sentiment = this.analyzeSentiment(tweet.text);
            });
            
            this.logger.info(`Coletados dados do perfil ${profileInfo.handle} com ${profileTweets.length} tweets`);
            
            return {
                success: true,
                data: {
                    profile: profileInfo,
                    totalTweets: profileTweets.length,
                    tweets: profileTweets,
                    scrapedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no scraping do perfil:', error);
            throw error;
        }
    }

    async applyDateFilter(dateFilter) {
        try {
            // Clicar no botão de filtros
            await this.page.click('[data-testid="searchFilters"]');
            await this.page.waitForSelector('[data-testid="dateFilter"]', { timeout: 5000 });
            
            // Selecionar filtro de data
            const dateOptions = {
                'today': 'Past 24 hours',
                'week': 'Past week',
                'month': 'Past month'
            };
            
            if (dateOptions[dateFilter]) {
                await this.page.click(`[data-testid="dateFilter"] [title="${dateOptions[dateFilter]}"]`);
                await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            }
            
        } catch (error) {
            this.logger.warn('Erro ao aplicar filtro de data:', error.message);
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

    parseVolumeCount(volumeText) {
        if (!volumeText) return 0;
        
        // Extrair número de strings como "123K Tweets"
        const match = volumeText.match(/(\d+(?:\.\d+)?)\s*([KMB]?)/i);
        if (!match) return 0;
        
        const number = parseFloat(match[1]);
        const multiplier = match[2].toLowerCase();
        
        if (multiplier === 'k') return Math.floor(number * 1000);
        if (multiplier === 'm') return Math.floor(number * 1000000);
        if (multiplier === 'b') return Math.floor(number * 1000000000);
        
        return Math.floor(number);
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

    categorizeTweet(tweet) {
        const text = tweet.text.toLowerCase();
        
        // Análise de palavras-chave para categorização
        if (text.includes('breaking') || text.includes('news') || text.includes('report')) {
            return this.contentCategories.NEWS;
        }
        
        if (text.includes('lol') || text.includes('funny') || text.includes('meme') || text.includes('😂')) {
            return this.contentCategories.MEME;
        }
        
        if (text.includes('learn') || text.includes('tip') || text.includes('how to') || text.includes('tutorial')) {
            return this.contentCategories.EDUCATIONAL;
        }
        
        if (text.includes('tech') || text.includes('ai') || text.includes('software') || text.includes('code')) {
            return this.contentCategories.TECHNOLOGY;
        }
        
        if (text.includes('sport') || text.includes('game') || text.includes('match') || text.includes('team')) {
            return this.contentCategories.SPORTS;
        }
        
        if (text.includes('business') || text.includes('market') || text.includes('stock') || text.includes('economy')) {
            return this.contentCategories.BUSINESS;
        }
        
        if (text.includes('politics') || text.includes('election') || text.includes('government') || text.includes('policy')) {
            return this.contentCategories.POLITICS;
        }
        
        if (text.includes('movie') || text.includes('music') || text.includes('show') || text.includes('celebrity')) {
            return this.contentCategories.ENTERTAINMENT;
        }
        
        if (text.includes('lifestyle') || text.includes('fashion') || text.includes('food') || text.includes('travel')) {
            return this.contentCategories.LIFESTYLE;
        }
        
        return this.contentCategories.PERSONAL;
    }

    analyzeSentiment(text) {
        // Análise básica de sentimento
        const positiveWords = ['good', 'great', 'amazing', 'awesome', 'love', 'happy', 'excellent', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'horrible', 'disgusting'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    calculateViralScore(tweet) {
        const { metrics } = tweet;
        const { replies = 0, retweets = 0, likes = 0, views = 0 } = metrics;
        
        // Pesos diferentes para cada tipo de engajamento no Twitter
        const replyWeight = 2;
        const retweetWeight = 3; // Retweets têm mais peso
        const likeWeight = 1;
        const viewWeight = 0.01; // Views têm peso muito baixo
        
        const weightedScore = (replies * replyWeight) + (retweets * retweetWeight) + 
                             (likes * likeWeight) + (views * viewWeight);
        
        // Normalizar para escala 0-100
        const maxPossibleScore = 100000; // Assumindo valores máximos para Twitter
        const normalizedScore = Math.min((weightedScore / maxPossibleScore) * 100, 100);
        
        return Math.round(normalizedScore);
    }

    async autoScroll(maxScrolls = 5) {
        for (let i = 0; i < maxScrolls; i++) {
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            await this.randomDelay(2000, 4000);
            
            // Verificar se há mais conteúdo
            const hasMore = await this.page.evaluate(() => {
                const loadingSpinner = document.querySelector('[data-testid="spinner"]');
                return loadingSpinner && loadingSpinner.style.display !== 'none';
            });
            
            if (!hasMore) break;
        }
    }

    async generateReport(scrapingResults) {
        const report = {
            platform: 'Twitter/X',
            timestamp: new Date().toISOString(),
            summary: {
                totalTweets: 0,
                totalEngagement: 0,
                avgEngagementPerTweet: 0,
                topCategories: [],
                topHashtags: [],
                viralContent: [],
                sentimentDistribution: {}
            },
            insights: [],
            recommendations: []
        };

        // Processar resultados
        const allTweets = [
            ...(scrapingResults.tweets || []),
            ...(scrapingResults.trends?.flatMap(t => t.tweets || []) || [])
        ];

        if (allTweets.length > 0) {
            report.summary.totalTweets = allTweets.length;
            report.summary.totalEngagement = allTweets.reduce(
                (sum, t) => sum + (t.metrics?.totalEngagement || 0), 0
            );
            report.summary.avgEngagementPerTweet = Math.round(
                report.summary.totalEngagement / report.summary.totalTweets
            );
            
            // Top categorias
            const categories = {};
            allTweets.forEach(tweet => {
                if (tweet.category) {
                    categories[tweet.category] = (categories[tweet.category] || 0) + 1;
                }
            });
            
            report.summary.topCategories = Object.entries(categories)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => ({ category, count }));
            
            // Top hashtags
            const hashtagCount = {};
            allTweets.forEach(tweet => {
                tweet.hashtags?.forEach(hashtag => {
                    hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
                });
            });
            
            report.summary.topHashtags = Object.entries(hashtagCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([hashtag, count]) => ({ hashtag, count }));
            
            // Conteúdo viral (top 20% por engajement)
            const sortedByEngagement = allTweets
                .sort((a, b) => (b.metrics?.totalEngagement || 0) - (a.metrics?.totalEngagement || 0));
            const viralThreshold = Math.ceil(sortedByEngagement.length * 0.2);
            report.summary.viralContent = sortedByEngagement.slice(0, viralThreshold);
            
            // Distribuição de sentimento
            const sentiments = {};
            allTweets.forEach(tweet => {
                if (tweet.sentiment) {
                    sentiments[tweet.sentiment] = (sentiments[tweet.sentiment] || 0) + 1;
                }
            });
            report.summary.sentimentDistribution = sentiments;
        }

        // Gerar insights
        report.insights = this.generateInsights(allTweets);
        report.recommendations = this.generateRecommendations(allTweets);

        return report;
    }

    generateInsights(tweets) {
        const insights = [];
        
        if (tweets.length === 0) return insights;
        
        // Análise de tipos de tweet
        const typeCount = {};
        tweets.forEach(tweet => {
            if (tweet.tweetType) {
                typeCount[tweet.tweetType] = (typeCount[tweet.tweetType] || 0) + 1;
            }
        });
        
        const mostPopularType = Object.entries(typeCount)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostPopularType) {
            insights.push({
                type: 'tweet_type',
                title: 'Tipo de Tweet Dominante',
                description: `${mostPopularType[0]} representa ${Math.round((mostPopularType[1] / tweets.length) * 100)}% dos tweets coletados.`
            });
        }
        
        // Análise de sentimento
        const sentiments = {};
        tweets.forEach(tweet => {
            if (tweet.sentiment) {
                sentiments[tweet.sentiment] = (sentiments[tweet.sentiment] || 0) + 1;
            }
        });
        
        const dominantSentiment = Object.entries(sentiments)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (dominantSentiment) {
            insights.push({
                type: 'sentiment',
                title: 'Sentimento Dominante',
                description: `${Math.round((dominantSentiment[1] / tweets.length) * 100)}% dos tweets têm sentimento ${dominantSentiment[0]}.`
            });
        }
        
        // Análise de engajamento
        const avgEngagement = tweets.reduce((sum, t) => sum + (t.metrics?.totalEngagement || 0), 0) / tweets.length;
        insights.push({
            type: 'engagement',
            title: 'Métricas de Engajamento',
            description: `Média de ${Math.round(avgEngagement)} interações por tweet.`
        });
        
        return insights;
    }

    generateRecommendations(tweets) {
        const recommendations = [];
        
        if (tweets.length === 0) return recommendations;
        
        // Recomendação baseada em hashtags
        const hashtagUsage = tweets.filter(t => t.hashtags && t.hashtags.length > 0).length;
        const hashtagPercentage = (hashtagUsage / tweets.length) * 100;
        
        if (hashtagPercentage > 60) {
            recommendations.push({
                priority: 'high',
                category: 'hashtags',
                title: 'Continue Usando Hashtags',
                description: `${Math.round(hashtagPercentage)}% dos tweets virais usam hashtags. Mantenha esta prática.`,
                impact: 'medium'
            });
        } else {
            recommendations.push({
                priority: 'medium',
                category: 'hashtags',
                title: 'Use Mais Hashtags',
                description: `Apenas ${Math.round(hashtagPercentage)}% dos tweets usam hashtags. Aumente para melhor alcance.`,
                impact: 'medium'
            });
        }
        
        // Recomendação baseada em timing
        recommendations.push({
            priority: 'medium',
            category: 'timing',
            title: 'Otimize Horários de Publicação',
            description: 'Analise os horários dos tweets com maior engajamento para otimizar sua estratégia.',
            impact: 'medium'
        });
        
        // Recomendação baseada em threads
        const threads = tweets.filter(t => t.tweetType === 'thread');
        if (threads.length > tweets.length * 0.2) {
            recommendations.push({
                priority: 'high',
                category: 'content_format',
                title: 'Invista em Threads',
                description: 'Threads representam uma parcela significativa do conteúdo viral. Explore este formato.',
                impact: 'high'
            });
        }
        
        return recommendations;
    }
}

module.exports = TwitterScraper;

