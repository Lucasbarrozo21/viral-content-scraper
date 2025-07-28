-- SCHEMA SIMPLIFICADO PARA VIRAL CONTENT SCRAPER
-- Versão sem particionamento para desenvolvimento

-- Limpar schema existente
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Tabela principal de conteúdo viral
CREATE TABLE viral_content (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    title TEXT,
    description TEXT,
    content_url TEXT,
    author_username VARCHAR(255),
    author_followers INTEGER DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    viral_score INTEGER DEFAULT 0,
    hashtags TEXT,
    mentions TEXT,
    media_urls TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de análises de conteúdo
CREATE TABLE content_analysis (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES viral_content(id) ON DELETE CASCADE,
    agent_type VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    results JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    insights TEXT[],
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de templates
CREATE TABLE viral_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    structure JSONB NOT NULL,
    viral_score INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários (para autenticação)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Tabela de jobs de scraping
CREATE TABLE scraping_jobs (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    target VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    items_collected INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de métricas agregadas
CREATE TABLE platform_metrics (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    total_content INTEGER DEFAULT 0,
    viral_content INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    avg_viral_score DECIMAL(5,2) DEFAULT 0.0,
    total_views BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, date)
);

-- Índices para performance
CREATE INDEX idx_viral_content_platform ON viral_content(platform);
CREATE INDEX idx_viral_content_viral_score ON viral_content(viral_score DESC);
CREATE INDEX idx_viral_content_created_at ON viral_content(created_at DESC);
CREATE INDEX idx_viral_content_engagement ON viral_content(engagement_rate DESC);
CREATE INDEX idx_content_analysis_content_id ON content_analysis(content_id);
CREATE INDEX idx_content_analysis_agent_type ON content_analysis(agent_type);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_platform_metrics_platform_date ON platform_metrics(platform, date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_viral_content_updated_at 
    BEFORE UPDATE ON viral_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viral_templates_updated_at 
    BEFORE UPDATE ON viral_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO viral_content (
    platform, content_type, title, description, author_username,
    views_count, likes_count, comments_count, shares_count,
    engagement_rate, viral_score, hashtags
) VALUES 
(
    'instagram', 'reel', 
    'Como ganhar R$ 10k/mês trabalhando de casa',
    'Descubra o método que mudou minha vida financeira',
    '@empreendedor_digital',
    2500000, 312500, 45000, 78000,
    12.5, 94,
    'empreendedorismo,renda,trabalhoremoto,sucesso'
),
(
    'tiktok', 'video',
    'Receita que viralizou: Bolo de chocolate em 5 minutos',
    'A receita mais fácil do mundo que todo mundo está fazendo',
    '@chef_rapido',
    1800000, 284400, 52000, 95000,
    15.8, 91,
    'receitas,bolo,chocolate,facil,viral'
),
(
    'youtube', 'short',
    '3 Dicas para Viralizar no Instagram',
    'Segredos que os influenciadores não contam',
    '@marketing_guru',
    950000, 89500, 12000, 34000,
    9.2, 87,
    'instagram,dicas,viral,marketing,influencer'
);

INSERT INTO viral_templates (
    name, platform, template_type, structure, viral_score, usage_count
) VALUES 
(
    'Template Motivacional Instagram', 'instagram', 'post',
    '{"layout": "vertical", "colors": ["#FF6B6B", "#4ECDC4"], "elements": ["headline", "image", "cta"]}',
    92, 1247
),
(
    'Template Carrossel Educativo', 'instagram', 'carousel',
    '{"layout": "grid", "slides": 5, "colors": ["#45B7D1", "#96CEB4"], "elements": ["title", "content", "conclusion"]}',
    88, 856
);

INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@viralscraper.com', '$2b$12$dummy_hash_for_development', 'admin'),
('demo', 'demo@viralscraper.com', '$2b$12$dummy_hash_for_development', 'user');

-- Conceder permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO viral_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO viral_user;

-- Confirmar criação
SELECT 'Schema simplificado criado com sucesso!' as status;

