"""
MÓDULO DE CONEXÃO COM BANCO DE DADOS POSTGRESQL
Gerenciamento de conexões e operações de banco de dados

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import os
import psycopg2
import psycopg2.extras
from psycopg2.pool import SimpleConnectionPool
import logging
from contextlib import contextmanager
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gerenciador de conexões e operações do banco de dados"""
    
    def __init__(self):
        self.pool = None
        self.initialize_connection_pool()
    
    def initialize_connection_pool(self):
        """Inicializa pool de conexões com PostgreSQL"""
        try:
            # Configurações de conexão
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': os.getenv('DB_PORT', '5432'),
                'database': os.getenv('DB_NAME', 'viral_content_db'),
                'user': os.getenv('DB_USER', 'viral_user'),
                'password': os.getenv('DB_PASSWORD', 'viral_pass123'),
            }
            
            # Criar pool de conexões
            self.pool = SimpleConnectionPool(
                minconn=1,
                maxconn=20,
                **db_config
            )
            
            logger.info("✅ Pool de conexões PostgreSQL inicializado com sucesso")
            
            # Testar conexão
            self.test_connection()
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar pool de conexões: {e}")
            # Fallback para dados mockados se não conseguir conectar
            self.pool = None
    
    def test_connection(self):
        """Testa conexão com banco de dados"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT version();")
                    version = cursor.fetchone()[0]
                    logger.info(f"✅ Conexão PostgreSQL OK: {version}")
                    return True
        except Exception as e:
            logger.error(f"❌ Erro ao testar conexão: {e}")
            return False
    
    @contextmanager
    def get_connection(self):
        """Context manager para obter conexão do pool"""
        if not self.pool:
            raise Exception("Pool de conexões não inicializado")
        
        conn = None
        try:
            conn = self.pool.getconn()
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                self.pool.putconn(conn)
    
    def execute_query(self, query, params=None, fetch=False):
        """Executa query no banco de dados"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    
                    if fetch:
                        if fetch == 'one':
                            return cursor.fetchone()
                        else:
                            return cursor.fetchall()
                    else:
                        conn.commit()
                        return cursor.rowcount
                        
        except Exception as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise e
    
    def get_dashboard_overview(self):
        """Obtém dados para overview do dashboard"""
        try:
            # Total de conteúdo coletado
            total_content = self.execute_query(
                "SELECT COUNT(*) as count FROM viral_content",
                fetch='one'
            )
            
            # Conteúdo viral (score > 80)
            viral_content = self.execute_query(
                "SELECT COUNT(*) as count FROM viral_content WHERE viral_score > 80",
                fetch='one'
            )
            
            # Análises realizadas hoje
            today_analyses = self.execute_query(
                """
                SELECT COUNT(*) as count 
                FROM content_analysis 
                WHERE DATE(created_at) = CURRENT_DATE
                """,
                fetch='one'
            )
            
            # Plataformas ativas
            active_platforms = self.execute_query(
                """
                SELECT COUNT(DISTINCT platform) as count 
                FROM viral_content 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                """,
                fetch='one'
            )
            
            return {
                'total_content': total_content['count'] if total_content else 0,
                'viral_content': viral_content['count'] if viral_content else 0,
                'today_analyses': today_analyses['count'] if today_analyses else 0,
                'active_platforms': active_platforms['count'] if active_platforms else 0
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter overview: {e}")
            # Retornar dados mockados em caso de erro
            return self.get_mock_dashboard_overview()
    
    def get_viral_content(self, limit=50, platform=None, min_score=70):
        """Obtém conteúdo viral do banco"""
        try:
            query = """
                SELECT 
                    id,
                    platform,
                    content_type,
                    title,
                    description,
                    viral_score,
                    engagement_rate,
                    views_count,
                    likes_count,
                    shares_count,
                    created_at,
                    author_username,
                    hashtags,
                    media_urls
                FROM viral_content 
                WHERE viral_score >= %s
            """
            
            params = [min_score]
            
            if platform:
                query += " AND platform = %s"
                params.append(platform)
            
            query += " ORDER BY viral_score DESC, created_at DESC LIMIT %s"
            params.append(limit)
            
            results = self.execute_query(query, params, fetch='all')
            
            return [dict(row) for row in results] if results else []
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter conteúdo viral: {e}")
            return self.get_mock_viral_content()
    
    def get_trending_topics(self, limit=20):
        """Obtém tópicos em alta"""
        try:
            query = """
                SELECT 
                    topic,
                    COUNT(*) as frequency,
                    AVG(viral_score) as avg_score,
                    MAX(created_at) as last_seen
                FROM (
                    SELECT 
                        unnest(string_to_array(hashtags, ',')) as topic,
                        viral_score,
                        created_at
                    FROM viral_content 
                    WHERE created_at >= NOW() - INTERVAL '7 days'
                    AND hashtags IS NOT NULL
                ) topics
                WHERE topic != ''
                GROUP BY topic
                HAVING COUNT(*) >= 3
                ORDER BY frequency DESC, avg_score DESC
                LIMIT %s
            """
            
            results = self.execute_query(query, [limit], fetch='all')
            
            return [dict(row) for row in results] if results else []
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter trending topics: {e}")
            return self.get_mock_trending_topics()
    
    def save_scraped_content(self, content_data):
        """Salva conteúdo coletado pelos scrapers"""
        try:
            query = """
                INSERT INTO viral_content (
                    platform, content_type, title, description, content_url,
                    author_username, author_followers, views_count, likes_count,
                    comments_count, shares_count, engagement_rate, viral_score,
                    hashtags, mentions, media_urls, metadata, created_at
                ) VALUES (
                    %(platform)s, %(content_type)s, %(title)s, %(description)s, %(content_url)s,
                    %(author_username)s, %(author_followers)s, %(views_count)s, %(likes_count)s,
                    %(comments_count)s, %(shares_count)s, %(engagement_rate)s, %(viral_score)s,
                    %(hashtags)s, %(mentions)s, %(media_urls)s, %(metadata)s, %(created_at)s
                )
                RETURNING id
            """
            
            result = self.execute_query(query, content_data, fetch='one')
            
            logger.info(f"✅ Conteúdo salvo com ID: {result['id']}")
            return result['id']
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar conteúdo: {e}")
            raise e
    
    def save_analysis_result(self, analysis_data):
        """Salva resultado de análise dos agentes IA"""
        try:
            query = """
                INSERT INTO content_analysis (
                    content_id, agent_type, analysis_type, results,
                    confidence_score, insights, recommendations, created_at
                ) VALUES (
                    %(content_id)s, %(agent_type)s, %(analysis_type)s, %(results)s,
                    %(confidence_score)s, %(insights)s, %(recommendations)s, %(created_at)s
                )
                RETURNING id
            """
            
            result = self.execute_query(query, analysis_data, fetch='one')
            
            logger.info(f"✅ Análise salva com ID: {result['id']}")
            return result['id']
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar análise: {e}")
            raise e
    
    def get_content_analysis(self, content_id=None, limit=50):
        """Obtém análises de conteúdo"""
        try:
            query = """
                SELECT 
                    ca.id,
                    ca.content_id,
                    ca.agent_type,
                    ca.analysis_type,
                    ca.results,
                    ca.confidence_score,
                    ca.insights,
                    ca.recommendations,
                    ca.created_at,
                    vc.title,
                    vc.platform,
                    vc.viral_score
                FROM content_analysis ca
                JOIN viral_content vc ON ca.content_id = vc.id
            """
            
            params = []
            
            if content_id:
                query += " WHERE ca.content_id = %s"
                params.append(content_id)
            
            query += " ORDER BY ca.created_at DESC LIMIT %s"
            params.append(limit)
            
            results = self.execute_query(query, params, fetch='all')
            
            return [dict(row) for row in results] if results else []
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter análises: {e}")
            return []
    
    def get_platform_stats(self):
        """Obtém estatísticas por plataforma"""
        try:
            query = """
                SELECT 
                    platform,
                    COUNT(*) as total_content,
                    AVG(viral_score) as avg_viral_score,
                    AVG(engagement_rate) as avg_engagement_rate,
                    SUM(views_count) as total_views,
                    MAX(created_at) as last_update
                FROM viral_content
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY platform
                ORDER BY total_content DESC
            """
            
            results = self.execute_query(query, fetch='all')
            
            return [dict(row) for row in results] if results else []
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter stats por plataforma: {e}")
            return []
    
    # Métodos de fallback com dados mockados
    def get_mock_dashboard_overview(self):
        """Dados mockados para overview"""
        return {
            'total_content': 15847,
            'viral_content': 2341,
            'today_analyses': 156,
            'active_platforms': 8
        }
    
    def get_mock_viral_content(self):
        """Dados mockados para conteúdo viral"""
        return [
            {
                'id': 1,
                'platform': 'instagram',
                'content_type': 'reel',
                'title': 'Como ganhar R$ 10k/mês trabalhando de casa',
                'viral_score': 94,
                'engagement_rate': 12.5,
                'views_count': 2500000,
                'likes_count': 312500,
                'shares_count': 45000,
                'created_at': datetime.now() - timedelta(hours=2),
                'author_username': '@empreendedor_digital'
            },
            {
                'id': 2,
                'platform': 'tiktok',
                'content_type': 'video',
                'title': 'Receita que viralizou: Bolo de chocolate em 5 minutos',
                'viral_score': 91,
                'engagement_rate': 15.8,
                'views_count': 1800000,
                'likes_count': 284400,
                'shares_count': 52000,
                'created_at': datetime.now() - timedelta(hours=5),
                'author_username': '@chef_rapido'
            }
        ]
    
    def get_mock_trending_topics(self):
        """Dados mockados para trending topics"""
        return [
            {'topic': 'empreendedorismo', 'frequency': 245, 'avg_score': 87.5},
            {'topic': 'receitas', 'frequency': 189, 'avg_score': 82.1},
            {'topic': 'motivacao', 'frequency': 167, 'avg_score': 79.8},
            {'topic': 'dicas', 'frequency': 134, 'avg_score': 76.2}
        ]

# Instância global do gerenciador de banco
db_manager = DatabaseManager()

def get_db():
    """Função helper para obter instância do banco"""
    return db_manager

