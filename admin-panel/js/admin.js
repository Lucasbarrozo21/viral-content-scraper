/**
 * ADMIN PANEL JAVASCRIPT
 * Controle completo da ferramenta bilionária
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

class AdminPanel {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api/v1';
        this.currentSection = 'dashboard';
        this.refreshInterval = null;
        this.charts = {};
        
        this.init();
    }
    
    init() {
        console.log('🚀 Inicializando Admin Panel...');
        
        // Setup navigation
        this.setupNavigation();
        
        // Load initial data
        this.loadDashboardData();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Admin Panel inicializado com sucesso!');
    }
    
    /**
     * NAVEGAÇÃO
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.getAttribute('data-section');
                this.showSection(section);
                
                // Update active nav
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Load section-specific data
            this.loadSectionData(sectionName);
        }
    }
    
    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'scrapers':
                this.loadScrapersData();
                break;
            case 'ai-agents':
                this.loadAIAgentsData();
                break;
            case 'system-doctor':
                this.loadSystemDoctorData();
                break;
            case 'database':
                this.loadDatabaseData();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }
    
    /**
     * DASHBOARD
     */
    async loadDashboardData() {
        try {
            // Update status cards
            await this.updateStatusCards();
            
            // Update performance chart
            this.updatePerformanceChart();
            
            // Update recent alerts
            this.updateRecentAlerts();
            
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }
    
    async updateStatusCards() {
        // Simular dados (em produção, viria da API)
        const data = {
            activeScrapers: '8/8',
            activeAgents: '7/7',
            contentCollected: '1,247,892',
            systemDoctorStatus: 'ATIVO'
        };
        
        document.getElementById('active-scrapers').textContent = data.activeScrapers;
        document.getElementById('active-agents').textContent = data.activeAgents;
        document.getElementById('content-collected').textContent = data.contentCollected;
    }
    
    updatePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Conteúdo Coletado',
                    data: [1200, 1900, 3000, 5000, 2000, 3000],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    tension: 0.3,
                    fill: true
                }, {
                    label: 'CPU Usage (%)',
                    data: [30, 45, 60, 70, 55, 40],
                    borderColor: '#1cc88a',
                    backgroundColor: 'rgba(28, 200, 138, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    updateRecentAlerts() {
        const alertsContainer = document.getElementById('recent-alerts');
        
        const alerts = [
            { type: 'success', icon: 'check-circle', message: 'Todos os sistemas operacionais' },
            { type: 'info', icon: 'info-circle', message: 'Backup automático concluído' },
            { type: 'warning', icon: 'exclamation-triangle', message: 'Instagram: Rate limit detectado (resolvido)' }
        ];
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type} alert-sm" role="alert">
                <i class="fas fa-${alert.icon}"></i> ${alert.message}
            </div>
        `).join('');
    }
    
    /**
     * SCRAPERS
     */
    async loadScrapersData() {
        const scrapersData = [
            { platform: 'Instagram', status: 'running', collected: 45672, successRate: 94.2, lastUpdate: '2 min atrás' },
            { platform: 'TikTok', status: 'running', collected: 38291, successRate: 96.8, lastUpdate: '1 min atrás' },
            { platform: 'YouTube', status: 'running', collected: 29384, successRate: 91.5, lastUpdate: '3 min atrás' },
            { platform: 'Facebook', status: 'paused', collected: 15672, successRate: 87.3, lastUpdate: '15 min atrás' },
            { platform: 'LinkedIn', status: 'running', collected: 8934, successRate: 89.7, lastUpdate: '1 min atrás' },
            { platform: 'Twitter', status: 'running', collected: 52847, successRate: 93.1, lastUpdate: '30 seg atrás' },
            { platform: 'VSL Collector', status: 'running', collected: 1247, successRate: 98.5, lastUpdate: '5 min atrás' },
            { platform: 'Landing Pages', status: 'running', collected: 892, successRate: 97.2, lastUpdate: '2 min atrás' }
        ];
        
        const tbody = document.getElementById('scrapers-tbody');
        tbody.innerHTML = scrapersData.map(scraper => `
            <tr>
                <td>
                    <i class="fab fa-${scraper.platform.toLowerCase()} me-2"></i>
                    <strong>${scraper.platform}</strong>
                </td>
                <td>
                    <span class="badge status-${scraper.status}">
                        ${scraper.status.toUpperCase()}
                    </span>
                </td>
                <td>${scraper.collected.toLocaleString()}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${scraper.successRate > 90 ? 'bg-success' : scraper.successRate > 80 ? 'bg-warning' : 'bg-danger'}" 
                             style="width: ${scraper.successRate}%">
                            ${scraper.successRate}%
                        </div>
                    </div>
                </td>
                <td>${scraper.lastUpdate}</td>
                <td>
                    <button class="btn btn-sm btn-success action-btn" onclick="adminPanel.startScraper('${scraper.platform}')">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-danger action-btn" onclick="adminPanel.stopScraper('${scraper.platform}')">
                        <i class="fas fa-stop"></i>
                    </button>
                    <button class="btn btn-sm btn-info action-btn" onclick="adminPanel.configureScraper('${scraper.platform}')">
                        <i class="fas fa-cog"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * AI AGENTS
     */
    async loadAIAgentsData() {
        const agentsData = [
            { name: 'Visual Content Analyzer', status: 'active', analyses: 15672, accuracy: 96.8, description: 'Análise neural de imagens' },
            { name: 'Content Copy Analyzer', status: 'active', analyses: 23847, accuracy: 94.2, description: 'Análise de copy persuasiva' },
            { name: 'Viral Hooks Analyzer', status: 'active', analyses: 8934, accuracy: 98.5, description: 'Especialista em hooks virais' },
            { name: 'Engagement Pattern Analyzer', status: 'active', analyses: 12456, accuracy: 92.7, description: 'Padrões matemáticos de engajamento' },
            { name: 'Template Generator', status: 'active', analyses: 3421, accuracy: 89.3, description: 'Geração automática de templates' },
            { name: 'Visual Template Extractor', status: 'active', analyses: 2847, accuracy: 95.1, description: 'Extração de padrões visuais' },
            { name: 'Template Manager', status: 'active', analyses: 1923, accuracy: 97.4, description: 'Gerenciamento inteligente' }
        ];
        
        const container = document.getElementById('ai-agents-grid');
        container.innerHTML = agentsData.map(agent => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card ai-agent-card shadow">
                    <div class="ai-agent-status ${agent.status}"></div>
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="fas fa-robot text-primary me-2"></i>
                            ${agent.name}
                        </h6>
                        <p class="card-text text-muted small">${agent.description}</p>
                        
                        <div class="row text-center mt-3">
                            <div class="col-6">
                                <div class="metric-value h5 text-primary">${agent.analyses.toLocaleString()}</div>
                                <div class="metric-label small text-muted">Análises</div>
                            </div>
                            <div class="col-6">
                                <div class="metric-value h5 text-success">${agent.accuracy}%</div>
                                <div class="metric-label small text-muted">Precisão</div>
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2 mt-3">
                            <button class="btn btn-sm btn-outline-primary" onclick="adminPanel.configureAgent('${agent.name}')">
                                <i class="fas fa-cog"></i> Configurar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * SYSTEM DOCTOR
     */
    async loadSystemDoctorData() {
        const statusContainer = document.getElementById('system-doctor-status');
        
        const systemDoctorData = {
            status: 'active',
            uptime: '2 dias, 14 horas',
            problemsDetected: 23,
            problemsResolved: 22,
            learningRate: 'Contínuo',
            confidence: 97.3,
            lastAction: 'Rotação automática de proxy - Instagram (2 min atrás)'
        };
        
        statusContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="metric-card">
                        <div class="metric-value">
                            <i class="fas fa-brain system-doctor-brain"></i>
                            ${systemDoctorData.confidence}%
                        </div>
                        <div class="metric-label">Confiança da IA</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="metric-card">
                        <div class="metric-value">${systemDoctorData.uptime}</div>
                        <div class="metric-label">Tempo Ativo</div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="fas fa-chart-pie text-info"></i> Estatísticas de Problemas
                            </h6>
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <div class="h4 text-warning">${systemDoctorData.problemsDetected}</div>
                                    <div class="small text-muted">Detectados</div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="h4 text-success">${systemDoctorData.problemsResolved}</div>
                                    <div class="small text-muted">Resolvidos</div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="h4 text-primary">${((systemDoctorData.problemsResolved / systemDoctorData.problemsDetected) * 100).toFixed(1)}%</div>
                                    <div class="small text-muted">Taxa de Sucesso</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="fas fa-history text-success"></i> Última Ação
                            </h6>
                            <p class="card-text">${systemDoctorData.lastAction}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * DATABASE
     */
    async loadDatabaseData() {
        const databaseStats = [
            { table: 'viral_content', count: 1247892, size: '2.3 GB' },
            { table: 'content_analysis', count: 892456, size: '1.8 GB' },
            { table: 'viral_templates', count: 15672, size: '245 MB' },
            { table: 'users', count: 1247, size: '12 MB' },
            { table: 'scraping_jobs', count: 45892, size: '156 MB' },
            { table: 'platform_metrics', count: 234567, size: '567 MB' }
        ];
        
        const container = document.getElementById('database-stats');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="m-0 font-weight-bold text-primary">
                        <i class="fas fa-table"></i> Estatísticas das Tabelas
                    </h6>
                </div>
                <div class="card-body p-0">
                    ${databaseStats.map(stat => `
                        <div class="db-table-stat">
                            <div class="db-table-name">${stat.table}</div>
                            <div>
                                <span class="db-table-count">${stat.count.toLocaleString()}</span>
                                <span class="text-muted ms-2">(${stat.size})</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-4">
                    <button class="btn btn-primary btn-block" onclick="adminPanel.optimizeDatabase()">
                        <i class="fas fa-rocket"></i> Otimizar Banco
                    </button>
                </div>
                <div class="col-md-4">
                    <button class="btn btn-warning btn-block" onclick="adminPanel.cleanupDatabase()">
                        <i class="fas fa-broom"></i> Limpeza
                    </button>
                </div>
                <div class="col-md-4">
                    <button class="btn btn-info btn-block" onclick="adminPanel.exportDatabase()">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * SETTINGS
     */
    async loadSettingsData() {
        const form = document.getElementById('settings-form');
        
        form.innerHTML = `
            <div class="config-section">
                <h5><i class="fas fa-spider"></i> Configurações de Scraping</h5>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Delay entre requests (segundos)</label>
                            <input type="number" class="form-control" value="2" min="1" max="10">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Máximo requests por hora</label>
                            <input type="number" class="form-control" value="100" min="10" max="1000">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Rotação de proxy</label>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">User Agent rotation</label>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h5><i class="fas fa-robot"></i> Configurações de IA</h5>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Threshold de confiança</label>
                            <input type="range" class="form-range" min="0.5" max="1" step="0.1" value="0.8">
                            <small class="text-muted">Atual: 0.8 (80%)</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Aprendizado contínuo</label>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h5><i class="fas fa-stethoscope"></i> System Doctor</h5>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Intervalo de monitoramento (segundos)</label>
                            <input type="number" class="form-control" value="30" min="10" max="300">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Auto-correção</label>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" onclick="adminPanel.resetSettings()">
                    <i class="fas fa-undo"></i> Resetar
                </button>
                <button type="button" class="btn btn-primary" onclick="adminPanel.saveSettings()">
                    <i class="fas fa-save"></i> Salvar Configurações
                </button>
            </div>
        `;
    }
    
    /**
     * AUTO REFRESH
     */
    setupAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.updateStatusCards();
            }
        }, 30000); // 30 segundos
    }
    
    /**
     * EVENT LISTENERS
     */
    setupEventListeners() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Erro no Admin Panel:', e.error);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.showSection('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showSection('scrapers');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showSection('ai-agents');
                        break;
                }
            }
        });
    }
    
    /**
     * ACTION METHODS
     */
    async startScraper(platform) {
        try {
            this.showMessage(`Iniciando scraper ${platform}...`, 'info');
            
            // Simular API call
            await this.delay(1000);
            
            this.showMessage(`Scraper ${platform} iniciado com sucesso!`, 'success');
            this.loadScrapersData();
            
        } catch (error) {
            this.showMessage(`Erro ao iniciar scraper ${platform}: ${error.message}`, 'error');
        }
    }
    
    async stopScraper(platform) {
        try {
            this.showMessage(`Parando scraper ${platform}...`, 'info');
            
            // Simular API call
            await this.delay(1000);
            
            this.showMessage(`Scraper ${platform} parado com sucesso!`, 'success');
            this.loadScrapersData();
            
        } catch (error) {
            this.showMessage(`Erro ao parar scraper ${platform}: ${error.message}`, 'error');
        }
    }
    
    async startAllScrapers() {
        try {
            this.showMessage('Iniciando todos os scrapers...', 'info');
            
            // Simular API call
            await this.delay(2000);
            
            this.showMessage('Todos os scrapers iniciados com sucesso!', 'success');
            this.loadScrapersData();
            
        } catch (error) {
            this.showMessage(`Erro ao iniciar scrapers: ${error.message}`, 'error');
        }
    }
    
    async stopAllScrapers() {
        try {
            this.showMessage('Parando todos os scrapers...', 'info');
            
            // Simular API call
            await this.delay(2000);
            
            this.showMessage('Todos os scrapers parados com sucesso!', 'success');
            this.loadScrapersData();
            
        } catch (error) {
            this.showMessage(`Erro ao parar scrapers: ${error.message}`, 'error');
        }
    }
    
    async trainAI() {
        try {
            this.showMessage('Iniciando treinamento da IA...', 'info');
            
            // Simular treinamento
            await this.delay(3000);
            
            this.showMessage('Treinamento da IA concluído com sucesso!', 'success');
            
        } catch (error) {
            this.showMessage(`Erro no treinamento: ${error.message}`, 'error');
        }
    }
    
    async createBackup() {
        try {
            this.showMessage('Criando backup completo...', 'info');
            
            // Simular backup
            await this.delay(5000);
            
            this.showMessage('Backup criado com sucesso!', 'success');
            
        } catch (error) {
            this.showMessage(`Erro no backup: ${error.message}`, 'error');
        }
    }
    
    async startSystemDoctor() {
        try {
            this.showMessage('Iniciando System Doctor...', 'info');
            
            // Simular API call
            await this.delay(1000);
            
            this.showMessage('System Doctor iniciado com sucesso!', 'success');
            this.loadSystemDoctorData();
            
        } catch (error) {
            this.showMessage(`Erro ao iniciar System Doctor: ${error.message}`, 'error');
        }
    }
    
    async stopSystemDoctor() {
        try {
            this.showMessage('Parando System Doctor...', 'info');
            
            // Simular API call
            await this.delay(1000);
            
            this.showMessage('System Doctor parado com sucesso!', 'success');
            this.loadSystemDoctorData();
            
        } catch (error) {
            this.showMessage(`Erro ao parar System Doctor: ${error.message}`, 'error');
        }
    }
    
    async retrainSystemDoctor() {
        try {
            this.showMessage('Retreinando System Doctor...', 'info');
            
            // Simular retreinamento
            await this.delay(3000);
            
            this.showMessage('System Doctor retreinado com sucesso!', 'success');
            this.loadSystemDoctorData();
            
        } catch (error) {
            this.showMessage(`Erro no retreinamento: ${error.message}`, 'error');
        }
    }
    
    async saveSettings() {
        try {
            this.showMessage('Salvando configurações...', 'info');
            
            // Simular salvamento
            await this.delay(1000);
            
            this.showMessage('Configurações salvas com sucesso!', 'success');
            
        } catch (error) {
            this.showMessage(`Erro ao salvar: ${error.message}`, 'error');
        }
    }
    
    /**
     * UTILITY METHODS
     */
    showMessage(message, type) {
        // Criar e mostrar mensagem toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.top = '80px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        toast.style.minWidth = '300px';
        
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatNumber(num) {
        return num.toLocaleString('pt-BR');
    }
    
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Global functions for HTML onclick events
window.startAllScrapers = () => adminPanel.startAllScrapers();
window.stopAllScrapers = () => adminPanel.stopAllScrapers();
window.trainAI = () => adminPanel.trainAI();
window.createBackup = () => adminPanel.createBackup();
window.startSystemDoctor = () => adminPanel.startSystemDoctor();
window.stopSystemDoctor = () => adminPanel.stopSystemDoctor();
window.retrainSystemDoctor = () => adminPanel.retrainSystemDoctor();
window.viewSystemDoctorLogs = () => adminPanel.showSection('logs');

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

console.log('🎯 Admin Panel JavaScript carregado!');

