-- =====================================================
-- VIRAL CONTENT SCRAPER - DATABASE SCHEMA
-- Versão: 1.0.0
-- Data: 27 de Janeiro de 2025
-- Autor: Manus AI
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar partições mensais automaticamente
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
                   FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
    
    -- Criar índices específicos da partição
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (scraped_at DESC)',
                   'idx_' || partition_name || '_scraped', partition_name);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA PRINCIPAL: SCRAPED_CONTENT
-- =====================================================

CREATE TABLE scraped_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL,
    platform_content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    author_username VARCHAR(255),
    author_display_name VARCHAR(255),
    author_id VARCHAR(255),
    author_followers_count BIGINT,
    author_verified BOOLEAN DEFAULT FALSE,
    hashtags TEXT[],
    mentions TEXT[],
    language VARCHAR(10),
    content_text TEXT,
    media_urls TEXT[],
    media_types TEXT[],
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT unique_platform_content UNIQUE (platform, platform_content_id),
    CONSTRAINT valid_platform CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'kwai', 'pinterest')),
    CONSTRAINT valid_content_type CHECK (content_type IN ('post', 'reel', 'story', 'video', 'carousel', 'ad', 'live')),
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    CONSTRAINT valid_language CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    CONSTRAINT followers_non_negative CHECK (author_followers_count >= 0)
) PARTITION BY RANGE (scraped_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_scraped_content_updated_at 
    BEFORE UPDATE ON scraped_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA DE MÉTRICAS: CONTENT_METRICS
-- =====================================================

CREATE TABLE content_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES scraped_content(id) ON DELETE CASCADE,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    likes_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    saves_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    impressions_count BIGINT DEFAULT 0,
    reach_count BIGINT DEFAULT 0,
    engagement_rate DECIMAL(5,4),
    click_through_rate DECIMAL(5,4),
    conversion_rate DECIMAL(5,4),
    platform_specific_metrics JSONB DEFAULT '{}'::jsonb,
    calculated_metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT metrics_non_negative CHECK (
        likes_count >= 0 AND comments_count >= 0 AND shares_count >= 0 AND
        saves_count >= 0 AND views_count >= 0 AND impressions_count >= 0 AND
        reach_count >= 0
    ),
    CONSTRAINT valid_rates CHECK (
        (engagement_rate IS NULL OR (engagement_rate >= 0 AND engagement_rate <= 1)) AND
        (click_through_rate IS NULL OR (click_through_rate >= 0 AND click_through_rate <= 1)) AND
        (conversion_rate IS NULL OR (conversion_rate >= 0 AND conversion_rate <= 1))
    )
) PARTITION BY RANGE (collected_at);

-- =====================================================
-- TABELA DE ANÁLISES: CONTENT_ANALYSES
-- =====================================================

CREATE TABLE content_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES scraped_content(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    analyzer_name VARCHAR(100) NOT NULL,
    analyzer_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_score DECIMAL(3,2),
    overall_score DECIMAL(3,2),
    
    -- Análise de Sentimento
    sentiment_score DECIMAL(4,3),
    sentiment_polarity VARCHAR(20),
    dominant_emotion VARCHAR(30),
    emotional_intensity DECIMAL(3,2),
    
    -- Análise Visual
    visual_quality_score DECIMAL(3,2),
    color_harmony_score DECIMAL(3,2),
    composition_score DECIMAL(3,2),
    face_count INTEGER DEFAULT 0,
    
    -- Análise de Métricas
    viral_potential_score DECIMAL(3,2),
    engagement_prediction DECIMAL(3,2),
    trend_direction VARCHAR(20),
    trend_strength DECIMAL(3,2),
    
    -- Dados detalhados em JSONB
    sentiment_analysis JSONB,
    visual_analysis JSONB,
    metrics_analysis JSONB,
    predictions JSONB,
    recommendations JSONB,
    
    -- Metadados
    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    error_details JSONB,
    
    -- Constraints
    CONSTRAINT valid_analysis_type CHECK (analysis_type IN ('sentiment', 'visual', 'metrics', 'comprehensive')),
    CONSTRAINT valid_scores CHECK (
        (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)) AND
        (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 1)) AND
        (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)) AND
        (emotional_intensity IS NULL OR (emotional_intensity >= 0 AND emotional_intensity <= 1)) AND
        (visual_quality_score IS NULL OR (visual_quality_score >= 0 AND visual_quality_score <= 1)) AND
        (viral_potential_score IS NULL OR (viral_potential_score >= 0 AND viral_potential_score <= 1))
    ),
    CONSTRAINT valid_polarity CHECK (sentiment_polarity IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
    CONSTRAINT valid_trend CHECK (trend_direction IN ('rising', 'stable', 'declining', 'unknown')),
    CONSTRAINT face_count_non_negative CHECK (face_count >= 0)
) PARTITION BY RANGE (analyzed_at);

-- =====================================================
-- SISTEMA DE MEMÓRIA EVOLUTIVA
-- =====================================================

-- Tabela de memórias dos agentes
CREATE TABLE agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    memory_type VARCHAR(50) NOT NULL,
    content_id UUID REFERENCES scraped_content(id) ON DELETE SET NULL,
    platform VARCHAR(50),
    niche VARCHAR(100) DEFAULT 'general',
    memory_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    success_rate DECIMAL(3,2) DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_memory_type CHECK (memory_type IN ('pattern', 'feedback', 'context', 'evolution', 'correlation', 'prediction')),
    CONSTRAINT valid_scores CHECK (
        confidence_score >= 0 AND confidence_score <= 1 AND
        success_rate >= 0 AND success_rate <= 1
    ),
    CONSTRAINT usage_count_non_negative CHECK (usage_count >= 0)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agent_memories_updated_at 
    BEFORE UPDATE ON agent_memories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de padrões evolutivos
CREATE TABLE evolutionary_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(100) NOT NULL,
    pattern_data JSONB NOT NULL,
    platforms TEXT[],
    niches TEXT[],
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    success_rate DECIMAL(3,2) DEFAULT 0.5,
    sample_size INTEGER DEFAULT 1,
    last_validated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    evolution_generation INTEGER DEFAULT 1,
    parent_pattern_id UUID REFERENCES evolutionary_patterns(id),
    
    -- Constraints
    CONSTRAINT valid_pattern_scores CHECK (
        confidence_score >= 0 AND confidence_score <= 1 AND
        success_rate >= 0 AND success_rate <= 1
    ),
    CONSTRAINT sample_size_positive CHECK (sample_size > 0),
    CONSTRAINT generation_positive CHECK (evolution_generation > 0)
);

-- Tabela de feedback de aprendizado
CREATE TABLE learning_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID REFERENCES agent_memories(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES evolutionary_patterns(id) ON DELETE SET NULL,
    content_id UUID REFERENCES scraped_content(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL DEFAULT 'performance',
    actual_result JSONB,
    predicted_result JSONB,
    accuracy_score DECIMAL(3,2),
    improvement_suggestions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('performance', 'accuracy', 'user_feedback', 'system_validation')),
    CONSTRAINT valid_accuracy CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 1))
);

-- =====================================================
-- TABELAS DE SUPORTE
-- =====================================================

-- Configurações do sistema
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_config_type CHECK (config_type IN ('scraper', 'analyzer', 'api', 'system', 'memory'))
);

-- Logs do sistema
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL,
    component VARCHAR(100) NOT NULL,
    operation VARCHAR(100),
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID,
    content_id UUID REFERENCES scraped_content(id) ON DELETE SET NULL,
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_log_level CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'))
) PARTITION BY RANGE (created_at);

-- Estatísticas agregadas
CREATE TABLE analytics_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50),
    niche VARCHAR(100),
    time_period VARCHAR(20) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metrics JSONB NOT NULL,
    sample_size INTEGER NOT NULL,
    confidence_level DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_aggregate_type CHECK (aggregate_type IN ('engagement', 'viral_potential', 'sentiment', 'quality')),
    CONSTRAINT valid_time_period CHECK (time_period IN ('hour', 'day', 'week', 'month', 'quarter', 'year')),
    CONSTRAINT sample_size_positive CHECK (sample_size > 0),
    CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- =====================================================
-- TABELAS PARA COMPLIANCE (LGPD/GDPR)
-- =====================================================

-- Política de retenção de dados
CREATE TABLE data_retention_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES scraped_content(id) ON DELETE CASCADE,
    data_subject_id VARCHAR(255),
    collection_purpose VARCHAR(100) NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    retention_period INTERVAL NOT NULL,
    deletion_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at + retention_period) STORED,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_legal_basis CHECK (legal_basis IN ('consent', 'legitimate_interest', 'public_task', 'vital_interests'))
);

-- Log de auditoria
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_name VARCHAR(100) DEFAULT current_user,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    application_name VARCHAR(100)
);

-- =====================================================
-- CONTROLE DE MIGRATIONS
-- =====================================================

CREATE TABLE schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT current_user,
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    rollback_sql TEXT
);

-- Registrar migration inicial
INSERT INTO schema_migrations (version, description, checksum) 
VALUES ('1.0.0', 'Initial schema creation', 'abc123def456');

-- =====================================================
-- ÍNDICES PRINCIPAIS
-- =====================================================

-- Índices para scraped_content
CREATE INDEX idx_scraped_content_platform_date ON scraped_content (platform, scraped_at DESC);
CREATE INDEX idx_scraped_content_author ON scraped_content (author_username, platform);
CREATE INDEX idx_scraped_content_hashtags ON scraped_content USING GIN (hashtags);
CREATE INDEX idx_scraped_content_language ON scraped_content (language, platform);
CREATE INDEX idx_scraped_content_active ON scraped_content (is_active, scraped_at DESC) WHERE is_active = true;
CREATE INDEX idx_scraped_content_metadata ON scraped_content USING GIN (metadata);

-- Índices para content_metrics
CREATE INDEX idx_content_metrics_content_date ON content_metrics (content_id, collected_at DESC);
CREATE INDEX idx_content_metrics_engagement ON content_metrics (engagement_rate DESC) WHERE engagement_rate IS NOT NULL;
CREATE INDEX idx_content_metrics_viral ON content_metrics (views_count DESC, likes_count DESC);
CREATE INDEX idx_content_metrics_platform_specific ON content_metrics USING GIN (platform_specific_metrics);
CREATE INDEX idx_content_metrics_calculated ON content_metrics USING GIN (calculated_metrics);

-- Índices para content_analyses
CREATE INDEX idx_content_analyses_content_type ON content_analyses (content_id, analysis_type, analyzed_at DESC);
CREATE INDEX idx_content_analyses_scores ON content_analyses (overall_score DESC, confidence_score DESC);
CREATE INDEX idx_content_analyses_sentiment ON content_analyses (sentiment_polarity, emotional_intensity DESC);
CREATE INDEX idx_content_analyses_viral_potential ON content_analyses (viral_potential_score DESC) WHERE viral_potential_score IS NOT NULL;
CREATE INDEX idx_content_analyses_sentiment_data ON content_analyses USING GIN (sentiment_analysis);
CREATE INDEX idx_content_analyses_visual_data ON content_analyses USING GIN (visual_analysis);
CREATE INDEX idx_content_analyses_metrics_data ON content_analyses USING GIN (metrics_analysis);

-- Índices para agent_memories
CREATE INDEX idx_agent_memories_agent_type ON agent_memories (agent_name, memory_type);
CREATE INDEX idx_agent_memories_platform_niche ON agent_memories (platform, niche);
CREATE INDEX idx_agent_memories_confidence ON agent_memories (confidence_score DESC, success_rate DESC);
CREATE INDEX idx_agent_memories_usage ON agent_memories (usage_count DESC, last_accessed DESC);
CREATE INDEX idx_agent_memories_data ON agent_memories USING GIN (memory_data);
CREATE INDEX idx_agent_memories_tags ON agent_memories USING GIN (tags);

-- Índices para evolutionary_patterns
CREATE INDEX idx_evolutionary_patterns_type ON evolutionary_patterns (pattern_type, is_active);
CREATE INDEX idx_evolutionary_patterns_success ON evolutionary_patterns (success_rate DESC, confidence_score DESC);
CREATE INDEX idx_evolutionary_patterns_generation ON evolutionary_patterns (evolution_generation DESC, updated_at DESC);
CREATE INDEX idx_evolutionary_patterns_platforms ON evolutionary_patterns USING GIN (platforms);
CREATE INDEX idx_evolutionary_patterns_niches ON evolutionary_patterns USING GIN (niches);
CREATE INDEX idx_evolutionary_patterns_data ON evolutionary_patterns USING GIN (pattern_data);

-- Índices para learning_feedback
CREATE INDEX idx_learning_feedback_accuracy ON learning_feedback (accuracy_score DESC) WHERE accuracy_score IS NOT NULL;
CREATE INDEX idx_learning_feedback_unprocessed ON learning_feedback (created_at DESC) WHERE processed = false;
CREATE INDEX idx_learning_feedback_type ON learning_feedback (feedback_type, created_at DESC);

-- Índices para system_logs
CREATE INDEX idx_system_logs_level_component ON system_logs (log_level, component, created_at DESC);
CREATE INDEX idx_system_logs_content ON system_logs (content_id, created_at DESC) WHERE content_id IS NOT NULL;
CREATE INDEX idx_system_logs_details ON system_logs USING GIN (details);

-- =====================================================
-- ÍNDICES PARCIAIS PARA OTIMIZAÇÃO
-- =====================================================

-- Conteúdo ativo e recente
CREATE INDEX idx_recent_active_content ON scraped_content (scraped_at DESC, platform) 
WHERE is_active = true AND scraped_at > NOW() - INTERVAL '30 days';

-- Análises bem-sucedidas
CREATE INDEX idx_successful_analyses ON content_analyses (analyzed_at DESC, analysis_type) 
WHERE success = true AND confidence_score > 0.7;

-- Conteúdo viral
CREATE INDEX idx_viral_content ON content_metrics (collected_at DESC, content_id) 
WHERE views_count > 10000 OR engagement_rate > 0.1;

-- Memórias confiáveis
CREATE INDEX idx_reliable_memories ON agent_memories (last_accessed DESC, agent_name) 
WHERE confidence_score > 0.8 AND success_rate > 0.7;

-- =====================================================
-- VIEWS MATERIALIZADAS
-- =====================================================

-- Estatísticas de engajamento por plataforma
CREATE MATERIALIZED VIEW platform_engagement_stats AS
SELECT 
    sc.platform,
    DATE_TRUNC('day', cm.collected_at) as date,
    COUNT(*) as content_count,
    AVG(cm.engagement_rate) as avg_engagement_rate,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cm.engagement_rate) as median_engagement_rate,
    AVG(ca.viral_potential_score) as avg_viral_potential,
    COUNT(*) FILTER (WHERE cm.engagement_rate > 0.1) as high_engagement_count
FROM scraped_content sc
JOIN content_metrics cm ON sc.id = cm.content_id
LEFT JOIN content_analyses ca ON sc.id = ca.content_id AND ca.analysis_type = 'metrics'
WHERE sc.is_active = true
GROUP BY sc.platform, DATE_TRUNC('day', cm.collected_at);

CREATE UNIQUE INDEX idx_platform_engagement_stats ON platform_engagement_stats (platform, date);

-- =====================================================
-- VIEWS DE MONITORAMENTO
-- =====================================================

-- Estatísticas do banco de dados
CREATE VIEW monitoring_database_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Performance de consultas
CREATE VIEW monitoring_query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Uso de índices
CREATE VIEW monitoring_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'Unused'
        WHEN idx_scan < 10 THEN 'Low Usage'
        WHEN idx_scan < 100 THEN 'Medium Usage'
        ELSE 'High Usage'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- =====================================================
-- FUNÇÕES DE MANUTENÇÃO
-- =====================================================

-- Função para anonização automática de dados expirados
CREATE OR REPLACE FUNCTION anonymize_expired_data()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER := 0;
BEGIN
    -- Anonizar dados pessoais em conteúdo expirado
    UPDATE scraped_content 
    SET 
        author_username = 'anonymized_' || substring(md5(author_username), 1, 8),
        author_display_name = 'Anonymized User',
        author_id = 'anonymized_' || substring(md5(author_id), 1, 8)
    WHERE id IN (
        SELECT sc.id 
        FROM scraped_content sc
        JOIN data_retention_policy drp ON sc.id = drp.content_id
        WHERE drp.deletion_date <= NOW()
        AND sc.author_username NOT LIKE 'anonymized_%'
    );
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log da operação de anonização
    INSERT INTO system_logs (log_level, component, operation, message, details)
    VALUES ('INFO', 'data_retention', 'anonymization', 
            'Automated data anonymization completed', 
            json_build_object('affected_rows', affected_rows, 'timestamp', NOW()));
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_rows INTEGER := 0;
BEGIN
    DELETE FROM system_logs 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO system_logs (log_level, component, operation, message, details)
    VALUES ('INFO', 'maintenance', 'log_cleanup', 
            'Old logs cleanup completed', 
            json_build_object('deleted_rows', deleted_rows, 'retention_days', retention_days));
    
    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONFIGURAÇÕES INICIAIS
-- =====================================================

-- Configurações padrão do sistema
INSERT INTO system_configurations (config_key, config_value, config_type, description) VALUES
('scraper.max_concurrent_jobs', '10', 'scraper', 'Número máximo de jobs de scraping simultâneos'),
('scraper.retry_attempts', '3', 'scraper', 'Número de tentativas em caso de falha'),
('scraper.delay_between_requests', '2000', 'scraper', 'Delay em ms entre requisições'),
('analyzer.confidence_threshold', '0.7', 'analyzer', 'Threshold mínimo de confiança para análises'),
('analyzer.batch_size', '100', 'analyzer', 'Tamanho do batch para processamento'),
('memory.max_memories_per_agent', '10000', 'memory', 'Máximo de memórias por agente'),
('memory.cleanup_interval_hours', '24', 'memory', 'Intervalo de limpeza de memórias expiradas'),
('api.rate_limit_per_minute', '1000', 'api', 'Limite de requisições por minuto'),
('system.backup_retention_days', '30', 'system', 'Dias de retenção de backups');

-- Política de retenção padrão
INSERT INTO data_retention_policy (content_id, collection_purpose, legal_basis, retention_period) 
SELECT id, 'viral_analysis', 'legitimate_interest', INTERVAL '2 years'
FROM scraped_content 
WHERE id IN (SELECT id FROM scraped_content LIMIT 0); -- Não insere dados, apenas cria a estrutura

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

-- Schema criado com sucesso!
-- Para criar partições iniciais, execute:
-- SELECT create_monthly_partition('scraped_content', DATE_TRUNC('month', NOW()));
-- SELECT create_monthly_partition('content_metrics', DATE_TRUNC('month', NOW()));
-- SELECT create_monthly_partition('content_analyses', DATE_TRUNC('month', NOW()));
-- SELECT create_monthly_partition('system_logs', DATE_TRUNC('month', NOW()));

-- Para atualizar estatísticas das views materializadas:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY platform_engagement_stats;

