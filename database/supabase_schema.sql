-- SUPABASE SCHEMA - VIRAL CONTENT SCRAPER
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Autor: Manus AI
-- Data: 28 de Janeiro de 2025

-- ============================================================================
-- TABELA: viral_content
-- Armazena todo o conteúdo viral coletado
-- ============================================================================
CREATE TABLE IF NOT EXISTS viral_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform text NOT NULL,
    content_type text NOT NULL,
    content_url text,
    content_text text,
    media_urls jsonb,
    engagement_metrics jsonb,
    viral_score float,
    collected_at timestamptz DEFAULT now(),
    metadata jsonb,
    analysis_results jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_viral_content_platform ON viral_content(platform);
CREATE INDEX IF NOT EXISTS idx_viral_content_viral_score ON viral_content(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_content_collected_at ON viral_content(collected_at DESC);

-- ============================================================================
-- TABELA: ai_memory_evolutionary
-- Memória evolutiva dos agentes IA
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_memory_evolutionary (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_name text NOT NULL,
    memory_type text NOT NULL,
    content_id uuid REFERENCES viral_content(id),
    pattern_data jsonb NOT NULL,
    confidence_score float,
    learning_iteration integer DEFAULT 1,
    success_rate float,
    adaptation_data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    expires_at timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_memory_agent ON ai_memory_evolutionary(agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_memory_type ON ai_memory_evolutionary(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memory_confidence ON ai_memory_evolutionary(confidence_score DESC);

-- ============================================================================
-- TABELA: viral_templates
-- Templates visuais extraídos e criados
-- ============================================================================
CREATE TABLE IF NOT EXISTS viral_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name text NOT NULL,
    platform text NOT NULL,
    template_type text NOT NULL,
    visual_structure jsonb NOT NULL,
    content_formulas jsonb,
    performance_metrics jsonb,
    viral_score float,
    adaptability_score float,
    usability_score float,
    usage_count integer DEFAULT 0,
    success_rate float,
    reference_image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_viral_templates_platform ON viral_templates(platform);
CREATE INDEX IF NOT EXISTS idx_viral_templates_viral_score ON viral_templates(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_templates_usage ON viral_templates(usage_count DESC);

-- ============================================================================
-- TABELA: content_analysis
-- Resultados das análises dos agentes IA
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_analysis (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id uuid REFERENCES viral_content(id),
    agent_name text NOT NULL,
    analysis_type text NOT NULL,
    analysis_results jsonb NOT NULL,
    confidence_score float,
    processing_time float,
    insights jsonb,
    recommendations jsonb,
    created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_content_analysis_content ON content_analysis(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_agent ON content_analysis(agent_name);
CREATE INDEX IF NOT EXISTS idx_content_analysis_confidence ON content_analysis(confidence_score DESC);

-- ============================================================================
-- TABELA: scraping_jobs
-- Jobs de scraping e seus resultados
-- ============================================================================
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform text NOT NULL,
    job_type text NOT NULL,
    status text DEFAULT 'pending',
    parameters jsonb,
    results jsonb,
    items_collected integer DEFAULT 0,
    success_rate float,
    error_messages jsonb,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_platform ON scraping_jobs(platform);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created ON scraping_jobs(created_at DESC);

-- ============================================================================
-- TABELA: system_logs
-- Logs do sistema
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    component text NOT NULL,
    level text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    timestamp timestamptz DEFAULT now(),
    session_id text,
    user_id uuid
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);

-- ============================================================================
-- TABELA: system_doctor_actions
-- Ações do System Doctor
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_doctor_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_type text NOT NULL,
    component text NOT NULL,
    symptoms jsonb NOT NULL,
    diagnosis jsonb,
    actions_taken jsonb NOT NULL,
    result text NOT NULL,
    confidence float,
    learning_data jsonb,
    execution_time float,
    created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_doctor_component ON system_doctor_actions(component);
CREATE INDEX IF NOT EXISTS idx_system_doctor_problem ON system_doctor_actions(problem_type);
CREATE INDEX IF NOT EXISTS idx_system_doctor_result ON system_doctor_actions(result);

-- ============================================================================
-- TABELA: users
-- Usuários do sistema
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text,
    role text DEFAULT 'user',
    permissions jsonb,
    preferences jsonb,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- FUNÇÕES CUSTOMIZADAS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para calcular viral score
CREATE OR REPLACE FUNCTION calculate_viral_score(
    engagement_metrics jsonb,
    platform text
) RETURNS float AS $$
DECLARE
    score float := 0;
    likes int := 0;
    shares int := 0;
    comments int := 0;
    views int := 0;
BEGIN
    -- Extrair métricas
    likes := COALESCE((engagement_metrics->>'likes')::int, 0);
    shares := COALESCE((engagement_metrics->>'shares')::int, 0);
    comments := COALESCE((engagement_metrics->>'comments')::int, 0);
    views := COALESCE((engagement_metrics->>'views')::int, 0);
    
    -- Calcular score baseado na plataforma
    CASE platform
        WHEN 'instagram' THEN
            score := (likes * 1.0 + comments * 3.0 + shares * 5.0) / GREATEST(views, 1) * 100;
        WHEN 'tiktok' THEN
            score := (likes * 0.8 + comments * 2.5 + shares * 4.0) / GREATEST(views, 1) * 100;
        WHEN 'youtube' THEN
            score := (likes * 1.2 + comments * 4.0 + shares * 6.0) / GREATEST(views, 1) * 100;
        ELSE
            score := (likes * 1.0 + comments * 2.0 + shares * 3.0) / GREATEST(views, 1) * 100;
    END CASE;
    
    -- Normalizar score (0-100)
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Função para obter conteúdo trending
CREATE OR REPLACE FUNCTION get_trending_content(
    platform_filter text DEFAULT NULL,
    hours_back int DEFAULT 24,
    min_viral_score float DEFAULT 70
) RETURNS TABLE (
    id uuid,
    platform text,
    content_text text,
    viral_score float,
    engagement_metrics jsonb,
    collected_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vc.id,
        vc.platform,
        vc.content_text,
        vc.viral_score,
        vc.engagement_metrics,
        vc.collected_at
    FROM viral_content vc
    WHERE 
        (platform_filter IS NULL OR vc.platform = platform_filter)
        AND vc.collected_at >= now() - (hours_back || ' hours')::interval
        AND vc.viral_score >= min_viral_score
    ORDER BY vc.viral_score DESC, vc.collected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_viral_content_updated_at 
    BEFORE UPDATE ON viral_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_memory_updated_at 
    BEFORE UPDATE ON ai_memory_evolutionary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viral_templates_updated_at 
    BEFORE UPDATE ON viral_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE viral_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory_evolutionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_doctor_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para viral_content
CREATE POLICY "Users can view all viral content" ON viral_content
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert content" ON viral_content
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update content" ON viral_content
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para ai_memory_evolutionary
CREATE POLICY "System can manage AI memory" ON ai_memory_evolutionary
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Políticas para viral_templates
CREATE POLICY "Users can view templates" ON viral_templates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage templates" ON viral_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para content_analysis
CREATE POLICY "Users can view analysis" ON content_analysis
    FOR SELECT USING (true);

CREATE POLICY "System can manage analysis" ON content_analysis
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Políticas para scraping_jobs
CREATE POLICY "Authenticated users can manage jobs" ON scraping_jobs
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para system_logs
CREATE POLICY "System can manage logs" ON system_logs
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Políticas para system_doctor_actions
CREATE POLICY "System can manage doctor actions" ON system_doctor_actions
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Políticas para users
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Inserir usuário administrador
INSERT INTO users (email, name, role, permissions, preferences) VALUES 
(
    'admin@viralcontentscraper.com',
    'Administrador',
    'admin',
    '{
        "scrapers": ["read", "write", "execute"],
        "ai_agents": ["read", "write", "configure"],
        "system_doctor": ["read", "write", "control"],
        "database": ["read", "write", "backup"],
        "users": ["read", "write", "delete"],
        "settings": ["read", "write"]
    }'::jsonb,
    '{
        "theme": "dark",
        "notifications": true,
        "auto_refresh": 30
    }'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Inserir dados de exemplo de conteúdo viral
INSERT INTO viral_content (platform, content_type, content_text, engagement_metrics, viral_score, metadata) VALUES 
(
    'instagram',
    'reel',
    'Como gerar milhões com IA em 2025 🚀',
    '{
        "likes": 45672,
        "comments": 1234,
        "shares": 892,
        "views": 234567
    }'::jsonb,
    94.2,
    '{
        "hashtags": ["#ia", "#milhoes", "#2025"],
        "duration": 30,
        "has_music": true
    }'::jsonb
),
(
    'tiktok',
    'video',
    'Segredo bilionário revelado! 💎',
    '{
        "likes": 89234,
        "comments": 2456,
        "shares": 1789,
        "views": 456789
    }'::jsonb,
    96.8,
    '{
        "hashtags": ["#segredo", "#bilionario", "#revelado"],
        "duration": 15,
        "has_effects": true
    }'::jsonb
);

-- Inserir template viral de exemplo
INSERT INTO viral_templates (template_name, platform, template_type, visual_structure, content_formulas, viral_score, adaptability_score, usability_score) VALUES 
(
    'Instagram Reel Motivacional',
    'instagram',
    'reel',
    '{
        "layout": "vertical_video",
        "color_scheme": {
            "primary": "#FF6B6B",
            "secondary": "#4ECDC4",
            "accent": "#FFE66D"
        },
        "typography": {
            "headline_font": "Montserrat Bold",
            "body_font": "Open Sans",
            "sizes": {"headline": 36, "body": 20}
        }
    }'::jsonb,
    '[
        {
            "section": "hook",
            "pattern": "[PROBLEMA] que [CONSEQUÊNCIA] em [TEMPO]"
        },
        {
            "section": "solution",
            "pattern": "Descubra como [SOLUÇÃO] pode [BENEFÍCIO]"
        }
    ]'::jsonb,
    92.5,
    88.3,
    91.7
);

-- Inserir log inicial
INSERT INTO system_logs (component, level, message, metadata) VALUES 
(
    'migration',
    'success',
    'Schema Supabase criado com sucesso',
    '{
        "tables_created": 8,
        "functions_created": 3,
        "triggers_created": 4,
        "policies_created": 12
    }'::jsonb
);

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

-- Este schema cria uma infraestrutura completa para a ferramenta bilionária:
-- 
-- 1. VIRAL_CONTENT: Armazena todo conteúdo coletado com métricas de engajamento
-- 2. AI_MEMORY_EVOLUTIONARY: Memória evolutiva dos agentes IA que aprende continuamente
-- 3. VIRAL_TEMPLATES: Templates visuais extraídos e criados automaticamente
-- 4. CONTENT_ANALYSIS: Resultados das análises dos 7 agentes IA
-- 5. SCRAPING_JOBS: Controle e monitoramento dos jobs de scraping
-- 6. SYSTEM_LOGS: Logs completos do sistema para debugging
-- 7. SYSTEM_DOCTOR_ACTIONS: Ações e diagnósticos do System Doctor
-- 8. USERS: Gerenciamento de usuários e permissões
--
-- Funcionalidades implementadas:
-- - Triggers automáticos para updated_at
-- - Funções para cálculo de viral score
-- - Função para obter conteúdo trending
-- - Row Level Security (RLS) para segurança
-- - Índices otimizados para performance
-- - Dados iniciais de exemplo
--
-- Para usar: Execute este SQL completo no Supabase Dashboard > SQL Editor
-- 
-- Autor: Manus AI - Sistema de Scraping Inteligente Bilionário
-- Data: 28 de Janeiro de 2025

