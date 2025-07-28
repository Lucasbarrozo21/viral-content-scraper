const BaseAgent = require('../base_agent');
const Sentiment = require('sentiment');

/**
 * Agente de Análise Textual (Content Copy Analyzer)
 * Especializado em analisar copy, legendas e elementos textuais
 * para identificar técnicas persuasivas e gatilhos psicológicos
 */
class ContentCopyAnalyzer extends BaseAgent {
    constructor(config = {}) {
        super('ContentCopyAnalyzer', {
            model: 'gpt-4-turbo-preview',
            maxTokens: 4000,
            temperature: 0.2,
            ...config
        });

        // Inicializar analisador de sentimento
        this.sentiment = new Sentiment();

        // Prompt mestre para análise textual
        this.masterPrompt = `Você é um copywriter mestre e psicólogo comportamental especializado em análise de conteúdo viral. Sua expertise está em dissecar cada palavra, frase e estrutura textual para identificar elementos que geram engajamento massivo.

CONTEXTO DE ANÁLISE:
- Analise copy, legendas, títulos e descrições
- Identifique gatilhos psicológicos e técnicas persuasivas
- Avalie tom, sentimento e impacto emocional
- Detecte padrões linguísticos virais

DIMENSÕES DE ANÁLISE:

1. ESTRUTURA PERSUASIVA:
   - Hooks de abertura e primeiras impressões
   - Desenvolvimento da narrativa
   - Calls-to-action e direcionamentos
   - Fechamento e memorabilidade

2. GATILHOS PSICOLÓGICOS:
   - Escassez e urgência
   - Prova social e autoridade
   - Reciprocidade e compromisso
   - Medo de perder (FOMO)
   - Curiosidade e lacunas de informação

3. ANÁLISE EMOCIONAL:
   - Sentimento predominante (positivo/negativo/neutro)
   - Intensidade emocional (0-10)
   - Emoções específicas evocadas
   - Jornada emocional do texto

4. LINGUAGEM E ESTILO:
   - Tom de voz e personalidade
   - Nível de formalidade
   - Uso de gírias e expressões populares
   - Ritmo e cadência

5. ELEMENTOS VIRAIS:
   - Hashtags estratégicas
   - Palavras-chave trending
   - Frases de impacto
   - Elementos compartilháveis

6. SEGMENTAÇÃO:
   - Linguagem específica do nicho
   - Referências culturais
   - Idade e demografia alvo
   - Interesses e comportamentos

FORMATO DE SAÍDA:
Retorne análise em JSON:
- text_score: Pontuação geral (0-100)
- persuasion_techniques: Técnicas identificadas
- emotional_analysis: Análise emocional completa
- psychological_triggers: Gatilhos psicológicos
- viral_elements: Elementos com potencial viral
- target_audience: Audiência alvo
- sentiment_score: Análise de sentimento (-1 a 1)
- engagement_prediction: Predição de engajamento
- optimization_suggestions: Sugestões de otimização`;

        // Configurações específicas para análise textual
        this.textConfig = {
            maxTextLength: 10000,
            minTextLength: 10,
            supportedLanguages: ['pt', 'en', 'es', 'fr'],
            persuasionTechniques: [
                'scarcity', 'urgency', 'social_proof', 'authority', 'reciprocity',
                'commitment', 'liking', 'contrast', 'reason_why', 'storytelling'
            ],
            emotionalTriggers: [
                'fear', 'joy', 'anger', 'surprise', 'sadness', 'disgust',
                'anticipation', 'trust', 'curiosity', 'pride', 'nostalgia'
            ],
            viralPatterns: [
                'question_hook', 'controversy', 'relatability', 'humor',
                'inspiration', 'shock_value', 'trending_reference', 'call_to_action'
            ]
        };

        // Dicionários de palavras-chave
        this.keywordDictionaries = {
            urgency: ['agora', 'hoje', 'rápido', 'último', 'limitado', 'expires', 'deadline'],
            scarcity: ['apenas', 'somente', 'exclusivo', 'limitado', 'restrito', 'rare', 'limited'],
            emotion: ['incrível', 'surpreendente', 'chocante', 'emocionante', 'amazing', 'shocking'],
            social_proof: ['milhões', 'todos', 'popular', 'viral', 'trending', 'everyone', 'millions'],
            authority: ['especialista', 'profissional', 'cientista', 'expert', 'professional', 'proven']
        };
    }

    /**
     * Formata prompt específico para análise textual
     */
    formatAnalysisPrompt(analysisData, options) {
        const { content, options: analysisOptions, context } = analysisData;
        
        // Pré-processar texto para análise
        const preprocessedText = this.preprocessText(content.text);
        const sentimentAnalysis = this.analyzeSentiment(content.text);
        const keywordAnalysis = this.analyzeKeywords(content.text);

        let prompt = `ANÁLISE DE CONTEÚDO TEXTUAL

DADOS DO CONTEÚDO:
- ID: ${content.id}
- Plataforma: ${content.platform}
- Tipo: ${content.contentType}
- Autor: ${content.author}

TEXTO PARA ANÁLISE:
"${preprocessedText}"

HASHTAGS: ${content.hashtags.join(', ') || 'Nenhuma'}
MENÇÕES: ${content.mentions.join(', ') || 'Nenhuma'}

MÉTRICAS DE ENGAJAMENTO:
- Likes: ${content.metrics.likes || 0}
- Comentários: ${content.metrics.comments || 0}
- Compartilhamentos: ${content.metrics.shares || 0}
- Visualizações: ${content.metrics.views || 0}

PRÉ-ANÁLISE AUTOMÁTICA:
- Comprimento do texto: ${preprocessedText.length} caracteres
- Sentimento inicial: ${sentimentAnalysis.score > 0 ? 'Positivo' : sentimentAnalysis.score < 0 ? 'Negativo' : 'Neutro'} (${sentimentAnalysis.score})
- Palavras-chave identificadas: ${keywordAnalysis.join(', ') || 'Nenhuma'}

CONFIGURAÇÕES DE ANÁLISE:
- Idioma: ${analysisOptions.language}
- Nicho: ${analysisOptions.niche}
- Profundidade: ${analysisOptions.analysisDepth}`;

        // Adicionar contexto de padrões textuais recentes
        if (context.recentAnalyses && context.recentAnalyses.length > 0) {
            const textPatterns = this.extractTextPatterns(context.recentAnalyses);
            prompt += `\n\nPADRÕES TEXTUAIS RECENTES:
${textPatterns}`;
        }

        // Adicionar instruções específicas do nicho
        if (analysisOptions.niche !== 'general') {
            prompt += `\n\nINSTRUÇÕES ESPECÍFICAS DO NICHO "${analysisOptions.niche}":
- Considere a linguagem e terminologia específica deste nicho
- Identifique referências culturais relevantes para a audiência
- Avalie a adequação do tom para o público-alvo
- Sugira adaptações para maximizar o engajamento no nicho`;
        }

        prompt += `\n\nPor favor, analise este conteúdo textual considerando todos os aspectos mencionados e forneça uma análise detalhada em formato JSON.`;

        return prompt;
    }

    /**
     * Pré-processa texto para análise
     */
    preprocessText(text) {
        if (!text) return '';
        
        // Limpar e normalizar texto
        let processed = text
            .replace(/\s+/g, ' ') // Normalizar espaços
            .replace(/[^\w\s\u00C0-\u017F#@.,!?()-]/g, '') // Remover caracteres especiais, manter acentos
            .trim();

        // Limitar comprimento se necessário
        if (processed.length > this.textConfig.maxTextLength) {
            processed = processed.substring(0, this.textConfig.maxTextLength) + '...';
        }

        return processed;
    }

    /**
     * Analisa sentimento do texto
     */
    analyzeSentiment(text) {
        try {
            const result = this.sentiment.analyze(text);
            return {
                score: result.score,
                comparative: result.comparative,
                positive: result.positive,
                negative: result.negative,
                tokens: result.tokens.length
            };
        } catch (error) {
            this.logger.warn('Erro na análise de sentimento:', error);
            return { score: 0, comparative: 0, positive: [], negative: [], tokens: 0 };
        }
    }

    /**
     * Analisa palavras-chave específicas
     */
    analyzeKeywords(text) {
        const foundKeywords = [];
        const lowerText = text.toLowerCase();

        try {
            // Verificar cada categoria de palavras-chave
            Object.entries(this.keywordDictionaries).forEach(([category, keywords]) => {
                keywords.forEach(keyword => {
                    if (lowerText.includes(keyword)) {
                        foundKeywords.push(`${keyword} (${category})`);
                    }
                });
            });

        } catch (error) {
            this.logger.warn('Erro na análise de palavras-chave:', error);
        }

        return foundKeywords;
    }

    /**
     * Processa resultado específico da análise textual
     */
    async processAnalysisResult(result, originalContent) {
        const processedResult = await super.processAnalysisResult(result, originalContent);
        
        // Adicionar dados específicos da análise textual
        processedResult.textAnalysis = {
            analysisType: 'textual',
            textLength: originalContent.text?.length || 0,
            languageDetected: this.detectLanguage(originalContent.text),
            readabilityScore: this.calculateReadabilityScore(originalContent.text),
            keywordDensity: this.calculateKeywordDensity(originalContent.text),
            sentimentAnalysis: this.analyzeSentiment(originalContent.text),
            persuasionElements: this.extractPersuasionElements(result),
            viralIndicators: this.extractViralIndicators(result)
        };

        // Gerar recomendações textuais específicas
        processedResult.textRecommendations = await this.generateTextRecommendations(result, originalContent);

        return processedResult;
    }

    /**
     * Detecta idioma do texto
     */
    detectLanguage(text) {
        if (!text) return 'unknown';
        
        // Implementação simplificada - em produção usar biblioteca especializada
        const patterns = {
            'pt': /\b(que|com|para|uma|por|mais|seu|sua|tem|são|foi|ser|ter|como|muito|quando|onde|porque)\b/gi,
            'en': /\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)\b/gi,
            'es': /\b(que|con|para|una|por|más|sus|son|fue|ser|muy|cuando|donde|porque|como|todo|pero|este|esta|desde|hasta)\b/gi
        };
        
        let maxMatches = 0;
        let detectedLang = 'unknown';
        
        for (const [lang, pattern] of Object.entries(patterns)) {
            const matches = (text.match(pattern) || []).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedLang = lang;
            }
        }
        
        return detectedLang;
    }

    /**
     * Calcula score de legibilidade
     */
    calculateReadabilityScore(text) {
        if (!text) return 0;
        
        try {
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const words = text.split(/\s+/).filter(w => w.length > 0);
            const syllables = this.countSyllables(text);
            
            // Fórmula simplificada de Flesch Reading Ease adaptada
            const avgWordsPerSentence = words.length / sentences.length;
            const avgSyllablesPerWord = syllables / words.length;
            
            const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
            
            return Math.max(0, Math.min(100, score));
            
        } catch (error) {
            this.logger.warn('Erro ao calcular legibilidade:', error);
            return 50; // Score neutro
        }
    }

    /**
     * Conta sílabas aproximadamente
     */
    countSyllables(text) {
        if (!text) return 0;
        
        // Implementação simplificada
        const words = text.toLowerCase().split(/\s+/);
        let totalSyllables = 0;
        
        words.forEach(word => {
            // Contar vogais como aproximação de sílabas
            const vowels = word.match(/[aeiouáéíóúàèìòùâêîôûãõ]/g);
            const syllableCount = vowels ? vowels.length : 1;
            totalSyllables += Math.max(1, syllableCount);
        });
        
        return totalSyllables;
    }

    /**
     * Calcula densidade de palavras-chave
     */
    calculateKeywordDensity(text) {
        if (!text) return {};
        
        const words = text.toLowerCase().split(/\s+/);
        const totalWords = words.length;
        const density = {};
        
        try {
            // Calcular densidade para cada categoria
            Object.entries(this.keywordDictionaries).forEach(([category, keywords]) => {
                let categoryCount = 0;
                
                keywords.forEach(keyword => {
                    const keywordCount = words.filter(word => word.includes(keyword)).length;
                    categoryCount += keywordCount;
                });
                
                density[category] = totalWords > 0 ? (categoryCount / totalWords * 100).toFixed(2) : 0;
            });
            
        } catch (error) {
            this.logger.warn('Erro ao calcular densidade de palavras-chave:', error);
        }
        
        return density;
    }

    /**
     * Extrai elementos de persuasão identificados
     */
    extractPersuasionElements(analysisResult) {
        const elements = {
            techniques: [],
            triggers: [],
            hooks: [],
            callsToAction: []
        };

        try {
            if (analysisResult.persuasion_techniques) {
                elements.techniques = Array.isArray(analysisResult.persuasion_techniques) 
                    ? analysisResult.persuasion_techniques 
                    : Object.keys(analysisResult.persuasion_techniques);
            }

            if (analysisResult.psychological_triggers) {
                elements.triggers = Array.isArray(analysisResult.psychological_triggers)
                    ? analysisResult.psychological_triggers
                    : Object.keys(analysisResult.psychological_triggers);
            }

            if (analysisResult.viral_elements) {
                if (analysisResult.viral_elements.hooks) {
                    elements.hooks = analysisResult.viral_elements.hooks;
                }
                if (analysisResult.viral_elements.calls_to_action) {
                    elements.callsToAction = analysisResult.viral_elements.calls_to_action;
                }
            }

        } catch (error) {
            this.logger.warn('Erro ao extrair elementos de persuasão:', error);
        }

        return elements;
    }

    /**
     * Extrai indicadores virais
     */
    extractViralIndicators(analysisResult) {
        const indicators = {
            viralScore: 0,
            shareability: 'low',
            memorability: 'low',
            emotionalIntensity: 'low',
            trendAlignment: 'low'
        };

        try {
            if (analysisResult.viral_elements) {
                const viral = analysisResult.viral_elements;
                
                indicators.viralScore = viral.viral_score || 0;
                indicators.shareability = viral.shareability || 'low';
                indicators.memorability = viral.memorability || 'low';
            }

            if (analysisResult.emotional_analysis) {
                indicators.emotionalIntensity = analysisResult.emotional_analysis.intensity || 'low';
            }

            if (analysisResult.engagement_prediction) {
                indicators.trendAlignment = analysisResult.engagement_prediction.trend_alignment || 'low';
            }

        } catch (error) {
            this.logger.warn('Erro ao extrair indicadores virais:', error);
        }

        return indicators;
    }

    /**
     * Gera recomendações textuais específicas
     */
    async generateTextRecommendations(analysisResult, originalContent) {
        const recommendations = {
            immediate: [],
            strategic: [],
            experimental: []
        };

        try {
            // Recomendações baseadas no score textual
            if (analysisResult.text_score < 70) {
                recommendations.immediate.push({
                    type: 'text_optimization',
                    description: 'Melhorar estrutura e flow do texto',
                    priority: 'high',
                    impact: 'high',
                    specific_actions: [
                        'Criar hook mais impactante na abertura',
                        'Adicionar mais gatilhos emocionais',
                        'Incluir call-to-action mais claro'
                    ]
                });
            }

            // Recomendações baseadas em sentimento
            const sentiment = this.analyzeSentiment(originalContent.text);
            if (Math.abs(sentiment.score) < 2) {
                recommendations.strategic.push({
                    type: 'emotional_enhancement',
                    description: 'Aumentar intensidade emocional do conteúdo',
                    priority: 'medium',
                    impact: 'high',
                    specific_actions: [
                        'Usar palavras com maior carga emocional',
                        'Incluir storytelling pessoal',
                        'Adicionar elementos de surpresa'
                    ]
                });
            }

            // Recomendações baseadas em hashtags
            if (originalContent.hashtags.length < 3) {
                recommendations.immediate.push({
                    type: 'hashtag_optimization',
                    description: 'Otimizar uso de hashtags estratégicas',
                    priority: 'medium',
                    impact: 'medium',
                    specific_actions: [
                        'Adicionar hashtags trending relevantes',
                        'Incluir hashtags de nicho específico',
                        'Balancear hashtags populares e específicas'
                    ]
                });
            }

            // Recomendações baseadas em legibilidade
            const readability = this.calculateReadabilityScore(originalContent.text);
            if (readability < 60) {
                recommendations.strategic.push({
                    type: 'readability_improvement',
                    description: 'Melhorar legibilidade e clareza do texto',
                    priority: 'medium',
                    impact: 'medium',
                    specific_actions: [
                        'Usar frases mais curtas',
                        'Simplificar vocabulário complexo',
                        'Adicionar quebras de linha estratégicas'
                    ]
                });
            }

            // Adicionar recomendações da análise da IA
            if (analysisResult.optimization_suggestions) {
                analysisResult.optimization_suggestions.forEach(suggestion => {
                    const category = suggestion.priority === 'high' ? 'immediate' : 
                                   suggestion.priority === 'medium' ? 'strategic' : 'experimental';
                    
                    recommendations[category].push({
                        type: 'ai_suggestion',
                        description: suggestion.description || suggestion,
                        priority: suggestion.priority || 'medium',
                        impact: suggestion.impact || 'medium',
                        source: 'ai_analysis'
                    });
                });
            }

        } catch (error) {
            this.logger.warn('Erro ao gerar recomendações textuais:', error);
        }

        return recommendations;
    }

    /**
     * Extrai padrões textuais de análises recentes
     */
    extractTextPatterns(recentAnalyses) {
        const patterns = [];
        
        try {
            recentAnalyses.forEach(analysis => {
                if (analysis.result) {
                    // Extrair técnicas de persuasão mais comuns
                    if (analysis.result.persuasion_techniques) {
                        patterns.push(`Técnicas: ${Object.keys(analysis.result.persuasion_techniques).join(', ')}`);
                    }
                    
                    // Extrair gatilhos psicológicos
                    if (analysis.result.psychological_triggers) {
                        patterns.push(`Gatilhos: ${Object.keys(analysis.result.psychological_triggers).join(', ')}`);
                    }
                }
            });

            return patterns.length > 0 ? patterns.join('\n') : 'Nenhum padrão específico identificado';

        } catch (error) {
            this.logger.warn('Erro ao extrair padrões textuais:', error);
            return 'Padrões comuns: storytelling, urgência, prova social';
        }
    }

    /**
     * Calcula confiança específica para análise textual
     */
    calculateConfidence(result) {
        let confidence = 0.8; // Base para análise textual

        try {
            // Ajustar baseado na completude da análise
            if (result.text_score !== undefined) confidence += 0.05;
            if (result.persuasion_techniques && Object.keys(result.persuasion_techniques).length > 0) confidence += 0.05;
            if (result.emotional_analysis && Object.keys(result.emotional_analysis).length > 2) confidence += 0.05;
            if (result.psychological_triggers && Object.keys(result.psychological_triggers).length > 0) confidence += 0.05;

        } catch (error) {
            this.logger.warn('Erro ao calcular confiança:', error);
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Adapta recomendações para nicho específico
     */
    async adaptRecommendationsToNiche(recommendations, niche, nicheContext) {
        try {
            return recommendations.map(rec => {
                const adapted = { ...rec };
                
                // Adicionar contexto específico do nicho
                if (nicheContext.commonLanguage) {
                    adapted.nicheSpecific = {
                        language: nicheContext.commonLanguage,
                        tone: nicheContext.preferredTone || 'casual',
                        keywords: nicheContext.trendingKeywords || []
                    };
                }
                
                // Adaptar descrição para o nicho
                adapted.description = `[${niche}] ${adapted.description}`;
                
                return adapted;
            });

        } catch (error) {
            this.logger.warn('Erro ao adaptar recomendações para nicho:', error);
            return recommendations;
        }
    }
}

module.exports = ContentCopyAnalyzer;

