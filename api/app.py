"""
VIRAL CONTENT SCRAPER API
Sistema de API REST para análise inteligente de conteúdo viral

Autor: Manus AI
Data: 27 de Janeiro de 2025
Versão: 1.0.0
"""

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
import os
import logging
import traceback
from datetime import datetime, timedelta
import asyncio
import asyncpg
import redis
import json
from functools import wraps
import hashlib
import uuid

# Importar módulos do sistema
import sys
sys.path.append('/home/ubuntu/viral_content_scraper')

from ai_agents.src.base_agent import BaseAgent
from ai_agents.src.memory.evolutionary_memory import EvolutionaryMemory
from scrapers.src.index import ScrapingCoordinator

# Configuração da aplicação
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Configurar CORS
CORS(app, origins=['http://localhost:3000', 'http://localhost:8080'])

# Configurar JWT
jwt = JWTManager(app)

# Configurar Rate Limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["1000 per hour", "100 per minute"]
)

# Configurar Redis para cache
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler('/home/ubuntu/viral_content_scraper/logs/api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Pool de conexões PostgreSQL
db_pool = None

# Instâncias dos componentes principais
scraping_coordinator = None
evolutionary_memory = None

async def init_database():
    """Inicializa pool de conexões com PostgreSQL"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 5432)),
            user=os.getenv('DB_USER', 'viral_user'),
            password=os.getenv('DB_PASSWORD', 'viral_password'),
            database=os.getenv('DB_NAME', 'viral_content_db'),
            min_size=5,
            max_size=20
        )
        logger.info("Pool de conexões PostgreSQL inicializado")
    except Exception as e:
        logger.error(f"Erro ao inicializar PostgreSQL: {e}")
        raise

def init_components():
    """Inicializa componentes principais do sistema"""
    global scraping_coordinator, evolutionary_memory
    
    try:
        # Inicializar coordenador de scraping
        scraping_coordinator = ScrapingCoordinator({
            'max_concurrent_scrapers': 5,
            'enable_proxy_rotation': True,
            'enable_rate_limiting': True
        })
        
        # Inicializar memória evolutiva
        evolutionary_memory = EvolutionaryMemory({
            'supabase_url': os.getenv('SUPABASE_URL'),
            'supabase_key': os.getenv('SUPABASE_SERVICE_KEY'),
            'enable_evolution': True,
            'evolution_interval_hours': 24
        })
        
        logger.info("Componentes principais inicializados")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar componentes: {e}")
        raise

# Decorador para validação de dados
def validate_json(*required_fields):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type deve ser application/json'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'JSON inválido'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': f'Campos obrigatórios ausentes: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Decorador para cache Redis
def cache_response(timeout=300):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Gerar chave de cache baseada na URL e parâmetros
            cache_key = f"api_cache:{request.endpoint}:{hashlib.md5(str(request.args).encode()).hexdigest()}"
            
            # Tentar recuperar do cache
            try:
                cached_result = redis_client.get(cache_key)
                if cached_result:
                    logger.info(f"Cache hit para {cache_key}")
                    return jsonify(json.loads(cached_result))
            except Exception as e:
                logger.warning(f"Erro ao acessar cache: {e}")
            
            # Executar função e cachear resultado
            result = f(*args, **kwargs)
            
            try:
                if isinstance(result, tuple) and len(result) == 2:
                    response_data, status_code = result
                    if status_code == 200:
                        redis_client.setex(cache_key, timeout, json.dumps(response_data.get_json()))
                else:
                    redis_client.setex(cache_key, timeout, json.dumps(result.get_json()))
            except Exception as e:
                logger.warning(f"Erro ao salvar no cache: {e}")
            
            return result
        return decorated_function
    return decorator

# Middleware para logging de requisições
@app.before_request
def log_request():
    g.start_time = datetime.utcnow()
    logger.info(f"Requisição: {request.method} {request.path} - IP: {request.remote_addr}")

@app.after_request
def log_response(response):
    duration = datetime.utcnow() - g.start_time
    logger.info(f"Resposta: {response.status_code} - Duração: {duration.total_seconds():.3f}s")
    return response

# Handler de erros global
@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Erro não tratado: {error}")
    logger.error(traceback.format_exc())
    
    return jsonify({
        'error': 'Erro interno do servidor',
        'message': str(error) if app.debug else 'Entre em contato com o suporte',
        'timestamp': datetime.utcnow().isoformat()
    }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint não encontrado',
        'message': f'O endpoint {request.path} não existe',
        'available_endpoints': [
            '/api/v1/health',
            '/api/v1/auth/login',
            '/api/v1/content',
            '/api/v1/analysis',
            '/api/v1/trends'
        ]
    }), 404

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit excedido',
        'message': 'Muitas requisições. Tente novamente em alguns minutos.',
        'retry_after': str(e.retry_after)
    }), 429

# =====================================================
# ENDPOINTS DE SISTEMA
# =====================================================

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Verificação de saúde do sistema"""
    try:
        # Verificar PostgreSQL
        async def check_db():
            async with db_pool.acquire() as conn:
                await conn.fetchval('SELECT 1')
        
        asyncio.run(check_db())
        db_status = 'healthy'
    except:
        db_status = 'unhealthy'
    
    # Verificar Redis
    try:
        redis_client.ping()
        redis_status = 'healthy'
    except:
        redis_status = 'unhealthy'
    
    # Verificar componentes
    components_status = {
        'scraping_coordinator': 'healthy' if scraping_coordinator else 'unhealthy',
        'evolutionary_memory': 'healthy' if evolutionary_memory else 'unhealthy'
    }
    
    overall_status = 'healthy' if all([
        db_status == 'healthy',
        redis_status == 'healthy',
        all(status == 'healthy' for status in components_status.values())
    ]) else 'unhealthy'
    
    return jsonify({
        'status': overall_status,
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'components': {
            'database': db_status,
            'redis': redis_status,
            **components_status
        },
        'uptime': 'N/A'  # Implementar contador de uptime se necessário
    })

@app.route('/api/v1/stats', methods=['GET'])
@jwt_required()
@cache_response(timeout=60)
def system_stats():
    """Estatísticas gerais do sistema"""
    try:
        async def get_stats():
            async with db_pool.acquire() as conn:
                # Contar conteúdo total
                total_content = await conn.fetchval(
                    "SELECT COUNT(*) FROM scraped_content WHERE is_active = true"
                )
                
                # Contar conteúdo por plataforma
                platform_stats = await conn.fetch("""
                    SELECT platform, COUNT(*) as count
                    FROM scraped_content 
                    WHERE is_active = true 
                    GROUP BY platform
                """)
                
                # Análises realizadas hoje
                analyses_today = await conn.fetchval("""
                    SELECT COUNT(*) FROM content_analyses 
                    WHERE analyzed_at >= CURRENT_DATE
                """)
                
                # Conteúdo viral detectado (últimas 24h)
                viral_content = await conn.fetchval("""
                    SELECT COUNT(*) FROM content_analyses ca
                    JOIN scraped_content sc ON ca.content_id = sc.id
                    WHERE ca.viral_potential_score > 0.8 
                    AND ca.analyzed_at >= NOW() - INTERVAL '24 hours'
                """)
                
                return {
                    'total_content': total_content,
                    'platform_distribution': {row['platform']: row['count'] for row in platform_stats},
                    'analyses_today': analyses_today,
                    'viral_content_24h': viral_content
                }
        
        stats = asyncio.run(get_stats())
        
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return jsonify({'error': 'Erro ao obter estatísticas'}), 500

# =====================================================
# ENDPOINTS DE AUTENTICAÇÃO
# =====================================================

@app.route('/api/v1/auth/login', methods=['POST'])
@validate_json('username', 'password')
@limiter.limit("5 per minute")
def login():
    """Autenticação de usuário"""
    data = request.get_json()
    username = data['username']
    password = data['password']
    
    # Verificar credenciais (implementar com banco de dados real)
    # Por enquanto, usar credenciais hardcoded para desenvolvimento
    if username == 'admin' and password == 'admin123':
        access_token = create_access_token(
            identity=username,
            additional_claims={
                'role': 'admin',
                'permissions': ['read', 'write', 'admin']
            }
        )
        
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': {
                'username': username,
                'role': 'admin',
                'permissions': ['read', 'write', 'admin']
            }
        })
    
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/v1/auth/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Renovar token de acesso"""
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    
    return jsonify({
        'success': True,
        'access_token': new_token
    })

@app.route('/api/v1/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obter informações do usuário atual"""
    current_user = get_jwt_identity()
    
    return jsonify({
        'success': True,
        'user': {
            'username': current_user,
            'role': 'admin',  # Implementar busca real no banco
            'permissions': ['read', 'write', 'admin']
        }
    })

# =====================================================
# ENDPOINTS DE CONTEÚDO
# =====================================================

@app.route('/api/v1/content', methods=['GET'])
@jwt_required()
@cache_response(timeout=300)
def get_content():
    """Listar conteúdo coletado com filtros"""
    try:
        # Parâmetros de consulta
        platform = request.args.get('platform')
        content_type = request.args.get('content_type')
        author = request.args.get('author')
        hashtag = request.args.get('hashtag')
        language = request.args.get('language')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = min(int(request.args.get('limit', 50)), 1000)
        offset = int(request.args.get('offset', 0))
        sort_by = request.args.get('sort_by', 'scraped_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        async def fetch_content():
            async with db_pool.acquire() as conn:
                # Construir query dinamicamente
                where_conditions = ["sc.is_active = true"]
                params = []
                param_count = 0
                
                if platform:
                    param_count += 1
                    where_conditions.append(f"sc.platform = ${param_count}")
                    params.append(platform)
                
                if content_type:
                    param_count += 1
                    where_conditions.append(f"sc.content_type = ${param_count}")
                    params.append(content_type)
                
                if author:
                    param_count += 1
                    where_conditions.append(f"sc.author_username ILIKE ${param_count}")
                    params.append(f"%{author}%")
                
                if hashtag:
                    param_count += 1
                    where_conditions.append(f"${param_count} = ANY(sc.hashtags)")
                    params.append(hashtag)
                
                if language:
                    param_count += 1
                    where_conditions.append(f"sc.language = ${param_count}")
                    params.append(language)
                
                if date_from:
                    param_count += 1
                    where_conditions.append(f"sc.scraped_at >= ${param_count}")
                    params.append(date_from)
                
                if date_to:
                    param_count += 1
                    where_conditions.append(f"sc.scraped_at <= ${param_count}")
                    params.append(date_to)
                
                where_clause = " AND ".join(where_conditions)
                
                # Query principal
                query = f"""
                    SELECT 
                        sc.id,
                        sc.platform,
                        sc.platform_content_id,
                        sc.content_type,
                        sc.url,
                        sc.title,
                        sc.description,
                        sc.author_username,
                        sc.author_display_name,
                        sc.author_followers_count,
                        sc.hashtags,
                        sc.mentions,
                        sc.language,
                        sc.scraped_at,
                        sc.published_at,
                        cm.likes_count,
                        cm.comments_count,
                        cm.shares_count,
                        cm.views_count,
                        cm.engagement_rate,
                        ca.overall_score,
                        ca.viral_potential_score,
                        ca.sentiment_polarity
                    FROM scraped_content sc
                    LEFT JOIN LATERAL (
                        SELECT * FROM content_metrics 
                        WHERE content_id = sc.id 
                        ORDER BY collected_at DESC 
                        LIMIT 1
                    ) cm ON true
                    LEFT JOIN LATERAL (
                        SELECT * FROM content_analyses 
                        WHERE content_id = sc.id AND analysis_type = 'comprehensive'
                        ORDER BY analyzed_at DESC 
                        LIMIT 1
                    ) ca ON true
                    WHERE {where_clause}
                    ORDER BY sc.{sort_by} {sort_order.upper()}
                    LIMIT ${param_count + 1} OFFSET ${param_count + 2}
                """
                
                params.extend([limit, offset])
                
                # Executar query
                rows = await conn.fetch(query, *params)
                
                # Contar total de registros
                count_query = f"SELECT COUNT(*) FROM scraped_content sc WHERE {where_clause}"
                total_count = await conn.fetchval(count_query, *params[:-2])  # Remover limit e offset
                
                return rows, total_count
        
        content_rows, total_count = asyncio.run(fetch_content())
        
        # Converter para formato JSON
        content_list = []
        for row in content_rows:
            content_list.append({
                'id': str(row['id']),
                'platform': row['platform'],
                'platform_content_id': row['platform_content_id'],
                'content_type': row['content_type'],
                'url': row['url'],
                'title': row['title'],
                'description': row['description'],
                'author': {
                    'username': row['author_username'],
                    'display_name': row['author_display_name'],
                    'followers_count': row['author_followers_count']
                },
                'hashtags': row['hashtags'] or [],
                'mentions': row['mentions'] or [],
                'language': row['language'],
                'scraped_at': row['scraped_at'].isoformat() if row['scraped_at'] else None,
                'published_at': row['published_at'].isoformat() if row['published_at'] else None,
                'metrics': {
                    'likes_count': row['likes_count'] or 0,
                    'comments_count': row['comments_count'] or 0,
                    'shares_count': row['shares_count'] or 0,
                    'views_count': row['views_count'] or 0,
                    'engagement_rate': float(row['engagement_rate']) if row['engagement_rate'] else 0
                },
                'analysis': {
                    'overall_score': float(row['overall_score']) if row['overall_score'] else None,
                    'viral_potential_score': float(row['viral_potential_score']) if row['viral_potential_score'] else None,
                    'sentiment_polarity': row['sentiment_polarity']
                }
            })
        
        return jsonify({
            'success': True,
            'data': content_list,
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_next': offset + limit < total_count,
                'has_prev': offset > 0
            },
            'filters_applied': {
                'platform': platform,
                'content_type': content_type,
                'author': author,
                'hashtag': hashtag,
                'language': language,
                'date_from': date_from,
                'date_to': date_to
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar conteúdo: {e}")
        return jsonify({'error': 'Erro ao buscar conteúdo'}), 500

@app.route('/api/v1/content/<content_id>', methods=['GET'])
@jwt_required()
@cache_response(timeout=600)
def get_content_detail(content_id):
    """Obter detalhes completos de um conteúdo específico"""
    try:
        async def fetch_content_detail():
            async with db_pool.acquire() as conn:
                # Buscar conteúdo principal
                content = await conn.fetchrow("""
                    SELECT * FROM scraped_content 
                    WHERE id = $1 AND is_active = true
                """, uuid.UUID(content_id))
                
                if not content:
                    return None, None, None
                
                # Buscar métricas (histórico)
                metrics = await conn.fetch("""
                    SELECT * FROM content_metrics 
                    WHERE content_id = $1 
                    ORDER BY collected_at DESC
                """, uuid.UUID(content_id))
                
                # Buscar análises
                analyses = await conn.fetch("""
                    SELECT * FROM content_analyses 
                    WHERE content_id = $1 
                    ORDER BY analyzed_at DESC
                """, uuid.UUID(content_id))
                
                return content, metrics, analyses
        
        content, metrics, analyses = asyncio.run(fetch_content_detail())
        
        if not content:
            return jsonify({'error': 'Conteúdo não encontrado'}), 404
        
        # Formatar resposta
        response_data = {
            'id': str(content['id']),
            'platform': content['platform'],
            'platform_content_id': content['platform_content_id'],
            'content_type': content['content_type'],
            'url': content['url'],
            'title': content['title'],
            'description': content['description'],
            'content_text': content['content_text'],
            'author': {
                'username': content['author_username'],
                'display_name': content['author_display_name'],
                'id': content['author_id'],
                'followers_count': content['author_followers_count'],
                'verified': content['author_verified']
            },
            'hashtags': content['hashtags'] or [],
            'mentions': content['mentions'] or [],
            'media_urls': content['media_urls'] or [],
            'media_types': content['media_types'] or [],
            'language': content['language'],
            'scraped_at': content['scraped_at'].isoformat(),
            'published_at': content['published_at'].isoformat() if content['published_at'] else None,
            'last_updated': content['last_updated'].isoformat(),
            'metadata': content['metadata'] or {},
            'metrics_history': [],
            'analyses': []
        }
        
        # Adicionar histórico de métricas
        for metric in metrics:
            response_data['metrics_history'].append({
                'collected_at': metric['collected_at'].isoformat(),
                'likes_count': metric['likes_count'],
                'comments_count': metric['comments_count'],
                'shares_count': metric['shares_count'],
                'saves_count': metric['saves_count'],
                'views_count': metric['views_count'],
                'impressions_count': metric['impressions_count'],
                'reach_count': metric['reach_count'],
                'engagement_rate': float(metric['engagement_rate']) if metric['engagement_rate'] else None,
                'platform_specific_metrics': metric['platform_specific_metrics'] or {},
                'calculated_metrics': metric['calculated_metrics'] or {}
            })
        
        # Adicionar análises
        for analysis in analyses:
            analysis_data = {
                'id': str(analysis['id']),
                'analysis_type': analysis['analysis_type'],
                'analyzer_name': analysis['analyzer_name'],
                'analyzer_version': analysis['analyzer_version'],
                'analyzed_at': analysis['analyzed_at'].isoformat(),
                'processing_time_ms': analysis['processing_time_ms'],
                'success': analysis['success'],
                'confidence_score': float(analysis['confidence_score']) if analysis['confidence_score'] else None,
                'overall_score': float(analysis['overall_score']) if analysis['overall_score'] else None
            }
            
            # Adicionar dados específicos de análise
            if analysis['analysis_type'] == 'sentiment' or analysis['analysis_type'] == 'comprehensive':
                analysis_data.update({
                    'sentiment_score': float(analysis['sentiment_score']) if analysis['sentiment_score'] else None,
                    'sentiment_polarity': analysis['sentiment_polarity'],
                    'dominant_emotion': analysis['dominant_emotion'],
                    'emotional_intensity': float(analysis['emotional_intensity']) if analysis['emotional_intensity'] else None,
                    'sentiment_analysis': analysis['sentiment_analysis'] or {}
                })
            
            if analysis['analysis_type'] == 'visual' or analysis['analysis_type'] == 'comprehensive':
                analysis_data.update({
                    'visual_quality_score': float(analysis['visual_quality_score']) if analysis['visual_quality_score'] else None,
                    'color_harmony_score': float(analysis['color_harmony_score']) if analysis['color_harmony_score'] else None,
                    'composition_score': float(analysis['composition_score']) if analysis['composition_score'] else None,
                    'face_count': analysis['face_count'],
                    'visual_analysis': analysis['visual_analysis'] or {}
                })
            
            if analysis['analysis_type'] == 'metrics' or analysis['analysis_type'] == 'comprehensive':
                analysis_data.update({
                    'viral_potential_score': float(analysis['viral_potential_score']) if analysis['viral_potential_score'] else None,
                    'engagement_prediction': float(analysis['engagement_prediction']) if analysis['engagement_prediction'] else None,
                    'trend_direction': analysis['trend_direction'],
                    'trend_strength': float(analysis['trend_strength']) if analysis['trend_strength'] else None,
                    'metrics_analysis': analysis['metrics_analysis'] or {},
                    'predictions': analysis['predictions'] or {}
                })
            
            # Adicionar dados detalhados
            analysis_data.update({
                'recommendations': analysis['recommendations'] or {},
                'analysis_metadata': analysis['analysis_metadata'] or {}
            })
            
            if not analysis['success'] and analysis['error_details']:
                analysis_data['error_details'] = analysis['error_details']
            
            response_data['analyses'].append(analysis_data)
        
        return jsonify({
            'success': True,
            'data': response_data
        })
        
    except ValueError:
        return jsonify({'error': 'ID de conteúdo inválido'}), 400
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do conteúdo: {e}")
        return jsonify({'error': 'Erro ao buscar detalhes do conteúdo'}), 500

# Inicialização da aplicação
def create_app():
    """Factory function para criar a aplicação"""
    # Inicializar componentes
    asyncio.run(init_database())
    init_components()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('API_PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )

