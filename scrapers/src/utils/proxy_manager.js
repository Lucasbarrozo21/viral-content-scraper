/**
 * Gerenciador de Proxies
 * Fornece rotação e gerenciamento de proxies para evitar bloqueios
 */
class ProxyManager {
    constructor(config = {}) {
        this.config = {
            enabled: false,
            rotationInterval: 300000, // 5 minutos
            maxFailures: 3,
            testTimeout: 10000,
            ...config
        };
        
        this.proxies = [];
        this.currentIndex = 0;
        this.proxyStats = new Map();
        this.blacklist = new Set();
        this.lastRotation = null;
        this.testUrls = [
            'https://httpbin.org/ip',
            'https://api.ipify.org?format=json',
            'https://ipinfo.io/json'
        ];
    }

    /**
     * Adiciona proxies à lista
     * @param {Array<Object>} proxies - Lista de proxies {host, port, username?, password?, type?}
     */
    addProxies(proxies) {
        for (const proxy of proxies) {
            if (this.isValidProxy(proxy)) {
                this.proxies.push(proxy);
                this.proxyStats.set(this.getProxyKey(proxy), {
                    successes: 0,
                    failures: 0,
                    lastUsed: null,
                    lastTested: null,
                    responseTime: null,
                    isWorking: null
                });
            }
        }
    }

    /**
     * Carrega proxies de arquivo
     * @param {string} filePath - Caminho do arquivo com proxies
     */
    async loadProxiesFromFile(filePath) {
        try {
            const fs = require('fs').promises;
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const proxies = lines.map(line => {
                const parts = line.trim().split(':');
                if (parts.length >= 2) {
                    return {
                        host: parts[0],
                        port: parseInt(parts[1]),
                        username: parts[2] || null,
                        password: parts[3] || null,
                        type: 'http'
                    };
                }
                return null;
            }).filter(proxy => proxy !== null);
            
            this.addProxies(proxies);
            return proxies.length;
            
        } catch (error) {
            console.error('Erro ao carregar proxies do arquivo:', error);
            return 0;
        }
    }

    /**
     * Obtém próximo proxy disponível
     * @returns {Object|null}
     */
    async getProxy() {
        if (!this.config.enabled || this.proxies.length === 0) {
            return null;
        }

        // Verificar se precisa rotacionar
        if (this.shouldRotate()) {
            await this.rotateProxy();
        }

        // Encontrar proxy funcional
        let attempts = 0;
        const maxAttempts = this.proxies.length;
        
        while (attempts < maxAttempts) {
            const proxy = this.proxies[this.currentIndex];
            const proxyKey = this.getProxyKey(proxy);
            
            // Pular proxies na blacklist
            if (this.blacklist.has(proxyKey)) {
                this.moveToNext();
                attempts++;
                continue;
            }
            
            // Testar proxy se necessário
            if (await this.shouldTestProxy(proxy)) {
                const isWorking = await this.testProxy(proxy);
                if (!isWorking) {
                    this.moveToNext();
                    attempts++;
                    continue;
                }
            }
            
            // Atualizar estatísticas
            const stats = this.proxyStats.get(proxyKey);
            stats.lastUsed = new Date();
            
            return proxy;
        }
        
        // Se nenhum proxy funcional foi encontrado
        console.warn('Nenhum proxy funcional encontrado');
        return null;
    }

    /**
     * Testa se um proxy está funcionando
     * @param {Object} proxy 
     * @returns {Promise<boolean>}
     */
    async testProxy(proxy) {
        const proxyKey = this.getProxyKey(proxy);
        const stats = this.proxyStats.get(proxyKey);
        
        try {
            const axios = require('axios');
            const proxyUrl = this.formatProxyUrl(proxy);
            
            const startTime = Date.now();
            
            const response = await axios.get(this.testUrls[0], {
                proxy: false,
                httpsAgent: require('https-proxy-agent')(proxyUrl),
                timeout: this.config.testTimeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const responseTime = Date.now() - startTime;
            
            // Verificar se a resposta é válida
            if (response.status === 200 && response.data) {
                stats.successes++;
                stats.responseTime = responseTime;
                stats.isWorking = true;
                stats.lastTested = new Date();
                
                // Remover da blacklist se estava lá
                this.blacklist.delete(proxyKey);
                
                return true;
            }
            
        } catch (error) {
            stats.failures++;
            stats.isWorking = false;
            stats.lastTested = new Date();
            
            // Adicionar à blacklist se muitas falhas
            if (stats.failures >= this.config.maxFailures) {
                this.blacklist.add(proxyKey);
            }
        }
        
        return false;
    }

    /**
     * Verifica se deve testar o proxy
     * @param {Object} proxy 
     * @returns {boolean}
     */
    async shouldTestProxy(proxy) {
        const proxyKey = this.getProxyKey(proxy);
        const stats = this.proxyStats.get(proxyKey);
        
        // Testar se nunca foi testado
        if (stats.lastTested === null) {
            return true;
        }
        
        // Testar se falhou recentemente
        if (stats.isWorking === false) {
            return true;
        }
        
        // Testar se faz tempo que não testa
        const timeSinceTest = Date.now() - stats.lastTested.getTime();
        if (timeSinceTest > this.config.rotationInterval) {
            return true;
        }
        
        return false;
    }

    /**
     * Verifica se deve rotacionar proxy
     * @returns {boolean}
     */
    shouldRotate() {
        if (!this.lastRotation) {
            return true;
        }
        
        const timeSinceRotation = Date.now() - this.lastRotation.getTime();
        return timeSinceRotation > this.config.rotationInterval;
    }

    /**
     * Rotaciona para o próximo proxy
     */
    async rotateProxy() {
        this.moveToNext();
        this.lastRotation = new Date();
    }

    /**
     * Move para o próximo proxy na lista
     */
    moveToNext() {
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    }

    /**
     * Formata URL do proxy
     * @param {Object} proxy 
     * @returns {string}
     */
    formatProxyUrl(proxy) {
        const { host, port, username, password, type = 'http' } = proxy;
        
        if (username && password) {
            return `${type}://${username}:${password}@${host}:${port}`;
        }
        
        return `${type}://${host}:${port}`;
    }

    /**
     * Gera chave única para o proxy
     * @param {Object} proxy 
     * @returns {string}
     */
    getProxyKey(proxy) {
        return `${proxy.host}:${proxy.port}`;
    }

    /**
     * Valida formato do proxy
     * @param {Object} proxy 
     * @returns {boolean}
     */
    isValidProxy(proxy) {
        return proxy && 
               typeof proxy.host === 'string' && 
               proxy.host.length > 0 &&
               typeof proxy.port === 'number' && 
               proxy.port > 0 && 
               proxy.port <= 65535;
    }

    /**
     * Marca proxy como com falha
     * @param {Object} proxy 
     */
    markProxyAsFailed(proxy) {
        const proxyKey = this.getProxyKey(proxy);
        const stats = this.proxyStats.get(proxyKey);
        
        if (stats) {
            stats.failures++;
            stats.isWorking = false;
            
            if (stats.failures >= this.config.maxFailures) {
                this.blacklist.add(proxyKey);
            }
        }
    }

    /**
     * Marca proxy como bem-sucedido
     * @param {Object} proxy 
     */
    markProxyAsSuccess(proxy) {
        const proxyKey = this.getProxyKey(proxy);
        const stats = this.proxyStats.get(proxyKey);
        
        if (stats) {
            stats.successes++;
            stats.isWorking = true;
            this.blacklist.delete(proxyKey);
        }
    }

    /**
     * Obtém estatísticas dos proxies
     * @returns {Object}
     */
    getStats() {
        const totalProxies = this.proxies.length;
        const blacklistedCount = this.blacklist.size;
        const workingCount = Array.from(this.proxyStats.values())
            .filter(stats => stats.isWorking === true).length;
        
        const avgResponseTime = Array.from(this.proxyStats.values())
            .filter(stats => stats.responseTime !== null)
            .reduce((sum, stats, _, arr) => {
                return sum + stats.responseTime / arr.length;
            }, 0);
        
        return {
            totalProxies,
            workingProxies: workingCount,
            blacklistedProxies: blacklistedCount,
            availableProxies: totalProxies - blacklistedCount,
            averageResponseTime: Math.round(avgResponseTime) || 0,
            currentProxy: this.proxies[this.currentIndex] ? 
                this.getProxyKey(this.proxies[this.currentIndex]) : null,
            enabled: this.config.enabled
        };
    }

    /**
     * Limpa blacklist de proxies
     */
    clearBlacklist() {
        this.blacklist.clear();
        
        // Resetar contadores de falha
        for (const stats of this.proxyStats.values()) {
            stats.failures = 0;
            stats.isWorking = null;
        }
    }

    /**
     * Remove proxies da blacklist
     * @param {Array<string>} proxyKeys 
     */
    removeFromBlacklist(proxyKeys) {
        for (const key of proxyKeys) {
            this.blacklist.delete(key);
            
            // Resetar estatísticas
            const stats = this.proxyStats.get(key);
            if (stats) {
                stats.failures = 0;
                stats.isWorking = null;
            }
        }
    }

    /**
     * Testa todos os proxies
     * @returns {Promise<Object>}
     */
    async testAllProxies() {
        const results = {
            working: [],
            failed: [],
            total: this.proxies.length
        };
        
        for (const proxy of this.proxies) {
            const isWorking = await this.testProxy(proxy);
            
            if (isWorking) {
                results.working.push(proxy);
            } else {
                results.failed.push(proxy);
            }
        }
        
        return results;
    }

    /**
     * Habilita/desabilita uso de proxies
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }

    /**
     * Verifica se proxies estão habilitados
     * @returns {boolean}
     */
    isEnabled() {
        return this.config.enabled && this.proxies.length > 0;
    }

    /**
     * Remove todos os proxies
     */
    clearProxies() {
        this.proxies = [];
        this.proxyStats.clear();
        this.blacklist.clear();
        this.currentIndex = 0;
        this.lastRotation = null;
    }

    /**
     * Obtém lista de proxies funcionais
     * @returns {Array<Object>}
     */
    getWorkingProxies() {
        return this.proxies.filter(proxy => {
            const proxyKey = this.getProxyKey(proxy);
            const stats = this.proxyStats.get(proxyKey);
            return stats && stats.isWorking === true && !this.blacklist.has(proxyKey);
        });
    }
}

module.exports = ProxyManager;

