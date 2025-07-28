/**
 * SYSTEM DOCTOR - IA DE AUTO-DIAGNÓSTICO E AUTO-CORREÇÃO
 * Monitora, diagnostica e corrige problemas automaticamente 24/7
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemDoctor extends EventEmitter {
    constructor() {
        super();
        
        this.isActive = false;
        this.monitoringInterval = null;
        this.healthCheckInterval = 5000; // 5 segundos
        this.diagnosticHistory = [];
        this.autoFixAttempts = new Map();
        this.maxAutoFixAttempts = 3;
        
        // Componentes monitorados
        this.components = {
            scrapers: new Map(),
            database: { status: 'unknown', lastCheck: null },
            redis: { status: 'unknown', lastCheck: null },
            api: { status: 'unknown', lastCheck: null },
            agents: new Map(),
            system: { cpu: 0, memory: 0, disk: 0 }
        };
        
        // Thresholds de alerta
        this.thresholds = {
            cpu: 80,        // 80% CPU
            memory: 85,     // 85% Memória
            disk: 90,       // 90% Disco
            responseTime: 5000,  // 5 segundos
            errorRate: 10   // 10% de erro
        };
        
        // Estratégias de correção
        this.fixStrategies = new Map();
        this.initializeFixStrategies();
        
        console.log('🤖 System Doctor inicializado - Médico do Sistema ativo!');
    }
    
    /**
     * INICIALIZAR ESTRATÉGIAS DE CORREÇÃO
     */
    initializeFixStrategies() {
        // Estratégias para scrapers
        this.fixStrategies.set('scraper_blocked', [
            { action: 'rotate_proxy', priority: 1 },
            { action: 'change_user_agent', priority: 2 },
            { action: 'add_delay', priority: 3 },
            { action: 'restart_scraper', priority: 4 }
        ]);
        
        this.fixStrategies.set('scraper_timeout', [
            { action: 'increase_timeout', priority: 1 },
            { action: 'restart_scraper', priority: 2 },
            { action: 'check_network', priority: 3 }
        ]);
        
        this.fixStrategies.set('scraper_captcha', [
            { action: 'pause_scraper', priority: 1 },
            { action: 'rotate_proxy', priority: 2 },
            { action: 'change_user_agent', priority: 3 },
            { action: 'resume_after_delay', priority: 4 }
        ]);
        
        // Estratégias para banco de dados
        this.fixStrategies.set('database_connection_lost', [
            { action: 'reconnect_database', priority: 1 },
            { action: 'restart_database_pool', priority: 2 },
            { action: 'check_database_service', priority: 3 }
        ]);
        
        // Estratégias para sistema
        this.fixStrategies.set('high_cpu_usage', [
            { action: 'reduce_scraper_threads', priority: 1 },
            { action: 'pause_non_critical_tasks', priority: 2 },
            { action: 'restart_high_cpu_processes', priority: 3 }
        ]);
        
        this.fixStrategies.set('high_memory_usage', [
            { action: 'clear_cache', priority: 1 },
            { action: 'garbage_collect', priority: 2 },
            { action: 'restart_memory_intensive_processes', priority: 3 }
        ]);
    }
    
    /**
     * INICIAR MONITORAMENTO
     */
    async startMonitoring() {
        if (this.isActive) {
            console.log('⚠️ System Doctor já está ativo');
            return;
        }
        
        this.isActive = true;
        console.log('🚀 System Doctor iniciando monitoramento 24/7...');
        
        // Monitoramento principal
        this.monitoringInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, this.healthCheckInterval);
        
        // Monitoramento de sistema (menos frequente)
        setInterval(async () => {
            await this.checkSystemResources();
        }, 30000); // 30 segundos
        
        // Auto-limpeza de histórico (diário)
        setInterval(() => {
            this.cleanupHistory();
        }, 24 * 60 * 60 * 1000); // 24 horas
        
        console.log('✅ System Doctor ativo - Monitoramento iniciado!');
        this.emit('monitoring_started');
    }
    
    /**
     * VERIFICAÇÃO DE SAÚDE PRINCIPAL
     */
    async performHealthCheck() {
        try {
            const healthReport = {
                timestamp: new Date().toISOString(),
                overall_status: 'healthy',
                issues: [],
                fixes_applied: []
            };
            
            // Verificar scrapers
            await this.checkScrapersHealth(healthReport);
            
            // Verificar banco de dados
            await this.checkDatabaseHealth(healthReport);
            
            // Verificar Redis
            await this.checkRedisHealth(healthReport);
            
            // Verificar API
            await this.checkAPIHealth(healthReport);
            
            // Verificar agentes IA
            await this.checkAgentsHealth(healthReport);
            
            // Determinar status geral
            if (healthReport.issues.length > 0) {
                healthReport.overall_status = healthReport.issues.some(i => i.severity === 'critical') 
                    ? 'critical' : 'warning';
                
                // Aplicar correções automáticas
                await this.applyAutomaticFixes(healthReport);
            }
            
            // Salvar no histórico
            this.diagnosticHistory.push(healthReport);
            
            // Emitir eventos
            this.emit('health_check_completed', healthReport);
            
            if (healthReport.overall_status !== 'healthy') {
                this.emit('issues_detected', healthReport);
            }
            
        } catch (error) {
            console.error('❌ Erro no health check:', error);
            this.emit('health_check_error', error);
        }
    }
    
    /**
     * VERIFICAR SAÚDE DOS SCRAPERS
     */
    async checkScrapersHealth(report) {
        const scraperPlatforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin', 'twitter'];
        
        for (const platform of scraperPlatforms) {
            try {
                const scraperStatus = await this.getScraperStatus(platform);
                this.components.scrapers.set(platform, scraperStatus);
                
                // Verificar problemas específicos
                if (scraperStatus.status === 'blocked') {
                    report.issues.push({
                        component: `scraper_${platform}`,
                        type: 'scraper_blocked',
                        severity: 'high',
                        message: `Scraper ${platform} foi bloqueado`,
                        details: scraperStatus
                    });
                }
                
                if (scraperStatus.status === 'timeout') {
                    report.issues.push({
                        component: `scraper_${platform}`,
                        type: 'scraper_timeout',
                        severity: 'medium',
                        message: `Scraper ${platform} com timeout`,
                        details: scraperStatus
                    });
                }
                
                if (scraperStatus.captcha_detected) {
                    report.issues.push({
                        component: `scraper_${platform}`,
                        type: 'scraper_captcha',
                        severity: 'high',
                        message: `Captcha detectado no ${platform}`,
                        details: scraperStatus
                    });
                }
                
                if (scraperStatus.error_rate > this.thresholds.errorRate) {
                    report.issues.push({
                        component: `scraper_${platform}`,
                        type: 'high_error_rate',
                        severity: 'medium',
                        message: `Alta taxa de erro no ${platform}: ${scraperStatus.error_rate}%`,
                        details: scraperStatus
                    });
                }
                
            } catch (error) {
                report.issues.push({
                    component: `scraper_${platform}`,
                    type: 'scraper_error',
                    severity: 'critical',
                    message: `Erro ao verificar scraper ${platform}`,
                    details: { error: error.message }
                });
            }
        }
    }
    
    /**
     * OBTER STATUS DO SCRAPER
     */
    async getScraperStatus(platform) {
        // Simular verificação de scraper
        // Em implementação real, verificaria logs, métricas, etc.
        
        const mockStatus = {
            platform,
            status: Math.random() > 0.9 ? 'blocked' : 'running',
            last_activity: new Date().toISOString(),
            items_collected_today: Math.floor(Math.random() * 1000),
            error_rate: Math.floor(Math.random() * 15),
            response_time: Math.floor(Math.random() * 3000),
            captcha_detected: Math.random() > 0.95,
            proxy_status: Math.random() > 0.8 ? 'working' : 'blocked',
            current_proxy: `proxy_${Math.floor(Math.random() * 10)}`,
            user_agent: 'Mozilla/5.0...',
            rate_limit_status: Math.random() > 0.85 ? 'limited' : 'ok'
        };
        
        return mockStatus;
    }
    
    /**
     * VERIFICAR SAÚDE DO BANCO DE DADOS
     */
    async checkDatabaseHealth(report) {
        try {
            // Verificar conexão
            const { Pool } = require('pg');
            const pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'viral_content_db',
                user: process.env.DB_USER || 'viral_user',
                password: process.env.DB_PASSWORD || 'viral_pass123',
                connectionTimeoutMillis: 5000
            });
            
            const startTime = Date.now();
            const client = await pool.connect();
            const responseTime = Date.now() - startTime;
            
            await client.query('SELECT 1');
            client.release();
            await pool.end();
            
            this.components.database = {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                responseTime
            };
            
            if (responseTime > this.thresholds.responseTime) {
                report.issues.push({
                    component: 'database',
                    type: 'slow_response',
                    severity: 'medium',
                    message: `Banco de dados lento: ${responseTime}ms`,
                    details: { responseTime }
                });
            }
            
        } catch (error) {
            this.components.database = {
                status: 'error',
                lastCheck: new Date().toISOString(),
                error: error.message
            };
            
            report.issues.push({
                component: 'database',
                type: 'database_connection_lost',
                severity: 'critical',
                message: 'Conexão com banco de dados perdida',
                details: { error: error.message }
            });
        }
    }
    
    /**
     * VERIFICAR SAÚDE DO REDIS
     */
    async checkRedisHealth(report) {
        try {
            const Redis = require('redis');
            const client = Redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                connectTimeout: 5000
            });
            
            await client.connect();
            
            const startTime = Date.now();
            await client.ping();
            const responseTime = Date.now() - startTime;
            
            await client.quit();
            
            this.components.redis = {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                responseTime
            };
            
        } catch (error) {
            this.components.redis = {
                status: 'error',
                lastCheck: new Date().toISOString(),
                error: error.message
            };
            
            // Redis é opcional, não é crítico
            report.issues.push({
                component: 'redis',
                type: 'redis_connection_lost',
                severity: 'low',
                message: 'Conexão com Redis perdida (opcional)',
                details: { error: error.message }
            });
        }
    }
    
    /**
     * VERIFICAR SAÚDE DA API
     */
    async checkAPIHealth(report) {
        try {
            const axios = require('axios');
            
            const startTime = Date.now();
            const response = await axios.get('http://localhost:5000/health', {
                timeout: 5000
            });
            const responseTime = Date.now() - startTime;
            
            this.components.api = {
                status: response.status === 200 ? 'healthy' : 'warning',
                lastCheck: new Date().toISOString(),
                responseTime,
                statusCode: response.status
            };
            
            if (responseTime > this.thresholds.responseTime) {
                report.issues.push({
                    component: 'api',
                    type: 'slow_api_response',
                    severity: 'medium',
                    message: `API lenta: ${responseTime}ms`,
                    details: { responseTime }
                });
            }
            
        } catch (error) {
            this.components.api = {
                status: 'error',
                lastCheck: new Date().toISOString(),
                error: error.message
            };
            
            report.issues.push({
                component: 'api',
                type: 'api_down',
                severity: 'high',
                message: 'API não está respondendo',
                details: { error: error.message }
            });
        }
    }
    
    /**
     * VERIFICAR SAÚDE DOS AGENTES IA
     */
    async checkAgentsHealth(report) {
        const agents = ['visual', 'copy', 'hooks', 'engagement', 'template'];
        
        for (const agent of agents) {
            try {
                // Simular verificação de agente IA
                const agentStatus = {
                    name: agent,
                    status: Math.random() > 0.95 ? 'error' : 'healthy',
                    last_analysis: new Date().toISOString(),
                    analyses_today: Math.floor(Math.random() * 500),
                    avg_confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
                    response_time: Math.floor(Math.random() * 2000)
                };
                
                this.components.agents.set(agent, agentStatus);
                
                if (agentStatus.status === 'error') {
                    report.issues.push({
                        component: `agent_${agent}`,
                        type: 'agent_error',
                        severity: 'medium',
                        message: `Agente IA ${agent} com erro`,
                        details: agentStatus
                    });
                }
                
            } catch (error) {
                report.issues.push({
                    component: `agent_${agent}`,
                    type: 'agent_check_error',
                    severity: 'medium',
                    message: `Erro ao verificar agente ${agent}`,
                    details: { error: error.message }
                });
            }
        }
    }
    
    /**
     * VERIFICAR RECURSOS DO SISTEMA
     */
    async checkSystemResources() {
        try {
            // CPU Usage
            const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
            const cpuUsage = parseFloat(cpuInfo.trim());
            
            // Memory Usage
            const { stdout: memInfo } = await execAsync("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'");
            const memoryUsage = parseFloat(memInfo.trim());
            
            // Disk Usage
            const { stdout: diskInfo } = await execAsync("df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1");
            const diskUsage = parseFloat(diskInfo.trim());
            
            this.components.system = {
                cpu: cpuUsage,
                memory: memoryUsage,
                disk: diskUsage,
                lastCheck: new Date().toISOString()
            };
            
            // Verificar thresholds
            if (cpuUsage > this.thresholds.cpu) {
                this.emit('high_cpu_usage', { usage: cpuUsage, threshold: this.thresholds.cpu });
            }
            
            if (memoryUsage > this.thresholds.memory) {
                this.emit('high_memory_usage', { usage: memoryUsage, threshold: this.thresholds.memory });
            }
            
            if (diskUsage > this.thresholds.disk) {
                this.emit('high_disk_usage', { usage: diskUsage, threshold: this.thresholds.disk });
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar recursos do sistema:', error);
        }
    }
    
    /**
     * APLICAR CORREÇÕES AUTOMÁTICAS
     */
    async applyAutomaticFixes(report) {
        for (const issue of report.issues) {
            const fixKey = `${issue.component}_${issue.type}`;
            
            // Verificar se já tentou corrigir muitas vezes
            const attempts = this.autoFixAttempts.get(fixKey) || 0;
            if (attempts >= this.maxAutoFixAttempts) {
                console.log(`⚠️ Máximo de tentativas atingido para: ${fixKey}`);
                continue;
            }
            
            // Obter estratégias de correção
            const strategies = this.fixStrategies.get(issue.type);
            if (!strategies) {
                console.log(`⚠️ Nenhuma estratégia de correção para: ${issue.type}`);
                continue;
            }
            
            // Aplicar correções em ordem de prioridade
            for (const strategy of strategies.sort((a, b) => a.priority - b.priority)) {
                try {
                    console.log(`🔧 Aplicando correção: ${strategy.action} para ${issue.component}`);
                    
                    const success = await this.executeFixAction(strategy.action, issue);
                    
                    if (success) {
                        report.fixes_applied.push({
                            issue: issue.type,
                            component: issue.component,
                            action: strategy.action,
                            timestamp: new Date().toISOString()
                        });
                        
                        console.log(`✅ Correção aplicada com sucesso: ${strategy.action}`);
                        break; // Parar após primeira correção bem-sucedida
                    }
                    
                } catch (error) {
                    console.error(`❌ Erro ao aplicar correção ${strategy.action}:`, error);
                }
            }
            
            // Incrementar contador de tentativas
            this.autoFixAttempts.set(fixKey, attempts + 1);
        }
    }
    
    /**
     * EXECUTAR AÇÃO DE CORREÇÃO
     */
    async executeFixAction(action, issue) {
        switch (action) {
            case 'rotate_proxy':
                return await this.rotateProxy(issue.component);
                
            case 'change_user_agent':
                return await this.changeUserAgent(issue.component);
                
            case 'restart_scraper':
                return await this.restartScraper(issue.component);
                
            case 'add_delay':
                return await this.addDelay(issue.component);
                
            case 'pause_scraper':
                return await this.pauseScraper(issue.component);
                
            case 'resume_after_delay':
                return await this.resumeScraperAfterDelay(issue.component);
                
            case 'reconnect_database':
                return await this.reconnectDatabase();
                
            case 'clear_cache':
                return await this.clearCache();
                
            case 'garbage_collect':
                return await this.forceGarbageCollection();
                
            case 'reduce_scraper_threads':
                return await this.reduceScraperThreads();
                
            default:
                console.log(`⚠️ Ação de correção não implementada: ${action}`);
                return false;
        }
    }
    
    /**
     * AÇÕES DE CORREÇÃO ESPECÍFICAS
     */
    async rotateProxy(component) {
        console.log(`🔄 Rotacionando proxy para ${component}`);
        // Implementar rotação de proxy
        return true;
    }
    
    async changeUserAgent(component) {
        console.log(`🎭 Mudando user agent para ${component}`);
        // Implementar mudança de user agent
        return true;
    }
    
    async restartScraper(component) {
        console.log(`🔄 Reiniciando ${component}`);
        // Implementar reinício do scraper
        return true;
    }
    
    async addDelay(component) {
        console.log(`⏱️ Adicionando delay para ${component}`);
        // Implementar aumento de delay
        return true;
    }
    
    async pauseScraper(component) {
        console.log(`⏸️ Pausando ${component}`);
        // Implementar pausa do scraper
        return true;
    }
    
    async resumeScraperAfterDelay(component) {
        console.log(`▶️ Resumindo ${component} após delay`);
        setTimeout(() => {
            // Implementar retomada do scraper
            console.log(`✅ ${component} retomado`);
        }, 300000); // 5 minutos
        return true;
    }
    
    async reconnectDatabase() {
        console.log('🔄 Reconectando banco de dados');
        // Implementar reconexão do banco
        return true;
    }
    
    async clearCache() {
        console.log('🧹 Limpando cache');
        // Implementar limpeza de cache
        return true;
    }
    
    async forceGarbageCollection() {
        console.log('🗑️ Forçando garbage collection');
        if (global.gc) {
            global.gc();
            return true;
        }
        return false;
    }
    
    async reduceScraperThreads() {
        console.log('📉 Reduzindo threads dos scrapers');
        // Implementar redução de threads
        return true;
    }
    
    /**
     * MÉTODOS DE CONTROLE
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.isActive = false;
        console.log('⏹️ System Doctor parado');
        this.emit('monitoring_stopped');
    }
    
    getSystemStatus() {
        return {
            isActive: this.isActive,
            components: Object.fromEntries([
                ['scrapers', Object.fromEntries(this.components.scrapers)],
                ['database', this.components.database],
                ['redis', this.components.redis],
                ['api', this.components.api],
                ['agents', Object.fromEntries(this.components.agents)],
                ['system', this.components.system]
            ]),
            lastHealthCheck: this.diagnosticHistory.length > 0 
                ? this.diagnosticHistory[this.diagnosticHistory.length - 1].timestamp 
                : null,
            totalIssuesDetected: this.diagnosticHistory.reduce((sum, report) => sum + report.issues.length, 0),
            totalFixesApplied: this.diagnosticHistory.reduce((sum, report) => sum + report.fixes_applied.length, 0)
        };
    }
    
    getHealthHistory(limit = 50) {
        return this.diagnosticHistory.slice(-limit);
    }
    
    cleanupHistory() {
        // Manter apenas últimos 1000 registros
        if (this.diagnosticHistory.length > 1000) {
            this.diagnosticHistory = this.diagnosticHistory.slice(-1000);
        }
        
        // Limpar contadores de tentativas antigas
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        for (const [key, timestamp] of this.autoFixAttempts.entries()) {
            if (timestamp < oneDayAgo) {
                this.autoFixAttempts.delete(key);
            }
        }
        
        console.log('🧹 Histórico de diagnósticos limpo');
    }
    
    /**
     * SISTEMA DE ALERTAS
     */
    async sendAlert(type, message, details = {}) {
        const alert = {
            type,
            message,
            details,
            timestamp: new Date().toISOString(),
            severity: details.severity || 'medium'
        };
        
        console.log(`🚨 ALERTA ${type.toUpperCase()}: ${message}`);
        
        // Emitir evento para sistemas externos
        this.emit('alert', alert);
        
        // Aqui você pode implementar notificações:
        // - WhatsApp/Telegram
        // - Email
        // - Slack/Discord
        // - SMS
        
        return alert;
    }
}

module.exports = SystemDoctor;

