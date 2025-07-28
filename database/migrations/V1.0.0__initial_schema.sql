-- Migration: Initial Schema Creation
-- Version: 1.0.0
-- Created: 2025-01-27T00:00:00

-- Forward migration
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

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

-- TABELA PRINCIPAL: SCRAPED_CONTENT
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

-- TABELA DE MÉTRICAS: CONTENT_METRICS
CREATE TABLE content_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
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

-- Rollback SQL
-- DROP TABLE IF EXISTS content_metrics CASCADE;
-- DROP TABLE IF EXISTS scraped_content CASCADE;
-- DROP FUNCTION IF EXISTS create_monthly_partition(TEXT, DATE);
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP EXTENSION IF EXISTS "pg_stat_statements";
-- DROP EXTENSION IF EXISTS "btree_gin";
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

