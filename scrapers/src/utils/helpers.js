/**
 * Funções utilitárias para o sistema de scraping
 */

/**
 * Aguarda um tempo específico em milissegundos
 * @param {number} ms - Tempo em milissegundos
 * @returns {Promise}
 */
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Gera um delay aleatório entre min e max
 * @param {number} min - Tempo mínimo em ms
 * @param {number} max - Tempo máximo em ms
 * @returns {Promise}
 */
const randomDelay = (min = 1000, max = 3000) => {
    const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return delay(delayTime);
};

/**
 * Sanitiza texto removendo caracteres especiais
 * @param {string} text - Texto a ser sanitizado
 * @returns {string}
 */
const sanitizeText = (text) => {
    if (!text) return '';
    
    return text
        .replace(/[\r\n\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Extrai números de uma string
 * @param {string} text - Texto contendo números
 * @returns {number}
 */
const extractNumber = (text) => {
    if (!text) return 0;
    
    const match = text.toString().match(/[\d,\.]+/);
    if (!match) return 0;
    
    let number = match[0].replace(/,/g, '');
    
    // Converter notações como 1.2K, 3.5M
    if (text.includes('K') || text.includes('k')) {
        number = parseFloat(number) * 1000;
    } else if (text.includes('M') || text.includes('m')) {
        number = parseFloat(number) * 1000000;
    } else if (text.includes('B') || text.includes('b')) {
        number = parseFloat(number) * 1000000000;
    }
    
    return parseInt(number) || 0;
};

/**
 * Formata URL removendo parâmetros desnecessários
 * @param {string} url - URL a ser formatada
 * @returns {string}
 */
const cleanUrl = (url) => {
    if (!url) return '';
    
    try {
        const urlObj = new URL(url);
        
        // Remover parâmetros de tracking comuns
        const paramsToRemove = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'fbclid', 'gclid', 'ref', 'source', 'tracking'
        ];
        
        paramsToRemove.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        
        return urlObj.toString();
        
    } catch (error) {
        return url;
    }
};

/**
 * Extrai hashtags de um texto
 * @param {string} text - Texto contendo hashtags
 * @returns {Array<string>}
 */
const extractHashtags = (text) => {
    if (!text) return [];
    
    const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
    const matches = text.match(hashtagRegex);
    
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
};

/**
 * Extrai menções de um texto
 * @param {string} text - Texto contendo menções
 * @returns {Array<string>}
 */
const extractMentions = (text) => {
    if (!text) return [];
    
    const mentionRegex = /@[\w\u00C0-\u017F]+/g;
    const matches = text.match(mentionRegex);
    
    return matches ? matches.map(mention => mention.toLowerCase()) : [];
};

/**
 * Valida se uma URL é válida
 * @param {string} url - URL a ser validada
 * @returns {boolean}
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Converte timestamp para formato ISO
 * @param {string|number} timestamp - Timestamp a ser convertido
 * @returns {string}
 */
const formatTimestamp = (timestamp) => {
    try {
        if (!timestamp) return new Date().toISOString();
        
        const date = new Date(timestamp);
        return date.toISOString();
        
    } catch (error) {
        return new Date().toISOString();
    }
};

/**
 * Calcula hash simples de uma string
 * @param {string} str - String para calcular hash
 * @returns {string}
 */
const simpleHash = (str) => {
    if (!str) return '';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
};

/**
 * Trunca texto mantendo palavras completas
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento máximo
 * @returns {string}
 */
const truncateText = (text, maxLength = 280) => {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

/**
 * Detecta idioma do texto (simples)
 * @param {string} text - Texto para detectar idioma
 * @returns {string}
 */
const detectLanguage = (text) => {
    if (!text) return 'unknown';
    
    // Padrões simples para detecção de idioma
    const patterns = {
        'pt': /\b(que|com|para|uma|por|mais|seu|sua|tem|são|foi|ser|ter|como|muito|quando|onde|porque)\b/gi,
        'en': /\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)\b/gi,
        'es': /\b(que|con|para|una|por|más|sus|son|fue|ser|muy|cuando|donde|porque|como|todo|pero|este|esta|desde|hasta)\b/gi
    };
    
    let maxMatches = 0;
    let detectedLang = 'unknown';
    
    for (const [lang, pattern] of Object.entries(patterns)) {
        const matches = (text.match(pattern) || []).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedLang = lang;
        }
    }
    
    return detectedLang;
};

/**
 * Normaliza dados de engajamento
 * @param {Object} metrics - Métricas brutas
 * @returns {Object}
 */
const normalizeEngagementMetrics = (metrics) => {
    const normalized = {
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
        saves: 0,
        ...metrics
    };
    
    // Converter strings para números
    Object.keys(normalized).forEach(key => {
        if (typeof normalized[key] === 'string') {
            normalized[key] = extractNumber(normalized[key]);
        }
    });
    
    // Calcular taxa de engajamento
    const totalEngagement = normalized.likes + normalized.shares + normalized.comments + normalized.saves;
    normalized.engagementRate = normalized.views > 0 ? 
        (totalEngagement / normalized.views * 100).toFixed(2) : 0;
    
    return normalized;
};

/**
 * Gera ID único baseado em conteúdo
 * @param {Object} content - Dados do conteúdo
 * @returns {string}
 */
const generateContentId = (content) => {
    const identifier = `${content.platform}_${content.author}_${content.timestamp}_${content.url}`;
    return simpleHash(identifier);
};

/**
 * Valida dados de conteúdo
 * @param {Object} content - Dados do conteúdo
 * @returns {Object}
 */
const validateContent = (content) => {
    const errors = [];
    const warnings = [];
    
    // Validações obrigatórias
    if (!content.url) errors.push('URL é obrigatória');
    if (!content.platform) errors.push('Plataforma é obrigatória');
    if (!content.contentType) errors.push('Tipo de conteúdo é obrigatório');
    
    // Validações de qualidade
    if (!content.title && !content.description) {
        warnings.push('Conteúdo sem título ou descrição');
    }
    
    if (!content.author) {
        warnings.push('Autor não identificado');
    }
    
    if (!content.metrics || Object.keys(content.metrics).length === 0) {
        warnings.push('Métricas de engajamento não encontradas');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Retry com backoff exponencial
 * @param {Function} fn - Função a ser executada
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} baseDelay - Delay base em ms
 * @returns {Promise}
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const delayTime = baseDelay * Math.pow(2, attempt - 1);
                await delay(delayTime);
            }
        }
    }
    
    throw lastError;
};

module.exports = {
    delay,
    randomDelay,
    sanitizeText,
    extractNumber,
    cleanUrl,
    extractHashtags,
    extractMentions,
    isValidUrl,
    formatTimestamp,
    simpleHash,
    truncateText,
    detectLanguage,
    normalizeEngagementMetrics,
    generateContentId,
    validateContent,
    retryWithBackoff
};

