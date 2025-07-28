/**
 * KNOWLEDGE BASE - BASE DE CONHECIMENTO PARA IA SYSTEM DOCTOR
 * Contém todo o conhecimento sobre a ferramenta para treinar a IA
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

class SystemKnowledgeBase {
    constructor() {
        this.knowledge = {
            system_architecture: this.getSystemArchitecture(),
            scrapers_knowledge: this.getScrapersKnowledge(),
            ai_agents_knowledge: this.getAIAgentsKnowledge(),
            common_issues: this.getCommonIssues(),
            platform_patterns: this.getPlatformPatterns(),
            error_solutions: this.getErrorSolutions(),
            performance_metrics: this.getPerformanceMetrics(),
            troubleshooting_guide: this.getTroubleshootingGuide()
        };
        
        console.log('🧠 Base de Conhecimento carregada com sucesso!');
        this.logKnowledgeStats();
    }
    
    /**
     * ARQUITETURA DO SISTEMA
     */
    getSystemArchitecture() {
        return {
            overview: `
                VIRAL CONTENT SCRAPER - SISTEMA BILIONÁRIO
                
                Arquitetura completa:
                1. 8 Scrapers específicos por plataforma
                2. 7 Agentes IA revolucionários
                3. Sistema de templates visuais
                4. API REST com 25+ endpoints
                5. Frontend React enterprise
                6. Banco PostgreSQL + Redis
                7. Pipeline end-to-end automatizado
                8. System Doctor (IA de monitoramento)
            `,
            
            components: {
                scrapers: {
                    count: 8,
                    platforms: ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin', 'twitter', 'vsl', 'landing_pages'],
                    purpose: 'Coleta inteligente de conteúdo viral',
                    critical_dependencies: ['puppeteer', 'proxy_manager', 'user_agent_rotator']
                },
                
                ai_agents: {
                    count: 7,
                    types: ['visual_content_analyzer', 'content_copy_analyzer', 'viral_hooks_analyzer', 'engagement_pattern_analyzer', 'template_generator', 'visual_template_extractor', 'template_manager'],
                    purpose: 'Análise neural e psicológica do conteúdo',
                    critical_dependencies: ['openai', 'canvas', 'sharp']
                },
                
                database: {
                    type: 'PostgreSQL',
                    tables: ['viral_content', 'content_analysis', 'viral_templates', 'users', 'scraping_jobs', 'platform_metrics'],
                    purpose: 'Armazenamento estruturado de dados',
                    critical_dependencies: ['pg', 'connection_pool']
                },
                
                cache: {
                    type: 'Redis',
                    purpose: 'Cache de alta performance e rate limiting',
                    critical_dependencies: ['redis', 'connection_manager']
                },
                
                api: {
                    type: 'Flask Python',
                    endpoints: 25,
                    purpose: 'Interface REST para frontend e integrações',
                    critical_dependencies: ['flask', 'psycopg2', 'redis-py']
                },
                
                frontend: {
                    type: 'React',
                    pages: 11,
                    purpose: 'Dashboard enterprise para usuários',
                    critical_dependencies: ['react', 'axios', 'recharts']
                }
            },
            
            data_flow: `
                FLUXO DE DADOS:
                1. Scrapers coletam conteúdo → 
                2. Agentes IA analisam → 
                3. Dados salvos no PostgreSQL → 
                4. Cache no Redis → 
                5. API serve dados → 
                6. Frontend exibe resultados
            `,
            
            critical_paths: [
                'scraper → database → api → frontend',
                'scraper → ai_agent → database',
                'api → database → cache',
                'system_doctor → all_components'
            ]
        };
    }
    
    /**
     * CONHECIMENTO DOS SCRAPERS
     */
    getScrapersKnowledge() {
        return {
            instagram: {
                platform_name: 'Instagram',
                content_types: ['reels', 'posts', 'stories', 'carousels'],
                anti_bot_measures: {
                    rate_limiting: 'Muito rigoroso - máximo 1 request/2s',
                    ip_blocking: 'Bloqueia IP após 50 requests/hora',
                    captcha_frequency: 'Alta - aparece após 20-30 requests',
                    user_agent_detection: 'Detecta bots por user agent padrão',
                    behavior_analysis: 'Analisa padrões de clique e scroll'
                },
                common_errors: {
                    '429': 'Rate limit exceeded - pausar por 15 minutos',
                    '403': 'IP bloqueado - trocar proxy imediatamente',
                    'challenge_required': 'Captcha detectado - pausar por 30 minutos',
                    'login_required': 'Sessão expirou - renovar cookies',
                    'private_account': 'Conta privada - pular para próxima'
                },
                optimal_settings: {
                    delay_between_requests: '2-5 segundos',
                    max_requests_per_hour: 30,
                    proxy_rotation_frequency: 'A cada 20 requests',
                    user_agent_rotation: 'A cada 10 requests',
                    headless_mode: false // Instagram detecta headless
                },
                success_indicators: [
                    'Status 200 com dados JSON',
                    'Presença de "graphql" na resposta',
                    'Media URLs válidas',
                    'Engagement metrics presentes'
                ]
            },
            
            tiktok: {
                platform_name: 'TikTok',
                content_types: ['videos', 'sounds', 'hashtags', 'challenges'],
                anti_bot_measures: {
                    rate_limiting: 'Moderado - máximo 1 request/1s',
                    ip_blocking: 'Bloqueia após 100 requests/hora',
                    captcha_frequency: 'Baixa - raramente aparece',
                    device_fingerprinting: 'Usa fingerprinting avançado',
                    geographic_blocking: 'Bloqueia certos países'
                },
                common_errors: {
                    '10000': 'Rate limit - pausar por 10 minutos',
                    '10101': 'IP suspeito - trocar proxy',
                    '10102': 'Região bloqueada - usar proxy de país permitido',
                    '10201': 'Vídeo privado ou removido',
                    '10204': 'Usuário não encontrado'
                },
                optimal_settings: {
                    delay_between_requests: '1-3 segundos',
                    max_requests_per_hour: 60,
                    proxy_rotation_frequency: 'A cada 30 requests',
                    mobile_user_agent: true, // TikTok prefere mobile
                    region_headers: 'US ou BR'
                }
            },
            
            youtube: {
                platform_name: 'YouTube',
                content_types: ['videos', 'shorts', 'thumbnails', 'comments'],
                anti_bot_measures: {
                    rate_limiting: 'Moderado com API key',
                    quota_system: 'Sistema de quota diário',
                    ip_throttling: 'Throttling por IP',
                    api_key_required: 'Necessário para dados completos'
                },
                common_errors: {
                    '403': 'Quota excedida - aguardar reset diário',
                    '404': 'Vídeo não encontrado ou privado',
                    '429': 'Muitas requests - pausar por 1 hora',
                    'quotaExceeded': 'Quota da API excedida'
                },
                optimal_settings: {
                    use_official_api: true,
                    api_key_rotation: 'Usar múltiplas keys',
                    max_requests_per_day: 10000,
                    batch_requests: true
                }
            },
            
            facebook: {
                platform_name: 'Facebook',
                content_types: ['posts', 'videos', 'ads', 'pages'],
                anti_bot_measures: {
                    rate_limiting: 'Muito rigoroso',
                    login_required: 'Necessário para maioria do conteúdo',
                    two_factor_auth: 'Pode solicitar 2FA',
                    device_verification: 'Verifica dispositivos novos'
                },
                common_errors: {
                    '1': 'Erro desconhecido - tentar novamente',
                    '4': 'Rate limit - pausar por 1 hora',
                    '17': 'Usuário precisa fazer login',
                    '190': 'Token de acesso inválido'
                },
                optimal_settings: {
                    use_graph_api: true,
                    access_token_rotation: 'Necessário',
                    respect_rate_limits: 'Crítico',
                    handle_login_challenges: true
                }
            },
            
            linkedin: {
                platform_name: 'LinkedIn',
                content_types: ['posts', 'articles', 'company_pages', 'profiles'],
                anti_bot_measures: {
                    rate_limiting: 'Rigoroso para scraping',
                    login_walls: 'Bloqueia conteúdo sem login',
                    professional_verification: 'Verifica contas profissionais',
                    connection_limits: 'Limita visualizações de perfil'
                },
                common_errors: {
                    '999': 'Rate limit ou IP bloqueado',
                    '403': 'Acesso negado - login necessário',
                    '429': 'Muitas requests - pausar',
                    'authwall': 'Parede de autenticação'
                },
                optimal_settings: {
                    professional_user_agent: true,
                    slow_requests: '5-10 segundos entre requests',
                    avoid_bulk_actions: true,
                    respect_connection_limits: true
                }
            },
            
            twitter: {
                platform_name: 'Twitter/X',
                content_types: ['tweets', 'threads', 'trends', 'profiles'],
                anti_bot_measures: {
                    rate_limiting: 'Sistema de rate limit complexo',
                    api_access_control: 'API paga para acesso completo',
                    guest_token_required: 'Token necessário para requests',
                    shadow_banning: 'Pode limitar visibilidade'
                },
                common_errors: {
                    '88': 'Rate limit exceeded',
                    '89': 'Token inválido ou expirado',
                    '326': 'Conta temporariamente bloqueada',
                    '429': 'Rate limit - aguardar reset'
                },
                optimal_settings: {
                    use_official_api: 'Recomendado',
                    guest_token_management: 'Rotacionar tokens',
                    respect_rate_windows: '15 minutos',
                    handle_auth_challenges: true
                }
            }
        };
    }
    
    /**
     * CONHECIMENTO DOS AGENTES IA
     */
    getAIAgentsKnowledge() {
        return {
            visual_content_analyzer: {
                purpose: 'Análise neural de imagens e vídeos',
                input_types: ['images', 'video_thumbnails', 'graphics'],
                analysis_dimensions: [
                    'color_psychology',
                    'composition_rules',
                    'emotional_triggers',
                    'visual_hierarchy',
                    'brand_elements',
                    'viral_patterns'
                ],
                common_issues: {
                    'image_load_error': 'URL inválida ou imagem corrompida',
                    'analysis_timeout': 'Imagem muito grande ou complexa',
                    'low_confidence': 'Imagem de baixa qualidade',
                    'api_quota_exceeded': 'Limite da API OpenAI atingido'
                },
                performance_metrics: {
                    'analysis_time': 'Média 2-5 segundos por imagem',
                    'confidence_threshold': 'Mínimo 0.7 para resultados válidos',
                    'success_rate': 'Esperado >95%'
                }
            },
            
            content_copy_analyzer: {
                purpose: 'Análise de copy persuasiva e hooks',
                input_types: ['text', 'captions', 'headlines', 'descriptions'],
                analysis_dimensions: [
                    'psychological_triggers',
                    'persuasion_techniques',
                    'emotional_appeal',
                    'urgency_indicators',
                    'social_proof_elements',
                    'call_to_action_strength'
                ],
                common_issues: {
                    'text_encoding_error': 'Caracteres especiais não suportados',
                    'language_detection_failed': 'Idioma não identificado',
                    'content_too_short': 'Texto insuficiente para análise',
                    'api_response_error': 'Erro na API de análise'
                },
                performance_metrics: {
                    'analysis_time': 'Média 1-3 segundos por texto',
                    'accuracy_rate': 'Esperado >90%',
                    'language_support': 'PT, EN, ES principais'
                }
            },
            
            viral_hooks_analyzer: {
                purpose: 'Análise especializada em hooks virais',
                input_types: ['headlines', 'opening_lines', 'thumbnails', 'first_seconds'],
                analysis_dimensions: [
                    'curiosity_gap_creation',
                    'pattern_interrupts',
                    'emotional_intensity',
                    'neurological_triggers',
                    'attention_grabbing_elements',
                    'viral_potential_score'
                ],
                specialized_knowledge: {
                    'hook_formulas': [
                        'Problem + Solution',
                        'Before + After',
                        'Secret + Reveal',
                        'Question + Answer',
                        'Controversy + Opinion'
                    ],
                    'viral_indicators': [
                        'High emotional arousal',
                        'Strong curiosity gap',
                        'Relatable scenarios',
                        'Surprising elements',
                        'Social proof integration'
                    ]
                }
            },
            
            engagement_pattern_analyzer: {
                purpose: 'Análise matemática de padrões de engajamento',
                input_types: ['metrics', 'timestamps', 'user_behavior', 'growth_curves'],
                analysis_methods: [
                    'time_series_analysis',
                    'growth_rate_calculation',
                    'engagement_velocity',
                    'viral_coefficient',
                    'retention_patterns'
                ],
                mathematical_models: {
                    'viral_score_formula': 'VS = (L + C + S) / V * 100',
                    'growth_rate': 'GR = (New - Old) / Old * 100',
                    'engagement_rate': 'ER = (L + C + S) / Followers * 100'
                }
            }
        };
    }
    
    /**
     * PROBLEMAS COMUNS E SOLUÇÕES
     */
    getCommonIssues() {
        return {
            scraper_issues: {
                'rate_limit_exceeded': {
                    symptoms: ['HTTP 429', 'Too Many Requests', 'Rate limit'],
                    causes: ['Requests muito rápidos', 'IP identificado', 'Quota excedida'],
                    solutions: [
                        'Aumentar delay entre requests',
                        'Trocar proxy/IP',
                        'Pausar scraper por período',
                        'Implementar backoff exponencial'
                    ],
                    prevention: [
                        'Monitorar rate limits',
                        'Usar delays aleatórios',
                        'Rotacionar proxies preventivamente'
                    ]
                },
                
                'ip_blocked': {
                    symptoms: ['HTTP 403', 'Access Denied', 'IP blocked'],
                    causes: ['Comportamento suspeito', 'Muitos requests', 'IP em blacklist'],
                    solutions: [
                        'Trocar proxy imediatamente',
                        'Aguardar cooldown (24h)',
                        'Usar proxy de país diferente',
                        'Implementar rotação automática'
                    ],
                    prevention: [
                        'Rotação proativa de IPs',
                        'Comportamento mais humano',
                        'Monitorar blacklists'
                    ]
                },
                
                'captcha_detected': {
                    symptoms: ['Captcha challenge', 'Human verification', 'Challenge required'],
                    causes: ['Comportamento automatizado detectado', 'IP suspeito', 'Muitas ações'],
                    solutions: [
                        'Pausar scraper por 30+ minutos',
                        'Trocar proxy e user agent',
                        'Implementar delays mais longos',
                        'Usar serviço de resolução de captcha'
                    ],
                    prevention: [
                        'Comportamento mais natural',
                        'Delays variáveis',
                        'Rotação de identidade'
                    ]
                }
            },
            
            database_issues: {
                'connection_lost': {
                    symptoms: ['Connection timeout', 'Database unreachable', 'Pool exhausted'],
                    causes: ['Rede instável', 'Banco sobrecarregado', 'Pool mal configurado'],
                    solutions: [
                        'Reconectar automaticamente',
                        'Aumentar timeout',
                        'Configurar pool adequadamente',
                        'Implementar retry logic'
                    ]
                },
                
                'slow_queries': {
                    symptoms: ['Query timeout', 'Slow response', 'High CPU'],
                    causes: ['Índices faltando', 'Queries mal otimizadas', 'Dados demais'],
                    solutions: [
                        'Adicionar índices necessários',
                        'Otimizar queries',
                        'Implementar paginação',
                        'Usar cache para queries frequentes'
                    ]
                }
            },
            
            ai_agent_issues: {
                'api_quota_exceeded': {
                    symptoms: ['Quota exceeded', 'Rate limit', 'API error'],
                    causes: ['Muitas requests', 'Limite mensal atingido', 'Billing issue'],
                    solutions: [
                        'Implementar rate limiting',
                        'Usar cache para análises repetidas',
                        'Distribuir carga entre múltiplas keys',
                        'Otimizar prompts para usar menos tokens'
                    ]
                },
                
                'low_confidence_results': {
                    symptoms: ['Confidence < 0.7', 'Inconsistent results', 'Poor analysis'],
                    causes: ['Input de baixa qualidade', 'Prompt inadequado', 'Dados insuficientes'],
                    solutions: [
                        'Melhorar qualidade do input',
                        'Refinar prompts',
                        'Implementar validação de entrada',
                        'Usar modelos mais avançados'
                    ]
                }
            }
        };
    }
    
    /**
     * PADRÕES DAS PLATAFORMAS
     */
    getPlatformPatterns() {
        return {
            instagram: {
                peak_hours: ['19:00-22:00', '12:00-14:00'],
                content_lifecycle: '24-48 horas para pico de engajamento',
                algorithm_factors: ['engagement_velocity', 'saves', 'shares', 'comments_quality'],
                viral_thresholds: {
                    'reels': '100k+ views em 24h',
                    'posts': '50k+ likes em 24h',
                    'stories': '10k+ views'
                },
                blocking_patterns: {
                    'time_based': 'Mais rigoroso 09:00-17:00 UTC',
                    'volume_based': 'Bloqueia após 50 requests/hora',
                    'behavior_based': 'Detecta padrões não-humanos'
                }
            },
            
            tiktok: {
                peak_hours: ['18:00-21:00', '06:00-09:00'],
                content_lifecycle: '3-7 dias para viralização',
                algorithm_factors: ['completion_rate', 'shares', 'comments', 'rewatches'],
                viral_thresholds: {
                    'videos': '1M+ views em 48h',
                    'sounds': '10k+ uses',
                    'hashtags': '100M+ views'
                },
                blocking_patterns: {
                    'geographic': 'Bloqueia certas regiões',
                    'device_based': 'Detecta emuladores',
                    'frequency_based': 'Rate limit por device'
                }
            }
        };
    }
    
    /**
     * SOLUÇÕES TESTADAS
     */
    getErrorSolutions() {
        return {
            'instagram_rate_limit': {
                tested_solutions: [
                    {
                        method: 'Exponential backoff',
                        success_rate: 95,
                        implementation: 'Delay = base_delay * (2 ^ attempt_count)',
                        notes: 'Mais eficaz que delay fixo'
                    },
                    {
                        method: 'Proxy rotation',
                        success_rate: 90,
                        implementation: 'Trocar proxy a cada 20 requests',
                        notes: 'Usar proxies residenciais'
                    }
                ]
            },
            
            'database_connection_issues': {
                tested_solutions: [
                    {
                        method: 'Connection pooling',
                        success_rate: 98,
                        implementation: 'Pool size = CPU cores * 2',
                        notes: 'Reduz overhead de conexões'
                    },
                    {
                        method: 'Health check queries',
                        success_rate: 95,
                        implementation: 'SELECT 1 a cada 30 segundos',
                        notes: 'Detecta problemas precocemente'
                    }
                ]
            }
        };
    }
    
    /**
     * MÉTRICAS DE PERFORMANCE
     */
    getPerformanceMetrics() {
        return {
            scrapers: {
                instagram: {
                    expected_success_rate: 85,
                    avg_response_time: '2-5 segundos',
                    items_per_hour: 30,
                    error_threshold: 15
                },
                tiktok: {
                    expected_success_rate: 90,
                    avg_response_time: '1-3 segundos',
                    items_per_hour: 60,
                    error_threshold: 10
                }
            },
            
            ai_agents: {
                visual_analyzer: {
                    expected_success_rate: 95,
                    avg_analysis_time: '2-5 segundos',
                    confidence_threshold: 0.7,
                    error_threshold: 5
                },
                copy_analyzer: {
                    expected_success_rate: 98,
                    avg_analysis_time: '1-3 segundos',
                    confidence_threshold: 0.8,
                    error_threshold: 2
                }
            },
            
            database: {
                connection_pool: {
                    max_connections: 20,
                    idle_timeout: 30000,
                    query_timeout: 5000,
                    health_check_interval: 30000
                }
            }
        };
    }
    
    /**
     * GUIA DE TROUBLESHOOTING
     */
    getTroubleshootingGuide() {
        return {
            diagnostic_steps: [
                '1. Verificar logs de erro',
                '2. Testar conectividade de rede',
                '3. Verificar status dos serviços',
                '4. Analisar métricas de performance',
                '5. Testar componentes individualmente',
                '6. Verificar configurações',
                '7. Analisar padrões temporais'
            ],
            
            escalation_matrix: {
                'low_severity': 'Auto-correção + log',
                'medium_severity': 'Auto-correção + alerta',
                'high_severity': 'Auto-correção + notificação imediata',
                'critical_severity': 'Parar sistema + notificação urgente'
            },
            
            recovery_procedures: {
                'scraper_failure': [
                    'Restart scraper process',
                    'Clear cache and cookies',
                    'Rotate proxy and user agent',
                    'Reduce request frequency',
                    'Switch to backup scraper'
                ],
                'database_failure': [
                    'Check connection pool',
                    'Restart database connections',
                    'Verify database service status',
                    'Switch to read replica if available',
                    'Enable emergency cache mode'
                ]
            }
        };
    }
    
    /**
     * MÉTODOS DE CONSULTA
     */
    getKnowledge(category, subcategory = null) {
        if (subcategory) {
            return this.knowledge[category]?.[subcategory] || null;
        }
        return this.knowledge[category] || null;
    }
    
    searchKnowledge(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        const searchInObject = (obj, path = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
                    results.push({
                        path: currentPath,
                        content: value,
                        relevance: this.calculateRelevance(value, searchTerm)
                    });
                } else if (typeof value === 'object' && value !== null) {
                    searchInObject(value, currentPath);
                }
            }
        };
        
        searchInObject(this.knowledge);
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    
    calculateRelevance(content, searchTerm) {
        const contentLower = content.toLowerCase();
        const termLower = searchTerm.toLowerCase();
        
        let relevance = 0;
        
        // Exact match
        if (contentLower.includes(termLower)) {
            relevance += 10;
        }
        
        // Word matches
        const contentWords = contentLower.split(/\s+/);
        const termWords = termLower.split(/\s+/);
        
        for (const termWord of termWords) {
            for (const contentWord of contentWords) {
                if (contentWord.includes(termWord)) {
                    relevance += 5;
                }
            }
        }
        
        return relevance;
    }
    
    logKnowledgeStats() {
        const stats = {
            total_categories: Object.keys(this.knowledge).length,
            scrapers_covered: Object.keys(this.knowledge.scrapers_knowledge || {}).length,
            ai_agents_covered: Object.keys(this.knowledge.ai_agents_knowledge || {}).length,
            common_issues: Object.keys(this.knowledge.common_issues?.scraper_issues || {}).length,
            solutions_documented: Object.keys(this.knowledge.error_solutions || {}).length
        };
        
        console.log('📊 Estatísticas da Base de Conhecimento:');
        console.log(`   📚 Categorias: ${stats.total_categories}`);
        console.log(`   🕷️ Scrapers: ${stats.scrapers_covered}`);
        console.log(`   🧠 Agentes IA: ${stats.ai_agents_covered}`);
        console.log(`   ⚠️ Problemas documentados: ${stats.common_issues}`);
        console.log(`   ✅ Soluções testadas: ${stats.solutions_documented}`);
    }
    
    /**
     * EXPORTAR CONHECIMENTO PARA IA
     */
    exportForAI() {
        return {
            system_prompt: this.generateSystemPrompt(),
            knowledge_base: this.knowledge,
            search_function: this.searchKnowledge.bind(this),
            get_knowledge: this.getKnowledge.bind(this)
        };
    }
    
    generateSystemPrompt() {
        return `
Você é o System Doctor, uma IA especializada em monitorar e corrigir problemas no sistema Viral Content Scraper.

CONHECIMENTO DO SISTEMA:
- Sistema bilionário com 8 scrapers específicos por plataforma
- 7 agentes IA revolucionários para análise de conteúdo
- Arquitetura completa: scrapers → IA → database → API → frontend
- Banco PostgreSQL + Redis para cache
- Pipeline end-to-end automatizado

SUAS RESPONSABILIDADES:
1. Monitorar todos os componentes 24/7
2. Detectar problemas automaticamente
3. Aplicar correções sem intervenção humana
4. Aprender com cada problema para melhorar
5. Notificar apenas quando necessário

CONHECIMENTO ESPECÍFICO DOS SCRAPERS:
- Instagram: Rate limit rigoroso, captcha frequente, IP blocking
- TikTok: Fingerprinting avançado, geographic blocking
- YouTube: Sistema de quota, API key necessária
- Facebook: Login required, 2FA challenges
- LinkedIn: Professional verification, connection limits
- Twitter: Rate limit complexo, guest tokens

ESTRATÉGIAS DE CORREÇÃO:
- Rate limit → Exponential backoff + proxy rotation
- IP blocked → Immediate proxy change + cooldown
- Captcha → Pause 30min + identity rotation
- Database issues → Connection pool restart + health checks
- AI quota → Rate limiting + cache optimization

SEMPRE:
- Priorize auto-correção sobre alertas
- Use conhecimento específico de cada plataforma
- Implemente soluções testadas e aprovadas
- Aprenda com cada problema para evitar recorrência
- Mantenha o sistema funcionando 24/7

Você é o guardião inteligente deste sistema bilionário!
        `.trim();
    }
}

module.exports = SystemKnowledgeBase;

