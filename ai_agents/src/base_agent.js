const { OpenAI } = require('openai');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;
const MemoryIntegration = require('./memory/memory_integration');

/**
 * Classe base para todos os agentes de IA especializados
 * Fornece funcionalidades comuns como comunicação com OpenAI,
 * cache de análises, logging, gerenciamento de memória e aprendizado evolutivo
 */
class BaseAgent {
    constructor(agentName, config = {}) {
        this.agentName = agentName;
        this.config = {
            model: 'gpt-4-turbo-preview',
            maxTokens: 4000,
            temperature: 0.3,
            cacheEnabled: true,
            maxRetries: 3,
            retryDelay: 1000,
            memoryEnabled: true,
            learningEnabled: true,
            ...config
        };

        // Configurar OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_API_BASE
        });

        // Inicializar sistema de memória evolutiva
        if (this.config.memoryEnabled) {
            this.memoryIntegration = new MemoryIntegration({
                enableLearning: this.config.learningEnabled,
                enableEvolution: true,
                learningThreshold: 0.7
            });
        }

        // Configurar logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `${timestamp} [${level.toUpperCase()}] [${this.agentName}] ${message}${stack ? '\n' + stack : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../logs/agents.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                })
            ]
        });

        // Cache de análises
        this.analysisCache = new Map();
        this.memoryStore = new Map();
        
        // Estatísticas
        this.stats = {
            totalAnalyses: 0,
            successfulAnalyses: 0,
            failedAnalyses: 0,
            cacheHits: 0,
            totalTokensUsed: 0,
            avgResponseTime: 0,
            memoryEnhancedAnalyses: 0,
            learningEvents: 0,
            startTime: new Date()
        };

        // Prompt mestre - deve ser definido pela classe filha
        this.masterPrompt = '';
        
        // Flag de inicialização
        this.initialized = false;
    }

    /**
     * Inicializa o agente e seus sistemas
     */
    async initialize() {
        try {
            if (this.initialized) return;
            
            this.logger.info(`Inicializando agente ${this.agentName}...`);
            
            // Inicializar sistema de memória se habilitado
            if (this.config.memoryEnabled && this.memoryIntegration) {
                await this.memoryIntegration.initialize();
                this.logger.info('Sistema de memória evolutiva inicializado');
            }
            
            this.initialized = true;
            this.logger.info(`Agente ${this.agentName} inicializado com sucesso`);
            
        } catch (error) {
            this.logger.error('Erro ao inicializar agente:', error);
            throw error;
        }
    }

    /**
     * Analisa conteúdo usando o prompt mestre do agente com memória evolutiva
     */
    async analyzeContent(content, options = {}) {
        const startTime = Date.now();
        this.stats.totalAnalyses++;

        try {
            // Garantir que o agente está inicializado
            if (!this.initialized) {
                await this.initialize();
            }

            this.logger.info(`Iniciando análise de conteúdo: ${content.id || 'unknown'}`);

            // Verificar cache se habilitado
            if (this.config.cacheEnabled) {
                const cacheKey = this.generateCacheKey(content, options);
                const cachedResult = this.analysisCache.get(cacheKey);
                
                if (cachedResult) {
                    this.stats.cacheHits++;
                    this.logger.info('Resultado encontrado no cache');
                    return cachedResult;
                }
            }

            // Enriquecer análise com memória evolutiva
            let enhancedOptions = options;
            if (this.config.memoryEnabled && this.memoryIntegration) {
                enhancedOptions = await this.memoryIntegration.enhanceAnalysisWithMemory(
                    this.agentName, 
                    content, 
                    options
                );
                this.stats.memoryEnhancedAnalyses++;
                this.logger.info('Análise enriquecida com memória evolutiva');
            }

            // Preparar dados para análise
            const analysisData = await this.prepareAnalysisData(content, enhancedOptions);
            
            // Executar análise com retry
            const result = await this.executeAnalysisWithRetry(analysisData, enhancedOptions);
            
            // Processar resultado
            const processedResult = await this.processAnalysisResult(result, content);
            
            // Registrar resultado na memória evolutiva para aprendizado
            if (this.config.learningEnabled && this.memoryIntegration) {
                await this.memoryIntegration.recordAnalysisResult(
                    this.agentName,
                    content,
                    processedResult
                );
                this.stats.learningEvents++;
                this.logger.info('Resultado registrado na memória evolutiva');
            }
            
            // Adaptar para nicho específico se necessário
            if (options.niche && options.niche !== 'general' && this.memoryIntegration) {
                processedResult.adaptedResult = await this.memoryIntegration.adaptAnalysisToNiche(
                    this.agentName,
                    processedResult,
                    options.niche
                );
            }
            
            // Salvar no cache
            if (this.config.cacheEnabled) {
                const cacheKey = this.generateCacheKey(content, options);
                this.analysisCache.set(cacheKey, processedResult);
            }

            // Atualizar estatísticas
            this.stats.successfulAnalyses++;
            const responseTime = Date.now() - startTime;
            this.updateResponseTimeStats(responseTime);

            this.logger.info(`Análise concluída em ${responseTime}ms`);
            return processedResult;

        } catch (error) {
            this.stats.failedAnalyses++;
            this.logger.error('Erro na análise de conteúdo:', error);
            
            return {
                success: false,
                error: error.message,
                agentName: this.agentName,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Prepara dados para análise
     */
    async prepareAnalysisData(content, options) {
        const analysisData = {
            content: {
                id: content.id || 'unknown',
                platform: content.platform || 'unknown',
                contentType: content.contentType || 'unknown',
                text: content.description || content.caption || content.title || '',
                url: content.url || '',
                author: content.author || 'unknown',
                metrics: content.metrics || {},
                hashtags: content.hashtags || [],
                mentions: content.mentions || [],
                timestamp: content.timestamp || new Date().toISOString()
            },
            options: {
                language: options.language || 'pt',
                niche: options.niche || 'general',
                analysisDepth: options.analysisDepth || 'standard',
                includeRecommendations: options.includeRecommendations !== false,
                ...options
            },
            context: await this.getRelevantContext(content, options)
        };

        return analysisData;
    }

    /**
     * Executa análise com sistema de retry
     */
    async executeAnalysisWithRetry(analysisData, options) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                this.logger.info(`Tentativa ${attempt}/${this.config.maxRetries} de análise`);
                
                const result = await this.callOpenAI(analysisData, options);
                return result;
                
            } catch (error) {
                lastError = error;
                this.logger.warn(`Tentativa ${attempt} falhou:`, error.message);
                
                if (attempt < this.config.maxRetries) {
                    const delay = this.config.retryDelay * attempt;
                    this.logger.info(`Aguardando ${delay}ms antes da próxima tentativa...`);
                    await this.delay(delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Chama API da OpenAI
     */
    async callOpenAI(analysisData, options) {
        const messages = [
            {
                role: 'system',
                content: this.masterPrompt
            },
            {
                role: 'user',
                content: this.formatAnalysisPrompt(analysisData, options)
            }
        ];

        const response = await this.openai.chat.completions.create({
            model: this.config.model,
            messages: messages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            response_format: { type: "json_object" }
        });

        // Atualizar estatísticas de tokens
        if (response.usage) {
            this.stats.totalTokensUsed += response.usage.total_tokens;
        }

        const content = response.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch (error) {
            this.logger.error('Erro ao parsear resposta JSON:', error);
            throw new Error('Resposta da IA não está em formato JSON válido');
        }
    }

    /**
     * Formata prompt para análise - deve ser implementado pela classe filha
     */
    formatAnalysisPrompt(analysisData, options) {
        throw new Error('Método formatAnalysisPrompt deve ser implementado pela classe filha');
    }

    /**
     * Processa resultado da análise
     */
    async processAnalysisResult(result, originalContent) {
        const processedResult = {
            success: true,
            agentName: this.agentName,
            contentId: originalContent.id,
            platform: originalContent.platform,
            analysisTimestamp: new Date().toISOString(),
            result: result,
            confidence: this.calculateConfidence(result),
            metadata: {
                model: this.config.model,
                tokensUsed: this.stats.totalTokensUsed,
                version: '1.0.0'
            }
        };

        // Salvar análise se configurado
        if (this.config.saveAnalyses) {
            await this.saveAnalysis(processedResult);
        }

        return processedResult;
    }

    /**
     * Calcula confiança da análise
     */
    calculateConfidence(result) {
        // Implementação básica - pode ser sobrescrita pelas classes filhas
        let confidence = 0.8; // Base
        
        // Ajustar baseado na completude dos dados
        if (result.score !== undefined) confidence += 0.1;
        if (result.recommendations && result.recommendations.length > 0) confidence += 0.05;
        if (result.analysis && Object.keys(result.analysis).length > 3) confidence += 0.05;
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Obtém contexto relevante para análise
     */
    async getRelevantContext(content, options) {
        const context = {
            recentAnalyses: [],
            trendingTopics: [],
            platformContext: {},
            nicheContext: {}
        };

        try {
            // Buscar análises recentes similares
            const recentAnalyses = Array.from(this.analysisCache.values())
                .filter(analysis => 
                    analysis.platform === content.platform &&
                    analysis.contentType === content.contentType
                )
                .slice(-5);
            
            context.recentAnalyses = recentAnalyses;

            // Adicionar contexto específico do nicho se disponível
            if (options.niche && this.memoryStore.has(`niche_${options.niche}`)) {
                context.nicheContext = this.memoryStore.get(`niche_${options.niche}`);
            }

        } catch (error) {
            this.logger.warn('Erro ao obter contexto:', error);
        }

        return context;
    }

    /**
     * Gera chave de cache
     */
    generateCacheKey(content, options) {
        const keyData = {
            id: content.id,
            platform: content.platform,
            contentType: content.contentType,
            textHash: this.simpleHash(content.description || content.caption || ''),
            niche: options.niche || 'general',
            agent: this.agentName
        };
        
        return this.simpleHash(JSON.stringify(keyData));
    }

    /**
     * Hash simples para cache
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Salva análise em arquivo
     */
    async saveAnalysis(analysis) {
        try {
            const filename = `${this.agentName}_${analysis.contentId}_${Date.now()}.json`;
            const filepath = path.join(__dirname, '../storage/analyses', filename);
            
            // Criar diretório se não existir
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            
            await fs.writeFile(filepath, JSON.stringify(analysis, null, 2));
            this.logger.info(`Análise salva: ${filepath}`);
            
        } catch (error) {
            this.logger.error('Erro ao salvar análise:', error);
        }
    }

    /**
     * Aprende com análises anteriores
     */
    async learnFromAnalysis(analysis, feedback = null) {
        try {
            const learningKey = `learning_${analysis.platform}_${analysis.contentType}`;
            
            if (!this.memoryStore.has(learningKey)) {
                this.memoryStore.set(learningKey, {
                    patterns: [],
                    successfulStrategies: [],
                    commonMistakes: [],
                    lastUpdated: new Date().toISOString()
                });
            }
            
            const learningData = this.memoryStore.get(learningKey);
            
            // Extrair padrões da análise
            const patterns = this.extractPatterns(analysis);
            learningData.patterns.push(...patterns);
            
            // Se há feedback, incorporar
            if (feedback) {
                if (feedback.success) {
                    learningData.successfulStrategies.push(analysis.result);
                } else {
                    learningData.commonMistakes.push({
                        analysis: analysis.result,
                        error: feedback.error
                    });
                }
            }
            
            learningData.lastUpdated = new Date().toISOString();
            this.memoryStore.set(learningKey, learningData);
            
            this.logger.info('Aprendizado incorporado com sucesso');
            
        } catch (error) {
            this.logger.error('Erro no processo de aprendizado:', error);
        }
    }

    /**
     * Extrai padrões de uma análise
     */
    extractPatterns(analysis) {
        const patterns = [];
        
        try {
            const result = analysis.result;
            
            // Padrões de score
            if (result.score !== undefined) {
                patterns.push({
                    type: 'score_pattern',
                    value: result.score,
                    context: {
                        platform: analysis.platform,
                        contentType: analysis.contentType
                    }
                });
            }
            
            // Padrões de elementos identificados
            if (result.elements) {
                Object.entries(result.elements).forEach(([key, value]) => {
                    patterns.push({
                        type: 'element_pattern',
                        element: key,
                        value: value,
                        context: {
                            platform: analysis.platform,
                            contentType: analysis.contentType
                        }
                    });
                });
            }
            
        } catch (error) {
            this.logger.warn('Erro ao extrair padrões:', error);
        }
        
        return patterns;
    }

    /**
     * Adapta análise para nicho específico
     */
    async adaptToNiche(analysis, niche) {
        try {
            this.logger.info(`Adaptando análise para nicho: ${niche}`);
            
            const nicheContext = this.memoryStore.get(`niche_${niche}`) || {};
            
            // Aplicar adaptações específicas do nicho
            const adaptedAnalysis = {
                ...analysis,
                nicheAdaptation: {
                    niche: niche,
                    adaptedElements: {},
                    nicheSpecificInsights: [],
                    targetAudience: nicheContext.targetAudience || 'general',
                    adaptationTimestamp: new Date().toISOString()
                }
            };
            
            // Personalizar recomendações para o nicho
            if (analysis.result.recommendations) {
                adaptedAnalysis.result.recommendations = await this.adaptRecommendationsToNiche(
                    analysis.result.recommendations, 
                    niche, 
                    nicheContext
                );
            }
            
            return adaptedAnalysis;
            
        } catch (error) {
            this.logger.error('Erro na adaptação para nicho:', error);
            return analysis; // Retornar análise original em caso de erro
        }
    }

    /**
     * Adapta recomendações para nicho específico
     */
    async adaptRecommendationsToNiche(recommendations, niche, nicheContext) {
        // Implementação básica - pode ser sobrescrita pelas classes filhas
        return recommendations.map(rec => ({
            ...rec,
            nicheAdapted: true,
            niche: niche,
            adaptationNote: `Adaptado para ${niche}`
        }));
    }

    /**
     * Atualiza estatísticas de tempo de resposta
     */
    updateResponseTimeStats(responseTime) {
        const totalResponses = this.stats.successfulAnalyses;
        const currentAvg = this.stats.avgResponseTime;
        
        this.stats.avgResponseTime = ((currentAvg * (totalResponses - 1)) + responseTime) / totalResponses;
    }

    /**
     * Obtém estatísticas do agente
     */
    getStats() {
        const runtime = Date.now() - this.stats.startTime.getTime();
        
        return {
            ...this.stats,
            runtime: runtime,
            successRate: this.stats.totalAnalyses > 0 ? 
                (this.stats.successfulAnalyses / this.stats.totalAnalyses * 100).toFixed(2) : 0,
            cacheHitRate: this.stats.totalAnalyses > 0 ? 
                (this.stats.cacheHits / this.stats.totalAnalyses * 100).toFixed(2) : 0,
            avgTokensPerAnalysis: this.stats.successfulAnalyses > 0 ? 
                Math.round(this.stats.totalTokensUsed / this.stats.successfulAnalyses) : 0,
            cacheSize: this.analysisCache.size,
            memoryStoreSize: this.memoryStore.size
        };
    }

    /**
     * Limpa cache antigo
     */
    clearOldCache(maxAge = 24 * 60 * 60 * 1000) { // 24 horas
        const now = Date.now();
        let cleared = 0;
        
        for (const [key, value] of this.analysisCache.entries()) {
            if (value.analysisTimestamp) {
                const age = now - new Date(value.analysisTimestamp).getTime();
                if (age > maxAge) {
                    this.analysisCache.delete(key);
                    cleared++;
                }
            }
        }
        
        if (cleared > 0) {
            this.logger.info(`Cache limpo: ${cleared} entradas removidas`);
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Registra feedback de performance para aprendizado evolutivo
     */
    async recordPerformanceFeedback(contentId, predictedResult, actualOutcome, options = {}) {
        try {
            if (!this.config.learningEnabled || !this.memoryIntegration) {
                this.logger.warn('Sistema de aprendizado não habilitado');
                return;
            }

            this.logger.info(`Registrando feedback de performance para conteúdo: ${contentId}`);

            // Buscar memória relacionada ao conteúdo
            const memories = await this.memoryIntegration.memory.retrieveMemories(this.agentName, {
                contentId: contentId,
                limit: 1
            });

            if (memories.length === 0) {
                this.logger.warn(`Nenhuma memória encontrada para conteúdo: ${contentId}`);
                return;
            }

            const memory = memories[0];

            // Registrar feedback na memória evolutiva
            await this.memoryIntegration.recordLearningFeedback(
                memory.id,
                predictedResult,
                actualOutcome
            );

            this.stats.learningEvents++;
            this.logger.info('Feedback de performance registrado com sucesso');

        } catch (error) {
            this.logger.error('Erro ao registrar feedback de performance:', error);
        }
    }

    /**
     * Força evolução dos padrões do agente
     */
    async triggerEvolution() {
        try {
            if (!this.memoryIntegration) {
                this.logger.warn('Sistema de memória não habilitado');
                return;
            }

            this.logger.info('Disparando evolução de padrões do agente...');
            await this.memoryIntegration.triggerEvolution();
            this.logger.info('Evolução de padrões concluída');

        } catch (error) {
            this.logger.error('Erro ao disparar evolução:', error);
        }
    }

    /**
     * Obtém insights da memória evolutiva
     */
    async getMemoryInsights(platform = null, niche = 'general') {
        try {
            if (!this.memoryIntegration) {
                return { insights: [], patterns: [], learningHistory: {} };
            }

            // Recuperar padrões evolutivos
            const patterns = await this.memoryIntegration.memory.retrievePatterns({
                platforms: platform ? [platform] : [],
                niches: [niche],
                minConfidence: 0.6,
                limit: 10
            });

            // Recuperar histórico de aprendizado
            const learningHistory = await this.memoryIntegration.getLearningHistory(
                this.agentName,
                platform,
                null
            );

            // Recuperar memórias de alto sucesso
            const successfulMemories = await this.memoryIntegration.memory.retrieveMemories(this.agentName, {
                platform: platform,
                niche: niche,
                minConfidence: 0.8,
                limit: 5
            });

            return {
                insights: this.extractInsightsFromMemories(successfulMemories),
                patterns: patterns,
                learningHistory: learningHistory,
                totalMemories: successfulMemories.length
            };

        } catch (error) {
            this.logger.error('Erro ao obter insights da memória:', error);
            return { insights: [], patterns: [], learningHistory: {} };
        }
    }

    /**
     * Extrai insights de memórias bem-sucedidas
     */
    extractInsightsFromMemories(memories) {
        const insights = [];

        try {
            memories.forEach(memory => {
                if (memory.memory_data?.analysisResult) {
                    const result = memory.memory_data.analysisResult;
                    
                    insights.push({
                        type: 'successful_pattern',
                        description: `Padrão bem-sucedido identificado`,
                        confidence: memory.confidence_score,
                        successRate: memory.success_rate,
                        platform: memory.platform,
                        niche: memory.niche,
                        createdAt: memory.created_at,
                        keyElements: this.extractKeyElements(result)
                    });
                }
            });

        } catch (error) {
            this.logger.warn('Erro ao extrair insights:', error);
        }

        return insights.slice(0, 10);
    }

    /**
     * Extrai elementos-chave de um resultado de análise
     */
    extractKeyElements(analysisResult) {
        const elements = [];

        try {
            if (analysisResult.result) {
                const result = analysisResult.result;
                
                // Elementos virais
                if (result.viral_elements) {
                    elements.push(...Object.keys(result.viral_elements));
                }
                
                // Técnicas de persuasão
                if (result.persuasion_techniques) {
                    elements.push(...Object.keys(result.persuasion_techniques));
                }
                
                // Gatilhos emocionais
                if (result.emotional_triggers) {
                    elements.push(...Object.keys(result.emotional_triggers));
                }
                
                // Elementos visuais
                if (result.visual_elements) {
                    elements.push(...Object.keys(result.visual_elements));
                }
            }

        } catch (error) {
            this.logger.warn('Erro ao extrair elementos-chave:', error);
        }

        return elements.slice(0, 5);
    }
}

module.exports = BaseAgent;

