/**
 * TEMPLATE MANAGER REVOLUTIONARY - VERSÃO BILIONÁRIA
 * Gerenciador completo de templates visuais com funcionalidades avançadas
 * 
 * Este sistema gerencia toda a biblioteca de templates, incluindo:
 * - Criação e salvamento de templates
 * - Busca e filtragem avançada
 * - Geração de conteúdo baseado em templates
 * - Análise de performance e otimização
 * - Sistema de versionamento e backup
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 * Versão: 2.0 - REVOLUTIONARY EDITION
 */

const BaseAgent = require('../base_agent');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class TemplateManagerRevolutionary extends BaseAgent {
    constructor(config) {
        super({
            ...config,
            agentName: 'TemplateManagerRevolutionary',
            specialization: 'template_management_revolutionary',
            description: 'Gerenciador completo de templates visuais com funcionalidades avançadas'
        });
        
        // Diretórios do sistema
        this.templatesDir = path.join(process.cwd(), 'templates');
        this.visualTemplatesDir = path.join(this.templatesDir, 'visual');
        this.generatedContentDir = path.join(this.templatesDir, 'generated');
        this.backupDir = path.join(this.templatesDir, 'backups');
        
        // Base de dados em memória
        this.templateCache = new Map();
        this.performanceStats = new Map();
        this.usageHistory = new Map();
        
        // Configurações
        this.config = {
            maxTemplatesInCache: 1000,
            backupInterval: 24 * 60 * 60 * 1000, // 24 horas
            performanceTrackingEnabled: true,
            autoOptimization: true
        };
        
        // Inicializar sistema
        this.initializeManager();
    }

    async initializeManager() {
        try {
            // Criar estrutura de diretórios
            await this.createDirectoryStructure();
            
            // Carregar templates existentes
            await this.loadAllTemplates();
            
            // Inicializar estatísticas
            await this.initializeStats();
            
            // Configurar backup automático
            this.setupAutoBackup();
            
            this.logger.info('Template Manager inicializado com sucesso');
            
        } catch (error) {
            this.logger.error('Erro ao inicializar Template Manager:', error);
        }
    }

    async createDirectoryStructure() {
        const directories = [
            this.templatesDir,
            this.visualTemplatesDir,
            this.generatedContentDir,
            this.backupDir,
            path.join(this.visualTemplatesDir, 'carousels'),
            path.join(this.visualTemplatesDir, 'posts'),
            path.join(this.visualTemplatesDir, 'stories'),
            path.join(this.visualTemplatesDir, 'ads'),
            path.join(this.visualTemplatesDir, 'thumbnails'),
            path.join(this.generatedContentDir, 'images'),
            path.join(this.generatedContentDir, 'previews'),
            path.join(this.generatedContentDir, 'variations'),
            path.join(this.backupDir, 'daily'),
            path.join(this.backupDir, 'weekly'),
            path.join(this.backupDir, 'monthly')
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async saveTemplate(template, options = {}) {
        try {
            this.logger.info(`Salvando template: ${template.templateId}`);
            
            // Validar template
            const validatedTemplate = await this.validateTemplate(template);
            
            // Determinar diretório baseado no tipo de conteúdo
            const contentTypeDir = this.getContentTypeDirectory(validatedTemplate.metadata.contentType);
            const templatePath = path.join(contentTypeDir, `${validatedTemplate.templateId}.json`);
            
            // Adicionar timestamp de salvamento
            validatedTemplate.savedAt = new Date().toISOString();
            validatedTemplate.version = validatedTemplate.version || '1.0';
            
            // Salvar arquivo JSON
            await fs.writeFile(templatePath, JSON.stringify(validatedTemplate, null, 2));
            
            // Salvar imagem de referência se fornecida
            if (options.referenceImage) {
                await this.saveReferenceImage(validatedTemplate.templateId, options.referenceImage, contentTypeDir);
            }
            
            // Criar preview do template
            if (options.generatePreview) {
                await this.generateTemplatePreview(validatedTemplate);
            }
            
            // Atualizar cache
            this.templateCache.set(validatedTemplate.templateId, validatedTemplate);
            
            // Inicializar estatísticas
            this.performanceStats.set(validatedTemplate.templateId, {
                usageCount: 0,
                totalGenerations: 0,
                averageRating: 0,
                lastUsed: null,
                createdAt: validatedTemplate.savedAt
            });
            
            this.logger.info(`Template salvo com sucesso: ${templatePath}`);
            
            return {
                success: true,
                templateId: validatedTemplate.templateId,
                filePath: templatePath,
                template: validatedTemplate
            };
            
        } catch (error) {
            this.logger.error('Erro ao salvar template:', error);
            throw error;
        }
    }

    async loadTemplate(templateId) {
        try {
            // Verificar cache primeiro
            if (this.templateCache.has(templateId)) {
                return this.templateCache.get(templateId);
            }
            
            // Procurar em todos os diretórios
            const searchDirs = [
                path.join(this.visualTemplatesDir, 'carousels'),
                path.join(this.visualTemplatesDir, 'posts'),
                path.join(this.visualTemplatesDir, 'stories'),
                path.join(this.visualTemplatesDir, 'ads'),
                path.join(this.visualTemplatesDir, 'thumbnails')
            ];
            
            for (const dir of searchDirs) {
                const templatePath = path.join(dir, `${templateId}.json`);
                
                try {
                    const templateData = await fs.readFile(templatePath, 'utf8');
                    const template = JSON.parse(templateData);
                    
                    // Adicionar ao cache
                    this.templateCache.set(templateId, template);
                    
                    return template;
                    
                } catch (error) {
                    // Continue procurando
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            this.logger.error('Erro ao carregar template:', error);
            return null;
        }
    }

    async searchTemplates(query = {}) {
        try {
            const results = [];
            const allTemplates = await this.getAllTemplates();
            
            for (const template of allTemplates) {
                if (this.matchesSearchCriteria(template, query)) {
                    // Adicionar dados de performance
                    const stats = this.performanceStats.get(template.templateId);
                    const enrichedTemplate = {
                        ...template,
                        performanceStats: stats || null
                    };
                    
                    results.push(enrichedTemplate);
                }
            }
            
            // Ordenar resultados
            const sortedResults = this.sortSearchResults(results, query.sortBy || 'viralScore');
            
            // Aplicar paginação se especificada
            if (query.page && query.limit) {
                const startIndex = (query.page - 1) * query.limit;
                const endIndex = startIndex + query.limit;
                return {
                    templates: sortedResults.slice(startIndex, endIndex),
                    totalCount: sortedResults.length,
                    page: query.page,
                    limit: query.limit,
                    totalPages: Math.ceil(sortedResults.length / query.limit)
                };
            }
            
            return {
                templates: sortedResults,
                totalCount: sortedResults.length
            };
            
        } catch (error) {
            this.logger.error('Erro na busca de templates:', error);
            return { templates: [], totalCount: 0 };
        }
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
            
            // Aplicar customizações ao template
            const customizedTemplate = this.applyCustomizations(template, validatedData);
            
            // Gerar conteúdo visual
            const generatedContent = await this.generateVisualContent(customizedTemplate, validatedData);
            
            // Criar variações se solicitado
            const variations = customizationData.generateVariations ? 
                await this.createVariations(generatedContent, customizedTemplate) : [];
            
            // Salvar conteúdo gerado
            const savedContent = await this.saveGeneratedContent(
                generatedContent, 
                variations, 
                templateId, 
                customizationData
            );
            
            // Atualizar estatísticas de uso
            await this.updateUsageStats(templateId);
            
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

    async getAllTemplates() {
        try {
            const templates = [];
            const searchDirs = [
                { path: path.join(this.visualTemplatesDir, 'carousels'), type: 'carousel' },
                { path: path.join(this.visualTemplatesDir, 'posts'), type: 'post' },
                { path: path.join(this.visualTemplatesDir, 'stories'), type: 'story' },
                { path: path.join(this.visualTemplatesDir, 'ads'), type: 'ad' },
                { path: path.join(this.visualTemplatesDir, 'thumbnails'), type: 'thumbnail' }
            ];
            
            for (const searchDir of searchDirs) {
                try {
                    const files = await fs.readdir(searchDir.path);
                    
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const templatePath = path.join(searchDir.path, file);
                            const templateData = await fs.readFile(templatePath, 'utf8');
                            const template = JSON.parse(templateData);
                            
                            template.filePath = templatePath;
                            template.contentType = searchDir.type;
                            
                            templates.push(template);
                        }
                    }
                } catch (error) {
                    // Diretório pode não existir
                    continue;
                }
            }
            
            return templates;
            
        } catch (error) {
            this.logger.error('Erro ao carregar todos os templates:', error);
            return [];
        }
    }

    async getTemplateStats(templateId) {
        try {
            const template = await this.loadTemplate(templateId);
            if (!template) {
                return null;
            }
            
            const stats = this.performanceStats.get(templateId) || {};
            const usageHistory = this.usageHistory.get(templateId) || [];
            
            return {
                templateId,
                templateName: template.templateName,
                createdAt: template.createdAt,
                scores: template.scores,
                usage: {
                    totalUsage: stats.usageCount || 0,
                    totalGenerations: stats.totalGenerations || 0,
                    averageRating: stats.averageRating || 0,
                    lastUsed: stats.lastUsed
                },
                history: usageHistory.slice(-10), // Últimos 10 usos
                performance: {
                    conversionRate: this.calculateConversionRate(templateId),
                    popularityScore: this.calculatePopularityScore(templateId),
                    trendingStatus: this.getTrendingStatus(templateId)
                }
            };
            
        } catch (error) {
            this.logger.error('Erro ao obter estatísticas:', error);
            return null;
        }
    }

    async updateTemplate(templateId, updates) {
        try {
            this.logger.info(`Atualizando template: ${templateId}`);
            
            // Carregar template atual
            const currentTemplate = await this.loadTemplate(templateId);
            if (!currentTemplate) {
                throw new Error(`Template não encontrado: ${templateId}`);
            }
            
            // Criar backup da versão atual
            await this.createTemplateBackup(currentTemplate);
            
            // Aplicar atualizações
            const updatedTemplate = {
                ...currentTemplate,
                ...updates,
                version: this.incrementVersion(currentTemplate.version),
                updatedAt: new Date().toISOString(),
                previousVersion: currentTemplate.version
            };
            
            // Validar template atualizado
            const validatedTemplate = await this.validateTemplate(updatedTemplate);
            
            // Salvar template atualizado
            const result = await this.saveTemplate(validatedTemplate);
            
            this.logger.info(`Template atualizado com sucesso: ${templateId}`);
            
            return result;
            
        } catch (error) {
            this.logger.error('Erro ao atualizar template:', error);
            throw error;
        }
    }

    async deleteTemplate(templateId, options = {}) {
        try {
            this.logger.info(`Deletando template: ${templateId}`);
            
            // Carregar template para backup
            const template = await this.loadTemplate(templateId);
            if (!template) {
                throw new Error(`Template não encontrado: ${templateId}`);
            }
            
            // Criar backup se solicitado
            if (!options.skipBackup) {
                await this.createTemplateBackup(template);
            }
            
            // Encontrar arquivo do template
            const templatePath = await this.findTemplatePath(templateId);
            if (!templatePath) {
                throw new Error(`Arquivo do template não encontrado: ${templateId}`);
            }
            
            // Deletar arquivo
            await fs.unlink(templatePath);
            
            // Deletar imagem de referência se existir
            const referenceImagePath = templatePath.replace('.json', '_reference.jpg');
            try {
                await fs.unlink(referenceImagePath);
            } catch (error) {
                // Imagem de referência pode não existir
            }
            
            // Remover do cache
            this.templateCache.delete(templateId);
            this.performanceStats.delete(templateId);
            this.usageHistory.delete(templateId);
            
            this.logger.info(`Template deletado com sucesso: ${templateId}`);
            
            return { success: true, templateId, deletedAt: new Date().toISOString() };
            
        } catch (error) {
            this.logger.error('Erro ao deletar template:', error);
            throw error;
        }
    }

    // Métodos auxiliares

    matchesSearchCriteria(template, query) {
        // Filtro por plataforma
        if (query.platform && template.metadata.platform !== query.platform) {
            return false;
        }
        
        // Filtro por tipo de conteúdo
        if (query.contentType && template.metadata.contentType !== query.contentType) {
            return false;
        }
        
        // Filtro por nicho
        if (query.niche && template.metadata.niche !== query.niche) {
            return false;
        }
        
        // Filtro por score viral mínimo
        if (query.minViralScore && (template.scores?.viralScore || 0) < query.minViralScore) {
            return false;
        }
        
        // Filtro por tags
        if (query.tags && query.tags.length > 0) {
            const templateTags = template.templateMetadata?.tags || [];
            const hasMatchingTag = query.tags.some(tag => templateTags.includes(tag));
            if (!hasMatchingTag) {
                return false;
            }
        }
        
        // Busca por texto
        if (query.search) {
            const searchText = query.search.toLowerCase();
            const templateText = [
                template.templateName,
                template.metadata.niche,
                template.templateMetadata?.category,
                ...(template.templateMetadata?.tags || [])
            ].join(' ').toLowerCase();
            
            if (!templateText.includes(searchText)) {
                return false;
            }
        }
        
        return true;
    }

    sortSearchResults(results, sortBy) {
        switch (sortBy) {
            case 'viralScore':
                return results.sort((a, b) => (b.scores?.viralScore || 0) - (a.scores?.viralScore || 0));
            
            case 'usageCount':
                return results.sort((a, b) => {
                    const aUsage = a.performanceStats?.usageCount || 0;
                    const bUsage = b.performanceStats?.usageCount || 0;
                    return bUsage - aUsage;
                });
            
            case 'createdAt':
                return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            case 'name':
                return results.sort((a, b) => a.templateName.localeCompare(b.templateName));
            
            case 'adaptability':
                return results.sort((a, b) => (b.scores?.adaptabilityScore || 0) - (a.scores?.adaptabilityScore || 0));
            
            default:
                return results;
        }
    }

    validateTemplate(template) {
        // Validações básicas
        if (!template.templateId) {
            throw new Error('Template deve ter um templateId');
        }
        
        if (!template.templateName) {
            throw new Error('Template deve ter um templateName');
        }
        
        if (!template.visualStructure) {
            throw new Error('Template deve ter uma visualStructure');
        }
        
        if (!template.designElements) {
            throw new Error('Template deve ter designElements');
        }
        
        // Validações de estrutura
        if (!template.visualStructure.dimensions) {
            throw new Error('Template deve especificar dimensions');
        }
        
        if (!template.designElements.colorScheme) {
            throw new Error('Template deve ter um colorScheme');
        }
        
        return template;
    }

    validateCustomizationData(data, template) {
        const validated = {};
        const variables = template.customizationVariables || {};
        
        // Validar cada variável de customização
        for (const [category, categoryVars] of Object.entries(variables)) {
            if (data[category]) {
                validated[category] = {};
                
                for (const [varName, varConfig] of Object.entries(categoryVars)) {
                    if (data[category][varName] !== undefined) {
                        // Validar tipo e limites
                        const value = data[category][varName];
                        
                        if (varConfig.type === 'text' && varConfig.maxLength) {
                            if (value.length > varConfig.maxLength) {
                                throw new Error(`${varName} excede o limite de ${varConfig.maxLength} caracteres`);
                            }
                        }
                        
                        validated[category][varName] = value;
                    }
                }
            }
        }
        
        return validated;
    }

    applyCustomizations(template, customizationData) {
        const customized = JSON.parse(JSON.stringify(template)); // Deep clone
        
        // Aplicar customizações de cores
        if (customizationData.brandColors) {
            for (const [colorVar, newColor] of Object.entries(customizationData.brandColors)) {
                if (customized.designElements.colorScheme[colorVar]) {
                    customized.designElements.colorScheme[colorVar] = newColor;
                }
            }
        }
        
        // Aplicar customizações de conteúdo
        if (customizationData.contentTopics) {
            customized.appliedContent = customizationData.contentTopics;
        }
        
        // Aplicar customizações de tipografia
        if (customizationData.typography) {
            for (const [fontVar, newFont] of Object.entries(customizationData.typography)) {
                // Aplicar nova fonte onde especificado
                if (customized.designElements.typography) {
                    Object.values(customized.designElements.typography).forEach(textStyle => {
                        if (textStyle.fontFamily && fontVar === 'mainFont') {
                            textStyle.fontFamily = newFont;
                        }
                    });
                }
            }
        }
        
        return customized;
    }

    async generateVisualContent(template, customizationData) {
        try {
            const { width, height } = template.visualStructure.dimensions;
            
            // Criar canvas
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // Aplicar fundo
            ctx.fillStyle = template.designElements.colorScheme.background || '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            
            // Aplicar elementos de texto baseados no template
            await this.renderTextElements(ctx, template, customizationData);
            
            // Aplicar elementos gráficos
            await this.renderGraphicElements(ctx, template);
            
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

    async renderTextElements(ctx, template, customizationData) {
        const typography = template.designElements.typography;
        const appliedContent = customizationData.contentTopics || {};
        
        // Renderizar cada elemento de texto
        for (const [elementName, textStyle] of Object.entries(typography)) {
            const content = appliedContent[elementName] || `[${elementName.toUpperCase()}]`;
            
            // Configurar estilo do texto
            ctx.font = `${textStyle.weight} ${textStyle.size} ${textStyle.fontFamily}`;
            ctx.fillStyle = textStyle.color;
            ctx.textAlign = textStyle.textAlign || 'center';
            
            // Calcular posição baseada no layout
            const position = this.calculateTextPosition(elementName, template.visualStructure);
            
            // Renderizar texto
            ctx.fillText(content, position.x, position.y);
        }
    }

    async renderGraphicElements(ctx, template) {
        const graphics = template.designElements.graphics || [];
        
        for (const graphic of graphics) {
            switch (graphic.type) {
                case 'decorative_line':
                    this.renderLine(ctx, graphic);
                    break;
                case 'quote_marks':
                    this.renderQuoteMarks(ctx, graphic);
                    break;
                // Adicionar mais tipos conforme necessário
            }
        }
    }

    renderLine(ctx, graphic) {
        ctx.strokeStyle = graphic.color;
        ctx.lineWidth = graphic.size.height;
        
        const x = graphic.position.x === 'center' ? 
            ctx.canvas.width / 2 - graphic.size.width / 2 : graphic.position.x;
        const y = graphic.position.y === 'center' ? 
            ctx.canvas.height / 2 : graphic.position.y;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + graphic.size.width, y);
        ctx.stroke();
    }

    renderQuoteMarks(ctx, graphic) {
        ctx.fillStyle = graphic.color;
        ctx.font = `${graphic.size.width}px serif`;
        
        const x = graphic.position.x === 'quote_start' ? 50 : graphic.position.x;
        const y = graphic.position.y === 'quote_top' ? 100 : graphic.position.y;
        
        ctx.fillText('"', x, y);
    }

    calculateTextPosition(elementName, visualStructure) {
        const { width, height } = visualStructure.dimensions;
        
        // Posições padrão baseadas no elemento
        const positions = {
            main_quote: { x: width / 2, y: height / 2 },
            author_name: { x: width / 2, y: height * 0.75 },
            author_title: { x: width / 2, y: height * 0.8 },
            headline: { x: width / 2, y: height * 0.2 },
            subheadline: { x: width / 2, y: height * 0.3 }
        };
        
        return positions[elementName] || { x: width / 2, y: height / 2 };
    }

    async saveGeneratedContent(generatedContent, variations, templateId, customizationData) {
        try {
            const contentId = this.generateContentId(templateId);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Salvar conteúdo principal
            const mainContentPath = path.join(
                this.generatedContentDir, 
                'images', 
                `${contentId}_main.png`
            );
            
            await fs.writeFile(mainContentPath, generatedContent.buffer);
            
            // Salvar variações
            const variationPaths = [];
            for (let i = 0; i < variations.length; i++) {
                const variationPath = path.join(
                    this.generatedContentDir,
                    'variations',
                    `${contentId}_var_${i + 1}.png`
                );
                
                await fs.writeFile(variationPath, variations[i].buffer);
                variationPaths.push(variationPath);
            }
            
            // Salvar metadados da geração
            const metadata = {
                contentId,
                templateId,
                generatedAt: new Date().toISOString(),
                customizationData,
                mainContentPath,
                variationPaths,
                dimensions: generatedContent.dimensions
            };
            
            const metadataPath = path.join(
                this.generatedContentDir,
                `${contentId}_metadata.json`
            );
            
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            
            return {
                contentId,
                mainContent: mainContentPath,
                variations: variationPaths,
                metadata: metadataPath
            };
            
        } catch (error) {
            this.logger.error('Erro ao salvar conteúdo gerado:', error);
            throw error;
        }
    }

    async updateUsageStats(templateId) {
        try {
            const stats = this.performanceStats.get(templateId) || {
                usageCount: 0,
                totalGenerations: 0,
                averageRating: 0,
                lastUsed: null
            };
            
            stats.usageCount += 1;
            stats.totalGenerations += 1;
            stats.lastUsed = new Date().toISOString();
            
            this.performanceStats.set(templateId, stats);
            
            // Adicionar ao histórico de uso
            const history = this.usageHistory.get(templateId) || [];
            history.push({
                timestamp: new Date().toISOString(),
                action: 'content_generation'
            });
            
            // Manter apenas os últimos 100 registros
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            this.usageHistory.set(templateId, history);
            
        } catch (error) {
            this.logger.error('Erro ao atualizar estatísticas:', error);
        }
    }

    generateContentId(templateId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6);
        return `content_${templateId}_${timestamp}_${random}`;
    }

    getContentTypeDirectory(contentType) {
        const typeMap = {
            'carousel': path.join(this.visualTemplatesDir, 'carousels'),
            'post': path.join(this.visualTemplatesDir, 'posts'),
            'story': path.join(this.visualTemplatesDir, 'stories'),
            'ad': path.join(this.visualTemplatesDir, 'ads'),
            'thumbnail': path.join(this.visualTemplatesDir, 'thumbnails')
        };
        
        return typeMap[contentType] || path.join(this.visualTemplatesDir, 'posts');
    }

    async loadAllTemplates() {
        try {
            const templates = await this.getAllTemplates();
            
            for (const template of templates) {
                this.templateCache.set(template.templateId, template);
            }
            
            this.logger.info(`${templates.length} templates carregados no cache`);
            
        } catch (error) {
            this.logger.error('Erro ao carregar templates:', error);
        }
    }

    async initializeStats() {
        // Inicializar estatísticas para templates existentes
        for (const [templateId, template] of this.templateCache) {
            if (!this.performanceStats.has(templateId)) {
                this.performanceStats.set(templateId, {
                    usageCount: 0,
                    totalGenerations: 0,
                    averageRating: 0,
                    lastUsed: null,
                    createdAt: template.createdAt || new Date().toISOString()
                });
            }
        }
    }

    setupAutoBackup() {
        // Configurar backup automático
        setInterval(async () => {
            try {
                await this.createFullBackup();
                this.logger.info('Backup automático concluído');
            } catch (error) {
                this.logger.error('Erro no backup automático:', error);
            }
        }, this.config.backupInterval);
    }

    async createFullBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, 'daily', `backup_${timestamp}`);
            
            await fs.mkdir(backupPath, { recursive: true });
            
            // Backup de todos os templates
            const templates = await this.getAllTemplates();
            
            for (const template of templates) {
                const backupFilePath = path.join(backupPath, `${template.templateId}.json`);
                await fs.writeFile(backupFilePath, JSON.stringify(template, null, 2));
            }
            
            // Backup das estatísticas
            const statsPath = path.join(backupPath, 'performance_stats.json');
            const statsData = Object.fromEntries(this.performanceStats);
            await fs.writeFile(statsPath, JSON.stringify(statsData, null, 2));
            
            this.logger.info(`Backup completo criado: ${backupPath}`);
            
        } catch (error) {
            this.logger.error('Erro ao criar backup:', error);
        }
    }
}

module.exports = TemplateManagerRevolutionary;

