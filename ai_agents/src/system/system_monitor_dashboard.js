/**
 * SYSTEM MONITOR DASHBOARD
 * Dashboard em tempo real para monitoramento do System Doctor
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const SystemDoctor = require('./system_doctor');

class SystemMonitorDashboard {
    constructor(port = 3001) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.systemDoctor = new SystemDoctor();
        this.connectedClients = new Set();
        
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupSystemDoctorListeners();
    }
    
    setupRoutes() {
        // Servir arquivos estáticos
        this.app.use(express.static(__dirname + '/dashboard'));
        
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json(this.systemDoctor.getSystemStatus());
        });
        
        this.app.get('/api/health-history', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            res.json(this.systemDoctor.getHealthHistory(limit));
        });
        
        this.app.post('/api/start-monitoring', (req, res) => {
            this.systemDoctor.startMonitoring();
            res.json({ success: true, message: 'Monitoramento iniciado' });
        });
        
        this.app.post('/api/stop-monitoring', (req, res) => {
            this.systemDoctor.stopMonitoring();
            res.json({ success: true, message: 'Monitoramento parado' });
        });
        
        // Dashboard principal
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`📱 Cliente conectado ao dashboard: ${socket.id}`);
            this.connectedClients.add(socket.id);
            
            // Enviar status inicial
            socket.emit('system_status', this.systemDoctor.getSystemStatus());
            
            socket.on('disconnect', () => {
                console.log(`📱 Cliente desconectado: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });
            
            socket.on('request_status', () => {
                socket.emit('system_status', this.systemDoctor.getSystemStatus());
            });
        });
    }
    
    setupSystemDoctorListeners() {
        // Escutar eventos do System Doctor
        this.systemDoctor.on('health_check_completed', (report) => {
            this.broadcastToClients('health_check_completed', report);
        });
        
        this.systemDoctor.on('issues_detected', (report) => {
            this.broadcastToClients('issues_detected', report);
        });
        
        this.systemDoctor.on('alert', (alert) => {
            this.broadcastToClients('alert', alert);
        });
        
        this.systemDoctor.on('monitoring_started', () => {
            this.broadcastToClients('monitoring_status', { status: 'started' });
        });
        
        this.systemDoctor.on('monitoring_stopped', () => {
            this.broadcastToClients('monitoring_status', { status: 'stopped' });
        });
        
        // Eventos específicos de recursos
        this.systemDoctor.on('high_cpu_usage', (data) => {
            this.broadcastToClients('resource_alert', { type: 'cpu', ...data });
        });
        
        this.systemDoctor.on('high_memory_usage', (data) => {
            this.broadcastToClients('resource_alert', { type: 'memory', ...data });
        });
        
        this.systemDoctor.on('high_disk_usage', (data) => {
            this.broadcastToClients('resource_alert', { type: 'disk', ...data });
        });
    }
    
    broadcastToClients(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Doctor - Monitor de Saúde</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .status-indicator {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-left: 10px;
            animation: pulse 2s infinite;
        }
        
        .status-healthy { background-color: #4CAF50; }
        .status-warning { background-color: #FF9800; }
        .status-critical { background-color: #F44336; }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            margin-bottom: 15px;
            font-size: 1.3em;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 10px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .metric-value {
            font-weight: bold;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            margin-top: 5px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            border-radius: 10px;
            transition: width 0.5s ease;
        }
        
        .progress-fill.warning {
            background: linear-gradient(90deg, #FF9800, #FFC107);
        }
        
        .progress-fill.critical {
            background: linear-gradient(90deg, #F44336, #FF5722);
        }
        
        .scrapers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .scraper-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .scraper-status {
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        .alerts-container {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .alert-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid;
        }
        
        .alert-critical { border-left-color: #F44336; }
        .alert-high { border-left-color: #FF9800; }
        .alert-medium { border-left-color: #FFC107; }
        .alert-low { border-left-color: #4CAF50; }
        
        .controls {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            margin: 0 10px;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }
        
        .btn.active {
            background: #4CAF50;
        }
        
        .timestamp {
            font-size: 0.8em;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        
        .connected {
            background: #4CAF50;
        }
        
        .disconnected {
            background: #F44336;
        }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">Conectando...</div>
    
    <div class="container">
        <div class="header">
            <h1>🤖 System Doctor</h1>
            <p>Monitor de Saúde em Tempo Real</p>
            <div class="status-indicator" id="overallStatus"></div>
        </div>
        
        <div class="controls">
            <button class="btn" id="startBtn" onclick="startMonitoring()">▶️ Iniciar Monitoramento</button>
            <button class="btn" id="stopBtn" onclick="stopMonitoring()">⏹️ Parar Monitoramento</button>
            <button class="btn" onclick="refreshStatus()">🔄 Atualizar</button>
        </div>
        
        <div class="dashboard-grid">
            <!-- Recursos do Sistema -->
            <div class="card">
                <h3>📊 Recursos do Sistema</h3>
                <div class="metric">
                    <span>CPU:</span>
                    <span class="metric-value" id="cpuUsage">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="cpuProgress"></div>
                </div>
                
                <div class="metric">
                    <span>Memória:</span>
                    <span class="metric-value" id="memoryUsage">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="memoryProgress"></div>
                </div>
                
                <div class="metric">
                    <span>Disco:</span>
                    <span class="metric-value" id="diskUsage">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="diskProgress"></div>
                </div>
            </div>
            
            <!-- Status dos Scrapers -->
            <div class="card">
                <h3>🕷️ Status dos Scrapers</h3>
                <div class="scrapers-grid" id="scrapersGrid">
                    <!-- Scrapers serão inseridos dinamicamente -->
                </div>
            </div>
            
            <!-- Componentes -->
            <div class="card">
                <h3>🔧 Componentes</h3>
                <div class="metric">
                    <span>🗄️ Banco de Dados:</span>
                    <span class="metric-value" id="dbStatus">-</span>
                </div>
                <div class="metric">
                    <span>⚡ Redis:</span>
                    <span class="metric-value" id="redisStatus">-</span>
                </div>
                <div class="metric">
                    <span>🌐 API:</span>
                    <span class="metric-value" id="apiStatus">-</span>
                </div>
                <div class="metric">
                    <span>🧠 Agentes IA:</span>
                    <span class="metric-value" id="agentsStatus">-</span>
                </div>
            </div>
            
            <!-- Estatísticas -->
            <div class="card">
                <h3>📈 Estatísticas</h3>
                <div class="metric">
                    <span>Problemas Detectados:</span>
                    <span class="metric-value" id="totalIssues">0</span>
                </div>
                <div class="metric">
                    <span>Correções Aplicadas:</span>
                    <span class="metric-value" id="totalFixes">0</span>
                </div>
                <div class="metric">
                    <span>Última Verificação:</span>
                    <span class="metric-value" id="lastCheck">-</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span class="metric-value" id="uptime">-</span>
                </div>
            </div>
        </div>
        
        <!-- Alertas Recentes -->
        <div class="card">
            <h3>🚨 Alertas Recentes</h3>
            <div class="alerts-container" id="alertsContainer">
                <p>Nenhum alerta recente</p>
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        let monitoringActive = false;
        let startTime = Date.now();
        
        // Conexão WebSocket
        socket.on('connect', () => {
            document.getElementById('connectionStatus').textContent = '🟢 Conectado';
            document.getElementById('connectionStatus').className = 'connection-status connected';
            socket.emit('request_status');
        });
        
        socket.on('disconnect', () => {
            document.getElementById('connectionStatus').textContent = '🔴 Desconectado';
            document.getElementById('connectionStatus').className = 'connection-status disconnected';
        });
        
        // Eventos do System Doctor
        socket.on('system_status', (status) => {
            updateDashboard(status);
        });
        
        socket.on('health_check_completed', (report) => {
            updateHealthReport(report);
        });
        
        socket.on('issues_detected', (report) => {
            showIssues(report.issues);
        });
        
        socket.on('alert', (alert) => {
            addAlert(alert);
        });
        
        socket.on('monitoring_status', (data) => {
            monitoringActive = data.status === 'started';
            updateMonitoringButtons();
        });
        
        socket.on('resource_alert', (data) => {
            addAlert({
                type: 'resource',
                message: \`Alto uso de \${data.type}: \${data.usage}%\`,
                severity: 'high',
                timestamp: new Date().toISOString()
            });
        });
        
        // Funções de controle
        function startMonitoring() {
            fetch('/api/start-monitoring', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        monitoringActive = true;
                        startTime = Date.now();
                        updateMonitoringButtons();
                    }
                });
        }
        
        function stopMonitoring() {
            fetch('/api/stop-monitoring', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        monitoringActive = false;
                        updateMonitoringButtons();
                    }
                });
        }
        
        function refreshStatus() {
            socket.emit('request_status');
        }
        
        function updateMonitoringButtons() {
            const startBtn = document.getElementById('startBtn');
            const stopBtn = document.getElementById('stopBtn');
            
            if (monitoringActive) {
                startBtn.classList.remove('active');
                stopBtn.classList.add('active');
            } else {
                startBtn.classList.add('active');
                stopBtn.classList.remove('active');
            }
        }
        
        function updateDashboard(status) {
            // Status geral
            const overallStatus = document.getElementById('overallStatus');
            overallStatus.className = 'status-indicator status-healthy'; // Assumir healthy por padrão
            
            // Recursos do sistema
            if (status.components.system) {
                updateSystemResources(status.components.system);
            }
            
            // Scrapers
            updateScrapers(status.components.scrapers);
            
            // Componentes
            updateComponents(status.components);
            
            // Estatísticas
            document.getElementById('totalIssues').textContent = status.totalIssuesDetected || 0;
            document.getElementById('totalFixes').textContent = status.totalFixesApplied || 0;
            document.getElementById('lastCheck').textContent = status.lastHealthCheck 
                ? new Date(status.lastHealthCheck).toLocaleTimeString() 
                : '-';
            
            // Uptime
            if (monitoringActive) {
                const uptime = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('uptime').textContent = formatUptime(uptime);
            }
        }
        
        function updateSystemResources(system) {
            // CPU
            document.getElementById('cpuUsage').textContent = system.cpu + '%';
            updateProgressBar('cpuProgress', system.cpu, 80);
            
            // Memória
            document.getElementById('memoryUsage').textContent = system.memory + '%';
            updateProgressBar('memoryProgress', system.memory, 85);
            
            // Disco
            document.getElementById('diskUsage').textContent = system.disk + '%';
            updateProgressBar('diskProgress', system.disk, 90);
        }
        
        function updateProgressBar(id, value, threshold) {
            const progressBar = document.getElementById(id);
            progressBar.style.width = value + '%';
            
            if (value > threshold) {
                progressBar.className = 'progress-fill critical';
            } else if (value > threshold * 0.8) {
                progressBar.className = 'progress-fill warning';
            } else {
                progressBar.className = 'progress-fill';
            }
        }
        
        function updateScrapers(scrapers) {
            const grid = document.getElementById('scrapersGrid');
            grid.innerHTML = '';
            
            for (const [platform, status] of Object.entries(scrapers || {})) {
                const item = document.createElement('div');
                item.className = 'scraper-item';
                
                const statusIcon = status.status === 'running' ? '🟢' : 
                                 status.status === 'blocked' ? '🔴' : '🟡';
                
                item.innerHTML = \`
                    <div><strong>\${platform.toUpperCase()}</strong></div>
                    <div class="scraper-status">\${statusIcon} \${status.status}</div>
                    <div style="font-size: 0.8em; margin-top: 5px;">
                        Items: \${status.items_collected_today || 0}
                    </div>
                \`;
                
                grid.appendChild(item);
            }
        }
        
        function updateComponents(components) {
            document.getElementById('dbStatus').textContent = components.database?.status || '-';
            document.getElementById('redisStatus').textContent = components.redis?.status || '-';
            document.getElementById('apiStatus').textContent = components.api?.status || '-';
            
            const agentsCount = Object.keys(components.agents || {}).length;
            document.getElementById('agentsStatus').textContent = agentsCount + ' ativos';
        }
        
        function addAlert(alert) {
            const container = document.getElementById('alertsContainer');
            
            // Limpar mensagem padrão
            if (container.textContent === 'Nenhum alerta recente') {
                container.innerHTML = '';
            }
            
            const alertItem = document.createElement('div');
            alertItem.className = \`alert-item alert-\${alert.severity}\`;
            alertItem.innerHTML = \`
                <div><strong>\${alert.type?.toUpperCase() || 'ALERTA'}</strong></div>
                <div>\${alert.message}</div>
                <div class="timestamp">\${new Date(alert.timestamp).toLocaleString()}</div>
            \`;
            
            container.insertBefore(alertItem, container.firstChild);
            
            // Manter apenas últimos 10 alertas
            while (container.children.length > 10) {
                container.removeChild(container.lastChild);
            }
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            return \`\${hours}h \${minutes}m \${secs}s\`;
        }
        
        // Atualizar uptime a cada segundo
        setInterval(() => {
            if (monitoringActive) {
                const uptime = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('uptime').textContent = formatUptime(uptime);
            }
        }, 1000);
        
        // Inicializar
        refreshStatus();
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`🖥️ System Monitor Dashboard rodando em http://localhost:${this.port}`);
                console.log('🤖 System Doctor pronto para monitoramento!');
                resolve();
            });
        });
    }
    
    async stop() {
        this.systemDoctor.stopMonitoring();
        this.server.close();
        console.log('⏹️ System Monitor Dashboard parado');
    }
}

module.exports = SystemMonitorDashboard;

// Executar se chamado diretamente
if (require.main === module) {
    const dashboard = new SystemMonitorDashboard();
    
    dashboard.start().then(() => {
        console.log('✅ Dashboard iniciado com sucesso!');
        console.log('📱 Acesse: http://localhost:3001');
        
        // Iniciar monitoramento automaticamente
        setTimeout(() => {
            dashboard.systemDoctor.startMonitoring();
        }, 2000);
    }).catch(error => {
        console.error('❌ Erro ao iniciar dashboard:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\\n🛑 Parando System Monitor Dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
}

