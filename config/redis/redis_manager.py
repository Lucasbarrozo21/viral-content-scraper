"""
GERENCIADOR REDIS
Sistema completo de cache com Redis para otimização de performance

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import redis
import json
import pickle
import hashlib
import time
from datetime import datetime, timedelta
from typing import Any, Optional, Union, Dict, List
import logging
from functools import wraps
import asyncio
import aioredis

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self, config):
        self.config = config
        
        # Configurações Redis
        self.host = config.get('host', 'localhost')
        self.port = config.get('port', 6379)
        self.db = config.get('db', 0)
        self.password = config.get('password')
        self.decode_responses = config.get('decode_responses', True)
        
        # Configurações de cache
        self.default_ttl = config.get('default_ttl', 3600)  # 1 hora
        self.key_prefix = config.get('key_prefix', 'viral_scraper:')
        self.max_connections = config.get('max_connections', 20)
        
        # Clientes Redis
        self.redis_client = None
        self.async_redis_client = None
        
        # Estatísticas
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0
        }
        
        # Namespaces para diferentes tipos de cache
        self.namespaces = {
            'api_cache': 'api:',
            'analysis_cache': 'analysis:',
            'content_cache': 'content:',
            'trends_cache': 'trends:',
            'user_sessions': 'session:',
            'rate_limits': 'ratelimit:',
            'locks': 'lock:',
            'queues': 'queue:'
        }
    
    def connect(self):
        """Conecta ao Redis"""
        try:
            connection_params = {
                'host': self.host,
                'port': self.port,
                'db': self.db,
                'decode_responses': self.decode_responses,
                'max_connections': self.max_connections,
                'retry_on_timeout': True,
                'socket_keepalive': True,
                'socket_keepalive_options': {}
            }
            
            if self.password:
                connection_params['password'] = self.password
            
            # Cliente síncrono
            self.redis_client = redis.Redis(**connection_params)
            
            # Testar conexão
            self.redis_client.ping()
            
            logger.info(f"Conectado ao Redis: {self.host}:{self.port}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao conectar no Redis: {e}")
            return False
    
    async def connect_async(self):
        """Conecta ao Redis de forma assíncrona"""
        try:
            redis_url = f"redis://{self.host}:{self.port}/{self.db}"
            if self.password:
                redis_url = f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"
            
            self.async_redis_client = await aioredis.from_url(
                redis_url,
                max_connections=self.max_connections,
                retry_on_timeout=True
            )
            
            # Testar conexão
            await self.async_redis_client.ping()
            
            logger.info(f"Conectado ao Redis (async): {self.host}:{self.port}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao conectar no Redis (async): {e}")
            return False
    
    def _make_key(self, key: str, namespace: str = '') -> str:
        """Cria chave com prefixo e namespace"""
        if namespace and namespace in self.namespaces:
            namespace = self.namespaces[namespace]
        
        return f"{self.key_prefix}{namespace}{key}"
    
    def _serialize_value(self, value: Any) -> Union[str, bytes]:
        """Serializa valor para armazenamento"""
        if isinstance(value, (str, int, float)):
            return str(value)
        elif isinstance(value, (dict, list, tuple)):
            return json.dumps(value, default=str)
        else:
            return pickle.dumps(value)
    
    def _deserialize_value(self, value: Union[str, bytes], original_type: type = None) -> Any:
        """Deserializa valor do cache"""
        if value is None:
            return None
        
        try:
            # Tentar JSON primeiro
            if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                return json.loads(value)
            
            # Tentar pickle se for bytes
            if isinstance(value, bytes):
                return pickle.loads(value)
            
            # Retornar como string
            return value
            
        except:
            return value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None, namespace: str = '') -> bool:
        """Define valor no cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key, namespace)
            serialized_value = self._serialize_value(value)
            ttl = ttl or self.default_ttl
            
            result = self.redis_client.setex(cache_key, ttl, serialized_value)
            
            if result:
                self.stats['sets'] += 1
                logger.debug(f"Cache SET: {cache_key} (TTL: {ttl}s)")
            
            return result
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao definir cache {key}: {e}")
            return False
    
    def get(self, key: str, namespace: str = '') -> Any:
        """Obtém valor do cache"""
        try:
            if not self.redis_client:
                return None
            
            cache_key = self._make_key(key, namespace)
            value = self.redis_client.get(cache_key)
            
            if value is not None:
                self.stats['hits'] += 1
                logger.debug(f"Cache HIT: {cache_key}")
                return self._deserialize_value(value)
            else:
                self.stats['misses'] += 1
                logger.debug(f"Cache MISS: {cache_key}")
                return None
                
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao obter cache {key}: {e}")
            return None
    
    def delete(self, key: str, namespace: str = '') -> bool:
        """Remove valor do cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key, namespace)
            result = self.redis_client.delete(cache_key)
            
            if result:
                self.stats['deletes'] += 1
                logger.debug(f"Cache DELETE: {cache_key}")
            
            return bool(result)
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erro ao deletar cache {key}: {e}")
            return False
    
    def exists(self, key: str, namespace: str = '') -> bool:
        """Verifica se chave existe no cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key, namespace)
            return bool(self.redis_client.exists(cache_key))
            
        except Exception as e:
            logger.error(f"Erro ao verificar existência {key}: {e}")
            return False
    
    def expire(self, key: str, ttl: int, namespace: str = '') -> bool:
        """Define TTL para chave existente"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key, namespace)
            return bool(self.redis_client.expire(cache_key, ttl))
            
        except Exception as e:
            logger.error(f"Erro ao definir TTL {key}: {e}")
            return False
    
    def ttl(self, key: str, namespace: str = '') -> int:
        """Obtém TTL restante de uma chave"""
        try:
            if not self.redis_client:
                return -1
            
            cache_key = self._make_key(key, namespace)
            return self.redis_client.ttl(cache_key)
            
        except Exception as e:
            logger.error(f"Erro ao obter TTL {key}: {e}")
            return -1
    
    def increment(self, key: str, amount: int = 1, namespace: str = '') -> Optional[int]:
        """Incrementa valor numérico"""
        try:
            if not self.redis_client:
                return None
            
            cache_key = self._make_key(key, namespace)
            return self.redis_client.incrby(cache_key, amount)
            
        except Exception as e:
            logger.error(f"Erro ao incrementar {key}: {e}")
            return None
    
    def decrement(self, key: str, amount: int = 1, namespace: str = '') -> Optional[int]:
        """Decrementa valor numérico"""
        try:
            if not self.redis_client:
                return None
            
            cache_key = self._make_key(key, namespace)
            return self.redis_client.decrby(cache_key, amount)
            
        except Exception as e:
            logger.error(f"Erro ao decrementar {key}: {e}")
            return None
    
    def flush_namespace(self, namespace: str) -> int:
        """Remove todas as chaves de um namespace"""
        try:
            if not self.redis_client:
                return 0
            
            pattern = self._make_key('*', namespace)
            keys = self.redis_client.keys(pattern)
            
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Removidas {deleted} chaves do namespace {namespace}")
                return deleted
            
            return 0
            
        except Exception as e:
            logger.error(f"Erro ao limpar namespace {namespace}: {e}")
            return 0
    
    def flush_all(self) -> bool:
        """Remove todas as chaves do banco atual"""
        try:
            if not self.redis_client:
                return False
            
            self.redis_client.flushdb()
            logger.info("Todas as chaves foram removidas do Redis")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao limpar Redis: {e}")
            return False
    
    # Métodos para Rate Limiting
    def is_rate_limited(self, identifier: str, limit: int, window: int) -> bool:
        """Verifica se identificador excedeu rate limit"""
        try:
            key = f"ratelimit:{identifier}"
            current = self.redis_client.get(key)
            
            if current is None:
                # Primeira requisição na janela
                self.redis_client.setex(key, window, 1)
                return False
            
            current_count = int(current)
            if current_count >= limit:
                return True
            
            # Incrementar contador
            self.redis_client.incr(key)
            return False
            
        except Exception as e:
            logger.error(f"Erro no rate limiting: {e}")
            return False  # Em caso de erro, permitir acesso
    
    def get_rate_limit_info(self, identifier: str) -> Dict:
        """Obtém informações do rate limit"""
        try:
            key = f"ratelimit:{identifier}"
            current = self.redis_client.get(key)
            ttl = self.redis_client.ttl(key)
            
            return {
                'current_count': int(current) if current else 0,
                'reset_time': ttl,
                'is_limited': ttl > 0 and current is not None
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter info de rate limit: {e}")
            return {'current_count': 0, 'reset_time': 0, 'is_limited': False}
    
    # Métodos para Locks Distribuídos
    def acquire_lock(self, lock_name: str, timeout: int = 10, blocking_timeout: int = 5) -> bool:
        """Adquire lock distribuído"""
        try:
            lock_key = self._make_key(lock_name, 'locks')
            identifier = f"{time.time()}:{id(self)}"
            
            end_time = time.time() + blocking_timeout
            
            while time.time() < end_time:
                if self.redis_client.set(lock_key, identifier, nx=True, ex=timeout):
                    logger.debug(f"Lock adquirido: {lock_name}")
                    return True
                
                time.sleep(0.001)  # 1ms
            
            logger.debug(f"Timeout ao adquirir lock: {lock_name}")
            return False
            
        except Exception as e:
            logger.error(f"Erro ao adquirir lock {lock_name}: {e}")
            return False
    
    def release_lock(self, lock_name: str) -> bool:
        """Libera lock distribuído"""
        try:
            lock_key = self._make_key(lock_name, 'locks')
            return bool(self.redis_client.delete(lock_key))
            
        except Exception as e:
            logger.error(f"Erro ao liberar lock {lock_name}: {e}")
            return False
    
    # Métodos para Filas
    def push_to_queue(self, queue_name: str, item: Any) -> bool:
        """Adiciona item à fila"""
        try:
            queue_key = self._make_key(queue_name, 'queues')
            serialized_item = self._serialize_value(item)
            
            result = self.redis_client.rpush(queue_key, serialized_item)
            return bool(result)
            
        except Exception as e:
            logger.error(f"Erro ao adicionar à fila {queue_name}: {e}")
            return False
    
    def pop_from_queue(self, queue_name: str, timeout: int = 0) -> Any:
        """Remove item da fila (FIFO)"""
        try:
            queue_key = self._make_key(queue_name, 'queues')
            
            if timeout > 0:
                result = self.redis_client.blpop(queue_key, timeout)
                if result:
                    return self._deserialize_value(result[1])
            else:
                result = self.redis_client.lpop(queue_key)
                if result:
                    return self._deserialize_value(result)
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao remover da fila {queue_name}: {e}")
            return None
    
    def queue_length(self, queue_name: str) -> int:
        """Retorna tamanho da fila"""
        try:
            queue_key = self._make_key(queue_name, 'queues')
            return self.redis_client.llen(queue_key)
            
        except Exception as e:
            logger.error(f"Erro ao obter tamanho da fila {queue_name}: {e}")
            return 0
    
    # Métodos de Monitoramento
    def get_info(self) -> Dict:
        """Obtém informações do Redis"""
        try:
            if not self.redis_client:
                return {}
            
            info = self.redis_client.info()
            return {
                'redis_version': info.get('redis_version'),
                'used_memory': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'uptime_in_seconds': info.get('uptime_in_seconds')
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter info do Redis: {e}")
            return {}
    
    def get_stats(self) -> Dict:
        """Obtém estatísticas do gerenciador"""
        redis_info = self.get_info()
        
        total_operations = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_operations * 100) if total_operations > 0 else 0
        
        return {
            'manager_stats': {
                'hits': self.stats['hits'],
                'misses': self.stats['misses'],
                'sets': self.stats['sets'],
                'deletes': self.stats['deletes'],
                'errors': self.stats['errors'],
                'hit_rate_percent': round(hit_rate, 2)
            },
            'redis_info': redis_info,
            'connection_status': self.redis_client is not None
        }
    
    def health_check(self) -> Dict:
        """Verifica saúde do Redis"""
        try:
            if not self.redis_client:
                return {'status': 'disconnected', 'error': 'No connection'}
            
            # Teste de ping
            start_time = time.time()
            self.redis_client.ping()
            ping_time = (time.time() - start_time) * 1000  # ms
            
            # Teste de escrita/leitura
            test_key = 'health_check_test'
            test_value = str(time.time())
            
            self.redis_client.setex(test_key, 10, test_value)
            retrieved_value = self.redis_client.get(test_key)
            self.redis_client.delete(test_key)
            
            if retrieved_value == test_value:
                return {
                    'status': 'healthy',
                    'ping_time_ms': round(ping_time, 2),
                    'read_write_test': 'passed'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'error': 'Read/write test failed'
                }
                
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }

# Decorador para cache automático
def cache_result(ttl: int = 3600, namespace: str = 'api_cache', key_func=None):
    """Decorador para cache automático de resultados de função"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Gerar chave de cache
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Usar nome da função + hash dos argumentos
                args_str = str(args) + str(sorted(kwargs.items()))
                args_hash = hashlib.md5(args_str.encode()).hexdigest()
                cache_key = f"{func.__name__}:{args_hash}"
            
            # Tentar obter do cache
            redis_manager = getattr(func, '_redis_manager', None)
            if redis_manager:
                cached_result = redis_manager.get(cache_key, namespace)
                if cached_result is not None:
                    return cached_result
            
            # Executar função e cachear resultado
            result = func(*args, **kwargs)
            
            if redis_manager and result is not None:
                redis_manager.set(cache_key, result, ttl, namespace)
            
            return result
        
        return wrapper
    return decorator

# Instância global (singleton)
_redis_manager_instance = None

def get_redis_manager(config=None):
    """Obtém instância singleton do RedisManager"""
    global _redis_manager_instance
    
    if _redis_manager_instance is None:
        if config is None:
            config = {
                'host': 'localhost',
                'port': 6379,
                'db': 0,
                'default_ttl': 3600
            }
        
        _redis_manager_instance = RedisManager(config)
        _redis_manager_instance.connect()
    
    return _redis_manager_instance

# CLI para gerenciar Redis
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gerenciador Redis')
    parser.add_argument('command', choices=['info', 'stats', 'health', 'flush', 'test'])
    parser.add_argument('--namespace', help='Namespace para flush')
    
    args = parser.parse_args()
    
    config = {
        'host': 'localhost',
        'port': 6379,
        'db': 0
    }
    
    manager = RedisManager(config)
    
    if not manager.connect():
        print("Erro: Não foi possível conectar ao Redis")
        return
    
    try:
        if args.command == 'info':
            info = manager.get_info()
            print("Informações do Redis:")
            for key, value in info.items():
                print(f"  {key}: {value}")
        
        elif args.command == 'stats':
            stats = manager.get_stats()
            print("Estatísticas:")
            print(json.dumps(stats, indent=2))
        
        elif args.command == 'health':
            health = manager.health_check()
            print(f"Status de saúde: {health}")
        
        elif args.command == 'flush':
            if args.namespace:
                removed = manager.flush_namespace(args.namespace)
                print(f"Removidas {removed} chaves do namespace {args.namespace}")
            else:
                manager.flush_all()
                print("Todas as chaves foram removidas")
        
        elif args.command == 'test':
            # Teste básico
            test_key = 'test_key'
            test_value = {'message': 'Hello Redis!', 'timestamp': time.time()}
            
            print("Testando operações básicas...")
            
            # Set
            result = manager.set(test_key, test_value, 60)
            print(f"SET: {result}")
            
            # Get
            retrieved = manager.get(test_key)
            print(f"GET: {retrieved}")
            
            # Exists
            exists = manager.exists(test_key)
            print(f"EXISTS: {exists}")
            
            # TTL
            ttl = manager.ttl(test_key)
            print(f"TTL: {ttl}")
            
            # Delete
            deleted = manager.delete(test_key)
            print(f"DELETE: {deleted}")
            
            print("Teste concluído!")
    
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    main()

