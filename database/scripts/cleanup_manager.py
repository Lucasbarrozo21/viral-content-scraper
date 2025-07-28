"""
SISTEMA DE LIMPEZA AUTOMÁTICA
Gerenciador para limpeza e manutenção automática de dados antigos

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import asyncio
import asyncpg
import os
from datetime import datetime, timedelta
from pathlib import Path
import logging
import schedule
import time
from threading import Thread
import json
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class CleanupManager:
    def __init__(self, config):
        self.config = config
        self.db_config = config['database']
        self.db_pool = None
        
        # Políticas de limpeza por tabela
        self.cleanup_policies = {
            'scraped_content': {
                'retention_days': config.get('content_retention_days', 365),
                'archive_before_delete': True,
                'batch_size': 1000,
                'conditions': ['is_active = false', 'scraped_at < %s']
            },
            'content_metrics': {
                'retention_days': config.get('metrics_retention_days', 180),
                'archive_before_delete': False,
                'batch_size': 5000,
                'conditions': ['collected_at < %s']
            },
            'content_analyses': {
                'retention_days': config.get('analyses_retention_days', 270),
                'archive_before_delete': True,
                'batch_size': 2000,
                'conditions': ['analyzed_at < %s']
            },
            'system_logs': {
                'retention_days': config.get('logs_retention_days', 90),
                'archive_before_delete': False,
                'batch_size': 10000,
                'conditions': ['created_at < %s']
            },
            'temp_data': {
                'retention_days': config.get('temp_retention_days', 7),
                'archive_before_delete': False,
                'batch_size': 5000,
                'conditions': ['created_at < %s']
            },
            'failed_scrapes': {
                'retention_days': config.get('failed_scrapes_retention_days', 30),
                'archive_before_delete': False,
                'batch_size': 1000,
                'conditions': ['attempted_at < %s']
            }
        }
        
        # Configurações de arquivamento
        self.archive_dir = Path(config.get('archive_dir', '/home/ubuntu/viral_content_scraper/storage/archives'))
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        
        # Estatísticas
        self.stats = {
            'total_records_deleted': 0,
            'total_records_archived': 0,
            'last_cleanup_date': None,
            'cleanup_duration_seconds': 0,
            'tables_processed': 0,
            'errors_count': 0
        }
    
    async def init_db_pool(self):
        """Inicializa pool de conexões"""
        if not self.db_pool:
            self.db_pool = await asyncpg.create_pool(**self.db_config)
    
    async def close_db_pool(self):
        """Fecha pool de conexões"""
        if self.db_pool:
            await self.db_pool.close()
    
    async def get_table_stats(self, table_name: str) -> Dict:
        """Obtém estatísticas da tabela"""
        try:
            async with self.db_pool.acquire() as conn:
                # Contagem total
                total_count = await conn.fetchval(f"""
                    SELECT COUNT(*) FROM {table_name}
                """)
                
                # Tamanho da tabela
                table_size = await conn.fetchrow(f"""
                    SELECT 
                        pg_size_pretty(pg_total_relation_size('{table_name}')) as size_pretty,
                        pg_total_relation_size('{table_name}') as size_bytes
                """)
                
                # Data mais antiga e mais recente
                policy = self.cleanup_policies.get(table_name, {})
                date_column = self._get_date_column(table_name)
                
                if date_column:
                    date_stats = await conn.fetchrow(f"""
                        SELECT 
                            MIN({date_column}) as oldest_date,
                            MAX({date_column}) as newest_date
                        FROM {table_name}
                    """)
                else:
                    date_stats = {'oldest_date': None, 'newest_date': None}
                
                return {
                    'table_name': table_name,
                    'total_records': total_count,
                    'size_pretty': table_size['size_pretty'],
                    'size_bytes': table_size['size_bytes'],
                    'oldest_date': date_stats['oldest_date'],
                    'newest_date': date_stats['newest_date'],
                    'retention_days': policy.get('retention_days', 0)
                }
                
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas da tabela {table_name}: {e}")
            return {}
    
    def _get_date_column(self, table_name: str) -> Optional[str]:
        """Retorna coluna de data para a tabela"""
        date_columns = {
            'scraped_content': 'scraped_at',
            'content_metrics': 'collected_at',
            'content_analyses': 'analyzed_at',
            'system_logs': 'created_at',
            'temp_data': 'created_at',
            'failed_scrapes': 'attempted_at'
        }
        return date_columns.get(table_name)
    
    async def count_records_to_cleanup(self, table_name: str) -> int:
        """Conta registros que serão removidos"""
        try:
            policy = self.cleanup_policies.get(table_name)
            if not policy:
                return 0
            
            cutoff_date = datetime.now() - timedelta(days=policy['retention_days'])
            date_column = self._get_date_column(table_name)
            
            if not date_column:
                return 0
            
            async with self.db_pool.acquire() as conn:
                # Construir condições
                conditions = []
                params = []
                
                for condition in policy.get('conditions', []):
                    if '%s' in condition:
                        conditions.append(condition.replace('%s', '$' + str(len(params) + 1)))
                        params.append(cutoff_date)
                    else:
                        conditions.append(condition)
                
                where_clause = ' AND '.join(conditions) if conditions else '1=1'
                
                count = await conn.fetchval(f"""
                    SELECT COUNT(*) FROM {table_name} 
                    WHERE {where_clause}
                """, *params)
                
                return count
                
        except Exception as e:
            logger.error(f"Erro ao contar registros para limpeza em {table_name}: {e}")
            return 0
    
    async def archive_table_data(self, table_name: str, cutoff_date: datetime) -> int:
        """Arquiva dados da tabela antes de deletar"""
        try:
            archive_file = self.archive_dir / f"{table_name}_{cutoff_date.strftime('%Y%m%d')}.json"
            
            policy = self.cleanup_policies.get(table_name)
            if not policy:
                return 0
            
            async with self.db_pool.acquire() as conn:
                # Construir query de seleção
                conditions = []
                params = []
                
                for condition in policy.get('conditions', []):
                    if '%s' in condition:
                        conditions.append(condition.replace('%s', '$' + str(len(params) + 1)))
                        params.append(cutoff_date)
                    else:
                        conditions.append(condition)
                
                where_clause = ' AND '.join(conditions) if conditions else '1=1'
                
                # Buscar dados em lotes
                archived_count = 0
                offset = 0
                batch_size = policy.get('batch_size', 1000)
                
                with open(archive_file, 'w') as f:
                    f.write('[\n')
                    first_record = True
                    
                    while True:
                        records = await conn.fetch(f"""
                            SELECT * FROM {table_name} 
                            WHERE {where_clause}
                            ORDER BY {self._get_date_column(table_name)} ASC
                            LIMIT {batch_size} OFFSET {offset}
                        """, *params)
                        
                        if not records:
                            break
                        
                        for record in records:
                            if not first_record:
                                f.write(',\n')
                            
                            # Converter record para dict serializável
                            record_dict = {}
                            for key, value in record.items():
                                if isinstance(value, datetime):
                                    record_dict[key] = value.isoformat()
                                else:
                                    record_dict[key] = str(value) if value is not None else None
                            
                            json.dump(record_dict, f, ensure_ascii=False)
                            first_record = False
                            archived_count += 1
                        
                        offset += batch_size
                    
                    f.write('\n]')
                
                logger.info(f"Arquivados {archived_count} registros de {table_name} em {archive_file}")
                return archived_count
                
        except Exception as e:
            logger.error(f"Erro ao arquivar dados de {table_name}: {e}")
            return 0
    
    async def cleanup_table(self, table_name: str) -> Dict:
        """Executa limpeza de uma tabela específica"""
        start_time = time.time()
        
        try:
            policy = self.cleanup_policies.get(table_name)
            if not policy:
                return {
                    'success': False,
                    'error': f'Política de limpeza não encontrada para {table_name}'
                }
            
            cutoff_date = datetime.now() - timedelta(days=policy['retention_days'])
            
            logger.info(f"Iniciando limpeza de {table_name} (dados antes de {cutoff_date})")
            
            # Contar registros a serem removidos
            records_to_delete = await self.count_records_to_cleanup(table_name)
            
            if records_to_delete == 0:
                return {
                    'success': True,
                    'table_name': table_name,
                    'records_deleted': 0,
                    'records_archived': 0,
                    'message': 'Nenhum registro para limpeza'
                }
            
            archived_count = 0
            
            # Arquivar se necessário
            if policy.get('archive_before_delete', False):
                archived_count = await self.archive_table_data(table_name, cutoff_date)
            
            # Deletar registros em lotes
            deleted_count = 0
            batch_size = policy.get('batch_size', 1000)
            
            async with self.db_pool.acquire() as conn:
                while True:
                    # Construir condições
                    conditions = []
                    params = []
                    
                    for condition in policy.get('conditions', []):
                        if '%s' in condition:
                            conditions.append(condition.replace('%s', '$' + str(len(params) + 1)))
                            params.append(cutoff_date)
                        else:
                            conditions.append(condition)
                    
                    where_clause = ' AND '.join(conditions) if conditions else '1=1'
                    
                    # Deletar lote
                    result = await conn.execute(f"""
                        DELETE FROM {table_name} 
                        WHERE ctid IN (
                            SELECT ctid FROM {table_name} 
                            WHERE {where_clause}
                            LIMIT {batch_size}
                        )
                    """, *params)
                    
                    # Extrair número de registros deletados
                    batch_deleted = int(result.split()[-1])
                    deleted_count += batch_deleted
                    
                    if batch_deleted == 0:
                        break
                    
                    # Log de progresso
                    if deleted_count % (batch_size * 10) == 0:
                        logger.info(f"Progresso {table_name}: {deleted_count} registros deletados")
                    
                    # Pequena pausa para não sobrecarregar o banco
                    await asyncio.sleep(0.1)
            
            duration = time.time() - start_time
            
            # Atualizar estatísticas
            self.stats['total_records_deleted'] += deleted_count
            self.stats['total_records_archived'] += archived_count
            
            logger.info(f"Limpeza de {table_name} concluída: {deleted_count} deletados, {archived_count} arquivados em {duration:.2f}s")
            
            return {
                'success': True,
                'table_name': table_name,
                'records_deleted': deleted_count,
                'records_archived': archived_count,
                'duration_seconds': duration,
                'cutoff_date': cutoff_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na limpeza de {table_name}: {e}")
            self.stats['errors_count'] += 1
            
            return {
                'success': False,
                'table_name': table_name,
                'error': str(e)
            }
    
    async def cleanup_all_tables(self) -> Dict:
        """Executa limpeza de todas as tabelas"""
        start_time = time.time()
        
        try:
            await self.init_db_pool()
            
            logger.info("Iniciando limpeza automática de todas as tabelas")
            
            results = []
            total_deleted = 0
            total_archived = 0
            
            for table_name in self.cleanup_policies.keys():
                result = await self.cleanup_table(table_name)
                results.append(result)
                
                if result['success']:
                    total_deleted += result.get('records_deleted', 0)
                    total_archived += result.get('records_archived', 0)
                    self.stats['tables_processed'] += 1
            
            # Executar VACUUM para recuperar espaço
            await self._vacuum_tables()
            
            duration = time.time() - start_time
            self.stats['last_cleanup_date'] = datetime.now().isoformat()
            self.stats['cleanup_duration_seconds'] = duration
            
            logger.info(f"Limpeza automática concluída: {total_deleted} registros deletados, {total_archived} arquivados em {duration:.2f}s")
            
            return {
                'success': True,
                'total_records_deleted': total_deleted,
                'total_records_archived': total_archived,
                'duration_seconds': duration,
                'tables_processed': len([r for r in results if r['success']]),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Erro na limpeza automática: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        
        finally:
            await self.close_db_pool()
    
    async def _vacuum_tables(self):
        """Executa VACUUM nas tabelas limpas"""
        try:
            async with self.db_pool.acquire() as conn:
                for table_name in self.cleanup_policies.keys():
                    try:
                        # VACUUM não pode ser executado em transação
                        await conn.execute(f"VACUUM ANALYZE {table_name}")
                        logger.debug(f"VACUUM executado em {table_name}")
                    except Exception as e:
                        logger.warning(f"Erro no VACUUM de {table_name}: {e}")
                        
        except Exception as e:
            logger.error(f"Erro no VACUUM: {e}")
    
    async def cleanup_orphaned_data(self) -> Dict:
        """Remove dados órfãos (referências quebradas)"""
        try:
            await self.init_db_pool()
            
            orphaned_count = 0
            
            async with self.db_pool.acquire() as conn:
                # Métricas sem conteúdo
                result = await conn.execute("""
                    DELETE FROM content_metrics 
                    WHERE content_id NOT IN (SELECT id FROM scraped_content)
                """)
                metrics_orphaned = int(result.split()[-1])
                orphaned_count += metrics_orphaned
                
                # Análises sem conteúdo
                result = await conn.execute("""
                    DELETE FROM content_analyses 
                    WHERE content_id NOT IN (SELECT id FROM scraped_content)
                """)
                analyses_orphaned = int(result.split()[-1])
                orphaned_count += analyses_orphaned
                
                # Memórias de agentes sem referência válida
                result = await conn.execute("""
                    DELETE FROM agent_memories 
                    WHERE content_id IS NOT NULL 
                    AND content_id NOT IN (SELECT id FROM scraped_content)
                """)
                memories_orphaned = int(result.split()[-1])
                orphaned_count += memories_orphaned
            
            logger.info(f"Removidos {orphaned_count} registros órfãos")
            
            return {
                'success': True,
                'total_orphaned_removed': orphaned_count,
                'details': {
                    'metrics_orphaned': metrics_orphaned,
                    'analyses_orphaned': analyses_orphaned,
                    'memories_orphaned': memories_orphaned
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na limpeza de dados órfãos: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        
        finally:
            await self.close_db_pool()
    
    async def get_cleanup_report(self) -> Dict:
        """Gera relatório de limpeza"""
        try:
            await self.init_db_pool()
            
            report = {
                'generated_at': datetime.now().isoformat(),
                'stats': self.stats.copy(),
                'table_stats': {},
                'recommendations': []
            }
            
            # Estatísticas por tabela
            for table_name in self.cleanup_policies.keys():
                table_stats = await self.get_table_stats(table_name)
                records_to_cleanup = await self.count_records_to_cleanup(table_name)
                
                table_stats['records_to_cleanup'] = records_to_cleanup
                report['table_stats'][table_name] = table_stats
                
                # Recomendações
                if records_to_cleanup > 10000:
                    report['recommendations'].append({
                        'table': table_name,
                        'type': 'high_cleanup_volume',
                        'message': f'{records_to_cleanup} registros para limpeza em {table_name}'
                    })
                
                if table_stats.get('size_bytes', 0) > 1024 * 1024 * 1024:  # > 1GB
                    report['recommendations'].append({
                        'table': table_name,
                        'type': 'large_table_size',
                        'message': f'Tabela {table_name} está grande: {table_stats.get("size_pretty", "N/A")}'
                    })
            
            return report
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório: {e}")
            return {
                'generated_at': datetime.now().isoformat(),
                'error': str(e)
            }
        
        finally:
            await self.close_db_pool()
    
    def start_scheduler(self):
        """Inicia agendador de limpeza"""
        # Limpeza completa diária às 4:00 AM
        schedule.every().day.at("04:00").do(lambda: asyncio.run(self.cleanup_all_tables()))
        
        # Limpeza de dados órfãos semanal aos domingos às 5:00 AM
        schedule.every().sunday.at("05:00").do(lambda: asyncio.run(self.cleanup_orphaned_data()))
        
        # Limpeza de arquivos temporários diária às 6:00 AM
        schedule.every().day.at("06:00").do(self._cleanup_temp_files)
        
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(60)
        
        scheduler_thread = Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        
        logger.info("Agendador de limpeza iniciado")
    
    def _cleanup_temp_files(self):
        """Limpa arquivos temporários"""
        try:
            from storage.file_manager import FileManager
            
            file_manager = FileManager({
                'storage_path': '/home/ubuntu/viral_content_scraper/storage'
            })
            
            removed = file_manager.cleanup_temp_files()
            logger.info(f"Limpeza de arquivos temporários: {removed} arquivos removidos")
            
        except Exception as e:
            logger.error(f"Erro na limpeza de arquivos temporários: {e}")

# CLI para gerenciar limpeza
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gerenciador de Limpeza')
    parser.add_argument('command', choices=['cleanup', 'report', 'orphaned', 'stats'])
    parser.add_argument('--table', help='Tabela específica para limpeza')
    parser.add_argument('--dry-run', action='store_true', help='Apenas simular limpeza')
    
    args = parser.parse_args()
    
    config = {
        'database': {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'user': os.getenv('DB_USER', 'viral_user'),
            'password': os.getenv('DB_PASSWORD', 'viral_password'),
            'database': os.getenv('DB_NAME', 'viral_content_db')
        },
        'content_retention_days': 365,
        'metrics_retention_days': 180,
        'analyses_retention_days': 270,
        'logs_retention_days': 90
    }
    
    manager = CleanupManager(config)
    
    try:
        if args.command == 'cleanup':
            if args.table:
                result = await manager.cleanup_table(args.table)
                print(f"Limpeza de {args.table}: {result}")
            else:
                result = await manager.cleanup_all_tables()
                print(f"Limpeza completa: {result}")
        
        elif args.command == 'report':
            report = await manager.get_cleanup_report()
            print("Relatório de Limpeza:")
            print(json.dumps(report, indent=2, default=str))
        
        elif args.command == 'orphaned':
            result = await manager.cleanup_orphaned_data()
            print(f"Limpeza de dados órfãos: {result}")
        
        elif args.command == 'stats':
            for table_name in manager.cleanup_policies.keys():
                stats = await manager.get_table_stats(table_name)
                to_cleanup = await manager.count_records_to_cleanup(table_name)
                print(f"\n{table_name}:")
                print(f"  Total: {stats.get('total_records', 0)} registros")
                print(f"  Tamanho: {stats.get('size_pretty', 'N/A')}")
                print(f"  Para limpeza: {to_cleanup} registros")
    
    except Exception as e:
        logger.error(f"Erro: {e}")
        print(f"Erro: {e}")

if __name__ == '__main__':
    asyncio.run(main())

