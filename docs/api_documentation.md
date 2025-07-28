# Viral Content Scraper API

**Versão:** 1.0.0  
**Gerado em:** 27/07/2025 às 16:37

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

- [Admin](#admin)
- [Analysis](#analysis)
- [Profiles](#profiles)
- [Scraping](#scraping)
- [Templates](#templates)
- [Trends](#trends)
- [Webhooks](#webhooks)

---

## Admin

### GET /admin/system/status

**Resumo:** Status do sistema

Obtém status completo de todos os serviços e métricas do sistema

**Respostas:**

- **200**: Status do sistema

---

### POST /admin/services/{service_id}/start

**Resumo:** Iniciar serviço

Inicia um serviço específico do sistema

**Parâmetros:**

- `service_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Serviço iniciado com sucesso

---

### POST /admin/services/{service_id}/stop

**Resumo:** Parar serviço

**Parâmetros:**

- `service_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Serviço parado com sucesso

---

### POST /admin/services/{service_id}/restart

**Resumo:** Reiniciar serviço

**Parâmetros:**

- `service_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Serviço reiniciado com sucesso

---

### GET /admin/logs

**Resumo:** Logs do sistema

Obtém logs centralizados de todos os serviços

**Parâmetros:**

- `service` (query): 
- `level` (query): 
- `limit` (query): 
- `since` (query): 

**Respostas:**

- **200**: Logs do sistema

---

### POST /admin/backup

**Resumo:** Criar backup

Cria backup completo ou parcial do sistema

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Backup criado com sucesso

---

### POST /admin/maintenance

**Resumo:** Executar manutenção

Executa tarefas de manutenção do sistema

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Manutenção concluída

---

## Analysis

### POST /analysis/content/{content_id}

**Resumo:** Analisar conteúdo específico

Realiza análise completa de um conteúdo (sentiment, visual, métricas)

**Parâmetros:**

- `content_id` (path) *(obrigatório)*: ID único do conteúdo

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Análise concluída com sucesso
- **400**: 
- **404**: 
- **500**: 

---

### POST /analysis/batch

**Resumo:** Análise em lote

Analisa múltiplos conteúdos simultaneamente (máximo 50)

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Análise em lote iniciada

---

### POST /analysis/sentiment

**Resumo:** Análise de sentimento

Analisa sentimento e emoções de texto

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Análise de sentimento concluída

---

## Profiles

### POST /profiles/analyze

**Resumo:** Analisar perfil completo

Análise completa de perfil com extração de padrões virais

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Análise de perfil concluída

---

### GET /profiles/{username}

**Resumo:** Buscar análise de perfil

Recupera análise mais recente de um perfil

**Parâmetros:**

- `username` (path) *(obrigatório)*: 
- `platform` (query): 

**Respostas:**

- **200**: Análise do perfil

---

### GET /profiles

**Resumo:** Listar análises de perfis

Lista todas as análises de perfis com filtros

**Parâmetros:**

- `platform` (query): 
- `limit` (query): 
- `sort_by` (query): 
- `sort_order` (query): 

**Respostas:**

- **200**: Lista de análises de perfis

---

### POST /profiles/compare

**Resumo:** Comparar múltiplos perfis

Compara métricas e padrões entre perfis

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Comparação de perfis

---

### POST /profiles/batch-analyze

**Resumo:** Análise em lote de perfis

Analisa múltiplos perfis simultaneamente

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Análise em lote iniciada

---

## Scraping

### POST /scraping/instagram

**Resumo:** Scraping do Instagram

Inicia scraping de conteúdo viral do Instagram

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Scraping iniciado com sucesso

---

### GET /scraping/sessions/{session_id}

**Resumo:** Status da sessão de scraping

Obtém status e progresso de uma sessão de scraping

**Parâmetros:**

- `session_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Status da sessão

---

### POST /scraping/schedule

**Resumo:** Agendar scraping

Agenda scraping recorrente ou único

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **201**: Agendamento criado

---

## Templates

### GET /templates

**Resumo:** Listar templates

Busca templates com filtros avançados

**Parâmetros:**

- `content_type` (query): 
- `min_viral_score` (query): 
- `platform` (query): 
- `search_tags` (query): 
- `limit` (query): 
- `offset` (query): 
- `sort_by` (query): 
- `sort_order` (query): 

**Respostas:**

- **200**: Lista de templates

---

### POST /templates

**Resumo:** Criar template personalizado

Cria um novo template baseado em especificações

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **201**: Template criado com sucesso

---

### GET /templates/{template_id}

**Resumo:** Buscar template específico

**Parâmetros:**

- `template_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Detalhes do template

---

### DELETE /templates/{template_id}

**Resumo:** Deletar template

**Parâmetros:**

- `template_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Template deletado com sucesso

---

### POST /templates/extract

**Resumo:** Extrair template de conteúdo

Extrai template de conteúdo viral existente

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Template extraído com sucesso

---

### POST /templates/adapt

**Resumo:** Adaptar template existente

Adapta template para objetivo e nicho específicos

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Template adaptado com sucesso

---

### POST /templates/search

**Resumo:** Busca avançada de templates

Busca templates com critérios complexos

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Resultados da busca

---

## Trends

### GET /trends/viral

**Resumo:** Conteúdo viral em tempo real

Detecta conteúdo viral com base em critérios avançados

**Parâmetros:**

- `platform` (query): 
- `period` (query): 
- `content_type` (query): 
- `min_viral_score` (query): 
- `limit` (query): 

**Respostas:**

- **200**: Conteúdo viral encontrado

---

### GET /trends/hashtags

**Resumo:** Hashtags em tendência

Monitora hashtags em ascensão e crescimento explosivo

**Parâmetros:**

- `platform` (query): 
- `timeframe` (query): 
- `min_growth_rate` (query): 
- `category` (query): 

**Respostas:**

- **200**: Hashtags em tendência

---

### GET /trends/creators

**Resumo:** Criadores em ascensão

Identifica criadores com crescimento acelerado

**Parâmetros:**

- `platform` (query): 
- `min_followers` (query): 
- `growth_period` (query): 
- `category` (query): 

**Respostas:**

- **200**: Criadores em tendência

---

## Webhooks

### GET /webhooks

**Resumo:** Listar webhooks

Lista todos os webhooks registrados

**Respostas:**

- **200**: Lista de webhooks

---

### POST /webhooks

**Resumo:** Registrar webhook

Registra novo webhook para receber notificações

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **201**: Webhook registrado com sucesso

---

### GET /webhooks/{webhook_id}

**Resumo:** Buscar webhook específico

**Parâmetros:**

- `webhook_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Detalhes do webhook

---

### PUT /webhooks/{webhook_id}

**Resumo:** Atualizar webhook

**Parâmetros:**

- `webhook_id` (path) *(obrigatório)*: 

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Webhook atualizado com sucesso

---

### DELETE /webhooks/{webhook_id}

**Resumo:** Deletar webhook

**Parâmetros:**

- `webhook_id` (path) *(obrigatório)*: 

**Respostas:**

- **200**: Webhook deletado com sucesso

---

### POST /webhooks/{webhook_id}/test

**Resumo:** Testar webhook

Envia evento de teste para validar webhook

**Parâmetros:**

- `webhook_id` (path) *(obrigatório)*: 

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Teste enviado com sucesso

---

### POST /webhooks/events/trigger

**Resumo:** Disparar evento

Dispara evento manualmente para webhooks relevantes

**Body da Requisição:**

```json
{
  // Estrutura do JSON
}
```

**Respostas:**

- **200**: Evento disparado com sucesso

---

## 📊 Schemas de Dados

### AnalysisResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### SentimentAnalysis

**Propriedades:**

- `overall_sentiment` (string): 
- `confidence` (number): 
- `emotions` (object): 
- `psychological_triggers` (array): 
- `persuasion_techniques` (array): 

---

### VisualAnalysis

**Propriedades:**

- `composition_score` (integer): 
- `color_analysis` (object): 
- `quality_metrics` (object): 
- `viral_potential` (integer): 

---

### MetricsAnalysis

**Propriedades:**

- `engagement_rate` (number): 
- `viral_velocity` (number): 
- `audience_quality` (number): 
- `growth_prediction` (object): 

---

### Recommendation

**Propriedades:**

- `type` (string): 
- `priority` (string): 
- `recommendation` (string): 
- `expected_impact` (string): 
- `implementation_difficulty` (string): 

---

### ScrapingResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### TemplateResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### ProfileAnalysisResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### WebhookResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### SystemStatusResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### CreateTemplateRequest

**Propriedades:**

- `template_name` (string): 
- `content_type` (string): 
- `visual_structure` (object): 
- `content_formula` (object): 
- `target_platforms` (array): 
- `search_tags` (array): 

---

### ErrorResponse

**Propriedades:**

- `success` (boolean): 
- `error` (string): 
- `error_code` (string): 
- `timestamp` (string): 

---

### BatchAnalysisResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### SentimentAnalysisResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 
- `timestamp` (string): 

---

### ScrapingSessionResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### ScheduleResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### ViralTrendsResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### HashtagTrendsResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### CreatorTrendsResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### TemplatesListResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### ExtractedTemplateResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### AdaptedTemplateResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### TemplateSearchResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### ProfilesListResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### ProfileComparisonResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### BatchProfileAnalysisResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### ServiceActionResponse

**Propriedades:**

- `success` (boolean): 
- `message` (string): 
- `service_id` (string): 
- `action` (string): 
- `timestamp` (string): 

---

### SystemLogsResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### BackupResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### MaintenanceResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

### WebhooksListResponse

**Propriedades:**

- `success` (boolean): 
- `data` (object): 

---

