const winston = require('winston');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs').promises;

// Importar scrapers
const InstagramScraper = require('./platforms/instagram_scraper');
const TikTokScraper = require('./platforms/tiktok_scraper');

// Importar utilitários
const { delay } = require('./utils/helpers');

/**
 * Sistema principal de coordenação de scraping
 * Gerencia múltiplos scrapers e execução agendada
 */
class ViralContentScrapingSystem {
    constructor(config = {}) {
        this.config = {
            // Configurações gerais
            maxConcurrentScrapers: 3,
            defaultMaxItems: 100,
            defaultMinLikes: 1000,
            
            // Configurações de agendamento
            schedulingEnabled: true,
            cronSchedule: '0 */6 * * *', // A cada 6 horas
            
            // Configurações de armazenamento
            dataRetentionDays: 30,
            maxFileSize: 100 * 1024 * 1024, // 100MB
            
            ...config
        };

        // Configurar logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `${timestamp} [${level.toUpperCase()}] [SYSTEM] ${message}${stack ? '\n' + stack : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../logs/system.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                })
            ]
        });

        // Scrapers disponíveis
        this.availableScrapers = {
            instagram: InstagramScraper,
            tiktok: TikTokScraper
            // Outros scrapers serão adicionados aqui
        };

        this.activeScrapers = new Map();
        this.scrapingStats = {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            totalItemsCollected: 0,
            lastRun: null,
            nextRun: null
        };

        this.isRunning = false;
        this.scheduledTask = null;
    }

    /**
     * Inicializa o sistema de scraping
     */
    async initialize() {
        try {
            this.logger.info('Inicializando sistema de scraping...');
            
            // Criar diretórios necessários
            await this.createDirectories();
            
            // Configurar agendamento se habilitado
            if (this.config.schedulingEnabled) {
                this.setupScheduling();
            }
            
            this.logger.info('Sistema de scraping inicializado com sucesso');
            
        } catch (error) {
            this.logger.error('Erro ao inicializar sistema:', error);
            throw error;
        }
    }

    /**
     * Cria diretórios necessários
     */
    async createDirectories() {
        const directories = [
            '../logs',
            '../storage/data',
            '../storage/screenshots',
            '../storage/reports'
        ];

        for (const dir of directories) {
            const fullPath = path.join(__dirname, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }
    }

    /**
     * Configura agendamento automático
     */
    setupScheduling() {
        try {
            this.scheduledTask = cron.schedule(this.config.cronSchedule, async () => {
                if (!this.isRunning) {
                    this.logger.info('Executando scraping agendado...');
                    await this.runFullScraping();
                } else {
                    this.logger.warn('Scraping já em execução, pulando execução agendada');
                }
            }, {
                scheduled: false,
                timezone: 'America/Sao_Paulo'
            });

            this.scheduledTask.start();
            this.logger.info(`Agendamento configurado: ${this.config.cronSchedule}`);
            
        } catch (error) {
            this.logger.error('Erro ao configurar agendamento:', error);
        }
    }

    /**
     * Executa scraping completo de todas as plataformas
     */
    async runFullScraping(options = {}) {
        if (this.isRunning) {
            this.logger.warn('Scraping já em execução');
            return;
        }

        this.isRunning = true;
        this.scrapingStats.totalRuns++;
        this.scrapingStats.lastRun = new Date();

        try {
            this.logger.info('Iniciando scraping completo...');
            
            const platforms = options.platforms || ['instagram', 'tiktok'];
            const results = {};
            
            // Executar scrapers em paralelo (limitado)
            const scrapingPromises = platforms.map(platform => 
                this.runPlatformScraping(platform, options)
            );
            
            const platformResults = await Promise.allSettled(scrapingPromises);
            
            // Processar resultados
            platformResults.forEach((result, index) => {
                const platform = platforms[index];
                
                if (result.status === 'fulfilled') {
                    results[platform] = result.value;
                    this.scrapingStats.totalItemsCollected += result.value.totalCollected || 0;
                } else {
                    results[platform] = {
                        error: result.reason.message,
                        totalCollected: 0
                    };
                    this.logger.error(`Erro no scraping de ${platform}:`, result.reason);
                }
            });

            // Gerar relatório
            const report = await this.generateReport(results);
            
            this.scrapingStats.successfulRuns++;
            this.logger.info('Scraping completo concluído com sucesso');
            
            return {
                success: true,
                results,
                report,
                stats: this.getStats()
            };

        } catch (error) {
            this.scrapingStats.failedRuns++;
            this.logger.error('Erro no scraping completo:', error);
            
            return {
                success: false,
                error: error.message,
                stats: this.getStats()
            };
            
        } finally {
            this.isRunning = false;
            
            // Agendar próxima execução
            if (this.config.schedulingEnabled) {
                this.calculateNextRun();
            }
        }
    }

    /**
     * Executa scraping de uma plataforma específica
     */
    async runPlatformScraping(platform, options = {}) {
        try {
            this.logger.info(`Iniciando scraping de ${platform}...`);
            
            const ScraperClass = this.availableScrapers[platform];
            if (!ScraperClass) {
                throw new Error(`Scraper não encontrado para plataforma: ${platform}`);
            }

            const scraper = new ScraperClass(options.scraperConfig || {});
            this.activeScrapers.set(platform, scraper);

            const scrapingOptions = {
                maxItems: options.maxItems || this.config.defaultMaxItems,
                minLikes: options.minLikes || this.config.defaultMinLikes,
                contentTypes: options.contentTypes || ['trending', 'posts'],
                hashtags: options.hashtags || [],
                users: options.users || [],
                ...options.platformOptions?.[platform]
            };

            const results = await scraper.scrapeContent(scrapingOptions);
            
            this.activeScrapers.delete(platform);
            this.logger.info(`Scraping de ${platform} concluído: ${results.totalCollected} itens`);
            
            return results;

        } catch (error) {
            this.activeScrapers.delete(platform);
            this.logger.error(`Erro no scraping de ${platform}:`, error);
            throw error;
        }
    }

    /**
     * Executa scraping de hashtags específicas
     */
    async scrapeHashtags(hashtags, platforms = ['instagram', 'tiktok'], options = {}) {
        try {
            this.logger.info(`Scraping de hashtags: ${hashtags.join(', ')}`);
            
            const results = {};
            
            for (const platform of platforms) {
                try {
                    const platformResults = await this.runPlatformScraping(platform, {
                        ...options,
                        hashtags: hashtags,
                        maxItems: options.maxItems || 50
                    });
                    
                    results[platform] = platformResults;
                    
                } catch (error) {
                    results[platform] = { error: error.message };
                }
            }
            
            return results;
            
        } catch (error) {
            this.logger.error('Erro no scraping de hashtags:', error);
            throw error;
        }
    }

    /**
     * Executa scraping de usuários específicos
     */
    async scrapeUsers(users, platforms = ['instagram', 'tiktok'], options = {}) {
        try {
            this.logger.info(`Scraping de usuários: ${users.join(', ')}`);
            
            const results = {};
            
            for (const platform of platforms) {
                try {
                    const platformResults = await this.runPlatformScraping(platform, {
                        ...options,
                        users: users,
                        maxItems: options.maxItems || 30
                    });
                    
                    results[platform] = platformResults;
                    
                } catch (error) {
                    results[platform] = { error: error.message };
                }
            }
            
            return results;
            
        } catch (error) {
            this.logger.error('Erro no scraping de usuários:', error);
            throw error;
        }
    }

    /**
     * Gera relatório dos resultados de scraping
     */
    async generateReport(results) {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalPlatforms: Object.keys(results).length,
                    totalItems: 0,
                    successfulPlatforms: 0,
                    failedPlatforms: 0
                },
                platforms: {},
                topContent: {
                    mostLiked: [],
                    mostShared: [],
                    trendingHashtags: {}
                }
            };

            // Analisar resultados por plataforma
            for (const [platform, data] of Object.entries(results)) {
                if (data.error) {
                    report.summary.failedPlatforms++;
                    report.platforms[platform] = { error: data.error };
                    continue;
                }

                report.summary.successfulPlatforms++;
                report.summary.totalItems += data.totalCollected || 0;

                // Análise detalhada da plataforma
                const platformAnalysis = this.analyzePlatformData(data);
                report.platforms[platform] = platformAnalysis;

                // Agregar conteúdo top
                this.aggregateTopContent(data, report.topContent);
            }

            // Salvar relatório
            const reportPath = path.join(__dirname, '../storage/reports', `report_${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            
            this.logger.info(`Relatório gerado: ${reportPath}`);
            return report;

        } catch (error) {
            this.logger.error('Erro ao gerar relatório:', error);
            return null;
        }
    }

    /**
     * Analisa dados de uma plataforma
     */
    analyzePlatformData(data) {
        const analysis = {
            totalItems: data.totalCollected || 0,
            contentTypes: {},
            avgMetrics: {
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0
            },
            topHashtags: {},
            errors: data.errors || []
        };

        // Consolidar todos os itens
        const allItems = [];
        
        if (data.trending) allItems.push(...data.trending);
        if (data.posts) allItems.push(...data.posts);
        if (data.reels) allItems.push(...data.reels);
        if (data.discover) allItems.push(...data.discover);

        if (allItems.length === 0) return analysis;

        // Analisar tipos de conteúdo
        allItems.forEach(item => {
            const type = item.contentType || 'unknown';
            analysis.contentTypes[type] = (analysis.contentTypes[type] || 0) + 1;
            
            // Agregar hashtags
            if (item.hashtags) {
                item.hashtags.forEach(hashtag => {
                    analysis.topHashtags[hashtag] = (analysis.topHashtags[hashtag] || 0) + 1;
                });
            }
        });

        // Calcular métricas médias
        const totalMetrics = allItems.reduce((acc, item) => {
            if (item.metrics) {
                acc.likes += item.metrics.likes || 0;
                acc.comments += item.metrics.comments || 0;
                acc.shares += item.metrics.shares || 0;
                acc.views += item.metrics.views || 0;
            }
            return acc;
        }, { likes: 0, comments: 0, shares: 0, views: 0 });

        analysis.avgMetrics = {
            likes: Math.round(totalMetrics.likes / allItems.length),
            comments: Math.round(totalMetrics.comments / allItems.length),
            shares: Math.round(totalMetrics.shares / allItems.length),
            views: Math.round(totalMetrics.views / allItems.length)
        };

        return analysis;
    }

    /**
     * Agrega conteúdo top entre plataformas
     */
    aggregateTopContent(data, topContent) {
        const allItems = [];
        
        if (data.trending) allItems.push(...data.trending);
        if (data.posts) allItems.push(...data.posts);
        if (data.reels) allItems.push(...data.reels);

        // Top por likes
        const sortedByLikes = allItems
            .filter(item => item.metrics && item.metrics.likes)
            .sort((a, b) => b.metrics.likes - a.metrics.likes)
            .slice(0, 10);
        
        topContent.mostLiked.push(...sortedByLikes);

        // Top por shares
        const sortedByShares = allItems
            .filter(item => item.metrics && item.metrics.shares)
            .sort((a, b) => b.metrics.shares - a.metrics.shares)
            .slice(0, 10);
        
        topContent.mostShared.push(...sortedByShares);

        // Hashtags trending
        allItems.forEach(item => {
            if (item.hashtags) {
                item.hashtags.forEach(hashtag => {
                    topContent.trendingHashtags[hashtag] = (topContent.trendingHashtags[hashtag] || 0) + 1;
                });
            }
        });
    }

    /**
     * Calcula próxima execução agendada
     */
    calculateNextRun() {
        try {
            // Implementação simplificada - em produção usar biblioteca de cron mais avançada
            const now = new Date();
            const nextRun = new Date(now.getTime() + 6 * 60 * 60 * 1000); // +6 horas
            this.scrapingStats.nextRun = nextRun;
            
        } catch (error) {
            this.logger.error('Erro ao calcular próxima execução:', error);
        }
    }

    /**
     * Obtém estatísticas do sistema
     */
    getStats() {
        return {
            ...this.scrapingStats,
            isRunning: this.isRunning,
            activeScrapers: Array.from(this.activeScrapers.keys()),
            availablePlatforms: Object.keys(this.availableScrapers),
            config: {
                schedulingEnabled: this.config.schedulingEnabled,
                cronSchedule: this.config.cronSchedule,
                maxConcurrentScrapers: this.config.maxConcurrentScrapers
            }
        };
    }

    /**
     * Para execução agendada
     */
    stopScheduling() {
        if (this.scheduledTask) {
            this.scheduledTask.stop();
            this.logger.info('Agendamento parado');
        }
    }

    /**
     * Reinicia execução agendada
     */
    startScheduling() {
        if (this.scheduledTask) {
            this.scheduledTask.start();
            this.logger.info('Agendamento reiniciado');
        }
    }

    /**
     * Para todos os scrapers ativos
     */
    async stopAllScrapers() {
        try {
            this.logger.info('Parando todos os scrapers ativos...');
            
            const stopPromises = Array.from(this.activeScrapers.values()).map(scraper => 
                scraper.close().catch(error => 
                    this.logger.error('Erro ao parar scraper:', error)
                )
            );
            
            await Promise.allSettled(stopPromises);
            this.activeScrapers.clear();
            this.isRunning = false;
            
            this.logger.info('Todos os scrapers foram parados');
            
        } catch (error) {
            this.logger.error('Erro ao parar scrapers:', error);
        }
    }

    /**
     * Finaliza o sistema
     */
    async shutdown() {
        try {
            this.logger.info('Finalizando sistema de scraping...');
            
            this.stopScheduling();
            await this.stopAllScrapers();
            
            this.logger.info('Sistema finalizado com sucesso');
            
        } catch (error) {
            this.logger.error('Erro ao finalizar sistema:', error);
        }
    }
}

// Função principal para execução direta
async function main() {
    const system = new ViralContentScrapingSystem({
        schedulingEnabled: process.env.SCHEDULING_ENABLED !== 'false',
        cronSchedule: process.env.CRON_SCHEDULE || '0 */6 * * *'
    });

    try {
        await system.initialize();
        
        // Se executado diretamente, fazer um scraping completo
        if (require.main === module) {
            console.log('Executando scraping completo...');
            const results = await system.runFullScraping();
            console.log('Resultados:', JSON.stringify(results, null, 2));
        }
        
        // Manter sistema rodando para execuções agendadas
        process.on('SIGINT', async () => {
            console.log('Recebido SIGINT, finalizando sistema...');
            await system.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Recebido SIGTERM, finalizando sistema...');
            await system.shutdown();
            process.exit(0);
        });

    } catch (error) {
        console.error('Erro fatal:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = ViralContentScrapingSystem;

