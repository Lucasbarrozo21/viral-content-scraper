# 🚀 Sistema de Deploy Automatizado

## Viral Content Scraper - Deploy System

Este diretório contém todos os scripts e configurações necessárias para deploy automatizado da ferramenta **Viral Content Scraper**.

---

## 📁 Estrutura de Arquivos

```
deploy/
├── README.md                 # Este arquivo
├── DEPLOY_GUIDE.md          # Guia completo de deploy
├── deploy.sh                # Script principal de deploy
├── setup_vps.sh            # Configuração inicial da VPS
├── docker-deploy.sh        # Deploy com Docker
├── github_actions.yml      # Workflow GitHub Actions
└── logs/                   # Logs de deploy (criado automaticamente)
```

---

## 🎯 Quick Start

### 1. 🏗️ Configurar VPS (Primeira vez)

```bash
# Na sua VPS
wget https://raw.githubusercontent.com/seu-usuario/viral-content-scraper/main/deploy/setup_vps.sh
chmod +x setup_vps.sh
sudo ./setup_vps.sh
```

### 2. 🚀 Deploy Simples

```bash
# Deploy completo
./deploy.sh full

# Deploy rápido (apenas código)
./deploy.sh quick

# Rollback em caso de problemas
./deploy.sh rollback
```

### 3. 🐳 Deploy com Docker

```bash
# Deploy com Docker Compose
./docker-deploy.sh latest production compose deploy

# Deploy com Docker Swarm
./docker-deploy.sh latest production swarm deploy
```

---

## ⚙️ Configuração Necessária

### 🔑 Variáveis de Ambiente

Crie um arquivo `.env` no diretório raiz com:

```bash
# VPS Configuration
VPS_HOST="seu-servidor.com"
VPS_USER="ubuntu"
VPS_PATH="/opt/viral-content-scraper"

# Repository
REPO_URL="https://github.com/seu-usuario/viral-content-scraper.git"

# Notifications (opcional)
WEBHOOK_URL="https://hooks.slack.com/services/..."

# Docker (se usando Docker)
DOCKER_REGISTRY="registry.seu-dominio.com"
DOCKER_REGISTRY_USER="seu-usuario"
DOCKER_REGISTRY_PASS="sua-senha"
```

### 🔐 SSH Keys

```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "deploy@viralcontentscraper.com"

# Copiar para VPS
ssh-copy-id ubuntu@seu-servidor.com
```

---

## 📊 Métodos de Deploy

| Método | Comando | Downtime | Complexidade | Recomendado Para |
|--------|---------|----------|--------------|------------------|
| **Manual** | `./deploy.sh full` | Sim | Baixa | Desenvolvimento |
| **GitHub Actions** | `git push origin main` | Não | Média | Produção |
| **Docker** | `./docker-deploy.sh` | Não | Alta | Enterprise |

---

## 🔄 CI/CD com GitHub Actions

### Configuração:

1. **Copiar workflow:**
   ```bash
   mkdir -p .github/workflows
   cp deploy/github_actions.yml .github/workflows/deploy.yml
   ```

2. **Configurar secrets no GitHub:**
   - `STAGING_HOST`
   - `STAGING_USER`
   - `STAGING_SSH_PRIVATE_KEY`
   - `PRODUCTION_HOST`
   - `PRODUCTION_USER`
   - `PRODUCTION_SSH_PRIVATE_KEY`

3. **Deploy automático:**
   ```bash
   # Para staging
   git push origin develop
   
   # Para produção
   git push origin main
   ```

---

## 📈 Monitoramento

### Status dos Serviços:
```bash
# Verificar status
ssh ubuntu@seu-servidor.com "systemctl status viral-scraper-*"

# Ver logs
ssh ubuntu@seu-servidor.com "journalctl -u viral-scraper-api -f"
```

### Health Checks:
```bash
# API
curl http://seu-servidor.com/health

# Dashboard
curl http://seu-servidor.com/api/v1/status
```

---

## 🆘 Troubleshooting

### Problemas Comuns:

#### 1. Erro de SSH
```bash
# Verificar conexão
ssh ubuntu@seu-servidor.com "echo 'OK'"

# Reconfigurar se necessário
ssh-copy-id ubuntu@seu-servidor.com
```

#### 2. Serviços não iniciam
```bash
# Verificar logs
ssh ubuntu@seu-servidor.com "sudo journalctl -xe"

# Reiniciar serviços
ssh ubuntu@seu-servidor.com "sudo systemctl restart viral-scraper-*"
```

#### 3. Deploy falha
```bash
# Ver logs do deploy
cat deploy_*.log

# Executar rollback
./deploy.sh rollback
```

---

## 📞 Suporte

### Logs Importantes:
- `deploy_*.log` - Logs de deploy
- `/var/log/viral-scraper/` - Logs da aplicação (na VPS)
- `/var/log/nginx/` - Logs do Nginx (na VPS)

### Comandos Úteis:
```bash
# Status completo
ssh ubuntu@seu-servidor.com "
    systemctl status viral-scraper-*
    docker ps
    free -h
    df -h
"

# Backup manual
ssh ubuntu@seu-servidor.com "/usr/local/bin/viral-scraper-backup.sh"
```

---

## 🎯 Próximos Passos

1. ✅ Configure sua VPS usando `setup_vps.sh`
2. ✅ Configure as variáveis de ambiente
3. ✅ Configure SSH keys
4. ✅ Execute seu primeiro deploy
5. ✅ Configure GitHub Actions (opcional)
6. ✅ Configure monitoramento
7. ✅ Teste o processo de rollback

---

**🌟 Sua ferramenta bilionária está pronta para conquista o mundo!**

*Para mais detalhes, consulte o [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)*

