/**
 * Gerenciador de rotação de User Agents
 * Fornece user agents realistas para evitar detecção
 */
class UserAgentRotator {
    constructor() {
        this.userAgents = [
            // Chrome Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            
            // Chrome macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            
            // Chrome Linux
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            
            // Firefox Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            
            // Firefox macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
            
            // Safari macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            
            // Edge Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
            
            // Mobile Chrome Android
            'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
            
            // Mobile Safari iOS
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            
            // Opera
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
        ];
        
        this.currentIndex = 0;
        this.lastUsed = new Map();
        this.usageCount = new Map();
        
        // Inicializar contadores
        this.userAgents.forEach(ua => {
            this.usageCount.set(ua, 0);
        });
    }

    /**
     * Obtém um user agent aleatório
     * @returns {string}
     */
    getRandomUserAgent() {
        const randomIndex = Math.floor(Math.random() * this.userAgents.length);
        const userAgent = this.userAgents[randomIndex];
        
        this.updateUsageStats(userAgent);
        return userAgent;
    }

    /**
     * Obtém o próximo user agent na rotação
     * @returns {string}
     */
    getNextUserAgent() {
        const userAgent = this.userAgents[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
        
        this.updateUsageStats(userAgent);
        return userAgent;
    }

    /**
     * Obtém user agent menos utilizado
     * @returns {string}
     */
    getLeastUsedUserAgent() {
        let leastUsed = this.userAgents[0];
        let minCount = this.usageCount.get(leastUsed);
        
        for (const ua of this.userAgents) {
            const count = this.usageCount.get(ua);
            if (count < minCount) {
                minCount = count;
                leastUsed = ua;
            }
        }
        
        this.updateUsageStats(leastUsed);
        return leastUsed;
    }

    /**
     * Obtém user agent por plataforma específica
     * @param {string} platform - desktop, mobile, tablet
     * @returns {string}
     */
    getUserAgentByPlatform(platform = 'desktop') {
        let filteredAgents;
        
        switch (platform.toLowerCase()) {
            case 'mobile':
                filteredAgents = this.userAgents.filter(ua => 
                    ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')
                );
                break;
                
            case 'tablet':
                filteredAgents = this.userAgents.filter(ua => 
                    ua.includes('iPad') || (ua.includes('Android') && !ua.includes('Mobile'))
                );
                break;
                
            case 'desktop':
            default:
                filteredAgents = this.userAgents.filter(ua => 
                    !ua.includes('Mobile') && !ua.includes('iPad')
                );
                break;
        }
        
        if (filteredAgents.length === 0) {
            filteredAgents = this.userAgents;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredAgents.length);
        const userAgent = filteredAgents[randomIndex];
        
        this.updateUsageStats(userAgent);
        return userAgent;
    }

    /**
     * Obtém user agent por navegador específico
     * @param {string} browser - chrome, firefox, safari, edge, opera
     * @returns {string}
     */
    getUserAgentByBrowser(browser = 'chrome') {
        let filteredAgents;
        
        switch (browser.toLowerCase()) {
            case 'firefox':
                filteredAgents = this.userAgents.filter(ua => ua.includes('Firefox'));
                break;
                
            case 'safari':
                filteredAgents = this.userAgents.filter(ua => 
                    ua.includes('Safari') && !ua.includes('Chrome')
                );
                break;
                
            case 'edge':
                filteredAgents = this.userAgents.filter(ua => ua.includes('Edg/'));
                break;
                
            case 'opera':
                filteredAgents = this.userAgents.filter(ua => ua.includes('OPR/'));
                break;
                
            case 'chrome':
            default:
                filteredAgents = this.userAgents.filter(ua => 
                    ua.includes('Chrome') && !ua.includes('Edg/') && !ua.includes('OPR/')
                );
                break;
        }
        
        if (filteredAgents.length === 0) {
            filteredAgents = this.userAgents;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredAgents.length);
        const userAgent = filteredAgents[randomIndex];
        
        this.updateUsageStats(userAgent);
        return userAgent;
    }

    /**
     * Atualiza estatísticas de uso
     * @param {string} userAgent 
     */
    updateUsageStats(userAgent) {
        this.lastUsed.set(userAgent, new Date());
        this.usageCount.set(userAgent, (this.usageCount.get(userAgent) || 0) + 1);
    }

    /**
     * Obtém estatísticas de uso
     * @returns {Object}
     */
    getUsageStats() {
        const stats = {
            totalUserAgents: this.userAgents.length,
            usageDistribution: {},
            mostUsed: null,
            leastUsed: null,
            totalUsage: 0
        };
        
        let maxCount = 0;
        let minCount = Infinity;
        
        for (const [ua, count] of this.usageCount.entries()) {
            stats.totalUsage += count;
            
            if (count > maxCount) {
                maxCount = count;
                stats.mostUsed = { userAgent: ua, count };
            }
            
            if (count < minCount) {
                minCount = count;
                stats.leastUsed = { userAgent: ua, count };
            }
            
            // Simplificar UA para estatísticas
            const simplified = this.simplifyUserAgent(ua);
            stats.usageDistribution[simplified] = (stats.usageDistribution[simplified] || 0) + count;
        }
        
        return stats;
    }

    /**
     * Simplifica user agent para estatísticas
     * @param {string} userAgent 
     * @returns {string}
     */
    simplifyUserAgent(userAgent) {
        if (userAgent.includes('Chrome') && userAgent.includes('Mobile')) return 'Chrome Mobile';
        if (userAgent.includes('Chrome') && userAgent.includes('Edg/')) return 'Edge';
        if (userAgent.includes('Chrome') && userAgent.includes('OPR/')) return 'Opera';
        if (userAgent.includes('Chrome')) return 'Chrome Desktop';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && userAgent.includes('iPhone')) return 'Safari Mobile';
        if (userAgent.includes('Safari') && userAgent.includes('iPad')) return 'Safari Tablet';
        if (userAgent.includes('Safari')) return 'Safari Desktop';
        
        return 'Other';
    }

    /**
     * Reseta estatísticas de uso
     */
    resetStats() {
        this.lastUsed.clear();
        this.usageCount.clear();
        this.currentIndex = 0;
        
        this.userAgents.forEach(ua => {
            this.usageCount.set(ua, 0);
        });
    }

    /**
     * Adiciona novos user agents
     * @param {Array<string>} newUserAgents 
     */
    addUserAgents(newUserAgents) {
        for (const ua of newUserAgents) {
            if (!this.userAgents.includes(ua)) {
                this.userAgents.push(ua);
                this.usageCount.set(ua, 0);
            }
        }
    }

    /**
     * Remove user agents específicos
     * @param {Array<string>} userAgentsToRemove 
     */
    removeUserAgents(userAgentsToRemove) {
        for (const ua of userAgentsToRemove) {
            const index = this.userAgents.indexOf(ua);
            if (index > -1) {
                this.userAgents.splice(index, 1);
                this.usageCount.delete(ua);
                this.lastUsed.delete(ua);
            }
        }
        
        // Ajustar índice atual se necessário
        if (this.currentIndex >= this.userAgents.length) {
            this.currentIndex = 0;
        }
    }

    /**
     * Valida se um user agent é válido
     * @param {string} userAgent 
     * @returns {boolean}
     */
    isValidUserAgent(userAgent) {
        if (!userAgent || typeof userAgent !== 'string') return false;
        
        // Verificações básicas
        const hasValidStructure = userAgent.includes('Mozilla') && 
                                 (userAgent.includes('Chrome') || 
                                  userAgent.includes('Firefox') || 
                                  userAgent.includes('Safari'));
        
        const hasValidLength = userAgent.length > 50 && userAgent.length < 300;
        
        return hasValidStructure && hasValidLength;
    }
}

module.exports = UserAgentRotator;

