/**
 * NOTIFICATION SYSTEM
 * Sistema de notificações para WhatsApp, Telegram, Email e outros
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const axios = require('axios');
const nodemailer = require('nodemailer');

class NotificationSystem {
    constructor(config = {}) {
        this.config = {
            // WhatsApp (via API como Twilio, WhatsApp Business API, etc.)
            whatsapp: {
                enabled: config.whatsapp?.enabled || false,
                apiUrl: config.whatsapp?.apiUrl || '',
                apiKey: config.whatsapp?.apiKey || '',
                phoneNumber: config.whatsapp?.phoneNumber || ''
            },
            
            // Telegram
            telegram: {
                enabled: config.telegram?.enabled || false,
                botToken: config.telegram?.botToken || '',
                chatId: config.telegram?.chatId || ''
            },
            
            // Email
            email: {
                enabled: config.email?.enabled || false,
                smtp: {
                    host: config.email?.smtp?.host || 'smtp.gmail.com',
                    port: config.email?.smtp?.port || 587,
                    secure: config.email?.smtp?.secure || false,
                    auth: {
                        user: config.email?.smtp?.auth?.user || '',
                        pass: config.email?.smtp?.auth?.pass || ''
                    }
                },
                from: config.email?.from || '',
                to: config.email?.to || []
            },
            
            // Slack
            slack: {
                enabled: config.slack?.enabled || false,
                webhookUrl: config.slack?.webhookUrl || '',
                channel: config.slack?.channel || '#alerts'
            },
            
            // Discord
            discord: {
                enabled: config.discord?.enabled || false,
                webhookUrl: config.discord?.webhookUrl || ''
            },
            
            // SMS (via Twilio)
            sms: {
                enabled: config.sms?.enabled || false,
                accountSid: config.sms?.accountSid || '',
                authToken: config.sms?.authToken || '',
                fromNumber: config.sms?.fromNumber || '',
                toNumbers: config.sms?.toNumbers || []
            }
        };
        
        this.emailTransporter = null;
        this.initializeEmailTransporter();
        
        console.log('📱 Sistema de Notificações inicializado');
        this.logEnabledChannels();
    }
    
    logEnabledChannels() {
        const enabled = [];
        
        if (this.config.whatsapp.enabled) enabled.push('WhatsApp');
        if (this.config.telegram.enabled) enabled.push('Telegram');
        if (this.config.email.enabled) enabled.push('Email');
        if (this.config.slack.enabled) enabled.push('Slack');
        if (this.config.discord.enabled) enabled.push('Discord');
        if (this.config.sms.enabled) enabled.push('SMS');
        
        console.log(`📢 Canais habilitados: ${enabled.length > 0 ? enabled.join(', ') : 'Nenhum'}`);
    }
    
    initializeEmailTransporter() {
        if (this.config.email.enabled && this.config.email.smtp.auth.user) {
            try {
                this.emailTransporter = nodemailer.createTransporter(this.config.email.smtp);
                console.log('✅ Transportador de email configurado');
            } catch (error) {
                console.error('❌ Erro ao configurar email:', error);
            }
        }
    }
    
    /**
     * ENVIAR NOTIFICAÇÃO PARA TODOS OS CANAIS
     */
    async sendNotification(notification) {
        const {
            type = 'info',
            title,
            message,
            severity = 'medium',
            details = {},
            channels = 'all' // 'all', 'critical', ou array específico
        } = notification;
        
        const results = {
            sent: [],
            failed: [],
            total: 0
        };
        
        // Determinar quais canais usar
        const targetChannels = this.determineTargetChannels(channels, severity);
        
        console.log(`📤 Enviando notificação: "${title}" para ${targetChannels.length} canais`);
        
        // Enviar para cada canal
        const promises = targetChannels.map(async (channel) => {
            try {
                const success = await this.sendToChannel(channel, {
                    type, title, message, severity, details
                });
                
                if (success) {
                    results.sent.push(channel);
                    console.log(`✅ ${channel}: Enviado`);
                } else {
                    results.failed.push({ channel, error: 'Falha no envio' });
                    console.log(`❌ ${channel}: Falhou`);
                }
                
            } catch (error) {
                results.failed.push({ channel, error: error.message });
                console.error(`❌ ${channel}: ${error.message}`);
            }
        });
        
        await Promise.allSettled(promises);
        
        results.total = results.sent.length + results.failed.length;
        
        console.log(`📊 Resultado: ${results.sent.length}/${results.total} enviados com sucesso`);
        
        return results;
    }
    
    determineTargetChannels(channels, severity) {
        const availableChannels = [];
        
        if (this.config.whatsapp.enabled) availableChannels.push('whatsapp');
        if (this.config.telegram.enabled) availableChannels.push('telegram');
        if (this.config.email.enabled) availableChannels.push('email');
        if (this.config.slack.enabled) availableChannels.push('slack');
        if (this.config.discord.enabled) availableChannels.push('discord');
        if (this.config.sms.enabled) availableChannels.push('sms');
        
        if (Array.isArray(channels)) {
            return channels.filter(ch => availableChannels.includes(ch));
        }
        
        if (channels === 'critical') {
            // Para alertas críticos, usar todos os canais imediatos
            return availableChannels.filter(ch => ['whatsapp', 'telegram', 'sms'].includes(ch));
        }
        
        if (channels === 'all') {
            return availableChannels;
        }
        
        return [];
    }
    
    async sendToChannel(channel, notification) {
        switch (channel) {
            case 'whatsapp':
                return await this.sendWhatsApp(notification);
            case 'telegram':
                return await this.sendTelegram(notification);
            case 'email':
                return await this.sendEmail(notification);
            case 'slack':
                return await this.sendSlack(notification);
            case 'discord':
                return await this.sendDiscord(notification);
            case 'sms':
                return await this.sendSMS(notification);
            default:
                throw new Error(`Canal não suportado: ${channel}`);
        }
    }
    
    /**
     * WHATSAPP
     */
    async sendWhatsApp(notification) {
        if (!this.config.whatsapp.enabled) return false;
        
        const message = this.formatWhatsAppMessage(notification);
        
        try {
            // Exemplo usando API genérica (adaptar conforme seu provedor)
            const response = await axios.post(this.config.whatsapp.apiUrl, {
                to: this.config.whatsapp.phoneNumber,
                message: message
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.whatsapp.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.status === 200;
            
        } catch (error) {
            console.error('WhatsApp error:', error.message);
            return false;
        }
    }
    
    formatWhatsAppMessage(notification) {
        const { title, message, severity, details } = notification;
        const emoji = this.getSeverityEmoji(severity);
        
        let text = `${emoji} *${title}*\\n\\n${message}`;
        
        if (details.component) {
            text += `\\n\\n📱 *Componente:* ${details.component}`;
        }
        
        if (details.timestamp) {
            text += `\\n⏰ *Horário:* ${new Date(details.timestamp).toLocaleString('pt-BR')}`;
        }
        
        text += `\\n\\n🤖 _System Doctor - Viral Content Scraper_`;
        
        return text;
    }
    
    /**
     * TELEGRAM
     */
    async sendTelegram(notification) {
        if (!this.config.telegram.enabled) return false;
        
        const message = this.formatTelegramMessage(notification);
        
        try {
            const url = `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`;
            
            const response = await axios.post(url, {
                chat_id: this.config.telegram.chatId,
                text: message,
                parse_mode: 'Markdown'
            });
            
            return response.status === 200;
            
        } catch (error) {
            console.error('Telegram error:', error.message);
            return false;
        }
    }
    
    formatTelegramMessage(notification) {
        const { title, message, severity, details } = notification;
        const emoji = this.getSeverityEmoji(severity);
        
        let text = `${emoji} *${title}*\\n\\n${message}`;
        
        if (details.component) {
            text += `\\n\\n📱 *Componente:* \`${details.component}\``;
        }
        
        if (details.error) {
            text += `\\n❌ *Erro:* \`${details.error}\``;
        }
        
        if (details.timestamp) {
            text += `\\n⏰ *Horário:* ${new Date(details.timestamp).toLocaleString('pt-BR')}`;
        }
        
        text += `\\n\\n🤖 _System Doctor - Viral Content Scraper_`;
        
        return text;
    }
    
    /**
     * EMAIL
     */
    async sendEmail(notification) {
        if (!this.config.email.enabled || !this.emailTransporter) return false;
        
        const { subject, html, text } = this.formatEmailMessage(notification);
        
        try {
            const mailOptions = {
                from: this.config.email.from,
                to: this.config.email.to.join(', '),
                subject: subject,
                text: text,
                html: html
            };
            
            await this.emailTransporter.sendMail(mailOptions);
            return true;
            
        } catch (error) {
            console.error('Email error:', error.message);
            return false;
        }
    }
    
    formatEmailMessage(notification) {
        const { title, message, severity, details } = notification;
        const emoji = this.getSeverityEmoji(severity);
        
        const subject = `${emoji} System Doctor Alert: ${title}`;
        
        const text = `
${title}

${message}

Severidade: ${severity.toUpperCase()}
Componente: ${details.component || 'N/A'}
Horário: ${new Date(details.timestamp || Date.now()).toLocaleString('pt-BR')}

---
System Doctor - Viral Content Scraper
Monitoramento Automático 24/7
        `.trim();
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .severity-${severity} { border-left: 5px solid ${this.getSeverityColor(severity)}; padding-left: 15px; }
        .details { background: white; padding: 15px; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>${emoji} System Doctor Alert</h2>
        </div>
        <div class="content">
            <div class="severity-${severity}">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
            
            <div class="details">
                <h4>Detalhes:</h4>
                <p><strong>Severidade:</strong> ${severity.toUpperCase()}</p>
                <p><strong>Componente:</strong> ${details.component || 'N/A'}</p>
                <p><strong>Horário:</strong> ${new Date(details.timestamp || Date.now()).toLocaleString('pt-BR')}</p>
                ${details.error ? `<p><strong>Erro:</strong> ${details.error}</p>` : ''}
            </div>
        </div>
        <div class="footer">
            <p>🤖 System Doctor - Viral Content Scraper<br>
            Monitoramento Automático 24/7</p>
        </div>
    </div>
</body>
</html>
        `;
        
        return { subject, text, html };
    }
    
    /**
     * SLACK
     */
    async sendSlack(notification) {
        if (!this.config.slack.enabled) return false;
        
        const payload = this.formatSlackMessage(notification);
        
        try {
            const response = await axios.post(this.config.slack.webhookUrl, payload);
            return response.status === 200;
            
        } catch (error) {
            console.error('Slack error:', error.message);
            return false;
        }
    }
    
    formatSlackMessage(notification) {
        const { title, message, severity, details } = notification;
        const color = this.getSeverityColor(severity);
        
        return {
            channel: this.config.slack.channel,
            username: 'System Doctor',
            icon_emoji: ':robot_face:',
            attachments: [{
                color: color,
                title: title,
                text: message,
                fields: [
                    {
                        title: 'Severidade',
                        value: severity.toUpperCase(),
                        short: true
                    },
                    {
                        title: 'Componente',
                        value: details.component || 'N/A',
                        short: true
                    },
                    {
                        title: 'Horário',
                        value: new Date(details.timestamp || Date.now()).toLocaleString('pt-BR'),
                        short: false
                    }
                ],
                footer: 'System Doctor - Viral Content Scraper',
                ts: Math.floor(Date.now() / 1000)
            }]
        };
    }
    
    /**
     * DISCORD
     */
    async sendDiscord(notification) {
        if (!this.config.discord.enabled) return false;
        
        const payload = this.formatDiscordMessage(notification);
        
        try {
            const response = await axios.post(this.config.discord.webhookUrl, payload);
            return response.status === 204;
            
        } catch (error) {
            console.error('Discord error:', error.message);
            return false;
        }
    }
    
    formatDiscordMessage(notification) {
        const { title, message, severity, details } = notification;
        const color = parseInt(this.getSeverityColor(severity).replace('#', ''), 16);
        
        return {
            embeds: [{
                title: title,
                description: message,
                color: color,
                fields: [
                    {
                        name: 'Severidade',
                        value: severity.toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'Componente',
                        value: details.component || 'N/A',
                        inline: true
                    },
                    {
                        name: 'Horário',
                        value: new Date(details.timestamp || Date.now()).toLocaleString('pt-BR'),
                        inline: false
                    }
                ],
                footer: {
                    text: 'System Doctor - Viral Content Scraper'
                },
                timestamp: new Date().toISOString()
            }]
        };
    }
    
    /**
     * SMS
     */
    async sendSMS(notification) {
        if (!this.config.sms.enabled) return false;
        
        const message = this.formatSMSMessage(notification);
        
        try {
            // Exemplo usando Twilio
            const twilio = require('twilio')(this.config.sms.accountSid, this.config.sms.authToken);
            
            const promises = this.config.sms.toNumbers.map(number => 
                twilio.messages.create({
                    body: message,
                    from: this.config.sms.fromNumber,
                    to: number
                })
            );
            
            await Promise.all(promises);
            return true;
            
        } catch (error) {
            console.error('SMS error:', error.message);
            return false;
        }
    }
    
    formatSMSMessage(notification) {
        const { title, message, severity } = notification;
        const emoji = this.getSeverityEmoji(severity);
        
        return `${emoji} ${title}: ${message} - System Doctor`;
    }
    
    /**
     * UTILITÁRIOS
     */
    getSeverityEmoji(severity) {
        switch (severity) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '🔔';
            case 'low': return 'ℹ️';
            default: return '📢';
        }
    }
    
    getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return '#FF0000';
            case 'high': return '#FF8C00';
            case 'medium': return '#FFD700';
            case 'low': return '#32CD32';
            default: return '#1E90FF';
        }
    }
    
    /**
     * MÉTODOS DE TESTE
     */
    async testNotifications() {
        console.log('🧪 Testando sistema de notificações...');
        
        const testNotification = {
            type: 'test',
            title: 'Teste do Sistema de Notificações',
            message: 'Esta é uma mensagem de teste para verificar se todas as notificações estão funcionando corretamente.',
            severity: 'medium',
            details: {
                component: 'notification_system',
                timestamp: new Date().toISOString()
            }
        };
        
        const results = await this.sendNotification(testNotification);
        
        console.log('📊 Resultados do teste:');
        console.log(`✅ Enviados: ${results.sent.join(', ')}`);
        console.log(`❌ Falharam: ${results.failed.map(f => f.channel).join(', ')}`);
        
        return results;
    }
    
    /**
     * CONFIGURAÇÃO DINÂMICA
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.initializeEmailTransporter();
        this.logEnabledChannels();
        console.log('🔄 Configuração de notificações atualizada');
    }
    
    getConfig() {
        // Retornar config sem dados sensíveis
        const safeConfig = JSON.parse(JSON.stringify(this.config));
        
        // Mascarar dados sensíveis
        if (safeConfig.whatsapp.apiKey) safeConfig.whatsapp.apiKey = '***';
        if (safeConfig.telegram.botToken) safeConfig.telegram.botToken = '***';
        if (safeConfig.email.smtp.auth.pass) safeConfig.email.smtp.auth.pass = '***';
        if (safeConfig.sms.authToken) safeConfig.sms.authToken = '***';
        
        return safeConfig;
    }
}

module.exports = NotificationSystem;

