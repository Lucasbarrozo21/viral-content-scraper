#!/bin/bash

# ============================================================================
# DEPLOY AUTOMATIZADO - VIRAL CONTENT SCRAPER
# Script principal para deploy automatizado na VPS
# 
# Autor: Manus AI
# Data: 28 de Janeiro de 2025
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="viral-content-scraper"
REPO_URL="https://github.com/seu-usuario/viral-content-scraper.git"
VPS_HOST="seu-vps.com"
VPS_USER="ubuntu"
VPS_PATH="/opt/viral-content-scraper"
BACKUP_PATH="/opt/backups/viral-content-scraper"
LOG_FILE="deploy_$(date +%Y%m%d_%H%M%S).log"

# Função para logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
print_banner() {
    echo -e "${PURPLE}"
    echo "============================================================================"
    echo "🚀 DEPLOY AUTOMATIZADO - VIRAL CONTENT SCRAPER"
    echo "============================================================================"
    echo "Sistema de deploy com zero downtime para ferramenta bilionária"
    echo "Autor: Manus AI | Data: $(date '+%d/%m/%Y %H:%M:%S')"
    echo "============================================================================"
    echo -e "${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "🔍 Verificando pré-requisitos..."
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        error "Git não está instalado"
    fi
    
    # Verificar SSH
    if ! command -v ssh &> /dev/null; then
        error "SSH não está instalado"
    fi
    
    # Verificar rsync
    if ! command -v rsync &> /dev/null; then
        error "rsync não está instalado"
    fi
    
    # Verificar Docker (opcional)
    if command -v docker &> /dev/null; then
        info "✅ Docker disponível"
    else
        warning "⚠️ Docker não encontrado (opcional)"
    fi
    
    success "✅ Pré-requisitos verificados"
}

# Preparar repositório Git
prepare_git_repo() {
    log "📦 Preparando repositório Git..."
    
    # Verificar se já é um repositório Git
    if [ ! -d ".git" ]; then
        info "Inicializando repositório Git..."
        git init
        git add .
        git commit -m "Initial commit - Viral Content Scraper"
        
        # Adicionar remote (será configurado pelo usuário)
        info "⚠️ Configure o remote do repositório:"
        info "git remote add origin $REPO_URL"
    else
        info "✅ Repositório Git já existe"
    fi
    
    # Verificar mudanças
    if [[ -n $(git status --porcelain) ]]; then
        info "📝 Commitando mudanças..."
        git add .
        git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        info "✅ Nenhuma mudança para commitar"
    fi
    
    success "✅ Repositório Git preparado"
}

# Fazer backup da versão atual
create_backup() {
    log "💾 Criando backup da versão atual..."
    
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    
    ssh $VPS_USER@$VPS_HOST "
        if [ -d '$VPS_PATH' ]; then
            sudo mkdir -p $BACKUP_PATH
            sudo cp -r $VPS_PATH $BACKUP_PATH/$BACKUP_NAME
            echo '✅ Backup criado: $BACKUP_PATH/$BACKUP_NAME'
        else
            echo '⚠️ Diretório do projeto não existe na VPS'
        fi
    "
    
    success "✅ Backup criado"
}

# Deploy na VPS
deploy_to_vps() {
    log "🚀 Iniciando deploy na VPS..."
    
    # Verificar conexão SSH
    if ! ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'Conexão SSH OK'"; then
        error "Falha na conexão SSH com a VPS"
    fi
    
    # Executar deploy remoto
    ssh $VPS_USER@$VPS_HOST "
        set -e
        
        echo '🔄 Parando serviços...'
        sudo systemctl stop viral-scraper-api || true
        sudo systemctl stop viral-scraper-scrapers || true
        sudo systemctl stop viral-scraper-ai-agents || true
        
        echo '📦 Atualizando código...'
        if [ -d '$VPS_PATH' ]; then
            cd $VPS_PATH
            git pull origin main
        else
            sudo mkdir -p $VPS_PATH
            cd $VPS_PATH
            git clone $REPO_URL .
        fi
        
        echo '📋 Instalando dependências Python...'
        cd $VPS_PATH/api
        pip3 install -r requirements.txt
        
        echo '📋 Instalando dependências Node.js...'
        cd $VPS_PATH/scrapers
        npm install
        
        cd $VPS_PATH/ai_agents
        npm install
        
        echo '🔧 Configurando permissões...'
        sudo chown -R $VPS_USER:$VPS_USER $VPS_PATH
        sudo chmod +x $VPS_PATH/deploy/*.sh
        
        echo '🗄️ Executando migrações do banco...'
        cd $VPS_PATH/database
        python3 migrate.py || true
        
        echo '🔄 Iniciando serviços...'
        sudo systemctl start viral-scraper-api
        sudo systemctl start viral-scraper-scrapers
        sudo systemctl start viral-scraper-ai-agents
        
        echo '✅ Deploy concluído!'
    "
    
    success "✅ Deploy na VPS concluído"
}

# Verificar saúde dos serviços
health_check() {
    log "🏥 Verificando saúde dos serviços..."
    
    # Aguardar serviços iniciarem
    sleep 10
    
    # Verificar API
    if ssh $VPS_USER@$VPS_HOST "curl -f http://localhost:5001/health > /dev/null 2>&1"; then
        success "✅ API está funcionando"
    else
        error "❌ API não está respondendo"
    fi
    
    # Verificar serviços systemd
    ssh $VPS_USER@$VPS_HOST "
        if systemctl is-active --quiet viral-scraper-api; then
            echo '✅ Serviço API ativo'
        else
            echo '❌ Serviço API inativo'
        fi
        
        if systemctl is-active --quiet viral-scraper-scrapers; then
            echo '✅ Serviço Scrapers ativo'
        else
            echo '❌ Serviço Scrapers inativo'
        fi
        
        if systemctl is-active --quiet viral-scraper-ai-agents; then
            echo '✅ Serviço AI Agents ativo'
        else
            echo '❌ Serviço AI Agents inativo'
        fi
    "
    
    success "✅ Verificação de saúde concluída"
}

# Rollback em caso de falha
rollback() {
    log "🔄 Iniciando rollback..."
    
    LATEST_BACKUP=$(ssh $VPS_USER@$VPS_HOST "ls -t $BACKUP_PATH | head -n1")
    
    if [ -n "$LATEST_BACKUP" ]; then
        ssh $VPS_USER@$VPS_HOST "
            echo '🔄 Parando serviços...'
            sudo systemctl stop viral-scraper-api || true
            sudo systemctl stop viral-scraper-scrapers || true
            sudo systemctl stop viral-scraper-ai-agents || true
            
            echo '📦 Restaurando backup: $LATEST_BACKUP'
            sudo rm -rf $VPS_PATH
            sudo cp -r $BACKUP_PATH/$LATEST_BACKUP $VPS_PATH
            sudo chown -R $VPS_USER:$VPS_USER $VPS_PATH
            
            echo '🔄 Iniciando serviços...'
            sudo systemctl start viral-scraper-api
            sudo systemctl start viral-scraper-scrapers
            sudo systemctl start viral-scraper-ai-agents
        "
        
        success "✅ Rollback concluído"
    else
        error "❌ Nenhum backup encontrado para rollback"
    fi
}

# Notificações
send_notification() {
    local status=$1
    local message=$2
    
    # Webhook para Slack/Discord (opcional)
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deploy $PROJECT_NAME: $status - $message\"}" \
            "$WEBHOOK_URL" || true
    fi
    
    # Log local
    log "📢 Notificação: $status - $message"
}

# Limpeza de backups antigos
cleanup_old_backups() {
    log "🧹 Limpando backups antigos..."
    
    ssh $VPS_USER@$VPS_HOST "
        if [ -d '$BACKUP_PATH' ]; then
            # Manter apenas os 5 backups mais recentes
            cd $BACKUP_PATH
            ls -t | tail -n +6 | xargs -r sudo rm -rf
            echo '✅ Backups antigos removidos'
        fi
    "
    
    success "✅ Limpeza concluída"
}

# Função principal
main() {
    print_banner
    
    # Verificar argumentos
    DEPLOY_TYPE=${1:-"full"}
    
    case $DEPLOY_TYPE in
        "full")
            log "🚀 Iniciando deploy completo..."
            check_prerequisites
            prepare_git_repo
            create_backup
            deploy_to_vps
            health_check
            cleanup_old_backups
            send_notification "SUCCESS" "Deploy completo realizado com sucesso"
            ;;
        "quick")
            log "⚡ Iniciando deploy rápido..."
            prepare_git_repo
            deploy_to_vps
            health_check
            send_notification "SUCCESS" "Deploy rápido realizado com sucesso"
            ;;
        "rollback")
            log "🔄 Iniciando rollback..."
            rollback
            health_check
            send_notification "WARNING" "Rollback realizado"
            ;;
        *)
            error "Tipo de deploy inválido. Use: full, quick, ou rollback"
            ;;
    esac
    
    success "🎉 Deploy finalizado com sucesso!"
    info "📊 Log salvo em: $LOG_FILE"
    info "🌐 Acesse sua ferramenta em: http://$VPS_HOST"
}

# Tratamento de erros
trap 'error "Deploy falhou! Verifique o log: $LOG_FILE"' ERR

# Executar função principal
main "$@"

