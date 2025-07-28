/**
 * ÍNDICE PRINCIPAL DOS AGENTES DE IA
 * Ponto de entrada central para todos os agentes de IA do sistema
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 * Versão: 2.0 - REVOLUTIONARY EDITION
 */

// Importar todos os agentes revolucionários
const VisualContentAnalyzerRevolutionary = require('./agents/visual_content_analyzer_revolutionary');
const ContentCopyAnalyzerRevolutionary = require('./agents/content_copy_analyzer_revolutionary');
const EngagementPatternAnalyzer = require('./agents/engagement_pattern_analyzer');
const TemplateGenerator = require('./agents/template_generator');
const ViralHooksAnalyzerRevolutionary = require('./agents/viral_hooks_analyzer_revolutionary');
const VisualTemplateExtractorRevolutionary = require('./agents/visual_template_extractor_revolutionary');
const TemplateManagerRevolutionary = require('./agents/template_manager_revolutionary');

// Importar agentes de análise específica
const ImageAnalyzer = require('./analysis/image/image_analyzer');
const SentimentAnalyzer = require('./analysis/sentiment/sentiment_analyzer');
const MetricsAnalyzer = require('./analysis/metrics/metrics_analyzer');

// Importar sistema de memória
const EvolutionaryMemory = require('./memory/evolutionary_memory');
const MemoryIntegration = require('./memory/memory_integration');

/**
 * Classe principal para gerenciar todos os agentes de IA
 */
class AIAgentsManager {
    constructor(config = {}) {
        this.config = {
            openaiApiKey: process.env.OPENAI_API_KEY,
            databaseUrl: process.env.DATABASE_URL,
            redisUrl: process.env.REDIS_URL,
            logLevel: process.env.LOG_LEVEL || 'info',
            ...config
        };
        
        // Inicializar agentes
        this.agents = {};
        this.analyzers = {};
        this.memory = null;
        
        this.initializeAgents();
    }
    
    /**
     * Inicializar todos os agentes de IA
     */
    initializeAgents() {
        try {
            // Agentes principais
            this.agents.visualContentAnalyzer = new VisualContentAnalyzerRevolutionary(this.config);
            this.agents.contentCopyAnalyzer = new ContentCopyAnalyzerRevolutionary(this.config);
            this.agents.engagementPatternAnalyzer = new EngagementPatternAnalyzer(this.config);
            this.agents.templateGenerator = new TemplateGenerator(this.config);
            this.agents.viralHooksAnalyzer = new ViralHooksAnalyzerRevolutionary(this.config);
            this.agents.visualTemplateExtractor = new VisualTemplateExtractorRevolutionary(this.config);
            this.agents.templateManager = new TemplateManagerRevolutionary(this.config);
            
            // Analisadores específicos
            this.analyzers.imageAnalyzer = new ImageAnalyzer(this.config);
            this.analyzers.sentimentAnalyzer = new SentimentAnalyzer(this.config);
            this.analyzers.metricsAnalyzer = new MetricsAnalyzer(this.config);
            
            // Sistema de memória
            this.memory = new EvolutionaryMemory(this.config);
            
            console.log('✅ Todos os agentes de IA inicializados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar agentes:', error);
            throw error;
        }
    }
    
    /**
     * Obter agente específico
     */
    getAgent(agentName) {
        if (this.agents[agentName]) {
            return this.agents[agentName];
        }
        
        if (this.analyzers[agentName]) {
            return this.analyzers[agentName];
        }
        
        throw new Error(`Agente não encontrado: ${agentName}`);
    }
    
    /**
     * Listar todos os agentes disponíveis
     */
    listAgents() {
        return {
            agents: Object.keys(this.agents),
            analyzers: Object.keys(this.analyzers),
            total: Object.keys(this.agents).length + Object.keys(this.analyzers).length
        };
    }
    
    /**
     * Executar análise completa de conteúdo
     */
    async analyzeContent(content, options = {}) {
        try {
            const results = {};
            
            // Análise visual se houver imagem
            if (content.image || content.visual) {
                results.visual = await this.agents.visualContentAnalyzer.analyzeContent(content);
            }
            
            // Análise de copy se houver texto
            if (content.text || content.copy) {
                results.copy = await this.agents.contentCopyAnalyzer.analyzeContent(content);
            }
            
            // Análise de hooks
            if (content.hooks || options.analyzeHooks) {
                results.hooks = await this.agents.viralHooksAnalyzer.analyzeHook(content);
            }
            
            // Análise de engajamento se houver métricas
            if (content.metrics || content.engagement) {
                results.engagement = await this.agents.engagementPatternAnalyzer.analyzeEngagement(content);
            }
            
            // Análise de sentimento
            if (content.text) {
                results.sentiment = await this.analyzers.sentimentAnalyzer.analyzeSentiment(content.text);
            }
            
            // Salvar na memória evolutiva
            if (this.memory) {
                await this.memory.storeAnalysis(results);
            }
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                content,
                analysis: results,
                summary: this.generateAnalysisSummary(results)
            };
            
        } catch (error) {
            console.error('Erro na análise de conteúdo:', error);
            throw error;
        }
    }
    
    /**
     * Gerar template de conteúdo
     */
    async generateTemplate(requirements) {
        try {
            return await this.agents.templateGenerator.generateTemplate(requirements);
        } catch (error) {
            console.error('Erro na geração de template:', error);
            throw error;
        }
    }
    
    /**
     * Extrair template de imagem
     */
    async extractTemplate(imagePath, metadata = {}) {
        try {
            return await this.agents.visualTemplateExtractor.extractTemplateFromImage(imagePath, metadata);
        } catch (error) {
            console.error('Erro na extração de template:', error);
            throw error;
        }
    }
    
    /**
     * Gerar conteúdo baseado em template
     */
    async generateContentFromTemplate(templateId, customizations = {}) {
        try {
            return await this.agents.templateManager.generateContentFromTemplate(templateId, customizations);
        } catch (error) {
            console.error('Erro na geração de conteúdo:', error);
            throw error;
        }
    }
    
    /**
     * Gerar resumo da análise
     */
    generateAnalysisSummary(results) {
        const summary = {
            overallScore: 0,
            strengths: [],
            weaknesses: [],
            recommendations: []
        };
        
        let totalScore = 0;
        let scoreCount = 0;
        
        // Calcular score geral
        Object.values(results).forEach(result => {
            if (result && result.score) {
                totalScore += result.score;
                scoreCount++;
            }
        });
        
        summary.overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
        
        // Identificar pontos fortes e fracos
        if (results.visual && results.visual.score > 80) {
            summary.strengths.push('Excelente apelo visual');
        }
        
        if (results.copy && results.copy.score > 80) {
            summary.strengths.push('Copy persuasiva e eficaz');
        }
        
        if (results.hooks && results.hooks.scores && results.hooks.scores.overall > 85) {
            summary.strengths.push('Hooks virais poderosos');
        }
        
        // Gerar recomendações
        if (summary.overallScore < 70) {
            summary.recommendations.push('Otimizar elementos visuais e textuais');
        }
        
        if (results.sentiment && results.sentiment.score < 60) {
            summary.recommendations.push('Melhorar tom emocional do conteúdo');
        }
        
        return summary;
    }
    
    /**
     * Obter estatísticas dos agentes
     */
    getAgentStats() {
        const stats = {
            totalAgents: Object.keys(this.agents).length + Object.keys(this.analyzers).length,
            agents: {},
            analyzers: {},
            memory: this.memory ? this.memory.getStats() : null
        };
        
        // Estatísticas dos agentes principais
        Object.entries(this.agents).forEach(([name, agent]) => {
            stats.agents[name] = {
                status: 'active',
                version: agent.version || '1.0',
                specialization: agent.specialization || 'general'
            };
        });
        
        // Estatísticas dos analisadores
        Object.entries(this.analyzers).forEach(([name, analyzer]) => {
            stats.analyzers[name] = {
                status: 'active',
                version: analyzer.version || '1.0'
            };
        });
        
        return stats;
    }
}

// Exportar classe principal e agentes individuais
module.exports = {
    AIAgentsManager,
    
    // Agentes principais
    VisualContentAnalyzerRevolutionary,
    ContentCopyAnalyzerRevolutionary,
    EngagementPatternAnalyzer,
    TemplateGenerator,
    ViralHooksAnalyzerRevolutionary,
    VisualTemplateExtractorRevolutionary,
    TemplateManagerRevolutionary,
    
    // Analisadores específicos
    ImageAnalyzer,
    SentimentAnalyzer,
    MetricsAnalyzer,
    
    // Sistema de memória
    EvolutionaryMemory,
    MemoryIntegration
};

// Se executado diretamente, inicializar sistema
if (require.main === module) {
    const manager = new AIAgentsManager();
    console.log('🚀 Sistema de Agentes IA inicializado');
    console.log('📊 Agentes disponíveis:', manager.listAgents());
}

