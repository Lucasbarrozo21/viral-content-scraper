"""
FLASK API WITH SUPABASE - VIRAL CONTENT SCRAPER
API Flask completamente integrada com Supabase

Autor: Manus AI
Data: 28 de Janeiro de 2025
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
import jwt
import os
from supabase_client import supabase_client

# Criar aplicação Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'viral-content-scraper-secret-key-2025'

# Configurar CORS
CORS(app, origins=['*'])

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# MIDDLEWARE DE AUTENTICAÇÃO
# ============================================================================

def require_auth(f):
    """Decorator para rotas que requerem autenticação"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        try:
            # Remover 'Bearer ' do token
            token = token.replace('Bearer ', '')
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user_id = data.get('user_id')
            request.user_email = data.get('email')
            request.is_admin = data.get('is_admin', False)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    """Decorator para rotas que requerem privilégios de admin"""
    from functools import wraps
    
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if not request.is_admin:
            return jsonify({'error': 'Acesso negado - Admin requerido'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ============================================================================
# ROTAS DE AUTENTICAÇÃO
# ============================================================================

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """Login de usuário"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')  # Em produção, verificar hash
        
        if not email:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        # Buscar usuário no Supabase
        user = supabase_client.get_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Em produção, verificar senha hash aqui
        # Por enquanto, aceitar qualquer senha para demo
        
        # Atualizar último login
        supabase_client.update_user_last_login(user['id'])
        
        # Gerar token JWT
        token_data = {
            'user_id': user['id'],
            'email': user['email'],
            'is_admin': user['role'] == 'admin',
            'exp': datetime.utcnow().timestamp() + 86400  # 24 horas
        }
        
        token = jwt.encode(token_data, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role'],
                'permissions': user.get('permissions', {}),
                'preferences': user.get('preferences', {})
            }
        })
        
    except Exception as e:
        logger.error(f"Erro no login: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE DASHBOARD
# ============================================================================

@app.route('/api/v1/dashboard/overview', methods=['GET'])
@require_auth
def dashboard_overview():
    """Visão geral do dashboard"""
    try:
        stats = supabase_client.get_dashboard_stats()
        
        # Adicionar métricas simuladas para demo
        overview_data = {
            'system_stats': {
                'cpu_usage': 23.5,
                'memory_usage': 67.2,
                'disk_usage': 45.8,
                'uptime': '2 dias, 14 horas'
            },
            'scrapers': {
                'total': 8,
                'active': 8,
                'paused': 0,
                'error': 0,
                'content_collected_today': sum(stats.get('content_by_platform', {}).values())
            },
            'ai_agents': {
                'total': 7,
                'active': 7,
                'training': 0,
                'analyses_today': stats.get('analyses_today', 0)
            },
            'system_doctor': {
                'active': True,
                'uptime': '2 dias, 14 horas',
                'problems_detected': 23,
                'problems_resolved': 22,
                'confidence': 97.3
            },
            'content_stats': stats.get('content_by_platform', {}),
            'templates_count': stats.get('total_templates', 0),
            'last_updated': stats.get('last_updated', datetime.now().isoformat())
        }
        
        return jsonify({
            'success': True,
            'data': overview_data
        })
        
    except Exception as e:
        logger.error(f"Erro no dashboard overview: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE CONTEÚDO VIRAL
# ============================================================================

@app.route('/api/v1/content/viral', methods=['GET'])
@require_auth
def get_viral_content():
    """Obtém conteúdo viral"""
    try:
        platform = request.args.get('platform')
        min_viral_score = float(request.args.get('min_viral_score', 0))
        limit = int(request.args.get('limit', 100))
        
        content = supabase_client.get_viral_content(
            platform=platform,
            min_viral_score=min_viral_score,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': content,
            'count': len(content)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter conteúdo viral: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/content/viral', methods=['POST'])
@require_auth
def save_viral_content():
    """Salva novo conteúdo viral"""
    try:
        content_data = request.get_json()
        
        if not content_data:
            return jsonify({'error': 'Dados do conteúdo são obrigatórios'}), 400
        
        # Adicionar timestamp
        content_data['collected_at'] = datetime.now().isoformat()
        
        # Salvar no Supabase
        result = supabase_client.save_viral_content(content_data)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Conteúdo viral salvo com sucesso',
                'data': result
            })
        else:
            return jsonify({'error': 'Erro ao salvar conteúdo'}), 500
        
    except Exception as e:
        logger.error(f"Erro ao salvar conteúdo viral: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/content/trending', methods=['GET'])
@require_auth
def get_trending_content():
    """Obtém conteúdo trending"""
    try:
        platform = request.args.get('platform')
        hours_back = int(request.args.get('hours_back', 24))
        min_viral_score = float(request.args.get('min_viral_score', 70))
        
        trending = supabase_client.get_trending_content(
            platform=platform,
            hours_back=hours_back,
            min_viral_score=min_viral_score
        )
        
        return jsonify({
            'success': True,
            'data': trending,
            'count': len(trending)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter conteúdo trending: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE TEMPLATES
# ============================================================================

@app.route('/api/v1/templates', methods=['GET'])
@require_auth
def get_templates():
    """Obtém templates virais"""
    try:
        platform = request.args.get('platform')
        min_viral_score = float(request.args.get('min_viral_score', 0))
        limit = int(request.args.get('limit', 50))
        
        templates = supabase_client.get_viral_templates(
            platform=platform,
            min_viral_score=min_viral_score,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': templates,
            'count': len(templates)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter templates: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/templates', methods=['POST'])
@require_auth
def save_template():
    """Salva novo template viral"""
    try:
        template_data = request.get_json()
        
        if not template_data:
            return jsonify({'error': 'Dados do template são obrigatórios'}), 400
        
        # Salvar no Supabase
        result = supabase_client.save_viral_template(template_data)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Template salvo com sucesso',
                'data': result
            })
        else:
            return jsonify({'error': 'Erro ao salvar template'}), 500
        
    except Exception as e:
        logger.error(f"Erro ao salvar template: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/templates/<template_id>/use', methods=['POST'])
@require_auth
def use_template(template_id):
    """Incrementa uso do template"""
    try:
        result = supabase_client.increment_template_usage(template_id)
        
        return jsonify({
            'success': True,
            'message': 'Uso do template registrado',
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Erro ao registrar uso do template: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE ANÁLISE
# ============================================================================

@app.route('/api/v1/analysis', methods=['GET'])
@require_auth
def get_analysis():
    """Obtém análises de conteúdo"""
    try:
        content_id = request.args.get('content_id')
        agent_name = request.args.get('agent_name')
        limit = int(request.args.get('limit', 100))
        
        analyses = supabase_client.get_content_analysis(
            content_id=content_id,
            agent_name=agent_name,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': analyses,
            'count': len(analyses)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter análises: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/analysis', methods=['POST'])
@require_auth
def save_analysis():
    """Salva nova análise de conteúdo"""
    try:
        analysis_data = request.get_json()
        
        if not analysis_data:
            return jsonify({'error': 'Dados da análise são obrigatórios'}), 400
        
        # Salvar no Supabase
        result = supabase_client.save_content_analysis(analysis_data)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Análise salva com sucesso',
                'data': result
            })
        else:
            return jsonify({'error': 'Erro ao salvar análise'}), 500
        
    except Exception as e:
        logger.error(f"Erro ao salvar análise: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE SCRAPING
# ============================================================================

@app.route('/api/v1/scraping/jobs', methods=['GET'])
@require_auth
def get_scraping_jobs():
    """Obtém jobs de scraping"""
    try:
        platform = request.args.get('platform')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 100))
        
        jobs = supabase_client.get_scraping_jobs(
            platform=platform,
            status=status,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': jobs,
            'count': len(jobs)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter jobs de scraping: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/scraping/jobs', methods=['POST'])
@require_auth
def create_scraping_job():
    """Cria novo job de scraping"""
    try:
        job_data = request.get_json()
        
        if not job_data:
            return jsonify({'error': 'Dados do job são obrigatórios'}), 400
        
        # Adicionar status inicial
        job_data['status'] = 'pending'
        job_data['created_at'] = datetime.now().isoformat()
        
        # Salvar no Supabase
        result = supabase_client.save_scraping_job(job_data)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Job de scraping criado com sucesso',
                'data': result
            })
        else:
            return jsonify({'error': 'Erro ao criar job'}), 500
        
    except Exception as e:
        logger.error(f"Erro ao criar job de scraping: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE SYSTEM DOCTOR
# ============================================================================

@app.route('/api/v1/system-doctor/actions', methods=['GET'])
@require_admin
def get_system_doctor_actions():
    """Obtém ações do System Doctor"""
    try:
        component = request.args.get('component')
        limit = int(request.args.get('limit', 100))
        
        actions = supabase_client.get_system_doctor_actions(
            component=component,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': actions,
            'count': len(actions)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter ações do System Doctor: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/system-doctor/actions', methods=['POST'])
@require_admin
def save_system_doctor_action():
    """Salva ação do System Doctor"""
    try:
        action_data = request.get_json()
        
        if not action_data:
            return jsonify({'error': 'Dados da ação são obrigatórios'}), 400
        
        # Salvar no Supabase
        result = supabase_client.save_system_doctor_action(action_data)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Ação do System Doctor salva com sucesso',
                'data': result
            })
        else:
            return jsonify({'error': 'Erro ao salvar ação'}), 500
        
    except Exception as e:
        logger.error(f"Erro ao salvar ação do System Doctor: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE LOGS
# ============================================================================

@app.route('/api/v1/logs', methods=['GET'])
@require_admin
def get_logs():
    """Obtém logs do sistema"""
    try:
        component = request.args.get('component')
        level = request.args.get('level')
        limit = int(request.args.get('limit', 100))
        
        logs = supabase_client.get_system_logs(
            component=component,
            level=level,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': logs,
            'count': len(logs)
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter logs: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/v1/logs', methods=['POST'])
@require_auth
def save_log():
    """Salva log do sistema"""
    try:
        log_data = request.get_json()
        
        if not log_data:
            return jsonify({'error': 'Dados do log são obrigatórios'}), 400
        
        # Adicionar timestamp se não fornecido
        if 'timestamp' not in log_data:
            log_data['timestamp'] = datetime.now().isoformat()
        
        # Salvar no Supabase
        result = supabase_client.save_system_log(log_data)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Log salvo com sucesso',
                'data': result
            })
        else:
            return jsonify({'error': 'Erro ao salvar log'}), 500
        
    except Exception as e:
        logger.error(f"Erro ao salvar log: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# ROTAS DE SAÚDE E STATUS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check da API"""
    try:
        # Testar conexão com Supabase
        supabase_ok = supabase_client.test_connection()
        
        return jsonify({
            'status': 'healthy' if supabase_ok else 'degraded',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'supabase': 'ok' if supabase_ok else 'error',
                'api': 'ok'
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/v1/status', methods=['GET'])
def api_status():
    """Status detalhado da API"""
    try:
        stats = supabase_client.get_dashboard_stats()
        
        return jsonify({
            'success': True,
            'api_version': '1.0.0',
            'timestamp': datetime.now().isoformat(),
            'database': 'supabase',
            'statistics': stats
        })
        
    except Exception as e:
        logger.error(f"Erro no status da API: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================================
# TRATAMENTO DE ERROS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Requisição inválida'}), 400

# ============================================================================
# INICIALIZAÇÃO
# ============================================================================

if __name__ == '__main__':
    print("🚀 INICIANDO API FLASK COM SUPABASE")
    print("="*50)
    
    # Testar conexão com Supabase
    if supabase_client.test_connection():
        print("✅ Conexão com Supabase estabelecida")
        
        # Obter estatísticas
        stats = supabase_client.get_dashboard_stats()
        print(f"📊 Conteúdo no banco: {sum(stats.get('content_by_platform', {}).values())}")
        print(f"🎨 Templates disponíveis: {stats.get('total_templates', 0)}")
        
        print("\n🌐 API rodando em: http://localhost:5000")
        print("📋 Endpoints disponíveis:")
        print("  • GET  /health - Health check")
        print("  • POST /api/v1/auth/login - Login")
        print("  • GET  /api/v1/dashboard/overview - Dashboard")
        print("  • GET  /api/v1/content/viral - Conteúdo viral")
        print("  • GET  /api/v1/templates - Templates")
        print("  • GET  /api/v1/analysis - Análises")
        print("  • GET  /api/v1/logs - Logs (admin)")
        
        print("\n🔑 Login de teste:")
        print("  Email: admin@viralcontentscraper.com")
        print("  Senha: qualquer (demo)")
        
        print("\n" + "="*50)
        
        # Iniciar servidor
        app.run(host='0.0.0.0', port=5000, debug=True)
        
    else:
        print("❌ Falha na conexão com Supabase")
        print("Verifique se o schema SQL foi executado no dashboard do Supabase")
        exit(1)

