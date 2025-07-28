/**
 * CONTENT COPY ANALYZER REVOLUCIONÁRIO - VERSÃO BILIONÁRIA
 * Especialista em análise de copy e elementos textuais persuasivos
 * 
 * Este agente foi projetado para identificar elementos textuais que geram
 * bilhões em conversões, vendas e engajamento.
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 * Versão: 2.0 - REVOLUTIONARY EDITION
 */

const BaseAgent = require('../base_agent');
const OpenAI = require('openai');
const Sentiment = require('sentiment');
const { getMasterPrompt } = require('../prompts/master_prompts');

class ContentCopyAnalyzerRevolutionary extends BaseAgent {
    constructor(config) {
        super({
            ...config,
            agentName: 'ContentCopyAnalyzerRevolutionary',
            specialization: 'copy_analysis_revolutionary',
            description: 'Especialista mundial em análise de copy que identifica elementos que geram bilhões em conversões'
        });
        
        // Configurar OpenAI com modelo mais avançado
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || config.openaiApiKey
        });
        
        // Inicializar analisador de sentimento
        this.sentiment = new Sentiment();
        
        // Prompt mestre revolucionário
        this.masterPrompt = getMasterPrompt('CONTENT_COPY_ANALYZER');
        
        // Configurações avançadas
        this.analysisConfig = {
            model: 'gpt-4-turbo-preview',
            maxTokens: 4000,
            temperature: 0.2, // Precisão alta
            includeSubconsciousAnalysis: true,
            generateOptimizationSuggestions: true
        };
        
        // Banco de dados de gatilhos psicológicos
        this.psychologicalTriggers = {
            scarcity: {
                keywords: ['apenas', 'último', 'limitado', 'restante', 'esgotando', 'exclusivo'],
                conversionBoost: 67,
                urgencyLevel: 'high'
            },
            urgency: {
                keywords: ['agora', 'hoje', 'termina', 'expire', 'rápido', 'imediato'],
                conversionBoost: 89,
                urgencyLevel: 'critical'
            },
            authority: {
                keywords: ['especialista', 'anos', 'experiência', 'certificado', 'reconhecido'],
                conversionBoost: 156,
                urgencyLevel: 'medium'
            },
            socialProof: {
                keywords: ['clientes', 'pessoas', 'usuários', 'milhões', 'aprovado'],
                conversionBoost: 234,
                urgencyLevel: 'medium'
            },
            reciprocity: {
                keywords: ['grátis', 'presente', 'oferta', 'bônus', 'cortesia'],
                conversionBoost: 123,
                urgencyLevel: 'low'
            },
            fomo: {
                keywords: ['perca', 'oportunidade', 'chance', 'momento', 'nunca mais'],
                conversionBoost: 145,
                urgencyLevel: 'high'
            },
            curiosity: {
                keywords: ['segredo', 'descobrir', 'revelado', 'método', 'truque'],
                conversionBoost: 267,
                urgencyLevel: 'medium'
            }
        };
        
        // Power words que aumentam conversão
        this.powerWords = {
            high: ['revolucionário', 'exclusivo', 'secreto', 'garantido', 'comprovado', 'instantâneo'],
            medium: ['novo', 'melhor', 'fácil', 'rápido', 'simples', 'poderoso'],
            low: ['bom', 'útil', 'interessante', 'legal', 'bacana', 'diferente']
        };
        
        // Estruturas persuasivas comprovadas
        this.persuasiveStructures = {
            aida: { pattern: 'Atenção → Interesse → Desejo → Ação', effectiveness: 85 },
            pas: { pattern: 'Problema → Agitação → Solução', effectiveness: 78 },
            pastor: { pattern: 'Problema → Amplificação → Story → Transformação → Oferta → Resposta', effectiveness: 92 },
            beforeAfterBridge: { pattern: 'Estado atual → Estado desejado → Ponte', effectiveness: 81 },
            problemSolutionProof: { pattern: 'Dor → Alívio → Evidência', effectiveness: 76 }
        };
    }

    async analyzeContent(text, options = {}) {
        try {
            this.logger.info('Iniciando análise revolucionária de copy...');
            this.startTime = Date.now();
            
            // Validar entrada
            if (!text || typeof text !== 'string') {
                throw new Error('Texto inválido para análise');
            }
            
            // Pré-processamento do texto
            const processedText = this.preprocessText(text);
            
            // Análise com IA avançada
            const aiAnalysis = await this.performAIAnalysis(processedText, options);
            
            // Análise de sentimento avançada
            const sentimentAnalysis = this.performAdvancedSentimentAnalysis(processedText);
            
            // Análise de gatilhos psicológicos
            const triggerAnalysis = this.analyzePsychologicalTriggers(processedText);
            
            // Análise de estrutura persuasiva
            const structureAnalysis = this.analyzePersuasiveStructure(processedText);
            
            // Análise de power words
            const powerWordAnalysis = this.analyzePowerWords(processedText);
            
            // Análise de conversão
            const conversionAnalysis = this.analyzeConversionPotential(aiAnalysis, triggerAnalysis, structureAnalysis);
            
            // Gerar insights bilionários
            const billionaireInsights = this.generateBillionaireInsights(aiAnalysis, conversionAnalysis);
            
            // Compilar resultado final
            const result = {
                success: true,
                timestamp: new Date().toISOString(),
                originalText: text,
                processedText,
                analysis: {
                    ai: aiAnalysis,
                    sentiment: sentimentAnalysis,
                    triggers: triggerAnalysis,
                    structure: structureAnalysis,
                    powerWords: powerWordAnalysis,
                    conversion: conversionAnalysis,
                    insights: billionaireInsights
                },
                scores: {
                    overall: this.calculateOverallScore(aiAnalysis, triggerAnalysis, conversionAnalysis),
                    persuasion: aiAnalysis.persuasionScore || 0,
                    emotional: sentimentAnalysis.emotionalIntensity,
                    conversion: conversionAnalysis.conversionScore,
                    viral: this.calculateViralScore(aiAnalysis, triggerAnalysis)
                },
                recommendations: this.generateOptimizationRecommendations(aiAnalysis, conversionAnalysis, triggerAnalysis),
                metadata: {
                    wordCount: processedText.split(/\s+/).length,
                    characterCount: processedText.length,
                    readingTime: this.calculateReadingTime(processedText),
                    processingTime: Date.now() - this.startTime,
                    model: this.analysisConfig.model,
                    version: '2.0-REVOLUTIONARY'
                }
            };
            
            // Salvar na memória evolutiva
            await this.saveToEvolutionaryMemory(result);
            
            this.logger.info(`Análise de copy concluída com score: ${result.scores.overall}/100`);
            
            return result;
            
        } catch (error) {
            this.logger.error('Erro na análise de copy:', error);
            throw error;
        }
    }

    preprocessText(text) {
        // Limpar e normalizar texto
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalizar espaços
            .replace(/[^\w\s\.\!\?\,\;\:\-\(\)]/g, '') // Remover caracteres especiais
            .toLowerCase();
    }

    async performAIAnalysis(text, options = {}) {
        try {
            this.logger.info('Executando análise IA avançada do copy...');
            
            const response = await this.openai.chat.completions.create({
                model: this.analysisConfig.model,
                max_tokens: this.analysisConfig.maxTokens,
                temperature: this.analysisConfig.temperature,
                messages: [
                    {
                        role: 'system',
                        content: this.masterPrompt
                    },
                    {
                        role: 'user',
                        content: `Analise este copy usando seu framework revolucionário. Forneça uma análise completa seguindo exatamente a estrutura do OUTPUT ESPERADO.

TEXTO PARA ANÁLISE:
"${text}"

CONTEXTO ADICIONAL:
- Nicho: ${options.niche || 'Geral'}
- Plataforma: ${options.platform || 'Multi-plataforma'}
- Objetivo: ${options.objective || 'Engajamento'}
- Audiência: ${options.audience || 'Geral'}

RESPONDA EM FORMATO JSON ESTRUTURADO com as seguintes chaves:
{
  "persuasionScore": number (0-100),
  "triggersIdentified": [array of psychological triggers],
  "emotionalMap": {object with emotional journey},
  "frictionPoints": [array of resistance elements],
  "optimizationSuggestions": [array of improvements],
  "idealAudience": {object with demographic profile},
  "performancePrediction": {object with CTR and conversion estimates},
  "billionaireInsights": [array of unique insights],
  "detailedAnalysis": {
    "hook": {object},
    "structure": {object},
    "language": {object},
    "cta": {object},
    "flow": {object}
  }
}`
                    }
                ],
                response_format: { type: 'json_object' }
            });
            
            const analysis = JSON.parse(response.choices[0].message.content);
            
            // Validar e enriquecer resposta
            return this.enrichAIAnalysis(analysis, text);
            
        } catch (error) {
            this.logger.error('Erro na análise IA:', error);
            // Fallback para análise básica
            return this.generateFallbackAnalysis(text);
        }
    }

    performAdvancedSentimentAnalysis(text) {
        try {
            // Análise básica com biblioteca Sentiment
            const basicSentiment = this.sentiment.analyze(text);
            
            // Análise avançada de emoções
            const emotionalAnalysis = this.analyzeEmotions(text);
            
            // Análise de intensidade emocional
            const intensityAnalysis = this.analyzeEmotionalIntensity(text);
            
            // Análise de jornada emocional
            const journeyAnalysis = this.analyzeEmotionalJourney(text);
            
            return {
                basicSentiment: {
                    score: basicSentiment.score,
                    comparative: basicSentiment.comparative,
                    positive: basicSentiment.positive,
                    negative: basicSentiment.negative
                },
                emotions: emotionalAnalysis,
                emotionalIntensity: intensityAnalysis.intensity,
                emotionalJourney: journeyAnalysis,
                overallSentiment: this.categorizeOverallSentiment(basicSentiment.score),
                emotionalResonance: this.calculateEmotionalResonance(emotionalAnalysis, intensityAnalysis)
            };
            
        } catch (error) {
            this.logger.error('Erro na análise de sentimento:', error);
            return {
                basicSentiment: { score: 0, comparative: 0 },
                emotions: [],
                emotionalIntensity: 5,
                overallSentiment: 'neutral'
            };
        }
    }

    analyzePsychologicalTriggers(text) {
        const triggersFound = [];
        let totalConversionBoost = 0;
        
        // Analisar cada tipo de gatilho
        for (const [triggerType, triggerData] of Object.entries(this.psychologicalTriggers)) {
            const matches = triggerData.keywords.filter(keyword => 
                text.includes(keyword.toLowerCase())
            );
            
            if (matches.length > 0) {
                triggersFound.push({
                    type: triggerType,
                    matches,
                    conversionBoost: triggerData.conversionBoost,
                    urgencyLevel: triggerData.urgencyLevel,
                    strength: this.calculateTriggerStrength(matches, triggerData)
                });
                
                totalConversionBoost += triggerData.conversionBoost;
            }
        }
        
        return {
            triggersFound,
            totalTriggers: triggersFound.length,
            totalConversionBoost,
            averageBoost: triggersFound.length > 0 ? totalConversionBoost / triggersFound.length : 0,
            triggerDensity: this.calculateTriggerDensity(triggersFound, text),
            recommendations: this.generateTriggerRecommendations(triggersFound)
        };
    }

    analyzePersuasiveStructure(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Identificar estrutura persuasiva
        const structureAnalysis = {};
        
        for (const [structureName, structureData] of Object.entries(this.persuasiveStructures)) {
            const match = this.identifyStructurePattern(sentences, structureName);
            if (match.confidence > 0.3) {
                structureAnalysis[structureName] = {
                    ...structureData,
                    confidence: match.confidence,
                    elements: match.elements
                };
            }
        }
        
        // Analisar fluxo narrativo
        const narrativeFlow = this.analyzeNarrativeFlow(sentences);
        
        // Analisar hooks e CTAs
        const hookAnalysis = this.analyzeHook(sentences[0] || '');
        const ctaAnalysis = this.analyzeCTA(sentences[sentences.length - 1] || '');
        
        return {
            identifiedStructures: structureAnalysis,
            narrativeFlow,
            hook: hookAnalysis,
            cta: ctaAnalysis,
            structureScore: this.calculateStructureScore(structureAnalysis, narrativeFlow),
            recommendations: this.generateStructureRecommendations(structureAnalysis, hookAnalysis, ctaAnalysis)
        };
    }

    analyzePowerWords(text) {
        const wordsFound = {
            high: [],
            medium: [],
            low: []
        };
        
        let totalPowerScore = 0;
        
        // Analisar cada categoria de power words
        for (const [category, words] of Object.entries(this.powerWords)) {
            const matches = words.filter(word => 
                text.includes(word.toLowerCase())
            );
            
            wordsFound[category] = matches;
            
            // Calcular score baseado na categoria
            const categoryMultiplier = category === 'high' ? 3 : category === 'medium' ? 2 : 1;
            totalPowerScore += matches.length * categoryMultiplier;
        }
        
        const totalWords = Object.values(wordsFound).flat().length;
        const wordDensity = totalWords / text.split(/\s+/).length;
        
        return {
            wordsFound,
            totalPowerWords: totalWords,
            powerScore: totalPowerScore,
            wordDensity,
            category: this.categorizePowerWordUsage(totalPowerScore),
            recommendations: this.generatePowerWordRecommendations(wordsFound, wordDensity)
        };
    }

    analyzeConversionPotential(aiAnalysis, triggerAnalysis, structureAnalysis) {
        // Fatores de conversão
        const factors = {
            aiScore: aiAnalysis.persuasionScore || 0,
            triggers: triggerAnalysis.totalConversionBoost / 10, // Normalizar
            structure: structureAnalysis.structureScore || 0,
            hook: structureAnalysis.hook?.strength || 0,
            cta: structureAnalysis.cta?.strength || 0
        };
        
        // Pesos para cada fator
        const weights = {
            aiScore: 0.3,
            triggers: 0.25,
            structure: 0.2,
            hook: 0.15,
            cta: 0.1
        };
        
        // Calcular score de conversão
        const conversionScore = Object.entries(factors).reduce(
            (score, [factor, value]) => score + (value * weights[factor]), 0
        );
        
        // Previsões de performance
        const predictions = this.generateConversionPredictions(conversionScore, factors);
        
        return {
            conversionScore: Math.round(Math.min(conversionScore, 100)),
            factors,
            predictions,
            category: this.categorizeConversionPotential(conversionScore),
            bottlenecks: this.identifyConversionBottlenecks(factors),
            opportunities: this.identifyConversionOpportunities(factors)
        };
    }

    generateBillionaireInsights(aiAnalysis, conversionAnalysis) {
        return {
            commercialPotential: this.calculateCommercialPotential(aiAnalysis, conversionAnalysis),
            marketOpportunities: this.identifyMarketOpportunities(aiAnalysis),
            scalingStrategies: this.generateScalingStrategies(conversionAnalysis),
            monetizationPaths: this.identifyMonetizationPaths(aiAnalysis, conversionAnalysis),
            competitiveAdvantages: this.identifyCompetitiveAdvantages(aiAnalysis),
            riskFactors: this.identifyRiskFactors(aiAnalysis, conversionAnalysis),
            investmentPotential: this.calculateInvestmentPotential(aiAnalysis, conversionAnalysis),
            uniqueSellingProposition: this.extractUSP(aiAnalysis),
            viralElements: this.identifyViralElements(aiAnalysis, conversionAnalysis)
        };
    }

    // Métodos auxiliares
    analyzeEmotions(text) {
        const emotionKeywords = {
            joy: ['feliz', 'alegre', 'contente', 'satisfeito', 'eufórico'],
            fear: ['medo', 'receio', 'preocupação', 'ansiedade', 'terror'],
            anger: ['raiva', 'irritação', 'fúria', 'indignação', 'ódio'],
            sadness: ['triste', 'melancolia', 'depressão', 'pesar', 'lamento'],
            surprise: ['surpresa', 'espanto', 'admiração', 'choque', 'pasmo'],
            disgust: ['nojo', 'repugnância', 'aversão', 'desprezo', 'repulsa']
        };
        
        const emotions = [];
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const matches = keywords.filter(keyword => text.includes(keyword));
            if (matches.length > 0) {
                emotions.push({
                    emotion,
                    intensity: matches.length,
                    keywords: matches
                });
            }
        }
        
        return emotions;
    }

    analyzeEmotionalIntensity(text) {
        // Palavras que indicam alta intensidade emocional
        const intensityWords = [
            'extremamente', 'incrivelmente', 'absolutamente', 'completamente',
            'totalmente', 'profundamente', 'intensamente', 'drasticamente'
        ];
        
        const intensityCount = intensityWords.filter(word => text.includes(word)).length;
        const exclamationCount = (text.match(/!/g) || []).length;
        const capsCount = (text.match(/[A-Z]{2,}/g) || []).length;
        
        const intensity = Math.min(
            ((intensityCount * 2) + exclamationCount + capsCount) / text.split(/\s+/).length * 100,
            10
        );
        
        return {
            intensity: Math.round(intensity),
            factors: {
                intensityWords: intensityCount,
                exclamations: exclamationCount,
                capsWords: capsCount
            }
        };
    }

    analyzeEmotionalJourney(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const journey = [];
        
        sentences.forEach((sentence, index) => {
            const sentimentScore = this.sentiment.analyze(sentence).score;
            const emotions = this.analyzeEmotions(sentence);
            
            journey.push({
                position: index + 1,
                sentence: sentence.trim(),
                sentiment: sentimentScore,
                emotions: emotions.map(e => e.emotion),
                emotionalShift: index > 0 ? sentimentScore - journey[index - 1].sentiment : 0
            });
        });
        
        return {
            journey,
            emotionalArc: this.calculateEmotionalArc(journey),
            peaks: this.identifyEmotionalPeaks(journey),
            valleys: this.identifyEmotionalValleys(journey)
        };
    }

    calculateTriggerStrength(matches, triggerData) {
        const baseStrength = matches.length * 10;
        const urgencyMultiplier = triggerData.urgencyLevel === 'critical' ? 1.5 : 
                                 triggerData.urgencyLevel === 'high' ? 1.3 : 
                                 triggerData.urgencyLevel === 'medium' ? 1.1 : 1.0;
        
        return Math.min(baseStrength * urgencyMultiplier, 100);
    }

    calculateTriggerDensity(triggers, text) {
        const totalTriggerWords = triggers.reduce((sum, trigger) => sum + trigger.matches.length, 0);
        const totalWords = text.split(/\s+/).length;
        return (totalTriggerWords / totalWords) * 100;
    }

    identifyStructurePattern(sentences, structureName) {
        // Implementação simplificada - em produção seria mais sofisticada
        const patterns = {
            aida: ['atenção', 'interesse', 'desejo', 'ação'],
            pas: ['problema', 'agitação', 'solução'],
            pastor: ['problema', 'amplificação', 'história', 'transformação', 'oferta', 'resposta']
        };
        
        const pattern = patterns[structureName] || [];
        let matches = 0;
        const elements = [];
        
        sentences.forEach((sentence, index) => {
            pattern.forEach(element => {
                if (sentence.toLowerCase().includes(element)) {
                    matches++;
                    elements.push({ element, position: index, sentence });
                }
            });
        });
        
        return {
            confidence: matches / pattern.length,
            elements
        };
    }

    analyzeHook(firstSentence) {
        if (!firstSentence) return { strength: 0, type: 'none' };
        
        const hookTypes = {
            question: /\?$/,
            statistic: /\d+%|\d+\s*(milhões?|bilhões?|mil)/i,
            controversy: /(nunca|ninguém|segredo|verdade)/i,
            urgency: /(agora|hoje|rápido|imediato)/i,
            benefit: /(como|aprenda|descubra|ganhe)/i
        };
        
        let hookType = 'statement';
        let strength = 30; // Base strength
        
        for (const [type, pattern] of Object.entries(hookTypes)) {
            if (pattern.test(firstSentence)) {
                hookType = type;
                strength += 20;
                break;
            }
        }
        
        // Ajustar força baseado no comprimento
        if (firstSentence.length > 100) strength -= 10;
        if (firstSentence.length < 50) strength += 10;
        
        return {
            strength: Math.min(strength, 100),
            type: hookType,
            text: firstSentence,
            length: firstSentence.length
        };
    }

    analyzeCTA(lastSentence) {
        if (!lastSentence) return { strength: 0, type: 'none' };
        
        const ctaKeywords = [
            'clique', 'compre', 'adquira', 'baixe', 'cadastre', 'inscreva',
            'participe', 'acesse', 'visite', 'experimente', 'teste'
        ];
        
        const hasActionWord = ctaKeywords.some(keyword => 
            lastSentence.toLowerCase().includes(keyword)
        );
        
        const hasUrgency = /agora|hoje|já|imediato/i.test(lastSentence);
        const hasLink = /http|www|\.com/i.test(lastSentence);
        
        let strength = hasActionWord ? 50 : 20;
        if (hasUrgency) strength += 20;
        if (hasLink) strength += 15;
        
        return {
            strength: Math.min(strength, 100),
            hasActionWord,
            hasUrgency,
            hasLink,
            text: lastSentence
        };
    }

    calculateOverallScore(aiAnalysis, triggerAnalysis, conversionAnalysis) {
        const weights = {
            ai: 0.4,
            triggers: 0.3,
            conversion: 0.3
        };
        
        const scores = {
            ai: aiAnalysis.persuasionScore || 50,
            triggers: Math.min(triggerAnalysis.totalConversionBoost / 5, 100),
            conversion: conversionAnalysis.conversionScore || 50
        };
        
        return Math.round(
            scores.ai * weights.ai +
            scores.triggers * weights.triggers +
            scores.conversion * weights.conversion
        );
    }

    calculateViralScore(aiAnalysis, triggerAnalysis) {
        const viralFactors = {
            curiosity: triggerAnalysis.triggersFound.find(t => t.type === 'curiosity')?.strength || 0,
            emotional: aiAnalysis.emotionalMap?.intensity || 0,
            shareability: this.calculateShareability(aiAnalysis),
            controversy: this.calculateControversy(aiAnalysis)
        };
        
        return Math.round(
            (viralFactors.curiosity * 0.3 +
             viralFactors.emotional * 0.3 +
             viralFactors.shareability * 0.25 +
             viralFactors.controversy * 0.15)
        );
    }

    generateOptimizationRecommendations(aiAnalysis, conversionAnalysis, triggerAnalysis) {
        const recommendations = [];
        
        // Recomendações baseadas em score de conversão
        if (conversionAnalysis.conversionScore < 70) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Conversion Optimization',
                title: 'Aumentar Potencial de Conversão',
                description: 'Implementar gatilhos psicológicos mais fortes',
                impact: 'Alto',
                effort: 'Médio',
                estimatedImprovement: '+30-50% conversão'
            });
        }
        
        // Recomendações baseadas em gatilhos
        if (triggerAnalysis.totalTriggers < 3) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Psychological Triggers',
                title: 'Adicionar Mais Gatilhos Psicológicos',
                description: 'Incluir elementos de escassez, urgência e prova social',
                impact: 'Médio',
                effort: 'Baixo',
                estimatedImprovement: '+20-35% engajamento'
            });
        }
        
        return recommendations;
    }

    // Métodos de fallback e utilitários
    generateFallbackAnalysis(text) {
        return {
            persuasionScore: 50,
            triggersIdentified: ['Análise limitada - API indisponível'],
            emotionalMap: { intensity: 5 },
            frictionPoints: ['API indisponível'],
            optimizationSuggestions: ['Tentar análise novamente quando API estiver disponível'],
            idealAudience: { general: 'Audiência geral' },
            performancePrediction: { ctr: 'Médio', conversion: 'Médio' },
            billionaireInsights: ['Análise completa requer API funcional'],
            fallback: true
        };
    }

    enrichAIAnalysis(analysis, text) {
        return {
            ...analysis,
            metadata: {
                textLength: text.length,
                wordCount: text.split(/\s+/).length,
                analysisTimestamp: new Date().toISOString()
            },
            enriched: true
        };
    }

    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    async saveToEvolutionaryMemory(result) {
        try {
            await this.evolutionaryMemory.storeAnalysis('copy_analysis', {
                timestamp: result.timestamp,
                scores: result.scores,
                triggers: result.analysis.triggers,
                insights: result.analysis.insights,
                success: result.success
            });
        } catch (error) {
            this.logger.warn('Erro ao salvar na memória evolutiva:', error.message);
        }
    }
}

module.exports = ContentCopyAnalyzerRevolutionary;

