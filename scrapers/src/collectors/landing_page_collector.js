/**
 * LANDING PAGE COLLECTOR - COLETOR DE PÁGINAS DE VENDAS
 * Especializado em detectar, coletar e analisar páginas de vendas de VSLs escaladas
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const BaseScraper = require('../base_scraper');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

class LandingPageCollector extends BaseScraper {
    constructor(config) {
        super({
            ...config,
            scraperName: 'LandingPageCollector',
            description: 'Especialista em coletar e analisar páginas de vendas de alta conversão'
        });
        
        // Configurações específicas para landing pages
        this.landingPageConfig = {
            // Indicadores de página de vendas de alta conversão
            conversionIndicators: {
                minElements: 10, // Mínimo de elementos de conversão
                requiredSections: [
                    'headline',
                    'subheadline', 
                    'benefits',
                    'social_proof',
                    'cta',
                    'guarantee'
                ],
                conversionSignals: [
                    'comprar agora',
                    'adquirir',
                    'garantir vaga',
                    'inscrever-se',
                    'começar agora',
                    'acesso imediato',
                    'oferta limitada',
                    'últimas vagas',
                    'desconto especial',
                    'garantia incondicional'
                ]
            },
            
            // Elementos típicos de landing pages de alta conversão
            pageElements: {
                headline: {
                    selectors: [
                        'h1',
                        '.headline',
                        '.main-title',
                        '[class*="headline"]',
                        '[class*="title"]'
                    ],
                    importance: 10
                },
                subheadline: {
                    selectors: [
                        'h2',
                        '.subheadline',
                        '.subtitle',
                        '[class*="subheadline"]',
                        '[class*="subtitle"]'
                    ],
                    importance: 8
                },
                cta_buttons: {
                    selectors: [
                        'button[type="submit"]',
                        '.cta-button',
                        '.buy-button',
                        '[class*="cta"]',
                        '[class*="buy"]',
                        'a[href*="checkout"]',
                        'a[href*="comprar"]'
                    ],
                    importance: 10
                },
                benefits: {
                    selectors: [
                        '.benefits',
                        '.features',
                        '[class*="benefit"]',
                        '[class*="feature"]',
                        'ul li',
                        '.checklist'
                    ],
                    importance: 9
                },
                testimonials: {
                    selectors: [
                        '.testimonial',
                        '.review',
                        '.depoimento',
                        '[class*="testimonial"]',
                        '[class*="review"]',
                        '[class*="depoimento"]'
                    ],
                    importance: 8
                },
                guarantee: {
                    selectors: [
                        '.guarantee',
                        '.garantia',
                        '[class*="guarantee"]',
                        '[class*="garantia"]',
                        '[class*="risk-free"]'
                    ],
                    importance: 7
                },
                pricing: {
                    selectors: [
                        '.price',
                        '.pricing',
                        '.valor',
                        '[class*="price"]',
                        '[class*="pricing"]',
                        '[class*="valor"]'
                    ],
                    importance: 9
                },
                urgency: {
                    selectors: [
                        '.countdown',
                        '.timer',
                        '.urgency',
                        '[class*="countdown"]',
                        '[class*="timer"]',
                        '[class*="urgency"]'
                    ],
                    importance: 6
                },
                social_proof: {
                    selectors: [
                        '.social-proof',
                        '.customers',
                        '.clientes',
                        '[class*="social"]',
                        '[class*="customers"]',
                        '[class*="clientes"]'
                    ],
                    importance: 7
                },
                video: {
                    selectors: [
                        'video',
                        'iframe[src*="youtube"]',
                        'iframe[src*="vimeo"]',
                        '.video-container',
                        '[class*="video"]'
                    ],
                    importance: 8
                }
            },
            
            // Padrões de URL de landing pages
            urlPatterns: [
                /checkout/i,
                /comprar/i,
                /oferta/i,
                /promocao/i,
                /desconto/i,
                /venda/i,
                /curso/i,
                /mentoria/i,
                /programa/i,
                /treinamento/i,
                /metodo/i,
                /sistema/i
            ],
            
            // Configurações de análise
            analysisConfig: {
                maxPageSize: 10 * 1024 * 1024, // 10MB
                timeout: 30000,
                waitForElements: 5000,
                screenshotQuality: 80,
                fullPageScreenshot: true
            }
        };
        
        // Estatísticas de coleta
        this.collectionStats = {
            totalPagesAnalyzed: 0,
            highConversionPagesFound: 0,
            averageConversionScore: 0,
            topPerformingElements: {},
            commonPatterns: {},
            funnelAnalysis: {}
        };
    }

    /**
     * Detecta landing pages de alta conversão
     */
    async detectHighConversionPages(urls = [], searchTerms = []) {
        this.logger.info(`🛒 Iniciando detecção de landing pages de alta conversão...`);
        
        const targetUrls = urls.length > 0 ? urls : await this.findLandingPageUrls(searchTerms);
        const highConversionPages = [];
        
        for (const url of targetUrls) {
            try {
                const pageData = await this.analyzeLandingPage(url);
                
                if (pageData && this.isHighConversionPage(pageData)) {
                    await this.performDeepPageAnalysis(pageData);
                    highConversionPages.push(pageData);
                }
                
                // Delay entre análises
                await this.delay(2000, 5000);
                
            } catch (error) {
                this.logger.error(`Erro ao analisar página ${url}: ${error.message}`);
            }
        }
        
        this.collectionStats.totalPagesAnalyzed += targetUrls.length;
        this.collectionStats.highConversionPagesFound += highConversionPages.length;
        
        this.logger.info(`✅ Encontradas ${highConversionPages.length} páginas de alta conversão de ${targetUrls.length} analisadas`);
        
        return highConversionPages;
    }

    /**
     * Encontra URLs de landing pages baseado em termos de busca
     */
    async findLandingPageUrls(searchTerms = []) {
        const defaultSearchTerms = [
            'curso online',
            'mentoria exclusiva',
            'método comprovado',
            'sistema revolucionário',
            'treinamento completo',
            'programa de transformação',
            'fórmula do sucesso',
            'estratégia secreta'
        ];
        
        const queries = searchTerms.length > 0 ? searchTerms : defaultSearchTerms;
        const foundUrls = [];
        
        for (const query of queries) {
            try {
                // Buscar no Google por landing pages
                const searchUrls = await this.searchGoogleForLandingPages(query);
                foundUrls.push(...searchUrls);
                
                await this.delay(3000, 7000);
            } catch (error) {
                this.logger.error(`Erro na busca por "${query}": ${error.message}`);
            }
        }
        
        // Remover duplicatas e filtrar URLs válidas
        const uniqueUrls = [...new Set(foundUrls)];
        return uniqueUrls.filter(url => this.isValidLandingPageUrl(url));
    }

    /**
     * Busca no Google por landing pages
     */
    async searchGoogleForLandingPages(query) {
        const page = await this.getPage();
        const urls = [];
        
        try {
            const searchQuery = `${query} site:hotmart.com OR site:monetizze.com.br OR site:eduzz.com OR "comprar agora" OR "adquirir"`;
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });
            await this.delay(2000, 4000);
            
            // Extrair URLs dos resultados
            const searchResults = await page.$$('div.g a[href]');
            
            for (const result of searchResults.slice(0, 10)) {
                try {
                    const href = await result.getProperty('href');
                    const url = await href.jsonValue();
                    
                    if (this.isValidLandingPageUrl(url)) {
                        urls.push(url);
                    }
                } catch (error) {
                    // Ignorar erros individuais
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro na busca Google: ${error.message}`);
        }
        
        return urls;
    }

    /**
     * Verifica se uma URL é válida para landing page
     */
    isValidLandingPageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        try {
            const urlObj = new URL(url);
            
            // Verificar domínios conhecidos de landing pages
            const landingPageDomains = [
                'hotmart.com',
                'monetizze.com.br',
                'eduzz.com',
                'kiwify.com.br',
                'braip.com',
                'perfectpay.com.br'
            ];
            
            const isDomainValid = landingPageDomains.some(domain => 
                urlObj.hostname.includes(domain)
            );
            
            // Verificar padrões na URL
            const hasPattern = this.landingPageConfig.urlPatterns.some(pattern => 
                pattern.test(url)
            );
            
            return isDomainValid || hasPattern;
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Analisa uma landing page específica
     */
    async analyzeLandingPage(url) {
        this.logger.info(`🔍 Analisando landing page: ${url}`);
        
        const page = await this.getPage();
        
        try {
            // Navegar para a página
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: this.landingPageConfig.analysisConfig.timeout
            });
            
            // Aguardar carregamento de elementos
            await this.delay(this.landingPageConfig.analysisConfig.waitForElements);
            
            // Dados básicos da página
            const pageData = {
                id: this.generatePageId(url),
                url,
                analyzedAt: new Date().toISOString(),
                
                // Informações básicas
                basic: {
                    title: await page.title(),
                    description: await this.extractMetaDescription(page),
                    keywords: await this.extractMetaKeywords(page),
                    language: await this.detectPageLanguage(page),
                    loadTime: 0 // Será calculado
                },
                
                // Estrutura da página
                structure: {
                    elements: {},
                    sections: [],
                    hierarchy: {},
                    navigation: {}
                },
                
                // Conteúdo extraído
                content: {
                    headlines: [],
                    subheadlines: [],
                    benefits: [],
                    testimonials: [],
                    pricing: {},
                    ctas: [],
                    copy: {}
                },
                
                // Análise de conversão
                conversion: {
                    score: 0,
                    indicators: [],
                    strengths: [],
                    weaknesses: [],
                    recommendations: []
                },
                
                // Dados técnicos
                technical: {
                    pageSize: 0,
                    loadSpeed: 0,
                    mobileOptimized: false,
                    seoScore: 0,
                    performance: {}
                },
                
                // Screenshots
                screenshots: {
                    desktop: '',
                    mobile: ''
                }
            };
            
            // Extrair estrutura e elementos
            await this.extractPageStructure(page, pageData);
            
            // Extrair conteúdo
            await this.extractPageContent(page, pageData);
            
            // Analisar aspectos técnicos
            await this.analyzeTechnicalAspects(page, pageData);
            
            // Capturar screenshots
            await this.capturePageScreenshots(page, pageData);
            
            // Calcular score de conversão
            this.calculateConversionScore(pageData);
            
            return pageData;
            
        } catch (error) {
            this.logger.error(`Erro ao analisar página ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * Extrai estrutura da página
     */
    async extractPageStructure(page, pageData) {
        try {
            const elements = this.landingPageConfig.pageElements;
            
            for (const [elementType, config] of Object.entries(elements)) {
                const foundElements = [];
                
                for (const selector of config.selectors) {
                    try {
                        const elementHandles = await page.$$(selector);
                        
                        for (const handle of elementHandles) {
                            const text = await this.getElementText(handle);
                            const attributes = await this.getElementAttributes(handle);
                            
                            if (text || attributes.href || attributes.src) {
                                foundElements.push({
                                    selector,
                                    text: text || '',
                                    attributes,
                                    position: await this.getElementPosition(handle)
                                });
                            }
                        }
                    } catch (error) {
                        // Ignorar erros de seletores específicos
                    }
                }
                
                pageData.structure.elements[elementType] = {
                    count: foundElements.length,
                    elements: foundElements,
                    importance: config.importance,
                    present: foundElements.length > 0
                };
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair estrutura: ${error.message}`);
        }
    }

    /**
     * Extrai conteúdo da página
     */
    async extractPageContent(page, pageData) {
        try {
            // Extrair headlines
            pageData.content.headlines = await this.extractHeadlines(page);
            
            // Extrair subheadlines
            pageData.content.subheadlines = await this.extractSubheadlines(page);
            
            // Extrair benefícios
            pageData.content.benefits = await this.extractBenefits(page);
            
            // Extrair depoimentos
            pageData.content.testimonials = await this.extractTestimonials(page);
            
            // Extrair preços
            pageData.content.pricing = await this.extractPricing(page);
            
            // Extrair CTAs
            pageData.content.ctas = await this.extractCTAs(page);
            
            // Extrair copy persuasiva
            pageData.content.copy = await this.extractPersuasiveCopy(page);
            
        } catch (error) {
            this.logger.error(`Erro ao extrair conteúdo: ${error.message}`);
        }
    }

    /**
     * Extrai headlines da página
     */
    async extractHeadlines(page) {
        const headlines = [];
        
        try {
            const h1Elements = await page.$$('h1');
            
            for (const element of h1Elements) {
                const text = await this.getElementText(element);
                if (text && text.length > 10) {
                    headlines.push({
                        text: text.trim(),
                        tag: 'h1',
                        length: text.length,
                        position: await this.getElementPosition(element),
                        persuasionScore: this.calculatePersuasionScore(text)
                    });
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair headlines: ${error.message}`);
        }
        
        return headlines;
    }

    /**
     * Extrai subheadlines da página
     */
    async extractSubheadlines(page) {
        const subheadlines = [];
        
        try {
            const h2Elements = await page.$$('h2');
            
            for (const element of h2Elements) {
                const text = await this.getElementText(element);
                if (text && text.length > 5) {
                    subheadlines.push({
                        text: text.trim(),
                        tag: 'h2',
                        length: text.length,
                        position: await this.getElementPosition(element)
                    });
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair subheadlines: ${error.message}`);
        }
        
        return subheadlines;
    }

    /**
     * Extrai benefícios da página
     */
    async extractBenefits(page) {
        const benefits = [];
        
        try {
            // Buscar listas de benefícios
            const listItems = await page.$$('ul li, ol li');
            
            for (const item of listItems) {
                const text = await this.getElementText(item);
                if (text && text.length > 10 && this.isBenefit(text)) {
                    benefits.push({
                        text: text.trim(),
                        type: 'list_item',
                        emotionalImpact: this.calculateEmotionalImpact(text)
                    });
                }
            }
            
            // Buscar seções de benefícios
            const benefitSections = await page.$$('.benefits, .features, [class*="benefit"]');
            
            for (const section of benefitSections) {
                const text = await this.getElementText(section);
                if (text) {
                    const sectionBenefits = this.extractBenefitsFromText(text);
                    benefits.push(...sectionBenefits);
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair benefícios: ${error.message}`);
        }
        
        return benefits;
    }

    /**
     * Verifica se um texto é um benefício
     */
    isBenefit(text) {
        const benefitPatterns = [
            /você vai/i,
            /você terá/i,
            /você conseguirá/i,
            /aprenderá/i,
            /descobrirá/i,
            /dominará/i,
            /transformará/i,
            /alcançará/i
        ];
        
        return benefitPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Extrai benefícios de um texto
     */
    extractBenefitsFromText(text) {
        const benefits = [];
        const sentences = text.split(/[.!?]+/);
        
        for (const sentence of sentences) {
            if (sentence.trim().length > 10 && this.isBenefit(sentence)) {
                benefits.push({
                    text: sentence.trim(),
                    type: 'extracted',
                    emotionalImpact: this.calculateEmotionalImpact(sentence)
                });
            }
        }
        
        return benefits;
    }

    /**
     * Extrai depoimentos da página
     */
    async extractTestimonials(page) {
        const testimonials = [];
        
        try {
            const testimonialSelectors = [
                '.testimonial',
                '.review',
                '.depoimento',
                '[class*="testimonial"]',
                '[class*="review"]'
            ];
            
            for (const selector of testimonialSelectors) {
                const elements = await page.$$(selector);
                
                for (const element of elements) {
                    const text = await this.getElementText(element);
                    const author = await this.extractTestimonialAuthor(element);
                    const rating = await this.extractTestimonialRating(element);
                    
                    if (text && text.length > 20) {
                        testimonials.push({
                            text: text.trim(),
                            author: author || 'Anônimo',
                            rating: rating || 0,
                            credibilityScore: this.calculateCredibilityScore(text, author),
                            emotionalImpact: this.calculateEmotionalImpact(text)
                        });
                    }
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair depoimentos: ${error.message}`);
        }
        
        return testimonials;
    }

    /**
     * Extrai autor de depoimento
     */
    async extractTestimonialAuthor(element) {
        try {
            const authorSelectors = [
                '.author',
                '.name',
                '.cliente',
                '[class*="author"]',
                '[class*="name"]'
            ];
            
            for (const selector of authorSelectors) {
                const authorElement = await element.$(selector);
                if (authorElement) {
                    return await this.getElementText(authorElement);
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extrai avaliação de depoimento
     */
    async extractTestimonialRating(element) {
        try {
            const ratingSelectors = [
                '.rating',
                '.stars',
                '[class*="rating"]',
                '[class*="stars"]'
            ];
            
            for (const selector of ratingSelectors) {
                const ratingElement = await element.$(selector);
                if (ratingElement) {
                    const ratingText = await this.getElementText(ratingElement);
                    return this.parseRating(ratingText);
                }
            }
            
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Converte texto de avaliação em número
     */
    parseRating(ratingText) {
        if (!ratingText) return 0;
        
        const match = ratingText.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }

    /**
     * Extrai informações de preço
     */
    async extractPricing(page) {
        const pricing = {
            originalPrice: 0,
            currentPrice: 0,
            discount: 0,
            currency: 'BRL',
            paymentOptions: [],
            installments: {}
        };
        
        try {
            const priceSelectors = [
                '.price',
                '.valor',
                '.pricing',
                '[class*="price"]',
                '[class*="valor"]'
            ];
            
            for (const selector of priceSelectors) {
                const elements = await page.$$(selector);
                
                for (const element of elements) {
                    const text = await this.getElementText(element);
                    if (text) {
                        const priceInfo = this.parsePrice(text);
                        if (priceInfo.value > 0) {
                            if (priceInfo.type === 'original') {
                                pricing.originalPrice = priceInfo.value;
                            } else if (priceInfo.type === 'current') {
                                pricing.currentPrice = priceInfo.value;
                            }
                        }
                    }
                }
            }
            
            // Calcular desconto
            if (pricing.originalPrice > 0 && pricing.currentPrice > 0) {
                pricing.discount = Math.round(
                    ((pricing.originalPrice - pricing.currentPrice) / pricing.originalPrice) * 100
                );
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair preços: ${error.message}`);
        }
        
        return pricing;
    }

    /**
     * Converte texto de preço em número
     */
    parsePrice(priceText) {
        const text = priceText.toLowerCase();
        
        // Remover caracteres não numéricos exceto vírgula e ponto
        const cleanText = text.replace(/[^\d.,]/g, '');
        
        // Converter para número
        let value = 0;
        if (cleanText.includes(',')) {
            // Formato brasileiro: 1.234,56
            value = parseFloat(cleanText.replace(/\./g, '').replace(',', '.'));
        } else {
            // Formato americano: 1,234.56
            value = parseFloat(cleanText.replace(/,/g, ''));
        }
        
        // Determinar tipo de preço
        let type = 'current';
        if (text.includes('de ') || text.includes('era ') || text.includes('antes')) {
            type = 'original';
        }
        
        return { value: value || 0, type };
    }

    /**
     * Extrai CTAs da página
     */
    async extractCTAs(page) {
        const ctas = [];
        
        try {
            const ctaSelectors = [
                'button',
                '.cta-button',
                '.buy-button',
                '[class*="cta"]',
                '[class*="buy"]',
                'a[href*="checkout"]'
            ];
            
            for (const selector of ctaSelectors) {
                const elements = await page.$$(selector);
                
                for (const element of elements) {
                    const text = await this.getElementText(element);
                    const href = await this.getElementAttribute(element, 'href');
                    
                    if (text && this.isCTA(text)) {
                        ctas.push({
                            text: text.trim(),
                            href: href || '',
                            position: await this.getElementPosition(element),
                            urgencyScore: this.calculateUrgencyScore(text),
                            persuasionScore: this.calculatePersuasionScore(text)
                        });
                    }
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair CTAs: ${error.message}`);
        }
        
        return ctas;
    }

    /**
     * Verifica se um texto é um CTA
     */
    isCTA(text) {
        const ctaPatterns = [
            /comprar/i,
            /adquirir/i,
            /garantir/i,
            /inscrever/i,
            /começar/i,
            /acessar/i,
            /clique/i,
            /baixar/i
        ];
        
        return ctaPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Extrai copy persuasiva da página
     */
    async extractPersuasiveCopy(page) {
        const copy = {
            headlines: [],
            bullets: [],
            guarantees: [],
            urgency: [],
            social_proof: [],
            objection_handling: []
        };
        
        try {
            // Extrair todo o texto da página
            const pageText = await page.evaluate(() => document.body.innerText);
            const sentences = pageText.split(/[.!?]+/).filter(s => s.trim().length > 10);
            
            for (const sentence of sentences) {
                const sentenceTrim = sentence.trim();
                
                // Classificar tipo de copy
                if (this.isGuarantee(sentenceTrim)) {
                    copy.guarantees.push(sentenceTrim);
                } else if (this.isUrgency(sentenceTrim)) {
                    copy.urgency.push(sentenceTrim);
                } else if (this.isSocialProof(sentenceTrim)) {
                    copy.social_proof.push(sentenceTrim);
                } else if (this.isObjectionHandling(sentenceTrim)) {
                    copy.objection_handling.push(sentenceTrim);
                }
            }
            
        } catch (error) {
            this.logger.error(`Erro ao extrair copy: ${error.message}`);
        }
        
        return copy;
    }

    /**
     * Verifica se um texto é uma garantia
     */
    isGuarantee(text) {
        const guaranteePatterns = [
            /garantia/i,
            /garanto/i,
            /risco zero/i,
            /dinheiro de volta/i,
            /satisfação garantida/i
        ];
        
        return guaranteePatterns.some(pattern => pattern.test(text));
    }

    /**
     * Verifica se um texto expressa urgência
     */
    isUrgency(text) {
        const urgencyPatterns = [
            /últimas/i,
            /limitado/i,
            /urgente/i,
            /agora/i,
            /hoje/i,
            /restam/i
        ];
        
        return urgencyPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Verifica se um texto é prova social
     */
    isSocialProof(text) {
        const socialProofPatterns = [
            /milhares/i,
            /centenas/i,
            /clientes/i,
            /alunos/i,
            /pessoas/i,
            /já conseguiram/i
        ];
        
        return socialProofPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Verifica se um texto trata objeções
     */
    isObjectionHandling(text) {
        const objectionPatterns = [
            /mas você pode estar pensando/i,
            /talvez você esteja se perguntando/i,
            /sei que você deve estar/i,
            /não se preocupe/i,
            /mesmo que/i
        ];
        
        return objectionPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Analisa aspectos técnicos da página
     */
    async analyzeTechnicalAspects(page, pageData) {
        try {
            // Analisar performance
            const metrics = await page.metrics();
            pageData.technical.performance = metrics;
            
            // Verificar otimização mobile
            pageData.technical.mobileOptimized = await this.checkMobileOptimization(page);
            
            // Calcular score SEO básico
            pageData.technical.seoScore = await this.calculateSEOScore(page, pageData);
            
        } catch (error) {
            this.logger.error(`Erro na análise técnica: ${error.message}`);
        }
    }

    /**
     * Verifica otimização mobile
     */
    async checkMobileOptimization(page) {
        try {
            const viewport = await page.viewport();
            const hasViewportMeta = await page.$('meta[name="viewport"]') !== null;
            const hasResponsiveCSS = await page.evaluate(() => {
                const styles = Array.from(document.styleSheets);
                return styles.some(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules || sheet.rules || []);
                        return rules.some(rule => 
                            rule.media && rule.media.mediaText.includes('max-width')
                        );
                    } catch (e) {
                        return false;
                    }
                });
            });
            
            return hasViewportMeta && hasResponsiveCSS;
        } catch (error) {
            return false;
        }
    }

    /**
     * Calcula score SEO básico
     */
    async calculateSEOScore(page, pageData) {
        let score = 0;
        
        try {
            // Título presente e otimizado
            if (pageData.basic.title && pageData.basic.title.length >= 30 && pageData.basic.title.length <= 60) {
                score += 20;
            }
            
            // Meta description presente
            if (pageData.basic.description && pageData.basic.description.length >= 120 && pageData.basic.description.length <= 160) {
                score += 20;
            }
            
            // H1 presente
            if (pageData.content.headlines.length > 0) {
                score += 20;
            }
            
            // Estrutura de headings
            const headings = await page.$$('h1, h2, h3, h4, h5, h6');
            if (headings.length >= 3) {
                score += 20;
            }
            
            // Imagens com alt text
            const images = await page.$$('img');
            const imagesWithAlt = await page.$$('img[alt]');
            if (images.length > 0 && (imagesWithAlt.length / images.length) >= 0.8) {
                score += 20;
            }
            
        } catch (error) {
            this.logger.error(`Erro no cálculo SEO: ${error.message}`);
        }
        
        return score;
    }

    /**
     * Captura screenshots da página
     */
    async capturePageScreenshots(page, pageData) {
        try {
            const screenshotDir = path.join(this.config.outputDir, 'screenshots', 'landing_pages');
            await fs.mkdir(screenshotDir, { recursive: true });
            
            // Screenshot desktop
            const desktopPath = path.join(screenshotDir, `${pageData.id}_desktop.png`);
            await page.screenshot({
                path: desktopPath,
                fullPage: this.landingPageConfig.analysisConfig.fullPageScreenshot,
                quality: this.landingPageConfig.analysisConfig.screenshotQuality
            });
            pageData.screenshots.desktop = desktopPath;
            
            // Screenshot mobile
            await page.setViewport({ width: 375, height: 667 });
            const mobilePath = path.join(screenshotDir, `${pageData.id}_mobile.png`);
            await page.screenshot({
                path: mobilePath,
                fullPage: this.landingPageConfig.analysisConfig.fullPageScreenshot,
                quality: this.landingPageConfig.analysisConfig.screenshotQuality
            });
            pageData.screenshots.mobile = mobilePath;
            
            // Restaurar viewport
            await page.setViewport({ width: 1920, height: 1080 });
            
        } catch (error) {
            this.logger.error(`Erro ao capturar screenshots: ${error.message}`);
        }
    }

    /**
     * Calcula score de conversão da página
     */
    calculateConversionScore(pageData) {
        let score = 0;
        const indicators = [];
        const strengths = [];
        const weaknesses = [];
        
        // Verificar elementos essenciais
        const requiredElements = this.landingPageConfig.conversionIndicators.requiredSections;
        
        for (const element of requiredElements) {
            if (pageData.structure.elements[element] && pageData.structure.elements[element].present) {
                score += 10;
                indicators.push(`has_${element}`);
                strengths.push(`Possui ${element} bem definido`);
            } else {
                weaknesses.push(`Falta ${element}`);
            }
        }
        
        // Avaliar qualidade dos headlines
        if (pageData.content.headlines.length > 0) {
            const avgPersuasionScore = pageData.content.headlines.reduce(
                (sum, h) => sum + (h.persuasionScore || 0), 0
            ) / pageData.content.headlines.length;
            
            score += Math.round(avgPersuasionScore * 0.2);
            
            if (avgPersuasionScore >= 70) {
                strengths.push('Headlines altamente persuasivos');
            }
        }
        
        // Avaliar CTAs
        if (pageData.content.ctas.length >= 3) {
            score += 15;
            strengths.push('Múltiplos CTAs presentes');
        } else if (pageData.content.ctas.length === 0) {
            weaknesses.push('Nenhum CTA identificado');
        }
        
        // Avaliar prova social
        if (pageData.content.testimonials.length >= 3) {
            score += 15;
            strengths.push('Boa quantidade de depoimentos');
        } else if (pageData.content.testimonials.length === 0) {
            weaknesses.push('Falta prova social (depoimentos)');
        }
        
        // Avaliar aspectos técnicos
        if (pageData.technical.mobileOptimized) {
            score += 10;
            strengths.push('Otimizado para mobile');
        } else {
            weaknesses.push('Não otimizado para mobile');
        }
        
        if (pageData.technical.seoScore >= 80) {
            score += 10;
            strengths.push('Boa otimização SEO');
        }
        
        // Gerar recomendações
        const recommendations = this.generateRecommendations(strengths, weaknesses);
        
        // Atualizar dados da página
        pageData.conversion = {
            score: Math.min(100, score),
            indicators,
            strengths,
            weaknesses,
            recommendations
        };
    }

    /**
     * Gera recomendações de melhoria
     */
    generateRecommendations(strengths, weaknesses) {
        const recommendations = [];
        
        if (weaknesses.includes('Falta headline')) {
            recommendations.push({
                priority: 'high',
                category: 'content',
                suggestion: 'Adicionar headline principal impactante',
                impact: 'Alto impacto na conversão'
            });
        }
        
        if (weaknesses.includes('Nenhum CTA identificado')) {
            recommendations.push({
                priority: 'critical',
                category: 'conversion',
                suggestion: 'Adicionar botões de call-to-action claros',
                impact: 'Crítico para conversão'
            });
        }
        
        if (weaknesses.includes('Falta prova social (depoimentos)')) {
            recommendations.push({
                priority: 'medium',
                category: 'trust',
                suggestion: 'Incluir depoimentos e casos de sucesso',
                impact: 'Aumenta credibilidade'
            });
        }
        
        if (weaknesses.includes('Não otimizado para mobile')) {
            recommendations.push({
                priority: 'high',
                category: 'technical',
                suggestion: 'Implementar design responsivo',
                impact: 'Essencial para conversões mobile'
            });
        }
        
        return recommendations;
    }

    /**
     * Verifica se é uma página de alta conversão
     */
    isHighConversionPage(pageData) {
        const minScore = 60;
        const requiredElements = ['headline', 'cta'];
        
        // Verificar score mínimo
        if (pageData.conversion.score < minScore) {
            return false;
        }
        
        // Verificar elementos obrigatórios
        for (const element of requiredElements) {
            if (!pageData.structure.elements[element] || !pageData.structure.elements[element].present) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Realiza análise profunda da página
     */
    async performDeepPageAnalysis(pageData) {
        this.logger.info(`🔍 Realizando análise profunda da página: ${pageData.basic.title}`);
        
        try {
            // Análise de funil de vendas
            pageData.funnelAnalysis = await this.analyzeSalesFunnel(pageData);
            
            // Análise competitiva
            pageData.competitiveAnalysis = await this.performCompetitiveAnalysis(pageData);
            
            // Análise de padrões de conversão
            pageData.conversionPatterns = await this.identifyConversionPatterns(pageData);
            
            // Análise de copy
            pageData.copyAnalysis = await this.performCopyAnalysis(pageData);
            
        } catch (error) {
            this.logger.error(`Erro na análise profunda: ${error.message}`);
        }
    }

    /**
     * Analisa funil de vendas
     */
    async analyzeSalesFunnel(pageData) {
        const funnel = {
            stage: 'unknown',
            funnelType: 'direct',
            conversionPath: [],
            exitPoints: [],
            optimizationOpportunities: []
        };
        
        // Determinar estágio do funil baseado no conteúdo
        if (pageData.content.copy.urgency.length > 0 && pageData.content.pricing.currentPrice > 0) {
            funnel.stage = 'conversion';
            funnel.funnelType = 'sales_page';
        } else if (pageData.content.benefits.length > 5) {
            funnel.stage = 'consideration';
            funnel.funnelType = 'landing_page';
        } else {
            funnel.stage = 'awareness';
            funnel.funnelType = 'lead_capture';
        }
        
        return funnel;
    }

    /**
     * Realiza análise competitiva básica
     */
    async performCompetitiveAnalysis(pageData) {
        return {
            similarPages: [],
            competitiveAdvantages: [],
            improvementAreas: [],
            marketPosition: 'unknown'
        };
    }

    /**
     * Identifica padrões de conversão
     */
    async identifyConversionPatterns(pageData) {
        const patterns = {
            copyPatterns: [],
            designPatterns: [],
            persuasionPatterns: [],
            timingPatterns: []
        };
        
        // Analisar padrões de copy
        if (pageData.content.copy.urgency.length > 2) {
            patterns.copyPatterns.push('high_urgency');
        }
        
        if (pageData.content.copy.social_proof.length > 3) {
            patterns.copyPatterns.push('strong_social_proof');
        }
        
        // Analisar padrões de design
        if (pageData.content.ctas.length > 3) {
            patterns.designPatterns.push('multiple_ctas');
        }
        
        return patterns;
    }

    /**
     * Realiza análise de copy
     */
    async performCopyAnalysis(pageData) {
        const analysis = {
            readabilityScore: 0,
            emotionalImpact: 0,
            persuasionTechniques: [],
            keyMessages: [],
            improvementSuggestions: []
        };
        
        // Calcular scores baseado no conteúdo extraído
        if (pageData.content.headlines.length > 0) {
            analysis.emotionalImpact = pageData.content.headlines.reduce(
                (sum, h) => sum + (h.persuasionScore || 0), 0
            ) / pageData.content.headlines.length;
        }
        
        return analysis;
    }

    /**
     * Calcula score de persuasão de um texto
     */
    calculatePersuasionScore(text) {
        let score = 0;
        const textLower = text.toLowerCase();
        
        const persuasionWords = [
            'exclusivo', 'limitado', 'garantido', 'comprovado',
            'revolucionário', 'secreto', 'transformação',
            'resultado', 'sucesso', 'descoberta'
        ];
        
        for (const word of persuasionWords) {
            if (textLower.includes(word)) {
                score += 10;
            }
        }
        
        return Math.min(100, score);
    }

    /**
     * Calcula impacto emocional de um texto
     */
    calculateEmotionalImpact(text) {
        let impact = 0;
        const textLower = text.toLowerCase();
        
        const emotionalWords = [
            'medo', 'ansiedade', 'preocupação', 'frustração',
            'sonho', 'desejo', 'felicidade', 'sucesso',
            'transformação', 'mudança', 'liberdade'
        ];
        
        for (const word of emotionalWords) {
            if (textLower.includes(word)) {
                impact += 15;
            }
        }
        
        return Math.min(100, impact);
    }

    /**
     * Calcula score de credibilidade
     */
    calculateCredibilityScore(text, author) {
        let score = 50; // Base score
        
        if (author && author !== 'Anônimo') {
            score += 20;
        }
        
        if (text.length > 100) {
            score += 15;
        }
        
        if (text.includes('resultado') || text.includes('transformação')) {
            score += 15;
        }
        
        return Math.min(100, score);
    }

    /**
     * Calcula score de urgência
     */
    calculateUrgencyScore(text) {
        let score = 0;
        const textLower = text.toLowerCase();
        
        const urgencyWords = [
            'agora', 'hoje', 'urgente', 'limitado',
            'últimas', 'restam', 'expire'
        ];
        
        for (const word of urgencyWords) {
            if (textLower.includes(word)) {
                score += 20;
            }
        }
        
        return Math.min(100, score);
    }

    /**
     * Gera ID único para página
     */
    generatePageId(url) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
    }

    /**
     * Extrai meta description
     */
    async extractMetaDescription(page) {
        try {
            const metaDesc = await page.$eval('meta[name="description"]', el => el.content);
            return metaDesc || '';
        } catch (error) {
            return '';
        }
    }

    /**
     * Extrai meta keywords
     */
    async extractMetaKeywords(page) {
        try {
            const metaKeywords = await page.$eval('meta[name="keywords"]', el => el.content);
            return metaKeywords || '';
        } catch (error) {
            return '';
        }
    }

    /**
     * Detecta idioma da página
     */
    async detectPageLanguage(page) {
        try {
            const lang = await page.$eval('html', el => el.lang || el.getAttribute('lang'));
            return lang || 'pt-BR';
        } catch (error) {
            return 'pt-BR';
        }
    }

    /**
     * Obtém texto de um elemento
     */
    async getElementText(element) {
        try {
            return await element.evaluate(el => el.textContent?.trim() || '');
        } catch (error) {
            return '';
        }
    }

    /**
     * Obtém atributos de um elemento
     */
    async getElementAttributes(element) {
        try {
            return await element.evaluate(el => {
                const attrs = {};
                for (const attr of el.attributes) {
                    attrs[attr.name] = attr.value;
                }
                return attrs;
            });
        } catch (error) {
            return {};
        }
    }

    /**
     * Obtém atributo específico de um elemento
     */
    async getElementAttribute(element, attributeName) {
        try {
            return await element.evaluate((el, attr) => el.getAttribute(attr), attributeName);
        } catch (error) {
            return null;
        }
    }

    /**
     * Obtém posição de um elemento
     */
    async getElementPosition(element) {
        try {
            return await element.evaluate(el => {
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            });
        } catch (error) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    /**
     * Salva dados da página
     */
    async saveLandingPageData(pageData) {
        try {
            const filename = `landing_page_${pageData.id}_${Date.now()}.json`;
            const filepath = path.join(this.config.outputDir, 'landing_pages', filename);
            
            // Criar diretório se não existir
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            
            // Salvar dados
            await fs.writeFile(filepath, JSON.stringify(pageData, null, 2));
            
            this.logger.info(`💾 Landing page salva: ${filepath}`);
            
            return filepath;
        } catch (error) {
            this.logger.error(`Erro ao salvar landing page: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gera relatório de páginas coletadas
     */
    async generateLandingPageReport(pages) {
        const report = {
            summary: {
                totalPages: pages.length,
                averageConversionScore: pages.reduce((sum, page) => sum + page.conversion.score, 0) / pages.length,
                topElements: this.getTopElements(pages),
                commonPatterns: this.getCommonPatterns(pages),
                averageLoadTime: pages.reduce((sum, page) => sum + (page.technical.loadSpeed || 0), 0) / pages.length
            },
            
            topPerformers: pages
                .sort((a, b) => b.conversion.score - a.conversion.score)
                .slice(0, 10),
                
            elementAnalysis: this.analyzePageElements(pages),
            copyAnalysis: this.analyzeCopyPatterns(pages),
            technicalAnalysis: this.analyzeTechnicalAspects(pages),
            
            generatedAt: new Date().toISOString(),
            stats: this.collectionStats
        };
        
        return report;
    }

    /**
     * Obtém estatísticas do coletor
     */
    getStats() {
        return {
            ...this.collectionStats,
            uptime: Date.now() - this.startTime,
            status: 'active'
        };
    }
}

module.exports = LandingPageCollector;

