"""
SISTEMA DE MIGRATIONS
Gerenciador de versões e migrações do banco de dados

Autor: Manus AI
Data: 27 de Janeiro de 2025
Versão: 1.0.0
"""

import asyncio
import asyncpg
import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MigrationManager:
    def __init__(self, db_config, migrations_dir=None):
        self.db_config = db_config
        self.migrations_dir = Path(migrations_dir or '/home/ubuntu/viral_content_scraper/database/migrations')
        self.db_pool = None
        
    async def init_db_pool(self):
        """Inicializa pool de conexões"""
        if not self.db_pool:
            self.db_pool = await asyncpg.create_pool(**self.db_config)
    
    async def close_db_pool(self):
        """Fecha pool de conexões"""
        if self.db_pool:
            await self.db_pool.close()
    
    async def ensure_migrations_table(self):
        """Garante que a tabela de migrations existe"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(20) PRIMARY KEY,
                    description TEXT NOT NULL,
                    applied_at TIMESTAMPTZ DEFAULT NOW(),
                    applied_by VARCHAR(100) DEFAULT current_user,
                    checksum VARCHAR(64),
                    execution_time_ms INTEGER,
                    rollback_sql TEXT,
                    status VARCHAR(20) DEFAULT 'applied'
                )
            """)
    
    def calculate_checksum(self, sql_content):
        """Calcula checksum do conteúdo SQL"""
        return hashlib.sha256(sql_content.encode()).hexdigest()
    
    async def get_applied_migrations(self):
        """Retorna lista de migrations já aplicadas"""
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT version, description, applied_at, checksum, status
                FROM schema_migrations 
                ORDER BY applied_at
            """)
            return [dict(row) for row in rows]
    
    def get_migration_files(self):
        """Retorna lista de arquivos de migration disponíveis"""
        migration_files = []
        
        for file_path in sorted(self.migrations_dir.glob('*.sql')):
            if file_path.name.startswith('V') and '__' in file_path.name:
                # Formato: V1.0.0__description.sql
                parts = file_path.stem.split('__', 1)
                if len(parts) == 2:
                    version = parts[0][1:]  # Remove 'V'
                    description = parts[1].replace('_', ' ')
                    
                    migration_files.append({
                        'version': version,
                        'description': description,
                        'file_path': file_path,
                        'content': file_path.read_text(encoding='utf-8')
                    })
        
        return migration_files
    
    async def apply_migration(self, migration):
        """Aplica uma migration específica"""
        start_time = datetime.now()
        
        try:
            async with self.db_pool.acquire() as conn:
                async with conn.transaction():
                    # Executar SQL da migration
                    await conn.execute(migration['content'])
                    
                    # Calcular tempo de execução
                    execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
                    
                    # Registrar migration aplicada
                    await conn.execute("""
                        INSERT INTO schema_migrations 
                        (version, description, checksum, execution_time_ms, status)
                        VALUES ($1, $2, $3, $4, 'applied')
                        ON CONFLICT (version) DO UPDATE SET
                            applied_at = NOW(),
                            checksum = EXCLUDED.checksum,
                            execution_time_ms = EXCLUDED.execution_time_ms,
                            status = 'applied'
                    """, 
                        migration['version'],
                        migration['description'],
                        self.calculate_checksum(migration['content']),
                        execution_time
                    )
                    
                    logger.info(f"Migration {migration['version']} aplicada com sucesso em {execution_time}ms")
                    return True
                    
        except Exception as e:
            logger.error(f"Erro ao aplicar migration {migration['version']}: {e}")
            
            # Registrar falha
            try:
                async with self.db_pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO schema_migrations 
                        (version, description, checksum, status)
                        VALUES ($1, $2, $3, 'failed')
                        ON CONFLICT (version) DO UPDATE SET
                            status = 'failed'
                    """, 
                        migration['version'],
                        migration['description'],
                        self.calculate_checksum(migration['content'])
                    )
            except:
                pass
            
            raise e
    
    async def migrate(self, target_version=None):
        """Executa migrations até a versão especificada"""
        await self.init_db_pool()
        await self.ensure_migrations_table()
        
        try:
            # Obter migrations aplicadas e disponíveis
            applied_migrations = await self.get_applied_migrations()
            available_migrations = self.get_migration_files()
            
            applied_versions = {m['version'] for m in applied_migrations if m['status'] == 'applied'}
            
            # Filtrar migrations a aplicar
            migrations_to_apply = []
            for migration in available_migrations:
                if migration['version'] not in applied_versions:
                    if target_version is None or migration['version'] <= target_version:
                        migrations_to_apply.append(migration)
            
            if not migrations_to_apply:
                logger.info("Nenhuma migration pendente encontrada")
                return {'status': 'up_to_date', 'applied_count': 0}
            
            # Aplicar migrations em ordem
            applied_count = 0
            for migration in migrations_to_apply:
                await self.apply_migration(migration)
                applied_count += 1
            
            logger.info(f"{applied_count} migrations aplicadas com sucesso")
            return {
                'status': 'success', 
                'applied_count': applied_count,
                'applied_versions': [m['version'] for m in migrations_to_apply]
            }
            
        finally:
            await self.close_db_pool()
    
    async def rollback(self, target_version):
        """Executa rollback até a versão especificada"""
        await self.init_db_pool()
        
        try:
            applied_migrations = await self.get_applied_migrations()
            
            # Encontrar migrations para rollback (em ordem reversa)
            migrations_to_rollback = []
            for migration in reversed(applied_migrations):
                if migration['version'] > target_version and migration['status'] == 'applied':
                    migrations_to_rollback.append(migration)
            
            if not migrations_to_rollback:
                logger.info(f"Nenhuma migration para rollback até versão {target_version}")
                return {'status': 'no_rollback_needed', 'rollback_count': 0}
            
            rollback_count = 0
            for migration in migrations_to_rollback:
                if migration.get('rollback_sql'):
                    try:
                        async with self.db_pool.acquire() as conn:
                            async with conn.transaction():
                                await conn.execute(migration['rollback_sql'])
                                
                                # Marcar como revertida
                                await conn.execute("""
                                    UPDATE schema_migrations 
                                    SET status = 'rolled_back'
                                    WHERE version = $1
                                """, migration['version'])
                                
                                rollback_count += 1
                                logger.info(f"Rollback da migration {migration['version']} executado")
                    
                    except Exception as e:
                        logger.error(f"Erro no rollback da migration {migration['version']}: {e}")
                        raise e
                else:
                    logger.warning(f"Migration {migration['version']} não possui SQL de rollback")
            
            return {
                'status': 'success',
                'rollback_count': rollback_count,
                'rolled_back_versions': [m['version'] for m in migrations_to_rollback[:rollback_count]]
            }
            
        finally:
            await self.close_db_pool()
    
    async def status(self):
        """Retorna status das migrations"""
        await self.init_db_pool()
        
        try:
            applied_migrations = await self.get_applied_migrations()
            available_migrations = self.get_migration_files()
            
            applied_versions = {m['version']: m for m in applied_migrations}
            available_versions = {m['version']: m for m in available_migrations}
            
            status_info = {
                'total_available': len(available_migrations),
                'total_applied': len([m for m in applied_migrations if m['status'] == 'applied']),
                'total_failed': len([m for m in applied_migrations if m['status'] == 'failed']),
                'pending_migrations': [],
                'applied_migrations': [],
                'failed_migrations': []
            }
            
            # Identificar migrations pendentes
            for version, migration in available_versions.items():
                if version not in applied_versions:
                    status_info['pending_migrations'].append({
                        'version': version,
                        'description': migration['description']
                    })
            
            # Listar migrations aplicadas
            for migration in applied_migrations:
                if migration['status'] == 'applied':
                    status_info['applied_migrations'].append({
                        'version': migration['version'],
                        'description': migration['description'],
                        'applied_at': migration['applied_at'].isoformat()
                    })
                elif migration['status'] == 'failed':
                    status_info['failed_migrations'].append({
                        'version': migration['version'],
                        'description': migration['description']
                    })
            
            return status_info
            
        finally:
            await self.close_db_pool()
    
    def create_migration(self, description, sql_content, rollback_sql=None):
        """Cria um novo arquivo de migration"""
        # Gerar próxima versão
        existing_migrations = self.get_migration_files()
        if existing_migrations:
            last_version = existing_migrations[-1]['version']
            version_parts = last_version.split('.')
            version_parts[-1] = str(int(version_parts[-1]) + 1)
            new_version = '.'.join(version_parts)
        else:
            new_version = '1.0.0'
        
        # Criar nome do arquivo
        safe_description = description.lower().replace(' ', '_').replace('-', '_')
        filename = f"V{new_version}__{safe_description}.sql"
        file_path = self.migrations_dir / filename
        
        # Criar conteúdo do arquivo
        content = f"""-- Migration: {description}
-- Version: {new_version}
-- Created: {datetime.now().isoformat()}

-- Forward migration
{sql_content}

-- Rollback SQL (uncomment and modify as needed)
-- {rollback_sql or '-- No rollback SQL provided'}
"""
        
        # Escrever arquivo
        file_path.write_text(content, encoding='utf-8')
        
        logger.info(f"Migration {filename} criada com sucesso")
        return {
            'version': new_version,
            'filename': filename,
            'file_path': str(file_path)
        }

# CLI para gerenciar migrations
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gerenciador de Migrations')
    parser.add_argument('command', choices=['migrate', 'rollback', 'status', 'create'])
    parser.add_argument('--version', help='Versão alvo para migrate/rollback')
    parser.add_argument('--description', help='Descrição para nova migration')
    parser.add_argument('--sql-file', help='Arquivo SQL para nova migration')
    
    args = parser.parse_args()
    
    # Configuração do banco
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'user': os.getenv('DB_USER', 'viral_user'),
        'password': os.getenv('DB_PASSWORD', 'viral_password'),
        'database': os.getenv('DB_NAME', 'viral_content_db')
    }
    
    manager = MigrationManager(db_config)
    
    try:
        if args.command == 'migrate':
            result = await manager.migrate(args.version)
            print(f"Migration result: {result}")
        
        elif args.command == 'rollback':
            if not args.version:
                print("Versão alvo é obrigatória para rollback")
                return
            result = await manager.rollback(args.version)
            print(f"Rollback result: {result}")
        
        elif args.command == 'status':
            status = await manager.status()
            print("Migration Status:")
            print(f"  Available: {status['total_available']}")
            print(f"  Applied: {status['total_applied']}")
            print(f"  Failed: {status['total_failed']}")
            print(f"  Pending: {len(status['pending_migrations'])}")
            
            if status['pending_migrations']:
                print("\nPending migrations:")
                for migration in status['pending_migrations']:
                    print(f"  - {migration['version']}: {migration['description']}")
        
        elif args.command == 'create':
            if not args.description:
                print("Descrição é obrigatória para criar migration")
                return
            
            sql_content = ""
            if args.sql_file:
                with open(args.sql_file, 'r') as f:
                    sql_content = f.read()
            else:
                sql_content = "-- Add your SQL here"
            
            result = manager.create_migration(args.description, sql_content)
            print(f"Migration criada: {result['filename']}")
    
    except Exception as e:
        logger.error(f"Erro: {e}")
        print(f"Erro: {e}")

if __name__ == '__main__':
    asyncio.run(main())

