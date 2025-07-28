#!/usr/bin/env python3
"""
GERADOR DE DOCUMENTAÇÃO COMPLETA
Script para gerar documentação da API em múltiplos formatos

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import os
import yaml
import json
import markdown
from datetime import datetime
import argparse
import sys

def load_swagger_spec():
    """Carregar especificação OpenAPI"""
    try:
        swagger_file = os.path.join(os.path.dirname(__file__), 'swagger.yaml')
        with open(swagger_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"❌ Erro ao carregar swagger.yaml: {e}")
        return None

def generate_markdown_docs(swagger_spec, output_dir):
    """Gerar documentação em Markdown"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        # Arquivo principal
        md_content = f"""# {swagger_spec['info']['title']}

**Versão:** {swagger_spec['info']['version']}  
**Gerado em:** {datetime.now().strftime('%d/%m/%Y às %H:%M')}

{swagger_spec['info']['description']}

## 📋 Índice

"""
        
        # Gerar índice por tags
        tags = {}
        for path, methods in swagger_spec['paths'].items():
            for method, spec in methods.items():
                if 'tags' in spec and spec['tags']:
                    tag = spec['tags'][0]
                    if tag not in tags:
                        tags[tag] = []
                    tags[tag].append({
                        'path': path,
                        'method': method.upper(),
                        'summary': spec.get('summary', ''),
                        'description': spec.get('description', '')
                    })
        
        # Adicionar links do índice
        for tag in sorted(tags.keys()):
            md_content += f"- [{tag}](#{tag.lower().replace(' ', '-')})\n"
        
        md_content += "\n---\n\n"
        
        # Gerar documentação por tag
        for tag in sorted(tags.keys()):
            md_content += f"## {tag}\n\n"
            
            for endpoint in tags[tag]:
                md_content += f"### {endpoint['method']} {endpoint['path']}\n\n"
                md_content += f"**Resumo:** {endpoint['summary']}\n\n"
                
                if endpoint['description']:
                    md_content += f"{endpoint['description']}\n\n"
                
                # Buscar detalhes do endpoint
                path_spec = swagger_spec['paths'][endpoint['path']][endpoint['method'].lower()]
                
                # Parâmetros
                if 'parameters' in path_spec:
                    md_content += "**Parâmetros:**\n\n"
                    for param in path_spec['parameters']:
                        required = " *(obrigatório)*" if param.get('required', False) else ""
                        md_content += f"- `{param['name']}` ({param['in']}){required}: {param.get('description', '')}\n"
                    md_content += "\n"
                
                # Request Body
                if 'requestBody' in path_spec:
                    md_content += "**Body da Requisição:**\n\n"
                    content = path_spec['requestBody'].get('content', {})
                    if 'application/json' in content:
                        md_content += "```json\n"
                        md_content += "{\n  // Estrutura do JSON\n}\n"
                        md_content += "```\n\n"
                
                # Responses
                if 'responses' in path_spec:
                    md_content += "**Respostas:**\n\n"
                    for code, response in path_spec['responses'].items():
                        md_content += f"- **{code}**: {response.get('description', '')}\n"
                    md_content += "\n"
                
                md_content += "---\n\n"
        
        # Adicionar schemas
        if 'components' in swagger_spec and 'schemas' in swagger_spec['components']:
            md_content += "## 📊 Schemas de Dados\n\n"
            
            for schema_name, schema in swagger_spec['components']['schemas'].items():
                md_content += f"### {schema_name}\n\n"
                
                if 'description' in schema:
                    md_content += f"{schema['description']}\n\n"
                
                if 'properties' in schema:
                    md_content += "**Propriedades:**\n\n"
                    for prop_name, prop_spec in schema['properties'].items():
                        prop_type = prop_spec.get('type', 'object')
                        prop_desc = prop_spec.get('description', '')
                        md_content += f"- `{prop_name}` ({prop_type}): {prop_desc}\n"
                    md_content += "\n"
                
                md_content += "---\n\n"
        
        # Salvar arquivo
        md_file = os.path.join(output_dir, 'api_documentation.md')
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"✅ Documentação Markdown gerada: {md_file}")
        return md_file
        
    except Exception as e:
        print(f"❌ Erro ao gerar documentação Markdown: {e}")
        return None

def generate_html_docs(swagger_spec, output_dir):
    """Gerar documentação em HTML"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{swagger_spec['info']['title']} - Documentação</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }}
        
        .header h1 {{
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
        }}
        
        .header p {{
            margin: 10px 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        
        .stat-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            display: block;
        }}
        
        .stat-label {{
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }}
        
        .section {{
            background: white;
            margin: 20px 0;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        
        .endpoint {{
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin: 15px 0;
            overflow: hidden;
        }}
        
        .endpoint-header {{
            background: #f8fafc;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        
        .method {{
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.8rem;
            text-transform: uppercase;
        }}
        
        .method.get {{ background: #dbeafe; color: #1e40af; }}
        .method.post {{ background: #dcfce7; color: #166534; }}
        .method.put {{ background: #fef3c7; color: #92400e; }}
        .method.delete {{ background: #fee2e2; color: #991b1b; }}
        
        .endpoint-path {{
            font-family: 'Monaco', 'Menlo', monospace;
            font-weight: 500;
        }}
        
        .endpoint-body {{
            padding: 20px;
        }}
        
        .toc {{
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        
        .toc h3 {{
            margin-top: 0;
            color: #334155;
        }}
        
        .toc ul {{
            list-style: none;
            padding-left: 0;
        }}
        
        .toc li {{
            margin: 8px 0;
        }}
        
        .toc a {{
            color: #667eea;
            text-decoration: none;
            padding: 5px 10px;
            border-radius: 4px;
            transition: background 0.2s;
        }}
        
        .toc a:hover {{
            background: #e2e8f0;
        }}
        
        code {{
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }}
        
        pre {{
            background: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', monospace;
        }}
        
        @media (max-width: 768px) {{
            body {{
                padding: 10px;
            }}
            
            .header h1 {{
                font-size: 2rem;
            }}
            
            .stats {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 {swagger_spec['info']['title']}</h1>
        <p>Versão {swagger_spec['info']['version']} • Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}</p>
    </div>
"""
        
        # Estatísticas
        paths_count = len(swagger_spec['paths'])
        schemas_count = len(swagger_spec.get('components', {}).get('schemas', {}))
        tags_count = len(set(
            tag for path in swagger_spec['paths'].values() 
            for method in path.values() 
            for tag in method.get('tags', [])
        ))
        
        html_content += f"""
    <div class="stats">
        <div class="stat-card">
            <span class="stat-number">{paths_count}</span>
            <div class="stat-label">Endpoints</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">{tags_count}</span>
            <div class="stat-label">Módulos</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">{schemas_count}</span>
            <div class="stat-label">Schemas</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">JWT</span>
            <div class="stat-label">Autenticação</div>
        </div>
    </div>
"""
        
        # Índice
        tags = {}
        for path, methods in swagger_spec['paths'].items():
            for method, spec in methods.items():
                if 'tags' in spec and spec['tags']:
                    tag = spec['tags'][0]
                    if tag not in tags:
                        tags[tag] = []
                    tags[tag].append({
                        'path': path,
                        'method': method.upper(),
                        'summary': spec.get('summary', ''),
                        'description': spec.get('description', '')
                    })
        
        html_content += """
    <div class="toc">
        <h3>📋 Índice de Módulos</h3>
        <ul>
"""
        
        for tag in sorted(tags.keys()):
            html_content += f'            <li><a href="#{tag.lower().replace(" ", "-")}">{tag}</a></li>\n'
        
        html_content += """        </ul>
    </div>
"""
        
        # Seções por tag
        for tag in sorted(tags.keys()):
            html_content += f"""
    <div class="section" id="{tag.lower().replace(' ', '-')}">
        <h2>{tag}</h2>
"""
            
            for endpoint in tags[tag]:
                method_class = endpoint['method'].lower()
                html_content += f"""
        <div class="endpoint">
            <div class="endpoint-header">
                <span class="method {method_class}">{endpoint['method']}</span>
                <span class="endpoint-path">{endpoint['path']}</span>
            </div>
            <div class="endpoint-body">
                <h4>{endpoint['summary']}</h4>
"""
                
                if endpoint['description']:
                    html_content += f"                <p>{endpoint['description']}</p>\n"
                
                html_content += """            </div>
        </div>
"""
            
            html_content += "    </div>\n"
        
        # Footer
        html_content += f"""
    <div class="section">
        <h2>📞 Suporte</h2>
        <p>Para dúvidas ou suporte técnico:</p>
        <ul>
            <li><strong>Email:</strong> support@viralscraper.com</li>
            <li><strong>Documentação Interativa:</strong> <a href="/api/v1/docs">Swagger UI</a></li>
            <li><strong>Documentação Alternativa:</strong> <a href="/api/v1/redoc">ReDoc</a></li>
        </ul>
    </div>
    
    <footer style="text-align: center; padding: 40px; color: #666; border-top: 1px solid #e2e8f0; margin-top: 40px;">
        <p>Gerado automaticamente em {datetime.now().strftime('%d/%m/%Y às %H:%M')} • Viral Content Scraper API v{swagger_spec['info']['version']}</p>
    </footer>
</body>
</html>
"""
        
        # Salvar arquivo
        html_file = os.path.join(output_dir, 'api_documentation.html')
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"✅ Documentação HTML gerada: {html_file}")
        return html_file
        
    except Exception as e:
        print(f"❌ Erro ao gerar documentação HTML: {e}")
        return None

def generate_postman_collection(swagger_spec, output_dir):
    """Gerar coleção do Postman"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        collection = {
            "info": {
                "name": swagger_spec['info']['title'],
                "description": swagger_spec['info']['description'],
                "version": swagger_spec['info']['version'],
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            "auth": {
                "type": "bearer",
                "bearer": [
                    {
                        "key": "token",
                        "value": "{{jwt_token}}",
                        "type": "string"
                    }
                ]
            },
            "variable": [
                {
                    "key": "base_url",
                    "value": "http://localhost:5000/api/v1",
                    "type": "string"
                },
                {
                    "key": "jwt_token",
                    "value": "seu_token_jwt_aqui",
                    "type": "string"
                }
            ],
            "item": []
        }
        
        # Organizar por tags
        tags = {}
        for path, methods in swagger_spec['paths'].items():
            for method, spec in methods.items():
                if 'tags' in spec and spec['tags']:
                    tag = spec['tags'][0]
                    if tag not in tags:
                        tags[tag] = []
                    tags[tag].append({
                        'path': path,
                        'method': method.upper(),
                        'spec': spec
                    })
        
        # Criar folders por tag
        for tag, endpoints in tags.items():
            folder = {
                "name": tag,
                "item": []
            }
            
            for endpoint in endpoints:
                request_item = {
                    "name": endpoint['spec'].get('summary', f"{endpoint['method']} {endpoint['path']}"),
                    "request": {
                        "method": endpoint['method'],
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json",
                                "type": "text"
                            }
                        ],
                        "url": {
                            "raw": "{{base_url}}" + endpoint['path'],
                            "host": ["{{base_url}}"],
                            "path": endpoint['path'].strip('/').split('/')
                        },
                        "description": endpoint['spec'].get('description', '')
                    }
                }
                
                # Adicionar body se for POST/PUT
                if endpoint['method'] in ['POST', 'PUT'] and 'requestBody' in endpoint['spec']:
                    request_item['request']['body'] = {
                        "mode": "raw",
                        "raw": "{\n  // Adicione os dados da requisição aqui\n}",
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    }
                
                folder['item'].append(request_item)
            
            collection['item'].append(folder)
        
        # Salvar coleção
        collection_file = os.path.join(output_dir, 'viral_scraper_api.postman_collection.json')
        with open(collection_file, 'w', encoding='utf-8') as f:
            json.dump(collection, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Coleção Postman gerada: {collection_file}")
        return collection_file
        
    except Exception as e:
        print(f"❌ Erro ao gerar coleção Postman: {e}")
        return None

def generate_readme(swagger_spec, output_dir):
    """Gerar README.md para o projeto"""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        readme_content = f"""# 🚀 {swagger_spec['info']['title']}

{swagger_spec['info']['description']}

## 📋 Índice

- [Instalação](#instalação)
- [Configuração](#configuração)
- [Autenticação](#autenticação)
- [Endpoints Principais](#endpoints-principais)
- [Exemplos de Uso](#exemplos-de-uso)
- [Rate Limits](#rate-limits)
- [Documentação](#documentação)
- [Suporte](#suporte)

## 🚀 Instalação

### Pré-requisitos

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 6+

### Instalação Local

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/viral-content-scraper.git
cd viral-content-scraper

# Instalar dependências Python
cd api
pip install -r requirements.txt

# Instalar dependências Node.js
cd ../scrapers
npm install

# Configurar banco de dados
createdb viral_content_db
psql viral_content_db < database/create_schema.sql

# Configurar variáveis de ambiente
cp config/.env.example config/.env
# Editar config/.env com suas configurações
```

### Docker (Recomendado)

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# API Configuration
OPENAI_API_KEY=sua_chave_openai
DATABASE_URL=postgresql://user:pass@localhost:5432/viral_content_db
REDIS_URL=redis://localhost:6379

# Supabase (Memória Evolutiva)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_supabase

# Scraping Configuration
PROXY_ENABLED=true
USER_AGENT_ROTATION=true
```

## 🔐 Autenticação

A API utiliza autenticação JWT Bearer Token:

```bash
# Obter token
curl -X POST http://localhost:5000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{{"email": "seu@email.com", "password": "sua_senha"}}'

# Usar token nas requisições
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \\
  http://localhost:5000/api/v1/analysis/content/123
```

## 🎯 Endpoints Principais

### 🔍 Análise de Conteúdo

```bash
# Analisar conteúdo específico
POST /api/v1/analysis/content/{{content_id}}

# Análise em lote
POST /api/v1/analysis/batch

# Análise de sentimento
POST /api/v1/analysis/sentiment
```

### 🕷️ Scraping

```bash
# Scraping Instagram
POST /api/v1/scraping/instagram

# Status da sessão
GET /api/v1/scraping/sessions/{{session_id}}

# Agendar scraping
POST /api/v1/scraping/schedule
```

### 📈 Tendências

```bash
# Conteúdo viral
GET /api/v1/trends/viral

# Hashtags trending
GET /api/v1/trends/hashtags

# Criadores em ascensão
GET /api/v1/trends/creators
```

### 🎨 Templates

```bash
# Listar templates
GET /api/v1/templates

# Extrair template
POST /api/v1/templates/extract

# Adaptar template
POST /api/v1/templates/adapt
```

### 👥 Perfis

```bash
# Analisar perfil
POST /api/v1/profiles/analyze

# Comparar perfis
POST /api/v1/profiles/compare

# Análise em lote
POST /api/v1/profiles/batch-analyze
```

## 💡 Exemplos de Uso

### Análise de Conteúdo Viral

```python
import requests

# Configurar headers
headers = {{
    'Authorization': 'Bearer SEU_TOKEN_JWT',
    'Content-Type': 'application/json'
}}

# Analisar conteúdo
response = requests.post(
    'http://localhost:5000/api/v1/analysis/content/post_123',
    headers=headers,
    json={{
        'analysis_types': ['sentiment', 'visual', 'metrics'],
        'include_recommendations': True
    }}
)

result = response.json()
print(f"Viral Score: {{result['data']['viral_score']}}")
```

### Scraping de Hashtag

```python
# Iniciar scraping
response = requests.post(
    'http://localhost:5000/api/v1/scraping/instagram',
    headers=headers,
    json={{
        'target_type': 'hashtag',
        'target_value': 'fitness',
        'max_posts': 100,
        'viral_threshold': {{
            'min_likes': 5000,
            'min_engagement_rate': 3.0
        }}
    }}
)

session_id = response.json()['data']['session_id']
print(f"Scraping iniciado: {{session_id}}")
```

### Extração de Template

```python
# Extrair template de post viral
response = requests.post(
    'http://localhost:5000/api/v1/templates/extract',
    headers=headers,
    json={{
        'content_url': 'https://instagram.com/p/ABC123',
        'analysis_depth': 'deep',
        'save_template': True
    }}
)

template = response.json()['data']['template']
print(f"Template extraído: {{template['template_name']}}")
```

## ⚡ Rate Limits

| Plano | Requests/Hora | Requests/Minuto |
|-------|---------------|-----------------|
| Gratuito | 100 | 10 |
| Padrão | 1.000 | 100 |
| Premium | 5.000 | 500 |
| Business | 15.000 | 1.500 |

## 📚 Documentação

### Documentação Interativa

- **Swagger UI**: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)
- **ReDoc**: [http://localhost:5000/api/v1/redoc](http://localhost:5000/api/v1/redoc)

### Arquivos de Documentação

- **OpenAPI YAML**: [swagger.yaml](./api/swagger.yaml)
- **OpenAPI JSON**: [http://localhost:5000/api/v1/swagger.json](http://localhost:5000/api/v1/swagger.json)
- **Coleção Postman**: [viral_scraper_api.postman_collection.json](./docs/viral_scraper_api.postman_collection.json)

## 🔔 Webhooks

Configure webhooks para receber notificações em tempo real:

```python
# Registrar webhook
response = requests.post(
    'http://localhost:5000/api/v1/webhooks',
    headers=headers,
    json={{
        'url': 'https://meuapp.com/webhook',
        'events': ['viral_content_found', 'content_analyzed'],
        'secret': 'minha_chave_secreta'
    }}
)
```

### Eventos Disponíveis

- `content_analyzed` - Conteúdo analisado
- `viral_content_found` - Conteúdo viral encontrado
- `scraping_completed` - Scraping concluído
- `profile_analyzed` - Perfil analisado
- `template_generated` - Template gerado

## 🛠️ Administração

### Status do Sistema

```bash
GET /api/v1/admin/system/status
```

### Logs do Sistema

```bash
GET /api/v1/admin/logs?service=scrapers&level=error&limit=100
```

### Backup

```bash
POST /api/v1/admin/backup
```

## 🚀 Deploy em Produção

### VPS/Servidor Dedicado

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/viral-content-scraper.git
cd viral-content-scraper

# Configurar ambiente
cp config/.env.example config/.env
# Editar variáveis de produção

# Iniciar com Docker
docker-compose -f docker-compose.prod.yml up -d

# Configurar proxy reverso (Nginx)
sudo cp config/nginx.conf /etc/nginx/sites-available/viral-scraper
sudo ln -s /etc/nginx/sites-available/viral-scraper /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### Monitoramento

- **Logs**: `docker-compose logs -f`
- **Métricas**: Prometheus + Grafana
- **Alertas**: Configurar webhooks para Slack/Discord

## 📞 Suporte

### Contato

- **Email**: support@viralscraper.com
- **Discord**: [Servidor da Comunidade](https://discord.gg/viralscraper)
- **GitHub Issues**: [Reportar Problemas](https://github.com/seu-usuario/viral-content-scraper/issues)

### FAQ

**P: Como obter uma chave de API?**
R: Registre-se em [viralscraper.com](https://viralscraper.com) e acesse o painel de desenvolvedor.

**P: Posso usar a API gratuitamente?**
R: Sim! Oferecemos um plano gratuito com 100 requests/hora.

**P: A API suporta outras plataformas além do Instagram?**
R: Atualmente suportamos Instagram, TikTok, YouTube e LinkedIn. Mais plataformas em breve!

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja nosso [Guia de Contribuição](CONTRIBUTING.md) para começar.

---

**Desenvolvido com ❤️ pela equipe Manus AI**

*Última atualização: {datetime.now().strftime('%d/%m/%Y')}*
"""
        
        # Salvar README
        readme_file = os.path.join(output_dir, 'README.md')
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print(f"✅ README.md gerado: {readme_file}")
        return readme_file
        
    except Exception as e:
        print(f"❌ Erro ao gerar README: {e}")
        return None

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Gerador de Documentação da API')
    parser.add_argument('--output', '-o', default='/home/ubuntu/viral_content_scraper/docs', 
                       help='Diretório de saída (padrão: ./docs)')
    parser.add_argument('--format', '-f', choices=['all', 'markdown', 'html', 'postman', 'readme'], 
                       default='all', help='Formato de saída')
    parser.add_argument('--verbose', '-v', action='store_true', help='Saída detalhada')
    
    args = parser.parse_args()
    
    print("📚 Gerador de Documentação da API")
    print("=" * 50)
    
    # Carregar especificação
    swagger_spec = load_swagger_spec()
    if not swagger_spec:
        sys.exit(1)
    
    if args.verbose:
        print(f"✅ Especificação carregada: {swagger_spec['info']['title']} v{swagger_spec['info']['version']}")
    
    # Criar diretório de saída
    os.makedirs(args.output, exist_ok=True)
    
    generated_files = []
    
    # Gerar documentação conforme formato solicitado
    if args.format in ['all', 'markdown']:
        md_file = generate_markdown_docs(swagger_spec, args.output)
        if md_file:
            generated_files.append(md_file)
    
    if args.format in ['all', 'html']:
        html_file = generate_html_docs(swagger_spec, args.output)
        if html_file:
            generated_files.append(html_file)
    
    if args.format in ['all', 'postman']:
        postman_file = generate_postman_collection(swagger_spec, args.output)
        if postman_file:
            generated_files.append(postman_file)
    
    if args.format in ['all', 'readme']:
        readme_file = generate_readme(swagger_spec, args.output)
        if readme_file:
            generated_files.append(readme_file)
    
    # Resumo
    print("\n" + "=" * 50)
    print("📋 Resumo da Geração:")
    print(f"   - Arquivos gerados: {len(generated_files)}")
    print(f"   - Diretório de saída: {args.output}")
    
    if generated_files:
        print("\n📁 Arquivos gerados:")
        for file_path in generated_files:
            print(f"   - {os.path.basename(file_path)}")
    
    print("\n🎉 Documentação gerada com sucesso!")

if __name__ == '__main__':
    main()

