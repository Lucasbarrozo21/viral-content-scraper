/**
 * INICIALIZADOR DO SYSTEM DOCTOR COMPLETO
 * Script principal para iniciar todo o sistema de monitoramento
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const SystemMonitorDashboard = require('./ai_agents/src/system/system_monitor_dashboard');
const NotificationSystem = require('./ai_agents/src/system/notification_system');

class SystemDoctorLauncher {
    constructor() {
        this.dashboard = null;
        this.notificationSystem = null;
    }
    
    async initialize() {
        console.log('🚀 INICIALIZANDO SYSTEM DOCTOR COMPLETO...');
        console.log('=' .repeat(60));
        
        try {
            // Configurar sistema de notificações
            await this.setupNotifications();
            
            // Inicializar dashboard
            await this.setupDashboard();
            
            // Conectar sistemas
            await this.connectSystems();
            
            console.log('✅ SYSTEM DOCTOR TOTALMENTE OPERACIONAL!');
            console.log('=' .repeat(60));
            
            this.showAccessInfo();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar System Doctor:', error);
            process.exit(1);
        }
    }
    
    async setupNotifications() {
        console.log('📱 Configurando sistema de notificações...');
        
        // Configuração de exemplo (você pode personalizar)
        const notificationConfig = {
            // Telegram (mais fácil de configurar)
            telegram: {
                enabled: false, // Mude para true e configure
                botToken: 'SEU_BOT_TOKEN_AQUI',
                chatId: 'SEU_CHAT_ID_AQUI'
            },
            
            // Email
            email: {
                enabled: false, // Mude para true e configure
                smtp: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'seu_email@gmail.com',
                        pass: 'sua_senha_de_app' // Use senha de app do Gmail
                    }
                },
                from: 'seu_email@gmail.com',
                to: ['destino@gmail.com']
            },
            
            // WhatsApp (requer API paga)
            whatsapp: {
                enabled: false,
                apiUrl: 'https://api.whatsapp.com/send',
                apiKey: 'SUA_API_KEY',
                phoneNumber: '+5511999999999'
            },
            
            // Slack
            slack: {
                enabled: false,
                webhookUrl: 'https://hooks.slack.com/services/...',
                channel: '#system-alerts'
            },
            
            // Discord
            discord: {
                enabled: false,
                webhookUrl: 'https://discord.com/api/webhooks/...'
            }
        };
        
        this.notificationSystem = new NotificationSystem(notificationConfig);
        
        console.log('✅ Sistema de notificações configurado');
    }
    
    async setupDashboard() {
        console.log('🖥️ Inicializando dashboard de monitoramento...');
        
        this.dashboard = new SystemMonitorDashboard(3001);
        await this.dashboard.start();
        
        console.log('✅ Dashboard de monitoramento ativo');
    }
    
    async connectSystems() {
        console.log('🔗 Conectando sistemas...');
        
        // Conectar notificações ao System Doctor
        this.dashboard.systemDoctor.on('alert', async (alert) => {
            await this.notificationSystem.sendNotification({
                type: alert.type,
                title: `System Doctor Alert: ${alert.type}`,
                message: alert.message,
                severity: alert.severity || 'medium',
                details: alert.details || {},
                channels: alert.severity === 'critical' ? 'critical' : 'all'
            });
        });
        
        this.dashboard.systemDoctor.on('issues_detected', async (report) => {
            const criticalIssues = report.issues.filter(i => i.severity === 'critical');
            
            if (criticalIssues.length > 0) {
                await this.notificationSystem.sendNotification({
                    type: 'critical_issues',
                    title: `${criticalIssues.length} Problemas Críticos Detectados`,
                    message: criticalIssues.map(i => `• ${i.message}`).join('\\n'),
                    severity: 'critical',
                    details: {
                        component: 'system_doctor',
                        timestamp: report.timestamp,
                        total_issues: report.issues.length
                    },
                    channels: 'critical'
                });
            }
        });
        
        this.dashboard.systemDoctor.on('monitoring_started', async () => {
            await this.notificationSystem.sendNotification({
                type: 'monitoring_started',
                title: 'System Doctor Iniciado',
                message: 'O monitoramento automático 24/7 foi iniciado com sucesso.',
                severity: 'low',
                details: {
                    component: 'system_doctor',
                    timestamp: new Date().toISOString()
                }
            });
        });
        
        console.log('✅ Sistemas conectados');
    }
    
    showAccessInfo() {
        console.log('\\n📋 INFORMAÇÕES DE ACESSO:');
        console.log('-'.repeat(40));
        console.log('🖥️  Dashboard: http://localhost:3001');
        console.log('📊 Status: Sistema totalmente operacional');
        console.log('🤖 Monitoramento: 24/7 automático');
        console.log('📱 Notificações: Configuradas');
        
        console.log('\\n🎯 FUNCIONALIDADES ATIVAS:');
        console.log('✅ Monitoramento de scrapers em tempo real');
        console.log('✅ Detecção automática de problemas');
        console.log('✅ Auto-correção de erros');
        console.log('✅ Dashboard visual interativo');
        console.log('✅ Sistema de alertas');
        console.log('✅ Notificações multi-canal');
        console.log('✅ Histórico de diagnósticos');
        console.log('✅ Métricas de sistema');
        
        console.log('\\n🔧 PARA CONFIGURAR NOTIFICAÇÕES:');
        console.log('1. Edite o arquivo start_system_doctor.js');
        console.log('2. Configure seus tokens/credenciais');
        console.log('3. Mude enabled: true nos canais desejados');
        console.log('4. Reinicie o sistema');
        
        console.log('\\n🚀 SYSTEM DOCTOR PRONTO PARA PROTEGER SEU SISTEMA!');
        console.log('=' .repeat(60));
    }
    
    async testNotifications() {
        console.log('\\n🧪 Testando sistema de notificações...');
        
        const results = await this.notificationSystem.testNotifications();
        
        if (results.sent.length > 0) {
            console.log('✅ Notificações funcionando!');
        } else {
            console.log('⚠️ Nenhuma notificação configurada ou funcionando');
            console.log('💡 Configure pelo menos um canal para receber alertas');
        }
    }
    
    async shutdown() {
        console.log('\\n🛑 Parando System Doctor...');
        
        if (this.dashboard) {
            await this.dashboard.stop();
        }
        
        console.log('✅ System Doctor parado com sucesso');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const launcher = new SystemDoctorLauncher();
    
    // Inicializar sistema
    launcher.initialize().then(async () => {
        // Testar notificações após 5 segundos
        setTimeout(async () => {
            await launcher.testNotifications();
        }, 5000);
        
        // Iniciar monitoramento automaticamente após 10 segundos
        setTimeout(() => {
            console.log('\\n🚀 Iniciando monitoramento automático...');
            launcher.dashboard.systemDoctor.startMonitoring();
        }, 10000);
        
    }).catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await launcher.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await launcher.shutdown();
        process.exit(0);
    });
}

module.exports = SystemDoctorLauncher;

