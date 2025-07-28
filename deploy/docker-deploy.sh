#!/bin/bash

# ============================================================================
# DOCKER DEPLOY - VIRAL CONTENT SCRAPER
# Deploy usando Docker e Docker Compose
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
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG=${1:-"latest"}
ENVIRONMENT=${2:-"production"}
LOG_FILE="docker_deploy_$(date +%Y%m%d_%H%M%S).log"

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
    echo "🐳 DOCKER DEPLOY - VIRAL CONTENT SCRAPER"
    echo "============================================================================"
    echo "Deploy containerizado para ferramenta bilionária"
    echo "Autor: Manus AI | Data: $(date '+%d/%m/%Y %H:%M:%S')"
    echo "Environment: $ENVIRONMENT | Tag: $IMAGE_TAG"
    echo "============================================================================"
    echo -e "${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "🔍 Verificando pré-requisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado"
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado"
    fi
    
    # Verificar se Docker está rodando
    if ! docker info &> /dev/null; then
        error "Docker daemon não está rodando"
    fi
    
    success "✅ Pré-requisitos verificados"
}

# Build das imagens Docker
build_images() {
    log "🔨 Construindo imagens Docker..."
    
    # Build da API
    info "📦 Construindo imagem da API..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-api:$IMAGE_TAG \
        -f docker/Dockerfile.api .
    
    # Build dos Scrapers
    info "📦 Construindo imagem dos Scrapers..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-scrapers:$IMAGE_TAG \
        -f docker/Dockerfile.scrapers .
    
    # Build dos AI Agents
    info "📦 Construindo imagem dos AI Agents..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-ai-agents:$IMAGE_TAG \
        -f docker/Dockerfile.ai-agents .
    
    # Build do Frontend
    info "📦 Construindo imagem do Frontend..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$IMAGE_TAG \
        -f docker/Dockerfile.frontend .
    
    # Build do Admin Panel
    info "📦 Construindo imagem do Admin Panel..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-admin:$IMAGE_TAG \
        -f docker/Dockerfile.admin .
    
    success "✅ Imagens construídas com sucesso"
}

# Push das imagens para registry
push_images() {
    log "📤 Enviando imagens para registry..."
    
    # Login no registry
    if [ -n "$DOCKER_REGISTRY_USER" ] && [ -n "$DOCKER_REGISTRY_PASS" ]; then
        echo "$DOCKER_REGISTRY_PASS" | docker login $DOCKER_REGISTRY -u "$DOCKER_REGISTRY_USER" --password-stdin
    fi
    
    # Push das imagens
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-api:$IMAGE_TAG
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-scrapers:$IMAGE_TAG
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-ai-agents:$IMAGE_TAG
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$IMAGE_TAG
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-admin:$IMAGE_TAG
    
    success "✅ Imagens enviadas para registry"
}

# Preparar configuração do ambiente
prepare_environment() {
    log "⚙️ Preparando configuração do ambiente..."
    
    # Criar arquivo de environment específico
    cat > docker/.env.$ENVIRONMENT <<EOF
# Environment: $ENVIRONMENT
# Generated: $(date)

# Project
PROJECT_NAME=$PROJECT_NAME
IMAGE_TAG=$IMAGE_TAG
DOCKER_REGISTRY=$DOCKER_REGISTRY

# Database
POSTGRES_DB=viral_content_db
POSTGRES_USER=viral_user
POSTGRES_PASSWORD=viral_password_2025
DATABASE_URL=postgresql://viral_user:viral_password_2025@postgres:5432/viral_content_db

# Redis
REDIS_URL=redis://redis:6379

# Supabase
SUPABASE_URL=https://kkzbiteakxsexxwiwtom.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMyNjgsImV4cCI6MjA2OTIxOTI2OH0.Yd03_LE1cgEM3ik5WG7zCx9rG77zJc1Ez6-H8BgGkHk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzI2OCwiZXhwIjoyMDY5MjE5MjY4fQ.-EwB36xZXPIAstCnNM38RM-Lv8lxJG2vhCc6djyp2-E

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE=https://api.openai.com/v1

# Ports
API_PORT=5001
FRONTEND_PORT=3000
ADMIN_PORT=8080
NGINX_PORT=80
NGINX_SSL_PORT=443

# Scaling
API_REPLICAS=2
SCRAPERS_REPLICAS=3
AI_AGENTS_REPLICAS=2

# Resources
API_MEMORY=1g
API_CPU=0.5
SCRAPERS_MEMORY=2g
SCRAPERS_CPU=1.0
AI_AGENTS_MEMORY=2g
AI_AGENTS_CPU=1.0

# Monitoring
ENABLE_MONITORING=true
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090

# Backup
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30
EOF

    success "✅ Configuração do ambiente preparada"
}

# Deploy com Docker Compose
deploy_with_compose() {
    log "🚀 Executando deploy com Docker Compose..."
    
    # Parar containers existentes
    info "🛑 Parando containers existentes..."
    docker-compose -f docker/docker-compose.$ENVIRONMENT.yml --env-file docker/.env.$ENVIRONMENT down || true
    
    # Remover imagens antigas (opcional)
    if [ "$CLEAN_OLD_IMAGES" = "true" ]; then
        info "🧹 Removendo imagens antigas..."
        docker image prune -f
    fi
    
    # Iniciar serviços
    info "🚀 Iniciando serviços..."
    docker-compose -f docker/docker-compose.$ENVIRONMENT.yml --env-file docker/.env.$ENVIRONMENT up -d
    
    # Aguardar inicialização
    info "⏳ Aguardando inicialização dos serviços..."
    sleep 30
    
    success "✅ Deploy com Docker Compose concluído"
}

# Deploy com Docker Swarm
deploy_with_swarm() {
    log "🐝 Executando deploy com Docker Swarm..."
    
    # Verificar se Swarm está inicializado
    if ! docker info | grep -q "Swarm: active"; then
        info "🐝 Inicializando Docker Swarm..."
        docker swarm init
    fi
    
    # Deploy do stack
    info "📦 Fazendo deploy do stack..."
    docker stack deploy -c docker/docker-compose.swarm.yml $PROJECT_NAME
    
    # Aguardar inicialização
    info "⏳ Aguardando inicialização do stack..."
    sleep 45
    
    success "✅ Deploy com Docker Swarm concluído"
}

# Deploy com Kubernetes
deploy_with_kubernetes() {
    log "☸️ Executando deploy com Kubernetes..."
    
    # Verificar se kubectl está disponível
    if ! command -v kubectl &> /dev/null; then
        error "kubectl não está instalado"
    fi
    
    # Aplicar configurações
    info "📦 Aplicando configurações Kubernetes..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/postgres.yaml
    kubectl apply -f k8s/redis.yaml
    kubectl apply -f k8s/api.yaml
    kubectl apply -f k8s/scrapers.yaml
    kubectl apply -f k8s/ai-agents.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/admin.yaml
    kubectl apply -f k8s/nginx.yaml
    kubectl apply -f k8s/ingress.yaml
    
    # Aguardar deployment
    info "⏳ Aguardando deployment..."
    kubectl rollout status deployment/api -n viral-scraper
    kubectl rollout status deployment/scrapers -n viral-scraper
    kubectl rollout status deployment/ai-agents -n viral-scraper
    
    success "✅ Deploy com Kubernetes concluído"
}

# Verificar saúde dos serviços
health_check() {
    log "🏥 Verificando saúde dos serviços..."
    
    # Aguardar estabilização
    sleep 30
    
    # Verificar containers
    info "📋 Status dos containers:"
    docker-compose -f docker/docker-compose.$ENVIRONMENT.yml --env-file docker/.env.$ENVIRONMENT ps
    
    # Testar endpoints
    info "🧪 Testando endpoints..."
    
    # API Health Check
    if curl -f http://localhost:5001/health > /dev/null 2>&1; then
        success "✅ API está respondendo"
    else
        error "❌ API não está respondendo"
    fi
    
    # Frontend Check
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "✅ Frontend está respondendo"
    else
        error "❌ Frontend não está respondendo"
    fi
    
    # Admin Panel Check
    if curl -f http://localhost:8080 > /dev/null 2>&1; then
        success "✅ Admin Panel está respondendo"
    else
        error "❌ Admin Panel não está respondendo"
    fi
    
    success "✅ Verificação de saúde concluída"
}

# Monitoramento e logs
setup_monitoring() {
    log "📊 Configurando monitoramento..."
    
    if [ "$ENABLE_MONITORING" = "true" ]; then
        # Iniciar Prometheus e Grafana
        docker-compose -f docker/docker-compose.monitoring.yml up -d
        
        info "📊 Monitoramento disponível em:"
        info "  • Grafana: http://localhost:3001"
        info "  • Prometheus: http://localhost:9090"
    fi
    
    # Configurar log aggregation
    info "📝 Configurando agregação de logs..."
    docker-compose -f docker/docker-compose.logging.yml up -d
    
    success "✅ Monitoramento configurado"
}

# Backup automatizado
setup_backup() {
    log "💾 Configurando backup automatizado..."
    
    # Criar script de backup
    cat > docker/backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/docker-$DATE"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup dos volumes Docker
docker run --rm -v viral-scraper_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v viral-scraper_redis_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis_data.tar.gz -C /data .

# Backup do banco de dados
docker exec viral-scraper_postgres_1 pg_dump -U viral_user viral_content_db > $BACKUP_DIR/database.sql

# Comprimir backup
tar -czf $BACKUP_DIR.tar.gz -C /opt/backups docker-$DATE
rm -rf $BACKUP_DIR

# Manter apenas 7 backups
cd /opt/backups
ls -t docker-*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup criado: $BACKUP_DIR.tar.gz"
EOF

    chmod +x docker/backup.sh
    
    # Adicionar ao cron
    (crontab -l 2>/dev/null; echo "$BACKUP_SCHEDULE /path/to/docker/backup.sh") | crontab -
    
    success "✅ Backup automatizado configurado"
}

# Rollback
rollback() {
    log "🔄 Executando rollback..."
    
    # Parar serviços atuais
    docker-compose -f docker/docker-compose.$ENVIRONMENT.yml --env-file docker/.env.$ENVIRONMENT down
    
    # Restaurar imagens anteriores
    PREVIOUS_TAG=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep $PROJECT_NAME-api | sed -n '2p' | cut -d':' -f2)
    
    if [ -n "$PREVIOUS_TAG" ]; then
        info "🔄 Rollback para tag: $PREVIOUS_TAG"
        
        # Atualizar tag no environment
        sed -i "s/IMAGE_TAG=.*/IMAGE_TAG=$PREVIOUS_TAG/" docker/.env.$ENVIRONMENT
        
        # Reiniciar com tag anterior
        docker-compose -f docker/docker-compose.$ENVIRONMENT.yml --env-file docker/.env.$ENVIRONMENT up -d
        
        success "✅ Rollback concluído"
    else
        error "❌ Nenhuma imagem anterior encontrada"
    fi
}

# Limpeza
cleanup() {
    log "🧹 Executando limpeza..."
    
    # Remover containers parados
    docker container prune -f
    
    # Remover imagens não utilizadas
    docker image prune -f
    
    # Remover volumes órfãos
    docker volume prune -f
    
    # Remover networks não utilizadas
    docker network prune -f
    
    success "✅ Limpeza concluída"
}

# Função principal
main() {
    print_banner
    
    # Verificar argumentos
    DEPLOY_METHOD=${3:-"compose"}
    ACTION=${4:-"deploy"}
    
    case $ACTION in
        "deploy")
            log "🚀 Iniciando deploy Docker..."
            check_prerequisites
            build_images
            
            if [ "$PUSH_TO_REGISTRY" = "true" ]; then
                push_images
            fi
            
            prepare_environment
            
            case $DEPLOY_METHOD in
                "compose")
                    deploy_with_compose
                    ;;
                "swarm")
                    deploy_with_swarm
                    ;;
                "kubernetes")
                    deploy_with_kubernetes
                    ;;
                *)
                    error "Método de deploy inválido: $DEPLOY_METHOD"
                    ;;
            esac
            
            health_check
            setup_monitoring
            setup_backup
            ;;
            
        "rollback")
            log "🔄 Iniciando rollback..."
            rollback
            health_check
            ;;
            
        "cleanup")
            log "🧹 Iniciando limpeza..."
            cleanup
            ;;
            
        *)
            error "Ação inválida: $ACTION"
            ;;
    esac
    
    success "🎉 Deploy Docker finalizado com sucesso!"
    info "📊 Log salvo em: $LOG_FILE"
    
    echo -e "${CYAN}"
    echo "============================================================================"
    echo "🐳 DEPLOY DOCKER CONCLUÍDO"
    echo "============================================================================"
    echo "🌐 Acesse sua ferramenta em:"
    echo "  • Frontend: http://localhost:3000"
    echo "  • API: http://localhost:5001"
    echo "  • Admin: http://localhost:8080"
    echo "  • Grafana: http://localhost:3001 (se habilitado)"
    echo ""
    echo "📋 Comandos úteis:"
    echo "  • Ver logs: docker-compose logs -f"
    echo "  • Status: docker-compose ps"
    echo "  • Parar: docker-compose down"
    echo "  • Backup: ./docker/backup.sh"
    echo "============================================================================"
    echo -e "${NC}"
}

# Tratamento de erros
trap 'error "Deploy Docker falhou! Verifique o log: $LOG_FILE"' ERR

# Executar função principal
main "$@"

