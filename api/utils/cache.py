"""
CACHE UTILITIES
Sistema de cache Redis para a API

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import redis
import json
import pickle
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import request, current_app
import os
import logging

# Configuração do Redis
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CACHE_PREFIX = 'viral_scraper:'
DEFAULT_TTL = 300  # 5 minutos

# Logger
logger = logging.getLogger(__name__)

class CacheError(Exception):
    """Exceção personalizada para erros de cache"""
    pass

class RedisCache:
    """Classe para gerenciar cache Redis"""
    
    def __init__(self, redis_url=None, prefix=None):
        self.redis_url = redis_url or REDIS_URL
        self.prefix = prefix or CACHE_PREFIX
        self._client = None
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0
        }
    
    @property
    def client(self):
        """Lazy loading do cliente Redis"""
        if self._client is None:
            try:
                self._client = redis.from_url(
                    self.redis_url,
                    decode_responses=False,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
                # Testar conexão
                self._client.ping()
                logger.info("Conexão Redis estabelecida com sucesso")
            except Exception as e:
                logger.error(f"Erro ao conectar com Redis: {e}")
                self._client = None
                raise CacheError(f"Falha na conexão Redis: {e}")
        
        return self._client
    
    def _make_key(self, key):
        """Criar chave com prefixo"""
        return f"{self.prefix}{key}"
    
    def _serialize_value(self, value, serializer='json'):
        """Serializar valor para armazenamento"""
        try:
            if serializer == 'json':
                return json.dumps(value, default=str).encode('utf-8')
            elif serializer == 'pickle':
                return pickle.dumps(value)
            else:
                return str(value).encode('utf-8')
        except Exception as e:
            raise CacheError(f"Erro na serialização: {e}")
    
    def _deserialize_value(self, value, serializer='json'):
        """Deserializar valor do cache"""
        try:
            if value is None:
                return None
            
            if serializer == 'json':
                return json.loads(value.decode('utf-8'))
            elif serializer == 'pickle':
                return pickle.loads(value)
            else:
                return value.decode('utf-8')
        except Exception as e:
            raise CacheError(f"Erro na deserialização: {e}")
    
    def get(self, key, serializer='json'):
        """Obter valor do cache"""
        try:
            cache_key = self._make_key(key)
            value = self.client.get(cache_key)
            
            if value is not None:
                self.stats['hits'] += 1
                return self._deserialize_value(value, serializer)
            else:
                self.stats['misses'] += 1
                return None
                
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao obter cache {key}: {e}")
            return None
    
    def set(self, key, value, ttl=None, serializer='json'):
        """Definir valor no cache"""
        try:
            cache_key = self._make_key(key)
            serialized_value = self._serialize_value(value, serializer)
            
            if ttl:
                result = self.client.setex(cache_key, ttl, serialized_value)
            else:
                result = self.client.set(cache_key, serialized_value)
            
            if result:
                self.stats['sets'] += 1
                return True
            return False
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao definir cache {key}: {e}")
            return False
    
    def delete(self, key):
        """Deletar valor do cache"""
        try:
            cache_key = self._make_key(key)
            result = self.client.delete(cache_key)
            
            if result:
                self.stats['deletes'] += 1
                return True
            return False
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao deletar cache {key}: {e}")
            return False
    
    def exists(self, key):
        """Verificar se chave existe"""
        try:
            cache_key = self._make_key(key)
            return bool(self.client.exists(cache_key))
        except Exception as e:
            logger.error(f"Erro ao verificar existência {key}: {e}")
            return False
    
    def expire(self, key, ttl):
        """Definir expiração para chave"""
        try:
            cache_key = self._make_key(key)
            return bool(self.client.expire(cache_key, ttl))
        except Exception as e:
            logger.error(f"Erro ao definir expiração {key}: {e}")
            return False
    
    def ttl(self, key):
        """Obter TTL da chave"""
        try:
            cache_key = self._make_key(key)
            return self.client.ttl(cache_key)
        except Exception as e:
            logger.error(f"Erro ao obter TTL {key}: {e}")
            return -1
    
    def flush_pattern(self, pattern):
        """Deletar chaves por padrão"""
        try:
            pattern_key = self._make_key(pattern)
            keys = self.client.keys(pattern_key)
            
            if keys:
                deleted = self.client.delete(*keys)
                self.stats['deletes'] += deleted
                return deleted
            return 0
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao deletar padrão {pattern}: {e}")
            return 0
    
    def get_stats(self):
        """Obter estatísticas do cache"""
        try:
            info = self.client.info()
            hit_rate = 0
            if self.stats['hits'] + self.stats['misses'] > 0:
                hit_rate = (self.stats['hits'] / (self.stats['hits'] + self.stats['misses'])) * 100
            
            return {
                'connection_status': 'connected',
                'redis_version': info.get('redis_version', 'unknown'),
                'used_memory': info.get('used_memory_human', 'unknown'),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'hits': self.stats['hits'],
                'misses': self.stats['misses'],
                'sets': self.stats['sets'],
                'deletes': self.stats['deletes'],
                'errors': self.stats['errors'],
                'hit_rate': round(hit_rate, 2)
            }
        except Exception as e:
            return {
                'connection_status': 'error',
                'error': str(e),
                'hits': self.stats['hits'],
                'misses': self.stats['misses'],
                'sets': self.stats['sets'],
                'deletes': self.stats['deletes'],
                'errors': self.stats['errors'],
                'hit_rate': 0
            }
    
    def health_check(self):
        """Verificar saúde do Redis"""
        try:
            self.client.ping()
            return {'status': 'healthy', 'message': 'Redis respondendo'}
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Redis não respondendo: {e}'}

# Instância global do cache
cache = RedisCache()

def make_cache_key(*args, **kwargs):
    """Criar chave de cache baseada em argumentos"""
    # Incluir informações da requisição se disponível
    key_parts = []
    
    # Adicionar argumentos posicionais
    for arg in args:
        if isinstance(arg, (dict, list)):
            key_parts.append(json.dumps(arg, sort_keys=True, default=str))
        else:
            key_parts.append(str(arg))
    
    # Adicionar argumentos nomeados
    for k, v in sorted(kwargs.items()):
        if isinstance(v, (dict, list)):
            key_parts.append(f"{k}:{json.dumps(v, sort_keys=True, default=str)}")
        else:
            key_parts.append(f"{k}:{v}")
    
    # Incluir informações da requisição se disponível
    if request:
        key_parts.append(f"path:{request.path}")
        
        # Incluir query parameters
        if request.args:
            query_string = '&'.join([f"{k}={v}" for k, v in sorted(request.args.items())])
            key_parts.append(f"query:{query_string}")
        
        # Incluir user ID se autenticado
        if hasattr(request, 'current_user') and request.current_user:
            key_parts.append(f"user:{request.current_user['id']}")
    
    # Criar hash da chave combinada
    combined_key = '|'.join(key_parts)
    return hashlib.md5(combined_key.encode()).hexdigest()

def cache_result(ttl=DEFAULT_TTL, key_func=None, serializer='json', condition=None):
    """
    Decorator para cache automático de resultados de função
    
    Args:
        ttl: Tempo de vida do cache em segundos
        key_func: Função para gerar chave personalizada
        serializer: Tipo de serialização ('json', 'pickle', 'string')
        condition: Função para determinar se deve cachear
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar condição de cache
            if condition and not condition(*args, **kwargs):
                return f(*args, **kwargs)
            
            # Gerar chave de cache
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{f.__module__}.{f.__name__}:{make_cache_key(*args, **kwargs)}"
            
            try:
                # Tentar obter do cache
                cached_result = cache.get(cache_key, serializer)
                
                if cached_result is not None:
                    logger.debug(f"Cache hit para {cache_key}")
                    return cached_result
                
                # Executar função e cachear resultado
                logger.debug(f"Cache miss para {cache_key}")
                result = f(*args, **kwargs)
                
                # Cachear apenas se resultado não for None
                if result is not None:
                    cache.set(cache_key, result, ttl, serializer)
                
                return result
                
            except Exception as e:
                logger.error(f"Erro no cache para {cache_key}: {e}")
                # Em caso de erro no cache, executar função normalmente
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def invalidate_cache_pattern(pattern):
    """Invalidar cache por padrão"""
    return cache.flush_pattern(pattern)

def warm_cache(key, value, ttl=DEFAULT_TTL, serializer='json'):
    """Pré-aquecer cache com valor"""
    return cache.set(key, value, ttl, serializer)

def get_cache_info():
    """Obter informações do cache"""
    return cache.get_stats()

def cache_health_check():
    """Verificar saúde do cache"""
    return cache.health_check()

# Decorators específicos para diferentes tipos de cache

def cache_user_data(ttl=1800):  # 30 minutos
    """Cache específico para dados de usuário"""
    return cache_result(
        ttl=ttl,
        key_func=lambda *args, **kwargs: f"user_data:{getattr(request, 'current_user', {}).get('id', 'anonymous')}:{make_cache_key(*args, **kwargs)}"
    )

def cache_api_response(ttl=300):  # 5 minutos
    """Cache específico para respostas de API"""
    return cache_result(
        ttl=ttl,
        key_func=lambda *args, **kwargs: f"api_response:{request.endpoint}:{make_cache_key(*args, **kwargs)}"
    )

def cache_analysis_result(ttl=3600):  # 1 hora
    """Cache específico para resultados de análise"""
    return cache_result(
        ttl=ttl,
        serializer='pickle',  # Usar pickle para objetos complexos
        key_func=lambda *args, **kwargs: f"analysis:{make_cache_key(*args, **kwargs)}"
    )

def cache_scraping_data(ttl=1800):  # 30 minutos
    """Cache específico para dados de scraping"""
    return cache_result(
        ttl=ttl,
        key_func=lambda *args, **kwargs: f"scraping:{make_cache_key(*args, **kwargs)}"
    )

# Context manager para cache temporário
class TemporaryCache:
    """Context manager para cache temporário"""
    
    def __init__(self, key, ttl=60):
        self.key = key
        self.ttl = ttl
        self.cache_key = cache._make_key(f"temp:{key}")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        cache.delete(f"temp:{self.key}")
    
    def set(self, value, serializer='json'):
        return cache.set(f"temp:{self.key}", value, self.ttl, serializer)
    
    def get(self, serializer='json'):
        return cache.get(f"temp:{self.key}", serializer)

# Função para limpar cache relacionado a usuário
def clear_user_cache(user_id):
    """Limpar todo cache relacionado a um usuário"""
    patterns = [
        f"user_data:{user_id}:*",
        f"*:user:{user_id}:*"
    ]
    
    total_cleared = 0
    for pattern in patterns:
        total_cleared += cache.flush_pattern(pattern)
    
    return total_cleared

# Função para limpar cache de análises
def clear_analysis_cache(content_id=None):
    """Limpar cache de análises"""
    if content_id:
        return cache.flush_pattern(f"analysis:*content_id:{content_id}*")
    else:
        return cache.flush_pattern("analysis:*")

# Função para limpar cache de scraping
def clear_scraping_cache(platform=None):
    """Limpar cache de scraping"""
    if platform:
        return cache.flush_pattern(f"scraping:*platform:{platform}*")
    else:
        return cache.flush_pattern("scraping:*")

