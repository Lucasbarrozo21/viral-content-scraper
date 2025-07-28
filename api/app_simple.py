"""
VIRAL CONTENT SCRAPER API - VERSÃO SIMPLIFICADA
Aplicação Flask funcional para demonstração

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
        """Log de todas as requisições"""
        logger.info(f"REQUEST: {request.method} {request.path} - IP: {request.remote_addr}")
    
    @app.after_request
    def log_response(response):
        """Log de todas as respostas"""
        logger.info(f"RESPONSE: {request.method} {request.path} - Status: {response.status_code}")
        
        # Headers de segurança
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key'
        
        return response
    
    # Tratamento global de erros
    @app.errorhandler(404)
    def handle_not_found(error):
        """Tratar erros 404"""
        return jsonify({
            'success': False,
            'error': 'Endpoint não encontrado',
            'error_code': 'NOT_FOUND',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Tratar erros internos"""
        error_id = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        logger.error(f"Internal Server Error [{error_id}]: {str(error)}")
        
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_SERVER_ERROR',
            'error_id': error_id,
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    
    # Endpoints básicos
    @app.route('/health', methods=['GET'])
    def health_check():
        """Verificar saúde da aplicação"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': 'v1',
            'services': {
                'api': 'healthy'
            }
        })
    
    @app.route('/info', methods=['GET'])
    def api_info():
        """Informações da API"""
        return jsonify({
            'name': 'Viral Content Scraper API',
            'description': 'API para scraping inteligente de conteúdo viral',
            'version': 'v1',
            'documentation': '/api/v1/docs',
            'health_check': '/health',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoints': {
                'dashboard': '/api/v1/dashboard',
                'analysis': '/api/v1/analysis',
                'scraping': '/api/v1/scraping',
                'trends': '/api/v1/trends',
                'templates': '/api/v1/templates',
                'profiles': '/api/v1/profiles',
                'admin': '/api/v1/admin',
                'webhooks': '/api/v1/webhooks'
            }
        })
    
    @app.route('/', methods=['GET'])
    def root():
        """Endpoint raiz"""
        return jsonify({
            'message': 'Viral Content Scraper API',
            'version': 'v1',
            'status': 'online',
            'documentation': '/api/v1/docs',
            'health': '/health',
            'info': '/info',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # DASHBOARD ENDPOINTS
    @app.route('/api/v1/dashboard/overview', methods=['GET'])
    def dashboard_overview():
        """Obter visão geral do dashboard"""
        try:
            overview_data = {
                'total_content': 15420,
                'viral_content': 1240,
                'active_scrapers': 8,
                'ai_analyses': 3280,
                'growth_rate': 12.5,
                'engagement_rate': 4.2,
                'platforms_active': ['instagram', 'tiktok', 'youtube', 'linkedin'],
                'last_updated': datetime.utcnow().isoformat(),
                'system_status': 'healthy',
                'api_calls_today': 2847,
                'storage_used_gb': 15.7,
                'processing_queue': 23
            }
            
            return jsonify({
                'success': True,
                'data': overview_data,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Erro ao obter visão geral: {str(e)}'
            }), 500
    
    @app.route('/api/v1/dashboard/stats', methods=['GET'])
    def dashboard_stats():
        """Obter estatísticas detalhadas do dashboard"""
        try:
            period = request.args.get('period', '7d')
            
            # Dados por plataforma
            content_by_platform = [
                {'platform': 'Instagram', 'count': 8500, 'color': '#E4405F'},
                {'platform': 'TikTok', 'count': 4200, 'color': '#000000'},
                {'platform': 'YouTube', 'count': 2100, 'color': '#FF0000'},
                {'platform': 'LinkedIn', 'count': 620, 'color': '#0077B5'}
            ]
            
            # Distribuição de score viral
            viral_score_distribution = [
                {'range': '0-20', 'count': 2100},
                {'range': '21-40', 'count': 4800},
                {'range': '41-60', 'count': 5200},
                {'range': '61-80', 'count': 2500},
                {'range': '81-100', 'count': 820}
            ]
            
            # Atividade diária (últimos 7 dias)
            daily_activity = []
            base_date = datetime.now() - timedelta(days=6)
            
            for i in range(7):
                current_date = base_date + timedelta(days=i)
                daily_activity.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'scraped': random.randint(800, 1500),
                    'analyzed': random.randint(700, 1300),
                    'viral': random.randint(40, 100)
                })
            
            stats_data = {
                'period': period,
                'content_by_platform': content_by_platform,
                'viral_score_distribution': viral_score_distribution,
                'daily_activity': daily_activity,
                'summary': {
                    'total_posts_period': sum(day['scraped'] for day in daily_activity),
                    'total_viral_period': sum(day['viral'] for day in daily_activity),
                    'avg_viral_rate': round(sum(day['viral'] for day in daily_activity) / sum(day['scraped'] for day in daily_activity) * 100, 2),
                    'most_active_platform': max(content_by_platform, key=lambda x: x['count'])['platform']
                }
            }
            
            return jsonify({
                'success': True,
                'data': stats_data,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Erro ao obter estatísticas: {str(e)}'
            }), 500
    
    @app.route('/api/v1/dashboard/activity', methods=['GET'])
    def dashboard_activity():
        """Obter atividade recente do sistema"""
        try:
            limit = request.args.get('limit', 10, type=int)
            
            activities = []
            activity_types = [
                {
                    'type': 'viral_content',
                    'title': 'Conteúdo viral detectado',
                    'descriptions': [
                        'Post do @influencer com 85K likes',
                        'Reel com 120K visualizações em 2h',
                        'Carrossel com 95K likes e 2.5K comentários'
                    ]
                },
                {
                    'type': 'scraping_completed',
                    'title': 'Scraping concluído',
                    'descriptions': [
                        'Hashtag #fitness - 150 posts coletados',
                        'Perfil @creator - 80 posts analisados',
                        'Trending TikTok - 200 vídeos processados'
                    ]
                },
                {
                    'type': 'template_generated',
                    'title': 'Template extraído',
                    'descriptions': [
                        'Carrossel de receitas saudáveis',
                        'Template de motivação matinal',
                        'Layout de dicas de negócios'
                    ]
                }
            ]
            
            platforms = ['instagram', 'tiktok', 'youtube', 'linkedin']
            
            for i in range(min(limit, 20)):
                activity_type = random.choice(activity_types)
                
                activity = {
                    'id': i + 1,
                    'type': activity_type['type'],
                    'title': activity_type['title'],
                    'description': random.choice(activity_type['descriptions']),
                    'timestamp': (datetime.utcnow() - timedelta(minutes=random.randint(1, 120))).isoformat(),
                    'platform': random.choice(platforms)
                }
                
                activities.append(activity)
            
            # Ordenar por timestamp (mais recente primeiro)
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return jsonify({
                'success': True,
                'data': {
                    'activities': activities,
                    'total_count': len(activities),
                    'has_more': len(activities) == limit,
                    'last_updated': datetime.utcnow().isoformat()
                },
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Erro ao obter atividade recente: {str(e)}'
            }), 500
    
    # ANÁLISE ENDPOINTS
    @app.route('/api/v1/analysis/content/<int:content_id>', methods=['POST'])
    def analyze_content(content_id):
        """Analisar conteúdo específico"""
        try:
            analysis_result = {
                'content_id': content_id,
                'sentiment': {
                    'polarity': random.uniform(-1, 1),
                    'subjectivity': random.uniform(0, 1),
                    'emotion': random.choice(['joy', 'anger', 'fear', 'sadness', 'surprise', 'disgust', 'trust', 'anticipation'])
                },
                'visual': {
                    'composition_score': random.randint(60, 95),
                    'color_harmony': random.randint(70, 100),
                    'viral_potential': random.randint(50, 90)
                },
                'metrics': {
                    'engagement_rate': random.uniform(2.5, 8.5),
                    'viral_score': random.randint(40, 95),
                    'trend_alignment': random.uniform(0.6, 0.95)
                },
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
            return jsonify({
                'success': True,
                'data': analysis_result,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Erro na análise: {str(e)}'
            }), 500
    
    # SCRAPING ENDPOINTS
    @app.route('/api/v1/scraping/start', methods=['POST'])
    def start_scraping():
        """Iniciar sessão de scraping"""
        try:
            data = request.get_json() or {}
            platform = data.get('platform', 'instagram')
            target = data.get('target', 'trending')
            
            session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            return jsonify({
                'success': True,
                'data': {
                    'session_id': session_id,
                    'platform': platform,
                    'target': target,
                    'status': 'started',
                    'estimated_duration': '5-10 minutes'
                },
                'message': f'Scraping iniciado para {platform}',
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Erro ao iniciar scraping: {str(e)}'
            }), 500
    
    # TENDÊNCIAS ENDPOINTS
    @app.route('/api/v1/trends/viral', methods=['GET'])
    def get_viral_trends():
        """Obter tendências virais"""
        try:
            viral_content = []
            
            for i in range(10):
                content = {
                    'id': i + 1,
                    'platform': random.choice(['instagram', 'tiktok', 'youtube']),
                    'type': random.choice(['reel', 'post', 'video']),
                    'viral_score': random.randint(70, 95),
                    'engagement_rate': random.uniform(5.0, 15.0),
                    'likes': random.randint(10000, 500000),
                    'comments': random.randint(500, 25000),
                    'shares': random.randint(100, 10000),
                    'created_at': (datetime.utcnow() - timedelta(hours=random.randint(1, 48))).isoformat()
                }
                viral_content.append(content)
            
            return jsonify({
                'success': True,
                'data': {
                    'viral_content': viral_content,
                    'total_count': len(viral_content),
                    'period': '24h'
                },
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Erro ao obter tendências: {str(e)}'
            }), 500
    
    # Endpoint para CORS preflight
    @app.route('/api/v1/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        """Tratar requisições OPTIONS para CORS"""
        return '', 200
    
    logger.info("Aplicação Flask criada com sucesso")
    
    return app

# Criar aplicação
app = create_app()

if __name__ == '__main__':
    # Configurações de execução
    host = '0.0.0.0'  # Permitir acesso externo
    port = int(os.getenv('PORT', 5000))
    debug = True
    
    logger.info(f"Iniciando servidor em {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    
    # Iniciar aplicação
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True,
        use_reloader=debug
    )

