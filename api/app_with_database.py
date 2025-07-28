"""
VIRAL CONTENT SCRAPER API - VERSÃO COM BANCO DE DADOS
Aplicação Flask conectada com PostgreSQL

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import os
import sys
import logging
import json
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import traceback

# Importar módulo de banco de dados
from database import get_db

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app():
    """Factory function para criar aplicação Flask"""
    
    app = Flask(__name__)
    
    # Configurações da aplicação
    app.config.update(
        SECRET_KEY='viral_scraper_secret_2025',
        DEBUG=True,
        
        # Configurações de CORS
        CORS_ORIGINS=['*'],
        CORS_METHODS=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        CORS_HEADERS=['Content-Type', 'Authorization', 'X-API-Key'],
    )
    
    # Configurar CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         methods=app.config['CORS_METHODS'],
         allow_headers=app.config['CORS_HEADERS'],
         supports_credentials=True)
    
    # Middleware para logging de requisições
    @app.before_request
    def log_request():
        logger.info(f"📥 {request.method} {request.path} - {request.remote_addr}")
    
    @app.after_request
    def log_response(response):
        logger.info(f"📤 {request.method} {request.path} - {response.status_code}")
        return response
    
    # Handler de erro global
    @app.errorhandler(Exception)
    def handle_error(error):
        logger.error(f"❌ Erro não tratado: {error}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'error': str(error),
            'message': 'Erro interno do servidor'
        }), 500
    
    # Inicializar banco de dados
    db = get_db()
    
    # Registrar blueprints
    app.register_blueprint(create_dashboard_routes(db))
    app.register_blueprint(create_analysis_routes(db))
    app.register_blueprint(create_scraping_routes(db))
    app.register_blueprint(create_trends_routes(db))
    app.register_blueprint(create_templates_routes(db))
    
    # Rota de health check
    @app.route('/health')
    def health_check():
        try:
            # Testar conexão com banco
            db.test_connection()
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'database': 'connected',
                'version': '2.0'
            })
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'database': 'disconnected',
                'error': str(e)
            }), 503
    
    return app

def create_dashboard_routes(db):
    """Cria rotas do dashboard"""
    
    dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/v1/dashboard')
    
    @dashboard_bp.route('/overview')
    def get_overview():
        """Obtém visão geral do dashboard"""
        try:
            data = db.get_dashboard_overview()
            
            return jsonify({
                'success': True,
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter overview: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @dashboard_bp.route('/metrics')
    def get_metrics():
        """Obtém métricas principais"""
        try:
            # Obter estatísticas por plataforma
            platform_stats = db.get_platform_stats()
            
            # Obter conteúdo viral recente
            viral_content = db.get_viral_content(limit=10, min_score=85)
            
            # Calcular métricas agregadas
            total_views = sum(content.get('views_count', 0) for content in viral_content)
            avg_engagement = sum(content.get('engagement_rate', 0) for content in viral_content) / len(viral_content) if viral_content else 0
            
            return jsonify({
                'success': True,
                'data': {
                    'platform_stats': platform_stats,
                    'viral_content_sample': viral_content,
                    'aggregated_metrics': {
                        'total_views': total_views,
                        'avg_engagement_rate': round(avg_engagement, 2),
                        'platforms_count': len(platform_stats)
                    }
                },
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter métricas: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @dashboard_bp.route('/charts')
    def get_charts_data():
        """Obtém dados para gráficos"""
        try:
            # Dados para gráfico de engajamento por plataforma
            platform_stats = db.get_platform_stats()
            
            # Dados para gráfico temporal (últimos 7 dias)
            temporal_data = []
            for i in range(7):
                date = datetime.now() - timedelta(days=i)
                # Aqui você pode implementar query específica para dados temporais
                temporal_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'content_count': random.randint(50, 200),
                    'viral_count': random.randint(5, 25)
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'platform_engagement': [
                        {
                            'platform': stat['platform'],
                            'engagement_rate': float(stat['avg_engagement_rate'] or 0),
                            'content_count': stat['total_content']
                        }
                        for stat in platform_stats
                    ],
                    'temporal_data': temporal_data[::-1]  # Reverter para ordem cronológica
                },
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter dados de gráficos: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    return dashboard_bp

def create_analysis_routes(db):
    """Cria rotas de análise"""
    
    analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')
    
    @analysis_bp.route('/content', methods=['POST'])
    def analyze_content():
        """Analisa conteúdo enviado"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'Dados não fornecidos'
                }), 400
            
            # Aqui você integraria com os agentes IA
            # Por enquanto, retornamos análise mockada
            analysis_result = {
                'visual_analysis': {
                    'score': random.randint(70, 95),
                    'elements': ['cores vibrantes', 'composição equilibrada', 'call-to-action claro'],
                    'recommendations': ['Melhorar contraste', 'Adicionar mais elementos visuais']
                },
                'copy_analysis': {
                    'score': random.randint(75, 90),
                    'hooks': ['curiosidade', 'urgência', 'prova social'],
                    'sentiment': 'positive',
                    'readability': 8.5
                },
                'viral_potential': random.randint(80, 98)
            }
            
            return jsonify({
                'success': True,
                'data': analysis_result,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro na análise de conteúdo: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @analysis_bp.route('/sentiment', methods=['POST'])
    def analyze_sentiment():
        """Analisa sentimento do texto"""
        try:
            data = request.get_json()
            text = data.get('text', '')
            
            if not text:
                return jsonify({
                    'success': False,
                    'error': 'Texto não fornecido'
                }), 400
            
            # Análise de sentimento mockada
            sentiment_result = {
                'overall_sentiment': random.choice(['positive', 'negative', 'neutral']),
                'confidence': random.uniform(0.7, 0.95),
                'emotions': {
                    'joy': random.uniform(0.1, 0.8),
                    'anger': random.uniform(0.0, 0.3),
                    'fear': random.uniform(0.0, 0.2),
                    'sadness': random.uniform(0.0, 0.3),
                    'surprise': random.uniform(0.1, 0.6)
                },
                'keywords': ['sucesso', 'oportunidade', 'crescimento', 'resultado']
            }
            
            return jsonify({
                'success': True,
                'data': sentiment_result,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro na análise de sentimento: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @analysis_bp.route('/history')
    def get_analysis_history():
        """Obtém histórico de análises"""
        try:
            limit = request.args.get('limit', 50, type=int)
            content_id = request.args.get('content_id', type=int)
            
            analyses = db.get_content_analysis(content_id=content_id, limit=limit)
            
            return jsonify({
                'success': True,
                'data': analyses,
                'count': len(analyses),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter histórico: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    return analysis_bp

def create_scraping_routes(db):
    """Cria rotas de scraping"""
    
    scraping_bp = Blueprint('scraping', __name__, url_prefix='/api/v1/scraping')
    
    @scraping_bp.route('/instagram', methods=['POST'])
    def scrape_instagram():
        """Inicia scraping do Instagram"""
        try:
            data = request.get_json()
            target = data.get('target', '')
            
            # Aqui você integraria com o scraper real
            # Por enquanto, simulamos o processo
            
            return jsonify({
                'success': True,
                'message': f'Scraping do Instagram iniciado para: {target}',
                'job_id': f'instagram_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                'estimated_time': '5-10 minutos',
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro no scraping Instagram: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @scraping_bp.route('/tiktok', methods=['POST'])
    def scrape_tiktok():
        """Inicia scraping do TikTok"""
        try:
            data = request.get_json()
            target = data.get('target', '')
            
            return jsonify({
                'success': True,
                'message': f'Scraping do TikTok iniciado para: {target}',
                'job_id': f'tiktok_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                'estimated_time': '3-8 minutos',
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro no scraping TikTok: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @scraping_bp.route('/status/<job_id>')
    def get_scraping_status(job_id):
        """Obtém status do job de scraping"""
        try:
            # Simular status baseado no job_id
            status = random.choice(['running', 'completed', 'failed'])
            progress = random.randint(0, 100) if status == 'running' else 100
            
            return jsonify({
                'success': True,
                'data': {
                    'job_id': job_id,
                    'status': status,
                    'progress': progress,
                    'items_collected': random.randint(50, 500) if status in ['completed', 'running'] else 0,
                    'estimated_remaining': '2 minutos' if status == 'running' else None
                },
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter status: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    return scraping_bp

def create_trends_routes(db):
    """Cria rotas de tendências"""
    
    trends_bp = Blueprint('trends', __name__, url_prefix='/api/v1/trends')
    
    @trends_bp.route('/viral-content')
    def get_viral_content():
        """Obtém conteúdo viral"""
        try:
            limit = request.args.get('limit', 50, type=int)
            platform = request.args.get('platform')
            min_score = request.args.get('min_score', 70, type=int)
            
            viral_content = db.get_viral_content(
                limit=limit,
                platform=platform,
                min_score=min_score
            )
            
            return jsonify({
                'success': True,
                'data': viral_content,
                'count': len(viral_content),
                'filters': {
                    'platform': platform,
                    'min_score': min_score,
                    'limit': limit
                },
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter conteúdo viral: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @trends_bp.route('/hashtags')
    def get_trending_hashtags():
        """Obtém hashtags em alta"""
        try:
            limit = request.args.get('limit', 20, type=int)
            
            trending_topics = db.get_trending_topics(limit=limit)
            
            return jsonify({
                'success': True,
                'data': trending_topics,
                'count': len(trending_topics),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter hashtags: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @trends_bp.route('/predictions')
    def get_trend_predictions():
        """Obtém previsões de tendências"""
        try:
            # Dados mockados para previsões
            predictions = [
                {
                    'trend': 'IA Generativa',
                    'probability': 0.89,
                    'expected_peak': '2025-02-15',
                    'platforms': ['linkedin', 'twitter', 'youtube'],
                    'category': 'technology'
                },
                {
                    'trend': 'Receitas Fitness',
                    'probability': 0.76,
                    'expected_peak': '2025-02-01',
                    'platforms': ['instagram', 'tiktok'],
                    'category': 'health'
                }
            ]
            
            return jsonify({
                'success': True,
                'data': predictions,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter previsões: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    return trends_bp

def create_templates_routes(db):
    """Cria rotas de templates"""
    
    templates_bp = Blueprint('templates', __name__, url_prefix='/api/v1/templates')
    
    @templates_bp.route('/')
    def get_templates():
        """Obtém lista de templates"""
        try:
            # Dados mockados para templates
            templates = [
                {
                    'id': 1,
                    'name': 'Template Motivacional Instagram',
                    'platform': 'instagram',
                    'type': 'post',
                    'viral_score': 92,
                    'usage_count': 1247,
                    'created_at': datetime.now() - timedelta(days=5)
                },
                {
                    'id': 2,
                    'name': 'Template Carrossel Educativo',
                    'platform': 'instagram',
                    'type': 'carousel',
                    'viral_score': 88,
                    'usage_count': 856,
                    'created_at': datetime.now() - timedelta(days=12)
                }
            ]
            
            return jsonify({
                'success': True,
                'data': templates,
                'count': len(templates),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter templates: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @templates_bp.route('/<int:template_id>')
    def get_template(template_id):
        """Obtém template específico"""
        try:
            # Template mockado
            template = {
                'id': template_id,
                'name': f'Template {template_id}',
                'description': 'Template viral para Instagram',
                'structure': {
                    'layout': 'grid_3x3',
                    'colors': ['#FF6B6B', '#4ECDC4', '#45B7D1'],
                    'fonts': ['Montserrat', 'Open Sans'],
                    'elements': ['headline', 'image', 'cta']
                },
                'performance': {
                    'viral_score': random.randint(80, 95),
                    'usage_count': random.randint(100, 2000),
                    'success_rate': random.uniform(0.7, 0.95)
                }
            }
            
            return jsonify({
                'success': True,
                'data': template,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter template: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    return templates_bp

# Criar aplicação
app = create_app()

if __name__ == '__main__':
    print("🚀 Iniciando Viral Content Scraper API com Banco de Dados...")
    print("📊 Dashboard: http://localhost:5000/api/v1/dashboard/overview")
    print("🔍 Health Check: http://localhost:5000/health")
    print("📚 Documentação: Em desenvolvimento")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )

