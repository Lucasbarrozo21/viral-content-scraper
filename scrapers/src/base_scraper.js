const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const { delay } = require('./utils/helpers');
const UserAgentRotator = require('./utils/user_agent_rotator');
const ProxyManager = require('./utils/proxy_manager');

// Configurar Puppeteer com plugin stealth
puppeteer.use(StealthPlugin());

/**
 * Classe base para todos os scrapers de plataformas
 * Fornece funcionalidades comuns como navegação, captura de dados,
 * gerenciamento de proxies e tratamento de erros
 */
class BaseScraper {
    constructor(platformName, config = {}) {
        this.platformName = platformName;
        this.config = {
            headless: true,
            timeout: 30000,
            maxRetries: 3,
            delayMin: 2000,
            delayMax: 5000,
            maxConcurrent: 3,
            userDataDir: null,
            ...config
        };

        // Configurar logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return `${timestamp} [${level.toUpperCase()}] [${this.platformName}] ${message}${stack ? '\n' + stack : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../../logs/scraper.log') 
                })
            ]
        });

        this.browser = null;
        this.page = null;
        this.userAgentRotator = new UserAgentRotator();
        this.proxyManager = new ProxyManager();
        this.isRunning = false;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            startTime: null,
            lastActivity: null
        };
    }

    /**
     * Inicializa o browser com configurações otimizadas
     */
    async initialize() {
        try {
            this.logger.info('Inicializando browser...');
            
            const browserArgs = [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection'
            ];

            // Configurar proxy se disponível
            const proxy = await this.proxyManager.getProxy();
            if (proxy) {
                browserArgs.push(`--proxy-server=${proxy.host}:${proxy.port}`);
                this.logger.info(`Usando proxy: ${proxy.host}:${proxy.port}`);
            }

            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                args: browserArgs,
                userDataDir: this.config.userDataDir,
                defaultViewport: {
                    width: 1366,
                    height: 768
                }
            });

            this.page = await this.browser.newPage();
            
            // Configurar user agent
            const userAgent = this.userAgentRotator.getRandomUserAgent();
            await this.page.setUserAgent(userAgent);
            
            // Configurar headers adicionais
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            });

            // Interceptar requests para otimização
            await this.page.setRequestInterception(true);
            this.page.on('request', (request) => {
                const resourceType = request.resourceType();
                
                // Bloquear recursos desnecessários para acelerar o carregamento
                if (['font', 'image', 'media'].includes(resourceType) && 
                    !this.shouldLoadResource(request.url())) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            // Configurar timeouts
            this.page.setDefaultTimeout(this.config.timeout);
            this.page.setDefaultNavigationTimeout(this.config.timeout);

            this.isRunning = true;
            this.stats.startTime = new Date();
            this.logger.info('Browser inicializado com sucesso');

        } catch (error) {
            this.logger.error('Erro ao inicializar browser:', error);
            throw error;
        }
    }

    /**
     * Determina se um recurso deve ser carregado
     */
    shouldLoadResource(url) {
        // Carregar apenas recursos essenciais
        const essentialPatterns = [
            /\.(js|css)$/,
            /api\./,
            /ajax/,
            /graphql/
        ];

        return essentialPatterns.some(pattern => pattern.test(url));
    }

    /**
     * Navega para uma URL com retry e tratamento de erros
     */
    async navigateToUrl(url, options = {}) {
        const maxRetries = options.maxRetries || this.config.maxRetries;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.info(`Navegando para: ${url} (tentativa ${attempt}/${maxRetries})`);
                
                await this.page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: this.config.timeout
                });

                // Aguardar carregamento adicional se especificado
                if (options.waitForSelector) {
                    await this.page.waitForSelector(options.waitForSelector, {
                        timeout: this.config.timeout
                    });
                }

                this.stats.totalRequests++;
                this.stats.successfulRequests++;
                this.stats.lastActivity = new Date();
                
                this.logger.info(`Navegação bem-sucedida para: ${url}`);
                return true;

            } catch (error) {
                lastError = error;
                this.logger.warn(`Tentativa ${attempt} falhou para ${url}:`, error.message);
                
                if (attempt < maxRetries) {
                    const delayTime = this.getRandomDelay();
                    this.logger.info(`Aguardando ${delayTime}ms antes da próxima tentativa...`);
                    await delay(delayTime);
                    
                    // Rotacionar user agent e proxy em caso de erro
                    await this.rotateIdentity();
                }
            }
        }

        this.stats.totalRequests++;
        this.stats.failedRequests++;
        this.logger.error(`Falha ao navegar para ${url} após ${maxRetries} tentativas:`, lastError);
        throw lastError;
    }

    /**
     * Rotaciona identidade (user agent e proxy)
     */
    async rotateIdentity() {
        try {
            // Rotacionar user agent
            const newUserAgent = this.userAgentRotator.getRandomUserAgent();
            await this.page.setUserAgent(newUserAgent);
            
            // Rotacionar proxy (se configurado)
            if (this.proxyManager.isEnabled()) {
                const newProxy = await this.proxyManager.getProxy();
                if (newProxy) {
                    this.logger.info(`Rotacionando para novo proxy: ${newProxy.host}:${newProxy.port}`);
                    // Reinicializar browser com novo proxy seria necessário
                    // Por simplicidade, apenas logamos a mudança
                }
            }
            
        } catch (error) {
            this.logger.warn('Erro ao rotacionar identidade:', error);
        }
    }

    /**
     * Captura screenshot da página atual
     */
    async captureScreenshot(filename = null) {
        try {
            if (!filename) {
                filename = `screenshot_${this.platformName}_${Date.now()}.png`;
            }
            
            const screenshotPath = path.join(__dirname, '../../storage/screenshots', filename);
            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });
            
            this.logger.info(`Screenshot salvo: ${screenshotPath}`);
            return screenshotPath;
            
        } catch (error) {
            this.logger.error('Erro ao capturar screenshot:', error);
            return null;
        }
    }

    /**
     * Extrai dados básicos da página
     */
    async extractPageData() {
        try {
            return await this.page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    timestamp: new Date().toISOString(),
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                };
            });
        } catch (error) {
            this.logger.error('Erro ao extrair dados da página:', error);
            return null;
        }
    }

    /**
     * Aguarda um elemento aparecer na página
     */
    async waitForElement(selector, timeout = null) {
        try {
            await this.page.waitForSelector(selector, {
                timeout: timeout || this.config.timeout
            });
            return true;
        } catch (error) {
            this.logger.warn(`Elemento não encontrado: ${selector}`);
            return false;
        }
    }

    /**
     * Clica em um elemento com retry
     */
    async clickElement(selector, options = {}) {
        const maxRetries = options.maxRetries || 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                await this.page.click(selector);
                
                if (options.waitForNavigation) {
                    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                }
                
                return true;
                
            } catch (error) {
                this.logger.warn(`Tentativa ${attempt} de clique falhou em ${selector}:`, error.message);
                
                if (attempt < maxRetries) {
                    await delay(1000);
                }
            }
        }
        
        return false;
    }

    /**
     * Rola a página para carregar mais conteúdo
     */
    async scrollPage(options = {}) {
        const {
            scrolls = 3,
            delay: scrollDelay = 2000,
            direction = 'down'
        } = options;

        try {
            for (let i = 0; i < scrolls; i++) {
                await this.page.evaluate((dir) => {
                    if (dir === 'down') {
                        window.scrollTo(0, document.body.scrollHeight);
                    } else {
                        window.scrollTo(0, 0);
                    }
                }, direction);
                
                await delay(scrollDelay);
                this.logger.info(`Scroll ${i + 1}/${scrolls} executado`);
            }
        } catch (error) {
            this.logger.error('Erro ao rolar página:', error);
        }
    }

    /**
     * Obtém delay aleatório entre min e max configurados
     */
    getRandomDelay() {
        const min = this.config.delayMin;
        const max = this.config.delayMax;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Salva dados coletados em arquivo
     */
    async saveData(data, filename = null) {
        try {
            if (!filename) {
                filename = `${this.platformName}_data_${Date.now()}.json`;
            }
            
            const dataPath = path.join(__dirname, '../../storage/data', filename);
            await fs.mkdir(path.dirname(dataPath), { recursive: true });
            
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
            this.logger.info(`Dados salvos: ${dataPath}`);
            
            return dataPath;
            
        } catch (error) {
            this.logger.error('Erro ao salvar dados:', error);
            return null;
        }
    }

    /**
     * Obtém estatísticas do scraper
     */
    getStats() {
        const now = new Date();
        const runtime = this.stats.startTime ? now - this.stats.startTime : 0;
        
        return {
            ...this.stats,
            runtime: runtime,
            successRate: this.stats.totalRequests > 0 ? 
                (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0,
            isRunning: this.isRunning
        };
    }

    /**
     * Método abstrato que deve ser implementado por cada scraper específico
     */
    async scrapeContent() {
        throw new Error('Método scrapeContent deve ser implementado pela classe filha');
    }

    /**
     * Finaliza o browser e limpa recursos
     */
    async close() {
        try {
            this.isRunning = false;
            
            if (this.page) {
                await this.page.close();
            }
            
            if (this.browser) {
                await this.browser.close();
            }
            
            this.logger.info('Browser finalizado com sucesso');
            
            // Log das estatísticas finais
            const finalStats = this.getStats();
            this.logger.info('Estatísticas finais:', finalStats);
            
        } catch (error) {
            this.logger.error('Erro ao finalizar browser:', error);
        }
    }

    /**
     * Tratamento de erro padrão
     */
    handleError(error, context = '') {
        this.logger.error(`Erro ${context}:`, error);
        
        // Capturar screenshot em caso de erro para debug
        if (this.page) {
            this.captureScreenshot(`error_${Date.now()}.png`).catch(() => {});
        }
        
        return {
            error: true,
            message: error.message,
            context: context,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = BaseScraper;

