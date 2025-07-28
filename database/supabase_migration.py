"""
SUPABASE MIGRATION SCRIPT - VIRAL CONTENT SCRAPER
Script completo para migrar todo o sistema para Supabase

Autor: Manus AI
Data: 28 de Janeiro de 2025
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.supabase_config import supabase_config, SUPABASE_SCHEMAS, RLS_POLICIES, CUSTOM_FUNCTIONS, TRIGGERS
import logging
import json
from datetime import datetime
import asyncio
from typing import Dict, List, Any

class SupabaseMigration:
    """Classe para migração completa para Supabase"""
    
    def __init__(self):
        self.client = supabase_config.get_client(admin=True)
        self.migration_log = []
        
        # Configurar logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def log_step(self, step: str, status: str = "INFO", details: str = ""):
        """Log de cada passo da migração"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'step': step,
            'status': status,
            'details': details
        }
        self.migration_log.append(log_entry)
        
        if status == "ERROR":
            self.logger.error(f"❌ {step}: {details}")
        elif status == "SUCCESS":
            self.logger.info(f"✅ {step}: {details}")
        else:
            self.logger.info(f"🔄 {step}: {details}")
    
    async def run_migration(self):
        """Executa migração completa"""
        self.log_step("INÍCIO DA MIGRAÇÃO", "INFO", "Iniciando migração completa para Supabase")
        
        try:
            # Passo 1: Testar conexão
            await self.test_connection()
            
            # Passo 2: Criar tabelas
            await self.create_tables()
            
            # Passo 3: Criar funções customizadas
            await self.create_custom_functions()
            
            # Passo 4: Criar triggers
            await self.create_triggers()
            
            # Passo 5: Configurar RLS
            await self.setup_rls()
            
            # Passo 6: Inserir dados iniciais
            await self.insert_initial_data()
            
            # Passo 7: Configurar storage
            await self.setup_storage()
            
            # Passo 8: Testar funcionalidades
            await self.test_functionality()
            
            self.log_step("MIGRAÇÃO CONCLUÍDA", "SUCCESS", "Migração completa realizada com sucesso!")
            
        except Exception as e:
            self.log_step("ERRO NA MIGRAÇÃO", "ERROR", str(e))
            raise
        
        finally:
            # Salvar log da migração
            self.save_migration_log()
    
    async def test_connection(self):
        """Testa conexão com Supabase"""
        try:
            self.log_step("Testando Conexão", "INFO", "Verificando conectividade com Supabase")
            
            # Testar conexão básica
            response = self.client.table('_test_connection').select('*').limit(1).execute()
            
            self.log_step("Conexão Testada", "SUCCESS", "Conexão com Supabase estabelecida")
            
        except Exception as e:
            # Erro esperado se tabela não existir
            if "does not exist" in str(e).lower():
                self.log_step("Conexão OK", "SUCCESS", "Conexão funcional (tabelas serão criadas)")
            else:
                self.log_step("Erro de Conexão", "ERROR", str(e))
                raise
    
    async def create_tables(self):
        """Cria todas as tabelas no Supabase"""
        self.log_step("Criando Tabelas", "INFO", f"Criando {len(SUPABASE_SCHEMAS)} tabelas")
        
        for table_name, schema in SUPABASE_SCHEMAS.items():
            try:
                # Construir SQL de criação da tabela
                columns_sql = []
                for col_name, col_def in schema['columns'].items():
                    columns_sql.append(f"{col_name} {col_def}")
                
                create_table_sql = f"""
                CREATE TABLE IF NOT EXISTS {schema['table_name']} (
                    {', '.join(columns_sql)}
                );
                """
                
                # Executar criação da tabela via RPC
                self.client.rpc('exec_sql', {'sql': create_table_sql}).execute()
                
                # Criar índices
                if 'indexes' in schema:
                    for index_sql in schema['indexes']:
                        try:
                            self.client.rpc('exec_sql', {'sql': index_sql}).execute()
                        except Exception as idx_error:
                            if "already exists" not in str(idx_error).lower():
                                self.log_step(f"Erro no índice {table_name}", "ERROR", str(idx_error))
                
                self.log_step(f"Tabela {table_name}", "SUCCESS", "Criada com sucesso")
                
            except Exception as e:
                if "already exists" in str(e).lower():
                    self.log_step(f"Tabela {table_name}", "INFO", "Já existe")
                else:
                    self.log_step(f"Erro na tabela {table_name}", "ERROR", str(e))
                    # Continuar com outras tabelas
    
    async def create_custom_functions(self):
        """Cria funções SQL customizadas"""
        self.log_step("Criando Funções", "INFO", f"Criando {len(CUSTOM_FUNCTIONS)} funções customizadas")
        
        for i, function_sql in enumerate(CUSTOM_FUNCTIONS):
            try:
                self.client.rpc('exec_sql', {'sql': function_sql}).execute()
                self.log_step(f"Função {i+1}", "SUCCESS", "Criada com sucesso")
                
            except Exception as e:
                if "already exists" in str(e).lower():
                    self.log_step(f"Função {i+1}", "INFO", "Já existe")
                else:
                    self.log_step(f"Erro na função {i+1}", "ERROR", str(e))
    
    async def create_triggers(self):
        """Cria triggers"""
        self.log_step("Criando Triggers", "INFO", f"Criando {len(TRIGGERS)} triggers")
        
        for trigger_info in TRIGGERS:
            try:
                self.client.rpc('exec_sql', {'sql': trigger_info['trigger']}).execute()
                self.log_step(f"Trigger {trigger_info['table']}", "SUCCESS", "Criado com sucesso")
                
            except Exception as e:
                if "already exists" in str(e).lower():
                    self.log_step(f"Trigger {trigger_info['table']}", "INFO", "Já existe")
                else:
                    self.log_step(f"Erro no trigger {trigger_info['table']}", "ERROR", str(e))
    
    async def setup_rls(self):
        """Configura Row Level Security"""
        self.log_step("Configurando RLS", "INFO", "Configurando políticas de segurança")
        
        for table_name, policies in RLS_POLICIES.items():
            try:
                # Habilitar RLS na tabela
                enable_rls_sql = f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;"
                self.client.rpc('exec_sql', {'sql': enable_rls_sql}).execute()
                
                # Criar políticas
                for policy in policies:
                    policy_sql = f"""
                    CREATE POLICY "{policy['name']}" ON {table_name}
                    FOR {policy['command']} USING ({policy['policy']});
                    """
                    
                    try:
                        self.client.rpc('exec_sql', {'sql': policy_sql}).execute()
                    except Exception as policy_error:
                        if "already exists" not in str(policy_error).lower():
                            self.log_step(f"Erro na política {policy['name']}", "ERROR", str(policy_error))
                
                self.log_step(f"RLS {table_name}", "SUCCESS", f"{len(policies)} políticas criadas")
                
            except Exception as e:
                self.log_step(f"Erro RLS {table_name}", "ERROR", str(e))
    
    async def insert_initial_data(self):
        """Insere dados iniciais de exemplo"""
        self.log_step("Inserindo Dados Iniciais", "INFO", "Adicionando dados de exemplo")
        
        try:
            # Inserir usuário admin
            admin_user = {
                'email': 'admin@viralcontentscraper.com',
                'name': 'Administrador',
                'role': 'admin',
                'permissions': {
                    'scrapers': ['read', 'write', 'execute'],
                    'ai_agents': ['read', 'write', 'configure'],
                    'system_doctor': ['read', 'write', 'control'],
                    'database': ['read', 'write', 'backup'],
                    'users': ['read', 'write', 'delete'],
                    'settings': ['read', 'write']
                },
                'preferences': {
                    'theme': 'dark',
                    'notifications': True,
                    'auto_refresh': 30
                }
            }
            
            self.client.table('users').upsert(admin_user).execute()
            
            # Inserir dados de exemplo de conteúdo viral
            sample_content = [
                {
                    'platform': 'instagram',
                    'content_type': 'reel',
                    'content_text': 'Como gerar milhões com IA em 2025 🚀',
                    'engagement_metrics': {
                        'likes': 45672,
                        'comments': 1234,
                        'shares': 892,
                        'views': 234567
                    },
                    'viral_score': 94.2,
                    'metadata': {
                        'hashtags': ['#ia', '#milhoes', '#2025'],
                        'duration': 30,
                        'has_music': True
                    }
                },
                {
                    'platform': 'tiktok',
                    'content_type': 'video',
                    'content_text': 'Segredo bilionário revelado! 💎',
                    'engagement_metrics': {
                        'likes': 89234,
                        'comments': 2456,
                        'shares': 1789,
                        'views': 456789
                    },
                    'viral_score': 96.8,
                    'metadata': {
                        'hashtags': ['#segredo', '#bilionario', '#revelado'],
                        'duration': 15,
                        'has_effects': True
                    }
                }
            ]
            
            for content in sample_content:
                self.client.table('viral_content').insert(content).execute()
            
            # Inserir template viral de exemplo
            sample_template = {
                'template_name': 'Instagram Reel Motivacional',
                'platform': 'instagram',
                'template_type': 'reel',
                'visual_structure': {
                    'layout': 'vertical_video',
                    'color_scheme': {
                        'primary': '#FF6B6B',
                        'secondary': '#4ECDC4',
                        'accent': '#FFE66D'
                    },
                    'typography': {
                        'headline_font': 'Montserrat Bold',
                        'body_font': 'Open Sans',
                        'sizes': {'headline': 36, 'body': 20}
                    }
                },
                'content_formulas': [
                    {
                        'section': 'hook',
                        'pattern': '[PROBLEMA] que [CONSEQUÊNCIA] em [TEMPO]'
                    },
                    {
                        'section': 'solution',
                        'pattern': 'Descubra como [SOLUÇÃO] pode [BENEFÍCIO]'
                    }
                ],
                'viral_score': 92.5,
                'adaptability_score': 88.3,
                'usability_score': 91.7
            }
            
            self.client.table('viral_templates').insert(sample_template).execute()
            
            self.log_step("Dados Iniciais", "SUCCESS", "Dados de exemplo inseridos")
            
        except Exception as e:
            self.log_step("Erro nos Dados Iniciais", "ERROR", str(e))
    
    async def setup_storage(self):
        """Configura storage para arquivos"""
        self.log_step("Configurando Storage", "INFO", "Criando buckets de armazenamento")
        
        try:
            # Criar buckets
            buckets = [
                {
                    'id': 'viral-content-media',
                    'name': 'viral-content-media',
                    'public': False
                },
                {
                    'id': 'template-images',
                    'name': 'template-images', 
                    'public': True
                },
                {
                    'id': 'system-backups',
                    'name': 'system-backups',
                    'public': False
                }
            ]
            
            for bucket in buckets:
                try:
                    self.client.storage.create_bucket(bucket['id'], {'public': bucket['public']})
                    self.log_step(f"Bucket {bucket['id']}", "SUCCESS", "Criado com sucesso")
                except Exception as bucket_error:
                    if "already exists" in str(bucket_error).lower():
                        self.log_step(f"Bucket {bucket['id']}", "INFO", "Já existe")
                    else:
                        self.log_step(f"Erro no bucket {bucket['id']}", "ERROR", str(bucket_error))
            
        except Exception as e:
            self.log_step("Erro no Storage", "ERROR", str(e))
    
    async def test_functionality(self):
        """Testa funcionalidades básicas"""
        self.log_step("Testando Funcionalidades", "INFO", "Verificando operações básicas")
        
        try:
            # Testar inserção
            test_data = {
                'component': 'migration_test',
                'level': 'info',
                'message': 'Teste de funcionalidade da migração',
                'metadata': {'test': True}
            }
            
            result = self.client.table('system_logs').insert(test_data).execute()
            
            # Testar consulta
            logs = self.client.table('system_logs').select('*').limit(1).execute()
            
            # Testar função customizada
            trending = self.client.rpc('get_trending_content', {
                'platform_filter': 'instagram',
                'hours_back': 24,
                'min_viral_score': 90
            }).execute()
            
            self.log_step("Testes Funcionais", "SUCCESS", "Todas as operações funcionando")
            
        except Exception as e:
            self.log_step("Erro nos Testes", "ERROR", str(e))
    
    def save_migration_log(self):
        """Salva log da migração"""
        try:
            log_file = f"/home/ubuntu/viral_content_scraper/logs/migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            # Criar diretório se não existir
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump(self.migration_log, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"📄 Log da migração salvo em: {log_file}")
            
        except Exception as e:
            self.logger.error(f"Erro ao salvar log: {str(e)}")
    
    def print_summary(self):
        """Imprime resumo da migração"""
        print("\n" + "="*70)
        print("🎉 RESUMO DA MIGRAÇÃO PARA SUPABASE")
        print("="*70)
        
        success_count = len([log for log in self.migration_log if log['status'] == 'SUCCESS'])
        error_count = len([log for log in self.migration_log if log['status'] == 'ERROR'])
        
        print(f"✅ Passos concluídos com sucesso: {success_count}")
        print(f"❌ Erros encontrados: {error_count}")
        print(f"📊 Total de operações: {len(self.migration_log)}")
        
        print(f"\n🔗 URL do projeto: {supabase_config.url}")
        print(f"🗄️ Tabelas criadas: {len(SUPABASE_SCHEMAS)}")
        print(f"⚙️ Funções customizadas: {len(CUSTOM_FUNCTIONS)}")
        print(f"🔒 Políticas RLS: {sum(len(policies) for policies in RLS_POLICIES.values())}")
        
        if error_count == 0:
            print("\n🎯 MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
            print("Sua ferramenta bilionária está agora 100% na nuvem!")
        else:
            print(f"\n⚠️ Migração concluída com {error_count} erros")
            print("Verifique os logs para detalhes dos erros")
        
        print("="*70)

async def main():
    """Função principal"""
    print("🚀 INICIANDO MIGRAÇÃO PARA SUPABASE")
    print("="*50)
    
    migration = SupabaseMigration()
    
    try:
        await migration.run_migration()
        migration.print_summary()
        
    except Exception as e:
        print(f"\n💥 ERRO CRÍTICO NA MIGRAÇÃO: {str(e)}")
        migration.print_summary()
        return False
    
    return True

if __name__ == "__main__":
    # Executar migração
    success = asyncio.run(main())
    
    if success:
        print("\n🎉 Migração concluída! Sua ferramenta está pronta na nuvem!")
        exit(0)
    else:
        print("\n❌ Migração falhou. Verifique os logs.")
        exit(1)

