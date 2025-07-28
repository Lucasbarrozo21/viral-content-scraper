# 🚀 GUIA COMPLETO DE DEPLOY AUTOMATIZADO

## Sistema de Deploy Automatizado para Viral Content Scraper

**Autor:** Manus AI  
**Data:** 28 de Janeiro de 2025  
**Versão:** 1.0.0

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Métodos de Deploy](#métodos-de-deploy)
5. [CI/CD com GitHub Actions](#cicd-com-github-actions)
6. [Deploy Manual](#deploy-manual)
7. [Deploy com Docker](#deploy-com-docker)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Backup e Recuperação](#backup-e-recuperação)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

Este sistema de deploy automatizado foi desenvolvido especificamente para a ferramenta **Viral Content Scraper**, proporcionando:

### ✨ Características Principais

- **Zero Downtime**: Deploy sem interrupção do serviço
- **Rollback Automático**: Reversão instantânea em caso de falha
- **Multi-Ambiente**: Staging, produção e desenvolvimento
- **CI/CD Integrado**: Pipeline automatizado com GitHub Actions
- **Monitoramento**: Métricas e alertas em tempo real
- **Backup Automático**: Proteção de dados garantida
- **Escalabilidade**: Suporte a Docker, Swarm e Kubernetes

### 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DESENVOLVIMENTO  │    │     STAGING     │    │    PRODUÇÃO     │
│                 │    │                 │    │                 │
│ • Testes locais │    │ • Testes auto   │    │ • Deploy Blue   │
│ • Validação     │────▶│ • Integração    │────▶│ • Green         │
│ • Commit/Push   │    │ • Aprovação     │    │ • Monitoramento │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 PRÉ-REQUISITOS

### 📋 Requisitos do Sistema

#### Para Deploy Manual:
- **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 8+
- **Memória RAM**: Mínimo 8GB (Recomendado 16GB+)
- **Armazenamento**: Mínimo 50GB SSD
- **CPU**: Mínimo 4 cores (Recomendado 8+ cores)
- **Rede**: Conexão estável com internet

#### Para Deploy com Docker:
- **Docker**: Versão 20.10+
- **Docker Compose**: Versão 2.0+
- **Memória RAM**: Mínimo 16GB
- **Armazenamento**: Mínimo 100GB SSD

#### Para Deploy com Kubernetes:
- **Kubernetes**: Versão 1.24+
- **kubectl**: Configurado e funcional
- **Helm**: Versão 3.0+ (opcional)
- **Cluster**: Mínimo 3 nodes com 8GB RAM cada

### 🛠️ Ferramentas Necessárias

```bash
# Instalar ferramentas básicas
sudo apt update && sudo apt install -y \
    git \
    curl \
    wget \
    rsync \
    ssh \
    htop \
    vim
```

### 🔑 Credenciais e Configurações

#### Variáveis de Ambiente Obrigatórias:

```bash
# Supabase
export SUPABASE_URL="https://kkzbiteakxsexxwiwtom.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# OpenAI
export OPENAI_API_KEY="sk-..."
export OPENAI_API_BASE="https://api.openai.com/v1"

# VPS
export VPS_HOST="seu-servidor.com"
export VPS_USER="ubuntu"
export VPS_SSH_KEY="/path/to/private/key"
```

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. 🏗️ Preparar VPS

Execute o script de configuração inicial na sua VPS:

```bash
# Na VPS
wget https://raw.githubusercontent.com/seu-usuario/viral-content-scraper/main/deploy/setup_vps.sh
chmod +x setup_vps.sh
sudo ./setup_vps.sh
```

Este script irá:
- ✅ Instalar todas as dependências necessárias
- ✅ Configurar PostgreSQL e Redis
- ✅ Configurar Nginx como proxy reverso
- ✅ Configurar firewall e segurança
- ✅ Criar estrutura de diretórios
- ✅ Configurar serviços systemd
- ✅ Configurar backup automático

### 2. 📦 Configurar Repositório Git

```bash
# Inicializar repositório (se necessário)
git init
git add .
git commit -m "Initial commit - Viral Content Scraper"

# Adicionar remote
git remote add origin https://github.com/seu-usuario/viral-content-scraper.git
git push -u origin main
```

### 3. 🔐 Configurar SSH

```bash
# Gerar chave SSH (se necessário)
ssh-keygen -t rsa -b 4096 -C "deploy@viralcontentscraper.com"

# Copiar chave pública para VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@seu-servidor.com

# Testar conexão
ssh ubuntu@seu-servidor.com "echo 'Conexão SSH OK'"
```

---

## 🚀 MÉTODOS DE DEPLOY

### 📊 Comparação dos Métodos

| Método | Complexidade | Escalabilidade | Downtime | Recomendado Para |
|--------|-------------|----------------|----------|------------------|
| **Manual** | Baixa | Baixa | Sim | Desenvolvimento |
| **GitHub Actions** | Média | Média | Não | Produção |
| **Docker** | Alta | Alta | Não | Enterprise |
| **Kubernetes** | Muito Alta | Muito Alta | Não | Grande Escala |

### 🎯 Escolha do Método

#### Para Desenvolvimento:
```bash
./deploy/deploy.sh quick
```

#### Para Produção:
```bash
# Via GitHub Actions (Recomendado)
git push origin main

# Via Docker
./deploy/docker-deploy.sh latest production compose

# Via Script Manual
./deploy/deploy.sh full
```

---

## 🔄 CI/CD COM GITHUB ACTIONS

### 📋 Configuração do GitHub Actions

#### 1. Criar Secrets no GitHub

Acesse: `Settings → Secrets and variables → Actions`

```yaml
# Secrets obrigatórios:
STAGING_HOST: "staging.seu-dominio.com"
STAGING_USER: "ubuntu"
STAGING_SSH_PRIVATE_KEY: "-----BEGIN OPENSSH PRIVATE KEY-----..."

PRODUCTION_HOST: "seu-dominio.com"
PRODUCTION_USER: "ubuntu"
PRODUCTION_SSH_PRIVATE_KEY: "-----BEGIN OPENSSH PRIVATE KEY-----..."

SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/..."
DOCKER_REGISTRY_USER: "seu-usuario"
DOCKER_REGISTRY_PASS: "sua-senha"
```

#### 2. Configurar Workflow

Copie o arquivo de workflow:

```bash
mkdir -p .github/workflows
cp deploy/github_actions.yml .github/workflows/deploy.yml
```

#### 3. Estrutura do Pipeline

```mermaid
graph TD
    A[Push/PR] --> B[Testes]
    B --> C[Build]
    C --> D[Deploy Staging]
    D --> E[Testes Integração]
    E --> F[Deploy Produção]
    F --> G[Verificação]
    G --> H[Notificação]
```

### 🎮 Comandos do Pipeline

#### Deploy Automático:
```bash
# Para staging
git push origin develop

# Para produção
git push origin main
```

#### Deploy Manual:
```bash
# Via GitHub Web Interface
Actions → Deploy Viral Content Scraper → Run workflow
```

#### Rollback:
```bash
# Via GitHub Web Interface
Actions → Deploy Viral Content Scraper → Run workflow → rollback
```

---

## 🛠️ DEPLOY MANUAL

### 🚀 Deploy Completo

```bash
# Executar deploy completo
./deploy/deploy.sh full

# Saída esperada:
# ✅ Pré-requisitos verificados
# ✅ Repositório Git preparado
# ✅ Backup criado
# ✅ Deploy na VPS concluído
# ✅ Verificação de saúde concluída
# ✅ Limpeza concluída
```

### ⚡ Deploy Rápido

```bash
# Para atualizações menores
./deploy/deploy.sh quick
```

### 🔄 Rollback

```bash
# Em caso de problemas
./deploy/deploy.sh rollback
```

### 📊 Monitoramento do Deploy

```bash
# Acompanhar logs em tempo real
tail -f deploy_*.log

# Verificar status dos serviços
ssh ubuntu@seu-servidor.com "
    systemctl status viral-scraper-api
    systemctl status viral-scraper-scrapers
    systemctl status viral-scraper-ai-agents
"
```

---

## 🐳 DEPLOY COM DOCKER

### 🏗️ Preparação

#### 1. Configurar Docker na VPS

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Configurar Registry (Opcional)

```bash
# Para registry privado
export DOCKER_REGISTRY="registry.seu-dominio.com"
export DOCKER_REGISTRY_USER="seu-usuario"
export DOCKER_REGISTRY_PASS="sua-senha"
export PUSH_TO_REGISTRY="true"
```

### 🚀 Executar Deploy

#### Deploy com Docker Compose:
```bash
./deploy/docker-deploy.sh latest production compose deploy
```

#### Deploy com Docker Swarm:
```bash
./deploy/docker-deploy.sh latest production swarm deploy
```

#### Deploy com Kubernetes:
```bash
./deploy/docker-deploy.sh latest production kubernetes deploy
```

### 📊 Monitoramento Docker

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Métricas de recursos
docker stats

# Verificar saúde
curl http://localhost:5001/health
```

### 🔄 Operações Docker

#### Rollback:
```bash
./deploy/docker-deploy.sh latest production compose rollback
```

#### Limpeza:
```bash
./deploy/docker-deploy.sh latest production compose cleanup
```

#### Backup:
```bash
./docker/backup.sh
```

---

## 📊 MONITORAMENTO E LOGS

### 🎯 Métricas Principais

#### Sistema:
- **CPU Usage**: < 80%
- **Memory Usage**: < 85%
- **Disk Usage**: < 90%
- **Network I/O**: Monitorado

#### Aplicação:
- **API Response Time**: < 200ms
- **Error Rate**: < 1%
- **Throughput**: Requests/second
- **Database Connections**: Ativas/Total

### 📈 Ferramentas de Monitoramento

#### Grafana Dashboard:
```bash
# Acessar: http://seu-servidor.com:3001
# Login: admin / admin (alterar na primeira vez)
```

#### Prometheus Metrics:
```bash
# Acessar: http://seu-servidor.com:9090
```

#### Logs Centralizados:
```bash
# Ver logs da API
sudo journalctl -u viral-scraper-api -f

# Ver logs dos Scrapers
sudo journalctl -u viral-scraper-scrapers -f

# Ver logs dos AI Agents
sudo journalctl -u viral-scraper-ai-agents -f
```

### 🚨 Alertas Configurados

#### Slack/Discord:
- Deploy realizado com sucesso
- Falha no deploy
- Rollback executado
- Serviço indisponível
- Alto uso de recursos

#### Email:
- Relatórios diários
- Alertas críticos
- Resumo semanal de performance

---

## 💾 BACKUP E RECUPERAÇÃO

### 🔄 Backup Automático

#### Configuração:
```bash
# Backup diário às 02:00
0 2 * * * /usr/local/bin/viral-scraper-backup.sh

# Verificar cron
crontab -l
```

#### Tipos de Backup:

1. **Backup Completo**:
   - Código da aplicação
   - Banco de dados
   - Configurações
   - Logs importantes

2. **Backup Incremental**:
   - Apenas mudanças desde último backup
   - Mais rápido e eficiente

3. **Backup de Emergência**:
   - Antes de cada deploy
   - Permite rollback imediato

### 🔄 Recuperação

#### Recuperação Completa:
```bash
# Listar backups disponíveis
ls -la /opt/backups/

# Restaurar backup específico
sudo ./deploy/restore.sh /opt/backups/backup_20250128_020000.tar.gz
```

#### Recuperação do Banco:
```bash
# Restaurar apenas banco de dados
psql -U viral_user -h localhost viral_content_db < backup_database.sql
```

#### Recuperação de Configurações:
```bash
# Restaurar configurações específicas
sudo cp backup_configs/* /etc/viral-scraper/
sudo systemctl restart viral-scraper-*
```

---

## 🔧 TROUBLESHOOTING

### ❌ Problemas Comuns

#### 1. Falha na Conexão SSH

**Sintoma**: `Permission denied (publickey)`

**Solução**:
```bash
# Verificar chave SSH
ssh-add -l

# Recriar chave se necessário
ssh-keygen -t rsa -b 4096 -C "deploy@viralcontentscraper.com"
ssh-copy-id ubuntu@seu-servidor.com
```

#### 2. Serviços Não Iniciam

**Sintoma**: `Failed to start viral-scraper-api.service`

**Solução**:
```bash
# Verificar logs
sudo journalctl -u viral-scraper-api -n 50

# Verificar dependências
sudo systemctl status postgresql
sudo systemctl status redis-server

# Reiniciar dependências
sudo systemctl restart postgresql redis-server
sudo systemctl restart viral-scraper-api
```

#### 3. Erro de Conexão com Banco

**Sintoma**: `connection to server at "localhost" (127.0.0.1), port 5432 failed`

**Solução**:
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar configuração
sudo -u postgres psql -c "SELECT version();"

# Recriar usuário se necessário
sudo -u postgres psql -c "DROP USER IF EXISTS viral_user;"
sudo -u postgres psql -c "CREATE USER viral_user WITH PASSWORD 'viral_password_2025';"
```

#### 4. Deploy Falha no GitHub Actions

**Sintoma**: `Host key verification failed`

**Solução**:
```bash
# Adicionar host key aos known_hosts
ssh-keyscan seu-servidor.com >> ~/.ssh/known_hosts

# Verificar secrets no GitHub
# Settings → Secrets → Actions
```

#### 5. Alto Uso de Memória

**Sintoma**: Sistema lento, OOM killer ativo

**Solução**:
```bash
# Verificar uso de memória
free -h
htop

# Otimizar configurações
sudo vim /etc/postgresql/*/main/postgresql.conf
# shared_buffers = 256MB
# effective_cache_size = 1GB

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 🔍 Comandos de Diagnóstico

#### Sistema:
```bash
# Status geral
sudo systemctl status viral-scraper-*

# Uso de recursos
htop
iotop
nethogs

# Logs do sistema
sudo journalctl -xe
```

#### Rede:
```bash
# Verificar portas
sudo netstat -tlnp | grep -E ':(5001|8080|3000)'

# Testar conectividade
curl -I http://localhost:5001/health
telnet localhost 5432
```

#### Banco de Dados:
```bash
# Conectar ao banco
sudo -u postgres psql viral_content_db

# Verificar conexões ativas
SELECT count(*) FROM pg_stat_activity;

# Verificar tamanho do banco
SELECT pg_size_pretty(pg_database_size('viral_content_db'));
```

### 📞 Suporte

#### Logs Importantes:
```bash
# Coletar logs para suporte
sudo tar -czf viral-scraper-logs-$(date +%Y%m%d).tar.gz \
    /var/log/viral-scraper/ \
    /var/log/nginx/ \
    /var/log/postgresql/ \
    ~/.pm2/logs/
```

#### Informações do Sistema:
```bash
# Informações para suporte
echo "=== SYSTEM INFO ===" > system-info.txt
uname -a >> system-info.txt
cat /etc/os-release >> system-info.txt
free -h >> system-info.txt
df -h >> system-info.txt
docker --version >> system-info.txt
docker-compose --version >> system-info.txt
```

---

## 🎯 CONCLUSÃO

Este sistema de deploy automatizado foi projetado para garantir que sua ferramenta **Viral Content Scraper** seja implantada de forma confiável, escalável e segura. Com múltiplas opções de deploy e monitoramento abrangente, você pode focar no desenvolvimento enquanto o sistema cuida da infraestrutura.

### ✅ Benefícios Alcançados:

- **Zero Downtime**: Deploys sem interrupção
- **Rollback Automático**: Recuperação instantânea
- **Monitoramento 24/7**: Visibilidade completa
- **Backup Automático**: Proteção garantida
- **Escalabilidade**: Crescimento sem limites

### 🚀 Próximos Passos:

1. Configure seu ambiente seguindo este guia
2. Execute o primeiro deploy
3. Configure monitoramento e alertas
4. Teste o processo de rollback
5. Documente customizações específicas

**Sua ferramenta bilionária está pronta para conquistar o mundo!** 🌟

---

*Documentação gerada automaticamente pelo sistema Manus AI*  
*Última atualização: 28 de Janeiro de 2025*

