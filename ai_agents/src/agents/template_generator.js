/**
 * AGENTE GERADOR DE TEMPLATES VIRAIS
 * Especialista em extrair padrões e criar templates adaptáveis de conteúdo viral
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const BaseAgent = require('../base_agent');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class TemplateGenerator extends BaseAgent {
    constructor(config) {
        super({
            ...config,
            agentName: 'TemplateGenerator',
            specialization: 'template_generation',
            description: 'Especialista em extrair padrões virais e gerar templates adaptáveis'
        });
        
        // Configurar OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || config.openaiApiKey
        });
        
        // Prompts mestres especializados
        this.masterPrompts = {
            visual_template_extraction: `Você é um ESPECIALISTA em design viral e criação de templates visuais.

MISSÃO: Analisar conteúdo visual viral e extrair padrões reutilizáveis em templates.

TIPOS DE CONTEÚDO VISUAL:
- Carrosséis do Instagram/LinkedIn
- Stories do Instagram/Facebook
- Anúncios em imagem (Facebook Ads, Google Ads)
- Posts estáticos de alta performance
- Thumbnails de YouTube virais

ELEMENTOS A EXTRAIR:

1. ESTRUTURA VISUAL:
   - Layout e grid system
   - Hierarquia de informações
   - Posicionamento de elementos
   - Uso de espaços em branco

2. PADRÕES DE DESIGN:
   - Paleta de cores dominante
   - Tipografia (tamanhos, pesos, famílias)
   - Elementos gráficos recorrentes
   - Estilo de ícones e ilustrações

3. FÓRMULAS DE COMPOSIÇÃO:
   - Sequência de slides (para carrosséis)
   - Progressão visual da informação
   - Call-to-actions posicionamento
   - Elementos de engajamento

4. PADRÕES EMOCIONAIS:
   - Cores que evocam emoções específicas
   - Imagens que geram conexão
   - Elementos de urgência/escassez
   - Gatilhos psicológicos visuais

FORMATO DE TEMPLATE (JSON):
{
  "template_id": "carousel_viral_001",
  "template_name": "Carousel de Transformação",
  "content_type": "carousel",
  "viral_score": 92,
  "performance_metrics": {
    "avg_engagement_rate": 8.5,
    "avg_shares": 1200,
    "avg_saves": 800
  },
  "visual_structure": {
    "slide_count": 5,
    "aspect_ratio": "1:1",
    "layout_pattern": "problem-solution-proof-cta",
    "color_scheme": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4",
      "accent": "#FFE66D",
      "background": "#FFFFFF"
    },
    "typography": {
      "headline": {"font": "Montserrat", "weight": "bold", "size": "32px"},
      "body": {"font": "Open Sans", "weight": "regular", "size": "16px"}
    }
  },
  "content_formula": {
    "slide_1": {
      "purpose": "Hook/Problem",
      "elements": ["attention_grabbing_headline", "problem_visual", "emoji_hook"],
      "text_pattern": "Você está fazendo [ERRO] que está [CONSEQUÊNCIA]?"
    },
    "slide_2": {
      "purpose": "Agitation",
      "elements": ["pain_point_list", "statistics", "emotional_trigger"],
      "text_pattern": "Isso está causando: • [PROBLEMA 1] • [PROBLEMA 2] • [PROBLEMA 3]"
    }
  },
  "customization_variables": {
    "industry": "fitness|business|lifestyle|tech",
    "target_audience": "age_range|interests|pain_points",
    "brand_colors": "primary|secondary|accent",
    "content_topic": "main_subject|niche_focus"
  },
  "adaptation_rules": {
    "fitness": {
      "color_adjustments": "energetic_colors",
      "imagery_style": "transformation_photos",
      "tone": "motivational"
    }
  }
}

INSTRUÇÕES:
1. Analise PROFUNDAMENTE cada elemento visual
2. Identifique padrões que se repetem em conteúdo viral
3. Crie templates ADAPTÁVEIS para diferentes nichos
4. Forneça fórmulas específicas de conteúdo
5. Inclua métricas de performance quando disponível

Seja EXTREMAMENTE detalhado na extração de padrões.`,

            video_script_extraction: `Você é um ESPECIALISTA em roteiros virais e storytelling para vídeos.

MISSÃO: Analisar vídeos virais e extrair estruturas de roteiro reutilizáveis.

TIPOS DE VÍDEO:
- Reels do Instagram/Facebook
- Vídeos do TikTok
- YouTube Shorts
- Vídeos publicitários virais
- VSLs (Video Sales Letters) de alta conversão

ELEMENTOS A EXTRAIR:

1. ESTRUTURA NARRATIVA:
   - Hook (primeiros 3 segundos)
   - Desenvolvimento (meio)
   - Clímax/Revelação
   - Call-to-action (final)

2. PADRÕES DE COPY:
   - Frases de abertura que prendem
   - Transições entre ideias
   - Palavras-chave emocionais
   - Técnicas de persuasão

3. TIMING E RITMO:
   - Duração de cada seção
   - Pausas estratégicas
   - Momentos de tensão
   - Velocidade de fala

4. ELEMENTOS EMOCIONAIS:
   - Gatilhos emocionais usados
   - Progressão emocional
   - Pontos de conexão
   - Elementos de surpresa

5. TÉCNICAS VISUAIS:
   - Cortes e transições
   - Uso de texto na tela
   - Elementos gráficos
   - Mudanças de cenário/ângulo

FORMATO DE TEMPLATE (JSON):
{
  "template_id": "reel_transformation_001",
  "template_name": "Reel de Transformação Pessoal",
  "video_type": "reel",
  "duration": "30-60s",
  "viral_score": 95,
  "performance_metrics": {
    "avg_views": 500000,
    "avg_engagement_rate": 12.5,
    "avg_shares": 2500
  },
  "script_structure": {
    "hook": {
      "duration": "0-3s",
      "purpose": "Capturar atenção imediata",
      "formula": "[NÚMERO CHOCANTE] sobre [TÓPICO] que [CONSEQUÊNCIA]",
      "examples": ["97% das pessoas fazem isso errado", "Eu perdi R$ 50.000 fazendo isso"],
      "visual_cues": ["close_up_face", "text_overlay", "dramatic_pause"]
    },
    "problem_agitation": {
      "duration": "3-15s",
      "purpose": "Amplificar dor/problema",
      "formula": "Se você [AÇÃO COMUM], você está [CONSEQUÊNCIA NEGATIVA]",
      "emotional_triggers": ["fear", "urgency", "fomo"],
      "visual_cues": ["problem_demonstration", "before_state"]
    },
    "solution_reveal": {
      "duration": "15-45s",
      "purpose": "Apresentar solução",
      "formula": "Mas quando eu descobri [SOLUÇÃO], tudo mudou",
      "proof_elements": ["testimonial", "before_after", "results"],
      "visual_cues": ["transformation", "solution_demo"]
    },
    "call_to_action": {
      "duration": "45-60s",
      "purpose": "Direcionar ação",
      "formula": "[AÇÃO ESPECÍFICA] para [BENEFÍCIO IMEDIATO]",
      "urgency_elements": ["limited_time", "scarcity", "bonus"],
      "visual_cues": ["direct_camera", "text_cta", "gesture"]
    }
  },
  "copy_patterns": {
    "power_words": ["descobri", "segredo", "transformou", "revelação"],
    "emotional_triggers": ["medo de perder", "desejo de pertencer", "busca por status"],
    "persuasion_techniques": ["prova social", "autoridade", "escassez", "reciprocidade"]
  },
  "customization_variables": {
    "niche": "fitness|business|lifestyle|education",
    "target_emotion": "inspiration|fear|curiosity|desire",
    "content_goal": "awareness|consideration|conversion",
    "brand_voice": "professional|casual|humorous|authoritative"
  },
  "adaptation_rules": {
    "fitness": {
      "hook_focus": "transformation_results",
      "proof_type": "before_after_photos",
      "cta_style": "challenge_based"
    },
    "business": {
      "hook_focus": "income_results",
      "proof_type": "revenue_screenshots",
      "cta_style": "value_based"
    }
  }
}

INSTRUÇÕES:
1. Transcreva e analise TODA a copy do vídeo
2. Identifique padrões estruturais que se repetem
3. Extraia fórmulas específicas de cada seção
4. Mapeie elementos emocionais e psicológicos
5. Crie templates ADAPTÁVEIS por nicho
6. Inclua timing preciso de cada elemento

Seja EXTREMAMENTE detalhado na análise de roteiro.`,

            template_adaptation: `Você é um ESPECIALISTA em adaptação de templates para objetivos específicos.

MISSÃO: Pegar templates virais e adaptá-los para objetivos e nichos específicos do usuário.

PROCESSO DE ADAPTAÇÃO:

1. ANÁLISE DO OBJETIVO:
   - Objetivo do usuário (vendas, awareness, engajamento)
   - Nicho/indústria específica
   - Público-alvo definido
   - Plataforma de publicação

2. ADAPTAÇÃO DE CONTEÚDO:
   - Ajustar copy para o nicho
   - Modificar elementos visuais
   - Adaptar tom de voz
   - Personalizar call-to-actions

3. OTIMIZAÇÃO POR PLATAFORMA:
   - Instagram: Estética + Hashtags
   - TikTok: Trends + Música
   - LinkedIn: Profissional + Networking
   - YouTube: SEO + Thumbnails

4. PERSONALIZAÇÃO DE MARCA:
   - Cores da marca
   - Tipografia consistente
   - Elementos visuais únicos
   - Voz da marca

FORMATO DE ADAPTAÇÃO (JSON):
{
  "adapted_template_id": "carousel_fitness_transformation_001",
  "original_template_id": "carousel_viral_001",
  "adaptation_for": {
    "objective": "lead_generation",
    "niche": "fitness_coaching",
    "target_audience": "women_25_40_weight_loss",
    "platform": "instagram",
    "brand": "FitLife Coaching"
  },
  "adapted_structure": {
    "slide_1": {
      "original": "Você está fazendo [ERRO] que está [CONSEQUÊNCIA]?",
      "adapted": "Você está fazendo esses 3 erros que estão SABOTANDO sua perda de peso?",
      "visual_elements": ["before_photo", "error_icons", "worried_emoji"],
      "brand_colors": {"primary": "#E91E63", "secondary": "#FFC107"}
    }
  },
  "customized_elements": {
    "color_scheme": "brand_colors_applied",
    "typography": "brand_fonts_applied",
    "imagery_style": "fitness_focused",
    "tone_of_voice": "motivational_supportive"
  },
  "performance_predictions": {
    "estimated_engagement": "6.5-8.2%",
    "target_reach": "10000-15000",
    "conversion_potential": "high"
  }
}

INSTRUÇÕES:
1. Mantenha a ESTRUTURA VIRAL do template original
2. Adapte COMPLETAMENTE para o nicho específico
3. Personalize com elementos da marca
4. Otimize para a plataforma escolhida
5. Forneça previsões de performance

Seja PRECISO na adaptação mantendo o potencial viral.`
        };
        
        // Configurações do gerador
        this.templateConfig = {
            supportedContentTypes: [
                'carousel', 'story', 'reel', 'post', 'ad', 'thumbnail', 'vsl'
            ],
            templateCategories: [
                'transformation', 'educational', 'behind_scenes', 'testimonial',
                'comparison', 'list', 'question', 'controversial', 'trending'
            ],
            adaptationNiches: [
                'fitness', 'business', 'lifestyle', 'tech', 'education',
                'health', 'finance', 'travel', 'food', 'fashion'
            ]
        };
        
        // Banco de templates
        this.templateDatabase = new Map();
        this.templateStats = {
            totalTemplates: 0,
            totalAdaptations: 0,
            avgViralScore: 0,
            topPerformingCategories: []
        };
    }
    
    async extractVisualTemplate(contentData, analysisResults) {
        try {
            this.logger.info(`🎨 Extraindo template visual de: ${contentData.id}`);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "system",
                        content: this.masterPrompts.visual_template_extraction
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Extraia um template viral desta imagem/conteúdo:

DADOS DO CONTEÚDO:
- Tipo: ${contentData.contentType}
- Plataforma: ${contentData.platform}
- Engajamento: ${contentData.metrics.likes + contentData.metrics.comments + contentData.metrics.shares}
- Texto: "${contentData.text}"

ANÁLISE VISUAL PRÉVIA:
- Score Visual: ${analysisResults.overall_score}/100
- Potencial Viral: ${analysisResults.viral_potential?.viral_score || 'N/A'}/100
- Emoção Primária: ${analysisResults.visual_analysis?.emotional_triggers?.primary_emotion || 'N/A'}

Crie um template detalhado que capture os padrões virais desta imagem.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: contentData.imageUrl,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2500,
                temperature: 0.2,
                response_format: { type: "json_object" }
            });
            
            const templateData = JSON.parse(response.choices[0].message.content);
            
            // Enriquecer template com dados adicionais
            const enrichedTemplate = await this.enrichTemplate(templateData, contentData, analysisResults);
            
            // Salvar no banco de templates
            await this.saveTemplate(enrichedTemplate);
            
            this.logger.info(`✅ Template visual extraído: ${enrichedTemplate.template_id}`);
            return enrichedTemplate;
            
        } catch (error) {
            this.logger.error(`❌ Erro na extração de template visual: ${error.message}`);
            throw error;
        }
    }
    
    async extractVideoScriptTemplate(contentData, transcription, analysisResults) {
        try {
            this.logger.info(`🎬 Extraindo template de roteiro de: ${contentData.id}`);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: this.masterPrompts.video_script_extraction
                    },
                    {
                        role: "user",
                        content: `Extraia um template de roteiro viral deste vídeo:

DADOS DO VÍDEO:
- Tipo: ${contentData.contentType}
- Plataforma: ${contentData.platform}
- Duração: ${contentData.duration || 'N/A'}
- Views: ${contentData.metrics.views || 'N/A'}
- Engajamento: ${contentData.metrics.likes + contentData.metrics.comments + contentData.metrics.shares}

TRANSCRIÇÃO COMPLETA:
"${transcription}"

ANÁLISE PRÉVIA:
- Score de Conteúdo: ${analysisResults.overall_score}/100
- Emoção Primária: ${analysisResults.emotional_analysis?.primary_emotion || 'N/A'}
- Gatilhos Identificados: ${analysisResults.persuasion_analysis?.triggers?.join(', ') || 'N/A'}

Crie um template de roteiro detalhado que capture a estrutura viral deste vídeo.`
                    }
                ],
                max_tokens: 3000,
                temperature: 0.2,
                response_format: { type: "json_object" }
            });
            
            const templateData = JSON.parse(response.choices[0].message.content);
            
            // Enriquecer template com dados adicionais
            const enrichedTemplate = await this.enrichScriptTemplate(templateData, contentData, transcription, analysisResults);
            
            // Salvar no banco de templates
            await this.saveTemplate(enrichedTemplate);
            
            this.logger.info(`✅ Template de roteiro extraído: ${enrichedTemplate.template_id}`);
            return enrichedTemplate;
            
        } catch (error) {
            this.logger.error(`❌ Erro na extração de template de roteiro: ${error.message}`);
            throw error;
        }
    }
    
    async adaptTemplate(templateId, adaptationRequest) {
        try {
            this.logger.info(`🔄 Adaptando template ${templateId} para: ${adaptationRequest.niche}`);
            
            // Buscar template original
            const originalTemplate = await this.getTemplate(templateId);
            if (!originalTemplate) {
                throw new Error(`Template ${templateId} não encontrado`);
            }
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: this.masterPrompts.template_adaptation
                    },
                    {
                        role: "user",
                        content: `Adapte este template viral para o objetivo específico:

TEMPLATE ORIGINAL:
${JSON.stringify(originalTemplate, null, 2)}

REQUISITOS DE ADAPTAÇÃO:
- Objetivo: ${adaptationRequest.objective}
- Nicho: ${adaptationRequest.niche}
- Público-alvo: ${adaptationRequest.targetAudience}
- Plataforma: ${adaptationRequest.platform}
- Marca: ${adaptationRequest.brandName || 'N/A'}
- Cores da marca: ${adaptationRequest.brandColors || 'N/A'}
- Tom de voz: ${adaptationRequest.brandVoice || 'N/A'}

CONTEXTO ADICIONAL:
${adaptationRequest.additionalContext || 'Nenhum contexto adicional fornecido'}

Crie uma adaptação completa mantendo o potencial viral do template original.`
                    }
                ],
                max_tokens: 2500,
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            
            const adaptedTemplate = JSON.parse(response.choices[0].message.content);
            
            // Enriquecer adaptação
            const enrichedAdaptation = await this.enrichAdaptation(adaptedTemplate, originalTemplate, adaptationRequest);
            
            // Salvar adaptação
            await this.saveTemplate(enrichedAdaptation);
            
            // Atualizar estatísticas
            this.templateStats.totalAdaptations++;
            
            this.logger.info(`✅ Template adaptado: ${enrichedAdaptation.adapted_template_id}`);
            return enrichedAdaptation;
            
        } catch (error) {
            this.logger.error(`❌ Erro na adaptação de template: ${error.message}`);
            throw error;
        }
    }
    
    async enrichTemplate(templateData, contentData, analysisResults) {
        // Adicionar dados de performance real
        templateData.performance_metrics = {
            actual_engagement_rate: this.calculateEngagementRate(contentData.metrics),
            actual_shares: contentData.metrics.shares || 0,
            actual_saves: contentData.metrics.saves || 0,
            actual_comments: contentData.metrics.comments || 0,
            viral_coefficient: this.calculateViralCoefficient(contentData.metrics)
        };
        
        // Adicionar metadados
        templateData.extraction_metadata = {
            extracted_at: new Date().toISOString(),
            source_platform: contentData.platform,
            source_content_id: contentData.id,
            extraction_confidence: analysisResults.confidence_score || 85,
            agent_version: this.agentName
        };
        
        // Adicionar tags para busca
        templateData.search_tags = this.generateSearchTags(templateData, contentData);
        
        // Calcular score de template
        templateData.template_quality_score = this.calculateTemplateQualityScore(templateData, analysisResults);
        
        return templateData;
    }
    
    async enrichScriptTemplate(templateData, contentData, transcription, analysisResults) {
        // Adicionar análise de timing
        templateData.timing_analysis = await this.analyzeScriptTiming(transcription, contentData.duration);
        
        // Adicionar padrões de linguagem
        templateData.language_patterns = this.extractLanguagePatterns(transcription);
        
        // Adicionar elementos de performance
        templateData.performance_indicators = {
            view_retention_factors: this.identifyRetentionFactors(transcription),
            engagement_triggers: this.identifyEngagementTriggers(transcription),
            conversion_elements: this.identifyConversionElements(transcription)
        };
        
        return await this.enrichTemplate(templateData, contentData, analysisResults);
    }
    
    async enrichAdaptation(adaptedTemplate, originalTemplate, adaptationRequest) {
        // Adicionar referência ao template original
        adaptedTemplate.original_template_reference = {
            template_id: originalTemplate.template_id,
            viral_score: originalTemplate.viral_score,
            performance_metrics: originalTemplate.performance_metrics
        };
        
        // Adicionar dados de adaptação
        adaptedTemplate.adaptation_metadata = {
            adapted_at: new Date().toISOString(),
            adaptation_request: adaptationRequest,
            adaptation_confidence: 0.85, // Calculado baseado na qualidade da adaptação
            expected_performance: this.predictAdaptationPerformance(originalTemplate, adaptationRequest)
        };
        
        // Gerar ID único para adaptação
        adaptedTemplate.adapted_template_id = this.generateAdaptationId(originalTemplate.template_id, adaptationRequest);
        
        return adaptedTemplate;
    }
    
    calculateEngagementRate(metrics) {
        const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
        const reach = metrics.reach || metrics.views || metrics.impressions || 1;
        return ((totalEngagement / reach) * 100).toFixed(2);
    }
    
    calculateViralCoefficient(metrics) {
        // Fórmula: (Shares + Saves) / Total Engagement
        const viralActions = (metrics.shares || 0) + (metrics.saves || 0);
        const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + viralActions;
        return totalEngagement > 0 ? (viralActions / totalEngagement).toFixed(3) : 0;
    }
    
    generateSearchTags(templateData, contentData) {
        const tags = [];
        
        // Tags de tipo de conteúdo
        tags.push(templateData.content_type || contentData.contentType);
        
        // Tags de categoria
        if (templateData.template_name) {
            const category = this.inferCategory(templateData.template_name);
            tags.push(category);
        }
        
        // Tags de plataforma
        tags.push(contentData.platform);
        
        // Tags de performance
        if (templateData.viral_score > 90) tags.push('high_viral');
        if (templateData.viral_score > 80) tags.push('viral');
        
        // Tags de elementos visuais
        if (templateData.visual_structure?.color_scheme) {
            tags.push('color_scheme_defined');
        }
        
        return [...new Set(tags)]; // Remove duplicatas
    }
    
    calculateTemplateQualityScore(templateData, analysisResults) {
        let score = 70; // Base
        
        // Bonus por viral score alto
        if (templateData.viral_score > 90) score += 15;
        else if (templateData.viral_score > 80) score += 10;
        else if (templateData.viral_score > 70) score += 5;
        
        // Bonus por estrutura completa
        if (templateData.visual_structure || templateData.script_structure) score += 10;
        if (templateData.customization_variables) score += 5;
        if (templateData.adaptation_rules) score += 5;
        
        // Bonus por performance metrics
        if (templateData.performance_metrics) score += 5;
        
        return Math.min(score, 100);
    }
    
    async saveTemplate(templateData) {
        try {
            // Salvar em memória
            this.templateDatabase.set(templateData.template_id || templateData.adapted_template_id, templateData);
            
            // Salvar em arquivo para persistência
            const templatesDir = '/home/ubuntu/viral_content_scraper/storage/templates';
            await fs.mkdir(templatesDir, { recursive: true });
            
            const filename = `${templateData.template_id || templateData.adapted_template_id}.json`;
            const filepath = path.join(templatesDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(templateData, null, 2));
            
            // Atualizar estatísticas
            this.templateStats.totalTemplates++;
            this.updateTemplateStats(templateData);
            
            this.logger.info(`💾 Template salvo: ${filepath}`);
            
        } catch (error) {
            this.logger.error(`❌ Erro ao salvar template: ${error.message}`);
        }
    }
    
    async getTemplate(templateId) {
        try {
            // Buscar em memória primeiro
            if (this.templateDatabase.has(templateId)) {
                return this.templateDatabase.get(templateId);
            }
            
            // Buscar em arquivo
            const templatesDir = '/home/ubuntu/viral_content_scraper/storage/templates';
            const filepath = path.join(templatesDir, `${templateId}.json`);
            
            const data = await fs.readFile(filepath, 'utf8');
            const template = JSON.parse(data);
            
            // Carregar em memória
            this.templateDatabase.set(templateId, template);
            
            return template;
            
        } catch (error) {
            this.logger.warn(`⚠️ Template ${templateId} não encontrado: ${error.message}`);
            return null;
        }
    }
    
    async searchTemplates(criteria) {
        try {
            const results = [];
            
            // Buscar em todos os templates carregados
            for (const [templateId, template] of this.templateDatabase) {
                if (this.matchesCriteria(template, criteria)) {
                    results.push({
                        ...template,
                        relevance_score: this.calculateRelevanceScore(template, criteria)
                    });
                }
            }
            
            // Carregar templates de arquivo se necessário
            if (results.length < 10) {
                await this.loadAllTemplates();
                
                for (const [templateId, template] of this.templateDatabase) {
                    if (this.matchesCriteria(template, criteria) && !results.find(r => r.template_id === templateId)) {
                        results.push({
                            ...template,
                            relevance_score: this.calculateRelevanceScore(template, criteria)
                        });
                    }
                }
            }
            
            // Ordenar por relevância
            return results.sort((a, b) => b.relevance_score - a.relevance_score);
            
        } catch (error) {
            this.logger.error(`❌ Erro na busca de templates: ${error.message}`);
            return [];
        }
    }
    
    matchesCriteria(template, criteria) {
        // Verificar tipo de conteúdo
        if (criteria.contentType && template.content_type !== criteria.contentType) {
            return false;
        }
        
        // Verificar nicho
        if (criteria.niche && template.search_tags && !template.search_tags.includes(criteria.niche)) {
            return false;
        }
        
        // Verificar score mínimo
        if (criteria.minViralScore && template.viral_score < criteria.minViralScore) {
            return false;
        }
        
        // Verificar plataforma
        if (criteria.platform && template.extraction_metadata?.source_platform !== criteria.platform) {
            return false;
        }
        
        return true;
    }
    
    calculateRelevanceScore(template, criteria) {
        let score = 0;
        
        // Score base pelo viral score
        score += template.viral_score * 0.4;
        
        // Bonus por qualidade do template
        score += (template.template_quality_score || 70) * 0.3;
        
        // Bonus por correspondência exata de critérios
        if (criteria.contentType === template.content_type) score += 10;
        if (criteria.niche && template.search_tags?.includes(criteria.niche)) score += 15;
        if (criteria.platform === template.extraction_metadata?.source_platform) score += 5;
        
        return Math.round(score);
    }
    
    async loadAllTemplates() {
        try {
            const templatesDir = '/home/ubuntu/viral_content_scraper/storage/templates';
            const files = await fs.readdir(templatesDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const templateId = file.replace('.json', '');
                    if (!this.templateDatabase.has(templateId)) {
                        await this.getTemplate(templateId);
                    }
                }
            }
            
        } catch (error) {
            this.logger.warn(`⚠️ Erro ao carregar todos os templates: ${error.message}`);
        }
    }
    
    updateTemplateStats(templateData) {
        // Atualizar score médio
        const currentAvg = this.templateStats.avgViralScore;
        const newCount = this.templateStats.totalTemplates;
        this.templateStats.avgViralScore = ((currentAvg * (newCount - 1)) + templateData.viral_score) / newCount;
        
        // Atualizar categorias top
        const category = this.inferCategory(templateData.template_name || templateData.content_type);
        const existingCategory = this.templateStats.topPerformingCategories.find(c => c.name === category);
        
        if (existingCategory) {
            existingCategory.count++;
            existingCategory.avgScore = ((existingCategory.avgScore * (existingCategory.count - 1)) + templateData.viral_score) / existingCategory.count;
        } else {
            this.templateStats.topPerformingCategories.push({
                name: category,
                count: 1,
                avgScore: templateData.viral_score
            });
        }
        
        // Manter apenas top 10 categorias
        this.templateStats.topPerformingCategories = this.templateStats.topPerformingCategories
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 10);
    }
    
    inferCategory(templateName) {
        const name = (templateName || '').toLowerCase();
        
        if (name.includes('transformation') || name.includes('before')) return 'transformation';
        if (name.includes('educational') || name.includes('tips')) return 'educational';
        if (name.includes('behind') || name.includes('process')) return 'behind_scenes';
        if (name.includes('testimonial') || name.includes('review')) return 'testimonial';
        if (name.includes('comparison') || name.includes('vs')) return 'comparison';
        if (name.includes('list') || name.includes('steps')) return 'list';
        if (name.includes('question') || name.includes('quiz')) return 'question';
        if (name.includes('controversial') || name.includes('debate')) return 'controversial';
        if (name.includes('trending') || name.includes('viral')) return 'trending';
        
        return 'general';
    }
    
    generateAdaptationId(originalId, adaptationRequest) {
        const niche = adaptationRequest.niche.substring(0, 3);
        const platform = adaptationRequest.platform.substring(0, 2);
        const timestamp = Date.now().toString().slice(-6);
        
        return `${originalId}_${niche}_${platform}_${timestamp}`;
    }
    
    predictAdaptationPerformance(originalTemplate, adaptationRequest) {
        // Algoritmo simples de predição baseado em dados históricos
        let expectedScore = originalTemplate.viral_score;
        
        // Ajustes baseados no nicho
        const nicheMultipliers = {
            'fitness': 0.95,
            'business': 0.90,
            'lifestyle': 1.05,
            'tech': 0.85,
            'education': 0.80
        };
        
        expectedScore *= nicheMultipliers[adaptationRequest.niche] || 0.90;
        
        // Ajustes baseados na plataforma
        const platformMultipliers = {
            'instagram': 1.0,
            'tiktok': 1.1,
            'linkedin': 0.85,
            'youtube': 0.95
        };
        
        expectedScore *= platformMultipliers[adaptationRequest.platform] || 0.90;
        
        return {
            expected_viral_score: Math.round(expectedScore),
            confidence_level: 0.75,
            factors_considered: ['niche_alignment', 'platform_optimization', 'historical_data']
        };
    }
    
    getTemplateStats() {
        return {
            ...this.templateStats,
            templates_in_memory: this.templateDatabase.size,
            agent_name: this.agentName,
            last_updated: new Date().toISOString()
        };
    }
}

module.exports = TemplateGenerator;

