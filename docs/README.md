# 🚀 Viral Content Scraper API

# 🚀 API de Scraping Inteligente de Conteúdo Viral

Uma API completa para coleta, análise e geração de insights sobre conteúdo viral em múltiplas plataformas sociais.

## 🎯 Funcionalidades Principais

- **Scraping Inteligente**: Coleta automatizada de conteúdo viral
- **Análise com IA**: Processamento avançado com GPT-4 Vision
- **Templates Virais**: Extração e adaptação de padrões de sucesso
- **Análise de Perfis**: Análise completa de perfis Instagram
- **Tendências**: Identificação de padrões virais em tempo real
- **Administração**: Gerenciamento completo do sistema
- **Webhooks**: Notificações em tempo real

## 🔐 Autenticação

A API utiliza autenticação JWT Bearer Token:
```
Authorization: Bearer <seu_token_jwt>
```

## 📊 Rate Limiting

- **Usuário Padrão**: 1000 requests/hora, 100 requests/minuto
- **Usuário Premium**: 5000 requests/hora, 500 requests/minuto
- **Usuário Business**: 15000 requests/hora, 1500 requests/minuto

## 🌐 Base URL

- **Produção**: `https://api.viralscraper.com/api/v1`
- **Desenvolvimento**: `http://localhost:5000/api/v1`


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
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "sua_senha"}'

# Usar token nas requisições
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:5000/api/v1/analysis/content/123
```

## 🎯 Endpoints Principais

### 🔍 Análise de Conteúdo

```bash
# Analisar conteúdo específico
POST /api/v1/analysis/content/{content_id}

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
GET /api/v1/scraping/sessions/{session_id}

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
headers = {
    'Authorization': 'Bearer SEU_TOKEN_JWT',
    'Content-Type': 'application/json'
}

# Analisar conteúdo
response = requests.post(
    'http://localhost:5000/api/v1/analysis/content/post_123',
    headers=headers,
    json={
        'analysis_types': ['sentiment', 'visual', 'metrics'],
        'include_recommendations': True
    }
)

result = response.json()
print(f"Viral Score: {result['data']['viral_score']}")
```

### Scraping de Hashtag

```python
# Iniciar scraping
response = requests.post(
    'http://localhost:5000/api/v1/scraping/instagram',
    headers=headers,
    json={
        'target_type': 'hashtag',
        'target_value': 'fitness',
        'max_posts': 100,
        'viral_threshold': {
            'min_likes': 5000,
            'min_engagement_rate': 3.0
        }
    }
)

session_id = response.json()['data']['session_id']
print(f"Scraping iniciado: {session_id}")
```

### Extração de Template

```python
# Extrair template de post viral
response = requests.post(
    'http://localhost:5000/api/v1/templates/extract',
    headers=headers,
    json={
        'content_url': 'https://instagram.com/p/ABC123',
        'analysis_depth': 'deep',
        'save_template': True
    }
)

template = response.json()['data']['template']
print(f"Template extraído: {template['template_name']}")
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
    json={
        'url': 'https://meuapp.com/webhook',
        'events': ['viral_content_found', 'content_analyzed'],
        'secret': 'minha_chave_secreta'
    }
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

*Última atualização: 27/07/2025*
