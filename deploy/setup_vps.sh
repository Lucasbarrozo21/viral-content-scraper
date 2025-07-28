#!/bin/bash

# ============================================================================
# SETUP VPS - VIRAL CONTENT SCRAPER
# Script para configuração inicial da VPS
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
PROJECT_PATH="/opt/viral-content-scraper"
BACKUP_PATH="/opt/backups/viral-content-scraper"
LOG_FILE="setup_vps_$(date +%Y%m%d_%H%M%S).log"

# Função para logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
print_banner() {
    echo -e "${PURPLE}"
    echo "============================================================================"
    echo "🛠️ SETUP VPS - VIRAL CONTENT SCRAPER"
    echo "============================================================================"
    echo "Configuração inicial da VPS para ferramenta bilionária"
    echo "Autor: Manus AI | Data: $(date '+%d/%m/%Y %H:%M:%S')"
    echo "============================================================================"
    echo -e "${NC}"
}

# Atualizar sistema
update_system() {
    log "🔄 Atualizando sistema..."
    
    sudo apt update
    sudo apt upgrade -y
    
    success "✅ Sistema atualizado"
}

# Instalar dependências básicas
install_basic_dependencies() {
    log "📦 Instalando dependências básicas..."
    
    sudo apt install -y \
        curl \
        wget \
        git \
        vim \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        rsync
    
    success "✅ Dependências básicas instaladas"
}

# Instalar Node.js
install_nodejs() {
    log "📦 Instalando Node.js..."
    
    # Instalar Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verificar instalação
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    info "✅ Node.js $node_version instalado"
    info "✅ npm $npm_version instalado"
    
    # Instalar PM2 globalmente
    sudo npm install -g pm2
    
    success "✅ Node.js e PM2 instalados"
}

# Instalar Python
install_python() {
    log "📦 Instalando Python..."
    
    sudo apt install -y \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev
    
    # Verificar instalação
    python_version=$(python3 --version)
    pip_version=$(pip3 --version)
    
    info "✅ $python_version instalado"
    info "✅ pip3 instalado"
    
    success "✅ Python instalado"
}

# Instalar PostgreSQL
install_postgresql() {
    log "📦 Instalando PostgreSQL..."
    
    sudo apt install -y postgresql postgresql-contrib
    
    # Iniciar serviço
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Criar usuário e banco para o projeto
    sudo -u postgres psql -c "CREATE USER viral_user WITH PASSWORD 'viral_password_2025';"
    sudo -u postgres psql -c "CREATE DATABASE viral_content_db OWNER viral_user;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE viral_content_db TO viral_user;"
    
    success "✅ PostgreSQL instalado e configurado"
}

# Instalar Redis
install_redis() {
    log "📦 Instalando Redis..."
    
    sudo apt install -y redis-server
    
    # Configurar Redis
    sudo sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # Iniciar serviço
    sudo systemctl restart redis-server
    sudo systemctl enable redis-server
    
    success "✅ Redis instalado e configurado"
}

# Instalar Docker (opcional)
install_docker() {
    log "📦 Instalando Docker..."
    
    # Adicionar repositório Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    
    # Instalar Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    success "✅ Docker instalado"
}

# Instalar Nginx
install_nginx() {
    log "📦 Instalando Nginx..."
    
    sudo apt install -y nginx
    
    # Iniciar serviço
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Configurar firewall
    sudo ufw allow 'Nginx Full'
    
    success "✅ Nginx instalado"
}

# Configurar firewall
configure_firewall() {
    log "🔥 Configurando firewall..."
    
    # Habilitar UFW
    sudo ufw --force enable
    
    # Regras básicas
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Permitir SSH
    sudo ufw allow ssh
    
    # Permitir HTTP e HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Permitir porta da API
    sudo ufw allow 5001
    
    # Permitir porta do admin panel
    sudo ufw allow 8080
    
    success "✅ Firewall configurado"
}

# Criar estrutura de diretórios
create_directory_structure() {
    log "📁 Criando estrutura de diretórios..."
    
    # Diretórios principais
    sudo mkdir -p $PROJECT_PATH
    sudo mkdir -p $BACKUP_PATH
    sudo mkdir -p /var/log/viral-scraper
    sudo mkdir -p /etc/viral-scraper
    
    # Definir permissões
    sudo chown -R $USER:$USER $PROJECT_PATH
    sudo chown -R $USER:$USER $BACKUP_PATH
    sudo chown -R $USER:$USER /var/log/viral-scraper
    
    success "✅ Estrutura de diretórios criada"
}

# Configurar serviços systemd
configure_systemd_services() {
    log "⚙️ Configurando serviços systemd..."
    
    # Serviço da API
    sudo tee /etc/systemd/system/viral-scraper-api.service > /dev/null <<EOF
[Unit]
Description=Viral Content Scraper API
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_PATH/api
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/python3 app_supabase.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Serviço dos Scrapers
    sudo tee /etc/systemd/system/viral-scraper-scrapers.service > /dev/null <<EOF
[Unit]
Description=Viral Content Scraper Scrapers
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_PATH/scrapers
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Serviço dos Agentes IA
    sudo tee /etc/systemd/system/viral-scraper-ai-agents.service > /dev/null <<EOF
[Unit]
Description=Viral Content Scraper AI Agents
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_PATH/ai_agents
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Recarregar systemd
    sudo systemctl daemon-reload
    
    success "✅ Serviços systemd configurados"
}

# Configurar Nginx
configure_nginx() {
    log "🌐 Configurando Nginx..."
    
    # Configuração do site
    sudo tee /etc/nginx/sites-available/viral-scraper > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    # API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Admin Panel
    location /admin/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Dashboard React
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }
}
EOF

    # Habilitar site
    sudo ln -sf /etc/nginx/sites-available/viral-scraper /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    sudo nginx -t
    
    # Recarregar Nginx
    sudo systemctl reload nginx
    
    success "✅ Nginx configurado"
}

# Configurar SSL com Let's Encrypt (opcional)
configure_ssl() {
    log "🔒 Configurando SSL..."
    
    # Instalar Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    info "⚠️ Para configurar SSL, execute:"
    info "sudo certbot --nginx -d seu-dominio.com"
    
    success "✅ Certbot instalado"
}

# Configurar monitoramento
configure_monitoring() {
    log "📊 Configurando monitoramento..."
    
    # Instalar htop, iotop, etc.
    sudo apt install -y htop iotop nethogs
    
    # Configurar logrotate
    sudo tee /etc/logrotate.d/viral-scraper > /dev/null <<EOF
/var/log/viral-scraper/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
}
EOF

    success "✅ Monitoramento configurado"
}

# Configurar backup automático
configure_backup() {
    log "💾 Configurando backup automático..."
    
    # Script de backup
    sudo tee /usr/local/bin/viral-scraper-backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_PATH/auto_backup_\$DATE"

# Criar backup
mkdir -p \$BACKUP_DIR
cp -r $PROJECT_PATH \$BACKUP_DIR/
pg_dump -U viral_user -h localhost viral_content_db > \$BACKUP_DIR/database.sql

# Comprimir
tar -czf \$BACKUP_DIR.tar.gz -C $BACKUP_PATH auto_backup_\$DATE
rm -rf \$BACKUP_DIR

# Manter apenas 7 backups
cd $BACKUP_PATH
ls -t *.tar.gz | tail -n +8 | xargs -r rm

echo "Backup criado: \$BACKUP_DIR.tar.gz"
EOF

    sudo chmod +x /usr/local/bin/viral-scraper-backup.sh
    
    # Cron job para backup diário
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/viral-scraper-backup.sh") | crontab -
    
    success "✅ Backup automático configurado"
}

# Otimizações de performance
optimize_system() {
    log "⚡ Aplicando otimizações de performance..."
    
    # Otimizações do kernel
    sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# Viral Content Scraper Optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
vm.swappiness = 10
fs.file-max = 65535
EOF

    # Aplicar otimizações
    sudo sysctl -p
    
    # Limites de arquivos
    sudo tee -a /etc/security/limits.conf > /dev/null <<EOF

# Viral Content Scraper Limits
$USER soft nofile 65535
$USER hard nofile 65535
EOF

    success "✅ Otimizações aplicadas"
}

# Teste final
final_test() {
    log "🧪 Executando teste final..."
    
    # Testar serviços
    services=("postgresql" "redis-server" "nginx")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            success "✅ $service está ativo"
        else
            error "❌ $service não está ativo"
        fi
    done
    
    # Testar conectividade
    if curl -f http://localhost > /dev/null 2>&1; then
        success "✅ Nginx respondendo"
    else
        error "❌ Nginx não está respondendo"
    fi
    
    success "✅ Teste final concluído"
}

# Função principal
main() {
    print_banner
    
    log "🚀 Iniciando configuração da VPS..."
    
    update_system
    install_basic_dependencies
    install_nodejs
    install_python
    install_postgresql
    install_redis
    install_docker
    install_nginx
    configure_firewall
    create_directory_structure
    configure_systemd_services
    configure_nginx
    configure_ssl
    configure_monitoring
    configure_backup
    optimize_system
    final_test
    
    success "🎉 Configuração da VPS concluída!"
    
    echo -e "${CYAN}"
    echo "============================================================================"
    echo "✅ VPS CONFIGURADA COM SUCESSO!"
    echo "============================================================================"
    echo "🌐 Sua VPS está pronta para receber o deploy da ferramenta bilionária"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure o domínio DNS apontando para esta VPS"
    echo "2. Execute: sudo certbot --nginx -d seu-dominio.com (para SSL)"
    echo "3. Execute o deploy: ./deploy/deploy.sh full"
    echo ""
    echo "🔧 Serviços configurados:"
    echo "• PostgreSQL: localhost:5432"
    echo "• Redis: localhost:6379"
    echo "• Nginx: porta 80/443"
    echo "• API: porta 5001 (proxy via Nginx)"
    echo "• Admin: porta 8080 (proxy via Nginx)"
    echo ""
    echo "📊 Logs em: $LOG_FILE"
    echo "============================================================================"
    echo -e "${NC}"
}

# Executar função principal
main "$@"

