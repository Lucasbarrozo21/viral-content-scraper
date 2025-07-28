const natural = require('natural');
const sentiment = require('sentiment');
const compromise = require('compromise');
const winston = require('winston');
const path = require('path');

/**
 * Analisador Avançado de Sentimento
 * Analisa emoções, sentimentos, tom e aspectos psicológicos do texto
 * para identificar padrões que geram engajamento e viralização
 */
class SentimentAnalyzer {
    constructor(config = {}) {
        this.config = {
            language: 'pt', // Português como padrão
            enableEmotionDetection: true,
            enableToneAnalysis: true,
            enablePsychologicalAnalysis: true,
            enablePersuasionAnalysis: true,
            cacheResults: true,
            ...config
        };

        // Configurar logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `${timestamp} [${level.toUpperCase()}] [SENTIMENT_ANALYZER] ${message}${stack ? '\n' + stack : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../../logs/sentiment_analysis.log'),
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 3
                })
            ]
        });

        // Inicializar analisador de sentimento
        this.sentimentAnalyzer = new sentiment();

        // Cache de análises
        this.analysisCache = new Map();

        // Estatísticas
        this.stats = {
            totalAnalyses: 0,
            successfulAnalyses: 0,
            failedAnalyses: 0,
            cacheHits: 0,
            avgProcessingTime: 0
        };

        // Dicionários de emoções em português
        this.emotionDictionary = {
            joy: ['alegria', 'felicidade', 'euforia', 'contentamento', 'prazer', 'diversão', 'satisfação'],
            anger: ['raiva', 'ódio', 'irritação', 'fúria', 'indignação', 'revolta', 'ira'],
            fear: ['medo', 'terror', 'pânico', 'ansiedade', 'preocupação', 'nervosismo', 'apreensão'],
            sadness: ['tristeza', 'melancolia', 'depressão', 'desânimo', 'pesar', 'lamento', 'dor'],
            surprise: ['surpresa', 'espanto', 'admiração', 'choque', 'perplexidade', 'assombro'],
            disgust: ['nojo', 'repugnância', 'aversão', 'repulsa', 'desgosto', 'asco'],
            trust: ['confiança', 'segurança', 'fé', 'credibilidade', 'esperança', 'otimismo'],
            anticipation: ['expectativa', 'ansiedade', 'antecipação', 'aguardo', 'esperança']
        };

        // Gatilhos psicológicos
        this.psychologicalTriggers = {
            scarcity: ['limitado', 'escasso', 'últimas', 'apenas', 'somente', 'restam', 'acabando'],
            urgency: ['agora', 'hoje', 'rápido', 'urgente', 'imediato', 'já', 'depressa'],
            social_proof: ['todos', 'milhões', 'popular', 'viral', 'tendência', 'famoso', 'aprovado'],
            authority: ['especialista', 'doutor', 'professor', 'cientista', 'estudo', 'pesquisa', 'comprovado'],
            reciprocity: ['grátis', 'presente', 'oferta', 'desconto', 'promoção', 'bônus', 'cortesia'],
            commitment: ['prometo', 'garanto', 'comprometo', 'asseguro', 'certifico', 'juro'],
            liking: ['você', 'seu', 'sua', 'pessoal', 'especial', 'único', 'exclusivo'],
            loss_aversion: ['perder', 'perdendo', 'último', 'final', 'termina', 'acaba', 'desaparece']
        };

        // Técnicas de persuasão
        this.persuasionTechniques = {
            emotional_appeal: ['sinta', 'emocione', 'coração', 'alma', 'paixão', 'amor', 'sonho'],
            logical_appeal: ['porque', 'razão', 'lógico', 'prova', 'evidência', 'fato', 'dados'],
            ethical_appeal: ['certo', 'moral', 'ético', 'justo', 'honesto', 'íntegro', 'valores'],
            bandwagon: ['todos fazem', 'todo mundo', 'maioria', 'tendência', 'moda', 'popular'],
            fear_appeal: ['cuidado', 'perigo', 'risco', 'ameaça', 'problema', 'consequência'],
            reward_appeal: ['ganhe', 'conquiste', 'alcance', 'obtenha', 'receba', 'mereça']
        };

        // Padrões de linguagem viral
        this.viralPatterns = {
            questions: /\?/g,
            exclamations: /!/g,
            caps_words: /\b[A-Z]{2,}\b/g,
            emojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
            hashtags: /#\w+/g,
            mentions: /@\w+/g,
            numbers: /\d+/g,
            superlatives: /\b(melhor|pior|maior|menor|mais|menos|super|mega|ultra|hiper)\w*/gi
        };
    }

    /**
     * Analisa sentimento completo do texto
     */
    async analyzeSentiment(text, options = {}) {
        const startTime = Date.now();
        this.stats.totalAnalyses++;

        try {
            this.logger.info('Iniciando análise de sentimento...');

            // Verificar cache
            if (this.config.cacheResults) {
                const cacheKey = this.generateCacheKey(text, options);
                const cachedResult = this.analysisCache.get(cacheKey);
                
                if (cachedResult) {
                    this.stats.cacheHits++;
                    this.logger.info('Resultado encontrado no cache');
                    return cachedResult;
                }
            }

            // Preprocessar texto
            const preprocessedText = this.preprocessText(text);

            // Executar análises paralelas
            const [
                basicSentiment,
                emotionAnalysis,
                toneAnalysis,
                psychologicalAnalysis,
                persuasionAnalysis,
                viralPatternAnalysis,
                linguisticAnalysis
            ] = await Promise.all([
                this.analyzeBasicSentiment(preprocessedText),
                this.config.enableEmotionDetection ? this.analyzeEmotions(preprocessedText) : null,
                this.config.enableToneAnalysis ? this.analyzeTone(preprocessedText) : null,
                this.config.enablePsychologicalAnalysis ? this.analyzePsychologicalTriggers(preprocessedText) : null,
                this.config.enablePersuasionAnalysis ? this.analyzePersuasionTechniques(preprocessedText) : null,
                this.analyzeViralPatterns(preprocessedText),
                this.analyzeLinguisticFeatures(preprocessedText)
            ]);

            // Compilar resultado final
            const result = {
                success: true,
                text: {
                    original: text,
                    preprocessed: preprocessedText,
                    wordCount: preprocessedText.split(/\s+/).length,
                    characterCount: text.length
                },
                sentiment: basicSentiment,
                emotions: emotionAnalysis,
                tone: toneAnalysis,
                psychological: psychologicalAnalysis,
                persuasion: persuasionAnalysis,
                viralPatterns: viralPatternAnalysis,
                linguistic: linguisticAnalysis,
                overallScore: this.calculateOverallScore({
                    sentiment: basicSentiment,
                    emotions: emotionAnalysis,
                    psychological: psychologicalAnalysis,
                    persuasion: persuasionAnalysis,
                    viral: viralPatternAnalysis
                }),
                recommendations: this.generateRecommendations({
                    sentiment: basicSentiment,
                    emotions: emotionAnalysis,
                    tone: toneAnalysis,
                    psychological: psychologicalAnalysis,
                    persuasion: persuasionAnalysis
                }),
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };

            // Salvar no cache
            if (this.config.cacheResults) {
                const cacheKey = this.generateCacheKey(text, options);
                this.analysisCache.set(cacheKey, result);
            }

            this.stats.successfulAnalyses++;
            this.updateProcessingTimeStats(Date.now() - startTime);

            this.logger.info(`Análise de sentimento concluída em ${Date.now() - startTime}ms`);
            return result;

        } catch (error) {
            this.stats.failedAnalyses++;
            this.logger.error('Erro na análise de sentimento:', error);
            
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Preprocessa texto para análise
     */
    preprocessText(text) {
        try {
            // Remover URLs
            let processed = text.replace(/https?:\/\/[^\s]+/g, '');
            
            // Normalizar espaços
            processed = processed.replace(/\s+/g, ' ').trim();
            
            // Preservar emojis e caracteres especiais importantes
            // (não remover para análise de padrões virais)
            
            return processed;

        } catch (error) {
            this.logger.error('Erro no preprocessamento:', error);
            return text;
        }
    }

    /**
     * Análise básica de sentimento
     */
    async analyzeBasicSentiment(text) {
        try {
            const result = this.sentimentAnalyzer.analyze(text);
            
            // Normalizar score para 0-1
            const normalizedScore = (result.score + 5) / 10; // Assumindo range -5 a +5
            
            return {
                score: result.score,
                normalizedScore: Math.max(0, Math.min(1, normalizedScore)),
                comparative: result.comparative,
                calculation: result.calculation,
                tokens: result.tokens,
                words: result.words,
                positive: result.positive,
                negative: result.negative,
                polarity: this.categorizeSentiment(result.score),
                confidence: this.calculateSentimentConfidence(result)
            };

        } catch (error) {
            this.logger.error('Erro na análise básica de sentimento:', error);
            return { score: 0, polarity: 'neutral', confidence: 0.5 };
        }
    }

    /**
     * Analisa emoções específicas
     */
    async analyzeEmotions(text) {
        try {
            const emotions = {};
            let totalEmotionWords = 0;

            // Analisar cada categoria de emoção
            for (const [emotion, words] of Object.entries(this.emotionDictionary)) {
                let emotionCount = 0;
                
                words.forEach(word => {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    const matches = text.match(regex);
                    if (matches) {
                        emotionCount += matches.length;
                        totalEmotionWords += matches.length;
                    }
                });

                emotions[emotion] = {
                    count: emotionCount,
                    intensity: emotionCount / text.split(/\s+/).length,
                    words: words.filter(word => text.toLowerCase().includes(word))
                };
            }

            // Identificar emoção dominante
            const dominantEmotion = Object.entries(emotions)
                .sort(([,a], [,b]) => b.count - a.count)[0];

            // Calcular diversidade emocional
            const emotionalDiversity = Object.values(emotions)
                .filter(emotion => emotion.count > 0).length;

            return {
                emotions: emotions,
                dominantEmotion: dominantEmotion ? {
                    emotion: dominantEmotion[0],
                    ...dominantEmotion[1]
                } : null,
                totalEmotionWords: totalEmotionWords,
                emotionalDiversity: emotionalDiversity,
                emotionalIntensity: totalEmotionWords / text.split(/\s+/).length,
                emotionalBalance: this.calculateEmotionalBalance(emotions)
            };

        } catch (error) {
            this.logger.error('Erro na análise de emoções:', error);
            return { emotions: {}, dominantEmotion: null };
        }
    }

    /**
     * Analisa tom do texto
     */
    async analyzeTone(text) {
        try {
            const doc = compromise(text);
            
            // Analisar características do tom
            const questions = (text.match(/\?/g) || []).length;
            const exclamations = (text.match(/!/g) || []).length;
            const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
            
            // Analisar verbos para determinar energia
            const verbs = doc.verbs().out('array');
            const actionVerbs = verbs.filter(verb => 
                ['fazer', 'criar', 'construir', 'conquistar', 'alcançar', 'ganhar'].includes(verb.toLowerCase())
            ).length;

            // Analisar adjetivos para determinar intensidade
            const adjectives = doc.adjectives().out('array');
            const intensifiers = adjectives.filter(adj =>
                ['muito', 'super', 'mega', 'ultra', 'extremamente', 'incrivelmente'].includes(adj.toLowerCase())
            ).length;

            // Determinar tom geral
            const toneScore = this.calculateToneScore({
                questions,
                exclamations,
                capsWords,
                actionVerbs,
                intensifiers,
                wordCount: text.split(/\s+/).length
            });

            return {
                questions: questions,
                exclamations: exclamations,
                capsWords: capsWords,
                actionVerbs: actionVerbs,
                intensifiers: intensifiers,
                toneScore: toneScore,
                toneCategory: this.categorizeTone(toneScore),
                energy: this.calculateEnergyLevel(exclamations, capsWords, actionVerbs),
                formality: this.analyzeFormalityLevel(text),
                urgency: this.analyzeUrgencyLevel(text)
            };

        } catch (error) {
            this.logger.error('Erro na análise de tom:', error);
            return { toneScore: 0.5, toneCategory: 'neutral' };
        }
    }

    /**
     * Analisa gatilhos psicológicos
     */
    async analyzePsychologicalTriggers(text) {
        try {
            const triggers = {};
            let totalTriggers = 0;

            // Analisar cada categoria de gatilho
            for (const [trigger, words] of Object.entries(this.psychologicalTriggers)) {
                let triggerCount = 0;
                const foundWords = [];

                words.forEach(word => {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    const matches = text.match(regex);
                    if (matches) {
                        triggerCount += matches.length;
                        totalTriggers += matches.length;
                        foundWords.push(...matches);
                    }
                });

                triggers[trigger] = {
                    count: triggerCount,
                    intensity: triggerCount / text.split(/\s+/).length,
                    words: foundWords,
                    effectiveness: this.calculateTriggerEffectiveness(trigger, triggerCount)
                };
            }

            // Identificar gatilho dominante
            const dominantTrigger = Object.entries(triggers)
                .sort(([,a], [,b]) => b.count - a.count)[0];

            return {
                triggers: triggers,
                dominantTrigger: dominantTrigger ? {
                    trigger: dominantTrigger[0],
                    ...dominantTrigger[1]
                } : null,
                totalTriggers: totalTriggers,
                triggerDiversity: Object.values(triggers).filter(t => t.count > 0).length,
                psychologicalImpact: this.calculatePsychologicalImpact(triggers),
                persuasionPotential: this.calculatePersuasionPotential(triggers)
            };

        } catch (error) {
            this.logger.error('Erro na análise de gatilhos psicológicos:', error);
            return { triggers: {}, totalTriggers: 0 };
        }
    }

    /**
     * Analisa técnicas de persuasão
     */
    async analyzePersuasionTechniques(text) {
        try {
            const techniques = {};
            let totalTechniques = 0;

            // Analisar cada técnica de persuasão
            for (const [technique, words] of Object.entries(this.persuasionTechniques)) {
                let techniqueCount = 0;
                const foundWords = [];

                words.forEach(word => {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    const matches = text.match(regex);
                    if (matches) {
                        techniqueCount += matches.length;
                        totalTechniques += matches.length;
                        foundWords.push(...matches);
                    }
                });

                techniques[technique] = {
                    count: techniqueCount,
                    intensity: techniqueCount / text.split(/\s+/).length,
                    words: foundWords,
                    effectiveness: this.calculateTechniqueEffectiveness(technique, techniqueCount)
                };
            }

            // Identificar técnica dominante
            const dominantTechnique = Object.entries(techniques)
                .sort(([,a], [,b]) => b.count - a.count)[0];

            return {
                techniques: techniques,
                dominantTechnique: dominantTechnique ? {
                    technique: dominantTechnique[0],
                    ...dominantTechnique[1]
                } : null,
                totalTechniques: totalTechniques,
                techniqueDiversity: Object.values(techniques).filter(t => t.count > 0).length,
                persuasionScore: this.calculatePersuasionScore(techniques),
                rhetoricalPower: this.calculateRhetoricalPower(techniques)
            };

        } catch (error) {
            this.logger.error('Erro na análise de técnicas de persuasão:', error);
            return { techniques: {}, totalTechniques: 0 };
        }
    }

    /**
     * Analisa padrões virais no texto
     */
    async analyzeViralPatterns(text) {
        try {
            const patterns = {};

            // Analisar cada padrão viral
            for (const [pattern, regex] of Object.entries(this.viralPatterns)) {
                const matches = text.match(regex) || [];
                patterns[pattern] = {
                    count: matches.length,
                    density: matches.length / text.split(/\s+/).length,
                    examples: matches.slice(0, 5), // Primeiros 5 exemplos
                    viralPotential: this.calculatePatternViralPotential(pattern, matches.length)
                };
            }

            // Calcular score viral geral
            const viralScore = this.calculateViralScore(patterns);

            // Analisar características específicas
            const characteristics = {
                hasCallToAction: this.detectCallToAction(text),
                hasPersonalStory: this.detectPersonalStory(text),
                hasControversy: this.detectControversy(text),
                hasHumor: this.detectHumor(text),
                hasUrgency: this.detectUrgency(text),
                hasExclusivity: this.detectExclusivity(text)
            };

            return {
                patterns: patterns,
                viralScore: viralScore,
                viralRating: this.getViralRating(viralScore),
                characteristics: characteristics,
                viralFactors: this.identifyViralFactors(patterns, characteristics),
                shareabilityScore: this.calculateShareabilityScore(patterns, characteristics)
            };

        } catch (error) {
            this.logger.error('Erro na análise de padrões virais:', error);
            return { patterns: {}, viralScore: 0.5 };
        }
    }

    /**
     * Analisa características linguísticas
     */
    async analyzeLinguisticFeatures(text) {
        try {
            const doc = compromise(text);
            
            // Análise básica
            const sentences = doc.sentences().out('array');
            const words = doc.terms().out('array');
            const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];

            // Análise de complexidade
            const avgWordsPerSentence = words.length / sentences.length;
            const avgCharsPerWord = words.reduce((sum, word) => sum + word.length, 0) / words.length;
            const lexicalDiversity = uniqueWords.length / words.length;

            // Análise de partes do discurso
            const nouns = doc.nouns().out('array');
            const verbs = doc.verbs().out('array');
            const adjectives = doc.adjectives().out('array');
            const adverbs = doc.adverbs().out('array');

            // Análise de legibilidade (simplificada)
            const readabilityScore = this.calculateReadabilityScore(
                sentences.length,
                words.length,
                avgWordsPerSentence,
                avgCharsPerWord
            );

            return {
                sentences: sentences.length,
                words: words.length,
                uniqueWords: uniqueWords.length,
                avgWordsPerSentence: avgWordsPerSentence,
                avgCharsPerWord: avgCharsPerWord,
                lexicalDiversity: lexicalDiversity,
                partsOfSpeech: {
                    nouns: nouns.length,
                    verbs: verbs.length,
                    adjectives: adjectives.length,
                    adverbs: adverbs.length
                },
                readabilityScore: readabilityScore,
                readabilityLevel: this.getReadabilityLevel(readabilityScore),
                complexity: this.calculateComplexity(avgWordsPerSentence, avgCharsPerWord, lexicalDiversity)
            };

        } catch (error) {
            this.logger.error('Erro na análise linguística:', error);
            return { words: 0, sentences: 0, readabilityScore: 0.5 };
        }
    }

    /**
     * Calcula score geral da análise
     */
    calculateOverallScore(analyses) {
        try {
            let totalScore = 0;
            let weights = 0;

            // Sentimento (peso: 20%)
            if (analyses.sentiment) {
                const sentimentScore = Math.abs(analyses.sentiment.normalizedScore - 0.5) * 2; // Polaridade
                totalScore += sentimentScore * 0.2;
                weights += 0.2;
            }

            // Emoções (peso: 25%)
            if (analyses.emotions) {
                const emotionScore = analyses.emotions.emotionalIntensity * 2; // Intensidade emocional
                totalScore += Math.min(emotionScore, 1) * 0.25;
                weights += 0.25;
            }

            // Gatilhos psicológicos (peso: 20%)
            if (analyses.psychological) {
                const psychScore = analyses.psychological.psychologicalImpact || 0.5;
                totalScore += psychScore * 0.2;
                weights += 0.2;
            }

            // Persuasão (peso: 20%)
            if (analyses.persuasion) {
                const persuasionScore = analyses.persuasion.persuasionScore || 0.5;
                totalScore += persuasionScore * 0.2;
                weights += 0.2;
            }

            // Padrões virais (peso: 15%)
            if (analyses.viral) {
                const viralScore = analyses.viral.viralScore || 0.5;
                totalScore += viralScore * 0.15;
                weights += 0.15;
            }

            const finalScore = weights > 0 ? totalScore / weights : 0.5;

            return {
                score: Math.min(Math.max(finalScore, 0), 1),
                percentage: Math.round(finalScore * 100),
                rating: this.getOverallRating(finalScore),
                components: {
                    sentiment: analyses.sentiment?.normalizedScore || 0.5,
                    emotional: analyses.emotions?.emotionalIntensity || 0.5,
                    psychological: analyses.psychological?.psychologicalImpact || 0.5,
                    persuasion: analyses.persuasion?.persuasionScore || 0.5,
                    viral: analyses.viral?.viralScore || 0.5
                }
            };

        } catch (error) {
            this.logger.error('Erro ao calcular score geral:', error);
            return { score: 0.5, percentage: 50, rating: 'medium' };
        }
    }

    /**
     * Gera recomendações baseadas na análise
     */
    generateRecommendations(analyses) {
        const recommendations = [];

        try {
            // Recomendações de sentimento
            if (analyses.sentiment && Math.abs(analyses.sentiment.score) < 2) {
                recommendations.push({
                    category: 'sentiment',
                    priority: 'medium',
                    suggestion: 'Adicionar mais palavras com carga emocional para aumentar o impacto',
                    impact: 'Aumenta o engajamento emocional do público'
                });
            }

            // Recomendações de emoções
            if (analyses.emotions && analyses.emotions.emotionalDiversity < 2) {
                recommendations.push({
                    category: 'emotions',
                    priority: 'high',
                    suggestion: 'Diversificar as emoções para criar uma experiência mais rica',
                    impact: 'Conecta com diferentes tipos de público'
                });
            }

            // Recomendações de tom
            if (analyses.tone && analyses.tone.energy < 0.3) {
                recommendations.push({
                    category: 'tone',
                    priority: 'medium',
                    suggestion: 'Aumentar energia com mais exclamações e verbos de ação',
                    impact: 'Torna o conteúdo mais dinâmico e envolvente'
                });
            }

            // Recomendações psicológicas
            if (analyses.psychological && analyses.psychological.totalTriggers < 3) {
                recommendations.push({
                    category: 'psychology',
                    priority: 'high',
                    suggestion: 'Incluir mais gatilhos psicológicos como escassez ou prova social',
                    impact: 'Aumenta significativamente a persuasão e conversão'
                });
            }

            // Recomendações de persuasão
            if (analyses.persuasion && analyses.persuasion.totalTechniques < 2) {
                recommendations.push({
                    category: 'persuasion',
                    priority: 'high',
                    suggestion: 'Aplicar técnicas de persuasão como apelo emocional ou lógico',
                    impact: 'Melhora a capacidade de convencimento do conteúdo'
                });
            }

        } catch (error) {
            this.logger.error('Erro ao gerar recomendações:', error);
        }

        return recommendations;
    }

    // Métodos auxiliares
    categorizeSentiment(score) {
        if (score > 2) return 'very_positive';
        if (score > 0.5) return 'positive';
        if (score > -0.5) return 'neutral';
        if (score > -2) return 'negative';
        return 'very_negative';
    }

    calculateSentimentConfidence(result) {
        // Baseado no número de palavras analisadas e força do score
        const wordCount = result.tokens.length;
        const scoreStrength = Math.abs(result.comparative);
        
        return Math.min((wordCount * scoreStrength) / 10, 1);
    }

    calculateEmotionalBalance(emotions) {
        const emotionCounts = Object.values(emotions).map(e => e.count);
        const total = emotionCounts.reduce((sum, count) => sum + count, 0);
        
        if (total === 0) return 0.5;
        
        // Calcular distribuição das emoções
        const distribution = emotionCounts.map(count => count / total);
        const entropy = -distribution.reduce((sum, p) => p > 0 ? sum + p * Math.log2(p) : sum, 0);
        
        return entropy / Math.log2(Object.keys(emotions).length);
    }

    calculateToneScore(metrics) {
        const { questions, exclamations, capsWords, actionVerbs, intensifiers, wordCount } = metrics;
        
        let score = 0.5; // Base neutral
        
        // Perguntas aumentam engajamento
        score += (questions / wordCount) * 10;
        
        // Exclamações aumentam energia
        score += (exclamations / wordCount) * 15;
        
        // Palavras em maiúscula aumentam intensidade
        score += (capsWords / wordCount) * 20;
        
        // Verbos de ação aumentam dinamismo
        score += (actionVerbs / wordCount) * 10;
        
        // Intensificadores aumentam impacto
        score += (intensifiers / wordCount) * 12;
        
        return Math.min(score, 1);
    }

    categorizeTone(score) {
        if (score > 0.8) return 'very_energetic';
        if (score > 0.6) return 'energetic';
        if (score > 0.4) return 'moderate';
        if (score > 0.2) return 'calm';
        return 'very_calm';
    }

    calculateEnergyLevel(exclamations, capsWords, actionVerbs) {
        const energyScore = (exclamations * 0.4) + (capsWords * 0.3) + (actionVerbs * 0.3);
        return Math.min(energyScore / 10, 1);
    }

    analyzeFormalityLevel(text) {
        // Análise simplificada de formalidade
        const formalWords = ['portanto', 'contudo', 'entretanto', 'ademais', 'outrossim'];
        const informalWords = ['né', 'cara', 'mano', 'galera', 'pessoal'];
        
        let formalCount = 0;
        let informalCount = 0;
        
        formalWords.forEach(word => {
            if (text.toLowerCase().includes(word)) formalCount++;
        });
        
        informalWords.forEach(word => {
            if (text.toLowerCase().includes(word)) informalCount++;
        });
        
        if (formalCount > informalCount) return 'formal';
        if (informalCount > formalCount) return 'informal';
        return 'neutral';
    }

    analyzeUrgencyLevel(text) {
        const urgencyWords = ['agora', 'hoje', 'rápido', 'urgente', 'imediato', 'já', 'depressa'];
        let urgencyCount = 0;
        
        urgencyWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) urgencyCount += matches.length;
        });
        
        const urgencyScore = urgencyCount / text.split(/\s+/).length;
        
        if (urgencyScore > 0.05) return 'high';
        if (urgencyScore > 0.02) return 'medium';
        return 'low';
    }

    calculateTriggerEffectiveness(trigger, count) {
        // Diferentes gatilhos têm diferentes níveis de efetividade
        const effectiveness = {
            scarcity: 0.9,
            urgency: 0.8,
            social_proof: 0.85,
            authority: 0.8,
            reciprocity: 0.75,
            commitment: 0.7,
            liking: 0.65,
            loss_aversion: 0.9
        };
        
        return (effectiveness[trigger] || 0.5) * Math.min(count / 3, 1);
    }

    calculatePsychologicalImpact(triggers) {
        const triggerValues = Object.values(triggers);
        const totalImpact = triggerValues.reduce((sum, trigger) => sum + trigger.effectiveness, 0);
        const activeTriggers = triggerValues.filter(t => t.count > 0).length;
        
        return Math.min(totalImpact / Math.max(activeTriggers, 1), 1);
    }

    calculatePersuasionPotential(triggers) {
        // Combinação de diferentes gatilhos aumenta potencial de persuasão
        const activeTriggers = Object.values(triggers).filter(t => t.count > 0).length;
        const totalEffectiveness = Object.values(triggers).reduce((sum, t) => sum + t.effectiveness, 0);
        
        return Math.min((totalEffectiveness * activeTriggers) / 10, 1);
    }

    calculateTechniqueEffectiveness(technique, count) {
        const effectiveness = {
            emotional_appeal: 0.85,
            logical_appeal: 0.8,
            ethical_appeal: 0.75,
            bandwagon: 0.7,
            fear_appeal: 0.9,
            reward_appeal: 0.8
        };
        
        return (effectiveness[technique] || 0.5) * Math.min(count / 2, 1);
    }

    calculatePersuasionScore(techniques) {
        const techniqueValues = Object.values(techniques);
        const totalScore = techniqueValues.reduce((sum, technique) => sum + technique.effectiveness, 0);
        const activeTechniques = techniqueValues.filter(t => t.count > 0).length;
        
        return Math.min(totalScore / Math.max(activeTechniques, 1), 1);
    }

    calculateRhetoricalPower(techniques) {
        // Poder retórico baseado na diversidade e efetividade das técnicas
        const activeTechniques = Object.values(techniques).filter(t => t.count > 0).length;
        const avgEffectiveness = Object.values(techniques).reduce((sum, t) => sum + t.effectiveness, 0) / Object.keys(techniques).length;
        
        return (activeTechniques / Object.keys(techniques).length) * avgEffectiveness;
    }

    calculatePatternViralPotential(pattern, count) {
        const potentials = {
            questions: 0.8,
            exclamations: 0.7,
            caps_words: 0.6,
            emojis: 0.9,
            hashtags: 0.85,
            mentions: 0.7,
            numbers: 0.6,
            superlatives: 0.75
        };
        
        return (potentials[pattern] || 0.5) * Math.min(count / 5, 1);
    }

    calculateViralScore(patterns) {
        const patternValues = Object.values(patterns);
        const totalPotential = patternValues.reduce((sum, pattern) => sum + pattern.viralPotential, 0);
        const activePatterns = patternValues.filter(p => p.count > 0).length;
        
        return Math.min(totalPotential / Math.max(activePatterns, 1), 1);
    }

    getViralRating(score) {
        if (score > 0.8) return 'very_high';
        if (score > 0.6) return 'high';
        if (score > 0.4) return 'medium';
        if (score > 0.2) return 'low';
        return 'very_low';
    }

    // Detectores de características específicas
    detectCallToAction(text) {
        const ctaPatterns = [
            /clique/gi, /acesse/gi, /visite/gi, /compre/gi, /adquira/gi,
            /inscreva/gi, /cadastre/gi, /baixe/gi, /download/gi, /compartilhe/gi
        ];
        
        return ctaPatterns.some(pattern => pattern.test(text));
    }

    detectPersonalStory(text) {
        const storyPatterns = [
            /eu/gi, /minha/gi, /meu/gi, /comigo/gi, /aconteceu/gi,
            /experiência/gi, /história/gi, /vivência/gi
        ];
        
        return storyPatterns.some(pattern => pattern.test(text));
    }

    detectControversy(text) {
        const controversyWords = [
            'polêmico', 'controverso', 'debate', 'discussão', 'opinião',
            'contra', 'favor', 'discordo', 'concordo'
        ];
        
        return controversyWords.some(word => text.toLowerCase().includes(word));
    }

    detectHumor(text) {
        const humorPatterns = [
            /haha/gi, /kkkk/gi, /rsrs/gi, /😂/g, /😄/g, /😆/g,
            /piada/gi, /engraçado/gi, /hilário/gi, /cômico/gi
        ];
        
        return humorPatterns.some(pattern => pattern.test(text));
    }

    detectUrgency(text) {
        const urgencyWords = ['agora', 'hoje', 'rápido', 'urgente', 'imediato', 'já'];
        return urgencyWords.some(word => text.toLowerCase().includes(word));
    }

    detectExclusivity(text) {
        const exclusivityWords = ['exclusivo', 'especial', 'único', 'limitado', 'VIP', 'premium'];
        return exclusivityWords.some(word => text.toLowerCase().includes(word));
    }

    identifyViralFactors(patterns, characteristics) {
        const factors = [];
        
        // Analisar padrões
        Object.entries(patterns).forEach(([pattern, data]) => {
            if (data.viralPotential > 0.7) {
                factors.push({
                    type: 'pattern',
                    factor: pattern,
                    strength: data.viralPotential,
                    evidence: data.count
                });
            }
        });
        
        // Analisar características
        Object.entries(characteristics).forEach(([characteristic, present]) => {
            if (present) {
                factors.push({
                    type: 'characteristic',
                    factor: characteristic,
                    strength: 0.8,
                    evidence: 'present'
                });
            }
        });
        
        return factors.sort((a, b) => b.strength - a.strength);
    }

    calculateShareabilityScore(patterns, characteristics) {
        let score = 0.3; // Base score
        
        // Boost por padrões virais
        const viralPatternCount = Object.values(patterns).filter(p => p.viralPotential > 0.6).length;
        score += viralPatternCount * 0.1;
        
        // Boost por características
        const activeCharacteristics = Object.values(characteristics).filter(Boolean).length;
        score += activeCharacteristics * 0.15;
        
        return Math.min(score, 1);
    }

    calculateReadabilityScore(sentences, words, avgWordsPerSentence, avgCharsPerWord) {
        // Fórmula simplificada de legibilidade
        const complexityPenalty = (avgWordsPerSentence - 15) * 0.1;
        const wordLengthPenalty = (avgCharsPerWord - 5) * 0.1;
        
        let score = 1 - complexityPenalty - wordLengthPenalty;
        return Math.max(0, Math.min(1, score));
    }

    getReadabilityLevel(score) {
        if (score > 0.8) return 'very_easy';
        if (score > 0.6) return 'easy';
        if (score > 0.4) return 'medium';
        if (score > 0.2) return 'hard';
        return 'very_hard';
    }

    calculateComplexity(avgWordsPerSentence, avgCharsPerWord, lexicalDiversity) {
        const sentenceComplexity = Math.min(avgWordsPerSentence / 20, 1);
        const wordComplexity = Math.min(avgCharsPerWord / 10, 1);
        const vocabularyComplexity = lexicalDiversity;
        
        return (sentenceComplexity + wordComplexity + vocabularyComplexity) / 3;
    }

    getOverallRating(score) {
        if (score > 0.8) return 'excellent';
        if (score > 0.6) return 'good';
        if (score > 0.4) return 'medium';
        if (score > 0.2) return 'poor';
        return 'very_poor';
    }

    // Métodos utilitários
    generateCacheKey(text, options) {
        const textHash = text.substring(0, 50); // Primeiros 50 caracteres
        const optionsStr = JSON.stringify(options);
        return `${textHash}_${optionsStr}`;
    }

    updateProcessingTimeStats(processingTime) {
        this.stats.avgProcessingTime = 
            (this.stats.avgProcessingTime * (this.stats.successfulAnalyses - 1) + processingTime) / 
            this.stats.successfulAnalyses;
    }

    /**
     * Obtém estatísticas do analisador
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.analysisCache.size,
            successRate: this.stats.totalAnalyses > 0 ? 
                this.stats.successfulAnalyses / this.stats.totalAnalyses : 0
        };
    }

    /**
     * Limpa cache de análises
     */
    clearCache() {
        this.analysisCache.clear();
        this.logger.info('Cache de análises limpo');
    }
}

module.exports = SentimentAnalyzer;

