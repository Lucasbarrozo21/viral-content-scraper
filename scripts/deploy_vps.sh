#!/bin/bash

# =================================================================
# SCRIPT DE DEPLOY AUTOMATIZADO - SISTEMA VIRAL SCRAPER
# Sistema de Scraping Inteligente para Conteúdo Viral
# 
# Este script automatiza completamente o deploy em VPS
# Autor: Manus AI
# Data: 27 de Janeiro de 2025
# Versão: 2.0 - REVOLUTIONARY EDITION
# =================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner de início
echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 VIRAL CONTENT SCRAPER - DEPLOY AUTOMATIZADO 🚀        ║
║                                                              ║
║    Sistema de Scraping Inteligente para Conteúdo Viral      ║
║    Versão 2.0 - REVOLUTIONARY EDITION                       ║
║                                                              ║
║    Desenvolvido por: Manus AI                                ║
║    Data: 27 de Janeiro de 2025                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Use um usuário com sudo."
fi

# Verificar sistema operacional
if [[ ! -f /etc/os-release ]]; then
    error "Sistema operacional não suportado. Use Ubuntu 20.04+ ou Debian 10+"
fi

source /etc/os-release
if [[ $ID != "ubuntu" && $ID != "debian" ]]; then
    error "Sistema operacional não suportado: $ID. Use Ubuntu ou Debian."
fi

log "🎯 Iniciando deploy do Sistema Viral Scraper..."
log "📊 Sistema detectado: $PRETTY_NAME"

# Configurações
PROJECT_DIR="/opt/viral_scraper"
BACKUP_DIR="/opt/backups/viral_scraper"
LOG_DIR="/var/log/viral_scraper"
NGINX_SITES="/etc/nginx/sites-available"
SYSTEMD_DIR="/etc/systemd/system"

# Solicitar informações do usuário
echo -e "\n${CYAN}📝 CONFIGURAÇÃO INICIAL${NC}"
echo "Por favor, forneça as seguintes informações:"

read -p "🌐 Domínio (ex: scraper.exemplo.com): " DOMAIN
read -p "📧 Email para SSL (Let's Encrypt): " EMAIL
read -s -p "🔐 Senha do banco PostgreSQL: " DB_PASSWORD
echo
read -s -p "🔑 OpenAI API Key: " OPENAI_API_KEY
echo
read -p "📱 Webhook Slack (opcional): " SLACK_WEBHOOK

# Validar inputs obrigatórios
if [[ -z "$DOMAIN" || -z "$EMAIL" || -z "$DB_PASSWORD" || -z "$OPENAI_API_KEY" ]]; then
    error "Todos os campos obrigatórios devem ser preenchidos!"
fi

log "✅ Configuração inicial concluída"

# Função para instalar dependências
install_dependencies() {
    log "📦 Instalando dependências do sistema..."
    
    # Atualizar sistema
    sudo apt update && sudo apt upgrade -y
    
    # Instalar dependências básicas
    sudo apt install -y \
        curl \
        wget \
        git \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential
    
    log "✅ Dependências básicas instaladas"
}

# Função para instalar Node.js
install_nodejs() {
    log "🟢 Instalando Node.js 18..."
    
    # Remover versões antigas
    sudo apt remove -y nodejs npm
    
    # Instalar Node.js 18 via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verificar instalação
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log "✅ Node.js instalado: $node_version"
    log "✅ NPM instalado: $npm_version"
}

# Função para instalar Python
install_python() {
    log "🐍 Instalando Python 3.9+..."
    
    sudo apt install -y \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev
    
    # Atualizar pip
    python3 -m pip install --upgrade pip
    
    python_version=$(python3 --version)
    pip_version=$(python3 -m pip --version)
    
    log "✅ Python instalado: $python_version"
    log "✅ Pip instalado: $pip_version"
}

# Função para instalar PostgreSQL
install_postgresql() {
    log "🐘 Instalando PostgreSQL..."
    
    sudo apt install -y postgresql postgresql-contrib
    
    # Iniciar e habilitar serviço
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Criar usuário e banco
    sudo -u postgres psql << EOF
CREATE USER viral_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE viral_content_db OWNER viral_user;
GRANT ALL PRIVILEGES ON DATABASE viral_content_db TO viral_user;
ALTER USER viral_user CREATEDB;
\q
EOF
    
    log "✅ PostgreSQL instalado e configurado"
}

# Função para instalar Redis
install_redis() {
    log "🔴 Instalando Redis..."
    
    sudo apt install -y redis-server
    
    # Configurar Redis
    sudo sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # Iniciar e habilitar serviço
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    log "✅ Redis instalado e configurado"
}

# Função para instalar Nginx
install_nginx() {
    log "🌐 Instalando Nginx..."
    
    sudo apt install -y nginx
    
    # Iniciar e habilitar serviço
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log "✅ Nginx instalado"
}

# Função para instalar Chromium (para Puppeteer)
install_chromium() {
    log "🌐 Instalando Chromium para Puppeteer..."
    
    sudo apt install -y \
        chromium-browser \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libgtk-3-0 \
        libgtk-4-1 \
        libnspr4 \
        libnss3 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        xdg-utils
    
    log "✅ Chromium instalado"
}

# Função para clonar repositório
clone_repository() {
    log "📥 Clonando repositório do projeto..."
    
    # Criar diretório do projeto
    sudo mkdir -p $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
    
    # Clonar repositório (assumindo que já existe localmente)
    if [[ -d "/home/ubuntu/viral_content_scraper" ]]; then
        cp -r /home/ubuntu/viral_content_scraper/* $PROJECT_DIR/
        log "✅ Projeto copiado de /home/ubuntu/viral_content_scraper"
    else
        error "Diretório do projeto não encontrado em /home/ubuntu/viral_content_scraper"
    fi
    
    # Definir permissões
    sudo chown -R $USER:$USER $PROJECT_DIR
    chmod +x $PROJECT_DIR/scripts/*.sh
}

# Função para instalar dependências do projeto
install_project_dependencies() {
    log "📦 Instalando dependências do projeto..."
    
    cd $PROJECT_DIR
    
    # Scrapers (Node.js)
    log "🕷️ Instalando dependências dos scrapers..."
    cd scrapers
    npm install --production
    
    # AI Agents (Node.js)
    log "🤖 Instalando dependências dos agentes IA..."
    cd ../ai_agents
    npm install --production
    
    # API (Python)
    log "🔌 Instalando dependências da API..."
    cd ../api
    python3 -m pip install -r requirements.txt
    
    # Frontend (Node.js)
    log "💻 Instalando dependências do frontend..."
    cd ../viral-dashboard
    npm install
    npm run build
    
    log "✅ Todas as dependências instaladas"
}

# Função para configurar variáveis de ambiente
configure_environment() {
    log "⚙️ Configurando variáveis de ambiente..."
    
    cd $PROJECT_DIR
    
    # Criar arquivo .env
    cat > config/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://viral_user:$DB_PASSWORD@localhost:5432/viral_content_db
REDIS_URL=redis://localhost:6379/0

# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_API_BASE=https://api.openai.com/v1

# Flask Configuration
FLASK_SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=production

# Security
ALLOWED_HOSTS=$DOMAIN,localhost,127.0.0.1
CORS_ORIGINS=https://$DOMAIN,http://localhost:3000

# Logging
LOG_LEVEL=INFO
LOG_DIR=$LOG_DIR

# Monitoring
SLACK_WEBHOOK_URL=$SLACK_WEBHOOK

# Scrapers Configuration
HEADLESS=true
RATE_LIMIT_ENABLED=true
MAX_CONCURRENT_SCRAPERS=3
SCRAPER_TIMEOUT=60000

# Cache Configuration
CACHE_TTL=3600
REDIS_MAX_CONNECTIONS=10

# File Storage
UPLOAD_FOLDER=$PROJECT_DIR/uploads
MAX_CONTENT_LENGTH=16777216

# Performance
WORKERS=4
THREADS=2
TIMEOUT=30
EOF
    
    # Definir permissões seguras
    chmod 600 config/.env
    
    log "✅ Variáveis de ambiente configuradas"
}

# Função para executar migrations do banco
run_migrations() {
    log "🗄️ Executando migrations do banco de dados..."
    
    cd $PROJECT_DIR/database
    
    # Executar schema principal
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U viral_user -d viral_content_db -f create_schema.sql
    
    # Executar migrations se existirem
    if [[ -d "migrations" ]]; then
        for migration in migrations/*.sql; do
            if [[ -f "$migration" ]]; then
                log "📄 Executando migration: $(basename $migration)"
                PGPASSWORD=$DB_PASSWORD psql -h localhost -U viral_user -d viral_content_db -f "$migration"
            fi
        done
    fi
    
    log "✅ Migrations executadas com sucesso"
}

# Função para criar diretórios necessários
create_directories() {
    log "📁 Criando diretórios necessários..."
    
    # Diretórios de log
    sudo mkdir -p $LOG_DIR
    sudo chown -R $USER:$USER $LOG_DIR
    
    # Diretório de backup
    sudo mkdir -p $BACKUP_DIR
    sudo chown -R $USER:$USER $BACKUP_DIR
    
    # Diretório de uploads
    mkdir -p $PROJECT_DIR/uploads
    mkdir -p $PROJECT_DIR/temp
    
    log "✅ Diretórios criados"
}

# Função para configurar serviços systemd
configure_systemd_services() {
    log "🔧 Configurando serviços systemd..."
    
    # Serviço da API
    sudo tee $SYSTEMD_DIR/viral-api.service > /dev/null << EOF
[Unit]
Description=Viral Scraper API
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR/api
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=$PROJECT_DIR/config/.env
ExecStart=/usr/bin/python3 app_simple.py
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/api.log
StandardError=append:$LOG_DIR/api-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Serviço dos Scrapers
    sudo tee $SYSTEMD_DIR/viral-scrapers.service > /dev/null << EOF
[Unit]
Description=Viral Content Scrapers
After=network.target redis.service viral-api.service
Requires=redis.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR/scrapers
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/config/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=30
StandardOutput=append:$LOG_DIR/scrapers.log
StandardError=append:$LOG_DIR/scrapers-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Serviço dos Agentes IA
    sudo tee $SYSTEMD_DIR/viral-agents.service > /dev/null << EOF
[Unit]
Description=Viral AI Agents
After=network.target redis.service viral-api.service
Requires=redis.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR/ai_agents
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/config/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=30
StandardOutput=append:$LOG_DIR/agents.log
StandardError=append:$LOG_DIR/agents-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Recarregar systemd
    sudo systemctl daemon-reload
    
    log "✅ Serviços systemd configurados"
}

# Função para configurar Nginx
configure_nginx() {
    log "🌐 Configurando Nginx..."
    
    # Configuração do site
    sudo tee $NGINX_SITES/viral-scraper.conf > /dev/null << EOF
# Viral Scraper Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;
    
    # Frontend (React build)
    location / {
        root $PROJECT_DIR/viral-dashboard/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/v1/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(env|log|sql|md)\$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
    
    # Habilitar site
    sudo ln -sf $NGINX_SITES/viral-scraper.conf /etc/nginx/sites-enabled/
    
    # Remover site padrão
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    sudo nginx -t
    
    # Recarregar Nginx
    sudo systemctl reload nginx
    
    log "✅ Nginx configurado"
}

# Função para configurar SSL com Let's Encrypt
configure_ssl() {
    log "🔒 Configurando SSL com Let's Encrypt..."
    
    # Instalar Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Obter certificado SSL
    sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect
    
    # Configurar renovação automática
    sudo systemctl enable certbot.timer
    
    log "✅ SSL configurado com sucesso"
}

# Função para configurar logrotate
configure_logrotate() {
    log "📝 Configurando rotação de logs..."
    
    sudo tee /etc/logrotate.d/viral-scraper > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload viral-api viral-scrapers viral-agents
    endscript
}
EOF
    
    log "✅ Logrotate configurado"
}

# Função para configurar backup automático
configure_backup() {
    log "💾 Configurando backup automático..."
    
    # Script de backup
    tee $PROJECT_DIR/scripts/backup.sh > /dev/null << EOF
#!/bin/bash
# Backup automático do Viral Scraper

BACKUP_DIR="$BACKUP_DIR"
DATE=\$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/backup.log"

echo "[\$(date)] Iniciando backup..." >> \$LOG_FILE

# Criar diretório de backup
mkdir -p \$BACKUP_DIR

# Backup do banco de dados
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U viral_user viral_content_db > \$BACKUP_DIR/database_\$DATE.sql
echo "[\$(date)] Backup do banco concluído" >> \$LOG_FILE

# Backup das configurações
tar -czf \$BACKUP_DIR/config_\$DATE.tar.gz -C $PROJECT_DIR config/
echo "[\$(date)] Backup das configurações concluído" >> \$LOG_FILE

# Backup dos logs importantes
tar -czf \$BACKUP_DIR/logs_\$DATE.tar.gz -C $LOG_DIR .
echo "[\$(date)] Backup dos logs concluído" >> \$LOG_FILE

# Limpar backups antigos (manter 30 dias)
find \$BACKUP_DIR -name "*.sql" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
echo "[\$(date)] Limpeza de backups antigos concluída" >> \$LOG_FILE

echo "[\$(date)] Backup concluído com sucesso" >> \$LOG_FILE
EOF
    
    chmod +x $PROJECT_DIR/scripts/backup.sh
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/scripts/backup.sh") | crontab -
    
    log "✅ Backup automático configurado (diário às 2h)"
}

# Função para configurar monitoramento
configure_monitoring() {
    log "📊 Configurando monitoramento..."
    
    # Script de monitoramento
    tee $PROJECT_DIR/scripts/monitor.sh > /dev/null << EOF
#!/bin/bash
# Monitor do sistema Viral Scraper

LOG_FILE="$LOG_DIR/monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEM=85
ALERT_THRESHOLD_DISK=90

# Função para enviar alerta
send_alert() {
    local message="\$1"
    local severity="\$2"
    
    echo "[\$(date)] ALERT [\$severity]: \$message" >> \$LOG_FILE
    
    # Enviar para Slack se configurado
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \\
            --data "{\\"text\\":\\"🚨 Viral Scraper Alert: \$message\\"}" \\
            "$SLACK_WEBHOOK" 2>/dev/null
    fi
}

# Verificar serviços
for service in viral-api viral-scrapers viral-agents postgresql redis nginx; do
    if ! systemctl is-active --quiet \$service; then
        send_alert "Serviço \$service está inativo" "CRITICAL"
    fi
done

# Verificar uso de CPU
CPU_USAGE=\$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | awk -F'%' '{print \$1}')
if (( \$(echo "\$CPU_USAGE > \$ALERT_THRESHOLD_CPU" | bc -l) )); then
    send_alert "Alto uso de CPU: \${CPU_USAGE}%" "WARNING"
fi

# Verificar uso de memória
MEM_USAGE=\$(free | awk 'NR==2{printf "%.1f", \$3*100/\$2 }')
if (( \$(echo "\$MEM_USAGE > \$ALERT_THRESHOLD_MEM" | bc -l) )); then
    send_alert "Alto uso de memória: \${MEM_USAGE}%" "WARNING"
fi

# Verificar uso de disco
DISK_USAGE=\$(df / | awk 'NR==2{print \$5}' | sed 's/%//')
if (( DISK_USAGE > ALERT_THRESHOLD_DISK )); then
    send_alert "Alto uso de disco: \${DISK_USAGE}%" "WARNING"
fi

# Verificar conectividade da API
if ! curl -f -s http://localhost:5000/health > /dev/null; then
    send_alert "API não está respondendo" "CRITICAL"
fi

echo "[\$(date)] Monitoramento executado" >> \$LOG_FILE
EOF
    
    chmod +x $PROJECT_DIR/scripts/monitor.sh
    
    # Adicionar ao crontab (executar a cada 5 minutos)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $PROJECT_DIR/scripts/monitor.sh") | crontab -
    
    log "✅ Monitoramento configurado (execução a cada 5 minutos)"
}

# Função para iniciar serviços
start_services() {
    log "🚀 Iniciando serviços..."
    
    # Habilitar serviços para iniciar no boot
    sudo systemctl enable viral-api viral-scrapers viral-agents
    
    # Iniciar serviços
    sudo systemctl start viral-api
    sleep 5
    sudo systemctl start viral-scrapers
    sleep 5
    sudo systemctl start viral-agents
    
    # Verificar status
    for service in viral-api viral-scrapers viral-agents; do
        if systemctl is-active --quiet $service; then
            log "✅ Serviço $service iniciado com sucesso"
        else
            error "❌ Falha ao iniciar serviço $service"
        fi
    done
}

# Função para verificar instalação
verify_installation() {
    log "🔍 Verificando instalação..."
    
    # Verificar serviços
    echo -e "\n${CYAN}📊 STATUS DOS SERVIÇOS:${NC}"
    for service in postgresql redis nginx viral-api viral-scrapers viral-agents; do
        if systemctl is-active --quiet $service; then
            echo -e "  ✅ $service: ${GREEN}Ativo${NC}"
        else
            echo -e "  ❌ $service: ${RED}Inativo${NC}"
        fi
    done
    
    # Verificar conectividade
    echo -e "\n${CYAN}🌐 CONECTIVIDADE:${NC}"
    if curl -f -s http://localhost:5000/health > /dev/null; then
        echo -e "  ✅ API Local: ${GREEN}OK${NC}"
    else
        echo -e "  ❌ API Local: ${RED}Falha${NC}"
    fi
    
    if curl -f -s https://$DOMAIN/health > /dev/null; then
        echo -e "  ✅ HTTPS: ${GREEN}OK${NC}"
    else
        echo -e "  ❌ HTTPS: ${RED}Falha${NC}"
    fi
    
    # Verificar recursos
    echo -e "\n${CYAN}💻 RECURSOS DO SISTEMA:${NC}"
    echo -e "  📊 CPU: $(nproc) cores"
    echo -e "  🧠 RAM: $(free -h | awk 'NR==2{print $2}') total, $(free -h | awk 'NR==2{print $7}') disponível"
    echo -e "  💾 Disco: $(df -h / | awk 'NR==2{print $2}') total, $(df -h / | awk 'NR==2{print $4}') disponível"
    
    # Verificar logs
    echo -e "\n${CYAN}📝 LOGS RECENTES:${NC}"
    if [[ -f "$LOG_DIR/api.log" ]]; then
        echo -e "  📄 API (últimas 3 linhas):"
        tail -n 3 $LOG_DIR/api.log | sed 's/^/    /'
    fi
}

# Função para mostrar informações finais
show_final_info() {
    echo -e "\n${GREEN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🎉 DEPLOY CONCLUÍDO COM SUCESSO! 🎉                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${CYAN}📋 INFORMAÇÕES DO SISTEMA:${NC}"
    echo -e "  🌐 URL: ${GREEN}https://$DOMAIN${NC}"
    echo -e "  📊 Dashboard: ${GREEN}https://$DOMAIN${NC}"
    echo -e "  🔌 API: ${GREEN}https://$DOMAIN/api/v1${NC}"
    echo -e "  📁 Projeto: ${GREEN}$PROJECT_DIR${NC}"
    echo -e "  📝 Logs: ${GREEN}$LOG_DIR${NC}"
    echo -e "  💾 Backups: ${GREEN}$BACKUP_DIR${NC}"
    
    echo -e "\n${CYAN}🔧 COMANDOS ÚTEIS:${NC}"
    echo -e "  📊 Status dos serviços: ${YELLOW}sudo systemctl status viral-api viral-scrapers viral-agents${NC}"
    echo -e "  📝 Ver logs: ${YELLOW}tail -f $LOG_DIR/api.log${NC}"
    echo -e "  🔄 Reiniciar API: ${YELLOW}sudo systemctl restart viral-api${NC}"
    echo -e "  📊 Monitor: ${YELLOW}$PROJECT_DIR/scripts/monitor.sh${NC}"
    echo -e "  💾 Backup: ${YELLOW}$PROJECT_DIR/scripts/backup.sh${NC}"
    
    echo -e "\n${CYAN}📚 DOCUMENTAÇÃO:${NC}"
    echo -e "  📖 Documentação completa: ${GREEN}$PROJECT_DIR/docs/SISTEMA_COMPLETO_DOCUMENTACAO.md${NC}"
    echo -e "  🔧 Configuração: ${GREEN}$PROJECT_DIR/config/.env${NC}"
    
    echo -e "\n${CYAN}🚨 PRÓXIMOS PASSOS:${NC}"
    echo -e "  1. Acesse ${GREEN}https://$DOMAIN${NC} para verificar o dashboard"
    echo -e "  2. Configure as integrações necessárias"
    echo -e "  3. Execute os primeiros scrapers de teste"
    echo -e "  4. Configure alertas e monitoramento adicional"
    echo -e "  5. Faça backup das configurações"
    
    echo -e "\n${PURPLE}🎯 SISTEMA VIRAL SCRAPER ESTÁ PRONTO PARA GERAR BILHÕES!${NC}"
}

# Função principal
main() {
    log "🚀 Iniciando processo de deploy..."
    
    # Executar todas as etapas
    install_dependencies
    install_nodejs
    install_python
    install_postgresql
    install_redis
    install_nginx
    install_chromium
    clone_repository
    install_project_dependencies
    configure_environment
    create_directories
    run_migrations
    configure_systemd_services
    configure_nginx
    configure_ssl
    configure_logrotate
    configure_backup
    configure_monitoring
    start_services
    
    # Aguardar serviços iniciarem
    log "⏳ Aguardando serviços estabilizarem..."
    sleep 10
    
    # Verificar instalação
    verify_installation
    
    # Mostrar informações finais
    show_final_info
    
    log "🎉 Deploy concluído com sucesso!"
}

# Verificar se o usuário quer continuar
echo -e "\n${YELLOW}⚠️  ATENÇÃO:${NC}"
echo "Este script irá:"
echo "  • Instalar e configurar todos os componentes necessários"
echo "  • Modificar configurações do sistema"
echo "  • Criar usuários e bancos de dados"
echo "  • Configurar serviços systemd"
echo "  • Obter certificados SSL"
echo ""
read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploy cancelado pelo usuário."
    exit 0
fi

# Executar deploy
main

exit 0

