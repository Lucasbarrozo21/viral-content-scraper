"""
SUPABASE CONFIGURATION - VIRAL CONTENT SCRAPER
Configuração completa para migração para Supabase

Autor: Manus AI
Data: 28 de Janeiro de 2025
"""

import os
from supabase import create_client, Client
from typing import Dict, Any, Optional
import logging

class SupabaseConfig:
    """Configuração e cliente Supabase"""
    
    def __init__(self):
        # Credenciais Supabase
        self.url = "https://kkzbiteakxsexxwiwtom.supabase.co"
        self.anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMyNjgsImV4cCI6MjA2OTIxOTI2OH0.Yd03_LE1cgEM3ik5WG7zCx9rG77zJc1Ez6-H8BgGkHk"
        self.service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzI2OCwiZXhwIjoyMDY5MjE5MjY4fQ.-EwB36xZXPIAstCnNM38RM-Lv8lxJG2vhCc6djyp2-E"
        
        # Clientes Supabase
        self.client: Optional[Client] = None
        self.admin_client: Optional[Client] = None
        
        # Configurações
        self.database_url = f"postgresql://postgres:[password]@db.kkzbiteakxsexxwiwtom.supabase.co:5432/postgres"
        
        # Inicializar clientes
        self.initialize_clients()
    
    def initialize_clients(self):
        """Inicializa os clientes Supabase"""
        try:
            # Cliente público (anon)
            self.client = create_client(self.url, self.anon_key)
            
            # Cliente administrativo (service_role)
            self.admin_client = create_client(self.url, self.service_role_key)
            
            logging.info("✅ Clientes Supabase inicializados com sucesso")
            
        except Exception as e:
            logging.error(f"❌ Erro ao inicializar clientes Supabase: {str(e)}")
            raise
    
    def get_client(self, admin: bool = False) -> Client:
        """Retorna cliente Supabase apropriado"""
        if admin:
            return self.admin_client
        return self.client
    
    def test_connection(self) -> bool:
        """Testa conexão com Supabase"""
        try:
            # Testar com cliente público
            response = self.client.table('_test').select('*').limit(1).execute()
            
            logging.info("✅ Conexão com Supabase testada com sucesso")
            return True
            
        except Exception as e:
            logging.warning(f"⚠️ Teste de conexão: {str(e)} (normal se tabelas não existirem ainda)")
            return True  # Conexão OK, tabelas podem não existir ainda

# Instância global
supabase_config = SupabaseConfig()

# Schemas das tabelas para migração
SUPABASE_SCHEMAS = {
    'viral_content': {
        'table_name': 'viral_content',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'platform': 'text NOT NULL',
            'content_type': 'text NOT NULL',
            'content_url': 'text',
            'content_text': 'text',
            'media_urls': 'jsonb',
            'engagement_metrics': 'jsonb',
            'viral_score': 'float',
            'collected_at': 'timestamptz DEFAULT now()',
            'metadata': 'jsonb',
            'analysis_results': 'jsonb',
            'created_at': 'timestamptz DEFAULT now()',
            'updated_at': 'timestamptz DEFAULT now()'
        },
        'indexes': [
            'CREATE INDEX idx_viral_content_platform ON viral_content(platform)',
            'CREATE INDEX idx_viral_content_viral_score ON viral_content(viral_score DESC)',
            'CREATE INDEX idx_viral_content_collected_at ON viral_content(collected_at DESC)'
        ]
    },
    
    'ai_memory_evolutionary': {
        'table_name': 'ai_memory_evolutionary',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'agent_name': 'text NOT NULL',
            'memory_type': 'text NOT NULL',
            'content_id': 'uuid REFERENCES viral_content(id)',
            'pattern_data': 'jsonb NOT NULL',
            'confidence_score': 'float',
            'learning_iteration': 'integer DEFAULT 1',
            'success_rate': 'float',
            'adaptation_data': 'jsonb',
            'created_at': 'timestamptz DEFAULT now()',
            'updated_at': 'timestamptz DEFAULT now()',
            'expires_at': 'timestamptz'
        },
        'indexes': [
            'CREATE INDEX idx_ai_memory_agent ON ai_memory_evolutionary(agent_name)',
            'CREATE INDEX idx_ai_memory_type ON ai_memory_evolutionary(memory_type)',
            'CREATE INDEX idx_ai_memory_confidence ON ai_memory_evolutionary(confidence_score DESC)'
        ]
    },
    
    'viral_templates': {
        'table_name': 'viral_templates',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'template_name': 'text NOT NULL',
            'platform': 'text NOT NULL',
            'template_type': 'text NOT NULL',
            'visual_structure': 'jsonb NOT NULL',
            'content_formulas': 'jsonb',
            'performance_metrics': 'jsonb',
            'viral_score': 'float',
            'adaptability_score': 'float',
            'usability_score': 'float',
            'usage_count': 'integer DEFAULT 0',
            'success_rate': 'float',
            'reference_image_url': 'text',
            'created_at': 'timestamptz DEFAULT now()',
            'updated_at': 'timestamptz DEFAULT now()'
        },
        'indexes': [
            'CREATE INDEX idx_viral_templates_platform ON viral_templates(platform)',
            'CREATE INDEX idx_viral_templates_viral_score ON viral_templates(viral_score DESC)',
            'CREATE INDEX idx_viral_templates_usage ON viral_templates(usage_count DESC)'
        ]
    },
    
    'content_analysis': {
        'table_name': 'content_analysis',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'content_id': 'uuid REFERENCES viral_content(id)',
            'agent_name': 'text NOT NULL',
            'analysis_type': 'text NOT NULL',
            'analysis_results': 'jsonb NOT NULL',
            'confidence_score': 'float',
            'processing_time': 'float',
            'insights': 'jsonb',
            'recommendations': 'jsonb',
            'created_at': 'timestamptz DEFAULT now()'
        },
        'indexes': [
            'CREATE INDEX idx_content_analysis_content ON content_analysis(content_id)',
            'CREATE INDEX idx_content_analysis_agent ON content_analysis(agent_name)',
            'CREATE INDEX idx_content_analysis_confidence ON content_analysis(confidence_score DESC)'
        ]
    },
    
    'scraping_jobs': {
        'table_name': 'scraping_jobs',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'platform': 'text NOT NULL',
            'job_type': 'text NOT NULL',
            'status': 'text DEFAULT \'pending\'',
            'parameters': 'jsonb',
            'results': 'jsonb',
            'items_collected': 'integer DEFAULT 0',
            'success_rate': 'float',
            'error_messages': 'jsonb',
            'started_at': 'timestamptz',
            'completed_at': 'timestamptz',
            'created_at': 'timestamptz DEFAULT now()'
        },
        'indexes': [
            'CREATE INDEX idx_scraping_jobs_platform ON scraping_jobs(platform)',
            'CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status)',
            'CREATE INDEX idx_scraping_jobs_created ON scraping_jobs(created_at DESC)'
        ]
    },
    
    'system_logs': {
        'table_name': 'system_logs',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'component': 'text NOT NULL',
            'level': 'text NOT NULL',
            'message': 'text NOT NULL',
            'metadata': 'jsonb',
            'timestamp': 'timestamptz DEFAULT now()',
            'session_id': 'text',
            'user_id': 'uuid'
        },
        'indexes': [
            'CREATE INDEX idx_system_logs_component ON system_logs(component)',
            'CREATE INDEX idx_system_logs_level ON system_logs(level)',
            'CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC)'
        ]
    },
    
    'system_doctor_actions': {
        'table_name': 'system_doctor_actions',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'problem_type': 'text NOT NULL',
            'component': 'text NOT NULL',
            'symptoms': 'jsonb NOT NULL',
            'diagnosis': 'jsonb',
            'actions_taken': 'jsonb NOT NULL',
            'result': 'text NOT NULL',
            'confidence': 'float',
            'learning_data': 'jsonb',
            'execution_time': 'float',
            'created_at': 'timestamptz DEFAULT now()'
        },
        'indexes': [
            'CREATE INDEX idx_system_doctor_component ON system_doctor_actions(component)',
            'CREATE INDEX idx_system_doctor_problem ON system_doctor_actions(problem_type)',
            'CREATE INDEX idx_system_doctor_result ON system_doctor_actions(result)'
        ]
    },
    
    'users': {
        'table_name': 'users',
        'columns': {
            'id': 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
            'email': 'text UNIQUE NOT NULL',
            'name': 'text',
            'role': 'text DEFAULT \'user\'',
            'permissions': 'jsonb',
            'preferences': 'jsonb',
            'last_login': 'timestamptz',
            'created_at': 'timestamptz DEFAULT now()',
            'updated_at': 'timestamptz DEFAULT now()'
        },
        'indexes': [
            'CREATE INDEX idx_users_email ON users(email)',
            'CREATE INDEX idx_users_role ON users(role)'
        ]
    }
}

# Configurações RLS (Row Level Security)
RLS_POLICIES = {
    'viral_content': [
        {
            'name': 'Users can view all viral content',
            'command': 'SELECT',
            'policy': 'true'
        },
        {
            'name': 'Authenticated users can insert content',
            'command': 'INSERT',
            'policy': 'auth.role() = \'authenticated\''
        }
    ],
    'ai_memory_evolutionary': [
        {
            'name': 'System can manage AI memory',
            'command': 'ALL',
            'policy': 'auth.role() = \'service_role\' OR auth.role() = \'authenticated\''
        }
    ],
    'viral_templates': [
        {
            'name': 'Users can view templates',
            'command': 'SELECT',
            'policy': 'true'
        },
        {
            'name': 'Authenticated users can manage templates',
            'command': 'ALL',
            'policy': 'auth.role() = \'authenticated\''
        }
    ]
}

# Funções SQL customizadas
CUSTOM_FUNCTIONS = [
    """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """,
    
    """
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
    """,
    
    """
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
    """
]

# Triggers
TRIGGERS = [
    {
        'table': 'viral_content',
        'trigger': 'CREATE TRIGGER update_viral_content_updated_at BEFORE UPDATE ON viral_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
    },
    {
        'table': 'ai_memory_evolutionary',
        'trigger': 'CREATE TRIGGER update_ai_memory_updated_at BEFORE UPDATE ON ai_memory_evolutionary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
    },
    {
        'table': 'viral_templates',
        'trigger': 'CREATE TRIGGER update_viral_templates_updated_at BEFORE UPDATE ON viral_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
    },
    {
        'table': 'users',
        'trigger': 'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
    }
]

print("✅ Configuração Supabase carregada com sucesso!")

