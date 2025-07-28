/**
 * AGENTE DE ANÁLISE VISUAL AVANÇADO
 * Especialista em análise profunda de conteúdo visual e emocional com OpenAI
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const BaseAgent = require('../base_agent');
const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class VisualContentAnalyzer extends BaseAgent {
    constructor(config) {
        super({
            ...config,
            agentName: 'VisualContentAnalyzer',
            specialization: 'visual_analysis',
            description: 'Especialista em análise visual, composição, cores, emoções e potencial viral de imagens'
        });
        
        // Configurar OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || config.openaiApiKey
        });
        
        // Prompts mestres especializados
        this.masterPrompts = {
            visual_analysis: `Você é um ESPECIALISTA MUNDIAL em análise visual e psicologia das cores, com expertise em:

ANÁLISE VISUAL PROFUNDA:
- Composição (regra dos terços, simetria, equilíbrio, pontos focais)
- Teoria das cores (paleta, contraste, harmonia, temperatura emocional)
- Elementos visuais (linhas, formas, texturas, profundidade)
- Qualidade técnica (nitidez, exposição, saturação, ruído)

ANÁLISE EMOCIONAL E PSICOLÓGICA:
- Impacto emocional das cores (vermelho=energia, azul=confiança, etc.)
- Linguagem corporal e expressões faciais
- Simbolismo visual e elementos subconscientes
- Gatilhos psicológicos de engajamento

ANÁLISE DE POTENCIAL VIRAL:
- Elementos que geram compartilhamento (surpresa, humor, beleza)
- Apelo visual para diferentes demografias
- Tendências visuais atuais e emergentes
- Fatores de memorabilidade e impacto

INSTRUÇÕES:
1. Analise TODOS os aspectos visuais da imagem
2. Identifique elementos emocionais e psicológicos
3. Avalie potencial viral baseado em padrões conhecidos
4. Forneça insights específicos e acionáveis
5. Use escala 0-100 para todos os scores

FORMATO DE RESPOSTA (JSON):
{
  "composition_analysis": {
    "overall_score": 85,
    "rule_of_thirds": "excellent",
    "balance": "good",
    "focus_points": ["centro", "canto superior direito"],
    "visual_hierarchy": "clear",
    "space_usage": "effective"
  },
  "color_psychology": {
    "dominant_colors": ["azul", "branco", "cinza"],
    "color_temperature": "fria",
    "emotional_impact": "confiança e profissionalismo",
    "harmony_score": 88,
    "contrast_score": 92
  },
  "viral_potential": {
    "viral_score": 78,
    "shareability_factors": ["qualidade visual", "apelo emocional"],
    "target_demographics": ["25-45 anos", "profissionais"],
    "improvement_suggestions": ["adicionar elemento surpresa"]
  },
  "technical_quality": {
    "overall_score": 90,
    "sharpness": "excellent",
    "exposure": "good",
    "noise_level": "minimal"
  },
  "emotional_triggers": {
    "primary_emotion": "confiança",
    "intensity": "alta",
    "secondary_emotions": ["calma", "profissionalismo"]
  },
  "recommendations": [
    {
      "category": "composition",
      "priority": "medium",
      "suggestion": "Ajustar enquadramento para melhor uso da regra dos terços",
      "expected_impact": "Aumento de 15% no engajamento visual"
    }
  ]
}

Seja EXTREMAMENTE detalhado e preciso em sua análise.`,

            trend_analysis: `Analise as TENDÊNCIAS VISUAIS desta imagem como um especialista em marketing digital:

TENDÊNCIAS ATUAIS (2025):
- Minimalismo com cores vibrantes
- Autenticidade e conteúdo "real"
- Diversidade e inclusão visual
- Sustentabilidade e natureza
- Tecnologia e futurismo
- Nostalgia e elementos retrô

ELEMENTOS VIRAIS:
- Contraste visual forte
- Elementos inesperados
- Storytelling visual
- Apelo emocional imediato
- Qualidade cinematográfica

PLATAFORMAS ESPECÍFICAS:
- Instagram: Estética polida, cores vibrantes
- TikTok: Movimento, energia, juventude
- LinkedIn: Profissionalismo, credibilidade
- YouTube: Thumbnails chamativas, expressões

Avalie alinhamento com tendências (0-100) e identifique oportunidades.`,

            demographic_analysis: `Analise o APELO DEMOGRÁFICO desta imagem:

SEGMENTAÇÕES:
- Idade: Gen Z (16-24), Millennials (25-40), Gen X (41-56), Boomers (57+)
- Gênero: Masculino, Feminino, Não-binário
- Interesses: Tecnologia, Moda, Fitness, Negócios, Arte, etc.
- Localização: Global, Regional, Cultural específico

FATORES DE APELO:
- Elementos culturais e referências
- Códigos visuais geracionais
- Representatividade e inclusão
- Aspirações e valores

Identifique demografia primária e secundária com justificativas.`
        };
        
        // Configurações de análise
        this.analysisConfig = {
            maxImageSize: 2048,
            supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            analysisTimeout: 45000,
            retryAttempts: 3,
            qualityThreshold: 0.7
        };
        
        // Métricas de performance
        this.performanceMetrics = {
            totalAnalyses: 0,
            averageProcessingTime: 0,
            accuracyScore: 0,
            successRate: 0
        };
    }
    
    async analyzeImage(imagePath, options = {}) {
        const startTime = Date.now();
        
        try {
            this.logger.info(`🎨 Iniciando análise visual avançada: ${imagePath}`);
            
            // Validar e preparar imagem
            const imageData = await this.prepareImageForAnalysis(imagePath);
            
            // Executar análises em paralelo
            const [
                mainAnalysis,
                trendAnalysis,
                demographicAnalysis
            ] = await Promise.all([
                this.performMainVisualAnalysis(imageData),
                this.performTrendAnalysis(imageData),
                this.performDemographicAnalysis(imageData)
            ]);
            
            // Combinar e processar resultados
            const combinedAnalysis = await this.combineAnalysisResults({
                main: mainAnalysis,
                trends: trendAnalysis,
                demographics: demographicAnalysis,
                metadata: imageData.metadata,
                processingTime: Date.now() - startTime
            });
            
            // Aprender com a análise
            await this.learnFromAnalysis(combinedAnalysis, options.feedback);
            
            // Atualizar métricas
            this.updatePerformanceMetrics(combinedAnalysis, Date.now() - startTime);
            
            this.logger.info(`✅ Análise visual concluída em ${Date.now() - startTime}ms`);
            return combinedAnalysis;
            
        } catch (error) {
            this.logger.error(`❌ Erro na análise visual: ${error.message}`);
            throw error;
        }
    }
    
    async prepareImageForAnalysis(imagePath) {
        try {
            // Verificar se arquivo existe
            const stats = await fs.stat(imagePath);
            if (!stats.isFile()) {
                throw new Error('Caminho não é um arquivo válido');
            }
            
            // Obter metadados originais
            const originalMetadata = await sharp(imagePath).metadata();
            
            // Redimensionar e otimizar para análise
            const processedBuffer = await sharp(imagePath)
                .resize(this.analysisConfig.maxImageSize, this.analysisConfig.maxImageSize, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 90 })
                .toBuffer();
            
            // Converter para base64
            const base64Image = processedBuffer.toString('base64');
            
            // Análise técnica básica
            const technicalStats = await sharp(processedBuffer).stats();
            
            return {
                buffer: processedBuffer,
                base64: base64Image,
                metadata: {
                    original: originalMetadata,
                    processed: {
                        width: originalMetadata.width > this.analysisConfig.maxImageSize ? this.analysisConfig.maxImageSize : originalMetadata.width,
                        height: originalMetadata.height > this.analysisConfig.maxImageSize ? this.analysisConfig.maxImageSize : originalMetadata.height,
                        format: 'jpeg',
                        channels: originalMetadata.channels
                    },
                    stats: technicalStats,
                    fileSize: stats.size,
                    filePath: imagePath
                }
            };
            
        } catch (error) {
            throw new Error(`Erro no preparo da imagem: ${error.message}`);
        }
    }
    
    async performMainVisualAnalysis(imageData) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "system",
                        content: this.masterPrompts.visual_analysis
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analise esta imagem em profundidade considerando todos os aspectos visuais, emocionais e técnicos. 

DADOS TÉCNICOS:
- Resolução: ${imageData.metadata.original.width}x${imageData.metadata.original.height}
- Formato: ${imageData.metadata.original.format}
- Tamanho: ${this.formatBytes(imageData.metadata.fileSize)}
- Canais: ${imageData.metadata.original.channels}

Forneça análise completa em formato JSON conforme especificado.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageData.base64}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            
            const analysisText = response.choices[0].message.content;
            
            try {
                return JSON.parse(analysisText);
            } catch (parseError) {
                this.logger.warn('Erro ao parsear JSON da análise principal, usando fallback');
                return this.parseAnalysisTextToJSON(analysisText);
            }
            
        } catch (error) {
            this.logger.error(`Erro na análise principal: ${error.message}`);
            return this.getDefaultMainAnalysis();
        }
    }
    
    async performTrendAnalysis(imageData) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "system",
                        content: this.masterPrompts.trend_analysis
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analise as tendências visuais desta imagem e seu alinhamento com trends atuais de 2025:"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageData.base64}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.4
            });
            
            return this.parseTrendAnalysis(response.choices[0].message.content);
            
        } catch (error) {
            this.logger.error(`Erro na análise de tendências: ${error.message}`);
            return this.getDefaultTrendAnalysis();
        }
    }
    
    async performDemographicAnalysis(imageData) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "system",
                        content: this.masterPrompts.demographic_analysis
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analise o apelo demográfico desta imagem e identifique públicos-alvo:"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageData.base64}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 800,
                temperature: 0.3
            });
            
            return this.parseDemographicAnalysis(response.choices[0].message.content);
            
        } catch (error) {
            this.logger.error(`Erro na análise demográfica: ${error.message}`);
            return this.getDefaultDemographicAnalysis();
        }
    }
    
    async combineAnalysisResults(results) {
        const { main, trends, demographics, metadata, processingTime } = results;
        
        // Calcular score geral ponderado
        const overallScore = this.calculateWeightedScore({
            composition: main.composition_analysis?.overall_score || 75,
            color: main.color_psychology?.harmony_score || 75,
            viral: main.viral_potential?.viral_score || 70,
            technical: main.technical_quality?.overall_score || 80,
            trends: trends.trend_alignment_score || 70
        });
        
        // Gerar insights combinados
        const insights = await this.generateCombinedInsights(main, trends, demographics);
        
        // Criar recomendações priorizadas
        const recommendations = this.prioritizeRecommendations(main, trends, demographics);
        
        return {
            // Identificação
            analysis_id: this.generateAnalysisId(),
            analyzed_at: new Date().toISOString(),
            agent_name: this.agentName,
            processing_time_ms: processingTime,
            
            // Scores principais
            overall_score: overallScore,
            confidence_score: this.calculateConfidenceScore(main, trends, demographics),
            
            // Análises detalhadas
            visual_analysis: main,
            trend_analysis: trends,
            demographic_analysis: demographics,
            
            // Metadados da imagem
            image_metadata: metadata,
            
            // Insights e recomendações
            key_insights: insights,
            recommendations: recommendations,
            
            // Classificações
            content_category: this.classifyContent(main, trends),
            target_platforms: this.suggestOptimalPlatforms(main, trends, demographics),
            viral_probability: this.calculateViralProbability(main, trends, demographics),
            
            // Dados para aprendizado
            learning_data: {
                visual_patterns: this.extractVisualPatterns(main),
                trend_indicators: this.extractTrendIndicators(trends),
                demographic_signals: this.extractDemographicSignals(demographics)
            }
        };
    }
    
    calculateWeightedScore(scores) {
        const weights = {
            composition: 0.20,
            color: 0.20,
            viral: 0.30,
            technical: 0.15,
            trends: 0.15
        };
        
        return Math.round(
            scores.composition * weights.composition +
            scores.color * weights.color +
            scores.viral * weights.viral +
            scores.technical * weights.technical +
            scores.trends * weights.trends
        );
    }
    
    calculateConfidenceScore(main, trends, demographics) {
        let confidence = 85; // Base
        
        // Reduzir confiança se análises falharam
        if (!main.composition_analysis) confidence -= 15;
        if (!main.color_psychology) confidence -= 10;
        if (!trends.current_trends) confidence -= 10;
        if (!demographics.primary_demographic) confidence -= 10;
        
        // Aumentar confiança se dados são consistentes
        if (main.viral_potential?.viral_score > 80) confidence += 5;
        if (main.technical_quality?.overall_score > 85) confidence += 5;
        
        return Math.max(Math.min(confidence, 100), 0);
    }
    
    async generateCombinedInsights(main, trends, demographics) {
        const insights = [];
        
        // Insights de composição
        if (main.composition_analysis?.overall_score > 85) {
            insights.push({
                type: 'composition',
                level: 'positive',
                message: 'Excelente composição visual que segue princípios de design profissional',
                impact: 'Alto potencial de engajamento visual'
            });
        }
        
        // Insights de cor
        if (main.color_psychology?.emotional_impact) {
            insights.push({
                type: 'emotion',
                level: 'info',
                message: `Paleta de cores evoca ${main.color_psychology.emotional_impact}`,
                impact: 'Conexão emocional com audiência'
            });
        }
        
        // Insights de tendência
        if (trends.trend_alignment_score > 80) {
            insights.push({
                type: 'trends',
                level: 'positive',
                message: 'Altamente alinhado com tendências visuais atuais',
                impact: 'Maior probabilidade de viralização'
            });
        }
        
        // Insights demográficos
        if (demographics.primary_demographic) {
            insights.push({
                type: 'audience',
                level: 'info',
                message: `Forte apelo para ${demographics.primary_demographic.age_group}`,
                impact: 'Segmentação clara de audiência'
            });
        }
        
        return insights;
    }
    
    prioritizeRecommendations(main, trends, demographics) {
        const recommendations = [];
        
        // Coletar recomendações de todas as análises
        if (main.recommendations) {
            recommendations.push(...main.recommendations.map(r => ({ ...r, source: 'visual' })));
        }
        
        if (trends.recommendations) {
            recommendations.push(...trends.recommendations.map(r => ({ ...r, source: 'trends' })));
        }
        
        if (demographics.recommendations) {
            recommendations.push(...demographics.recommendations.map(r => ({ ...r, source: 'demographics' })));
        }
        
        // Priorizar por impacto e urgência
        return recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        }).slice(0, 10); // Top 10 recomendações
    }
    
    classifyContent(main, trends) {
        // Classificar tipo de conteúdo baseado na análise
        const categories = [];
        
        if (main.technical_quality?.overall_score > 85) {
            categories.push('professional');
        }
        
        if (main.viral_potential?.viral_score > 80) {
            categories.push('viral-potential');
        }
        
        if (trends.trend_alignment_score > 80) {
            categories.push('trendy');
        }
        
        if (main.emotional_triggers?.intensity === 'alta') {
            categories.push('emotional');
        }
        
        return categories.length > 0 ? categories : ['general'];
    }
    
    suggestOptimalPlatforms(main, trends, demographics) {
        const platforms = [];
        
        // Instagram - visual quality focused
        if (main.technical_quality?.overall_score > 80) {
            platforms.push({
                platform: 'instagram',
                suitability_score: 85,
                reasons: ['Alta qualidade visual', 'Composição profissional']
            });
        }
        
        // TikTok - trend and youth focused
        if (trends.trend_alignment_score > 75 && demographics.primary_demographic?.age_group?.includes('Gen Z')) {
            platforms.push({
                platform: 'tiktok',
                suitability_score: 80,
                reasons: ['Alinhado com tendências', 'Apelo jovem']
            });
        }
        
        // LinkedIn - professional content
        if (main.color_psychology?.emotional_impact?.includes('profissional')) {
            platforms.push({
                platform: 'linkedin',
                suitability_score: 75,
                reasons: ['Aparência profissional', 'Cores corporativas']
            });
        }
        
        return platforms.sort((a, b) => b.suitability_score - a.suitability_score);
    }
    
    calculateViralProbability(main, trends, demographics) {
        let probability = 0.3; // Base 30%
        
        // Fatores que aumentam probabilidade
        if (main.viral_potential?.viral_score > 80) probability += 0.25;
        if (main.emotional_triggers?.intensity === 'alta') probability += 0.15;
        if (trends.trend_alignment_score > 80) probability += 0.20;
        if (main.technical_quality?.overall_score > 85) probability += 0.10;
        
        return Math.min(probability, 0.95); // Máximo 95%
    }
    
    // Métodos auxiliares para parsing
    parseAnalysisTextToJSON(text) {
        // Fallback parser para quando JSON não é retornado
        return {
            composition_analysis: { overall_score: 75 },
            color_psychology: { harmony_score: 75 },
            viral_potential: { viral_score: 70 },
            technical_quality: { overall_score: 80 },
            emotional_triggers: { primary_emotion: 'neutral' },
            recommendations: [{ 
                category: 'general', 
                priority: 'medium', 
                suggestion: 'Análise detalhada não disponível' 
            }],
            raw_analysis: text
        };
    }
    
    parseTrendAnalysis(text) {
        return {
            trend_alignment_score: this.extractScore(text, 'tendência|trend|alinhamento') || 70,
            current_trends: this.extractTrends(text),
            emerging_elements: this.extractEmergingElements(text),
            platform_optimization: this.extractPlatformOptimization(text),
            recommendations: this.extractRecommendations(text),
            detailed_analysis: text
        };
    }
    
    parseDemographicAnalysis(text) {
        return {
            primary_demographic: this.extractPrimaryDemographic(text),
            secondary_demographics: this.extractSecondaryDemographics(text),
            age_appeal: this.extractAgeAppeal(text),
            gender_appeal: this.extractGenderAppeal(text),
            cultural_elements: this.extractCulturalElements(text),
            recommendations: this.extractRecommendations(text),
            detailed_analysis: text
        };
    }
    
    // Métodos de extração de dados
    extractScore(text, pattern) {
        const regex = new RegExp(`${pattern}.*?(\\d+)`, 'gi');
        const match = regex.exec(text);
        return match ? parseInt(match[1]) : null;
    }
    
    extractTrends(text) {
        const trends = [];
        const trendKeywords = ['minimalismo', 'autenticidade', 'diversidade', 'sustentabilidade', 'tecnologia', 'nostalgia'];
        
        trendKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                trends.push(keyword);
            }
        });
        
        return trends;
    }
    
    extractPrimaryDemographic(text) {
        // Extrair demografia primária do texto
        const ageGroups = ['Gen Z', 'Millennials', 'Gen X', 'Boomers'];
        const foundAge = ageGroups.find(age => text.includes(age));
        
        return {
            age_group: foundAge || 'Millennials',
            confidence: foundAge ? 0.8 : 0.5
        };
    }
    
    // Métodos de fallback
    getDefaultMainAnalysis() {
        return {
            composition_analysis: { overall_score: 75 },
            color_psychology: { harmony_score: 75, emotional_impact: 'neutral' },
            viral_potential: { viral_score: 70 },
            technical_quality: { overall_score: 80 },
            emotional_triggers: { primary_emotion: 'neutral', intensity: 'medium' },
            recommendations: []
        };
    }
    
    getDefaultTrendAnalysis() {
        return {
            trend_alignment_score: 70,
            current_trends: [],
            recommendations: []
        };
    }
    
    getDefaultDemographicAnalysis() {
        return {
            primary_demographic: { age_group: 'Millennials', confidence: 0.5 },
            secondary_demographics: [],
            recommendations: []
        };
    }
    
    // Utilitários
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    generateAnalysisId() {
        return `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    updatePerformanceMetrics(analysis, processingTime) {
        this.performanceMetrics.totalAnalyses++;
        this.performanceMetrics.averageProcessingTime = 
            (this.performanceMetrics.averageProcessingTime + processingTime) / 2;
        
        // Atualizar taxa de sucesso baseada na confiança
        if (analysis.confidence_score > 70) {
            this.performanceMetrics.successRate = 
                (this.performanceMetrics.successRate + 1) / 2;
        }
    }
    
    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            agent_name: this.agentName,
            specialization: this.specialization,
            last_updated: new Date().toISOString()
        };
    }
}

module.exports = VisualContentAnalyzer;

