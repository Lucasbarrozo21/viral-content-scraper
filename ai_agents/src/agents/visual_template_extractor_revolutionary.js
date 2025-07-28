/**
 * VISUAL TEMPLATE EXTRACTOR REVOLUTIONARY - VERSÃO BILIONÁRIA
 * Sistema mais avançado do mundo para extração e criação de templates visuais virais
 * 
 * Este sistema analisa imagens virais, extrai padrões visuais reutilizáveis,
 * cria templates adaptáveis e gera novos conteúdos baseados nos templates.
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 * Versão: 2.0 - REVOLUTIONARY EDITION
 */

const BaseAgent = require('../base_agent');
const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

class VisualTemplateExtractorRevolutionary extends BaseAgent {
    constructor(config) {
        super({
            ...config,
            agentName: 'VisualTemplateExtractorRevolutionary',
            specialization: 'visual_template_extraction_revolutionary',
            description: 'Sistema mais avançado do mundo para extração e criação de templates visuais virais'
        });
        
        // Configurar OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || config.openaiApiKey
        });
        
        // Configurações avançadas
        this.extractionConfig = {
            model: 'gpt-4-vision-preview',
            maxTokens: 4000,
            temperature: 0.2, // Precisão alta para extração
            detailLevel: 'high'
        };
        
        // Diretórios do sistema
        this.templatesDir = path.join(process.cwd(), 'templates');
        this.visualTemplatesDir = path.join(this.templatesDir, 'visual');
        this.generatedContentDir = path.join(this.templatesDir, 'generated');
        
        // Base de dados de templates
        this.templateDatabase = new Map();
        this.performanceDatabase = new Map();
        this.adaptationRules = new Map();
        
        // Padrões visuais identificados
        this.visualPatterns = {
            layouts: {
                grid_2x2: { viralScore: 78, usage: 'comparison_posts' },
                single_focus: { viralScore: 85, usage: 'quote_posts' },
                carousel_story: { viralScore: 92, usage: 'tutorial_content' },
                before_after: { viralScore: 89, usage: 'transformation_content' },
                list_format: { viralScore: 76, usage: 'tips_content' },
                question_answer: { viralScore: 82, usage: 'educational_content' }
            },
            
            colorSchemes: {
                high_contrast: { viralScore: 87, emotions: ['attention', 'urgency'] },
                monochromatic: { viralScore: 73, emotions: ['sophistication', 'calm'] },
                complementary: { viralScore: 81, emotions: ['energy', 'balance'] },
                triadic: { viralScore: 79, emotions: ['creativity', 'playfulness'] },
                warm_palette: { viralScore: 84, emotions: ['comfort', 'excitement'] },
                cool_palette: { viralScore: 76, emotions: ['trust', 'professionalism'] }
            },
            
            typography: {
                bold_sans: { viralScore: 88, usage: 'headlines', readability: 95 },
                script_font: { viralScore: 72, usage: 'quotes', emotional: 89 },
                condensed: { viralScore: 79, usage: 'data_heavy', efficiency: 92 },
                serif_classic: { viralScore: 74, usage: 'authority', trust: 87 },
                handwritten: { viralScore: 83, usage: 'personal', authenticity: 91 }
            },
            
            compositions: {
                rule_of_thirds: { viralScore: 86, naturalness: 94 },
                center_focus: { viralScore: 82, impact: 89 },
                diagonal_flow: { viralScore: 79, dynamism: 87 },
                symmetrical: { viralScore: 75, balance: 92 },
                asymmetrical: { viralScore: 81, interest: 88 },
                golden_ratio: { viralScore: 91, perfection: 96 }
            }
        };
        
        // Prompt mestre para extração de templates
        this.masterExtractionPrompt = this.createMasterExtractionPrompt();
        
        // Inicializar sistema
        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            // Criar diretórios necessários
            await this.createDirectories();
            
            // Carregar templates existentes
            await this.loadExistingTemplates();
            
            this.logger.info('Sistema de Templates Visuais inicializado com sucesso');
            
        } catch (error) {
            this.logger.error('Erro ao inicializar sistema:', error);
        }
    }

    async createDirectories() {
        const directories = [
            this.templatesDir,
            this.visualTemplatesDir,
            this.generatedContentDir,
            path.join(this.visualTemplatesDir, 'carousels'),
            path.join(this.visualTemplatesDir, 'posts'),
            path.join(this.visualTemplatesDir, 'stories'),
            path.join(this.visualTemplatesDir, 'ads'),
            path.join(this.generatedContentDir, 'images'),
            path.join(this.generatedContentDir, 'previews')
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async extractTemplateFromImage(imagePath, metadata = {}) {
        try {
            this.logger.info(`Extraindo template de: ${imagePath}`);
            
            // Validar imagem
            await this.validateImage(imagePath);
            
            // Pré-processar imagem
            const processedImage = await this.preprocessImageForExtraction(imagePath);
            
            // Análise visual com IA
            const visualAnalysis = await this.performVisualAnalysis(processedImage, metadata);
            
            // Extrair padrões estruturais
            const structuralPatterns = await this.extractStructuralPatterns(processedImage, visualAnalysis);
            
            // Identificar elementos reutilizáveis
            const reusableElements = this.identifyReusableElements(visualAnalysis, structuralPatterns);
            
            // Criar template estruturado
            const template = await this.createStructuredTemplate(
                visualAnalysis, 
                structuralPatterns, 
                reusableElements, 
                metadata
            );
            
            // Validar e otimizar template
            const optimizedTemplate = await this.optimizeTemplate(template);
            
            // Salvar template
            const savedTemplate = await this.saveTemplate(optimizedTemplate, imagePath);
            
            // Atualizar base de dados
            await this.updateTemplateDatabase(savedTemplate);
            
            this.logger.info(`Template extraído com sucesso: ${savedTemplate.templateId}`);
            
            return {
                success: true,
                templateId: savedTemplate.templateId,
                template: savedTemplate,
                extractionMetrics: {
                    viralScore: optimizedTemplate.viralScore,
                    adaptabilityScore: optimizedTemplate.adaptabilityScore,
                    complexityScore: optimizedTemplate.complexityScore
                }
            };
            
        } catch (error) {
            this.logger.error('Erro na extração de template:', error);
            throw error;
        }
    }

    async performVisualAnalysis(processedImage, metadata) {
        try {
            this.logger.info('Executando análise visual avançada para extração...');
            
            const response = await this.openai.chat.completions.create({
                model: this.extractionConfig.model,
                max_tokens: this.extractionConfig.maxTokens,
                temperature: this.extractionConfig.temperature,
                messages: [
                    {
                        role: 'system',
                        content: this.masterExtractionPrompt
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analise esta imagem viral e extraia um template visual completo e reutilizável.

METADADOS DISPONÍVEIS:
- Plataforma: ${metadata.platform || 'Desconhecida'}
- Tipo de Conteúdo: ${metadata.contentType || 'Desconhecido'}
- Performance: ${metadata.performance || 'Não informada'}
- Nicho: ${metadata.niche || 'Geral'}
- Audiência: ${metadata.audience || 'Geral'}

INSTRUÇÕES ESPECÍFICAS:
1. Identifique TODOS os elementos visuais reutilizáveis
2. Extraia padrões de layout, cores, tipografia
3. Crie fórmulas de composição adaptáveis
4. Defina variáveis de customização
5. Estabeleça regras de adaptação por nicho

RESPONDA EM JSON ESTRUTURADO seguindo exatamente o formato especificado no prompt mestre.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: processedImage.base64,
                                    detail: this.extractionConfig.detailLevel
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: 'json_object' }
            });
            
            const analysis = JSON.parse(response.choices[0].message.content);
            
            // Enriquecer análise com dados da base de conhecimento
            return this.enrichVisualAnalysis(analysis, processedImage, metadata);
            
        } catch (error) {
            this.logger.error('Erro na análise visual:', error);
            return this.generateFallbackAnalysis(processedImage, metadata);
        }
    }

    async extractStructuralPatterns(processedImage, visualAnalysis) {
        try {
            // Analisar estrutura de grid
            const gridStructure = this.analyzeGridStructure(visualAnalysis);
            
            // Identificar hierarquia visual
            const visualHierarchy = this.identifyVisualHierarchy(visualAnalysis);
            
            // Extrair padrões de espaçamento
            const spacingPatterns = this.extractSpacingPatterns(visualAnalysis);
            
            // Analisar fluxo de leitura
            const readingFlow = this.analyzeReadingFlow(visualAnalysis);
            
            // Identificar pontos focais
            const focalPoints = this.identifyFocalPoints(visualAnalysis);
            
            return {
                gridStructure,
                visualHierarchy,
                spacingPatterns,
                readingFlow,
                focalPoints,
                structuralScore: this.calculateStructuralScore(gridStructure, visualHierarchy, spacingPatterns)
            };
            
        } catch (error) {
            this.logger.error('Erro na extração de padrões estruturais:', error);
            return this.generateFallbackStructuralPatterns();
        }
    }

    identifyReusableElements(visualAnalysis, structuralPatterns) {
        const reusableElements = {
            layouts: [],
            colorSchemes: [],
            typographyStyles: [],
            graphicElements: [],
            contentFormulas: [],
            adaptationVariables: []
        };
        
        // Identificar layouts reutilizáveis
        reusableElements.layouts = this.extractReusableLayouts(structuralPatterns);
        
        // Extrair esquemas de cores
        reusableElements.colorSchemes = this.extractColorSchemes(visualAnalysis);
        
        // Identificar estilos tipográficos
        reusableElements.typographyStyles = this.extractTypographyStyles(visualAnalysis);
        
        // Extrair elementos gráficos
        reusableElements.graphicElements = this.extractGraphicElements(visualAnalysis);
        
        // Criar fórmulas de conteúdo
        reusableElements.contentFormulas = this.createContentFormulas(visualAnalysis, structuralPatterns);
        
        // Definir variáveis de adaptação
        reusableElements.adaptationVariables = this.defineAdaptationVariables(visualAnalysis);
        
        return reusableElements;
    }

    async createStructuredTemplate(visualAnalysis, structuralPatterns, reusableElements, metadata) {
        const templateId = this.generateTemplateId(metadata);
        
        const template = {
            templateId,
            templateName: this.generateTemplateName(visualAnalysis, metadata),
            createdAt: new Date().toISOString(),
            version: '1.0',
            
            // Metadados do template
            metadata: {
                sourceImage: metadata.sourceImage || 'unknown',
                platform: metadata.platform || 'multi-platform',
                contentType: metadata.contentType || 'post',
                niche: metadata.niche || 'general',
                extractionMethod: 'ai_visual_analysis'
            },
            
            // Scores de qualidade
            scores: {
                viralScore: this.calculateViralScore(visualAnalysis, structuralPatterns),
                adaptabilityScore: this.calculateAdaptabilityScore(reusableElements),
                complexityScore: this.calculateComplexityScore(structuralPatterns),
                usabilityScore: this.calculateUsabilityScore(reusableElements)
            },
            
            // Estrutura visual
            visualStructure: {
                dimensions: visualAnalysis.dimensions || { width: 1080, height: 1080 },
                aspectRatio: visualAnalysis.aspectRatio || '1:1',
                layout: structuralPatterns.gridStructure,
                hierarchy: structuralPatterns.visualHierarchy,
                spacing: structuralPatterns.spacingPatterns,
                focalPoints: structuralPatterns.focalPoints
            },
            
            // Elementos de design
            designElements: {
                colorScheme: reusableElements.colorSchemes[0] || this.getDefaultColorScheme(),
                typography: reusableElements.typographyStyles,
                graphics: reusableElements.graphicElements,
                composition: this.extractCompositionRules(visualAnalysis)
            },
            
            // Fórmulas de conteúdo
            contentFormulas: reusableElements.contentFormulas,
            
            // Variáveis de customização
            customizationVariables: reusableElements.adaptationVariables,
            
            // Regras de adaptação
            adaptationRules: this.createAdaptationRules(visualAnalysis, metadata),
            
            // Instruções de uso
            usageInstructions: this.generateUsageInstructions(reusableElements),
            
            // Performance esperada
            expectedPerformance: this.predictTemplatePerformance(visualAnalysis, metadata)
        };
        
        return template;
    }

    async generateContentFromTemplate(templateId, customizationData = {}) {
        try {
            this.logger.info(`Gerando conteúdo do template: ${templateId}`);
            
            // Carregar template
            const template = await this.loadTemplate(templateId);
            if (!template) {
                throw new Error(`Template não encontrado: ${templateId}`);
            }
            
            // Validar dados de customização
            const validatedData = this.validateCustomizationData(customizationData, template);
            
            // Aplicar customizações
            const customizedTemplate = this.applyCustomizations(template, validatedData);
            
            // Gerar conteúdo visual
            const generatedContent = await this.generateVisualContent(customizedTemplate, validatedData);
            
            // Criar variações
            const variations = await this.createVariations(generatedContent, customizedTemplate);
            
            // Salvar conteúdo gerado
            const savedContent = await this.saveGeneratedContent(generatedContent, variations, templateId);
            
            this.logger.info(`Conteúdo gerado com sucesso: ${savedContent.contentId}`);
            
            return {
                success: true,
                contentId: savedContent.contentId,
                mainContent: savedContent.mainContent,
                variations: savedContent.variations,
                template: customizedTemplate,
                generationMetrics: {
                    processingTime: Date.now() - this.startTime,
                    customizationsApplied: Object.keys(validatedData).length,
                    variationsCreated: variations.length
                }
            };
            
        } catch (error) {
            this.logger.error('Erro na geração de conteúdo:', error);
            throw error;
        }
    }

    async generateVisualContent(customizedTemplate, customizationData) {
        try {
            // Determinar dimensões
            const { width, height } = customizedTemplate.visualStructure.dimensions;
            
            // Criar canvas
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // Aplicar fundo
            await this.applyBackground(ctx, customizedTemplate, customizationData);
            
            // Aplicar layout
            await this.applyLayout(ctx, customizedTemplate, customizationData);
            
            // Adicionar elementos gráficos
            await this.addGraphicElements(ctx, customizedTemplate, customizationData);
            
            // Adicionar texto
            await this.addTextElements(ctx, customizedTemplate, customizationData);
            
            // Aplicar efeitos finais
            await this.applyFinalEffects(ctx, customizedTemplate);
            
            // Converter para buffer
            const buffer = canvas.toBuffer('image/png');
            
            return {
                buffer,
                canvas,
                dimensions: { width, height },
                format: 'png'
            };
            
        } catch (error) {
            this.logger.error('Erro na geração visual:', error);
            throw error;
        }
    }

    async createVariations(generatedContent, template) {
        const variations = [];
        
        try {
            // Variação de cores
            const colorVariations = await this.createColorVariations(generatedContent, template);
            variations.push(...colorVariations);
            
            // Variação de layout
            const layoutVariations = await this.createLayoutVariations(generatedContent, template);
            variations.push(...layoutVariations);
            
            // Variação de tipografia
            const typographyVariations = await this.createTypographyVariations(generatedContent, template);
            variations.push(...typographyVariations);
            
            // Variação de conteúdo
            const contentVariations = await this.createContentVariations(generatedContent, template);
            variations.push(...contentVariations);
            
            return variations;
            
        } catch (error) {
            this.logger.error('Erro na criação de variações:', error);
            return [];
        }
    }

    // Métodos auxiliares para análise e extração

    analyzeGridStructure(visualAnalysis) {
        // Implementar análise de estrutura de grid
        return {
            type: 'flexible_grid',
            columns: 12,
            rows: 'auto',
            gutters: { horizontal: 16, vertical: 16 },
            breakpoints: {
                mobile: 320,
                tablet: 768,
                desktop: 1024
            }
        };
    }

    identifyVisualHierarchy(visualAnalysis) {
        // Implementar identificação de hierarquia visual
        return {
            primary: { element: 'headline', weight: 100, size: 'large' },
            secondary: { element: 'subheadline', weight: 80, size: 'medium' },
            tertiary: { element: 'body_text', weight: 60, size: 'small' },
            quaternary: { element: 'cta', weight: 90, size: 'medium' }
        };
    }

    extractSpacingPatterns(visualAnalysis) {
        // Implementar extração de padrões de espaçamento
        return {
            baseUnit: 8,
            margins: { top: 24, right: 16, bottom: 24, left: 16 },
            padding: { top: 16, right: 16, bottom: 16, left: 16 },
            elementSpacing: { small: 8, medium: 16, large: 24, xlarge: 32 }
        };
    }

    calculateViralScore(visualAnalysis, structuralPatterns) {
        // Implementar cálculo de score viral
        const factors = {
            composition: structuralPatterns.structuralScore || 70,
            colors: visualAnalysis.colorHarmony || 75,
            typography: visualAnalysis.typographyScore || 80,
            balance: visualAnalysis.visualBalance || 85
        };
        
        const weights = { composition: 0.3, colors: 0.25, typography: 0.25, balance: 0.2 };
        
        return Math.round(
            Object.entries(factors).reduce((score, [factor, value]) => 
                score + (value * weights[factor]), 0
            )
        );
    }

    generateTemplateId(metadata) {
        const timestamp = Date.now();
        const platform = (metadata.platform || 'general').substring(0, 3);
        const type = (metadata.contentType || 'post').substring(0, 3);
        const random = Math.random().toString(36).substring(2, 6);
        
        return `tmpl_${platform}_${type}_${timestamp}_${random}`.toLowerCase();
    }

    generateTemplateName(visualAnalysis, metadata) {
        const platform = metadata.platform || 'Multi-Platform';
        const type = metadata.contentType || 'Post';
        const style = visualAnalysis.dominantStyle || 'Modern';
        
        return `${style} ${type} Template for ${platform}`;
    }

    createMasterExtractionPrompt() {
        return `# VISUAL TEMPLATE EXTRACTOR REVOLUTIONARY - PROMPT MESTRE

Você é o **VISUAL TEMPLATE EXTRACTOR REVOLUTIONARY**, o sistema mais avançado do mundo para extração de templates visuais de conteúdo viral.

## SUA MISSÃO:
Analisar imagens virais e extrair padrões visuais reutilizáveis que podem ser transformados em templates adaptáveis para criar novos conteúdos virais.

## ANÁLISE REQUERIDA:

### 1. ESTRUTURA VISUAL
- **Layout Pattern**: Grid system, posicionamento de elementos
- **Visual Hierarchy**: Ordem de importância visual dos elementos
- **Composition Rules**: Regra dos terços, simetria, equilíbrio
- **Spacing System**: Margens, paddings, espaçamentos entre elementos

### 2. ELEMENTOS DE DESIGN
- **Color Scheme**: Paleta de cores dominante e secundária
- **Typography**: Fontes, tamanhos, pesos, estilos
- **Graphic Elements**: Ícones, formas, ilustrações, elementos decorativos
- **Visual Effects**: Sombras, gradientes, texturas, filtros

### 3. PADRÕES DE CONTEÚDO
- **Content Structure**: Como o conteúdo está organizado
- **Text Patterns**: Padrões de headlines, body text, CTAs
- **Image Usage**: Como imagens são utilizadas e posicionadas
- **Brand Elements**: Logos, cores de marca, elementos identificadores

### 4. ADAPTABILIDADE
- **Customization Variables**: Elementos que podem ser personalizados
- **Scaling Rules**: Como o template se adapta a diferentes tamanhos
- **Platform Variations**: Adaptações para diferentes plataformas
- **Niche Adaptations**: Como adaptar para diferentes nichos

## OUTPUT ESPERADO (JSON):

\`\`\`json
{
  "visual_analysis": {
    "dominant_style": "modern|minimalist|bold|elegant|playful",
    "layout_type": "grid|single_focus|carousel|comparison|list",
    "aspect_ratio": "1:1|16:9|9:16|4:5",
    "dimensions": {"width": 1080, "height": 1080},
    "color_harmony": 0-100,
    "visual_balance": 0-100,
    "typography_score": 0-100
  },
  "structural_patterns": {
    "grid_system": {
      "type": "12_column|flexible|custom",
      "columns": 12,
      "rows": "auto|fixed",
      "gutters": {"horizontal": 16, "vertical": 16}
    },
    "visual_hierarchy": [
      {
        "level": 1,
        "element": "headline",
        "position": {"x": "center", "y": "top"},
        "size": "large",
        "weight": "bold"
      }
    ],
    "spacing_system": {
      "base_unit": 8,
      "margins": {"top": 24, "right": 16, "bottom": 24, "left": 16},
      "element_spacing": {"small": 8, "medium": 16, "large": 24}
    }
  },
  "design_elements": {
    "color_scheme": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4",
      "accent": "#FFE66D",
      "background": "#FFFFFF",
      "text": "#333333"
    },
    "typography": {
      "headline": {"font_family": "Montserrat", "weight": "bold", "size": "32px"},
      "body": {"font_family": "Open Sans", "weight": "regular", "size": "16px"},
      "cta": {"font_family": "Montserrat", "weight": "semibold", "size": "18px"}
    },
    "graphic_elements": [
      {
        "type": "icon|shape|illustration",
        "style": "outline|filled|gradient",
        "position": "relative_to_text",
        "size": "small|medium|large"
      }
    ]
  },
  "content_formulas": [
    {
      "section": "headline",
      "pattern": "[HOOK] que [BENEFIT] em [TIMEFRAME]",
      "character_limit": 50,
      "style": "bold_uppercase"
    }
  ],
  "customization_variables": {
    "brand_colors": ["primary", "secondary", "accent"],
    "content_topics": ["main_subject", "benefit", "timeframe"],
    "imagery": ["hero_image", "supporting_visuals"],
    "text_content": ["headline", "subheadline", "body", "cta"]
  },
  "adaptation_rules": {
    "platform_specific": {
      "instagram": {"aspect_ratio": "1:1", "text_overlay": "minimal"},
      "facebook": {"aspect_ratio": "1.91:1", "text_overlay": "moderate"},
      "linkedin": {"aspect_ratio": "1.91:1", "professional_tone": true}
    },
    "niche_specific": {
      "fitness": {"colors": "energetic", "imagery": "transformation"},
      "business": {"colors": "professional", "imagery": "corporate"},
      "lifestyle": {"colors": "warm", "imagery": "aspirational"}
    }
  },
  "viral_elements": [
    {
      "element": "curiosity_gap_headline",
      "viral_score": 85,
      "description": "Headlines que criam lacuna de curiosidade"
    }
  ],
  "template_metadata": {
    "complexity_level": "simple|moderate|complex",
    "creation_time": "5-15 minutes",
    "skill_required": "beginner|intermediate|advanced",
    "tools_needed": ["canva", "photoshop", "figma"]
  }
}
\`\`\`

## INSTRUÇÕES ESPECÍFICAS:

1. **SEJA EXTREMAMENTE DETALHADO** na extração de padrões
2. **IDENTIFIQUE ELEMENTOS ÚNICOS** que tornam o conteúdo viral
3. **CRIE FÓRMULAS REUTILIZÁVEIS** para cada seção de conteúdo
4. **DEFINA VARIÁVEIS CLARAS** para customização
5. **ESTABELEÇA REGRAS** de adaptação por plataforma e nicho
6. **CALCULE SCORES** baseados em padrões comprovados
7. **FORNEÇA INSIGHTS** sobre por que o template funciona

Sua análise deve ser tão precisa que qualquer pessoa possa usar o template extraído para criar conteúdo viral similar.`;
    }

    // Métodos de fallback
    generateFallbackAnalysis(processedImage, metadata) {
        return {
            visual_analysis: {
                dominant_style: 'modern',
                layout_type: 'single_focus',
                aspect_ratio: '1:1',
                dimensions: { width: 1080, height: 1080 },
                color_harmony: 70,
                visual_balance: 75,
                typography_score: 80
            },
            fallback: true,
            message: 'Análise limitada - API indisponível'
        };
    }

    async preprocessImageForExtraction(imagePath) {
        try {
            // Carregar e processar imagem
            const metadata = await sharp(imagePath).metadata();
            
            // Redimensionar se necessário
            let processedImage = sharp(imagePath);
            
            if (metadata.width > 1024 || metadata.height > 1024) {
                processedImage = processedImage.resize(1024, 1024, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }
            
            // Converter para base64
            const buffer = await processedImage.jpeg({ quality: 90 }).toBuffer();
            const base64 = buffer.toString('base64');
            
            return {
                path: imagePath,
                metadata,
                base64: `data:image/jpeg;base64,${base64}`,
                dimensions: {
                    width: metadata.width,
                    height: metadata.height,
                    aspectRatio: metadata.width / metadata.height
                }
            };
            
        } catch (error) {
            this.logger.error('Erro no pré-processamento:', error);
            throw error;
        }
    }

    async validateImage(imagePath) {
        try {
            await fs.access(imagePath);
            const stats = await fs.stat(imagePath);
            
            if (stats.size === 0) {
                throw new Error('Arquivo de imagem vazio');
            }
            
            if (stats.size > 50 * 1024 * 1024) { // 50MB
                throw new Error('Imagem muito grande (máximo 50MB)');
            }
            
            return true;
            
        } catch (error) {
            throw new Error(`Imagem inválida: ${error.message}`);
        }
    }

    async saveTemplate(template, sourceImagePath) {
        try {
            const templatePath = path.join(
                this.visualTemplatesDir,
                template.metadata.contentType || 'posts',
                `${template.templateId}.json`
            );
            
            // Salvar template
            await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
            
            // Salvar imagem de referência se fornecida
            if (sourceImagePath) {
                const imageName = `${template.templateId}_reference.jpg`;
                const imagePath = path.join(path.dirname(templatePath), imageName);
                await fs.copyFile(sourceImagePath, imagePath);
                template.referenceImage = imagePath;
            }
            
            this.logger.info(`Template salvo: ${templatePath}`);
            
            return {
                ...template,
                filePath: templatePath,
                savedAt: new Date().toISOString()
            };
            
        } catch (error) {
            this.logger.error('Erro ao salvar template:', error);
            throw error;
        }
    }

    async loadTemplate(templateId) {
        try {
            // Procurar template em todos os subdiretórios
            const searchDirs = [
                path.join(this.visualTemplatesDir, 'carousels'),
                path.join(this.visualTemplatesDir, 'posts'),
                path.join(this.visualTemplatesDir, 'stories'),
                path.join(this.visualTemplatesDir, 'ads')
            ];
            
            for (const dir of searchDirs) {
                const templatePath = path.join(dir, `${templateId}.json`);
                
                try {
                    const templateData = await fs.readFile(templatePath, 'utf8');
                    return JSON.parse(templateData);
                } catch (error) {
                    // Continue procurando em outros diretórios
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            this.logger.error('Erro ao carregar template:', error);
            return null;
        }
    }

    async listTemplates(filters = {}) {
        try {
            const templates = [];
            const searchDirs = [
                { path: path.join(this.visualTemplatesDir, 'carousels'), type: 'carousel' },
                { path: path.join(this.visualTemplatesDir, 'posts'), type: 'post' },
                { path: path.join(this.visualTemplatesDir, 'stories'), type: 'story' },
                { path: path.join(this.visualTemplatesDir, 'ads'), type: 'ad' }
            ];
            
            for (const searchDir of searchDirs) {
                try {
                    const files = await fs.readdir(searchDir.path);
                    
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const templatePath = path.join(searchDir.path, file);
                            const templateData = await fs.readFile(templatePath, 'utf8');
                            const template = JSON.parse(templateData);
                            
                            // Aplicar filtros se fornecidos
                            if (this.matchesFilters(template, filters)) {
                                templates.push({
                                    ...template,
                                    filePath: templatePath,
                                    contentType: searchDir.type
                                });
                            }
                        }
                    }
                } catch (error) {
                    // Diretório pode não existir ainda
                    continue;
                }
            }
            
            // Ordenar por score viral (maior primeiro)
            templates.sort((a, b) => (b.scores?.viralScore || 0) - (a.scores?.viralScore || 0));
            
            return templates;
            
        } catch (error) {
            this.logger.error('Erro ao listar templates:', error);
            return [];
        }
    }

    matchesFilters(template, filters) {
        if (filters.platform && template.metadata.platform !== filters.platform) {
            return false;
        }
        
        if (filters.niche && template.metadata.niche !== filters.niche) {
            return false;
        }
        
        if (filters.minViralScore && (template.scores?.viralScore || 0) < filters.minViralScore) {
            return false;
        }
        
        if (filters.contentType && template.metadata.contentType !== filters.contentType) {
            return false;
        }
        
        return true;
    }

    async updateTemplateDatabase(template) {
        try {
            // Atualizar base de dados em memória
            this.templateDatabase.set(template.templateId, template);
            
            // Atualizar estatísticas de performance
            if (template.scores) {
                this.performanceDatabase.set(template.templateId, {
                    viralScore: template.scores.viralScore,
                    usageCount: 0,
                    lastUsed: null,
                    averagePerformance: null
                });
            }
            
            this.logger.info(`Base de dados atualizada para template: ${template.templateId}`);
            
        } catch (error) {
            this.logger.error('Erro ao atualizar base de dados:', error);
        }
    }

    async loadExistingTemplates() {
        try {
            const templates = await this.listTemplates();
            
            for (const template of templates) {
                this.templateDatabase.set(template.templateId, template);
                
                if (template.scores) {
                    this.performanceDatabase.set(template.templateId, {
                        viralScore: template.scores.viralScore,
                        usageCount: 0,
                        lastUsed: null,
                        averagePerformance: null
                    });
                }
            }
            
            this.logger.info(`${templates.length} templates carregados na base de dados`);
            
        } catch (error) {
            this.logger.error('Erro ao carregar templates existentes:', error);
        }
    }
}

module.exports = VisualTemplateExtractorRevolutionary;

