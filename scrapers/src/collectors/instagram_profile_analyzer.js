/**
 * ANALISADOR DE PERFIL INSTAGRAM
 * Especializado em extrair e analisar todos os conteúdos virais de perfis Instagram
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const BaseScraper = require('../base_scraper');
const InstagramScraper = require('../platforms/instagram_scraper');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class InstagramProfileAnalyzer extends BaseScraper {
    constructor(config) {
        super({
            ...config,
            scraperName: 'InstagramProfileAnalyzer',
            description: 'Análise completa de perfis Instagram com extração de padrões virais'
        });
        
        // Configurações específicas
        this.analyzerConfig = {
            maxPostsToAnalyze: 100, // Máximo de posts por perfil
            viralThreshold: {
                minLikes: 1000,
                minComments: 50,
                minEngagementRate: 3.0 // %
            },
            contentTypes: {
                reel: { priority: 10, weight: 0.4 },
                carousel: { priority: 8, weight: 0.3 },
                post: { priority: 6, weight: 0.2 },
                story: { priority: 4, weight: 0.1 }
            },
            analysisDepth: {
                basic: { posts: 20, analysis: 'metrics_only' },
                standard: { posts: 50, analysis: 'content_analysis' },
                deep: { posts: 100, analysis: 'full_ai_analysis' }
            },
            scrollConfig: {
                maxScrolls: 20,
                scrollDelay: 2000,
                loadTimeout: 5000
            }
        };
        
        // Estatísticas de análise
        this.analysisStats = {
            profilesAnalyzed: 0,
            totalPostsAnalyzed: 0,
            viralContentFound: 0,
            patternsExtracted: 0,
            averageAnalysisTime: 0,
            topPerformingContentTypes: {},
            commonViralPatterns: []
        };
        
        // Cache de perfis analisados
        this.profileCache = new Map();
        
        // Instanciar scraper do Instagram
        this.instagramScraper = new InstagramScraper(config);
    }
    
    async analyzeProfile(profileUrl, options = {}) {
        const startTime = Date.now();
        
        try {
            this.logger.info(`📱 Iniciando análise completa do perfil: ${profileUrl}`);
            
            // Normalizar URL do perfil
            const normalizedUrl = this.normalizeProfileUrl(profileUrl);
            const username = this.extractUsername(normalizedUrl);
            
            // Verificar cache se solicitado
            if (options.useCache && this.profileCache.has(username)) {
                this.logger.info(`💾 Usando dados em cache para @${username}`);
                return this.profileCache.get(username);
            }
            
            // Configurar profundidade de análise
            const analysisDepth = options.depth || 'standard';
            const config = this.analyzerConfig.analysisDepth[analysisDepth];
            
            // Executar análise completa
            const analysisResult = await this.performCompleteAnalysis(normalizedUrl, username, config, options);
            
            // Salvar em cache
            this.profileCache.set(username, analysisResult);
            
            // Atualizar estatísticas
            this.updateAnalysisStats(analysisResult, Date.now() - startTime);
            
            // Salvar resultado se solicitado
            if (options.saveResults) {
                await this.saveProfileAnalysis(username, analysisResult);
            }
            
            this.logger.info(`✅ Análise completa concluída para @${username} em ${Date.now() - startTime}ms`);
            return analysisResult;
            
        } catch (error) {
            this.logger.error(`❌ Erro na análise do perfil: ${error.message}`);
            throw error;
        }
    }
    
    async performCompleteAnalysis(profileUrl, username, config, options) {
        const browser = await puppeteer.launch({
            headless: false, // Visível para debugging
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        try {
            const page = await browser.newPage();
            
            // Configurar página
            await this.setupPage(page);
            
            // 1. Extrair informações básicas do perfil
            const profileInfo = await this.extractProfileInfo(page, profileUrl);
            
            // 2. Coletar todos os posts
            const allPosts = await this.collectAllPosts(page, config.posts, options);
            
            // 3. Identificar conteúdo viral
            const viralContent = this.identifyViralContent(allPosts, profileInfo);
            
            // 4. Analisar padrões de conteúdo
            const contentPatterns = await this.analyzeContentPatterns(viralContent, config.analysis);
            
            // 5. Extrair insights estratégicos
            const strategicInsights = await this.generateStrategicInsights(profileInfo, viralContent, contentPatterns);
            
            // 6. Gerar templates baseados no perfil
            const profileTemplates = await this.generateProfileTemplates(viralContent, contentPatterns);
            
            // 7. Compilar resultado final
            return {
                profile_info: profileInfo,
                content_analysis: {
                    total_posts: allPosts.length,
                    viral_posts: viralContent.length,
                    viral_rate: ((viralContent.length / allPosts.length) * 100).toFixed(2) + '%',
                    all_posts: allPosts,
                    viral_content: viralContent
                },
                patterns: contentPatterns,
                insights: strategicInsights,
                templates: profileTemplates,
                analysis_metadata: {
                    analyzed_at: new Date().toISOString(),
                    analysis_depth: config.analysis,
                    posts_analyzed: allPosts.length,
                    analyzer_version: this.scraperName
                }
            };
            
        } finally {
            await browser.close();
        }
    }
    
    async setupPage(page) {
        // Configurar user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Configurar viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Configurar timeouts
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(30000);
        
        // Interceptar requests para otimizar
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }
    
    async extractProfileInfo(page, profileUrl) {
        try {
            this.logger.info(`📊 Extraindo informações do perfil...`);
            
            await page.goto(profileUrl, { waitUntil: 'networkidle2' });
            
            // Aguardar carregamento do perfil
            await page.waitForSelector('header section', { timeout: 10000 });
            
            // Extrair dados básicos
            const profileData = await page.evaluate(() => {
                const getTextContent = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                };
                
                const getMetaContent = (property) => {
                    const meta = document.querySelector(`meta[property="${property}"]`);
                    return meta ? meta.getAttribute('content') : '';
                };
                
                // Extrair métricas do perfil
                const statsElements = document.querySelectorAll('header section ul li');
                const stats = {};
                
                statsElements.forEach(stat => {
                    const text = stat.textContent.trim();
                    if (text.includes('posts') || text.includes('publicações')) {
                        stats.posts = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                    } else if (text.includes('followers') || text.includes('seguidores')) {
                        stats.followers = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                    } else if (text.includes('following') || text.includes('seguindo')) {
                        stats.following = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                    }
                });
                
                return {
                    username: getTextContent('header section h2') || window.location.pathname.split('/')[1],
                    display_name: getTextContent('header section h1'),
                    bio: getTextContent('header section div[data-testid="user-bio"]') || getTextContent('header section div span'),
                    followers: stats.followers || 0,
                    following: stats.following || 0,
                    posts_count: stats.posts || 0,
                    is_verified: !!document.querySelector('header section svg[aria-label*="Verified"]'),
                    is_business: !!document.querySelector('header section button[aria-label*="Contact"]'),
                    profile_pic_url: document.querySelector('header img')?.src || '',
                    external_url: getTextContent('header section a[href^="http"]'),
                    category: getTextContent('header section div[data-testid="business-category"]')
                };
            });
            
            // Calcular métricas adicionais
            profileData.engagement_potential = this.calculateEngagementPotential(profileData);
            profileData.account_type = this.classifyAccountType(profileData);
            profileData.growth_indicators = this.analyzeGrowthIndicators(profileData);
            
            this.logger.info(`✅ Perfil @${profileData.username}: ${profileData.followers} seguidores, ${profileData.posts_count} posts`);
            
            return profileData;
            
        } catch (error) {
            this.logger.error(`❌ Erro ao extrair informações do perfil: ${error.message}`);
            throw error;
        }
    }
    
    async collectAllPosts(page, maxPosts, options) {
        try {
            this.logger.info(`📋 Coletando até ${maxPosts} posts...`);
            
            const posts = [];
            let scrollCount = 0;
            let lastPostCount = 0;
            let stagnantScrolls = 0;
            
            // Aguardar grid de posts
            await page.waitForSelector('article div div div div a', { timeout: 10000 });
            
            while (posts.length < maxPosts && scrollCount < this.analyzerConfig.scrollConfig.maxScrolls) {
                // Extrair posts visíveis
                const newPosts = await page.evaluate(() => {
                    const postElements = document.querySelectorAll('article div div div div a');
                    const postsData = [];
                    
                    postElements.forEach((postElement, index) => {
                        try {
                            const href = postElement.getAttribute('href');
                            if (!href) return;
                            
                            // Determinar tipo de conteúdo
                            let contentType = 'post';
                            const img = postElement.querySelector('img');
                            const videoIcon = postElement.querySelector('svg[aria-label*="Video"]') || 
                                            postElement.querySelector('svg[aria-label*="Reel"]');
                            const carouselIcon = postElement.querySelector('svg[aria-label*="Carousel"]') || 
                                              postElement.querySelector('svg[aria-label*="Album"]');
                            
                            if (videoIcon || href.includes('/reel/')) {
                                contentType = 'reel';
                            } else if (carouselIcon) {
                                contentType = 'carousel';
                            }
                            
                            postsData.push({
                                id: href.split('/')[2] || `post_${index}`,
                                url: `https://instagram.com${href}`,
                                content_type: contentType,
                                thumbnail_url: img ? img.src : '',
                                alt_text: img ? img.alt : '',
                                position_in_feed: index + 1
                            });
                            
                        } catch (error) {
                            console.warn('Erro ao processar post:', error);
                        }
                    });
                    
                    return postsData;
                });
                
                // Adicionar novos posts únicos
                newPosts.forEach(post => {
                    if (!posts.find(p => p.id === post.id)) {
                        posts.push(post);
                    }
                });
                
                this.logger.info(`📊 Coletados ${posts.length} posts até agora...`);
                
                // Verificar se houve progresso
                if (posts.length === lastPostCount) {
                    stagnantScrolls++;
                    if (stagnantScrolls >= 3) {
                        this.logger.info(`⏹️ Sem novos posts após 3 scrolls, finalizando coleta`);
                        break;
                    }
                } else {
                    stagnantScrolls = 0;
                }
                
                lastPostCount = posts.length;
                
                // Scroll para carregar mais posts
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });
                
                // Aguardar carregamento
                await page.waitForTimeout(this.analyzerConfig.scrollConfig.scrollDelay);
                scrollCount++;
            }
            
            // Enriquecer posts com dados detalhados se solicitado
            if (options.includeDetailedMetrics) {
                const detailedPosts = await this.enrichPostsWithMetrics(page, posts.slice(0, 20)); // Primeiros 20 para não sobrecarregar
                return detailedPosts;
            }
            
            this.logger.info(`✅ Coleta concluída: ${posts.length} posts encontrados`);
            return posts.slice(0, maxPosts);
            
        } catch (error) {
            this.logger.error(`❌ Erro na coleta de posts: ${error.message}`);
            throw error;
        }
    }
    
    async enrichPostsWithMetrics(page, posts) {
        const enrichedPosts = [];
        
        for (let i = 0; i < Math.min(posts.length, 10); i++) { // Limitar para não sobrecarregar
            const post = posts[i];
            
            try {
                this.logger.info(`🔍 Enriquecendo post ${i + 1}/${posts.length}...`);
                
                // Navegar para o post
                await page.goto(post.url, { waitUntil: 'networkidle2' });
                
                // Extrair métricas detalhadas
                const detailedData = await page.evaluate(() => {
                    const getTextContent = (selector) => {
                        const element = document.querySelector(selector);
                        return element ? element.textContent.trim() : '';
                    };
                    
                    // Extrair likes
                    const likesElement = document.querySelector('section div div button span') ||
                                       document.querySelector('span[data-testid="like-count"]');
                    const likesText = likesElement ? likesElement.textContent : '0';
                    const likes = parseInt(likesText.replace(/[^0-9]/g, '')) || 0;
                    
                    // Extrair comentários
                    const commentsElements = document.querySelectorAll('ul div[role="button"] span');
                    let comments = 0;
                    commentsElements.forEach(el => {
                        const text = el.textContent;
                        if (text.includes('comment') || text.includes('comentário')) {
                            comments = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                        }
                    });
                    
                    // Extrair caption
                    const captionElement = document.querySelector('article div div div div[data-testid="post-caption"] span') ||
                                         document.querySelector('article div div div h1');
                    const caption = captionElement ? captionElement.textContent : '';
                    
                    // Extrair hashtags
                    const hashtagElements = document.querySelectorAll('a[href*="/explore/tags/"]');
                    const hashtags = Array.from(hashtagElements).map(el => el.textContent);
                    
                    // Extrair data de publicação
                    const timeElement = document.querySelector('time');
                    const publishedAt = timeElement ? timeElement.getAttribute('datetime') : '';
                    
                    return {
                        likes,
                        comments,
                        caption,
                        hashtags,
                        published_at: publishedAt,
                        engagement_rate: 0 // Será calculado depois
                    };
                });
                
                // Combinar dados
                const enrichedPost = {
                    ...post,
                    ...detailedData,
                    metrics: {
                        likes: detailedData.likes,
                        comments: detailedData.comments,
                        engagement: detailedData.likes + detailedData.comments,
                        engagement_rate: 0 // Será calculado com dados do perfil
                    }
                };
                
                enrichedPosts.push(enrichedPost);
                
                // Delay entre posts
                await page.waitForTimeout(1000);
                
            } catch (error) {
                this.logger.warn(`⚠️ Erro ao enriquecer post ${post.id}: ${error.message}`);
                enrichedPosts.push(post); // Adicionar sem enriquecimento
            }
        }
        
        return enrichedPosts;
    }
    
    identifyViralContent(posts, profileInfo) {
        const viralPosts = [];
        const avgFollowers = profileInfo.followers || 1000;
        
        posts.forEach(post => {
            if (!post.metrics) return;
            
            const { likes, comments } = post.metrics;
            const engagement = likes + comments;
            const engagementRate = (engagement / avgFollowers) * 100;
            
            // Critérios de viralização
            const isViral = (
                likes >= this.analyzerConfig.viralThreshold.minLikes ||
                comments >= this.analyzerConfig.viralThreshold.minComments ||
                engagementRate >= this.analyzerConfig.viralThreshold.minEngagementRate
            );
            
            if (isViral) {
                viralPosts.push({
                    ...post,
                    viral_score: this.calculateViralScore(post, profileInfo),
                    viral_factors: this.identifyViralFactors(post, profileInfo),
                    engagement_rate: engagementRate
                });
            }
        });
        
        // Ordenar por viral score
        return viralPosts.sort((a, b) => b.viral_score - a.viral_score);
    }
    
    calculateViralScore(post, profileInfo) {
        if (!post.metrics) return 0;
        
        const { likes, comments } = post.metrics;
        const followers = profileInfo.followers || 1000;
        
        // Fórmula de viral score
        const engagementRate = ((likes + comments) / followers) * 100;
        const commentRatio = comments / (likes || 1);
        const contentTypeMultiplier = this.analyzerConfig.contentTypes[post.content_type]?.weight || 0.2;
        
        let score = engagementRate * 10;
        score += commentRatio * 50; // Comentários são mais valiosos
        score *= contentTypeMultiplier;
        
        return Math.min(Math.round(score), 100);
    }
    
    identifyViralFactors(post, profileInfo) {
        const factors = [];
        
        if (!post.metrics) return factors;
        
        const { likes, comments } = post.metrics;
        const engagementRate = ((likes + comments) / profileInfo.followers) * 100;
        
        if (engagementRate > 10) factors.push('high_engagement_rate');
        if (comments / (likes || 1) > 0.05) factors.push('high_comment_ratio');
        if (post.content_type === 'reel') factors.push('video_content');
        if (post.hashtags && post.hashtags.length > 5) factors.push('hashtag_strategy');
        if (post.caption && post.caption.length > 100) factors.push('detailed_caption');
        
        return factors;
    }
    
    async analyzeContentPatterns(viralContent, analysisType) {
        try {
            this.logger.info(`🔍 Analisando padrões de ${viralContent.length} conteúdos virais...`);
            
            const patterns = {
                content_type_distribution: this.analyzeContentTypeDistribution(viralContent),
                timing_patterns: this.analyzeTimingPatterns(viralContent),
                hashtag_patterns: this.analyzeHashtagPatterns(viralContent),
                caption_patterns: this.analyzeCaptionPatterns(viralContent),
                engagement_patterns: this.analyzeEngagementPatterns(viralContent),
                visual_patterns: await this.analyzeVisualPatterns(viralContent, analysisType)
            };
            
            // Gerar insights baseados nos padrões
            patterns.key_insights = this.generatePatternInsights(patterns);
            
            return patterns;
            
        } catch (error) {
            this.logger.error(`❌ Erro na análise de padrões: ${error.message}`);
            return { error: error.message };
        }
    }
    
    analyzeContentTypeDistribution(viralContent) {
        const distribution = {};
        const totalContent = viralContent.length;
        
        viralContent.forEach(content => {
            const type = content.content_type;
            distribution[type] = (distribution[type] || 0) + 1;
        });
        
        // Converter para percentuais
        Object.keys(distribution).forEach(type => {
            distribution[type] = {
                count: distribution[type],
                percentage: ((distribution[type] / totalContent) * 100).toFixed(1) + '%',
                avg_viral_score: viralContent
                    .filter(c => c.content_type === type)
                    .reduce((sum, c) => sum + c.viral_score, 0) / distribution[type].count
            };
        });
        
        return distribution;
    }
    
    analyzeTimingPatterns(viralContent) {
        const patterns = {
            best_days: {},
            best_hours: {},
            posting_frequency: {}
        };
        
        viralContent.forEach(content => {
            if (!content.published_at) return;
            
            const date = new Date(content.published_at);
            const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            const hour = date.getHours();
            
            // Análise por dia da semana
            patterns.best_days[dayOfWeek] = (patterns.best_days[dayOfWeek] || 0) + 1;
            
            // Análise por hora
            patterns.best_hours[hour] = (patterns.best_hours[hour] || 0) + 1;
        });
        
        return patterns;
    }
    
    analyzeHashtagPatterns(viralContent) {
        const hashtagFrequency = {};
        const hashtagCombinations = {};
        
        viralContent.forEach(content => {
            if (!content.hashtags) return;
            
            // Frequência individual
            content.hashtags.forEach(hashtag => {
                hashtagFrequency[hashtag] = (hashtagFrequency[hashtag] || 0) + 1;
            });
            
            // Combinações (primeiras 3 hashtags)
            const topHashtags = content.hashtags.slice(0, 3);
            if (topHashtags.length >= 2) {
                const combination = topHashtags.sort().join(' + ');
                hashtagCombinations[combination] = (hashtagCombinations[combination] || 0) + 1;
            }
        });
        
        return {
            most_used: Object.entries(hashtagFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20),
            best_combinations: Object.entries(hashtagCombinations)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10),
            avg_hashtags_per_post: viralContent.reduce((sum, c) => 
                sum + (c.hashtags ? c.hashtags.length : 0), 0) / viralContent.length
        };
    }
    
    analyzeCaptionPatterns(viralContent) {
        const patterns = {
            avg_length: 0,
            common_words: {},
            emotional_triggers: {},
            call_to_actions: {}
        };
        
        let totalLength = 0;
        const allWords = [];
        
        viralContent.forEach(content => {
            if (!content.caption) return;
            
            const caption = content.caption.toLowerCase();
            totalLength += caption.length;
            
            // Extrair palavras
            const words = caption.match(/\b\w+\b/g) || [];
            allWords.push(...words);
            
            // Identificar gatilhos emocionais
            const emotionalWords = ['incrível', 'surpreendente', 'chocante', 'emocionante', 'inspirador'];
            emotionalWords.forEach(word => {
                if (caption.includes(word)) {
                    patterns.emotional_triggers[word] = (patterns.emotional_triggers[word] || 0) + 1;
                }
            });
            
            // Identificar CTAs
            const ctas = ['comente', 'compartilhe', 'salve', 'marque', 'siga'];
            ctas.forEach(cta => {
                if (caption.includes(cta)) {
                    patterns.call_to_actions[cta] = (patterns.call_to_actions[cta] || 0) + 1;
                }
            });
        });
        
        // Calcular médias e frequências
        patterns.avg_length = Math.round(totalLength / viralContent.length);
        
        // Palavras mais comuns (excluindo stop words)
        const stopWords = ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'numa', 'pelos', 'pelas', 'esse', 'eles', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'pelas', 'foi', 'contra', 'desde', 'sobre', 'entre', 'durante', 'antes', 'através', 'segundo', 'onde'];
        
        const wordFrequency = {};
        allWords.forEach(word => {
            if (word.length > 3 && !stopWords.includes(word)) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });
        
        patterns.common_words = Object.entries(wordFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20);
        
        return patterns;
    }
    
    analyzeEngagementPatterns(viralContent) {
        const patterns = {
            avg_engagement_rate: 0,
            engagement_distribution: {},
            like_to_comment_ratio: 0,
            top_performers: []
        };
        
        let totalEngagementRate = 0;
        let totalLikes = 0;
        let totalComments = 0;
        
        viralContent.forEach(content => {
            if (!content.metrics) return;
            
            totalEngagementRate += content.engagement_rate || 0;
            totalLikes += content.metrics.likes || 0;
            totalComments += content.metrics.comments || 0;
            
            // Distribuição de engajamento
            const engagementRange = this.getEngagementRange(content.engagement_rate || 0);
            patterns.engagement_distribution[engagementRange] = 
                (patterns.engagement_distribution[engagementRange] || 0) + 1;
        });
        
        patterns.avg_engagement_rate = (totalEngagementRate / viralContent.length).toFixed(2) + '%';
        patterns.like_to_comment_ratio = (totalLikes / (totalComments || 1)).toFixed(2);
        
        // Top performers
        patterns.top_performers = viralContent
            .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
            .slice(0, 5)
            .map(content => ({
                id: content.id,
                content_type: content.content_type,
                engagement_rate: content.engagement_rate,
                viral_score: content.viral_score
            }));
        
        return patterns;
    }
    
    getEngagementRange(rate) {
        if (rate < 2) return '0-2%';
        if (rate < 5) return '2-5%';
        if (rate < 10) return '5-10%';
        if (rate < 20) return '10-20%';
        return '20%+';
    }
    
    async analyzeVisualPatterns(viralContent, analysisType) {
        if (analysisType !== 'full_ai_analysis') {
            return { note: 'Análise visual disponível apenas no modo deep analysis' };
        }
        
        // Implementar análise visual com IA (placeholder)
        return {
            dominant_colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
            visual_styles: ['minimal', 'colorful', 'professional'],
            composition_patterns: ['center_focused', 'rule_of_thirds'],
            note: 'Análise visual completa requer integração com agentes de IA'
        };
    }
    
    generatePatternInsights(patterns) {
        const insights = [];
        
        // Insights de tipo de conteúdo
        const topContentType = Object.entries(patterns.content_type_distribution)
            .sort(([,a], [,b]) => b.count - a.count)[0];
        
        if (topContentType) {
            insights.push({
                type: 'content_strategy',
                insight: `${topContentType[0]} é o tipo de conteúdo mais viral (${topContentType[1].percentage})`,
                action: `Foque em criar mais ${topContentType[0]}s para maximizar engajamento`
            });
        }
        
        // Insights de hashtags
        if (patterns.hashtag_patterns.most_used.length > 0) {
            const topHashtag = patterns.hashtag_patterns.most_used[0];
            insights.push({
                type: 'hashtag_strategy',
                insight: `"${topHashtag[0]}" é a hashtag mais eficaz (usada ${topHashtag[1]} vezes)`,
                action: `Continue usando esta hashtag em conteúdos similares`
            });
        }
        
        // Insights de engajamento
        const avgEngagement = parseFloat(patterns.engagement_patterns.avg_engagement_rate);
        if (avgEngagement > 5) {
            insights.push({
                type: 'performance',
                insight: `Taxa de engajamento viral excepcional: ${patterns.engagement_patterns.avg_engagement_rate}`,
                action: 'Mantenha a estratégia atual e replique padrões de sucesso'
            });
        }
        
        return insights;
    }
    
    async generateStrategicInsights(profileInfo, viralContent, patterns) {
        return {
            profile_strengths: this.identifyProfileStrengths(profileInfo, viralContent),
            growth_opportunities: this.identifyGrowthOpportunities(patterns),
            content_recommendations: this.generateContentRecommendations(patterns),
            optimization_suggestions: this.generateOptimizationSuggestions(profileInfo, patterns),
            competitive_advantages: this.identifyCompetitiveAdvantages(profileInfo, viralContent),
            risk_factors: this.identifyRiskFactors(patterns)
        };
    }
    
    identifyProfileStrengths(profileInfo, viralContent) {
        const strengths = [];
        
        if (profileInfo.is_verified) strengths.push('Perfil verificado aumenta credibilidade');
        if (profileInfo.followers > 100000) strengths.push('Grande base de seguidores');
        if (viralContent.length > 10) strengths.push('Histórico consistente de conteúdo viral');
        
        const avgViralScore = viralContent.reduce((sum, c) => sum + c.viral_score, 0) / viralContent.length;
        if (avgViralScore > 70) strengths.push('Alto potencial viral médio');
        
        return strengths;
    }
    
    identifyGrowthOpportunities(patterns) {
        const opportunities = [];
        
        // Análise de tipos de conteúdo
        const contentTypes = Object.keys(patterns.content_type_distribution);
        if (!contentTypes.includes('reel')) {
            opportunities.push('Explorar Reels para maior alcance');
        }
        
        // Análise de timing
        if (Object.keys(patterns.timing_patterns.best_hours).length < 3) {
            opportunities.push('Testar diferentes horários de publicação');
        }
        
        // Análise de hashtags
        if (patterns.hashtag_patterns.avg_hashtags_per_post < 5) {
            opportunities.push('Usar mais hashtags estratégicas');
        }
        
        return opportunities;
    }
    
    generateContentRecommendations(patterns) {
        const recommendations = [];
        
        // Baseado no tipo de conteúdo mais viral
        const topContentType = Object.entries(patterns.content_type_distribution)
            .sort(([,a], [,b]) => b.avg_viral_score - a.avg_viral_score)[0];
        
        if (topContentType) {
            recommendations.push({
                priority: 'high',
                type: 'content_type',
                recommendation: `Criar mais ${topContentType[0]}s`,
                reason: `Tipo com maior viral score médio: ${topContentType[1].avg_viral_score.toFixed(1)}`
            });
        }
        
        // Baseado em hashtags
        if (patterns.hashtag_patterns.most_used.length > 0) {
            const topHashtags = patterns.hashtag_patterns.most_used.slice(0, 5);
            recommendations.push({
                priority: 'medium',
                type: 'hashtags',
                recommendation: `Usar hashtags comprovadas: ${topHashtags.map(h => h[0]).join(', ')}`,
                reason: 'Hashtags com histórico de sucesso no perfil'
            });
        }
        
        return recommendations;
    }
    
    generateOptimizationSuggestions(profileInfo, patterns) {
        const suggestions = [];
        
        // Otimizações de perfil
        if (!profileInfo.bio || profileInfo.bio.length < 50) {
            suggestions.push('Otimizar bio com descrição mais detalhada');
        }
        
        if (!profileInfo.external_url) {
            suggestions.push('Adicionar link externo para direcionamento de tráfego');
        }
        
        // Otimizações de conteúdo
        const avgCaptionLength = patterns.caption_patterns.avg_length;
        if (avgCaptionLength < 100) {
            suggestions.push('Criar captions mais detalhadas para maior engajamento');
        }
        
        return suggestions;
    }
    
    identifyCompetitiveAdvantages(profileInfo, viralContent) {
        const advantages = [];
        
        const viralRate = (viralContent.length / profileInfo.posts_count) * 100;
        if (viralRate > 20) {
            advantages.push(`Alta taxa de viralização: ${viralRate.toFixed(1)}%`);
        }
        
        const avgViralScore = viralContent.reduce((sum, c) => sum + c.viral_score, 0) / viralContent.length;
        if (avgViralScore > 75) {
            advantages.push('Conteúdo consistentemente viral');
        }
        
        return advantages;
    }
    
    identifyRiskFactors(patterns) {
        const risks = [];
        
        // Dependência de um tipo de conteúdo
        const contentTypes = Object.keys(patterns.content_type_distribution);
        if (contentTypes.length === 1) {
            risks.push('Dependência excessiva de um tipo de conteúdo');
        }
        
        // Baixa diversidade de hashtags
        if (patterns.hashtag_patterns.most_used.length < 10) {
            risks.push('Baixa diversidade de hashtags');
        }
        
        return risks;
    }
    
    async generateProfileTemplates(viralContent, patterns) {
        // Gerar templates baseados nos padrões identificados
        const templates = [];
        
        // Template baseado no tipo de conteúdo mais viral
        const topContentType = Object.entries(patterns.content_type_distribution)
            .sort(([,a], [,b]) => b.avg_viral_score - a.avg_viral_score)[0];
        
        if (topContentType) {
            templates.push({
                template_id: `profile_${topContentType[0]}_template`,
                template_name: `Template ${topContentType[0]} Viral`,
                based_on_profile: true,
                content_type: topContentType[0],
                viral_score: topContentType[1].avg_viral_score,
                hashtag_strategy: patterns.hashtag_patterns.most_used.slice(0, 10),
                caption_length: patterns.caption_patterns.avg_length,
                best_posting_times: Object.entries(patterns.timing_patterns.best_hours)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([hour]) => `${hour}:00`)
            });
        }
        
        return templates;
    }
    
    // Métodos auxiliares
    normalizeProfileUrl(url) {
        try {
            const parsedUrl = new URL(url);
            let hostname = parsedUrl.hostname.toLowerCase();
            
            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }
            if (hostname === 'm.instagram.com') {
                hostname = 'instagram.com';
            }
            
            const pathname = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
            return `https://${hostname}${pathname}`;
            
        } catch (error) {
            throw new Error(`URL de perfil inválida: ${url}`);
        }
    }
    
    extractUsername(profileUrl) {
        try {
            const parsedUrl = new URL(profileUrl);
            const pathParts = parsedUrl.pathname.split('/').filter(part => part);
            return pathParts[0] || '';
        } catch (error) {
            throw new Error('Não foi possível extrair username da URL');
        }
    }
    
    calculateEngagementPotential(profileData) {
        let potential = 50; // Base
        
        if (profileData.followers > 100000) potential += 20;
        else if (profileData.followers > 10000) potential += 10;
        
        if (profileData.is_verified) potential += 15;
        if (profileData.is_business) potential += 10;
        
        const followingRatio = profileData.following / (profileData.followers || 1);
        if (followingRatio < 0.1) potential += 10; // Baixo following ratio é bom
        
        return Math.min(potential, 100);
    }
    
    classifyAccountType(profileData) {
        if (profileData.followers > 1000000) return 'mega_influencer';
        if (profileData.followers > 100000) return 'macro_influencer';
        if (profileData.followers > 10000) return 'micro_influencer';
        if (profileData.followers > 1000) return 'nano_influencer';
        return 'regular_user';
    }
    
    analyzeGrowthIndicators(profileData) {
        const indicators = [];
        
        const postsPerFollower = profileData.posts_count / (profileData.followers || 1);
        if (postsPerFollower < 0.01) indicators.push('high_follower_to_post_ratio');
        
        if (profileData.is_verified && profileData.followers < 100000) {
            indicators.push('verified_with_growth_potential');
        }
        
        return indicators;
    }
    
    async saveProfileAnalysis(username, analysisResult) {
        try {
            const analysisDir = '/home/ubuntu/viral_content_scraper/storage/profile_analyses';
            await fs.mkdir(analysisDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${username}_analysis_${timestamp}.json`;
            const filepath = path.join(analysisDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(analysisResult, null, 2));
            
            this.logger.info(`💾 Análise do perfil @${username} salva: ${filepath}`);
            
        } catch (error) {
            this.logger.error(`❌ Erro ao salvar análise: ${error.message}`);
        }
    }
    
    updateAnalysisStats(analysisResult, processingTime) {
        this.analysisStats.profilesAnalyzed++;
        this.analysisStats.totalPostsAnalyzed += analysisResult.content_analysis.total_posts;
        this.analysisStats.viralContentFound += analysisResult.content_analysis.viral_posts;
        this.analysisStats.patternsExtracted += Object.keys(analysisResult.patterns).length;
        this.analysisStats.averageAnalysisTime = 
            (this.analysisStats.averageAnalysisTime + processingTime) / 2;
        
        // Atualizar tipos de conteúdo top
        Object.entries(analysisResult.patterns.content_type_distribution || {}).forEach(([type, data]) => {
            this.analysisStats.topPerformingContentTypes[type] = 
                (this.analysisStats.topPerformingContentTypes[type] || 0) + data.count;
        });
    }
    
    getAnalysisStats() {
        return {
            ...this.analysisStats,
            profiles_in_cache: this.profileCache.size,
            analyzer_name: this.scraperName,
            last_updated: new Date().toISOString()
        };
    }
}

module.exports = InstagramProfileAnalyzer;

