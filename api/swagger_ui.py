"""
SWAGGER UI INTEGRATION
Interface web interativa para documentação da API

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

from flask import Blueprint, render_template_string, send_from_directory, jsonify
import yaml
import json
import os

swagger_bp = Blueprint('swagger', __name__)

# Template HTML para Swagger UI
SWAGGER_UI_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viral Content Scraper API - Documentação</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.5/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.5/favicon-16x16.png" sizes="16x16" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        
        *, *:before, *:after {
            box-sizing: inherit;
        }
        
        body {
            margin:0;
            background: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .swagger-ui .topbar {
            background-color: #1f2937;
            padding: 10px 0;
        }
        
        .swagger-ui .topbar .download-url-wrapper {
            display: none;
        }
        
        .swagger-ui .info {
            margin: 50px 0;
        }
        
        .swagger-ui .info .title {
            color: #1f2937;
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .swagger-ui .info .description {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .swagger-ui .scheme-container {
            background: #fff;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .swagger-ui .opblock.opblock-post {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
        }
        
        .swagger-ui .opblock.opblock-get {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
        }
        
        .swagger-ui .opblock.opblock-put {
            border-color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
        }
        
        .swagger-ui .opblock.opblock-delete {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }
        
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 0;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .custom-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
        }
        
        .custom-header p {
            margin: 10px 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .api-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        @media (max-width: 768px) {
            .custom-header h1 {
                font-size: 2rem;
            }
            
            .custom-header p {
                font-size: 1rem;
            }
            
            .api-stats {
                gap: 15px;
            }
            
            .stat-item {
                padding: 10px 15px;
            }
        }
    </style>
</head>

<body>
    <div class="custom-header">
        <h1>🚀 Viral Content Scraper API</h1>
        <p>Sistema Inteligente de Análise de Conteúdo Viral</p>
        <div class="api-stats">
            <div class="stat-item">
                <span class="stat-number">50+</span>
                <span class="stat-label">Endpoints</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">7</span>
                <span class="stat-label">Módulos</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">5</span>
                <span class="stat-label">Plataformas</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">AI</span>
                <span class="stat-label">Powered</span>
            </div>
        </div>
    </div>
    
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            // Configuração do Swagger UI
            const ui = SwaggerUIBundle({
                url: '/api/v1/swagger.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: "list",
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Adicionar headers customizados se necessário
                    request.headers['X-API-Client'] = 'SwaggerUI';
                    return request;
                },
                responseInterceptor: function(response) {
                    // Log de respostas para debug
                    console.log('API Response:', response);
                    return response;
                },
                onComplete: function() {
                    console.log('Swagger UI carregado com sucesso!');
                    
                    // Adicionar informações extras
                    const infoSection = document.querySelector('.swagger-ui .info');
                    if (infoSection) {
                        const extraInfo = document.createElement('div');
                        extraInfo.innerHTML = `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #1a202c; margin-top: 0;">🔥 Funcionalidades Principais</h3>
                                <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
                                    <li><strong>Scraping Inteligente:</strong> Coleta automatizada de conteúdo viral</li>
                                    <li><strong>Análise com IA:</strong> Processamento avançado com GPT-4 Vision</li>
                                    <li><strong>Templates Virais:</strong> Extração e adaptação de padrões de sucesso</li>
                                    <li><strong>Análise de Perfis:</strong> Análise completa de perfis Instagram</li>
                                    <li><strong>Tendências:</strong> Identificação de padrões virais em tempo real</li>
                                    <li><strong>Webhooks:</strong> Notificações em tempo real</li>
                                    <li><strong>Administração:</strong> Gerenciamento completo do sistema</li>
                                </ul>
                            </div>
                            
                            <div style="background: #fef7e0; border: 1px solid #f6cc50; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #744210; margin-top: 0;">⚡ Rate Limits</h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                    <div>
                                        <strong style="color: #744210;">Usuário Padrão:</strong><br>
                                        <span style="color: #92400e;">1000 req/hora, 100 req/min</span>
                                    </div>
                                    <div>
                                        <strong style="color: #744210;">Usuário Premium:</strong><br>
                                        <span style="color: #92400e;">5000 req/hora, 500 req/min</span>
                                    </div>
                                    <div>
                                        <strong style="color: #744210;">Usuário Business:</strong><br>
                                        <span style="color: #92400e;">15000 req/hora, 1500 req/min</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #047857; margin-top: 0;">🔐 Autenticação</h3>
                                <p style="color: #065f46; margin: 0;">
                                    A API utiliza autenticação JWT Bearer Token. Inclua o token no header:
                                </p>
                                <code style="background: #d1fae5; color: #047857; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 10px;">
                                    Authorization: Bearer &lt;seu_token_jwt&gt;
                                </code>
                            </div>
                        `;
                        infoSection.appendChild(extraInfo);
                    }
                },
                validatorUrl: null
            });
            
            // Adicionar funcionalidades extras
            window.ui = ui;
        }
    </script>
</body>
</html>
"""

@swagger_bp.route('/docs')
def swagger_ui():
    """Página principal da documentação Swagger UI"""
    return render_template_string(SWAGGER_UI_TEMPLATE)

@swagger_bp.route('/swagger.json')
def swagger_json():
    """Endpoint para servir o arquivo OpenAPI em formato JSON"""
    try:
        swagger_file = os.path.join(os.path.dirname(__file__), 'swagger.yaml')
        
        with open(swagger_file, 'r', encoding='utf-8') as f:
            swagger_data = yaml.safe_load(f)
        
        # Adicionar informações dinâmicas
        swagger_data['info']['x-generated-at'] = "2025-01-27T10:30:00Z"
        swagger_data['info']['x-version-info'] = {
            'api_version': '1.0.0',
            'build': 'latest',
            'environment': 'production'
        }
        
        return jsonify(swagger_data)
        
    except Exception as e:
        return jsonify({
            'error': 'Erro ao carregar documentação Swagger',
            'details': str(e)
        }), 500

@swagger_bp.route('/swagger.yaml')
def swagger_yaml():
    """Endpoint para servir o arquivo OpenAPI em formato YAML"""
    try:
        swagger_dir = os.path.dirname(__file__)
        return send_from_directory(swagger_dir, 'swagger.yaml', mimetype='text/yaml')
    except Exception as e:
        return jsonify({
            'error': 'Erro ao carregar arquivo YAML',
            'details': str(e)
        }), 500

@swagger_bp.route('/redoc')
def redoc():
    """Página alternativa com ReDoc"""
    redoc_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Viral Content Scraper API - ReDoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
            body {
                margin: 0;
                padding: 0;
            }
            .custom-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
            }
            .custom-header h1 {
                margin: 0;
                font-size: 2rem;
                font-weight: 700;
            }
        </style>
    </head>
    <body>
        <div class="custom-header">
            <h1>🚀 Viral Content Scraper API - ReDoc</h1>
        </div>
        <redoc spec-url='/api/v1/swagger.json'></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js"></script>
    </body>
    </html>
    """
    return render_template_string(redoc_template)

@swagger_bp.route('/openapi.json')
def openapi_json():
    """Alias para swagger.json (compatibilidade)"""
    return swagger_json()

@swagger_bp.route('/api-docs')
def api_docs_redirect():
    """Redirect para a documentação principal"""
    from flask import redirect, url_for
    return redirect(url_for('swagger.swagger_ui'))

@swagger_bp.route('/health')
def docs_health():
    """Health check para o sistema de documentação"""
    try:
        swagger_file = os.path.join(os.path.dirname(__file__), 'swagger.yaml')
        
        # Verificar se arquivo existe e é válido
        if not os.path.exists(swagger_file):
            return jsonify({
                'status': 'error',
                'message': 'Arquivo swagger.yaml não encontrado'
            }), 500
        
        with open(swagger_file, 'r', encoding='utf-8') as f:
            swagger_data = yaml.safe_load(f)
        
        # Contar endpoints
        paths_count = len(swagger_data.get('paths', {}))
        schemas_count = len(swagger_data.get('components', {}).get('schemas', {}))
        
        return jsonify({
            'status': 'healthy',
            'documentation': {
                'swagger_ui_url': '/api/v1/docs',
                'redoc_url': '/api/v1/redoc',
                'openapi_json_url': '/api/v1/swagger.json',
                'openapi_yaml_url': '/api/v1/swagger.yaml'
            },
            'statistics': {
                'total_endpoints': paths_count,
                'total_schemas': schemas_count,
                'api_version': swagger_data.get('info', {}).get('version', 'unknown')
            },
            'last_updated': '2025-01-27T10:30:00Z'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Erro ao verificar documentação',
            'error': str(e)
        }), 500

# Função para integrar com a aplicação Flask principal
def init_swagger(app):
    """Inicializar Swagger UI na aplicação Flask"""
    
    # Registrar blueprint
    app.register_blueprint(swagger_bp, url_prefix='/api/v1')
    
    # Adicionar headers CORS para documentação
    @app.after_request
    def after_request(response):
        if request.endpoint and 'swagger' in request.endpoint:
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    print("📚 Swagger UI inicializado:")
    print("   - Documentação: http://localhost:5000/api/v1/docs")
    print("   - ReDoc: http://localhost:5000/api/v1/redoc")
    print("   - OpenAPI JSON: http://localhost:5000/api/v1/swagger.json")
    print("   - OpenAPI YAML: http://localhost:5000/api/v1/swagger.yaml")

# Função para gerar documentação estática
def generate_static_docs():
    """Gerar documentação estática para deploy"""
    try:
        import os
        import shutil
        
        # Criar diretório de documentação estática
        static_docs_dir = '/home/ubuntu/viral_content_scraper/docs/static'
        os.makedirs(static_docs_dir, exist_ok=True)
        
        # Copiar arquivos necessários
        swagger_file = os.path.join(os.path.dirname(__file__), 'swagger.yaml')
        shutil.copy2(swagger_file, os.path.join(static_docs_dir, 'swagger.yaml'))
        
        # Gerar HTML estático
        static_html = SWAGGER_UI_TEMPLATE.replace(
            "url: '/api/v1/swagger.json'",
            "url: './swagger.yaml'"
        )
        
        with open(os.path.join(static_docs_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(static_html)
        
        print(f"📚 Documentação estática gerada em: {static_docs_dir}")
        return static_docs_dir
        
    except Exception as e:
        print(f"❌ Erro ao gerar documentação estática: {e}")
        return None

if __name__ == '__main__':
    # Teste da documentação
    print("🧪 Testando sistema de documentação...")
    
    # Verificar arquivo Swagger
    swagger_file = os.path.join(os.path.dirname(__file__), 'swagger.yaml')
    if os.path.exists(swagger_file):
        print("✅ Arquivo swagger.yaml encontrado")
        
        try:
            with open(swagger_file, 'r', encoding='utf-8') as f:
                swagger_data = yaml.safe_load(f)
            
            paths_count = len(swagger_data.get('paths', {}))
            schemas_count = len(swagger_data.get('components', {}).get('schemas', {}))
            
            print(f"📊 Estatísticas da documentação:")
            print(f"   - Endpoints: {paths_count}")
            print(f"   - Schemas: {schemas_count}")
            print(f"   - Versão: {swagger_data.get('info', {}).get('version', 'N/A')}")
            
        except Exception as e:
            print(f"❌ Erro ao validar swagger.yaml: {e}")
    else:
        print("❌ Arquivo swagger.yaml não encontrado")
    
    # Gerar documentação estática
    static_dir = generate_static_docs()
    if static_dir:
        print("✅ Documentação estática gerada com sucesso")

