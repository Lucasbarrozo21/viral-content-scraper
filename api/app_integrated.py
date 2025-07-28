"""
VIRAL CONTENT SCRAPER API
Aplicação Flask integrada completa

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g, Blueprint
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
import traceback

# Adicionar diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar utilitários
try:
    from utils.auth import AuthError, get_current_user
    from utils.cache import cache, cache_health_check
    from utils.validators import ValidationError
except ImportError:
    # Fallback para imports absolutos
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from utils.auth import AuthError, get_current_user
    from utils.cache import cache, cache_health_check
    from utils.validators import ValidationError

# Importar blueprints
try:
    from routes.dashboard import dashboard_bp
    from routes.analysis import analysis_bp
    from routes.scraping import scraping_bp
    from routes.trends import trends_bp
    from routes.templates import templates_bp
    from routes.profiles import profiles_bp
    from routes.admin import admin_bp
    from routes.webhooks import webhooks_bp
    from routes.auth import auth_bp
except ImportError as e:
    logger.error(f"Erro ao importar blueprints: {e}")
    # Criar blueprints vazios para evitar erro
    dashboard_bp = Blueprint('dashboard', __name__)
    analysis_bp = Blueprint('analysis', __name__)
    scraping_bp = Blueprint('scraping', __name__)
    trends_bp = Blueprint('trends', __name__)
    templates_bp = Blueprint('templates', __name__)
    profiles_bp = Blueprint('profiles', __name__)
    admin_bp = Blueprint('admin', __name__)
    webhooks_bp = Blueprint('webhooks', __name__)
    auth_bp = Blueprint('auth', __name__)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/ubuntu/viral_content_scraper/logs/api.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def create_app():
    """Factory function para criar aplicação Flask"""
    
    app = Flask(__name__)
    
    # Configurações da aplicação
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'viral_scraper_secret_2025'),
        DEBUG=os.getenv('DEBUG', 'False').lower() == 'true',
        TESTING=os.getenv('TESTING', 'False').lower() == 'true',
        
        # Configurações de banco de dados
        DATABASE_URL=os.getenv('DATABASE_URL', 'postgresql://viral_user:viral_password@localhost:5432/viral_content_db'),
        
        # Configurações Redis
        REDIS_URL=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        
        # Configurações de rate limiting
        RATELIMIT_STORAGE_URL=os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
        RATELIMIT_DEFAULT="1000 per hour, 100 per minute",
        
        # Configurações de CORS
        CORS_ORIGINS=['*'],
        CORS_METHODS=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        CORS_HEADERS=['Content-Type', 'Authorization', 'X-API-Key'],
        
        # Configurações de upload
        MAX_CONTENT_LENGTH=50 * 1024 * 1024,  # 50MB
        UPLOAD_FOLDER='/home/ubuntu/viral_content_scraper/uploads',
        
        # Configurações de API
        API_VERSION='v1',
        API_TITLE='Viral Content Scraper API',
        API_DESCRIPTION='API para scraping inteligente de conteúdo viral',
        
        # Configurações de segurança
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        PERMANENT_SESSION_LIFETIME=timedelta(hours=24)
    )
    
    # Configurar CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         methods=app.config['CORS_METHODS'],
         allow_headers=app.config['CORS_HEADERS'],
         supports_credentials=True)
    
    # Configurar Rate Limiting
    limiter = Limiter(
        app,
        key_func=get_remote_address,
        default_limits=[app.config['RATELIMIT_DEFAULT']],
        storage_uri=app.config['RATELIMIT_STORAGE_URL']
    )
    
    # Criar diretórios necessários
    os.makedirs('/home/ubuntu/viral_content_scraper/logs', exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Middleware para logging de requisições
    @app.before_request
    def log_request():
        """Log de todas as requisições"""
        g.start_time = datetime.utcnow()
        
        # Log da requisição
        logger.info(f"REQUEST: {request.method} {request.path} - IP: {request.remote_addr} - User-Agent: {request.headers.get('User-Agent', 'Unknown')}")
        
        # Log do payload para POST/PUT
        if request.method in ['POST', 'PUT'] and request.is_json:
            # Não logar dados sensíveis
            data = request.get_json() or {}
            safe_data = {k: v for k, v in data.items() if k not in ['password', 'token', 'api_key']}
            if safe_data:
                logger.info(f"REQUEST PAYLOAD: {safe_data}")
    
    @app.after_request
    def log_response(response):
        """Log de todas as respostas"""
        if hasattr(g, 'start_time'):
            duration = (datetime.utcnow() - g.start_time).total_seconds() * 1000
            
            logger.info(f"RESPONSE: {request.method} {request.path} - Status: {response.status_code} - Duration: {duration:.2f}ms")
            
            # Adicionar headers de performance
            response.headers['X-Response-Time'] = f"{duration:.2f}ms"
            response.headers['X-Timestamp'] = datetime.utcnow().isoformat()
        
        # Headers de segurança
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
    
    # Middleware para conexão com banco de dados
    @app.before_request
    def get_db_connection():
        """Estabelecer conexão com banco de dados"""
        try:
            g.db = psycopg2.connect(
                app.config['DATABASE_URL'],
                cursor_factory=RealDictCursor
            )
            g.db.autocommit = True
        except Exception as e:
            logger.error(f"Erro ao conectar com banco de dados: {e}")
            g.db = None
    
    @app.teardown_appcontext
    def close_db_connection(error):
        """Fechar conexão com banco de dados"""
        db = getattr(g, 'db', None)
        if db is not None:
            db.close()
    
    # Tratamento global de erros
    @app.errorhandler(AuthError)
    def handle_auth_error(error):
        """Tratar erros de autenticação"""
        logger.warning(f"Auth error: {error.message} - IP: {request.remote_addr}")
        return jsonify({
            'success': False,
            'error': error.message,
            'error_code': 'AUTHENTICATION_ERROR',
            'timestamp': datetime.utcnow().isoformat()
        }), error.status_code
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Tratar erros de validação"""
        logger.warning(f"Validation error: {error.message} - IP: {request.remote_addr}")
        return jsonify({
            'success': False,
            'error': error.message,
            'error_code': 'VALIDATION_ERROR',
            'timestamp': datetime.utcnow().isoformat()
        }), 400
    
    @app.errorhandler(429)
    def handle_rate_limit_error(error):
        """Tratar erros de rate limiting"""
        logger.warning(f"Rate limit exceeded - IP: {request.remote_addr}")
        return jsonify({
            'success': False,
            'error': 'Muitas requisições. Tente novamente mais tarde.',
            'error_code': 'RATE_LIMIT_EXCEEDED',
            'retry_after': error.retry_after,
            'timestamp': datetime.utcnow().isoformat()
        }), 429
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Tratar erros 404"""
        logger.info(f"404 Not Found: {request.path} - IP: {request.remote_addr}")
        return jsonify({
            'success': False,
            'error': 'Endpoint não encontrado',
            'error_code': 'NOT_FOUND',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Tratar erros 405"""
        logger.info(f"405 Method Not Allowed: {request.method} {request.path} - IP: {request.remote_addr}")
        return jsonify({
            'success': False,
            'error': f'Método {request.method} não permitido para este endpoint',
            'error_code': 'METHOD_NOT_ALLOWED',
            'allowed_methods': list(error.valid_methods) if hasattr(error, 'valid_methods') else [],
            'timestamp': datetime.utcnow().isoformat()
        }), 405
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Tratar erros internos"""
        error_id = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        logger.error(f"Internal Server Error [{error_id}]: {str(error)} - IP: {request.remote_addr}")
        logger.error(f"Traceback [{error_id}]: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_SERVER_ERROR',
            'error_id': error_id,
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    
    # Endpoints de saúde e informações
    @app.route('/health', methods=['GET'])
    def health_check():
        """Verificar saúde da aplicação"""
        try:
            # Verificar banco de dados
            db_status = 'healthy'
            try:
                if g.db:
                    cursor = g.db.cursor()
                    cursor.execute('SELECT 1')
                    cursor.fetchone()
                    cursor.close()
                else:
                    db_status = 'unhealthy'
            except Exception as e:
                db_status = f'unhealthy: {str(e)}'
            
            # Verificar Redis
            cache_status = cache_health_check()
            
            # Status geral
            overall_status = 'healthy' if db_status == 'healthy' and cache_status['status'] == 'healthy' else 'unhealthy'
            
            return jsonify({
                'status': overall_status,
                'timestamp': datetime.utcnow().isoformat(),
                'version': app.config['API_VERSION'],
                'services': {
                    'database': db_status,
                    'cache': cache_status['status'],
                    'api': 'healthy'
                },
                'uptime': 'calculating...',  # TODO: Implementar cálculo de uptime
                'environment': 'development' if app.config['DEBUG'] else 'production'
            })
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    @app.route('/info', methods=['GET'])
    def api_info():
        """Informações da API"""
        return jsonify({
            'name': app.config['API_TITLE'],
            'description': app.config['API_DESCRIPTION'],
            'version': app.config['API_VERSION'],
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
            },
            'features': [
                'Scraping inteligente de múltiplas plataformas',
                'Análise de conteúdo com IA',
                'Detecção de tendências virais',
                'Geração de templates adaptáveis',
                'Análise de perfis completa',
                'Sistema de webhooks em tempo real',
                'Cache inteligente com Redis',
                'Autenticação JWT robusta',
                'Rate limiting avançado',
                'Documentação Swagger interativa'
            ]
        })
    
    @app.route('/', methods=['GET'])
    def root():
        """Endpoint raiz"""
        return jsonify({
            'message': 'Viral Content Scraper API',
            'version': app.config['API_VERSION'],
            'status': 'online',
            'documentation': '/api/v1/docs',
            'health': '/health',
            'info': '/info',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # Endpoint para CORS preflight
    @app.route('/api/v1/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        """Tratar requisições OPTIONS para CORS"""
        return '', 200
    
    # Registrar blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1')
    app.register_blueprint(analysis_bp, url_prefix='/api/v1')
    app.register_blueprint(scraping_bp, url_prefix='/api/v1')
    app.register_blueprint(trends_bp, url_prefix='/api/v1')
    app.register_blueprint(templates_bp, url_prefix='/api/v1')
    app.register_blueprint(profiles_bp, url_prefix='/api/v1')
    app.register_blueprint(admin_bp, url_prefix='/api/v1')
    app.register_blueprint(webhooks_bp, url_prefix='/api/v1')
    
    # Importar e registrar Swagger UI
    try:
        from swagger_ui import swagger_ui_bp
        app.register_blueprint(swagger_ui_bp, url_prefix='/api/v1')
        logger.info("Swagger UI registrado com sucesso")
    except ImportError as e:
        logger.warning(f"Não foi possível importar Swagger UI: {e}")
    
    logger.info("Aplicação Flask criada com sucesso")
    logger.info(f"Blueprints registrados: {len(app.blueprints)}")
    logger.info(f"Endpoints disponíveis: {len(app.url_map._rules)}")
    
    return app

# Criar aplicação
app = create_app()

# Função para inicializar banco de dados
def init_database():
    """Inicializar banco de dados com tabelas necessárias"""
    try:
        conn = psycopg2.connect(app.config['DATABASE_URL'])
        cursor = conn.cursor()
        
        # Verificar se tabelas existem
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = [row[0] for row in cursor.fetchall()]
        logger.info(f"Tabelas existentes no banco: {tables}")
        
        # TODO: Executar migrations se necessário
        
        cursor.close()
        conn.close()
        
        logger.info("Banco de dados inicializado com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")

# Função para testar conectividade
def test_connections():
    """Testar conectividade com serviços externos"""
    logger.info("Testando conectividade...")
    
    # Testar PostgreSQL
    try:
        conn = psycopg2.connect(app.config['DATABASE_URL'])
        conn.close()
        logger.info("✅ PostgreSQL: Conectado")
    except Exception as e:
        logger.error(f"❌ PostgreSQL: {e}")
    
    # Testar Redis
    try:
        redis_client = redis.from_url(app.config['REDIS_URL'])
        redis_client.ping()
        logger.info("✅ Redis: Conectado")
    except Exception as e:
        logger.error(f"❌ Redis: {e}")
    
    logger.info("Teste de conectividade concluído")

if __name__ == '__main__':
    # Testar conectividade na inicialização
    test_connections()
    
    # Inicializar banco de dados
    init_database()
    
    # Configurações de execução
    host = '0.0.0.0'  # Permitir acesso externo
    port = int(os.getenv('PORT', 5000))
    debug = app.config['DEBUG']
    
    logger.info(f"Iniciando servidor em {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Environment: {'development' if debug else 'production'}")
    
    # Iniciar aplicação
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True,
        use_reloader=debug
    )

