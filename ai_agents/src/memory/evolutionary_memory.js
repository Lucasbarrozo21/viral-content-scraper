const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

/**
 * Sistema de Memória Evolutiva
 * Implementa aprendizado contínuo e persistente usando Supabase
 * Permite aos agentes evoluir e compartilhar conhecimento
 */
class EvolutionaryMemory {
    constructor(config = {}) {
        this.config = {
            supabaseUrl: 'https://kkzbiteakxsexxwiwtom.supabase.co',
            supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMyNjgsImV4cCI6MjA2OTIxOTI2OH0.Yd03_LE1cgEM3ik5WG7zCx9rG77zJc1Ez6-H8BgGkHk',
            supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzI2OCwiZXhwIjoyMDY5MjE5MjY4fQ.-EwB36xZXPIAstCnNM38RM-Lv8lxJG2vhCc6djyp2-E',
            memoryRetentionDays: 90,
            maxMemoryEntries: 10000,
            learningThreshold: 0.7,
            evolutionCycles: 100,
            ...config
        };

        // Inicializar clientes Supabase
        this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey);
        this.supabaseAdmin = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);

        // Configurar logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `${timestamp} [${level.toUpperCase()}] [MEMORY] ${message}${stack ? '\n' + stack : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: '../logs/memory.log',
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 3
                })
            ]
        });

        // Cache local para otimização
        this.localCache = new Map();
        this.patternCache = new Map();
        
        // Estatísticas de memória
        this.memoryStats = {
            totalMemories: 0,
            successfulLearnings: 0,
            evolutionCycles: 0,
            lastEvolution: null,
            cacheHits: 0,
            cacheSize: 0
        };

        // Estruturas de dados para diferentes tipos de memória
        this.memoryTypes = {
            PATTERN: 'pattern',           // Padrões identificados
            FEEDBACK: 'feedback',         // Feedback de performance
            CONTEXT: 'context',           // Contexto situacional
            EVOLUTION: 'evolution',       // Evolução de conhecimento
            CORRELATION: 'correlation',   // Correlações descobertas
            PREDICTION: 'prediction'      // Predições e resultados
        };
    }

    /**
     * Inicializa o sistema de memória
     */
    async initialize() {
        try {
            this.logger.info('Inicializando sistema de memória evolutiva...');
            
            // Verificar conexão com Supabase
            await this.testConnection();
            
            // Criar tabelas se não existirem
            await this.createTables();
            
            // Carregar estatísticas
            await this.loadMemoryStats();
            
            // Inicializar cache local
            await this.initializeLocalCache();
            
            this.logger.info('Sistema de memória evolutiva inicializado com sucesso');
            
        } catch (error) {
            this.logger.error('Erro ao inicializar memória evolutiva:', error);
            throw error;
        }
    }

    /**
     * Testa conexão com Supabase
     */
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('agent_memories')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe (ok)
                throw error;
            }
            
            this.logger.info('Conexão com Supabase estabelecida');
            
        } catch (error) {
            this.logger.error('Erro na conexão com Supabase:', error);
            throw new Error('Falha na conexão com Supabase');
        }
    }

    /**
     * Cria tabelas necessárias no Supabase
     */
    async createTables() {
        try {
            // Tabela principal de memórias dos agentes
            const memoriesTable = `
                CREATE TABLE IF NOT EXISTS agent_memories (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    agent_name VARCHAR(100) NOT NULL,
                    memory_type VARCHAR(50) NOT NULL,
                    content_id VARCHAR(255),
                    platform VARCHAR(50),
                    niche VARCHAR(100),
                    memory_data JSONB NOT NULL,
                    confidence_score FLOAT DEFAULT 0.5,
                    success_rate FLOAT DEFAULT 0.5,
                    usage_count INTEGER DEFAULT 0,
                    last_accessed TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    expires_at TIMESTAMPTZ,
                    tags TEXT[],
                    metadata JSONB DEFAULT '{}'::jsonb
                );
            `;

            // Tabela de padrões evolutivos
            const patternsTable = `
                CREATE TABLE IF NOT EXISTS evolutionary_patterns (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    pattern_type VARCHAR(100) NOT NULL,
                    pattern_data JSONB NOT NULL,
                    platforms TEXT[],
                    niches TEXT[],
                    confidence_score FLOAT DEFAULT 0.5,
                    success_rate FLOAT DEFAULT 0.5,
                    sample_size INTEGER DEFAULT 1,
                    last_validated TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    is_active BOOLEAN DEFAULT true,
                    evolution_generation INTEGER DEFAULT 1,
                    parent_pattern_id UUID REFERENCES evolutionary_patterns(id)
                );
            `;

            // Tabela de feedback e aprendizado
            const feedbackTable = `
                CREATE TABLE IF NOT EXISTS learning_feedback (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    memory_id UUID REFERENCES agent_memories(id),
                    pattern_id UUID REFERENCES evolutionary_patterns(id),
                    feedback_type VARCHAR(50) NOT NULL,
                    actual_result JSONB,
                    predicted_result JSONB,
                    accuracy_score FLOAT,
                    improvement_suggestions JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    processed BOOLEAN DEFAULT false
                );
            `;

            // Tabela de contexto situacional
            const contextTable = `
                CREATE TABLE IF NOT EXISTS situational_context (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    context_type VARCHAR(100) NOT NULL,
                    context_data JSONB NOT NULL,
                    temporal_factors JSONB,
                    environmental_factors JSONB,
                    audience_factors JSONB,
                    platform_factors JSONB,
                    relevance_score FLOAT DEFAULT 0.5,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    is_active BOOLEAN DEFAULT true
                );
            `;

            // Executar criação das tabelas usando o cliente admin
            const tables = [memoriesTable, patternsTable, feedbackTable, contextTable];
            
            for (const tableSQL of tables) {
                const { error } = await this.supabaseAdmin.rpc('exec_sql', { sql: tableSQL });
                if (error) {
                    this.logger.warn('Aviso na criação de tabela (pode já existir):', error.message);
                }
            }

            // Criar índices para otimização
            await this.createIndexes();
            
            this.logger.info('Tabelas de memória criadas/verificadas com sucesso');
            
        } catch (error) {
            this.logger.error('Erro ao criar tabelas:', error);
            // Não falhar se as tabelas já existirem
        }
    }

    /**
     * Cria índices para otimização de consultas
     */
    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_name ON agent_memories(agent_name);',
            'CREATE INDEX IF NOT EXISTS idx_agent_memories_platform ON agent_memories(platform);',
            'CREATE INDEX IF NOT EXISTS idx_agent_memories_niche ON agent_memories(niche);',
            'CREATE INDEX IF NOT EXISTS idx_agent_memories_created_at ON agent_memories(created_at);',
            'CREATE INDEX IF NOT EXISTS idx_evolutionary_patterns_type ON evolutionary_patterns(pattern_type);',
            'CREATE INDEX IF NOT EXISTS idx_evolutionary_patterns_active ON evolutionary_patterns(is_active);',
            'CREATE INDEX IF NOT EXISTS idx_learning_feedback_processed ON learning_feedback(processed);'
        ];

        for (const indexSQL of indexes) {
            try {
                const { error } = await this.supabaseAdmin.rpc('exec_sql', { sql: indexSQL });
                if (error) {
                    this.logger.warn('Aviso na criação de índice:', error.message);
                }
            } catch (error) {
                this.logger.warn('Erro ao criar índice:', error.message);
            }
        }
    }

    /**
     * Carrega estatísticas de memória
     */
    async loadMemoryStats() {
        try {
            const { data: memoriesCount } = await this.supabase
                .from('agent_memories')
                .select('id', { count: 'exact' });

            const { data: patternsCount } = await this.supabase
                .from('evolutionary_patterns')
                .select('id', { count: 'exact' });

            this.memoryStats.totalMemories = memoriesCount?.length || 0;
            this.memoryStats.totalPatterns = patternsCount?.length || 0;
            
            this.logger.info(`Estatísticas carregadas: ${this.memoryStats.totalMemories} memórias, ${this.memoryStats.totalPatterns} padrões`);
            
        } catch (error) {
            this.logger.warn('Erro ao carregar estatísticas:', error);
        }
    }

    /**
     * Inicializa cache local com dados frequentemente acessados
     */
    async initializeLocalCache() {
        try {
            // Carregar padrões mais utilizados
            const { data: patterns } = await this.supabase
                .from('evolutionary_patterns')
                .select('*')
                .eq('is_active', true)
                .order('success_rate', { ascending: false })
                .limit(100);

            if (patterns) {
                patterns.forEach(pattern => {
                    const cacheKey = `pattern_${pattern.pattern_type}_${pattern.id}`;
                    this.patternCache.set(cacheKey, pattern);
                });
            }

            // Carregar memórias recentes de alto sucesso
            const { data: memories } = await this.supabase
                .from('agent_memories')
                .select('*')
                .gte('success_rate', 0.7)
                .order('created_at', { ascending: false })
                .limit(50);

            if (memories) {
                memories.forEach(memory => {
                    const cacheKey = `memory_${memory.agent_name}_${memory.id}`;
                    this.localCache.set(cacheKey, memory);
                });
            }

            this.memoryStats.cacheSize = this.localCache.size + this.patternCache.size;
            this.logger.info(`Cache local inicializado: ${this.memoryStats.cacheSize} entradas`);
            
        } catch (error) {
            this.logger.warn('Erro ao inicializar cache local:', error);
        }
    }

    /**
     * Armazena nova memória de aprendizado
     */
    async storeMemory(agentName, memoryType, data, options = {}) {
        try {
            const memory = {
                agent_name: agentName,
                memory_type: memoryType,
                content_id: options.contentId || null,
                platform: options.platform || null,
                niche: options.niche || 'general',
                memory_data: data,
                confidence_score: options.confidence || 0.5,
                success_rate: options.successRate || 0.5,
                tags: options.tags || [],
                metadata: options.metadata || {},
                expires_at: options.expiresAt || this.calculateExpirationDate()
            };

            const { data: insertedMemory, error } = await this.supabase
                .from('agent_memories')
                .insert(memory)
                .select()
                .single();

            if (error) throw error;

            // Adicionar ao cache local
            const cacheKey = `memory_${agentName}_${insertedMemory.id}`;
            this.localCache.set(cacheKey, insertedMemory);

            this.memoryStats.totalMemories++;
            this.logger.info(`Memória armazenada: ${agentName} - ${memoryType}`);

            return insertedMemory;

        } catch (error) {
            this.logger.error('Erro ao armazenar memória:', error);
            throw error;
        }
    }

    /**
     * Recupera memórias relevantes para um contexto
     */
    async retrieveMemories(agentName, context = {}) {
        try {
            const {
                platform,
                niche = 'general',
                contentType,
                memoryTypes = [],
                limit = 10,
                minConfidence = 0.3
            } = context;

            // Verificar cache local primeiro
            const cacheKey = `memories_${agentName}_${JSON.stringify(context)}`;
            if (this.localCache.has(cacheKey)) {
                this.memoryStats.cacheHits++;
                return this.localCache.get(cacheKey);
            }

            // Construir query
            let query = this.supabase
                .from('agent_memories')
                .select('*')
                .eq('agent_name', agentName)
                .gte('confidence_score', minConfidence)
                .order('success_rate', { ascending: false });

            // Aplicar filtros
            if (platform) {
                query = query.eq('platform', platform);
            }

            if (niche !== 'general') {
                query = query.eq('niche', niche);
            }

            if (memoryTypes.length > 0) {
                query = query.in('memory_type', memoryTypes);
            }

            query = query.limit(limit);

            const { data: memories, error } = await query;

            if (error) throw error;

            // Adicionar ao cache
            this.localCache.set(cacheKey, memories || []);

            // Atualizar contador de acesso
            if (memories && memories.length > 0) {
                await this.updateAccessCount(memories.map(m => m.id));
            }

            this.logger.info(`Recuperadas ${memories?.length || 0} memórias para ${agentName}`);
            return memories || [];

        } catch (error) {
            this.logger.error('Erro ao recuperar memórias:', error);
            return [];
        }
    }

    /**
     * Armazena padrão evolutivo
     */
    async storePattern(patternType, patternData, options = {}) {
        try {
            const pattern = {
                pattern_type: patternType,
                pattern_data: patternData,
                platforms: options.platforms || [],
                niches: options.niches || ['general'],
                confidence_score: options.confidence || 0.5,
                success_rate: options.successRate || 0.5,
                sample_size: options.sampleSize || 1,
                evolution_generation: options.generation || 1,
                parent_pattern_id: options.parentId || null
            };

            const { data: insertedPattern, error } = await this.supabase
                .from('evolutionary_patterns')
                .insert(pattern)
                .select()
                .single();

            if (error) throw error;

            // Adicionar ao cache de padrões
            const cacheKey = `pattern_${patternType}_${insertedPattern.id}`;
            this.patternCache.set(cacheKey, insertedPattern);

            this.logger.info(`Padrão evolutivo armazenado: ${patternType}`);
            return insertedPattern;

        } catch (error) {
            this.logger.error('Erro ao armazenar padrão:', error);
            throw error;
        }
    }

    /**
     * Recupera padrões evolutivos relevantes
     */
    async retrievePatterns(context = {}) {
        try {
            const {
                patternTypes = [],
                platforms = [],
                niches = [],
                minConfidence = 0.5,
                limit = 20
            } = context;

            let query = this.supabase
                .from('evolutionary_patterns')
                .select('*')
                .eq('is_active', true)
                .gte('confidence_score', minConfidence)
                .order('success_rate', { ascending: false });

            if (patternTypes.length > 0) {
                query = query.in('pattern_type', patternTypes);
            }

            if (platforms.length > 0) {
                query = query.overlaps('platforms', platforms);
            }

            if (niches.length > 0) {
                query = query.overlaps('niches', niches);
            }

            query = query.limit(limit);

            const { data: patterns, error } = await query;

            if (error) throw error;

            this.logger.info(`Recuperados ${patterns?.length || 0} padrões evolutivos`);
            return patterns || [];

        } catch (error) {
            this.logger.error('Erro ao recuperar padrões:', error);
            return [];
        }
    }

    /**
     * Registra feedback de aprendizado
     */
    async recordFeedback(memoryId, actualResult, predictedResult, options = {}) {
        try {
            const accuracy = this.calculateAccuracy(actualResult, predictedResult);
            
            const feedback = {
                memory_id: memoryId,
                pattern_id: options.patternId || null,
                feedback_type: options.feedbackType || 'performance',
                actual_result: actualResult,
                predicted_result: predictedResult,
                accuracy_score: accuracy,
                improvement_suggestions: options.suggestions || {}
            };

            const { data: insertedFeedback, error } = await this.supabase
                .from('learning_feedback')
                .insert(feedback)
                .select()
                .single();

            if (error) throw error;

            // Atualizar taxa de sucesso da memória
            await this.updateMemorySuccessRate(memoryId, accuracy);

            this.memoryStats.successfulLearnings++;
            this.logger.info(`Feedback registrado para memória ${memoryId} - Precisão: ${accuracy}`);

            return insertedFeedback;

        } catch (error) {
            this.logger.error('Erro ao registrar feedback:', error);
            throw error;
        }
    }

    /**
     * Executa ciclo de evolução dos padrões
     */
    async evolvePatterns() {
        try {
            this.logger.info('Iniciando ciclo de evolução de padrões...');

            // Buscar feedback não processado
            const { data: feedbacks, error } = await this.supabase
                .from('learning_feedback')
                .select(`
                    *,
                    agent_memories(*),
                    evolutionary_patterns(*)
                `)
                .eq('processed', false)
                .limit(100);

            if (error) throw error;

            if (!feedbacks || feedbacks.length === 0) {
                this.logger.info('Nenhum feedback para processar');
                return;
            }

            // Agrupar feedback por padrão
            const patternFeedbacks = this.groupFeedbackByPattern(feedbacks);

            // Evoluir cada padrão
            for (const [patternId, patternFeedbacks] of Object.entries(patternFeedbacks)) {
                await this.evolvePattern(patternId, patternFeedbacks);
            }

            // Marcar feedbacks como processados
            const feedbackIds = feedbacks.map(f => f.id);
            await this.supabase
                .from('learning_feedback')
                .update({ processed: true })
                .in('id', feedbackIds);

            this.memoryStats.evolutionCycles++;
            this.memoryStats.lastEvolution = new Date();

            this.logger.info(`Ciclo de evolução concluído: ${feedbacks.length} feedbacks processados`);

        } catch (error) {
            this.logger.error('Erro no ciclo de evolução:', error);
        }
    }

    /**
     * Evolui um padrão específico baseado no feedback
     */
    async evolvePattern(patternId, feedbacks) {
        try {
            if (!patternId || feedbacks.length === 0) return;

            // Calcular métricas de evolução
            const avgAccuracy = feedbacks.reduce((sum, f) => sum + (f.accuracy_score || 0), 0) / feedbacks.length;
            const sampleSize = feedbacks.length;

            // Buscar padrão atual
            const { data: currentPattern } = await this.supabase
                .from('evolutionary_patterns')
                .select('*')
                .eq('id', patternId)
                .single();

            if (!currentPattern) return;

            // Decidir se criar nova geração
            if (avgAccuracy > currentPattern.success_rate + 0.1 && sampleSize >= 5) {
                // Criar nova geração do padrão
                const evolvedPattern = await this.createEvolvedPattern(currentPattern, feedbacks, avgAccuracy);
                this.logger.info(`Padrão evoluído: ${currentPattern.pattern_type} - Gen ${evolvedPattern.evolution_generation}`);
            } else {
                // Atualizar padrão existente
                await this.supabase
                    .from('evolutionary_patterns')
                    .update({
                        success_rate: (currentPattern.success_rate + avgAccuracy) / 2,
                        sample_size: currentPattern.sample_size + sampleSize,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', patternId);
            }

        } catch (error) {
            this.logger.error('Erro ao evoluir padrão:', error);
        }
    }

    /**
     * Cria nova geração de um padrão evolutivo
     */
    async createEvolvedPattern(parentPattern, feedbacks, avgAccuracy) {
        try {
            // Analisar feedback para identificar melhorias
            const improvements = this.analyzeFeedbackForImprovements(feedbacks);

            // Criar dados do padrão evoluído
            const evolvedData = {
                ...parentPattern.pattern_data,
                improvements: improvements,
                evolution_metadata: {
                    parent_accuracy: parentPattern.success_rate,
                    new_accuracy: avgAccuracy,
                    feedback_count: feedbacks.length,
                    evolved_at: new Date().toISOString()
                }
            };

            const evolvedPattern = {
                pattern_type: parentPattern.pattern_type,
                pattern_data: evolvedData,
                platforms: parentPattern.platforms,
                niches: parentPattern.niches,
                confidence_score: Math.min(parentPattern.confidence_score + 0.1, 1.0),
                success_rate: avgAccuracy,
                sample_size: feedbacks.length,
                evolution_generation: parentPattern.evolution_generation + 1,
                parent_pattern_id: parentPattern.id
            };

            const { data: newPattern, error } = await this.supabase
                .from('evolutionary_patterns')
                .insert(evolvedPattern)
                .select()
                .single();

            if (error) throw error;

            // Desativar padrão pai se a nova geração for significativamente melhor
            if (avgAccuracy > parentPattern.success_rate + 0.2) {
                await this.supabase
                    .from('evolutionary_patterns')
                    .update({ is_active: false })
                    .eq('id', parentPattern.id);
            }

            return newPattern;

        } catch (error) {
            this.logger.error('Erro ao criar padrão evoluído:', error);
            throw error;
        }
    }

    /**
     * Analisa feedback para identificar melhorias
     */
    analyzeFeedbackForImprovements(feedbacks) {
        const improvements = {
            common_success_factors: [],
            common_failure_factors: [],
            optimization_suggestions: [],
            confidence_adjustments: {}
        };

        try {
            // Separar feedback por performance
            const successfulFeedbacks = feedbacks.filter(f => (f.accuracy_score || 0) > 0.7);
            const failedFeedbacks = feedbacks.filter(f => (f.accuracy_score || 0) < 0.3);

            // Analisar fatores de sucesso
            successfulFeedbacks.forEach(feedback => {
                if (feedback.improvement_suggestions) {
                    const suggestions = feedback.improvement_suggestions;
                    if (suggestions.success_factors) {
                        improvements.common_success_factors.push(...suggestions.success_factors);
                    }
                }
            });

            // Analisar fatores de falha
            failedFeedbacks.forEach(feedback => {
                if (feedback.improvement_suggestions) {
                    const suggestions = feedback.improvement_suggestions;
                    if (suggestions.failure_factors) {
                        improvements.common_failure_factors.push(...suggestions.failure_factors);
                    }
                }
            });

            // Remover duplicatas e contar frequência
            improvements.common_success_factors = this.countAndSortFactors(improvements.common_success_factors);
            improvements.common_failure_factors = this.countAndSortFactors(improvements.common_failure_factors);

        } catch (error) {
            this.logger.warn('Erro ao analisar melhorias:', error);
        }

        return improvements;
    }

    /**
     * Conta e ordena fatores por frequência
     */
    countAndSortFactors(factors) {
        const counts = {};
        factors.forEach(factor => {
            counts[factor] = (counts[factor] || 0) + 1;
        });

        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([factor, count]) => ({ factor, frequency: count }));
    }

    /**
     * Calcula precisão entre resultado real e previsto
     */
    calculateAccuracy(actualResult, predictedResult) {
        try {
            if (!actualResult || !predictedResult) return 0.5;

            // Implementação simplificada - pode ser expandida
            if (typeof actualResult === 'number' && typeof predictedResult === 'number') {
                const error = Math.abs(actualResult - predictedResult) / Math.max(actualResult, predictedResult, 1);
                return Math.max(0, 1 - error);
            }

            // Para objetos, comparar propriedades chave
            if (typeof actualResult === 'object' && typeof predictedResult === 'object') {
                const actualKeys = Object.keys(actualResult);
                const predictedKeys = Object.keys(predictedResult);
                
                const commonKeys = actualKeys.filter(key => predictedKeys.includes(key));
                if (commonKeys.length === 0) return 0.5;

                let totalAccuracy = 0;
                commonKeys.forEach(key => {
                    const actual = actualResult[key];
                    const predicted = predictedResult[key];
                    
                    if (typeof actual === 'number' && typeof predicted === 'number') {
                        const error = Math.abs(actual - predicted) / Math.max(actual, predicted, 1);
                        totalAccuracy += Math.max(0, 1 - error);
                    } else if (actual === predicted) {
                        totalAccuracy += 1;
                    }
                });

                return totalAccuracy / commonKeys.length;
            }

            return actualResult === predictedResult ? 1 : 0;

        } catch (error) {
            this.logger.warn('Erro ao calcular precisão:', error);
            return 0.5;
        }
    }

    /**
     * Atualiza taxa de sucesso de uma memória
     */
    async updateMemorySuccessRate(memoryId, newAccuracy) {
        try {
            const { data: memory } = await this.supabase
                .from('agent_memories')
                .select('success_rate, usage_count')
                .eq('id', memoryId)
                .single();

            if (!memory) return;

            // Calcular nova taxa de sucesso (média ponderada)
            const currentRate = memory.success_rate || 0.5;
            const usageCount = memory.usage_count || 1;
            const newRate = (currentRate * usageCount + newAccuracy) / (usageCount + 1);

            await this.supabase
                .from('agent_memories')
                .update({
                    success_rate: newRate,
                    usage_count: usageCount + 1,
                    last_accessed: new Date().toISOString()
                })
                .eq('id', memoryId);

        } catch (error) {
            this.logger.warn('Erro ao atualizar taxa de sucesso:', error);
        }
    }

    /**
     * Atualiza contador de acesso das memórias
     */
    async updateAccessCount(memoryIds) {
        try {
            if (!Array.isArray(memoryIds) || memoryIds.length === 0) return;

            await this.supabase
                .from('agent_memories')
                .update({
                    usage_count: this.supabase.raw('usage_count + 1'),
                    last_accessed: new Date().toISOString()
                })
                .in('id', memoryIds);

        } catch (error) {
            this.logger.warn('Erro ao atualizar contador de acesso:', error);
        }
    }

    /**
     * Agrupa feedback por padrão
     */
    groupFeedbackByPattern(feedbacks) {
        const grouped = {};
        
        feedbacks.forEach(feedback => {
            const patternId = feedback.pattern_id || 'no_pattern';
            if (!grouped[patternId]) {
                grouped[patternId] = [];
            }
            grouped[patternId].push(feedback);
        });

        return grouped;
    }

    /**
     * Calcula data de expiração baseada na configuração
     */
    calculateExpirationDate() {
        const now = new Date();
        const expirationDate = new Date(now.getTime() + (this.config.memoryRetentionDays * 24 * 60 * 60 * 1000));
        return expirationDate.toISOString();
    }

    /**
     * Limpa memórias expiradas
     */
    async cleanupExpiredMemories() {
        try {
            const now = new Date().toISOString();
            
            const { data: expiredMemories, error } = await this.supabase
                .from('agent_memories')
                .delete()
                .lt('expires_at', now)
                .select('id');

            if (error) throw error;

            const deletedCount = expiredMemories?.length || 0;
            if (deletedCount > 0) {
                this.logger.info(`Limpeza concluída: ${deletedCount} memórias expiradas removidas`);
            }

            return deletedCount;

        } catch (error) {
            this.logger.error('Erro na limpeza de memórias:', error);
            return 0;
        }
    }

    /**
     * Obtém estatísticas da memória
     */
    async getMemoryStats() {
        try {
            // Atualizar estatísticas em tempo real
            const { data: memoriesCount } = await this.supabase
                .from('agent_memories')
                .select('id', { count: 'exact' });

            const { data: patternsCount } = await this.supabase
                .from('evolutionary_patterns')
                .select('id', { count: 'exact' });

            const { data: feedbackCount } = await this.supabase
                .from('learning_feedback')
                .select('id', { count: 'exact' });

            return {
                ...this.memoryStats,
                totalMemories: memoriesCount?.length || 0,
                totalPatterns: patternsCount?.length || 0,
                totalFeedbacks: feedbackCount?.length || 0,
                cacheSize: this.localCache.size + this.patternCache.size,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Erro ao obter estatísticas:', error);
            return this.memoryStats;
        }
    }

    /**
     * Finaliza sistema de memória
     */
    async shutdown() {
        try {
            this.logger.info('Finalizando sistema de memória evolutiva...');
            
            // Executar limpeza final
            await this.cleanupExpiredMemories();
            
            // Limpar caches
            this.localCache.clear();
            this.patternCache.clear();
            
            // Obter estatísticas finais
            const finalStats = await this.getMemoryStats();
            this.logger.info('Estatísticas finais da memória:', finalStats);
            
            this.logger.info('Sistema de memória evolutiva finalizado');
            
        } catch (error) {
            this.logger.error('Erro ao finalizar sistema de memória:', error);
        }
    }
}

module.exports = EvolutionaryMemory;

