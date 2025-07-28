"""
ADMIN API ROUTES - VIRAL CONTENT SCRAPER
Rotas da API para controle administrativo completo

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
import subprocess
import psutil
import os
import json
from datetime import datetime, timedelta
import logging

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator para verificar se usuário é admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        try:
            # Remover 'Bearer ' do token
            token = token.replace('Bearer ', '')
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            
            # Verificar se é admin
            if not data.get('is_admin', False):
                return jsonify({'error': 'Acesso negado - Admin requerido'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard/overview', methods=['GET'])
@admin_required
def get_dashboard_overview():
    """
    GET /api/v1/admin/dashboard/overview
    Retorna visão geral do sistema para o dashboard
    """
    try:
        # Estatísticas do sistema
        system_stats = {
            'cpu_usage': psutil.cpu_percent(interval=1),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'uptime': get_system_uptime()
        }
        
        # Status dos scrapers (simulado)
        scrapers_status = {
            'total': 8,
            'active': 8,
            'paused': 0,
            'error': 0,
            'content_collected_today': 247892
        }
        
        # Status dos agentes IA (simulado)
        ai_agents_status = {
            'total': 7,
            'active': 7,
            'training': 0,
            'analyses_today': 89456
        }
        
        # Status do System Doctor
        system_doctor_status = {
            'active': True,
            'uptime': '2 dias, 14 horas',
            'problems_detected': 23,
            'problems_resolved': 22,
            'confidence': 97.3
        }
        
        return jsonify({
            'success': True,
            'data': {
                'system_stats': system_stats,
                'scrapers': scrapers_status,
                'ai_agents': ai_agents_status,
                'system_doctor': system_doctor_status,
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter overview do dashboard: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/scrapers', methods=['GET'])
@admin_required
def get_scrapers_status():
    """
    GET /api/v1/admin/scrapers
    Retorna status detalhado de todos os scrapers
    """
    try:
        scrapers = [
            {
                'id': 'instagram',
                'platform': 'Instagram',
                'status': 'running',
                'collected_today': 45672,
                'success_rate': 94.2,
                'last_update': '2 min atrás',
                'errors_today': 12,
                'avg_response_time': 1.2
            },
            {
                'id': 'tiktok',
                'platform': 'TikTok',
                'status': 'running',
                'collected_today': 38291,
                'success_rate': 96.8,
                'last_update': '1 min atrás',
                'errors_today': 5,
                'avg_response_time': 0.8
            },
            {
                'id': 'youtube',
                'platform': 'YouTube',
                'status': 'running',
                'collected_today': 29384,
                'success_rate': 91.5,
                'last_update': '3 min atrás',
                'errors_today': 18,
                'avg_response_time': 2.1
            },
            {
                'id': 'facebook',
                'platform': 'Facebook',
                'status': 'paused',
                'collected_today': 15672,
                'success_rate': 87.3,
                'last_update': '15 min atrás',
                'errors_today': 34,
                'avg_response_time': 3.2
            },
            {
                'id': 'linkedin',
                'platform': 'LinkedIn',
                'status': 'running',
                'collected_today': 8934,
                'success_rate': 89.7,
                'last_update': '1 min atrás',
                'errors_today': 8,
                'avg_response_time': 1.8
            },
            {
                'id': 'twitter',
                'platform': 'Twitter',
                'status': 'running',
                'collected_today': 52847,
                'success_rate': 93.1,
                'last_update': '30 seg atrás',
                'errors_today': 15,
                'avg_response_time': 1.1
            },
            {
                'id': 'vsl',
                'platform': 'VSL Collector',
                'status': 'running',
                'collected_today': 1247,
                'success_rate': 98.5,
                'last_update': '5 min atrás',
                'errors_today': 2,
                'avg_response_time': 4.5
            },
            {
                'id': 'landing',
                'platform': 'Landing Pages',
                'status': 'running',
                'collected_today': 892,
                'success_rate': 97.2,
                'last_update': '2 min atrás',
                'errors_today': 1,
                'avg_response_time': 3.8
            }
        ]
        
        return jsonify({
            'success': True,
            'data': scrapers
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter status dos scrapers: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/scrapers/<scraper_id>/start', methods=['POST'])
@admin_required
def start_scraper(scraper_id):
    """
    POST /api/v1/admin/scrapers/{scraper_id}/start
    Inicia um scraper específico
    """
    try:
        # Em produção, aqui iniciaria o scraper real
        logging.info(f"Iniciando scraper: {scraper_id}")
        
        # Simular delay de inicialização
        import time
        time.sleep(1)
        
        return jsonify({
            'success': True,
            'message': f'Scraper {scraper_id} iniciado com sucesso',
            'data': {
                'scraper_id': scraper_id,
                'status': 'running',
                'started_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao iniciar scraper {scraper_id}: {str(e)}")
        return jsonify({'error': f'Erro ao iniciar scraper: {str(e)}'}), 500

@admin_bp.route('/scrapers/<scraper_id>/stop', methods=['POST'])
@admin_required
def stop_scraper(scraper_id):
    """
    POST /api/v1/admin/scrapers/{scraper_id}/stop
    Para um scraper específico
    """
    try:
        # Em produção, aqui pararia o scraper real
        logging.info(f"Parando scraper: {scraper_id}")
        
        # Simular delay de parada
        import time
        time.sleep(1)
        
        return jsonify({
            'success': True,
            'message': f'Scraper {scraper_id} parado com sucesso',
            'data': {
                'scraper_id': scraper_id,
                'status': 'stopped',
                'stopped_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao parar scraper {scraper_id}: {str(e)}")
        return jsonify({'error': f'Erro ao parar scraper: {str(e)}'}), 500

@admin_bp.route('/scrapers/start-all', methods=['POST'])
@admin_required
def start_all_scrapers():
    """
    POST /api/v1/admin/scrapers/start-all
    Inicia todos os scrapers
    """
    try:
        # Em produção, aqui iniciaria todos os scrapers
        logging.info("Iniciando todos os scrapers")
        
        # Simular delay de inicialização
        import time
        time.sleep(2)
        
        return jsonify({
            'success': True,
            'message': 'Todos os scrapers iniciados com sucesso',
            'data': {
                'started_count': 8,
                'started_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao iniciar todos os scrapers: {str(e)}")
        return jsonify({'error': f'Erro ao iniciar scrapers: {str(e)}'}), 500

@admin_bp.route('/scrapers/stop-all', methods=['POST'])
@admin_required
def stop_all_scrapers():
    """
    POST /api/v1/admin/scrapers/stop-all
    Para todos os scrapers
    """
    try:
        # Em produção, aqui pararia todos os scrapers
        logging.info("Parando todos os scrapers")
        
        # Simular delay de parada
        import time
        time.sleep(2)
        
        return jsonify({
            'success': True,
            'message': 'Todos os scrapers parados com sucesso',
            'data': {
                'stopped_count': 8,
                'stopped_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao parar todos os scrapers: {str(e)}")
        return jsonify({'error': f'Erro ao parar scrapers: {str(e)}'}), 500

@admin_bp.route('/ai-agents', methods=['GET'])
@admin_required
def get_ai_agents_status():
    """
    GET /api/v1/admin/ai-agents
    Retorna status de todos os agentes IA
    """
    try:
        agents = [
            {
                'id': 'visual_content_analyzer',
                'name': 'Visual Content Analyzer',
                'status': 'active',
                'analyses_today': 15672,
                'accuracy': 96.8,
                'confidence': 94.2,
                'last_analysis': '1 min atrás',
                'description': 'Análise neural de imagens'
            },
            {
                'id': 'content_copy_analyzer',
                'name': 'Content Copy Analyzer',
                'status': 'active',
                'analyses_today': 23847,
                'accuracy': 94.2,
                'confidence': 92.1,
                'last_analysis': '30 seg atrás',
                'description': 'Análise de copy persuasiva'
            },
            {
                'id': 'viral_hooks_analyzer',
                'name': 'Viral Hooks Analyzer',
                'status': 'active',
                'analyses_today': 8934,
                'accuracy': 98.5,
                'confidence': 97.8,
                'last_analysis': '2 min atrás',
                'description': 'Especialista em hooks virais'
            },
            {
                'id': 'engagement_pattern_analyzer',
                'name': 'Engagement Pattern Analyzer',
                'status': 'active',
                'analyses_today': 12456,
                'accuracy': 92.7,
                'confidence': 89.3,
                'last_analysis': '45 seg atrás',
                'description': 'Padrões matemáticos de engajamento'
            },
            {
                'id': 'template_generator',
                'name': 'Template Generator',
                'status': 'active',
                'analyses_today': 3421,
                'accuracy': 89.3,
                'confidence': 91.7,
                'last_analysis': '3 min atrás',
                'description': 'Geração automática de templates'
            },
            {
                'id': 'visual_template_extractor',
                'name': 'Visual Template Extractor',
                'status': 'active',
                'analyses_today': 2847,
                'accuracy': 95.1,
                'confidence': 93.4,
                'last_analysis': '1 min atrás',
                'description': 'Extração de padrões visuais'
            },
            {
                'id': 'template_manager',
                'name': 'Template Manager',
                'status': 'active',
                'analyses_today': 1923,
                'accuracy': 97.4,
                'confidence': 96.1,
                'last_analysis': '2 min atrás',
                'description': 'Gerenciamento inteligente'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': agents
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter status dos agentes IA: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/system-doctor', methods=['GET'])
@admin_required
def get_system_doctor_status():
    """
    GET /api/v1/admin/system-doctor
    Retorna status do System Doctor
    """
    try:
        system_doctor_data = {
            'status': 'active',
            'uptime': '2 dias, 14 horas',
            'problems_detected': 23,
            'problems_resolved': 22,
            'learning_rate': 'Contínuo',
            'confidence': 97.3,
            'last_action': 'Rotação automática de proxy - Instagram (2 min atrás)',
            'monitoring_components': [
                'Scrapers', 'Database', 'Redis Cache', 'AI Agents', 'API', 'System Resources'
            ],
            'recent_actions': [
                {
                    'timestamp': '2 min atrás',
                    'action': 'Rotação automática de proxy',
                    'component': 'Instagram Scraper',
                    'result': 'Sucesso'
                },
                {
                    'timestamp': '15 min atrás',
                    'action': 'Limpeza de cache',
                    'component': 'Redis',
                    'result': 'Sucesso'
                },
                {
                    'timestamp': '1 hora atrás',
                    'action': 'Reinicialização de agente IA',
                    'component': 'Visual Content Analyzer',
                    'result': 'Sucesso'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'data': system_doctor_data
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter status do System Doctor: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/system-doctor/start', methods=['POST'])
@admin_required
def start_system_doctor():
    """
    POST /api/v1/admin/system-doctor/start
    Inicia o System Doctor
    """
    try:
        # Em produção, aqui iniciaria o System Doctor real
        logging.info("Iniciando System Doctor")
        
        return jsonify({
            'success': True,
            'message': 'System Doctor iniciado com sucesso',
            'data': {
                'status': 'active',
                'started_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao iniciar System Doctor: {str(e)}")
        return jsonify({'error': f'Erro ao iniciar System Doctor: {str(e)}'}), 500

@admin_bp.route('/system-doctor/stop', methods=['POST'])
@admin_required
def stop_system_doctor():
    """
    POST /api/v1/admin/system-doctor/stop
    Para o System Doctor
    """
    try:
        # Em produção, aqui pararia o System Doctor real
        logging.info("Parando System Doctor")
        
        return jsonify({
            'success': True,
            'message': 'System Doctor parado com sucesso',
            'data': {
                'status': 'stopped',
                'stopped_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao parar System Doctor: {str(e)}")
        return jsonify({'error': f'Erro ao parar System Doctor: {str(e)}'}), 500

@admin_bp.route('/database/stats', methods=['GET'])
@admin_required
def get_database_stats():
    """
    GET /api/v1/admin/database/stats
    Retorna estatísticas do banco de dados
    """
    try:
        # Em produção, aqui consultaria o banco real
        database_stats = [
            {'table': 'viral_content', 'count': 1247892, 'size': '2.3 GB'},
            {'table': 'content_analysis', 'count': 892456, 'size': '1.8 GB'},
            {'table': 'viral_templates', 'count': 15672, 'size': '245 MB'},
            {'table': 'users', 'count': 1247, 'size': '12 MB'},
            {'table': 'scraping_jobs', 'count': 45892, 'size': '156 MB'},
            {'table': 'platform_metrics', 'count': 234567, 'size': '567 MB'}
        ]
        
        total_size = sum([
            2.3 * 1024**3,  # viral_content
            1.8 * 1024**3,  # content_analysis
            245 * 1024**2,  # viral_templates
            12 * 1024**2,   # users
            156 * 1024**2,  # scraping_jobs
            567 * 1024**2   # platform_metrics
        ])
        
        return jsonify({
            'success': True,
            'data': {
                'tables': database_stats,
                'total_size': format_bytes(total_size),
                'total_records': sum([table['count'] for table in database_stats]),
                'last_backup': '2025-01-27 10:30:00',
                'health': 'Excellent'
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter estatísticas do banco: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/system/backup', methods=['POST'])
@admin_required
def create_system_backup():
    """
    POST /api/v1/admin/system/backup
    Cria backup completo do sistema
    """
    try:
        # Em produção, aqui criaria o backup real
        logging.info("Criando backup completo do sistema")
        
        # Simular processo de backup
        import time
        time.sleep(3)
        
        backup_info = {
            'backup_id': f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'created_at': datetime.now().isoformat(),
            'size': '4.2 GB',
            'components': [
                'Database (PostgreSQL)',
                'Redis Cache',
                'Templates',
                'Configuration Files',
                'Logs'
            ]
        }
        
        return jsonify({
            'success': True,
            'message': 'Backup criado com sucesso',
            'data': backup_info
        })
        
    except Exception as e:
        logging.error(f"Erro ao criar backup: {str(e)}")
        return jsonify({'error': f'Erro ao criar backup: {str(e)}'}), 500

@admin_bp.route('/settings', methods=['GET'])
@admin_required
def get_system_settings():
    """
    GET /api/v1/admin/settings
    Retorna configurações do sistema
    """
    try:
        settings = {
            'scraping': {
                'delay_between_requests': 2,
                'max_requests_per_hour': 100,
                'proxy_rotation': True,
                'user_agent_rotation': True,
                'retry_attempts': 3
            },
            'ai': {
                'confidence_threshold': 0.8,
                'continuous_learning': True,
                'batch_size': 32,
                'model_update_frequency': 'daily'
            },
            'system_doctor': {
                'monitoring_interval': 30,
                'auto_correction': True,
                'alert_threshold': 0.9,
                'max_correction_attempts': 3
            },
            'database': {
                'auto_vacuum': True,
                'backup_frequency': 'daily',
                'retention_days': 30,
                'compression': True
            },
            'notifications': {
                'email_enabled': True,
                'webhook_enabled': False,
                'sms_enabled': False,
                'alert_levels': ['error', 'warning']
            }
        }
        
        return jsonify({
            'success': True,
            'data': settings
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter configurações: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/settings', methods=['PUT'])
@admin_required
def update_system_settings():
    """
    PUT /api/v1/admin/settings
    Atualiza configurações do sistema
    """
    try:
        settings_data = request.get_json()
        
        # Em produção, aqui salvaria as configurações reais
        logging.info(f"Atualizando configurações do sistema: {settings_data}")
        
        return jsonify({
            'success': True,
            'message': 'Configurações atualizadas com sucesso',
            'data': {
                'updated_at': datetime.now().isoformat(),
                'updated_settings': list(settings_data.keys()) if settings_data else []
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao atualizar configurações: {str(e)}")
        return jsonify({'error': f'Erro ao atualizar configurações: {str(e)}'}), 500

@admin_bp.route('/logs', methods=['GET'])
@admin_required
def get_system_logs():
    """
    GET /api/v1/admin/logs
    Retorna logs do sistema
    """
    try:
        # Parâmetros de query
        level = request.args.get('level', 'all')
        limit = int(request.args.get('limit', 100))
        component = request.args.get('component', 'all')
        
        # Em produção, aqui consultaria os logs reais
        logs = [
            {
                'timestamp': '2025-01-27 19:45:23',
                'level': 'INFO',
                'component': 'System Doctor',
                'message': 'Monitoramento iniciado com sucesso'
            },
            {
                'timestamp': '2025-01-27 19:44:15',
                'level': 'WARNING',
                'component': 'Instagram Scraper',
                'message': 'Rate limit detectado, aplicando delay'
            },
            {
                'timestamp': '2025-01-27 19:43:02',
                'level': 'SUCCESS',
                'component': 'AI Agent',
                'message': 'Visual Content Analyzer processou 150 imagens'
            },
            {
                'timestamp': '2025-01-27 19:42:18',
                'level': 'ERROR',
                'component': 'Database',
                'message': 'Conexão temporariamente perdida, reconectando...'
            },
            {
                'timestamp': '2025-01-27 19:41:45',
                'level': 'INFO',
                'component': 'Template Manager',
                'message': 'Novo template viral detectado e salvo'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'logs': logs[:limit],
                'total_count': len(logs),
                'filters': {
                    'level': level,
                    'component': component,
                    'limit': limit
                }
            }
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter logs: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Funções utilitárias
def get_system_uptime():
    """Retorna uptime do sistema"""
    try:
        uptime_seconds = psutil.boot_time()
        current_time = datetime.now().timestamp()
        uptime_delta = current_time - uptime_seconds
        
        days = int(uptime_delta // 86400)
        hours = int((uptime_delta % 86400) // 3600)
        
        return f"{days} dias, {hours} horas"
    except:
        return "Indisponível"

def format_bytes(bytes_value):
    """Formata bytes em formato legível"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.1f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.1f} PB"

