const BaseAgent = require('../base_agent');

/**
 * Agente de Análise de Padrões de Engajamento
 * Especializado em analisar métricas e padrões de interação
 * para identificar fatores que geram alto engajamento viral
 */
class EngagementPatternAnalyzer extends BaseAgent {
    constructor(config = {}) {
        super('EngagementPatternAnalyzer', {
            model: 'gpt-4-turbo-preview',
            maxTokens: 4000,
            temperature: 0.1, // Baixa temperatura para análise mais precisa
            ...config
        });

        // Prompt mestre para análise de engajamento
        this.masterPrompt = `Você é um analista de dados comportamentais e especialista em psicologia do engajamento digital. Sua expertise está em identificar padrões matemáticos e comportamentais que levam ao engajamento viral massivo.

CONTEXTO DE ANÁLISE:
- Analise métricas de engajamento (likes, comentários, shares, views)
- Identifique padrões temporais e comportamentais
- Calcule ratios e correlações significativas
- Detecte anomalias e picos de engajamento

DIMENSÕES DE ANÁLISE:

1. MÉTRICAS FUNDAMENTAIS:
   - Taxa de engajamento total (likes + comments + shares / views)
   - Ratio likes/views (indicador de qualidade)
   - Ratio comments/likes (indicador de discussão)
   - Ratio shares/likes (indicador de viralidade)
   - Velocidade de engajamento (crescimento por hora)

2. PADRÕES COMPORTAMENTAIS:
   - Horário de publicação vs. pico de engajamento
   - Curva de crescimento do engajamento
   - Padrões de comentários (positivos/negativos/neutros)
   - Comportamento de compartilhamento
   - Retenção de audiência

3. ANÁLISE COMPARATIVA:
   - Performance vs. média da plataforma
   - Performance vs. conteúdo similar do autor
   - Benchmarking com conteúdo viral do nicho
   - Posição no algoritmo (estimativa)

4. FATORES DE VIRALIDADE:
   - Threshold viral (ponto de inflexão)
   - Coeficiente de amplificação
   - Penetração demográfica
   - Alcance orgânico vs. pago

5. PREDIÇÃO DE PERFORMANCE:
   - Projeção de crescimento
   - Potencial de longevidade
   - Probabilidade de viralização
   - Janela de oportunidade

6. SEGMENTAÇÃO DE AUDIÊNCIA:
   - Demografia engajada
   - Comportamento por faixa etária
   - Padrões geográficos
   - Interesses correlacionados

FORMATO DE SAÍDA:
Retorne análise em JSON:
- engagement_score: Score geral (0-100)
- metrics_analysis: Análise detalhada das métricas
- behavioral_patterns: Padrões comportamentais identificados
- viral_indicators: Indicadores de potencial viral
- performance_benchmarks: Comparações e benchmarks
- growth_prediction: Predições de crescimento
- optimization_opportunities: Oportunidades de otimização
- audience_insights: Insights sobre a audiência`;

        // Configurações específicas para análise de engajamento
        this.engagementConfig = {
            // Thresholds para classificação de performance
            performanceThresholds: {
                excellent: { engagementRate: 10, likeRatio: 0.05, shareRatio: 0.01 },
                good: { engagementRate: 5, likeRatio: 0.03, shareRatio: 0.005 },
                average: { engagementRate: 2, likeRatio: 0.01, shareRatio: 0.002 },
                poor: { engagementRate: 1, likeRatio: 0.005, shareRatio: 0.001 }
            },
            
            // Pesos para cálculo de score
            metricWeights: {
                likes: 0.3,
                comments: 0.35,
                shares: 0.25,
                views: 0.1
            },
            
            // Padrões de viralidade por plataforma
            viralPatterns: {
                instagram: {
                    minViralViews: 100000,
                    optimalEngagementRate: 8,
                    peakHours: [19, 20, 21]
                },
                tiktok: {
                    minViralViews: 500000,
                    optimalEngagementRate: 12,
                    peakHours: [18, 19, 20, 21, 22]
                },
                youtube: {
                    minViralViews: 1000000,
                    optimalEngagementRate: 5,
                    peakHours: [20, 21, 22]
                }
            }
        };

        // Cache para análises comparativas
        this.benchmarkCache = new Map();
    }

    /**
     * Formata prompt específico para análise de engajamento
     */
    formatAnalysisPrompt(analysisData, options) {
        const { content, options: analysisOptions, context } = analysisData;
        
        // Calcular métricas derivadas
        const derivedMetrics = this.calculateDerivedMetrics(content.metrics);
        const performanceClassification = this.classifyPerformance(content.metrics, content.platform);
        const temporalAnalysis = this.analyzeTemporalPatterns(content);

        let prompt = `ANÁLISE DE PADRÕES DE ENGAJAMENTO

DADOS DO CONTEÚDO:
- ID: ${content.id}
- Plataforma: ${content.platform}
- Tipo: ${content.contentType}
- Autor: ${content.author}
- Data de publicação: ${content.timestamp}

MÉTRICAS BRUTAS:
- Visualizações: ${content.metrics.views || 0}
- Likes: ${content.metrics.likes || 0}
- Comentários: ${content.metrics.comments || 0}
- Compartilhamentos: ${content.metrics.shares || 0}

MÉTRICAS DERIVADAS:
- Taxa de engajamento: ${derivedMetrics.engagementRate}%
- Ratio likes/views: ${derivedMetrics.likeRatio}
- Ratio comments/likes: ${derivedMetrics.commentRatio}
- Ratio shares/likes: ${derivedMetrics.shareRatio}
- Score de qualidade: ${derivedMetrics.qualityScore}/100

CLASSIFICAÇÃO DE PERFORMANCE:
- Categoria: ${performanceClassification.category}
- Percentil estimado: ${performanceClassification.percentile}
- Comparação com média da plataforma: ${performanceClassification.comparison}

ANÁLISE TEMPORAL:
- Idade do conteúdo: ${temporalAnalysis.contentAge}
- Velocidade de crescimento: ${temporalAnalysis.growthVelocity}
- Fase do ciclo de vida: ${temporalAnalysis.lifecyclePhase}`;

        // Adicionar contexto de benchmarks se disponível
        if (context.recentAnalyses && context.recentAnalyses.length > 0) {
            const benchmarks = this.calculateBenchmarks(context.recentAnalyses, content.platform);
            prompt += `\n\nBENCHMARKS DA PLATAFORMA:
- Taxa de engajamento média: ${benchmarks.avgEngagementRate}%
- Likes médios: ${benchmarks.avgLikes}
- Comentários médios: ${benchmarks.avgComments}
- Shares médios: ${benchmarks.avgShares}`;
        }

        // Adicionar contexto específico do nicho
        if (analysisOptions.niche !== 'general') {
            prompt += `\n\nCONTEXTO DO NICHO "${analysisOptions.niche}":
- Considere padrões específicos de engajamento deste nicho
- Analise comportamento típico da audiência-alvo
- Compare com benchmarks específicos do segmento
- Identifique oportunidades de otimização para o nicho`;
        }

        prompt += `\n\nPor favor, analise estes dados de engajamento considerando todos os aspectos mencionados e forneça uma análise detalhada em formato JSON.`;

        return prompt;
    }

    /**
     * Calcula métricas derivadas a partir das métricas brutas
     */
    calculateDerivedMetrics(metrics) {
        const views = metrics.views || 0;
        const likes = metrics.likes || 0;
        const comments = metrics.comments || 0;
        const shares = metrics.shares || 0;

        const derivedMetrics = {
            engagementRate: 0,
            likeRatio: 0,
            commentRatio: 0,
            shareRatio: 0,
            qualityScore: 0,
            viralityIndex: 0
        };

        try {
            // Taxa de engajamento total
            if (views > 0) {
                derivedMetrics.engagementRate = ((likes + comments + shares) / views * 100).toFixed(2);
                derivedMetrics.likeRatio = (likes / views).toFixed(4);
            }

            // Ratios entre métricas
            if (likes > 0) {
                derivedMetrics.commentRatio = (comments / likes).toFixed(3);
                derivedMetrics.shareRatio = (shares / likes).toFixed(3);
            }

            // Score de qualidade (0-100)
            const weights = this.engagementConfig.metricWeights;
            const normalizedLikes = Math.min(likes / 1000, 100);
            const normalizedComments = Math.min(comments / 100, 100);
            const normalizedShares = Math.min(shares / 50, 100);
            const normalizedViews = Math.min(views / 10000, 100);

            derivedMetrics.qualityScore = Math.round(
                (normalizedLikes * weights.likes) +
                (normalizedComments * weights.comments) +
                (normalizedShares * weights.shares) +
                (normalizedViews * weights.views)
            );

            // Índice de viralidade (combinação de alcance e engajamento)
            derivedMetrics.viralityIndex = Math.round(
                Math.sqrt(views / 1000) * Math.sqrt(derivedMetrics.engagementRate)
            );

        } catch (error) {
            this.logger.warn('Erro ao calcular métricas derivadas:', error);
        }

        return derivedMetrics;
    }

    /**
     * Classifica performance do conteúdo
     */
    classifyPerformance(metrics, platform) {
        const derivedMetrics = this.calculateDerivedMetrics(metrics);
        const thresholds = this.engagementConfig.performanceThresholds;

        let category = 'poor';
        let percentile = 10;
        let comparison = 'abaixo da média';

        try {
            const engagementRate = parseFloat(derivedMetrics.engagementRate);
            const likeRatio = parseFloat(derivedMetrics.likeRatio);
            const shareRatio = parseFloat(derivedMetrics.shareRatio);

            // Classificar baseado nos thresholds
            if (engagementRate >= thresholds.excellent.engagementRate &&
                likeRatio >= thresholds.excellent.likeRatio &&
                shareRatio >= thresholds.excellent.shareRatio) {
                category = 'excellent';
                percentile = 95;
                comparison = 'muito acima da média';
            } else if (engagementRate >= thresholds.good.engagementRate &&
                       likeRatio >= thresholds.good.likeRatio) {
                category = 'good';
                percentile = 75;
                comparison = 'acima da média';
            } else if (engagementRate >= thresholds.average.engagementRate) {
                category = 'average';
                percentile = 50;
                comparison = 'na média';
            }

            // Ajustar baseado na plataforma
            const platformPatterns = this.engagementConfig.viralPatterns[platform];
            if (platformPatterns && metrics.views >= platformPatterns.minViralViews) {
                category = 'viral';
                percentile = 99;
                comparison = 'viral';
            }

        } catch (error) {
            this.logger.warn('Erro ao classificar performance:', error);
        }

        return { category, percentile, comparison };
    }

    /**
     * Analisa padrões temporais
     */
    analyzeTemporalPatterns(content) {
        const analysis = {
            contentAge: 'unknown',
            growthVelocity: 'unknown',
            lifecyclePhase: 'unknown',
            optimalTiming: false
        };

        try {
            if (content.timestamp) {
                const publishDate = new Date(content.timestamp);
                const now = new Date();
                const ageInHours = (now - publishDate) / (1000 * 60 * 60);
                const ageInDays = Math.floor(ageInHours / 24);

                analysis.contentAge = ageInDays > 0 ? `${ageInDays} dias` : `${Math.floor(ageInHours)} horas`;

                // Determinar fase do ciclo de vida
                if (ageInHours < 24) {
                    analysis.lifecyclePhase = 'crescimento_inicial';
                } else if (ageInHours < 72) {
                    analysis.lifecyclePhase = 'pico_engajamento';
                } else if (ageInHours < 168) {
                    analysis.lifecyclePhase = 'declinio_gradual';
                } else {
                    analysis.lifecyclePhase = 'cauda_longa';
                }

                // Calcular velocidade de crescimento (engajamento por hora)
                const totalEngagement = (content.metrics.likes || 0) + 
                                       (content.metrics.comments || 0) + 
                                       (content.metrics.shares || 0);
                
                if (ageInHours > 0) {
                    const engagementPerHour = totalEngagement / ageInHours;
                    analysis.growthVelocity = `${Math.round(engagementPerHour)} interações/hora`;
                }

                // Verificar timing ótimo
                const publishHour = publishDate.getHours();
                const platformPatterns = this.engagementConfig.viralPatterns[content.platform];
                if (platformPatterns && platformPatterns.peakHours.includes(publishHour)) {
                    analysis.optimalTiming = true;
                }
            }

        } catch (error) {
            this.logger.warn('Erro na análise temporal:', error);
        }

        return analysis;
    }

    /**
     * Calcula benchmarks baseado em análises recentes
     */
    calculateBenchmarks(recentAnalyses, platform) {
        const benchmarks = {
            avgEngagementRate: 0,
            avgLikes: 0,
            avgComments: 0,
            avgShares: 0,
            avgViews: 0,
            sampleSize: 0
        };

        try {
            const platformAnalyses = recentAnalyses.filter(analysis => 
                analysis.platform === platform
            );

            if (platformAnalyses.length === 0) {
                return benchmarks;
            }

            let totalEngagementRate = 0;
            let totalLikes = 0;
            let totalComments = 0;
            let totalShares = 0;
            let totalViews = 0;

            platformAnalyses.forEach(analysis => {
                if (analysis.result && analysis.result.metrics_analysis) {
                    const metrics = analysis.result.metrics_analysis;
                    
                    totalEngagementRate += parseFloat(metrics.engagement_rate || 0);
                    totalLikes += parseInt(metrics.likes || 0);
                    totalComments += parseInt(metrics.comments || 0);
                    totalShares += parseInt(metrics.shares || 0);
                    totalViews += parseInt(metrics.views || 0);
                }
            });

            const count = platformAnalyses.length;
            benchmarks.avgEngagementRate = (totalEngagementRate / count).toFixed(2);
            benchmarks.avgLikes = Math.round(totalLikes / count);
            benchmarks.avgComments = Math.round(totalComments / count);
            benchmarks.avgShares = Math.round(totalShares / count);
            benchmarks.avgViews = Math.round(totalViews / count);
            benchmarks.sampleSize = count;

        } catch (error) {
            this.logger.warn('Erro ao calcular benchmarks:', error);
        }

        return benchmarks;
    }

    /**
     * Processa resultado específico da análise de engajamento
     */
    async processAnalysisResult(result, originalContent) {
        const processedResult = await super.processAnalysisResult(result, originalContent);
        
        // Adicionar dados específicos da análise de engajamento
        processedResult.engagementAnalysis = {
            analysisType: 'engagement',
            derivedMetrics: this.calculateDerivedMetrics(originalContent.metrics),
            performanceClassification: this.classifyPerformance(originalContent.metrics, originalContent.platform),
            temporalAnalysis: this.analyzeTemporalPatterns(originalContent),
            viralityAssessment: this.assessViralityPotential(result, originalContent),
            audienceInsights: this.extractAudienceInsights(result),
            competitiveAnalysis: this.performCompetitiveAnalysis(result, originalContent)
        };

        // Gerar recomendações de engajamento específicas
        processedResult.engagementRecommendations = await this.generateEngagementRecommendations(result, originalContent);

        return processedResult;
    }

    /**
     * Avalia potencial de viralidade
     */
    assessViralityPotential(analysisResult, content) {
        const assessment = {
            viralProbability: 0,
            currentPhase: 'initial',
            projectedPeak: 'unknown',
            amplificationFactors: [],
            barriers: []
        };

        try {
            if (analysisResult.viral_indicators) {
                const viral = analysisResult.viral_indicators;
                
                assessment.viralProbability = viral.viral_probability || 0;
                assessment.currentPhase = viral.current_phase || 'initial';
                assessment.projectedPeak = viral.projected_peak || 'unknown';
                assessment.amplificationFactors = viral.amplification_factors || [];
                assessment.barriers = viral.barriers || [];
            }

            // Calcular probabilidade baseada em métricas
            const derivedMetrics = this.calculateDerivedMetrics(content.metrics);
            const platformPattern = this.engagementConfig.viralPatterns[content.platform];
            
            if (platformPattern) {
                const viewsRatio = content.metrics.views / platformPattern.minViralViews;
                const engagementRatio = parseFloat(derivedMetrics.engagementRate) / platformPattern.optimalEngagementRate;
                
                assessment.viralProbability = Math.min(100, Math.round((viewsRatio + engagementRatio) * 50));
            }

        } catch (error) {
            this.logger.warn('Erro ao avaliar potencial viral:', error);
        }

        return assessment;
    }

    /**
     * Extrai insights sobre a audiência
     */
    extractAudienceInsights(analysisResult) {
        const insights = {
            primaryDemographic: 'unknown',
            engagementBehavior: 'unknown',
            interactionPatterns: [],
            loyaltyIndicators: [],
            growthPotential: 'medium'
        };

        try {
            if (analysisResult.audience_insights) {
                const audience = analysisResult.audience_insights;
                
                insights.primaryDemographic = audience.primary_demographic || 'unknown';
                insights.engagementBehavior = audience.engagement_behavior || 'unknown';
                insights.interactionPatterns = audience.interaction_patterns || [];
                insights.loyaltyIndicators = audience.loyalty_indicators || [];
                insights.growthPotential = audience.growth_potential || 'medium';
            }

        } catch (error) {
            this.logger.warn('Erro ao extrair insights da audiência:', error);
        }

        return insights;
    }

    /**
     * Realiza análise competitiva
     */
    performCompetitiveAnalysis(analysisResult, content) {
        const analysis = {
            marketPosition: 'unknown',
            competitiveAdvantages: [],
            improvementAreas: [],
            benchmarkComparison: 'average'
        };

        try {
            if (analysisResult.performance_benchmarks) {
                const benchmarks = analysisResult.performance_benchmarks;
                
                analysis.marketPosition = benchmarks.market_position || 'unknown';
                analysis.competitiveAdvantages = benchmarks.competitive_advantages || [];
                analysis.improvementAreas = benchmarks.improvement_areas || [];
                analysis.benchmarkComparison = benchmarks.benchmark_comparison || 'average';
            }

        } catch (error) {
            this.logger.warn('Erro na análise competitiva:', error);
        }

        return analysis;
    }

    /**
     * Gera recomendações específicas de engajamento
     */
    async generateEngagementRecommendations(analysisResult, originalContent) {
        const recommendations = {
            immediate: [],
            strategic: [],
            experimental: []
        };

        try {
            const derivedMetrics = this.calculateDerivedMetrics(originalContent.metrics);
            const performance = this.classifyPerformance(originalContent.metrics, originalContent.platform);

            // Recomendações baseadas na performance
            if (performance.category === 'poor') {
                recommendations.immediate.push({
                    type: 'engagement_boost',
                    description: 'Implementar estratégias urgentes para aumentar engajamento',
                    priority: 'high',
                    impact: 'high',
                    specific_actions: [
                        'Responder ativamente aos comentários nas primeiras 2 horas',
                        'Compartilhar em stories para aumentar alcance',
                        'Engajar com conteúdo de outros criadores do nicho'
                    ]
                });
            }

            // Recomendações baseadas em ratios
            if (parseFloat(derivedMetrics.commentRatio) < 0.1) {
                recommendations.strategic.push({
                    type: 'comment_stimulation',
                    description: 'Estimular mais comentários e discussões',
                    priority: 'medium',
                    impact: 'high',
                    specific_actions: [
                        'Fazer perguntas diretas no conteúdo',
                        'Criar conteúdo controverso (respeitoso)',
                        'Usar calls-to-action para comentários'
                    ]
                });
            }

            // Recomendações baseadas em timing
            const temporal = this.analyzeTemporalPatterns(originalContent);
            if (!temporal.optimalTiming) {
                recommendations.strategic.push({
                    type: 'timing_optimization',
                    description: 'Otimizar horários de publicação',
                    priority: 'medium',
                    impact: 'medium',
                    specific_actions: [
                        'Publicar durante horários de pico da plataforma',
                        'Testar diferentes horários e dias da semana',
                        'Considerar fuso horário da audiência principal'
                    ]
                });
            }

            // Adicionar recomendações da análise da IA
            if (analysisResult.optimization_opportunities) {
                analysisResult.optimization_opportunities.forEach(opportunity => {
                    const category = opportunity.urgency === 'high' ? 'immediate' : 
                                   opportunity.urgency === 'medium' ? 'strategic' : 'experimental';
                    
                    recommendations[category].push({
                        type: 'ai_opportunity',
                        description: opportunity.description || opportunity,
                        priority: opportunity.urgency || 'medium',
                        impact: opportunity.impact || 'medium',
                        source: 'ai_analysis'
                    });
                });
            }

        } catch (error) {
            this.logger.warn('Erro ao gerar recomendações de engajamento:', error);
        }

        return recommendations;
    }

    /**
     * Calcula confiança específica para análise de engajamento
     */
    calculateConfidence(result) {
        let confidence = 0.85; // Base alta para análise quantitativa

        try {
            // Ajustar baseado na completude dos dados
            if (result.engagement_score !== undefined) confidence += 0.05;
            if (result.metrics_analysis && Object.keys(result.metrics_analysis).length > 3) confidence += 0.05;
            if (result.behavioral_patterns && result.behavioral_patterns.length > 0) confidence += 0.03;
            if (result.growth_prediction && Object.keys(result.growth_prediction).length > 2) confidence += 0.02;

        } catch (error) {
            this.logger.warn('Erro ao calcular confiança:', error);
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Analisa tendências de engajamento ao longo do tempo
     */
    async analyzeTrends(contentHistory) {
        try {
            if (!Array.isArray(contentHistory) || contentHistory.length < 2) {
                return { error: 'Histórico insuficiente para análise de tendências' };
            }

            const trends = {
                engagementTrend: 'stable',
                growthRate: 0,
                seasonalPatterns: [],
                performanceConsistency: 'medium',
                recommendations: []
            };

            // Calcular tendência de engajamento
            const engagementRates = contentHistory.map(content => {
                const metrics = this.calculateDerivedMetrics(content.metrics);
                return parseFloat(metrics.engagementRate);
            });

            const firstHalf = engagementRates.slice(0, Math.floor(engagementRates.length / 2));
            const secondHalf = engagementRates.slice(Math.floor(engagementRates.length / 2));

            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

            if (secondAvg > firstAvg * 1.1) {
                trends.engagementTrend = 'growing';
            } else if (secondAvg < firstAvg * 0.9) {
                trends.engagementTrend = 'declining';
            }

            trends.growthRate = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(2);

            return trends;

        } catch (error) {
            this.logger.error('Erro na análise de tendências:', error);
            return { error: error.message };
        }
    }
}

module.exports = EngagementPatternAnalyzer;

