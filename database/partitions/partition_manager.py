"""
GERENCIADOR DE PARTIÇÕES TEMPORAIS
Sistema automatizado para criação e manutenção de partições

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import asyncio
import asyncpg
import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import logging
import schedule
import time
from threading import Thread

logger = logging.getLogger(__name__)

class PartitionManager:
    def __init__(self, db_config):
        self.db_config = db_config
        self.db_pool = None
        
        # Tabelas particionadas e suas configurações
        self.partitioned_tables = {
            'scraped_content': {
                'partition_column': 'scraped_at',
                'partition_type': 'monthly',
                'retention_months': 24,
                'create_future_partitions': 3
            },
            'content_metrics': {
                'partition_column': 'collected_at',
                'partition_type': 'monthly',
                'retention_months': 12,
                'create_future_partitions': 3
            },
            'content_analyses': {
                'partition_column': 'analyzed_at',
                'partition_type': 'monthly',
                'retention_months': 18,
                'create_future_partitions': 3
            },
            'system_logs': {
                'partition_column': 'created_at',
                'partition_type': 'monthly',
                'retention_months': 6,
                'create_future_partitions': 2
            }
        }
    
    async def init_db_pool(self):
        """Inicializa pool de conexões"""
        if not self.db_pool:
            self.db_pool = await asyncpg.create_pool(**self.db_config)
    
    async def close_db_pool(self):
        """Fecha pool de conexões"""
        if self.db_pool:
            await self.db_pool.close()
    
    def get_partition_name(self, table_name, date):
        """Gera nome da partição baseado na data"""
        return f"{table_name}_{date.strftime('%Y_%m')}"
    
    def get_partition_bounds(self, date, partition_type='monthly'):
        """Calcula limites da partição"""
        if partition_type == 'monthly':
            start_date = date.replace(day=1)
            end_date = start_date + relativedelta(months=1)
        elif partition_type == 'weekly':
            # Começar na segunda-feira
            start_date = date - timedelta(days=date.weekday())
            end_date = start_date + timedelta(days=7)
        elif partition_type == 'daily':
            start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
        else:
            raise ValueError(f"Tipo de partição não suportado: {partition_type}")
        
        return start_date, end_date
    
    async def partition_exists(self, partition_name):
        """Verifica se a partição já existe"""
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_tables 
                    WHERE tablename = $1
                )
            """, partition_name)
            return result
    
    async def create_partition(self, table_name, date, config):
        """Cria uma partição para a data especificada"""
        partition_name = self.get_partition_name(table_name, date)
        
        # Verificar se já existe
        if await self.partition_exists(partition_name):
            logger.debug(f"Partição {partition_name} já existe")
            return False
        
        start_date, end_date = self.get_partition_bounds(date, config['partition_type'])
        
        try:
            async with self.db_pool.acquire() as conn:
                # Criar partição
                await conn.execute(f"""
                    CREATE TABLE {partition_name} PARTITION OF {table_name}
                    FOR VALUES FROM ('{start_date.isoformat()}') TO ('{end_date.isoformat()}')
                """)
                
                # Criar índices específicos da partição
                partition_column = config['partition_column']
                
                # Índice principal na coluna de partição
                await conn.execute(f"""
                    CREATE INDEX idx_{partition_name}_{partition_column} 
                    ON {partition_name} ({partition_column} DESC)
                """)
                
                # Índices específicos por tabela
                if table_name == 'scraped_content':
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_platform 
                        ON {partition_name} (platform, {partition_column} DESC)
                    """)
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_author 
                        ON {partition_name} (author_username, platform)
                    """)
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_hashtags 
                        ON {partition_name} USING GIN (hashtags)
                    """)
                
                elif table_name == 'content_metrics':
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_content_id 
                        ON {partition_name} (content_id, {partition_column} DESC)
                    """)
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_engagement 
                        ON {partition_name} (engagement_rate DESC) 
                        WHERE engagement_rate IS NOT NULL
                    """)
                
                elif table_name == 'content_analyses':
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_content_type 
                        ON {partition_name} (content_id, analysis_type, {partition_column} DESC)
                    """)
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_scores 
                        ON {partition_name} (overall_score DESC, confidence_score DESC)
                    """)
                
                elif table_name == 'system_logs':
                    await conn.execute(f"""
                        CREATE INDEX idx_{partition_name}_level_component 
                        ON {partition_name} (log_level, component, {partition_column} DESC)
                    """)
                
                logger.info(f"Partição {partition_name} criada com sucesso")
                return True
                
        except Exception as e:
            logger.error(f"Erro ao criar partição {partition_name}: {e}")
            raise e
    
    async def drop_partition(self, partition_name):
        """Remove uma partição"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute(f"DROP TABLE IF EXISTS {partition_name}")
                logger.info(f"Partição {partition_name} removida")
                return True
        except Exception as e:
            logger.error(f"Erro ao remover partição {partition_name}: {e}")
            return False
    
    async def create_future_partitions(self):
        """Cria partições futuras para todas as tabelas"""
        await self.init_db_pool()
        
        try:
            current_date = datetime.now().replace(day=1)  # Primeiro dia do mês atual
            
            for table_name, config in self.partitioned_tables.items():
                future_months = config['create_future_partitions']
                
                for i in range(future_months + 1):  # +1 para incluir mês atual
                    target_date = current_date + relativedelta(months=i)
                    await self.create_partition(table_name, target_date, config)
            
            logger.info("Criação de partições futuras concluída")
            
        finally:
            await self.close_db_pool()
    
    async def cleanup_old_partitions(self):
        """Remove partições antigas baseado na política de retenção"""
        await self.init_db_pool()
        
        try:
            current_date = datetime.now().replace(day=1)
            
            for table_name, config in self.partitioned_tables.items():
                retention_months = config['retention_months']
                cutoff_date = current_date - relativedelta(months=retention_months)
                
                # Listar partições existentes
                async with self.db_pool.acquire() as conn:
                    partitions = await conn.fetch("""
                        SELECT tablename FROM pg_tables 
                        WHERE tablename LIKE $1 
                        AND schemaname = 'public'
                    """, f"{table_name}_%")
                
                for partition in partitions:
                    partition_name = partition['tablename']
                    
                    # Extrair data da partição (formato: table_YYYY_MM)
                    try:
                        date_part = partition_name.split('_')[-2:]  # ['YYYY', 'MM']
                        partition_date = datetime(int(date_part[0]), int(date_part[1]), 1)
                        
                        if partition_date < cutoff_date:
                            # Arquivar dados antes de remover (opcional)
                            await self.archive_partition_data(partition_name, table_name)
                            
                            # Remover partição
                            await self.drop_partition(partition_name)
                            
                    except (ValueError, IndexError):
                        logger.warning(f"Não foi possível extrair data da partição: {partition_name}")
            
            logger.info("Limpeza de partições antigas concluída")
            
        finally:
            await self.close_db_pool()
    
    async def archive_partition_data(self, partition_name, table_name):
        """Arquiva dados da partição antes de removê-la"""
        try:
            archive_dir = f"/home/ubuntu/viral_content_scraper/storage/archives/{table_name}"
            os.makedirs(archive_dir, exist_ok=True)
            
            archive_file = f"{archive_dir}/{partition_name}_{datetime.now().strftime('%Y%m%d')}.sql"
            
            # Usar pg_dump para arquivar
            dump_command = f"""
                pg_dump -h {self.db_config['host']} -p {self.db_config['port']} \
                -U {self.db_config['user']} -d {self.db_config['database']} \
                -t {partition_name} --data-only --inserts > {archive_file}
            """
            
            os.system(dump_command)
            logger.info(f"Dados da partição {partition_name} arquivados em {archive_file}")
            
        except Exception as e:
            logger.error(f"Erro ao arquivar partição {partition_name}: {e}")
    
    async def get_partition_stats(self):
        """Retorna estatísticas das partições"""
        await self.init_db_pool()
        
        try:
            stats = {}
            
            async with self.db_pool.acquire() as conn:
                for table_name in self.partitioned_tables.keys():
                    # Listar partições da tabela
                    partitions = await conn.fetch("""
                        SELECT 
                            schemaname,
                            tablename,
                            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                        FROM pg_tables 
                        WHERE tablename LIKE $1 
                        AND schemaname = 'public'
                        ORDER BY tablename
                    """, f"{table_name}_%")
                    
                    # Estatísticas da tabela principal
                    main_table_stats = await conn.fetchrow("""
                        SELECT 
                            pg_size_pretty(pg_total_relation_size($1)) as total_size,
                            pg_total_relation_size($1) as total_size_bytes
                    """, table_name)
                    
                    stats[table_name] = {
                        'total_size': main_table_stats['total_size'],
                        'total_size_bytes': main_table_stats['total_size_bytes'],
                        'partition_count': len(partitions),
                        'partitions': [
                            {
                                'name': p['tablename'],
                                'size': p['size'],
                                'size_bytes': p['size_bytes']
                            }
                            for p in partitions
                        ]
                    }
            
            return stats
            
        finally:
            await self.close_db_pool()
    
    async def maintenance_job(self):
        """Job de manutenção das partições"""
        logger.info("Iniciando job de manutenção de partições")
        
        try:
            # Criar partições futuras
            await self.create_future_partitions()
            
            # Limpar partições antigas
            await self.cleanup_old_partitions()
            
            logger.info("Job de manutenção de partições concluído")
            
        except Exception as e:
            logger.error(f"Erro no job de manutenção de partições: {e}")
    
    def start_scheduler(self):
        """Inicia agendador de manutenção"""
        # Agendar para executar todo dia às 2:00 AM
        schedule.every().day.at("02:00").do(lambda: asyncio.run(self.maintenance_job()))
        
        # Executar imediatamente na inicialização
        asyncio.run(self.maintenance_job())
        
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Verificar a cada minuto
        
        scheduler_thread = Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        
        logger.info("Agendador de partições iniciado")

# CLI para gerenciar partições
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gerenciador de Partições')
    parser.add_argument('command', choices=['create', 'cleanup', 'stats', 'maintenance'])
    parser.add_argument('--table', help='Nome da tabela específica')
    parser.add_argument('--months', type=int, default=3, help='Número de meses futuros para criar')
    
    args = parser.parse_args()
    
    # Configuração do banco
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'user': os.getenv('DB_USER', 'viral_user'),
        'password': os.getenv('DB_PASSWORD', 'viral_password'),
        'database': os.getenv('DB_NAME', 'viral_content_db')
    }
    
    manager = PartitionManager(db_config)
    
    try:
        if args.command == 'create':
            await manager.create_future_partitions()
            print("Partições futuras criadas")
        
        elif args.command == 'cleanup':
            await manager.cleanup_old_partitions()
            print("Limpeza de partições concluída")
        
        elif args.command == 'stats':
            stats = await manager.get_partition_stats()
            print("Estatísticas das Partições:")
            for table, data in stats.items():
                print(f"\n{table}:")
                print(f"  Total Size: {data['total_size']}")
                print(f"  Partitions: {data['partition_count']}")
                for partition in data['partitions'][-5:]:  # Mostrar últimas 5
                    print(f"    {partition['name']}: {partition['size']}")
        
        elif args.command == 'maintenance':
            await manager.maintenance_job()
            print("Manutenção de partições executada")
    
    except Exception as e:
        logger.error(f"Erro: {e}")
        print(f"Erro: {e}")

if __name__ == '__main__':
    asyncio.run(main())

