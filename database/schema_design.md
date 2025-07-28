# Arquitetura do Banco de Dados - Sistema de Scraping Inteligente

**Autor:** Manus AI  
**Data:** 27 de Janeiro de 2025  
**Versão:** 1.0

## Visão Geral

Este documento apresenta a arquitetura completa do banco de dados projetado para armazenar e gerenciar os resultados das análises avançadas do sistema de scraping inteligente para conteúdo viral. A estrutura foi cuidadosamente planejada para suportar alta performance, escalabilidade e flexibilidade, considerando a natureza complexa e variada dos dados de análise.

O sistema utiliza PostgreSQL como banco principal, aproveitando suas capacidades avançadas de JSONB, particionamento temporal, índices especializados e extensões para análise de dados. A arquitetura híbrida combina estruturas relacionais tradicionais para dados estruturados com armazenamento flexível em JSONB para dados semi-estruturados e análises complexas.

## Princípios de Design

### Escalabilidade Horizontal e Vertical

A estrutura foi projetada para crescer tanto horizontalmente quanto verticalmente. O particionamento temporal das tabelas principais permite distribuir dados por períodos, facilitando a manutenção e melhorando a performance de consultas. As tabelas de análise utilizam particionamento por plataforma e data, permitindo que consultas específicas acessem apenas os dados relevantes.

### Performance Otimizada

Cada tabela possui índices especializados baseados nos padrões de consulta mais comuns. Índices compostos foram criados para consultas complexas que filtram por múltiplos campos simultaneamente. Índices GIN em campos JSONB permitem consultas eficientes em dados semi-estruturados, enquanto índices parciais reduzem o overhead para dados específicos.

### Flexibilidade de Dados

O uso extensivo de campos JSONB permite armazenar estruturas de dados complexas e variáveis sem comprometer a performance. Isso é especialmente importante para análises que podem evoluir ao longo do tempo, adicionando novos campos ou modificando estruturas existentes sem necessidade de alterações no esquema.

### Integridade e Consistência

Constraints rigorosos garantem a integridade dos dados, incluindo validações de formato para URLs, verificações de ranges para scores normalizados e constraints de chave estrangeira para manter relacionamentos consistentes. Triggers automáticos mantêm campos calculados atualizados e logs de auditoria completos.




## Estrutura Principal do Banco de Dados

### Tabela Central: `scraped_content`

A tabela `scraped_content` serve como o núcleo do sistema, armazenando informações básicas sobre cada conteúdo coletado. Esta tabela foi projetada para ser altamente normalizada, contendo apenas dados essenciais e estáveis que raramente mudam após a coleta inicial.

```sql
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
```

O particionamento temporal por `scraped_at` permite que dados mais antigos sejam arquivados ou removidos facilmente, mantendo a performance das consultas focada em dados recentes. Cada partição cobre um período de um mês, balanceando granularidade com overhead de manutenção.

### Tabela de Métricas: `content_metrics`

As métricas de engajamento são armazenadas separadamente para permitir atualizações frequentes sem impactar a tabela principal. Esta estrutura suporta múltiplas coletas de métricas ao longo do tempo, permitindo análise de evolução temporal.

```sql
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
```

O campo `platform_specific_metrics` em JSONB armazena métricas únicas de cada plataforma, como "saves" no Instagram ou "duets" no TikTok. O campo `calculated_metrics` contém métricas derivadas calculadas pelo sistema, como velocidade de engajamento e scores normalizados.

### Tabela de Análises: `content_analyses`

Esta é a tabela mais complexa do sistema, armazenando todos os resultados das análises avançadas realizadas pelos diferentes módulos de IA. A estrutura híbrida combina campos estruturados para dados comuns com JSONB para análises específicas.

```sql
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
```

A partição por `analyzed_at` permite consultas eficientes por período de análise, enquanto os índices especializados em campos JSONB permitem consultas complexas nos dados de análise detalhados.


## Sistema de Memória Evolutiva

### Tabela de Memórias dos Agentes: `agent_memories`

Esta tabela integra-se com o sistema Supabase para armazenar o conhecimento evolutivo dos agentes de IA. Cada entrada representa uma "memória" que o sistema pode usar para melhorar análises futuras.

```sql
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
```

### Tabela de Padrões Evolutivos: `evolutionary_patterns`

Armazena padrões identificados que evoluem ao longo do tempo através de gerações, similar ao conceito de DNA digital que aprende e se adapta.

```sql
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
```

### Tabela de Feedback de Aprendizado: `learning_feedback`

Registra o feedback de performance das análises, permitindo que o sistema aprenda com resultados reais e melhore continuamente.

```sql
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
```

## Tabelas de Suporte e Configuração

### Tabela de Configurações: `system_configurations`

Armazena configurações globais do sistema, permitindo ajustes dinâmicos sem necessidade de redeploy.

```sql
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
```

### Tabela de Logs de Sistema: `system_logs`

Mantém logs estruturados de todas as operações importantes do sistema para auditoria e debugging.

```sql
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
```

### Tabela de Estatísticas Agregadas: `analytics_aggregates`

Pré-calcula estatísticas comuns para melhorar performance de consultas analíticas.

```sql
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
```


## Estratégia de Indexação e Otimização

### Índices Primários para Consultas Frequentes

A estratégia de indexação foi desenvolvida baseada nos padrões de consulta mais comuns do sistema. Índices compostos foram criados para otimizar consultas que filtram por múltiplos campos simultaneamente, reduzindo significativamente o tempo de resposta.

```sql
-- Índices para scraped_content
CREATE INDEX idx_scraped_content_platform_date ON scraped_content (platform, scraped_at DESC);
CREATE INDEX idx_scraped_content_author ON scraped_content (author_username, platform);
CREATE INDEX idx_scraped_content_hashtags ON scraped_content USING GIN (hashtags);
CREATE INDEX idx_scraped_content_language ON scraped_content (language, platform);
CREATE INDEX idx_scraped_content_active ON scraped_content (is_active, scraped_at DESC) WHERE is_active = true;

-- Índices para content_metrics
CREATE INDEX idx_content_metrics_content_date ON content_metrics (content_id, collected_at DESC);
CREATE INDEX idx_content_metrics_engagement ON content_metrics (engagement_rate DESC) WHERE engagement_rate IS NOT NULL;
CREATE INDEX idx_content_metrics_viral ON content_metrics (views_count DESC, likes_count DESC);
CREATE INDEX idx_content_metrics_platform_specific ON content_metrics USING GIN (platform_specific_metrics);

-- Índices para content_analyses
CREATE INDEX idx_content_analyses_content_type ON content_analyses (content_id, analysis_type, analyzed_at DESC);
CREATE INDEX idx_content_analyses_scores ON content_analyses (overall_score DESC, confidence_score DESC);
CREATE INDEX idx_content_analyses_sentiment ON content_analyses (sentiment_polarity, emotional_intensity DESC);
CREATE INDEX idx_content_analyses_viral_potential ON content_analyses (viral_potential_score DESC) WHERE viral_potential_score IS NOT NULL;
CREATE INDEX idx_content_analyses_jsonb ON content_analyses USING GIN (sentiment_analysis, visual_analysis, metrics_analysis);
```

### Índices Especializados para Memória Evolutiva

O sistema de memória evolutiva requer índices especializados para consultas complexas que correlacionam padrões históricos com análises atuais.

```sql
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
CREATE INDEX idx_evolutionary_patterns_data ON evolutionary_patterns USING GIN (pattern_data);

-- Índices para learning_feedback
CREATE INDEX idx_learning_feedback_accuracy ON learning_feedback (accuracy_score DESC) WHERE accuracy_score IS NOT NULL;
CREATE INDEX idx_learning_feedback_unprocessed ON learning_feedback (created_at DESC) WHERE processed = false;
```

### Índices Parciais para Otimização de Espaço

Índices parciais são utilizados para otimizar consultas específicas sem o overhead de indexar todos os registros, especialmente úteis para dados com alta seletividade.

```sql
-- Índices parciais para conteúdo ativo e recente
CREATE INDEX idx_recent_active_content ON scraped_content (scraped_at DESC, platform) 
WHERE is_active = true AND scraped_at > NOW() - INTERVAL '30 days';

-- Índices para análises bem-sucedidas
CREATE INDEX idx_successful_analyses ON content_analyses (analyzed_at DESC, analysis_type) 
WHERE success = true AND confidence_score > 0.7;

-- Índices para conteúdo viral
CREATE INDEX idx_viral_content ON content_metrics (collected_at DESC, content_id) 
WHERE views_count > 10000 OR engagement_rate > 0.1;

-- Índices para memórias ativas e confiáveis
CREATE INDEX idx_reliable_memories ON agent_memories (last_accessed DESC, agent_name) 
WHERE confidence_score > 0.8 AND success_rate > 0.7;
```

### Otimizações de Performance Avançadas

#### Particionamento Temporal Automático

O sistema implementa particionamento automático baseado em tempo para as tabelas principais, criando novas partições mensalmente e arquivando dados antigos.

```sql
-- Função para criar partições automaticamente
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
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (created_at DESC)',
                   'idx_' || partition_name || '_created', partition_name);
END;
$$ LANGUAGE plpgsql;
```

#### Materialização de Views Complexas

Views materializadas são utilizadas para pré-calcular consultas complexas que envolvem múltiplas tabelas e agregações pesadas.

```sql
-- View materializada para estatísticas de engajamento por plataforma
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
```

#### Configurações de Performance do PostgreSQL

Configurações específicas otimizadas para o workload do sistema de análise de conteúdo viral.

```sql
-- Configurações otimizadas para JSONB e análise de dados
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configurações específicas para JSONB
ALTER SYSTEM SET gin_pending_list_limit = '4MB';
ALTER SYSTEM SET gin_fuzzy_search_limit = 0;
```


## Consultas Otimizadas e Casos de Uso

### Consultas para Análise de Tendências

O sistema suporta consultas complexas para identificar tendências emergentes e padrões virais em tempo real. Estas consultas foram otimizadas para processar grandes volumes de dados eficientemente.

```sql
-- Identificar conteúdo com potencial viral nas últimas 24 horas
WITH viral_candidates AS (
    SELECT 
        sc.id,
        sc.platform,
        sc.title,
        sc.author_username,
        cm.engagement_rate,
        ca.viral_potential_score,
        ca.sentiment_analysis->>'dominantEmotion' as dominant_emotion,
        cm.collected_at
    FROM scraped_content sc
    JOIN content_metrics cm ON sc.id = cm.content_id
    LEFT JOIN content_analyses ca ON sc.id = ca.content_id 
        AND ca.analysis_type = 'comprehensive'
    WHERE 
        sc.scraped_at > NOW() - INTERVAL '24 hours'
        AND cm.collected_at > NOW() - INTERVAL '24 hours'
        AND (
            cm.engagement_rate > 0.05 
            OR ca.viral_potential_score > 0.7
            OR cm.views_count > 10000
        )
),
engagement_velocity AS (
    SELECT 
        vc.id,
        vc.engagement_rate / EXTRACT(EPOCH FROM (NOW() - vc.collected_at)) * 3600 as hourly_engagement_rate
    FROM viral_candidates vc
)
SELECT 
    vc.*,
    ev.hourly_engagement_rate,
    CASE 
        WHEN ev.hourly_engagement_rate > 0.01 THEN 'High Velocity'
        WHEN ev.hourly_engagement_rate > 0.005 THEN 'Medium Velocity'
        ELSE 'Low Velocity'
    END as velocity_category
FROM viral_candidates vc
JOIN engagement_velocity ev ON vc.id = ev.id
ORDER BY ev.hourly_engagement_rate DESC, vc.viral_potential_score DESC
LIMIT 50;
```

### Consultas para Análise Comparativa por Nicho

Esta consulta permite comparar performance de conteúdo dentro de nichos específicos, identificando benchmarks e oportunidades de melhoria.

```sql
-- Análise comparativa de performance por nicho e plataforma
WITH niche_stats AS (
    SELECT 
        sc.platform,
        COALESCE(am.niche, 'general') as niche,
        COUNT(*) as content_count,
        AVG(cm.engagement_rate) as avg_engagement,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cm.engagement_rate) as median_engagement,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY cm.engagement_rate) as p90_engagement,
        AVG(ca.viral_potential_score) as avg_viral_potential,
        AVG(ca.overall_score) as avg_quality_score
    FROM scraped_content sc
    JOIN content_metrics cm ON sc.id = cm.content_id
    LEFT JOIN content_analyses ca ON sc.id = ca.content_id
    LEFT JOIN agent_memories am ON sc.id = am.content_id
    WHERE 
        sc.scraped_at > NOW() - INTERVAL '7 days'
        AND cm.collected_at > NOW() - INTERVAL '7 days'
    GROUP BY sc.platform, COALESCE(am.niche, 'general')
    HAVING COUNT(*) >= 10
),
content_rankings AS (
    SELECT 
        sc.id,
        sc.platform,
        sc.title,
        sc.author_username,
        COALESCE(am.niche, 'general') as niche,
        cm.engagement_rate,
        ca.viral_potential_score,
        PERCENT_RANK() OVER (
            PARTITION BY sc.platform, COALESCE(am.niche, 'general') 
            ORDER BY cm.engagement_rate
        ) as engagement_percentile,
        PERCENT_RANK() OVER (
            PARTITION BY sc.platform, COALESCE(am.niche, 'general') 
            ORDER BY ca.viral_potential_score
        ) as viral_percentile
    FROM scraped_content sc
    JOIN content_metrics cm ON sc.id = cm.content_id
    LEFT JOIN content_analyses ca ON sc.id = ca.content_id
    LEFT JOIN agent_memories am ON sc.id = am.content_id
    WHERE 
        sc.scraped_at > NOW() - INTERVAL '7 days'
        AND cm.collected_at > NOW() - INTERVAL '7 days'
)
SELECT 
    ns.platform,
    ns.niche,
    ns.content_count,
    ROUND(ns.avg_engagement::numeric, 4) as avg_engagement,
    ROUND(ns.median_engagement::numeric, 4) as median_engagement,
    ROUND(ns.p90_engagement::numeric, 4) as top_10_percent_engagement,
    ROUND(ns.avg_viral_potential::numeric, 3) as avg_viral_potential,
    COUNT(*) FILTER (WHERE cr.engagement_percentile > 0.9) as top_performers_count,
    COUNT(*) FILTER (WHERE cr.viral_percentile > 0.8) as high_viral_potential_count
FROM niche_stats ns
LEFT JOIN content_rankings cr ON ns.platform = cr.platform AND ns.niche = cr.niche
GROUP BY ns.platform, ns.niche, ns.content_count, ns.avg_engagement, 
         ns.median_engagement, ns.p90_engagement, ns.avg_viral_potential
ORDER BY ns.platform, ns.avg_engagement DESC;
```

### Consultas para Sistema de Memória Evolutiva

Estas consultas demonstram como o sistema utiliza a memória evolutiva para melhorar análises futuras baseadas em padrões aprendidos.

```sql
-- Recuperar padrões evolutivos relevantes para nova análise
WITH relevant_patterns AS (
    SELECT 
        ep.id,
        ep.pattern_type,
        ep.pattern_data,
        ep.confidence_score,
        ep.success_rate,
        ep.sample_size,
        CASE 
            WHEN $1 = ANY(ep.platforms) THEN 1.0
            WHEN ep.platforms IS NULL OR array_length(ep.platforms, 1) IS NULL THEN 0.7
            ELSE 0.3
        END as platform_relevance,
        CASE 
            WHEN $2 = ANY(ep.niches) THEN 1.0
            WHEN ep.niches IS NULL OR array_length(ep.niches, 1) IS NULL THEN 0.8
            ELSE 0.4
        END as niche_relevance
    FROM evolutionary_patterns ep
    WHERE 
        ep.is_active = true
        AND ep.confidence_score > 0.6
        AND ep.success_rate > 0.7
        AND ep.sample_size >= 5
),
weighted_patterns AS (
    SELECT 
        *,
        (confidence_score * 0.3 + success_rate * 0.3 + 
         platform_relevance * 0.2 + niche_relevance * 0.2) as relevance_score
    FROM relevant_patterns
),
memory_context AS (
    SELECT 
        am.agent_name,
        am.memory_type,
        am.memory_data,
        am.confidence_score,
        am.success_rate,
        am.usage_count
    FROM agent_memories am
    WHERE 
        am.platform = $1
        AND (am.niche = $2 OR am.niche = 'general')
        AND am.confidence_score > 0.7
        AND (am.expires_at IS NULL OR am.expires_at > NOW())
    ORDER BY am.success_rate DESC, am.confidence_score DESC
    LIMIT 20
)
SELECT 
    'pattern' as source_type,
    wp.pattern_type as type,
    wp.pattern_data as data,
    wp.relevance_score as score,
    wp.sample_size,
    NULL as agent_name
FROM weighted_patterns wp
WHERE wp.relevance_score > 0.7
UNION ALL
SELECT 
    'memory' as source_type,
    mc.memory_type as type,
    mc.memory_data as data,
    (mc.confidence_score * 0.6 + mc.success_rate * 0.4) as score,
    mc.usage_count as sample_size,
    mc.agent_name
FROM memory_context mc
ORDER BY score DESC
LIMIT 50;
```

### Consultas para Relatórios e Dashboard

O sistema gera relatórios automáticos e feeds dados para dashboards em tempo real através de consultas otimizadas.

```sql
-- Dashboard principal - métricas em tempo real
WITH platform_summary AS (
    SELECT 
        sc.platform,
        COUNT(DISTINCT sc.id) as total_content,
        COUNT(DISTINCT sc.id) FILTER (WHERE sc.scraped_at > NOW() - INTERVAL '24 hours') as content_24h,
        AVG(cm.engagement_rate) as avg_engagement,
        COUNT(*) FILTER (WHERE cm.engagement_rate > 0.1) as high_engagement_count,
        AVG(ca.viral_potential_score) as avg_viral_potential,
        COUNT(*) FILTER (WHERE ca.viral_potential_score > 0.8) as high_viral_count
    FROM scraped_content sc
    LEFT JOIN content_metrics cm ON sc.id = cm.content_id
    LEFT JOIN content_analyses ca ON sc.id = ca.content_id AND ca.analysis_type = 'comprehensive'
    WHERE sc.scraped_at > NOW() - INTERVAL '7 days'
    GROUP BY sc.platform
),
trending_hashtags AS (
    SELECT 
        hashtag,
        COUNT(*) as usage_count,
        AVG(cm.engagement_rate) as avg_engagement
    FROM scraped_content sc,
         UNNEST(sc.hashtags) as hashtag
    JOIN content_metrics cm ON sc.id = cm.content_id
    WHERE sc.scraped_at > NOW() - INTERVAL '24 hours'
    GROUP BY hashtag
    HAVING COUNT(*) >= 3
    ORDER BY usage_count DESC, avg_engagement DESC
    LIMIT 10
),
top_performers AS (
    SELECT 
        sc.platform,
        sc.title,
        sc.author_username,
        cm.engagement_rate,
        ca.viral_potential_score,
        cm.views_count
    FROM scraped_content sc
    JOIN content_metrics cm ON sc.id = cm.content_id
    LEFT JOIN content_analyses ca ON sc.id = ca.content_id
    WHERE sc.scraped_at > NOW() - INTERVAL '24 hours'
    ORDER BY cm.engagement_rate DESC
    LIMIT 20
)
SELECT 
    json_build_object(
        'platform_summary', (
            SELECT json_agg(row_to_json(ps)) FROM platform_summary ps
        ),
        'trending_hashtags', (
            SELECT json_agg(row_to_json(th)) FROM trending_hashtags th
        ),
        'top_performers', (
            SELECT json_agg(row_to_json(tp)) FROM top_performers tp
        ),
        'last_updated', NOW()
    ) as dashboard_data;
```

### Consultas para Análise de Sentimento Temporal

Estas consultas analisam como o sentimento do conteúdo evolui ao longo do tempo, identificando padrões sazonais e tendências emergentes.

```sql
-- Análise temporal de sentimento por plataforma
WITH sentiment_timeline AS (
    SELECT 
        sc.platform,
        DATE_TRUNC('hour', ca.analyzed_at) as time_bucket,
        ca.sentiment_polarity,
        ca.dominant_emotion,
        ca.emotional_intensity,
        COUNT(*) as content_count,
        AVG(ca.sentiment_score) as avg_sentiment_score,
        AVG(cm.engagement_rate) as avg_engagement_rate
    FROM scraped_content sc
    JOIN content_analyses ca ON sc.id = ca.content_id
    LEFT JOIN content_metrics cm ON sc.id = cm.content_id
    WHERE 
        ca.analysis_type = 'sentiment'
        AND ca.analyzed_at > NOW() - INTERVAL '7 days'
        AND ca.success = true
    GROUP BY sc.platform, DATE_TRUNC('hour', ca.analyzed_at), 
             ca.sentiment_polarity, ca.dominant_emotion, ca.emotional_intensity
),
emotion_trends AS (
    SELECT 
        platform,
        dominant_emotion,
        COUNT(*) as total_occurrences,
        AVG(avg_engagement_rate) as emotion_engagement_rate,
        ARRAY_AGG(
            json_build_object(
                'time', time_bucket,
                'count', content_count,
                'sentiment_score', avg_sentiment_score
            ) ORDER BY time_bucket
        ) as timeline_data
    FROM sentiment_timeline
    WHERE dominant_emotion IS NOT NULL
    GROUP BY platform, dominant_emotion
    HAVING COUNT(*) >= 5
)
SELECT 
    platform,
    dominant_emotion,
    total_occurrences,
    ROUND(emotion_engagement_rate::numeric, 4) as avg_engagement_rate,
    timeline_data,
    CASE 
        WHEN emotion_engagement_rate > 0.08 THEN 'High Performance'
        WHEN emotion_engagement_rate > 0.04 THEN 'Medium Performance'
        ELSE 'Low Performance'
    END as performance_category
FROM emotion_trends
ORDER BY platform, emotion_engagement_rate DESC;
```


## Estratégia de Implementação e Deployment

### Sistema de Migrations Versionado

O sistema utiliza um approach de migrations versionado que permite atualizações incrementais do esquema sem downtime. Cada migration é atomicamente aplicada e pode ser revertida se necessário.

```sql
-- Tabela de controle de migrations
CREATE TABLE schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT current_user,
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    rollback_sql TEXT
);

-- Migration exemplo: v1.0.0 - Schema inicial
INSERT INTO schema_migrations (version, description, checksum) 
VALUES ('1.0.0', 'Initial schema creation', 'abc123def456');

-- Migration exemplo: v1.1.0 - Adição de campos de análise visual
ALTER TABLE content_analyses 
ADD COLUMN IF NOT EXISTS visual_elements JSONB,
ADD COLUMN IF NOT EXISTS color_analysis JSONB,
ADD COLUMN IF NOT EXISTS composition_metrics JSONB;

INSERT INTO schema_migrations (version, description, checksum) 
VALUES ('1.1.0', 'Added visual analysis fields', 'def456ghi789');
```

### Configuração de Ambiente de Desenvolvimento

O ambiente de desenvolvimento utiliza Docker Compose para garantir consistência entre diferentes máquinas e facilitar onboarding de novos desenvolvedores.

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: viral_content_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
      - ./database/migrations:/migrations
    command: >
      postgres 
      -c shared_buffers=256MB 
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Scripts de Inicialização e Seed Data

Scripts automatizados criam o esquema inicial e populam dados de exemplo para desenvolvimento e testes.

```sql
-- init/01_create_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- init/02_create_functions.sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- init/03_create_triggers.sql
CREATE TRIGGER update_scraped_content_updated_at 
    BEFORE UPDATE ON scraped_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memories_updated_at 
    BEFORE UPDATE ON agent_memories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Configuração de Produção

A configuração de produção inclui otimizações específicas para alta disponibilidade, backup automático e monitoramento.

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres-primary:
    image: postgres:15
    environment:
      POSTGRES_DB: viral_content_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_REPLICATION_USER: ${REPLICATION_USER}
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
      - ./database/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./database/pg_hba.conf:/etc/postgresql/pg_hba.conf
    command: >
      postgres 
      -c config_file=/etc/postgresql/postgresql.conf
    networks:
      - db_network
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'

  postgres-replica:
    image: postgres:15
    environment:
      POSTGRES_DB: viral_content_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGUSER: ${REPLICATION_USER}
      PGPASSWORD: ${REPLICATION_PASSWORD}
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    command: >
      bash -c "
      pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U ${REPLICATION_USER} -v -P -W &&
      echo 'standby_mode = on' >> /var/lib/postgresql/data/recovery.conf &&
      echo 'primary_conninfo = host=postgres-primary port=5432 user=${REPLICATION_USER}' >> /var/lib/postgresql/data/recovery.conf &&
      postgres
      "
    depends_on:
      - postgres-primary
    networks:
      - db_network

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres-primary
      DATABASES_PORT: 5432
      DATABASES_USER: ${DB_USER}
      DATABASES_PASSWORD: ${DB_PASSWORD}
      DATABASES_DBNAME: viral_content_prod
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      - postgres-primary
    networks:
      - db_network

networks:
  db_network:
    driver: bridge

volumes:
  postgres_primary_data:
  postgres_replica_data:
```

### Backup e Recovery Strategy

Sistema automatizado de backup com retenção configurável e testes de recovery automáticos.

```bash
#!/bin/bash
# backup/automated_backup.sh

set -e

BACKUP_DIR="/backups"
DB_NAME="viral_content_prod"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Full database backup
pg_dump -h postgres-primary -U ${DB_USER} -d ${DB_NAME} \
    --verbose --format=custom --compress=9 \
    --file="${BACKUP_DIR}/full_backup_${TIMESTAMP}.dump"

# Schema-only backup for quick recovery testing
pg_dump -h postgres-primary -U ${DB_USER} -d ${DB_NAME} \
    --schema-only --verbose \
    --file="${BACKUP_DIR}/schema_backup_${TIMESTAMP}.sql"

# Backup specific high-value tables separately
pg_dump -h postgres-primary -U ${DB_USER} -d ${DB_NAME} \
    --table=scraped_content --table=content_analyses --table=agent_memories \
    --verbose --format=custom --compress=9 \
    --file="${BACKUP_DIR}/critical_data_${TIMESTAMP}.dump"

# Clean old backups
find ${BACKUP_DIR} -name "*.dump" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "*.sql" -mtime +${RETENTION_DAYS} -delete

# Verify backup integrity
pg_restore --list "${BACKUP_DIR}/full_backup_${TIMESTAMP}.dump" > /dev/null

echo "Backup completed successfully: ${TIMESTAMP}"
```

### Monitoramento e Alertas

Sistema de monitoramento integrado que acompanha performance, uso de recursos e integridade dos dados.

```sql
-- Views para monitoramento
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
```

### Testes de Performance e Load Testing

Scripts automatizados para testes de carga que simulam cenários reais de uso do sistema.

```python
# tests/load_test.py
import asyncio
import asyncpg
import time
import random
from concurrent.futures import ThreadPoolExecutor

async def simulate_content_insertion(pool, num_records=1000):
    """Simula inserção de conteúdo coletado"""
    platforms = ['instagram', 'tiktok', 'youtube', 'facebook']
    content_types = ['post', 'reel', 'video', 'story']
    
    start_time = time.time()
    
    async with pool.acquire() as conn:
        for i in range(num_records):
            await conn.execute("""
                INSERT INTO scraped_content 
                (platform, platform_content_id, content_type, url, title, author_username)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, 
            random.choice(platforms),
            f"test_content_{i}_{int(time.time())}",
            random.choice(content_types),
            f"https://example.com/content/{i}",
            f"Test Content {i}",
            f"test_user_{i % 100}"
            )
    
    end_time = time.time()
    print(f"Inserted {num_records} records in {end_time - start_time:.2f} seconds")

async def simulate_analysis_queries(pool, num_queries=100):
    """Simula consultas de análise complexas"""
    start_time = time.time()
    
    async with pool.acquire() as conn:
        for i in range(num_queries):
            await conn.fetch("""
                SELECT 
                    sc.platform,
                    COUNT(*) as content_count,
                    AVG(cm.engagement_rate) as avg_engagement,
                    AVG(ca.viral_potential_score) as avg_viral_potential
                FROM scraped_content sc
                LEFT JOIN content_metrics cm ON sc.id = cm.content_id
                LEFT JOIN content_analyses ca ON sc.id = ca.content_id
                WHERE sc.scraped_at > NOW() - INTERVAL '24 hours'
                GROUP BY sc.platform
            """)
    
    end_time = time.time()
    print(f"Executed {num_queries} analysis queries in {end_time - start_time:.2f} seconds")

async def run_load_test():
    """Executa teste de carga completo"""
    pool = await asyncpg.create_pool(
        host='localhost',
        port=5432,
        user='dev_user',
        password='dev_password',
        database='viral_content_dev',
        min_size=10,
        max_size=20
    )
    
    # Executar testes em paralelo
    tasks = [
        simulate_content_insertion(pool, 1000),
        simulate_analysis_queries(pool, 100),
        simulate_content_insertion(pool, 500),
        simulate_analysis_queries(pool, 50)
    ]
    
    await asyncio.gather(*tasks)
    await pool.close()

if __name__ == "__main__":
    asyncio.run(run_load_test())
```

## Considerações de Segurança e Compliance

### Controle de Acesso e Auditoria

O sistema implementa controle de acesso granular com auditoria completa de todas as operações sensíveis.

```sql
-- Roles e permissões
CREATE ROLE scraper_service;
GRANT SELECT, INSERT, UPDATE ON scraped_content TO scraper_service;
GRANT SELECT, INSERT, UPDATE ON content_metrics TO scraper_service;

CREATE ROLE analyzer_service;
GRANT SELECT ON scraped_content TO analyzer_service;
GRANT SELECT ON content_metrics TO analyzer_service;
GRANT SELECT, INSERT, UPDATE ON content_analyses TO analyzer_service;
GRANT SELECT, INSERT, UPDATE ON agent_memories TO analyzer_service;

CREATE ROLE api_service;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO api_service;
GRANT INSERT, UPDATE ON system_logs TO api_service;

-- Auditoria de operações sensíveis
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

-- Trigger de auditoria para tabelas sensíveis
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_values)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, old_values, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Proteção de Dados Pessoais (LGPD/GDPR)

Implementação de recursos para compliance com regulamentações de proteção de dados.

```sql
-- Tabela para gerenciar consentimento e retenção de dados
CREATE TABLE data_retention_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES scraped_content(id) ON DELETE CASCADE,
    data_subject_id VARCHAR(255), -- ID do usuário cujos dados foram coletados
    collection_purpose VARCHAR(100) NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    retention_period INTERVAL NOT NULL,
    deletion_date TIMESTAMPTZ GENERATED ALWAYS AS (created_at + retention_period) STORED,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_legal_basis CHECK (legal_basis IN ('consent', 'legitimate_interest', 'public_task', 'vital_interests'))
);

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

-- Agendar execução automática da anonização
SELECT cron.schedule('anonymize-expired-data', '0 2 * * *', 'SELECT anonymize_expired_data();');
```

Esta arquitetura de banco de dados fornece uma base sólida e escalável para o sistema de scraping inteligente, combinando performance otimizada, flexibilidade para evolução futura e compliance com regulamentações de proteção de dados. A estrutura híbrida de dados relacionais e JSONB permite armazenar eficientemente tanto dados estruturados quanto as análises complexas geradas pelos agentes de IA, enquanto o sistema de memória evolutiva garante que o sistema continue aprendendo e melhorando ao longo do tempo.

