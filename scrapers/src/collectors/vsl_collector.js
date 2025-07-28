/**
 * VSL COLLECTOR - COLETOR DE VIDEO SALES LETTERS
 * Especializado em detectar, coletar e analisar VSLs escaladas e em alta conversão
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const BaseScraper = require('../base_scraper');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class VSLCollector extends BaseScraper {
    constructor(config) {
        super({
            ...config,
            scraperName: 'VSLCollector',
            description: 'Especialista em detectar e analisar Video Sales Letters escaladas'
        });
        
        // Configurações específicas para VSLs
        this.vslConfig = {
            // Indicadores de VSL escalada
            scalingIndicators: {
                minViews: 10000,
                minEngagement: 500,
                minDuration: 300, // 5 minutos
                maxDuration: 3600, // 60 minutos
                conversionSignals: [
                    'compre agora',
                    'oferta limitada',
                    'últimas vagas',
                    'desconto especial',
                    'garantia',
                    'método exclusivo',
                    'transformação',
                    'resultado garantido'
                ]
            },
            
            // Plataformas onde VSLs são comuns
            vslPlatforms: {
                'youtube.com': {
                    selectors: {
                        video: 'video',
                        title: 'h1.ytd-video-primary-info-renderer',
                        views: '#info-text span',
                        likes: '#segmented-like-button button',
                        description: '#description-text'
                    },
                    patterns: [
                        '/watch?v=',
                        'youtube.com/embed/',
                        'youtu.be/'
                    ]
                },
                'vimeo.com': {
                    selectors: {
                        video: 'video',
                        title: '.player_title',
                        views: '.stats_plays',
                        likes: '.stats_likes'
                    },
                    patterns: [
                        'vimeo.com/',
                        'player.vimeo.com/'
                    ]
                },
                'facebook.com': {
                    selectors: {
                        video: 'video',
                        title: '[data-testid="post_message"]',
                        engagement: '[aria-label*="reação"]'
                    },
                    patterns: [
                        'facebook.com/watch',
                        'fb.watch/'
                    ]
                },
                'instagram.com': {
                    selectors: {
                        video: 'video',
                        caption: 'div[data-testid="caption"]',
                        likes: 'button[aria-label*="curtida"]'
                    },
                    patterns: [
                        'instagram.com/reel/',
                        'instagram.com/tv/'
                    ]
                }
            },
            
            // Estrutura típica de VSL
            vslStructure: {
                hook: {
                    duration: 30, // primeiros 30 segundos
                    keywords: [
                        'descobri',
                        'segredo',
                        'método',
                        'sistema',
                        'estratégia',
                        'revelação',
                        'transformação'
                    ]
                },
                story: {
                    duration: 300, // 5 minutos
                    keywords: [
                        'história',
                        'jornada',
                        'problema',
                        'solução',
                        'antes',
                        'depois',
                        'resultado'
                    ]
                },
                proof: {
                    duration: 180, // 3 minutos
                    keywords: [
                        'prova',
                        'resultado',
                        'depoimento',
                        'caso',
                        'exemplo',
                        'evidência'
                    ]
                },
                offer: {
                    duration: 120, // 2 minutos
                    keywords: [
                        'oferta',
                        'produto',
                        'curso',
                        'mentoria',
                        'programa',
                        'sistema'
                    ]
                },
                urgency: {
                    duration: 60, // 1 minuto
                    keywords: [
                        'limitado',
                        'urgente',
                        'últimas',
                        'vagas',
                        'desconto',
                        'promoção'
                    ]
                },
                cta: {
                    duration: 30, // últimos 30 segundos
                    keywords: [
                        'clique',
                        'acesse',
                        'compre',
                        'adquira',
                        'garanta',
                        'inscreva'
                    ]
                }
            },
            
            // Configurações de transcrição
            transcriptionConfig: {
                enabled: true,
                language: 'pt-BR',
                maxDuration: 3600,
                chunkSize: 300, // 5 minutos por chunk
                confidence: 0.8
            }
        };
        
        // Estatísticas de coleta de VSLs
        this.vslStats = {
            totalVSLsFound: 0,
            scaledVSLsIdentified: 0,
            transcriptionsCompleted: 0,
            averageConversionScore: 0,
            topPerformingNiches: {},
            conversionPatterns: {},
            structureAnalysis: {}
        };
    }

    /**
     * Detecta VSLs escaladas em múltiplas plataformas
     */
    async detectScaledVSLs(searchTerms = [], platforms = []) {
        this.logger.info(`🎬 Iniciando detecção de VSLs escaladas...`);
        
        const defaultSearchTerms = [
            'como ganhar dinheiro',
            'método exclusivo',
            'transformação',
            'resultado garantido',
            'sistema comprovado',
            'estratégia secreta',
            'fórmula do sucesso',
            'método revolucionário'
        ];
        
        const searchQueries = searchTerms.length > 0 ? searchTerms : defaultSearchTerms;
        const targetPlatforms = platforms.length > 0 ? platforms : Object.keys(this.vslConfig.vslPlatforms);
        
        const detectedVSLs = [];
        
        for (const platform of targetPlatforms) {
            for (const query of searchQueries) {
                try {
                    const platformVSLs = await this.searchVSLsOnPlatform(platform, query);
                    detectedVSLs.push(...platformVSLs);
                    
                    // Delay entre buscas
                    await this.delay(3000, 7000);
                } catch (error) {
                    this.logger.error(`Erro ao buscar VSLs em ${platform}: ${error.message}`);
                }
            }
        }
        
        // Filtrar apenas VSLs com sinais de escala
        const scaledVSLs = await this.filterScaledVSLs(detectedVSLs);
        
        this.vslStats.totalVSLsFound += detectedVSLs.length;
        this.vslStats.scaledVSLsIdentified += scaledVSLs.length;
        
        this.logger.info(`✅ Detectadas ${scaledVSLs.length} VSLs escaladas de ${detectedVSLs.length} encontradas`);
        
        return scaledVSLs;
    }

    /**
     * Busca VSLs em uma plataforma específica
     */
    async searchVSLsOnPlatform(platform, query) {
        const page = await this.getPage();
        const platformConfig = this.vslConfig.vslPlatforms[platform];
        
        if (!platformConfig) {
            throw new Error(`Plataforma ${platform} não suportada`);
        }
        
        const vsls = [];
        
        try {
            // Construir URL de busca baseada na plataforma
            let searchUrl;
            switch (platform) {
                case 'youtube.com':
                    searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                    break;
                case 'vimeo.com':
                    searchUrl = `https://vimeo.com/search?q=${encodeURIComponent(query)}`;
                    break;
                case 'facebook.com':
                    searchUrl = `https://www.facebook.com/watch/search/?q=${encodeURIComponent(query)}`;
                    break;
                default:
                    throw new Error(`URL de busca não configurada para ${platform}`);
            }
            
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });
            await this.delay(2000, 4000);
            
            // Extrair vídeos da página de resultados
            const videoElements = await page.$$(this.getVideoSelector(platform));
            
            for (let i = 0; i < Math.min(videoElements.length, 20); i++) {
                try {
                    const vslData = await this.extractVSLData(page, videoElements[i], platform);
                    if (vslData && this.isLikelyVSL(vslData)) {
                        vsls.push(vslData);
                    }
                } catch (error) {
                    this.logger.warn(`Erro ao extrair dados de VSL: ${error.message}`);
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro na busca de VSLs em ${platform}: ${error.message}`);
        }
        
        return vsls;
    }

    /**
     * Extrai dados detalhados de uma VSL
     */
    async extractVSLData(page, videoElement, platform) {
        const platformConfig = this.vslConfig.vslPlatforms[platform];
        
        try {
            // Extrair informações básicas
            const title = await this.extractText(page, videoElement, platformConfig.selectors.title);
            const url = await this.extractVideoUrl(page, videoElement, platform);
            const views = await this.extractViews(page, videoElement, platform);
            const duration = await this.extractDuration(page, videoElement, platform);
            
            // Dados básicos da VSL
            const vslData = {
                id: this.generateVSLId(url),
                platform,
                url,
                title: title || 'Título não encontrado',
                views: views || 0,
                duration: duration || 0,
                extractedAt: new Date().toISOString(),
                
                // Métricas de engajamento
                engagement: {
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    saves: 0
                },
                
                // Análise de conteúdo
                content: {
                    description: '',
                    transcript: '',
                    keywords: [],
                    hashtags: [],
                    mentions: []
                },
                
                // Análise de VSL
                vslAnalysis: {
                    isVSL: false,
                    conversionScore: 0,
                    scalingIndicators: [],
                    structure: {},
                    persuasionTechniques: [],
                    emotionalTriggers: []
                },
                
                // Dados do criador
                creator: {
                    name: '',
                    followers: 0,
                    verified: false,
                    niche: ''
                }
            };
            
            // Extrair métricas de engajamento específicas da plataforma
            await this.extractEngagementMetrics(page, videoElement, vslData, platform);
            
            // Extrair informações do criador
            await this.extractCreatorInfo(page, videoElement, vslData, platform);
            
            return vslData;
            
        } catch (error) {
            this.logger.error(`Erro ao extrair dados de VSL: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica se um vídeo tem características de VSL
     */
    isLikelyVSL(vslData) {
        const { title, duration, views } = vslData;
        let vslScore = 0;
        const indicators = [];
        
        // Verificar duração (VSLs geralmente são mais longas)
        if (duration >= 300 && duration <= 3600) { // 5-60 minutos
            vslScore += 30;
            indicators.push('duration_optimal');
        }
        
        // Verificar palavras-chave no título
        const titleLower = title.toLowerCase();
        const conversionKeywords = this.vslConfig.scalingIndicators.conversionSignals;
        
        for (const keyword of conversionKeywords) {
            if (titleLower.includes(keyword)) {
                vslScore += 10;
                indicators.push(`keyword_${keyword}`);
            }
        }
        
        // Verificar métricas de engajamento
        if (views >= this.vslConfig.scalingIndicators.minViews) {
            vslScore += 20;
            indicators.push('high_views');
        }
        
        // Verificar padrões de título típicos de VSL
        const vslPatterns = [
            /como\s+(ganhar|fazer|conseguir)/i,
            /método\s+(secreto|exclusivo|comprovado)/i,
            /sistema\s+(revolucionário|inovador)/i,
            /descobri\s+o\s+segredo/i,
            /transformação\s+completa/i,
            /resultado\s+garantido/i
        ];
        
        for (const pattern of vslPatterns) {
            if (pattern.test(title)) {
                vslScore += 15;
                indicators.push('vsl_pattern');
                break;
            }
        }
        
        // Atualizar dados da VSL
        vslData.vslAnalysis.isVSL = vslScore >= 50;
        vslData.vslAnalysis.conversionScore = vslScore;
        vslData.vslAnalysis.scalingIndicators = indicators;
        
        return vslScore >= 50;
    }

    /**
     * Filtra VSLs com sinais de escala
     */
    async filterScaledVSLs(vsls) {
        const scaledVSLs = [];
        
        for (const vsl of vsls) {
            if (this.hasScalingSignals(vsl)) {
                // Análise mais profunda para VSLs escaladas
                await this.performDeepVSLAnalysis(vsl);
                scaledVSLs.push(vsl);
            }
        }
        
        return scaledVSLs;
    }

    /**
     * Verifica sinais de escala em uma VSL
     */
    hasScalingSignals(vsl) {
        const { views, engagement, vslAnalysis } = vsl;
        
        // Critérios de escala
        const scalingCriteria = {
            minViews: this.vslConfig.scalingIndicators.minViews,
            minEngagement: this.vslConfig.scalingIndicators.minEngagement,
            minConversionScore: 60
        };
        
        const totalEngagement = engagement.likes + engagement.comments + engagement.shares;
        
        return (
            views >= scalingCriteria.minViews &&
            totalEngagement >= scalingCriteria.minEngagement &&
            vslAnalysis.conversionScore >= scalingCriteria.minConversionScore
        );
    }

    /**
     * Realiza análise profunda de uma VSL escalada
     */
    async performDeepVSLAnalysis(vsl) {
        this.logger.info(`🔍 Realizando análise profunda da VSL: ${vsl.title}`);
        
        try {
            // 1. Transcrever áudio da VSL
            if (this.vslConfig.transcriptionConfig.enabled) {
                vsl.content.transcript = await this.transcribeVSL(vsl.url);
            }
            
            // 2. Analisar estrutura da VSL
            vsl.vslAnalysis.structure = await this.analyzeVSLStructure(vsl.content.transcript);
            
            // 3. Identificar técnicas de persuasão
            vsl.vslAnalysis.persuasionTechniques = await this.identifyPersuasionTechniques(vsl.content.transcript);
            
            // 4. Detectar gatilhos emocionais
            vsl.vslAnalysis.emotionalTriggers = await this.detectEmotionalTriggers(vsl.content.transcript);
            
            // 5. Extrair copy persuasiva
            vsl.content.persuasiveCopy = await this.extractPersuasiveCopy(vsl.content.transcript);
            
            // 6. Analisar timing e ritmo
            vsl.vslAnalysis.timing = await this.analyzeVSLTiming(vsl.content.transcript, vsl.duration);
            
            this.vslStats.transcriptionsCompleted++;
            
        } catch (error) {
            this.logger.error(`Erro na análise profunda da VSL: ${error.message}`);
        }
    }

    /**
     * Transcreve áudio de uma VSL
     */
    async transcribeVSL(vslUrl) {
        // Implementação de transcrição
        // Pode usar APIs como OpenAI Whisper, Google Speech-to-Text, etc.
        
        try {
            this.logger.info(`🎤 Transcrevendo VSL: ${vslUrl}`);
            
            // Simulação de transcrição (implementar com API real)
            const mockTranscript = `
            Olá, meu nome é [Nome] e eu descobri um método revolucionário que mudou completamente a minha vida.
            
            Há alguns anos atrás, eu estava completamente perdido, sem dinheiro, sem perspectiva...
            
            Até que um dia, eu descobri este sistema simples que me permitiu ganhar mais de R$ 10.000 por mês trabalhando apenas 2 horas por dia.
            
            E hoje, eu vou compartilhar com você exatamente como eu fiz isso.
            
            Mas antes, deixe-me te contar a minha história...
            
            [Continua com a estrutura típica de VSL]
            
            Se você chegou até aqui, é porque você realmente quer mudar de vida.
            
            E eu tenho uma oferta especial para você...
            
            Clique no botão abaixo agora mesmo e garante a sua vaga.
            `;
            
            return mockTranscript.trim();
            
        } catch (error) {
            this.logger.error(`Erro na transcrição: ${error.message}`);
            return '';
        }
    }

    /**
     * Analisa a estrutura de uma VSL baseada na transcrição
     */
    async analyzeVSLStructure(transcript) {
        if (!transcript) return {};
        
        const structure = {
            hook: { present: false, strength: 0, content: '' },
            story: { present: false, strength: 0, content: '' },
            proof: { present: false, strength: 0, content: '' },
            offer: { present: false, strength: 0, content: '' },
            urgency: { present: false, strength: 0, content: '' },
            cta: { present: false, strength: 0, content: '' }
        };
        
        const transcriptLower = transcript.toLowerCase();
        
        // Analisar cada seção da estrutura
        for (const [section, config] of Object.entries(this.vslConfig.vslStructure)) {
            const keywords = config.keywords;
            let matches = 0;
            let sectionContent = '';
            
            for (const keyword of keywords) {
                if (transcriptLower.includes(keyword)) {
                    matches++;
                    // Extrair contexto ao redor da palavra-chave
                    const index = transcriptLower.indexOf(keyword);
                    const start = Math.max(0, index - 100);
                    const end = Math.min(transcript.length, index + 100);
                    sectionContent += transcript.substring(start, end) + '... ';
                }
            }
            
            structure[section] = {
                present: matches > 0,
                strength: Math.min(100, (matches / keywords.length) * 100),
                content: sectionContent.trim(),
                keywordMatches: matches
            };
        }
        
        return structure;
    }

    /**
     * Identifica técnicas de persuasão na VSL
     */
    async identifyPersuasionTechniques(transcript) {
        if (!transcript) return [];
        
        const techniques = [];
        const transcriptLower = transcript.toLowerCase();
        
        const persuasionPatterns = {
            'social_proof': [
                'milhares de pessoas',
                'centenas de clientes',
                'depoimentos',
                'casos de sucesso',
                'outros já conseguiram'
            ],
            'scarcity': [
                'últimas vagas',
                'oferta limitada',
                'apenas hoje',
                'por tempo limitado',
                'restam poucas'
            ],
            'authority': [
                'especialista',
                'anos de experiência',
                'reconhecido',
                'premiado',
                'referência'
            ],
            'reciprocity': [
                'de graça',
                'bônus exclusivo',
                'presente',
                'sem custo',
                'ofereço gratuitamente'
            ],
            'commitment': [
                'garanto',
                'prometo',
                'comprometo',
                'asseguro',
                'certifico'
            ],
            'loss_aversion': [
                'não perca',
                'última chance',
                'pode ser tarde',
                'oportunidade única',
                'nunca mais'
            ]
        };
        
        for (const [technique, patterns] of Object.entries(persuasionPatterns)) {
            let matches = 0;
            const examples = [];
            
            for (const pattern of patterns) {
                if (transcriptLower.includes(pattern)) {
                    matches++;
                    examples.push(pattern);
                }
            }
            
            if (matches > 0) {
                techniques.push({
                    technique,
                    strength: Math.min(100, (matches / patterns.length) * 100),
                    matches,
                    examples
                });
            }
        }
        
        return techniques;
    }

    /**
     * Detecta gatilhos emocionais na VSL
     */
    async detectEmotionalTriggers(transcript) {
        if (!transcript) return [];
        
        const triggers = [];
        const transcriptLower = transcript.toLowerCase();
        
        const emotionalTriggers = {
            'fear': [
                'medo',
                'preocupação',
                'ansiedade',
                'perigo',
                'risco',
                'problema',
                'dificuldade'
            ],
            'desire': [
                'sonho',
                'desejo',
                'vontade',
                'ambição',
                'objetivo',
                'meta',
                'conquista'
            ],
            'pain': [
                'dor',
                'sofrimento',
                'frustração',
                'decepção',
                'tristeza',
                'angústia'
            ],
            'pleasure': [
                'prazer',
                'felicidade',
                'alegria',
                'satisfação',
                'realização',
                'sucesso'
            ],
            'urgency': [
                'urgente',
                'rápido',
                'imediato',
                'agora',
                'hoje',
                'já'
            ],
            'curiosity': [
                'segredo',
                'mistério',
                'descoberta',
                'revelação',
                'surpresa'
            ]
        };
        
        for (const [trigger, words] of Object.entries(emotionalTriggers)) {
            let matches = 0;
            const examples = [];
            
            for (const word of words) {
                if (transcriptLower.includes(word)) {
                    matches++;
                    examples.push(word);
                }
            }
            
            if (matches > 0) {
                triggers.push({
                    trigger,
                    intensity: Math.min(100, (matches / words.length) * 100),
                    matches,
                    examples
                });
            }
        }
        
        return triggers;
    }

    /**
     * Extrai copy persuasiva da transcrição
     */
    async extractPersuasiveCopy(transcript) {
        if (!transcript) return {};
        
        const copy = {
            headlines: [],
            hooks: [],
            offers: [],
            ctas: [],
            testimonials: [],
            guarantees: []
        };
        
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        for (const sentence of sentences) {
            const sentenceLower = sentence.toLowerCase().trim();
            
            // Identificar headlines (frases impactantes)
            if (this.isHeadline(sentenceLower)) {
                copy.headlines.push(sentence.trim());
            }
            
            // Identificar hooks (ganchos de abertura)
            if (this.isHook(sentenceLower)) {
                copy.hooks.push(sentence.trim());
            }
            
            // Identificar ofertas
            if (this.isOffer(sentenceLower)) {
                copy.offers.push(sentence.trim());
            }
            
            // Identificar CTAs
            if (this.isCTA(sentenceLower)) {
                copy.ctas.push(sentence.trim());
            }
            
            // Identificar garantias
            if (this.isGuarantee(sentenceLower)) {
                copy.guarantees.push(sentence.trim());
            }
        }
        
        return copy;
    }

    /**
     * Verifica se uma frase é um headline
     */
    isHeadline(sentence) {
        const headlinePatterns = [
            /descobri o segredo/,
            /método revolucionário/,
            /sistema comprovado/,
            /transformação completa/,
            /resultado garantido/,
            /fórmula do sucesso/
        ];
        
        return headlinePatterns.some(pattern => pattern.test(sentence));
    }

    /**
     * Verifica se uma frase é um hook
     */
    isHook(sentence) {
        const hookPatterns = [
            /^(olá|oi|e aí)/,
            /meu nome é/,
            /vou te contar/,
            /deixe-me te mostrar/,
            /você vai descobrir/,
            /prepare-se para/
        ];
        
        return hookPatterns.some(pattern => pattern.test(sentence));
    }

    /**
     * Verifica se uma frase é uma oferta
     */
    isOffer(sentence) {
        const offerPatterns = [
            /por apenas/,
            /oferta especial/,
            /desconto/,
            /promoção/,
            /investimento/,
            /valor/
        ];
        
        return offerPatterns.some(pattern => pattern.test(sentence));
    }

    /**
     * Verifica se uma frase é um CTA
     */
    isCTA(sentence) {
        const ctaPatterns = [
            /clique/,
            /acesse/,
            /compre/,
            /adquira/,
            /garanta/,
            /inscreva-se/,
            /cadastre-se/
        ];
        
        return ctaPatterns.some(pattern => pattern.test(sentence));
    }

    /**
     * Verifica se uma frase é uma garantia
     */
    isGuarantee(sentence) {
        const guaranteePatterns = [
            /garanto/,
            /garantia/,
            /prometo/,
            /asseguro/,
            /certifico/,
            /risco zero/
        ];
        
        return guaranteePatterns.some(pattern => pattern.test(sentence));
    }

    /**
     * Analisa timing e ritmo da VSL
     */
    async analyzeVSLTiming(transcript, duration) {
        if (!transcript || !duration) return {};
        
        const words = transcript.split(/\s+/).length;
        const wordsPerMinute = Math.round(words / (duration / 60));
        
        const timing = {
            totalWords: words,
            duration: duration,
            wordsPerMinute: wordsPerMinute,
            pace: this.categorizePace(wordsPerMinute),
            sections: {}
        };
        
        // Estimar timing das seções baseado na estrutura típica
        const sectionTimings = {
            hook: { start: 0, duration: 30 },
            story: { start: 30, duration: 300 },
            proof: { start: 330, duration: 180 },
            offer: { start: 510, duration: 120 },
            urgency: { start: 630, duration: 60 },
            cta: { start: 690, duration: 30 }
        };
        
        for (const [section, timing] of Object.entries(sectionTimings)) {
            if (timing.start + timing.duration <= duration) {
                timing.sections[section] = {
                    startTime: timing.start,
                    duration: timing.duration,
                    percentage: (timing.duration / duration) * 100
                };
            }
        }
        
        return timing;
    }

    /**
     * Categoriza o ritmo da fala
     */
    categorizePace(wordsPerMinute) {
        if (wordsPerMinute < 120) return 'slow';
        if (wordsPerMinute < 160) return 'normal';
        if (wordsPerMinute < 200) return 'fast';
        return 'very_fast';
    }

    /**
     * Gera ID único para VSL
     */
    generateVSLId(url) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
    }

    /**
     * Extrai URL do vídeo baseado na plataforma
     */
    async extractVideoUrl(page, element, platform) {
        try {
            let urlSelector;
            switch (platform) {
                case 'youtube.com':
                    urlSelector = 'a[href*="/watch"]';
                    break;
                case 'vimeo.com':
                    urlSelector = 'a[href*="/"]';
                    break;
                default:
                    urlSelector = 'a';
            }
            
            const linkElement = await element.$(urlSelector);
            if (linkElement) {
                const href = await linkElement.getProperty('href');
                return await href.jsonValue();
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extrai número de visualizações
     */
    async extractViews(page, element, platform) {
        try {
            const platformConfig = this.vslConfig.vslPlatforms[platform];
            const viewsText = await this.extractText(page, element, platformConfig.selectors.views);
            
            if (viewsText) {
                return this.parseViewCount(viewsText);
            }
            
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Converte texto de visualizações em número
     */
    parseViewCount(viewsText) {
        const text = viewsText.toLowerCase().replace(/[^\d.,kmb]/g, '');
        let multiplier = 1;
        
        if (text.includes('k')) multiplier = 1000;
        else if (text.includes('m')) multiplier = 1000000;
        else if (text.includes('b')) multiplier = 1000000000;
        
        const number = parseFloat(text.replace(/[kmb]/g, ''));
        return Math.round(number * multiplier);
    }

    /**
     * Extrai duração do vídeo
     */
    async extractDuration(page, element, platform) {
        try {
            // Implementação específica por plataforma
            // Por enquanto, retorna duração estimada baseada em padrões
            return 600; // 10 minutos como padrão
        } catch (error) {
            return 0;
        }
    }

    /**
     * Extrai métricas de engajamento
     */
    async extractEngagementMetrics(page, element, vslData, platform) {
        try {
            const platformConfig = this.vslConfig.vslPlatforms[platform];
            
            // Extrair likes
            if (platformConfig.selectors.likes) {
                const likesText = await this.extractText(page, element, platformConfig.selectors.likes);
                vslData.engagement.likes = this.parseEngagementCount(likesText);
            }
            
            // Outras métricas podem ser extraídas similarmente
            
        } catch (error) {
            this.logger.warn(`Erro ao extrair métricas de engajamento: ${error.message}`);
        }
    }

    /**
     * Extrai informações do criador
     */
    async extractCreatorInfo(page, element, vslData, platform) {
        try {
            // Implementação específica por plataforma
            // Extrair nome, seguidores, verificação, etc.
            
        } catch (error) {
            this.logger.warn(`Erro ao extrair informações do criador: ${error.message}`);
        }
    }

    /**
     * Obtém seletor de vídeo para a plataforma
     */
    getVideoSelector(platform) {
        const selectors = {
            'youtube.com': 'div#contents ytd-video-renderer',
            'vimeo.com': '.clip-grid-item',
            'facebook.com': '[data-testid="video-attachment"]'
        };
        
        return selectors[platform] || 'video';
    }

    /**
     * Converte texto de engajamento em número
     */
    parseEngagementCount(text) {
        if (!text) return 0;
        return this.parseViewCount(text);
    }

    /**
     * Salva dados de VSL coletada
     */
    async saveVSLData(vslData) {
        try {
            const filename = `vsl_${vslData.id}_${Date.now()}.json`;
            const filepath = path.join(this.config.outputDir, 'vsls', filename);
            
            // Criar diretório se não existir
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            
            // Salvar dados
            await fs.writeFile(filepath, JSON.stringify(vslData, null, 2));
            
            this.logger.info(`💾 VSL salva: ${filepath}`);
            
            return filepath;
        } catch (error) {
            this.logger.error(`Erro ao salvar VSL: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gera relatório de VSLs coletadas
     */
    async generateVSLReport(vsls) {
        const report = {
            summary: {
                totalVSLs: vsls.length,
                averageConversionScore: vsls.reduce((sum, vsl) => sum + vsl.vslAnalysis.conversionScore, 0) / vsls.length,
                topPlatforms: this.getTopPlatforms(vsls),
                topNiches: this.getTopNiches(vsls),
                averageDuration: vsls.reduce((sum, vsl) => sum + vsl.duration, 0) / vsls.length
            },
            
            topPerformers: vsls
                .sort((a, b) => b.vslAnalysis.conversionScore - a.vslAnalysis.conversionScore)
                .slice(0, 10),
                
            structureAnalysis: this.analyzeVSLStructures(vsls),
            persuasionAnalysis: this.analyzePersuasionTechniques(vsls),
            timingAnalysis: this.analyzeVSLTimings(vsls),
            
            generatedAt: new Date().toISOString(),
            stats: this.vslStats
        };
        
        return report;
    }

    /**
     * Obtém estatísticas do coletor
     */
    getStats() {
        return {
            ...this.vslStats,
            uptime: Date.now() - this.startTime,
            status: 'active'
        };
    }
}

module.exports = VSLCollector;

