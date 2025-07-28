/**
 * PIPELINE MANAGER - INTEGRAÇÃO END-TO-END
 * Orquestra todo o fluxo: Scraping → IA → Análise → Banco → API
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const { Pool } = require('pg');
const Redis = require('redis');
const path = require('path');
const fs = require('fs').promises;

// Importar scrapers
const InstagramScraper = require('./platforms/instagram_scraper');
const TikTokScraper = require('./platforms/tiktok_scraper');
const YouTubeScraper = require('./platforms/youtube_scraper');

// Importar agentes IA
const VisualContentAnalyzer = require('../ai_agents/src/agents/visual_content_analyzer_revolutionary');
const ContentCopyAnalyzer = require('../ai_agents/src/agents/content_copy_analyzer_revolutionary');
const ViralHooksAnalyzer = require('../ai_agents/src/agents/viral_hooks_analyzer_revolutionary');

class PipelineManager {
    constructor() {
        this.dbPool = null;
        this.redisClient = null;
        this.scrapers = new Map();
        this.agents = new Map();
        this.isRunning = false;
        
        this.initializeComponents();
    }
    
    async initializeComponents() {
        try {
            console.log('🚀 Inicializando Pipeline Manager...');
            
            // Inicializar conexão com PostgreSQL
            await this.initializeDatabase();
            
            // Inicializar Redis
            await this.initializeRedis();
            
            // Inicializar scrapers
            this.initializeScrapers();
            
            // Inicializar agentes IA
            this.initializeAgents();
            
            console.log('✅ Pipeline Manager inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Pipeline Manager:', error);
            throw error;
        }
    }
    
    async initializeDatabase() {
        try {
            this.dbPool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'viral_content_db',
                user: process.env.DB_USER || 'viral_user',
                password: process.env.DB_PASSWORD || 'viral_pass123',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
            
            // Testar conexão
            const client = await this.dbPool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            
            console.log('✅ Conexão PostgreSQL estabelecida:', result.rows[0].now);
            
        } catch (error) {
            console.error('❌ Erro ao conectar PostgreSQL:', error);
            throw error;
        }
    }
    
    async initializeRedis() {
        try {
            this.redisClient = Redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null,
            });
            
            await this.redisClient.connect();
            
            console.log('✅ Conexão Redis estabelecida');
            
        } catch (error) {
            console.error('❌ Erro ao conectar Redis:', error);
            // Redis é opcional, continuar sem ele
            this.redisClient = null;
        }
    }
    
    initializeScrapers() {
        try {
            this.scrapers.set('instagram', new InstagramScraper());
            this.scrapers.set('tiktok', new TikTokScraper());
            this.scrapers.set('youtube', new YouTubeScraper());
            
            console.log('✅ Scrapers inicializados:', Array.from(this.scrapers.keys()));
            
        } catch (error) {
            console.error('❌ Erro ao inicializar scrapers:', error);
            throw error;
        }
    }
    
    initializeAgents() {
        try {
            this.agents.set('visual', new VisualContentAnalyzer());
            this.agents.set('copy', new ContentCopyAnalyzer());
            this.agents.set('hooks', new ViralHooksAnalyzer());
            
            console.log('✅ Agentes IA inicializados:', Array.from(this.agents.keys()));
            
        } catch (error) {
            console.error('❌ Erro ao inicializar agentes IA:', error);
            throw error;
        }
    }
    
    /**
     * PIPELINE PRINCIPAL - EXECUÇÃO COMPLETA
     */
    async runFullPipeline(config = {}) {
        try {
            console.log('🚀 Iniciando Pipeline Completo...');
            
            const {
                platforms = ['instagram', 'tiktok'],
                targets = ['trending'],
                maxItems = 50,
                minViralScore = 70
            } = config;
            
            this.isRunning = true;
            const results = {
                scraped: 0,
                analyzed: 0,
                saved: 0,
                errors: []
            };
            
            // Fase 1: Scraping
            console.log('📥 Fase 1: Executando Scraping...');
            const scrapedContent = await this.executeScrapingPhase(platforms, targets, maxItems);
            results.scraped = scrapedContent.length;
            
            // Fase 2: Análise com IA
            console.log('🧠 Fase 2: Executando Análise com IA...');
            const analyzedContent = await this.executeAnalysisPhase(scrapedContent);
            results.analyzed = analyzedContent.length;
            
            // Fase 3: Filtragem por Score Viral
            console.log('🔍 Fase 3: Filtrando Conteúdo Viral...');
            const viralContent = analyzedContent.filter(content => 
                content.analysis?.viral_score >= minViralScore
            );
            
            // Fase 4: Salvamento no Banco
            console.log('💾 Fase 4: Salvando no Banco de Dados...');
            const savedContent = await this.executeSavingPhase(viralContent);
            results.saved = savedContent.length;
            
            // Fase 5: Cache e Indexação
            console.log('⚡ Fase 5: Atualizando Cache...');
            await this.updateCache(savedContent);
            
            this.isRunning = false;
            
            console.log('✅ Pipeline Completo Finalizado!');
            console.log('📊 Resultados:', results);
            
            return results;
            
        } catch (error) {
            this.isRunning = false;
            console.error('❌ Erro no Pipeline:', error);
            throw error;
        }
    }
    
    /**
     * FASE 1: SCRAPING
     */
    async executeScrapingPhase(platforms, targets, maxItems) {
        const allContent = [];
        
        for (const platform of platforms) {
            try {
                const scraper = this.scrapers.get(platform);
                if (!scraper) {
                    console.warn(`⚠️ Scraper não encontrado para: ${platform}`);
                    continue;
                }
                
                console.log(`📱 Executando scraping: ${platform}`);
                
                for (const target of targets) {
                    const content = await scraper.scrapeContent({
                        target,
                        maxItems: Math.floor(maxItems / platforms.length),
                        includeMedia: true,
                        analyzeEngagement: true
                    });
                    
                    // Adicionar metadados
                    const enrichedContent = content.map(item => ({
                        ...item,
                        platform,
                        scraped_at: new Date().toISOString(),
                        pipeline_id: this.generatePipelineId()
                    }));
                    
                    allContent.push(...enrichedContent);
                    
                    console.log(`✅ ${platform}: ${content.length} itens coletados`);
                }
                
            } catch (error) {
                console.error(`❌ Erro no scraping ${platform}:`, error);
            }
        }
        
        return allContent;
    }
    
    /**
     * FASE 2: ANÁLISE COM IA
     */
    async executeAnalysisPhase(content) {
        const analyzedContent = [];
        
        for (const item of content) {
            try {
                console.log(`🧠 Analisando: ${item.title?.substring(0, 50)}...`);
                
                const analysis = {
                    visual_analysis: null,
                    copy_analysis: null,
                    hooks_analysis: null,
                    viral_score: 0,
                    confidence: 0
                };
                
                // Análise Visual (se houver mídia)
                if (item.media_urls && item.media_urls.length > 0) {
                    const visualAgent = this.agents.get('visual');
                    analysis.visual_analysis = await visualAgent.analyzeContent({
                        media_urls: item.media_urls,
                        platform: item.platform,
                        content_type: item.content_type
                    });
                }
                
                // Análise de Copy
                if (item.title || item.description) {
                    const copyAgent = this.agents.get('copy');
                    analysis.copy_analysis = await copyAgent.analyzeContent({
                        title: item.title,
                        description: item.description,
                        hashtags: item.hashtags,
                        platform: item.platform
                    });
                }
                
                // Análise de Hooks
                if (item.title) {
                    const hooksAgent = this.agents.get('hooks');
                    analysis.hooks_analysis = await hooksAgent.analyzeContent({
                        hook_text: item.title,
                        platform: item.platform,
                        engagement_metrics: {
                            views: item.views_count,
                            likes: item.likes_count,
                            shares: item.shares_count
                        }
                    });
                }
                
                // Calcular Score Viral Agregado
                analysis.viral_score = this.calculateViralScore(analysis);
                analysis.confidence = this.calculateConfidence(analysis);
                
                analyzedContent.push({
                    ...item,
                    analysis,
                    analyzed_at: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`❌ Erro na análise:`, error);
                // Adicionar item sem análise
                analyzedContent.push({
                    ...item,
                    analysis: { error: error.message },
                    analyzed_at: new Date().toISOString()
                });
            }
        }
        
        return analyzedContent;
    }
    
    /**
     * FASE 3: SALVAMENTO NO BANCO
     */
    async executeSavingPhase(content) {
        const savedContent = [];
        
        for (const item of content) {
            try {
                // Salvar conteúdo principal
                const contentId = await this.saveContent(item);
                
                // Salvar análises
                if (item.analysis && !item.analysis.error) {
                    await this.saveAnalysis(contentId, item.analysis);
                }
                
                savedContent.push({
                    ...item,
                    id: contentId,
                    saved_at: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`❌ Erro ao salvar:`, error);
            }
        }
        
        return savedContent;
    }
    
    async saveContent(item) {
        const query = `
            INSERT INTO viral_content (
                platform, content_type, title, description, content_url,
                author_username, author_followers, views_count, likes_count,
                comments_count, shares_count, engagement_rate, viral_score,
                hashtags, mentions, media_urls, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
        `;
        
        const values = [
            item.platform,
            item.content_type || 'post',
            item.title,
            item.description,
            item.content_url,
            item.author_username,
            item.author_followers || 0,
            item.views_count || 0,
            item.likes_count || 0,
            item.comments_count || 0,
            item.shares_count || 0,
            item.engagement_rate || 0,
            item.analysis?.viral_score || 0,
            Array.isArray(item.hashtags) ? item.hashtags.join(',') : item.hashtags,
            Array.isArray(item.mentions) ? item.mentions.join(',') : item.mentions,
            item.media_urls || [],
            JSON.stringify(item.metadata || {})
        ];
        
        const result = await this.dbPool.query(query, values);
        return result.rows[0].id;
    }
    
    async saveAnalysis(contentId, analysis) {
        const analyses = [
            { type: 'visual', data: analysis.visual_analysis },
            { type: 'copy', data: analysis.copy_analysis },
            { type: 'hooks', data: analysis.hooks_analysis }
        ];
        
        for (const { type, data } of analyses) {
            if (data) {
                const query = `
                    INSERT INTO content_analysis (
                        content_id, agent_type, analysis_type, results,
                        confidence_score, insights, recommendations
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                
                const values = [
                    contentId,
                    type,
                    'automated',
                    JSON.stringify(data),
                    analysis.confidence || 0,
                    data.insights || [],
                    data.recommendations || []
                ];
                
                await this.dbPool.query(query, values);
            }
        }
    }
    
    /**
     * FASE 4: CACHE E INDEXAÇÃO
     */
    async updateCache(content) {
        if (!this.redisClient) return;
        
        try {
            // Cache de conteúdo viral recente
            const viralContent = content
                .filter(item => item.analysis?.viral_score >= 80)
                .slice(0, 100);
            
            await this.redisClient.setEx(
                'viral_content:recent',
                3600, // 1 hora
                JSON.stringify(viralContent)
            );
            
            // Cache de estatísticas por plataforma
            const platformStats = this.calculatePlatformStats(content);
            await this.redisClient.setEx(
                'platform_stats:current',
                1800, // 30 minutos
                JSON.stringify(platformStats)
            );
            
            console.log('✅ Cache atualizado');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar cache:', error);
        }
    }
    
    /**
     * UTILITÁRIOS
     */
    calculateViralScore(analysis) {
        let score = 0;
        let factors = 0;
        
        if (analysis.visual_analysis?.score) {
            score += analysis.visual_analysis.score * 0.3;
            factors++;
        }
        
        if (analysis.copy_analysis?.score) {
            score += analysis.copy_analysis.score * 0.3;
            factors++;
        }
        
        if (analysis.hooks_analysis?.viral_score) {
            score += analysis.hooks_analysis.viral_score * 0.4;
            factors++;
        }
        
        return factors > 0 ? Math.round(score / factors) : 0;
    }
    
    calculateConfidence(analysis) {
        const confidences = [];
        
        if (analysis.visual_analysis?.confidence) {
            confidences.push(analysis.visual_analysis.confidence);
        }
        
        if (analysis.copy_analysis?.confidence) {
            confidences.push(analysis.copy_analysis.confidence);
        }
        
        if (analysis.hooks_analysis?.confidence) {
            confidences.push(analysis.hooks_analysis.confidence);
        }
        
        return confidences.length > 0 
            ? confidences.reduce((a, b) => a + b) / confidences.length 
            : 0;
    }
    
    calculatePlatformStats(content) {
        const stats = {};
        
        for (const item of content) {
            if (!stats[item.platform]) {
                stats[item.platform] = {
                    total_content: 0,
                    viral_content: 0,
                    avg_score: 0,
                    total_views: 0
                };
            }
            
            const platform = stats[item.platform];
            platform.total_content++;
            
            if (item.analysis?.viral_score >= 80) {
                platform.viral_content++;
            }
            
            platform.avg_score += item.analysis?.viral_score || 0;
            platform.total_views += item.views_count || 0;
        }
        
        // Calcular médias
        for (const platform of Object.values(stats)) {
            platform.avg_score = Math.round(platform.avg_score / platform.total_content);
        }
        
        return stats;
    }
    
    generatePipelineId() {
        return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * MÉTODOS DE CONTROLE
     */
    async startScheduledPipeline(interval = 3600000) { // 1 hora
        console.log(`⏰ Iniciando pipeline agendado (intervalo: ${interval/1000/60} minutos)`);
        
        const runPipeline = async () => {
            if (!this.isRunning) {
                try {
                    await this.runFullPipeline();
                } catch (error) {
                    console.error('❌ Erro no pipeline agendado:', error);
                }
            }
        };
        
        // Executar imediatamente
        await runPipeline();
        
        // Agendar execuções futuras
        return setInterval(runPipeline, interval);
    }
    
    async stopPipeline() {
        this.isRunning = false;
        console.log('⏹️ Pipeline interrompido');
    }
    
    async getStatus() {
        return {
            isRunning: this.isRunning,
            database: this.dbPool ? 'connected' : 'disconnected',
            redis: this.redisClient ? 'connected' : 'disconnected',
            scrapers: Array.from(this.scrapers.keys()),
            agents: Array.from(this.agents.keys()),
            timestamp: new Date().toISOString()
        };
    }
    
    async cleanup() {
        try {
            if (this.dbPool) {
                await this.dbPool.end();
            }
            
            if (this.redisClient) {
                await this.redisClient.quit();
            }
            
            console.log('✅ Pipeline Manager limpo');
            
        } catch (error) {
            console.error('❌ Erro na limpeza:', error);
        }
    }
}

module.exports = PipelineManager;

