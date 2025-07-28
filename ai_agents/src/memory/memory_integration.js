const EvolutionaryMemory = require('./evolutionary_memory');
const winston = require('winston');

/**
 * Sistema de Integração da Memória Evolutiva
 * Conecta agentes de IA com o sistema de memória persistente
 * Permite aprendizado contínuo e evolução contextual
 */
class MemoryIntegration {
    constructor(config = {}) {
        this.config = {
            enableLearning: true,
            enableEvolution: true,
            learningThreshold: 0.7,
            evolutionInterval: 3600000, // 1 hora
            contextWindow: 10,
            maxContextAge: 86400000, // 24 horas
            ...config
        };

        // Inicializar sistema de memória
        this.memory = new EvolutionaryMemory(config.memoryConfig);

        // Configurar logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `${timestamp} [${level.toUpperCase()}] [MEMORY_INTEGRATION] ${message}${stack ? '\n' + stack : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: '../logs/memory_integration.log',
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 3
                })
            ]
        });

        // Cache de contexto ativo
        this.activeContexts = new Map();
        
        // Estatísticas de integração
        this.integrationStats = {
            totalEnhancements: 0,
            successfulLearnings: 0,
            contextualAnalyses: 0,
            evolutionTriggers: 0,
            lastEvolution: null
        };

        // Timer para evolução automática
        this.evolutionTimer = null;
    }

    /**
     * Inicializa o sistema de integração
     */
    async initialize() {
        try {
            this.logger.info('Inicializando integração da memória evolutiva...');
            
            // Inicializar sistema de memória
            await this.memory.initialize();
            
            // Configurar evolução automática
            if (this.config.enableEvolution) {
                this.setupAutoEvolution();
            }
            
            this.logger.info('Integração da memória evolutiva inicializada');
            
        } catch (error) {
            this.logger.error('Erro ao inicializar integração:', error);
            throw error;
        }
    }

    /**
     * Configura evolução automática
     */
    setupAutoEvolution() {
        this.evolutionTimer = setInterval(async () => {
            try {
                await this.triggerEvolution();
            } catch (error) {
                this.logger.error('Erro na evolução automática:', error);
            }
        }, this.config.evolutionInterval);

        this.logger.info(`Evolução automática configurada: ${this.config.evolutionInterval}ms`);
    }

    /**
     * Enriquece análise do agente com contexto da memória
     */
    async enhanceAnalysisWithMemory(agentName, content, analysisOptions = {}) {
        try {
            this.logger.info(`Enriquecendo análise com memória: ${agentName}`);
            
            // Recuperar contexto relevante
            const memoryContext = await this.buildMemoryContext(agentName, content, analysisOptions);
            
            // Recuperar padrões evolutivos
            const evolutionaryPatterns = await this.getEvolutionaryPatterns(content, analysisOptions);
            
            // Construir contexto enriquecido
            const enhancedContext = {
                ...analysisOptions,
                memoryContext: memoryContext,
                evolutionaryPatterns: evolutionaryPatterns,
                contextualInsights: await this.generateContextualInsights(memoryContext, evolutionaryPatterns),
                learningHistory: await this.getLearningHistory(agentName, content.platform, content.contentType)
            };

            this.integrationStats.totalEnhancements++;
            this.integrationStats.contextualAnalyses++;

            return enhancedContext;

        } catch (error) {
            this.logger.error('Erro ao enriquecer análise:', error);
            return analysisOptions; // Retornar opções originais em caso de erro
        }
    }

    /**
     * Constrói contexto de memória relevante
     */
    async buildMemoryContext(agentName, content, options) {
        try {
            const context = {
                platform: content.platform,
                niche: options.niche || 'general',
                contentType: content.contentType,
                memoryTypes: ['pattern', 'feedback', 'context'],
                limit: this.config.contextWindow,
                minConfidence: 0.3
            };

            // Recuperar memórias relevantes
            const relevantMemories = await this.memory.retrieveMemories(agentName, context);
            
            // Organizar memórias por tipo
            const organizedMemories = this.organizeMemoriesByType(relevantMemories);
            
            // Calcular relevância contextual
            const contextualRelevance = this.calculateContextualRelevance(relevantMemories, content);

            return {
                memories: organizedMemories,
                relevanceScore: contextualRelevance,
                memoryCount: relevantMemories.length,
                contextAge: this.calculateContextAge(relevantMemories),
                dominantPatterns: this.extractDominantPatterns(relevantMemories)
            };

        } catch (error) {
            this.logger.error('Erro ao construir contexto de memória:', error);
            return { memories: {}, relevanceScore: 0, memoryCount: 0 };
        }
    }

    /**
     * Obtém padrões evolutivos relevantes
     */
    async getEvolutionaryPatterns(content, options) {
        try {
            const patternContext = {
                platforms: [content.platform],
                niches: [options.niche || 'general'],
                minConfidence: 0.5,
                limit: 10
            };

            const patterns = await this.memory.retrievePatterns(patternContext);
            
            return {
                patterns: patterns,
                patternCount: patterns.length,
                avgConfidence: this.calculateAverageConfidence(patterns),
                evolutionGeneration: this.getMaxEvolutionGeneration(patterns),
                applicablePatterns: this.filterApplicablePatterns(patterns, content)
            };

        } catch (error) {
            this.logger.error('Erro ao obter padrões evolutivos:', error);
            return { patterns: [], patternCount: 0 };
        }
    }

    /**
     * Gera insights contextuais baseados na memória
     */
    async generateContextualInsights(memoryContext, evolutionaryPatterns) {
        try {
            const insights = {
                historicalTrends: [],
                successFactors: [],
                riskFactors: [],
                optimizationOpportunities: [],
                confidenceLevel: 'medium'
            };

            // Analisar tendências históricas
            if (memoryContext.memories.pattern) {
                insights.historicalTrends = this.extractHistoricalTrends(memoryContext.memories.pattern);
            }

            // Identificar fatores de sucesso
            if (memoryContext.memories.feedback) {
                insights.successFactors = this.identifySuccessFactors(memoryContext.memories.feedback);
            }

            // Identificar fatores de risco
            insights.riskFactors = this.identifyRiskFactors(memoryContext.memories);

            // Encontrar oportunidades de otimização
            if (evolutionaryPatterns.patterns.length > 0) {
                insights.optimizationOpportunities = this.findOptimizationOpportunities(
                    evolutionaryPatterns.patterns,
                    memoryContext.memories
                );
            }

            // Calcular nível de confiança
            insights.confidenceLevel = this.calculateInsightConfidence(memoryContext, evolutionaryPatterns);

            return insights;

        } catch (error) {
            this.logger.error('Erro ao gerar insights contextuais:', error);
            return { historicalTrends: [], successFactors: [], riskFactors: [] };
        }
    }

    /**
     * Obtém histórico de aprendizado
     */
    async getLearningHistory(agentName, platform, contentType) {
        try {
            const context = {
                platform: platform,
                contentType: contentType,
                memoryTypes: ['feedback'],
                limit: 20,
                minConfidence: 0.1
            };

            const learningMemories = await this.memory.retrieveMemories(agentName, context);
            
            return {
                totalLearnings: learningMemories.length,
                avgSuccessRate: this.calculateAverageSuccessRate(learningMemories),
                learningTrend: this.calculateLearningTrend(learningMemories),
                recentImprovements: this.identifyRecentImprovements(learningMemories)
            };

        } catch (error) {
            this.logger.error('Erro ao obter histórico de aprendizado:', error);
            return { totalLearnings: 0, avgSuccessRate: 0.5 };
        }
    }

    /**
     * Registra resultado de análise para aprendizado
     */
    async recordAnalysisResult(agentName, content, analysisResult, actualOutcome = null) {
        try {
            if (!this.config.enableLearning) return;

            this.logger.info(`Registrando resultado de análise: ${agentName}`);

            // Armazenar memória da análise
            const memoryData = {
                analysisResult: analysisResult,
                contentMetrics: content.metrics,
                contextFactors: {
                    platform: content.platform,
                    contentType: content.contentType,
                    timestamp: content.timestamp,
                    author: content.author
                }
            };

            const memoryOptions = {
                contentId: content.id,
                platform: content.platform,
                niche: analysisResult.niche || 'general',
                confidence: analysisResult.confidence || 0.5,
                successRate: this.calculateInitialSuccessRate(analysisResult),
                tags: this.generateMemoryTags(content, analysisResult),
                metadata: {
                    agentVersion: '1.0.0',
                    analysisType: analysisResult.analysisType || 'unknown'
                }
            };

            const storedMemory = await this.memory.storeMemory(
                agentName,
                this.memory.memoryTypes.PATTERN,
                memoryData,
                memoryOptions
            );

            // Se há resultado real, registrar feedback
            if (actualOutcome) {
                await this.recordLearningFeedback(storedMemory.id, analysisResult, actualOutcome);
            }

            this.integrationStats.successfulLearnings++;
            return storedMemory;

        } catch (error) {
            this.logger.error('Erro ao registrar resultado:', error);
            return null;
        }
    }

    /**
     * Registra feedback de aprendizado
     */
    async recordLearningFeedback(memoryId, predictedResult, actualResult) {
        try {
            const feedbackOptions = {
                feedbackType: 'performance_validation',
                suggestions: this.generateImprovementSuggestions(predictedResult, actualResult)
            };

            await this.memory.recordFeedback(
                memoryId,
                actualResult,
                predictedResult,
                feedbackOptions
            );

            this.logger.info(`Feedback de aprendizado registrado para memória ${memoryId}`);

        } catch (error) {
            this.logger.error('Erro ao registrar feedback:', error);
        }
    }

    /**
     * Dispara evolução dos padrões
     */
    async triggerEvolution() {
        try {
            this.logger.info('Disparando evolução de padrões...');
            
            await this.memory.evolvePatterns();
            
            this.integrationStats.evolutionTriggers++;
            this.integrationStats.lastEvolution = new Date();
            
            this.logger.info('Evolução de padrões concluída');

        } catch (error) {
            this.logger.error('Erro ao disparar evolução:', error);
        }
    }

    /**
     * Adapta análise para nicho específico usando memória
     */
    async adaptAnalysisToNiche(agentName, analysisResult, niche) {
        try {
            this.logger.info(`Adaptando análise para nicho: ${niche}`);

            // Recuperar padrões específicos do nicho
            const nichePatterns = await this.memory.retrievePatterns({
                niches: [niche],
                minConfidence: 0.6,
                limit: 5
            });

            // Recuperar memórias de sucesso no nicho
            const nicheMemories = await this.memory.retrieveMemories(agentName, {
                niche: niche,
                memoryTypes: ['pattern', 'feedback'],
                minConfidence: 0.7,
                limit: 10
            });

            // Aplicar adaptações baseadas na memória
            const adaptedResult = {
                ...analysisResult,
                nicheAdaptation: {
                    niche: niche,
                    adaptationSource: 'evolutionary_memory',
                    patternsApplied: nichePatterns.length,
                    memoriesConsulted: nicheMemories.length,
                    adaptations: this.generateNicheAdaptations(nichePatterns, nicheMemories, analysisResult)
                }
            };

            return adaptedResult;

        } catch (error) {
            this.logger.error('Erro ao adaptar para nicho:', error);
            return analysisResult;
        }
    }

    /**
     * Organiza memórias por tipo
     */
    organizeMemoriesByType(memories) {
        const organized = {};
        
        memories.forEach(memory => {
            const type = memory.memory_type;
            if (!organized[type]) {
                organized[type] = [];
            }
            organized[type].push(memory);
        });

        return organized;
    }

    /**
     * Calcula relevância contextual
     */
    calculateContextualRelevance(memories, content) {
        if (memories.length === 0) return 0;

        let totalRelevance = 0;
        
        memories.forEach(memory => {
            let relevance = memory.confidence_score || 0.5;
            
            // Boost por plataforma
            if (memory.platform === content.platform) {
                relevance += 0.2;
            }
            
            // Boost por tipo de conteúdo
            if (memory.memory_data?.contextFactors?.contentType === content.contentType) {
                relevance += 0.1;
            }
            
            // Penalidade por idade
            const age = Date.now() - new Date(memory.created_at).getTime();
            const agePenalty = Math.min(age / this.config.maxContextAge, 0.3);
            relevance -= agePenalty;
            
            totalRelevance += Math.max(0, relevance);
        });

        return totalRelevance / memories.length;
    }

    /**
     * Calcula idade do contexto
     */
    calculateContextAge(memories) {
        if (memories.length === 0) return 0;

        const now = Date.now();
        const ages = memories.map(memory => 
            now - new Date(memory.created_at).getTime()
        );

        return ages.reduce((sum, age) => sum + age, 0) / ages.length;
    }

    /**
     * Extrai padrões dominantes
     */
    extractDominantPatterns(memories) {
        const patterns = {};
        
        memories.forEach(memory => {
            if (memory.memory_data?.analysisResult) {
                const result = memory.memory_data.analysisResult;
                
                // Extrair padrões baseado no tipo de análise
                if (result.viral_elements) {
                    Object.keys(result.viral_elements).forEach(element => {
                        patterns[element] = (patterns[element] || 0) + 1;
                    });
                }
                
                if (result.persuasion_techniques) {
                    Object.keys(result.persuasion_techniques).forEach(technique => {
                        patterns[technique] = (patterns[technique] || 0) + 1;
                    });
                }
            }
        });

        // Retornar top 5 padrões
        return Object.entries(patterns)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([pattern, count]) => ({ pattern, frequency: count }));
    }

    /**
     * Calcula confiança média
     */
    calculateAverageConfidence(patterns) {
        if (patterns.length === 0) return 0;
        
        const totalConfidence = patterns.reduce((sum, pattern) => 
            sum + (pattern.confidence_score || 0.5), 0
        );
        
        return totalConfidence / patterns.length;
    }

    /**
     * Obtém geração máxima de evolução
     */
    getMaxEvolutionGeneration(patterns) {
        if (patterns.length === 0) return 0;
        
        return Math.max(...patterns.map(pattern => pattern.evolution_generation || 1));
    }

    /**
     * Filtra padrões aplicáveis
     */
    filterApplicablePatterns(patterns, content) {
        return patterns.filter(pattern => {
            // Verificar se plataforma é compatível
            if (pattern.platforms && pattern.platforms.length > 0) {
                if (!pattern.platforms.includes(content.platform)) {
                    return false;
                }
            }
            
            // Verificar confiança mínima
            if ((pattern.confidence_score || 0) < 0.5) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Extrai tendências históricas
     */
    extractHistoricalTrends(patternMemories) {
        const trends = [];
        
        try {
            patternMemories.forEach(memory => {
                if (memory.memory_data?.analysisResult) {
                    const result = memory.memory_data.analysisResult;
                    
                    if (result.trend_alignment) {
                        trends.push({
                            trend: result.trend_alignment,
                            timestamp: memory.created_at,
                            confidence: memory.confidence_score
                        });
                    }
                }
            });
            
            // Ordenar por data e retornar mais recentes
            return trends
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);

        } catch (error) {
            this.logger.warn('Erro ao extrair tendências:', error);
            return [];
        }
    }

    /**
     * Identifica fatores de sucesso
     */
    identifySuccessFactors(feedbackMemories) {
        const successFactors = [];
        
        try {
            feedbackMemories
                .filter(memory => (memory.success_rate || 0) > this.config.learningThreshold)
                .forEach(memory => {
                    if (memory.memory_data?.analysisResult) {
                        const result = memory.memory_data.analysisResult;
                        
                        if (result.recommendations) {
                            successFactors.push(...result.recommendations);
                        }
                    }
                });

        } catch (error) {
            this.logger.warn('Erro ao identificar fatores de sucesso:', error);
        }
        
        return successFactors.slice(0, 10);
    }

    /**
     * Identifica fatores de risco
     */
    identifyRiskFactors(memories) {
        const riskFactors = [];
        
        try {
            Object.values(memories).flat()
                .filter(memory => (memory.success_rate || 1) < 0.3)
                .forEach(memory => {
                    if (memory.memory_data?.analysisResult) {
                        riskFactors.push({
                            factor: 'low_performance_pattern',
                            description: 'Padrão com baixa taxa de sucesso identificado',
                            confidence: memory.confidence_score,
                            source: memory.memory_type
                        });
                    }
                });

        } catch (error) {
            this.logger.warn('Erro ao identificar fatores de risco:', error);
        }
        
        return riskFactors.slice(0, 5);
    }

    /**
     * Encontra oportunidades de otimização
     */
    findOptimizationOpportunities(patterns, memories) {
        const opportunities = [];
        
        try {
            // Analisar padrões de alta performance
            const highPerformancePatterns = patterns.filter(p => (p.success_rate || 0) > 0.8);
            
            highPerformancePatterns.forEach(pattern => {
                opportunities.push({
                    type: 'pattern_application',
                    description: `Aplicar padrão de alta performance: ${pattern.pattern_type}`,
                    confidence: pattern.confidence_score,
                    impact: 'high',
                    source: 'evolutionary_pattern'
                });
            });

        } catch (error) {
            this.logger.warn('Erro ao encontrar oportunidades:', error);
        }
        
        return opportunities.slice(0, 5);
    }

    /**
     * Calcula confiança dos insights
     */
    calculateInsightConfidence(memoryContext, evolutionaryPatterns) {
        let confidence = 0.5; // Base
        
        // Boost por quantidade de memórias
        if (memoryContext.memoryCount > 5) confidence += 0.1;
        if (memoryContext.memoryCount > 10) confidence += 0.1;
        
        // Boost por relevância
        if (memoryContext.relevanceScore > 0.7) confidence += 0.1;
        
        // Boost por padrões evolutivos
        if (evolutionaryPatterns.patternCount > 3) confidence += 0.1;
        if (evolutionaryPatterns.avgConfidence > 0.8) confidence += 0.1;
        
        return confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low';
    }

    /**
     * Calcula taxa de sucesso inicial
     */
    calculateInitialSuccessRate(analysisResult) {
        let successRate = 0.5; // Base
        
        try {
            // Ajustar baseado na confiança
            if (analysisResult.confidence) {
                successRate = analysisResult.confidence;
            }
            
            // Ajustar baseado em scores específicos
            if (analysisResult.result?.viral_potential) {
                successRate = (successRate + analysisResult.result.viral_potential / 100) / 2;
            }
            
            if (analysisResult.result?.engagement_score) {
                successRate = (successRate + analysisResult.result.engagement_score / 100) / 2;
            }

        } catch (error) {
            this.logger.warn('Erro ao calcular taxa de sucesso inicial:', error);
        }
        
        return Math.max(0.1, Math.min(0.9, successRate));
    }

    /**
     * Gera tags para memória
     */
    generateMemoryTags(content, analysisResult) {
        const tags = [];
        
        try {
            // Tags básicas
            tags.push(content.platform, content.contentType);
            
            // Tags do resultado
            if (analysisResult.result?.viral_potential > 70) {
                tags.push('high_viral_potential');
            }
            
            if (analysisResult.result?.engagement_score > 80) {
                tags.push('high_engagement');
            }
            
            // Tags de hashtags
            if (content.hashtags && content.hashtags.length > 0) {
                tags.push(...content.hashtags.slice(0, 3));
            }

        } catch (error) {
            this.logger.warn('Erro ao gerar tags:', error);
        }
        
        return tags;
    }

    /**
     * Gera sugestões de melhoria
     */
    generateImprovementSuggestions(predicted, actual) {
        const suggestions = {
            success_factors: [],
            failure_factors: [],
            optimization_areas: []
        };
        
        try {
            // Comparar métricas previstas vs reais
            if (predicted.result && actual.metrics) {
                if (actual.metrics.likes > (predicted.result.predicted_likes || 0)) {
                    suggestions.success_factors.push('exceeded_like_prediction');
                } else {
                    suggestions.failure_factors.push('underperformed_like_prediction');
                }
                
                if (actual.metrics.engagement_rate > (predicted.result.predicted_engagement || 0)) {
                    suggestions.success_factors.push('exceeded_engagement_prediction');
                } else {
                    suggestions.failure_factors.push('underperformed_engagement_prediction');
                }
            }

        } catch (error) {
            this.logger.warn('Erro ao gerar sugestões:', error);
        }
        
        return suggestions;
    }

    /**
     * Gera adaptações para nicho
     */
    generateNicheAdaptations(patterns, memories, analysisResult) {
        const adaptations = [];
        
        try {
            // Adaptações baseadas em padrões
            patterns.forEach(pattern => {
                if (pattern.pattern_data?.improvements) {
                    adaptations.push({
                        type: 'pattern_improvement',
                        description: `Aplicar melhorias do padrão ${pattern.pattern_type}`,
                        source: 'evolutionary_pattern',
                        confidence: pattern.confidence_score
                    });
                }
            });
            
            // Adaptações baseadas em memórias de sucesso
            const successfulMemories = memories.filter(m => (m.success_rate || 0) > 0.7);
            successfulMemories.forEach(memory => {
                if (memory.memory_data?.analysisResult?.recommendations) {
                    adaptations.push({
                        type: 'successful_memory_application',
                        description: 'Aplicar estratégias de memória bem-sucedida',
                        source: 'memory_feedback',
                        confidence: memory.success_rate
                    });
                }
            });

        } catch (error) {
            this.logger.warn('Erro ao gerar adaptações de nicho:', error);
        }
        
        return adaptations.slice(0, 5);
    }

    /**
     * Calcula taxa de sucesso média
     */
    calculateAverageSuccessRate(memories) {
        if (memories.length === 0) return 0.5;
        
        const totalRate = memories.reduce((sum, memory) => 
            sum + (memory.success_rate || 0.5), 0
        );
        
        return totalRate / memories.length;
    }

    /**
     * Calcula tendência de aprendizado
     */
    calculateLearningTrend(memories) {
        if (memories.length < 2) return 'insufficient_data';
        
        // Ordenar por data
        const sortedMemories = memories.sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
        );
        
        const firstHalf = sortedMemories.slice(0, Math.floor(sortedMemories.length / 2));
        const secondHalf = sortedMemories.slice(Math.floor(sortedMemories.length / 2));
        
        const firstAvg = this.calculateAverageSuccessRate(firstHalf);
        const secondAvg = this.calculateAverageSuccessRate(secondHalf);
        
        if (secondAvg > firstAvg + 0.1) return 'improving';
        if (secondAvg < firstAvg - 0.1) return 'declining';
        return 'stable';
    }

    /**
     * Identifica melhorias recentes
     */
    identifyRecentImprovements(memories) {
        const improvements = [];
        
        try {
            const recentMemories = memories
                .filter(memory => {
                    const age = Date.now() - new Date(memory.created_at).getTime();
                    return age < 7 * 24 * 60 * 60 * 1000; // 7 dias
                })
                .filter(memory => (memory.success_rate || 0) > 0.8);
            
            recentMemories.forEach(memory => {
                improvements.push({
                    type: memory.memory_type,
                    improvement: 'high_success_rate',
                    rate: memory.success_rate,
                    date: memory.created_at
                });
            });

        } catch (error) {
            this.logger.warn('Erro ao identificar melhorias recentes:', error);
        }
        
        return improvements.slice(0, 3);
    }

    /**
     * Obtém estatísticas de integração
     */
    getIntegrationStats() {
        return {
            ...this.integrationStats,
            activeContexts: this.activeContexts.size,
            memoryStats: this.memory.memoryStats,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Finaliza sistema de integração
     */
    async shutdown() {
        try {
            this.logger.info('Finalizando integração da memória evolutiva...');
            
            // Parar timer de evolução
            if (this.evolutionTimer) {
                clearInterval(this.evolutionTimer);
            }
            
            // Finalizar sistema de memória
            await this.memory.shutdown();
            
            // Limpar contextos ativos
            this.activeContexts.clear();
            
            this.logger.info('Integração da memória evolutiva finalizada');
            
        } catch (error) {
            this.logger.error('Erro ao finalizar integração:', error);
        }
    }
}

module.exports = MemoryIntegration;

