const BaseAgent = require('../base_agent');

/**
 * Agente de Análise Visual
 * Especializado em analisar elementos visuais de imagens e vídeos
 * para identificar padrões que geram engajamento viral
 */
class VisualContentAnalyzer extends BaseAgent {
    constructor(config = {}) {
        super('VisualContentAnalyzer', {
            model: 'gpt-4-vision-preview',
            maxTokens: 4000,
            temperature: 0.2,
            ...config
        });

        // Prompt mestre para análise visual
        this.masterPrompt = `Você é um especialista em análise visual e psicologia do consumidor. Sua missão é analisar profundamente cada elemento visual de conteúdo digital para identificar padrões que geram engajamento viral.

CONTEXTO DE ANÁLISE:
- Analise composição, cores, iluminação, enquadramento e elementos visuais
- Identifique gatilhos psicológicos e emocionais presentes na imagem/vídeo
- Avalie a qualidade técnica e profissional do conteúdo
- Detecte tendências visuais e padrões de design

ASPECTOS A ANALISAR:

1. COMPOSIÇÃO VISUAL:
   - Regra dos terços e pontos focais
   - Hierarquia visual e fluxo do olhar
   - Equilíbrio e simetria
   - Uso do espaço negativo

2. PSICOLOGIA DAS CORES:
   - Paleta cromática e harmonia
   - Impacto emocional das cores
   - Contraste e legibilidade
   - Associações culturais e simbólicas

3. ELEMENTOS HUMANOS:
   - Expressões faciais e linguagem corporal
   - Idade, gênero e diversidade representada
   - Emoções transmitidas
   - Conexão com a audiência

4. QUALIDADE TÉCNICA:
   - Resolução e nitidez
   - Iluminação e exposição
   - Estabilidade (para vídeos)
   - Qualidade de áudio (quando aplicável)

5. TENDÊNCIAS E PADRÕES:
   - Elementos de design em alta
   - Filtros e efeitos populares
   - Estilos visuais emergentes
   - Referências culturais

FORMATO DE SAÍDA:
Forneça uma análise estruturada em JSON com:
- visual_score: Pontuação geral (0-100)
- composition_analysis: Análise da composição
- color_psychology: Impacto das cores
- emotional_triggers: Gatilhos emocionais identificados
- technical_quality: Avaliação técnica
- trend_alignment: Alinhamento com tendências
- viral_potential: Potencial viral (0-100)
- recommendations: Sugestões de melhoria
- target_demographics: Demografia alvo identificada`;

        // Configurações específicas para análise visual
        this.visualConfig = {
            supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
            maxImageSize: 20 * 1024 * 1024, // 20MB
            analysisTypes: ['composition', 'color', 'emotion', 'technical', 'trends'],
            colorPalettes: {
                warm: ['#FF6B6B', '#FF8E53', '#FF6B9D', '#FFA726'],
                cool: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
                neutral: ['#DDD6FE', '#F3F4F6', '#E5E7EB', '#9CA3AF'],
                vibrant: ['#FF0080', '#00FF80', '#8000FF', '#FF8000']
            }
        };
    }

    /**
     * Formata prompt específico para análise visual
     */
    formatAnalysisPrompt(analysisData, options) {
        const { content, options: analysisOptions, context } = analysisData;
        
        let prompt = `ANÁLISE DE CONTEÚDO VISUAL

DADOS DO CONTEÚDO:
- ID: ${content.id}
- Plataforma: ${content.platform}
- Tipo: ${content.contentType}
- Autor: ${content.author}
- URL: ${content.url}

TEXTO ASSOCIADO:
"${content.text}"

MÉTRICAS DE ENGAJAMENTO:
- Likes: ${content.metrics.likes || 0}
- Comentários: ${content.metrics.comments || 0}
- Compartilhamentos: ${content.metrics.shares || 0}
- Visualizações: ${content.metrics.views || 0}

HASHTAGS: ${content.hashtags.join(', ') || 'Nenhuma'}

CONFIGURAÇÕES DE ANÁLISE:
- Idioma: ${analysisOptions.language}
- Nicho: ${analysisOptions.niche}
- Profundidade: ${analysisOptions.analysisDepth}`;

        // Adicionar contexto de tendências se disponível
        if (context.recentAnalyses && context.recentAnalyses.length > 0) {
            prompt += `\n\nCONTEXTO DE TENDÊNCIAS RECENTES:
Análises similares recentes mostraram padrões de: ${this.extractTrendPatterns(context.recentAnalyses)}`;
        }

        // Adicionar instruções específicas do nicho
        if (analysisOptions.niche !== 'general') {
            prompt += `\n\nINSTRUÇÕES ESPECÍFICAS DO NICHO "${analysisOptions.niche}":
- Considere as preferências visuais específicas deste nicho
- Identifique elementos que ressoam com a audiência-alvo
- Sugira adaptações para maximizar o engajamento no nicho`;
        }

        prompt += `\n\nPor favor, analise este conteúdo visual considerando todos os aspectos mencionados e forneça uma análise detalhada em formato JSON.`;

        return prompt;
    }

    /**
     * Analisa conteúdo visual com imagem/vídeo
     */
    async analyzeVisualContent(content, imageUrl, options = {}) {
        try {
            this.logger.info(`Analisando conteúdo visual: ${content.id}`);

            // Verificar se a URL da imagem é válida
            if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
                throw new Error('URL de imagem inválida ou não fornecida');
            }

            // Preparar dados para análise visual
            const analysisData = await this.prepareAnalysisData(content, options);
            
            // Executar análise visual com imagem
            const result = await this.analyzeWithImage(analysisData, imageUrl, options);
            
            // Processar resultado específico para análise visual
            const processedResult = await this.processVisualAnalysisResult(result, content, imageUrl);
            
            return processedResult;

        } catch (error) {
            this.logger.error('Erro na análise visual:', error);
            return {
                success: false,
                error: error.message,
                agentName: this.agentName,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Executa análise com imagem usando GPT-4 Vision
     */
    async analyzeWithImage(analysisData, imageUrl, options) {
        const messages = [
            {
                role: 'system',
                content: this.masterPrompt
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: this.formatAnalysisPrompt(analysisData, options)
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                            detail: 'high'
                        }
                    }
                ]
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
     * Processa resultado específico da análise visual
     */
    async processVisualAnalysisResult(result, originalContent, imageUrl) {
        const processedResult = await super.processAnalysisResult(result, originalContent);
        
        // Adicionar dados específicos da análise visual
        processedResult.visualAnalysis = {
            imageUrl: imageUrl,
            analysisType: 'visual',
            visualElements: this.extractVisualElements(result),
            colorAnalysis: this.analyzeColorPalette(result),
            compositionScore: this.calculateCompositionScore(result),
            emotionalImpact: this.assessEmotionalImpact(result),
            trendAlignment: this.assessTrendAlignment(result)
        };

        // Gerar recomendações visuais específicas
        processedResult.visualRecommendations = await this.generateVisualRecommendations(result, originalContent);

        return processedResult;
    }

    /**
     * Extrai elementos visuais identificados
     */
    extractVisualElements(analysisResult) {
        const elements = {
            dominantColors: [],
            composition: {},
            humanElements: {},
            technicalAspects: {},
            designTrends: []
        };

        try {
            // Extrair cores dominantes
            if (analysisResult.color_psychology) {
                elements.dominantColors = this.extractDominantColors(analysisResult.color_psychology);
            }

            // Extrair aspectos de composição
            if (analysisResult.composition_analysis) {
                elements.composition = {
                    balance: analysisResult.composition_analysis.balance || 'unknown',
                    focusPoints: analysisResult.composition_analysis.focus_points || [],
                    symmetry: analysisResult.composition_analysis.symmetry || 'unknown'
                };
            }

            // Extrair elementos humanos
            if (analysisResult.emotional_triggers) {
                elements.humanElements = {
                    facialExpressions: analysisResult.emotional_triggers.facial_expressions || [],
                    bodyLanguage: analysisResult.emotional_triggers.body_language || 'unknown',
                    emotions: analysisResult.emotional_triggers.emotions || []
                };
            }

            // Extrair aspectos técnicos
            if (analysisResult.technical_quality) {
                elements.technicalAspects = {
                    quality: analysisResult.technical_quality.overall || 'unknown',
                    lighting: analysisResult.technical_quality.lighting || 'unknown',
                    sharpness: analysisResult.technical_quality.sharpness || 'unknown'
                };
            }

        } catch (error) {
            this.logger.warn('Erro ao extrair elementos visuais:', error);
        }

        return elements;
    }

    /**
     * Analisa paleta de cores
     */
    analyzeColorPalette(analysisResult) {
        const colorAnalysis = {
            palette: 'unknown',
            harmony: 'unknown',
            emotionalImpact: 'neutral',
            culturalAssociations: [],
            recommendations: []
        };

        try {
            if (analysisResult.color_psychology) {
                const colorData = analysisResult.color_psychology;
                
                // Determinar tipo de paleta
                colorAnalysis.palette = this.identifyPaletteType(colorData);
                
                // Avaliar harmonia
                colorAnalysis.harmony = colorData.harmony || 'unknown';
                
                // Impacto emocional
                colorAnalysis.emotionalImpact = colorData.emotional_impact || 'neutral';
                
                // Associações culturais
                colorAnalysis.culturalAssociations = colorData.cultural_associations || [];
            }

        } catch (error) {
            this.logger.warn('Erro na análise de cores:', error);
        }

        return colorAnalysis;
    }

    /**
     * Identifica tipo de paleta de cores
     */
    identifyPaletteType(colorData) {
        // Implementação simplificada - em produção seria mais sofisticada
        const description = (colorData.description || '').toLowerCase();
        
        if (description.includes('warm') || description.includes('quente')) return 'warm';
        if (description.includes('cool') || description.includes('frio')) return 'cool';
        if (description.includes('vibrant') || description.includes('vibrante')) return 'vibrant';
        if (description.includes('neutral') || description.includes('neutro')) return 'neutral';
        
        return 'mixed';
    }

    /**
     * Calcula score de composição
     */
    calculateCompositionScore(analysisResult) {
        let score = 50; // Base

        try {
            if (analysisResult.composition_analysis) {
                const comp = analysisResult.composition_analysis;
                
                // Regra dos terços
                if (comp.rule_of_thirds === 'good' || comp.rule_of_thirds === 'excellent') {
                    score += 15;
                }
                
                // Equilíbrio
                if (comp.balance === 'good' || comp.balance === 'excellent') {
                    score += 10;
                }
                
                // Hierarquia visual
                if (comp.visual_hierarchy === 'clear' || comp.visual_hierarchy === 'excellent') {
                    score += 10;
                }
                
                // Uso do espaço
                if (comp.space_usage === 'effective' || comp.space_usage === 'excellent') {
                    score += 10;
                }
            }

        } catch (error) {
            this.logger.warn('Erro ao calcular score de composição:', error);
        }

        return Math.min(score, 100);
    }

    /**
     * Avalia impacto emocional
     */
    assessEmotionalImpact(analysisResult) {
        const impact = {
            primaryEmotion: 'neutral',
            intensity: 'medium',
            triggers: [],
            audienceConnection: 'moderate'
        };

        try {
            if (analysisResult.emotional_triggers) {
                const emotional = analysisResult.emotional_triggers;
                
                impact.primaryEmotion = emotional.primary_emotion || 'neutral';
                impact.intensity = emotional.intensity || 'medium';
                impact.triggers = emotional.triggers || [];
                impact.audienceConnection = emotional.audience_connection || 'moderate';
            }

        } catch (error) {
            this.logger.warn('Erro ao avaliar impacto emocional:', error);
        }

        return impact;
    }

    /**
     * Avalia alinhamento com tendências
     */
    assessTrendAlignment(analysisResult) {
        const alignment = {
            currentTrends: [],
            trendScore: 50,
            emergingElements: [],
            timelessElements: []
        };

        try {
            if (analysisResult.trend_alignment) {
                const trends = analysisResult.trend_alignment;
                
                alignment.currentTrends = trends.current_trends || [];
                alignment.trendScore = trends.trend_score || 50;
                alignment.emergingElements = trends.emerging_elements || [];
                alignment.timelessElements = trends.timeless_elements || [];
            }

        } catch (error) {
            this.logger.warn('Erro ao avaliar tendências:', error);
        }

        return alignment;
    }

    /**
     * Gera recomendações visuais específicas
     */
    async generateVisualRecommendations(analysisResult, originalContent) {
        const recommendations = {
            immediate: [],
            strategic: [],
            experimental: []
        };

        try {
            // Recomendações imediatas baseadas na análise
            if (analysisResult.recommendations) {
                analysisResult.recommendations.forEach(rec => {
                    if (rec.priority === 'high' || rec.type === 'immediate') {
                        recommendations.immediate.push(rec);
                    } else if (rec.type === 'strategic') {
                        recommendations.strategic.push(rec);
                    } else {
                        recommendations.experimental.push(rec);
                    }
                });
            }

            // Adicionar recomendações específicas baseadas nos scores
            if (analysisResult.visual_score < 70) {
                recommendations.immediate.push({
                    type: 'composition',
                    description: 'Melhorar composição visual seguindo regra dos terços',
                    priority: 'high',
                    impact: 'high'
                });
            }

            if (analysisResult.viral_potential < 60) {
                recommendations.strategic.push({
                    type: 'viral_optimization',
                    description: 'Incorporar elementos visuais com maior potencial viral',
                    priority: 'medium',
                    impact: 'high'
                });
            }

        } catch (error) {
            this.logger.warn('Erro ao gerar recomendações:', error);
        }

        return recommendations;
    }

    /**
     * Extrai padrões de tendências de análises recentes
     */
    extractTrendPatterns(recentAnalyses) {
        const patterns = [];
        
        try {
            recentAnalyses.forEach(analysis => {
                if (analysis.result && analysis.result.trend_alignment) {
                    const trends = analysis.result.trend_alignment.current_trends || [];
                    patterns.push(...trends);
                }
            });

            // Remover duplicatas e pegar os mais comuns
            const trendCounts = {};
            patterns.forEach(trend => {
                trendCounts[trend] = (trendCounts[trend] || 0) + 1;
            });

            return Object.entries(trendCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([trend]) => trend)
                .join(', ');

        } catch (error) {
            this.logger.warn('Erro ao extrair padrões de tendências:', error);
            return 'cores vibrantes, composição minimalista, elementos humanos';
        }
    }

    /**
     * Extrai cores dominantes da análise
     */
    extractDominantColors(colorPsychology) {
        const colors = [];
        
        try {
            if (colorPsychology.dominant_colors) {
                colors.push(...colorPsychology.dominant_colors);
            } else if (colorPsychology.palette) {
                // Mapear paleta para cores específicas
                const paletteColors = this.visualConfig.colorPalettes[colorPsychology.palette] || [];
                colors.push(...paletteColors);
            }

        } catch (error) {
            this.logger.warn('Erro ao extrair cores dominantes:', error);
        }

        return colors;
    }

    /**
     * Valida URL de imagem
     */
    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            const extension = urlObj.pathname.split('.').pop().toLowerCase();
            return this.visualConfig.supportedFormats.includes(extension);
        } catch {
            return false;
        }
    }

    /**
     * Calcula confiança específica para análise visual
     */
    calculateConfidence(result) {
        let confidence = 0.7; // Base para análise visual

        try {
            // Ajustar baseado na completude da análise visual
            if (result.visual_score !== undefined) confidence += 0.1;
            if (result.composition_analysis && Object.keys(result.composition_analysis).length > 2) confidence += 0.05;
            if (result.color_psychology && Object.keys(result.color_psychology).length > 2) confidence += 0.05;
            if (result.emotional_triggers && result.emotional_triggers.length > 0) confidence += 0.05;
            if (result.technical_quality && Object.keys(result.technical_quality).length > 2) confidence += 0.05;

        } catch (error) {
            this.logger.warn('Erro ao calcular confiança:', error);
        }

        return Math.min(confidence, 1.0);
    }
}

module.exports = VisualContentAnalyzer;

