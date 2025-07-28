/**
 * SISTEMA DE COLETA POR LINKS
 * Especializado em coletar e analisar conteúdo a partir de links fornecidos
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const BaseScraper = require('../base_scraper');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

class LinkCollector extends BaseScraper {
    constructor(config) {
        super({
            ...config,
            scraperName: 'LinkCollector',
            description: 'Coleta conteúdo viral a partir de links individuais ou listas'
        });
        
        // Configurações específicas
        this.collectorConfig = {
            maxConcurrentCollections: 5,
            collectionTimeout: 30000,
            retryAttempts: 3,
            supportedPlatforms: [
                'instagram.com',
                'tiktok.com',
                'youtube.com',
                'linkedin.com',
                'facebook.com',
                'twitter.com',
                'x.com'
            ],
            contentTypes: {
                'instagram.com': ['post', 'reel', 'story', 'carousel'],
                'tiktok.com': ['video'],
                'youtube.com': ['video', 'short'],
                'linkedin.com': ['post', 'article'],
                'facebook.com': ['post', 'video', 'story'],
                'twitter.com': ['tweet', 'thread'],
                'x.com': ['tweet', 'thread']
            }
        };
        
        // Estatísticas de coleta
        this.collectionStats = {
            totalLinksProcessed: 0,
            successfulCollections: 0,
            failedCollections: 0,
            platformBreakdown: {},
            contentTypeBreakdown: {},
            averageProcessingTime: 0
        };
        
        // Fila de processamento
        this.processingQueue = [];
        this.isProcessing = false;
    }
    
    async collectFromLinks(links, options = {}) {
        try {
            this.logger.info(`🔗 Iniciando coleta de ${links.length} links`);
            
            // Validar e normalizar links
            const validLinks = await this.validateAndNormalizeLinks(links);
            this.logger.info(`✅ ${validLinks.length} links válidos encontrados`);
            
            // Processar links em lotes
            const batchSize = options.batchSize || this.collectorConfig.maxConcurrentCollections;
            const results = [];
            
            for (let i = 0; i < validLinks.length; i += batchSize) {
                const batch = validLinks.slice(i, i + batchSize);
                this.logger.info(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(validLinks.length/batchSize)}`);
                
                const batchResults = await this.processBatch(batch, options);
                results.push(...batchResults);
                
                // Delay entre lotes para evitar rate limiting
                if (i + batchSize < validLinks.length) {
                    await this.delay(2000);
                }
            }
            
            // Compilar resultados finais
            const finalResults = await this.compileCollectionResults(results, options);
            
            this.logger.info(`🎉 Coleta concluída: ${finalResults.successful}/${validLinks.length} sucessos`);
            return finalResults;
            
        } catch (error) {
            this.logger.error(`❌ Erro na coleta por links: ${error.message}`);
            throw error;
        }
    }
    
    async validateAndNormalizeLinks(links) {
        const validLinks = [];
        
        for (const link of links) {
            try {
                // Normalizar URL
                const normalizedUrl = this.normalizeUrl(link);
                
                // Verificar se é uma plataforma suportada
                const platform = this.identifyPlatform(normalizedUrl);
                if (!platform) {
                    this.logger.warn(`⚠️ Plataforma não suportada: ${link}`);
                    continue;
                }
                
                // Verificar se URL é acessível (verificação básica)
                if (await this.isUrlAccessible(normalizedUrl)) {
                    validLinks.push({
                        originalUrl: link,
                        normalizedUrl: normalizedUrl,
                        platform: platform,
                        contentType: this.inferContentType(normalizedUrl, platform),
                        priority: this.calculateLinkPriority(normalizedUrl, platform)
                    });
                } else {
                    this.logger.warn(`⚠️ URL inacessível: ${link}`);
                }
                
            } catch (error) {
                this.logger.warn(`⚠️ Erro ao validar link ${link}: ${error.message}`);
            }
        }
        
        // Ordenar por prioridade
        return validLinks.sort((a, b) => b.priority - a.priority);
    }
    
    normalizeUrl(link) {
        try {
            // Remover parâmetros desnecessários
            const parsedUrl = new URL(link);
            
            // Normalizar domínios
            let hostname = parsedUrl.hostname.toLowerCase();
            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }
            if (hostname === 'm.instagram.com') {
                hostname = 'instagram.com';
            }
            if (hostname === 'm.tiktok.com') {
                hostname = 'tiktok.com';
            }
            
            // Reconstruir URL limpa
            return `https://${hostname}${parsedUrl.pathname}`;
            
        } catch (error) {
            throw new Error(`URL inválida: ${link}`);
        }
    }
    
    identifyPlatform(normalizedUrl) {
        try {
            const hostname = new URL(normalizedUrl).hostname;
            return this.collectorConfig.supportedPlatforms.find(platform => 
                hostname.includes(platform.replace('.com', ''))
            );
        } catch (error) {
            return null;
        }
    }
    
    inferContentType(normalizedUrl, platform) {
        const pathname = new URL(normalizedUrl).pathname.toLowerCase();
        
        switch (platform) {
            case 'instagram.com':
                if (pathname.includes('/reel/')) return 'reel';
                if (pathname.includes('/stories/')) return 'story';
                if (pathname.includes('/p/')) {
                    // Verificar se é carousel (será determinado durante scraping)
                    return 'post';
                }
                return 'post';
                
            case 'tiktok.com':
                if (pathname.includes('/video/')) return 'video';
                if (pathname.includes('/@')) return 'video';
                return 'video';
                
            case 'youtube.com':
                if (pathname.includes('/shorts/')) return 'short';
                if (pathname.includes('/watch')) return 'video';
                return 'video';
                
            case 'linkedin.com':
                if (pathname.includes('/pulse/')) return 'article';
                if (pathname.includes('/posts/')) return 'post';
                return 'post';
                
            case 'facebook.com':
                if (pathname.includes('/videos/')) return 'video';
                if (pathname.includes('/stories/')) return 'story';
                return 'post';
                
            case 'twitter.com':
            case 'x.com':
                return 'tweet';
                
            default:
                return 'unknown';
        }
    }
    
    calculateLinkPriority(normalizedUrl, platform) {
        let priority = 50; // Base
        
        // Prioridade por plataforma
        const platformPriorities = {
            'instagram.com': 90,
            'tiktok.com': 85,
            'youtube.com': 80,
            'linkedin.com': 70,
            'facebook.com': 75,
            'twitter.com': 65,
            'x.com': 65
        };
        
        priority += platformPriorities[platform] || 50;
        
        // Prioridade por tipo de conteúdo
        const contentType = this.inferContentType(normalizedUrl, platform);
        const contentPriorities = {
            'reel': 20,
            'video': 15,
            'short': 18,
            'carousel': 12,
            'post': 10,
            'story': 8,
            'tweet': 5
        };
        
        priority += contentPriorities[contentType] || 5;
        
        return priority;
    }
    
    async isUrlAccessible(url) {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Configurar timeout curto para verificação rápida
            page.setDefaultTimeout(5000);
            
            const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
            await browser.close();
            
            return response && response.status() < 400;
            
        } catch (error) {
            return false;
        }
    }
    
    async processBatch(linkBatch, options) {
        const promises = linkBatch.map(linkData => 
            this.collectSingleLink(linkData, options)
        );
        
        const results = await Promise.allSettled(promises);
        
        return results.map((result, index) => ({
            linkData: linkBatch[index],
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null
        }));
    }
    
    async collectSingleLink(linkData, options) {
        const startTime = Date.now();
        
        try {
            this.logger.info(`🔍 Coletando: ${linkData.normalizedUrl}`);
            
            // Selecionar scraper apropriado baseado na plataforma
            const scraper = await this.getScraperForPlatform(linkData.platform);
            
            // Executar coleta específica
            const contentData = await scraper.scrapeContent(linkData.normalizedUrl, {
                ...options,
                expectedContentType: linkData.contentType
            });
            
            // Enriquecer dados com informações do link
            const enrichedData = {
                ...contentData,
                collection_metadata: {
                    collected_at: new Date().toISOString(),
                    collection_method: 'link_collector',
                    original_url: linkData.originalUrl,
                    normalized_url: linkData.normalizedUrl,
                    processing_time_ms: Date.now() - startTime,
                    collector_agent: this.scraperName
                }
            };
            
            // Atualizar estatísticas
            this.updateCollectionStats(linkData.platform, linkData.contentType, true, Date.now() - startTime);
            
            this.logger.info(`✅ Coletado com sucesso: ${linkData.normalizedUrl}`);
            return enrichedData;
            
        } catch (error) {
            this.updateCollectionStats(linkData.platform, linkData.contentType, false, Date.now() - startTime);
            this.logger.error(`❌ Erro ao coletar ${linkData.normalizedUrl}: ${error.message}`);
            throw error;
        }
    }
    
    async getScraperForPlatform(platform) {
        // Importar scrapers específicos dinamicamente
        switch (platform) {
            case 'instagram.com':
                const InstagramScraper = require('../platforms/instagram_scraper');
                return new InstagramScraper(this.config);
                
            case 'tiktok.com':
                const TikTokScraper = require('../platforms/tiktok_scraper');
                return new TikTokScraper(this.config);
                
            case 'youtube.com':
                const YouTubeScraper = require('../platforms/youtube_scraper');
                return new YouTubeScraper(this.config);
                
            case 'linkedin.com':
                const LinkedInScraper = require('../platforms/linkedin_scraper');
                return new LinkedInScraper(this.config);
                
            default:
                // Usar scraper genérico
                const GenericScraper = require('../platforms/generic_scraper');
                return new GenericScraper(this.config);
        }
    }
    
    async compileCollectionResults(results, options) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        // Compilar dados coletados
        const collectedContent = successful.map(r => r.data);
        
        // Gerar relatório de coleta
        const collectionReport = {
            summary: {
                total_links: results.length,
                successful: successful.length,
                failed: failed.length,
                success_rate: ((successful.length / results.length) * 100).toFixed(2) + '%'
            },
            platform_breakdown: this.generatePlatformBreakdown(successful),
            content_type_breakdown: this.generateContentTypeBreakdown(successful),
            failed_links: failed.map(f => ({
                url: f.linkData.originalUrl,
                platform: f.linkData.platform,
                error: f.error
            })),
            collection_metadata: {
                collected_at: new Date().toISOString(),
                collection_options: options,
                total_processing_time_ms: successful.reduce((sum, r) => 
                    sum + (r.data.collection_metadata?.processing_time_ms || 0), 0
                )
            }
        };
        
        // Salvar relatório se solicitado
        if (options.saveReport) {
            await this.saveCollectionReport(collectionReport);
        }
        
        return {
            content: collectedContent,
            report: collectionReport,
            successful: successful.length,
            failed: failed.length
        };
    }
    
    generatePlatformBreakdown(successfulResults) {
        const breakdown = {};
        
        successfulResults.forEach(result => {
            const platform = result.linkData.platform;
            if (!breakdown[platform]) {
                breakdown[platform] = {
                    count: 0,
                    content_types: {},
                    avg_processing_time: 0
                };
            }
            
            breakdown[platform].count++;
            
            const contentType = result.linkData.contentType;
            breakdown[platform].content_types[contentType] = 
                (breakdown[platform].content_types[contentType] || 0) + 1;
            
            const processingTime = result.data.collection_metadata?.processing_time_ms || 0;
            breakdown[platform].avg_processing_time = 
                (breakdown[platform].avg_processing_time + processingTime) / breakdown[platform].count;
        });
        
        return breakdown;
    }
    
    generateContentTypeBreakdown(successfulResults) {
        const breakdown = {};
        
        successfulResults.forEach(result => {
            const contentType = result.linkData.contentType;
            if (!breakdown[contentType]) {
                breakdown[contentType] = {
                    count: 0,
                    platforms: {},
                    avg_engagement: 0
                };
            }
            
            breakdown[contentType].count++;
            
            const platform = result.linkData.platform;
            breakdown[contentType].platforms[platform] = 
                (breakdown[contentType].platforms[platform] || 0) + 1;
            
            // Calcular engajamento médio se disponível
            const metrics = result.data.metrics;
            if (metrics) {
                const engagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
                breakdown[contentType].avg_engagement = 
                    (breakdown[contentType].avg_engagement + engagement) / breakdown[contentType].count;
            }
        });
        
        return breakdown;
    }
    
    async saveCollectionReport(report) {
        try {
            const reportsDir = '/home/ubuntu/viral_content_scraper/storage/collection_reports';
            await fs.mkdir(reportsDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `collection_report_${timestamp}.json`;
            const filepath = path.join(reportsDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            
            this.logger.info(`📊 Relatório de coleta salvo: ${filepath}`);
            
        } catch (error) {
            this.logger.error(`❌ Erro ao salvar relatório: ${error.message}`);
        }
    }
    
    updateCollectionStats(platform, contentType, success, processingTime) {
        this.collectionStats.totalLinksProcessed++;
        
        if (success) {
            this.collectionStats.successfulCollections++;
        } else {
            this.collectionStats.failedCollections++;
        }
        
        // Atualizar breakdown por plataforma
        if (!this.collectionStats.platformBreakdown[platform]) {
            this.collectionStats.platformBreakdown[platform] = { success: 0, failed: 0 };
        }
        this.collectionStats.platformBreakdown[platform][success ? 'success' : 'failed']++;
        
        // Atualizar breakdown por tipo de conteúdo
        if (!this.collectionStats.contentTypeBreakdown[contentType]) {
            this.collectionStats.contentTypeBreakdown[contentType] = { success: 0, failed: 0 };
        }
        this.collectionStats.contentTypeBreakdown[contentType][success ? 'success' : 'failed']++;
        
        // Atualizar tempo médio de processamento
        this.collectionStats.averageProcessingTime = 
            (this.collectionStats.averageProcessingTime + processingTime) / 2;
    }
    
    // Método para coletar de arquivo de links
    async collectFromFile(filePath, options = {}) {
        try {
            this.logger.info(`📁 Carregando links do arquivo: ${filePath}`);
            
            const fileContent = await fs.readFile(filePath, 'utf8');
            const links = this.parseLinksFromFile(fileContent, options.fileFormat);
            
            this.logger.info(`📋 ${links.length} links encontrados no arquivo`);
            
            return await this.collectFromLinks(links, options);
            
        } catch (error) {
            this.logger.error(`❌ Erro ao coletar do arquivo: ${error.message}`);
            throw error;
        }
    }
    
    parseLinksFromFile(content, format = 'auto') {
        const links = [];
        
        if (format === 'json' || (format === 'auto' && content.trim().startsWith('{'))) {
            // Arquivo JSON
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                links.push(...data);
            } else if (data.links && Array.isArray(data.links)) {
                links.push(...data.links);
            }
        } else if (format === 'csv' || (format === 'auto' && content.includes(','))) {
            // Arquivo CSV
            const lines = content.split('\n');
            lines.forEach(line => {
                const columns = line.split(',');
                const url = columns[0]?.trim();
                if (url && url.startsWith('http')) {
                    links.push(url);
                }
            });
        } else {
            // Arquivo de texto simples (um link por linha)
            const lines = content.split('\n');
            lines.forEach(line => {
                const url = line.trim();
                if (url && url.startsWith('http')) {
                    links.push(url);
                }
            });
        }
        
        return links.filter(link => link && typeof link === 'string');
    }
    
    // Método para adicionar links à fila de processamento
    async addToQueue(links, options = {}) {
        const validLinks = await this.validateAndNormalizeLinks(Array.isArray(links) ? links : [links]);
        
        validLinks.forEach(linkData => {
            this.processingQueue.push({
                ...linkData,
                options: options,
                addedAt: new Date().toISOString()
            });
        });
        
        this.logger.info(`📥 ${validLinks.length} links adicionados à fila (total: ${this.processingQueue.length})`);
        
        // Iniciar processamento se não estiver rodando
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    async processQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        this.logger.info(`🔄 Iniciando processamento da fila (${this.processingQueue.length} itens)`);
        
        try {
            while (this.processingQueue.length > 0) {
                const batch = this.processingQueue.splice(0, this.collectorConfig.maxConcurrentCollections);
                
                const promises = batch.map(queueItem => 
                    this.collectSingleLink(queueItem, queueItem.options)
                        .catch(error => ({ error: error.message, linkData: queueItem }))
                );
                
                await Promise.all(promises);
                
                // Delay entre lotes
                if (this.processingQueue.length > 0) {
                    await this.delay(1000);
                }
            }
            
        } catch (error) {
            this.logger.error(`❌ Erro no processamento da fila: ${error.message}`);
        } finally {
            this.isProcessing = false;
            this.logger.info(`✅ Processamento da fila concluído`);
        }
    }
    
    getCollectionStats() {
        return {
            ...this.collectionStats,
            queue_size: this.processingQueue.length,
            is_processing: this.isProcessing,
            scraper_name: this.scraperName,
            last_updated: new Date().toISOString()
        };
    }
    
    // Método para parar processamento da fila
    stopQueueProcessing() {
        this.isProcessing = false;
        this.logger.info(`⏹️ Processamento da fila interrompido`);
    }
    
    // Método para limpar fila
    clearQueue() {
        const queueSize = this.processingQueue.length;
        this.processingQueue = [];
        this.logger.info(`🗑️ Fila limpa (${queueSize} itens removidos)`);
    }
}

module.exports = LinkCollector;

