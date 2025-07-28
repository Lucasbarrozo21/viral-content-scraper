"""
SUPABASE CLIENT - VIRAL CONTENT SCRAPER
Cliente integrado para todas as operações com Supabase

Autor: Manus AI
Data: 28 de Janeiro de 2025
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime, timedelta

class ViralContentSupabaseClient:
    """Cliente Supabase para operações da ferramenta viral"""
    
    def __init__(self):
        # Configurações Supabase
        self.url = "https://kkzbiteakxsexxwiwtom.supabase.co"
        self.anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMyNjgsImV4cCI6MjA2OTIxOTI2OH0.Yd03_LE1cgEM3ik5WG7zCx9rG77zJc1Ez6-H8BgGkHk"
        self.service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzI2OCwiZXhwIjoyMDY5MjE5MjY4fQ.-EwB36xZXPIAstCnNM38RM-Lv8lxJG2vhCc6djyp2-E"
        
        # Clientes
        self.client = create_client(self.url, self.anon_key)
        self.admin_client = create_client(self.url, self.service_role_key)
        
        # Logger
        self.logger = logging.getLogger(__name__)
    
    # ========================================================================
    # OPERAÇÕES COM CONTEÚDO VIRAL
    # ========================================================================
    
    def save_viral_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva conteúdo viral no Supabase"""
        try:
            # Calcular viral score se não fornecido
            if 'viral_score' not in content_data and 'engagement_metrics' in content_data:
                content_data['viral_score'] = self.calculate_viral_score(
                    content_data['engagement_metrics'],
                    content_data.get('platform', 'unknown')
                )
            
            # Inserir no Supabase
            result = self.admin_client.table('viral_content').insert(content_data).execute()
            
            self.logger.info(f"✅ Conteúdo viral salvo: {content_data.get('platform', 'unknown')}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar conteúdo viral: {str(e)}")
            return {}
    
    def get_viral_content(self, 
                         platform: Optional[str] = None,
                         min_viral_score: float = 0,
                         limit: int = 100) -> List[Dict[str, Any]]:
        """Obtém conteúdo viral do Supabase"""
        try:
            query = self.client.table('viral_content').select('*')
            
            if platform:
                query = query.eq('platform', platform)
            
            if min_viral_score > 0:
                query = query.gte('viral_score', min_viral_score)
            
            result = query.order('viral_score', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter conteúdo viral: {str(e)}")
            return []
    
    def get_trending_content(self, 
                           platform: Optional[str] = None,
                           hours_back: int = 24,
                           min_viral_score: float = 70) -> List[Dict[str, Any]]:
        """Obtém conteúdo trending usando função SQL"""
        try:
            result = self.client.rpc('get_trending_content', {
                'platform_filter': platform,
                'hours_back': hours_back,
                'min_viral_score': min_viral_score
            }).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter conteúdo trending: {str(e)}")
            return []
    
    # ========================================================================
    # OPERAÇÕES COM MEMÓRIA EVOLUTIVA DOS AGENTES IA
    # ========================================================================
    
    def save_ai_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva memória evolutiva dos agentes IA"""
        try:
            result = self.admin_client.table('ai_memory_evolutionary').insert(memory_data).execute()
            
            self.logger.info(f"✅ Memória IA salva: {memory_data.get('agent_name', 'unknown')}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar memória IA: {str(e)}")
            return {}
    
    def get_ai_memory(self, 
                     agent_name: str,
                     memory_type: Optional[str] = None,
                     limit: int = 100) -> List[Dict[str, Any]]:
        """Obtém memória evolutiva de um agente"""
        try:
            query = self.client.table('ai_memory_evolutionary').select('*').eq('agent_name', agent_name)
            
            if memory_type:
                query = query.eq('memory_type', memory_type)
            
            result = query.order('confidence_score', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter memória IA: {str(e)}")
            return []
    
    def update_ai_memory_success_rate(self, memory_id: str, success_rate: float):
        """Atualiza taxa de sucesso da memória IA"""
        try:
            result = self.admin_client.table('ai_memory_evolutionary').update({
                'success_rate': success_rate,
                'learning_iteration': 'learning_iteration + 1'
            }).eq('id', memory_id).execute()
            
            self.logger.info(f"✅ Taxa de sucesso atualizada: {memory_id}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao atualizar taxa de sucesso: {str(e)}")
            return {}
    
    # ========================================================================
    # OPERAÇÕES COM TEMPLATES VIRAIS
    # ========================================================================
    
    def save_viral_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva template viral"""
        try:
            result = self.admin_client.table('viral_templates').insert(template_data).execute()
            
            self.logger.info(f"✅ Template viral salvo: {template_data.get('template_name', 'unknown')}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar template: {str(e)}")
            return {}
    
    def get_viral_templates(self, 
                          platform: Optional[str] = None,
                          min_viral_score: float = 0,
                          limit: int = 50) -> List[Dict[str, Any]]:
        """Obtém templates virais"""
        try:
            query = self.client.table('viral_templates').select('*')
            
            if platform:
                query = query.eq('platform', platform)
            
            if min_viral_score > 0:
                query = query.gte('viral_score', min_viral_score)
            
            result = query.order('viral_score', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter templates: {str(e)}")
            return []
    
    def increment_template_usage(self, template_id: str):
        """Incrementa contador de uso do template"""
        try:
            # Primeiro obter o template atual
            current = self.client.table('viral_templates').select('usage_count').eq('id', template_id).execute()
            
            if current.data:
                new_count = (current.data[0].get('usage_count', 0) or 0) + 1
                
                result = self.admin_client.table('viral_templates').update({
                    'usage_count': new_count
                }).eq('id', template_id).execute()
                
                self.logger.info(f"✅ Uso do template incrementado: {template_id}")
                return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao incrementar uso do template: {str(e)}")
            return {}
    
    # ========================================================================
    # OPERAÇÕES COM ANÁLISES DE CONTEÚDO
    # ========================================================================
    
    def save_content_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva análise de conteúdo"""
        try:
            result = self.admin_client.table('content_analysis').insert(analysis_data).execute()
            
            self.logger.info(f"✅ Análise salva: {analysis_data.get('agent_name', 'unknown')}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar análise: {str(e)}")
            return {}
    
    def get_content_analysis(self, 
                           content_id: Optional[str] = None,
                           agent_name: Optional[str] = None,
                           limit: int = 100) -> List[Dict[str, Any]]:
        """Obtém análises de conteúdo"""
        try:
            query = self.client.table('content_analysis').select('*')
            
            if content_id:
                query = query.eq('content_id', content_id)
            
            if agent_name:
                query = query.eq('agent_name', agent_name)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter análises: {str(e)}")
            return []
    
    # ========================================================================
    # OPERAÇÕES COM JOBS DE SCRAPING
    # ========================================================================
    
    def save_scraping_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva job de scraping"""
        try:
            result = self.admin_client.table('scraping_jobs').insert(job_data).execute()
            
            self.logger.info(f"✅ Job de scraping salvo: {job_data.get('platform', 'unknown')}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar job: {str(e)}")
            return {}
    
    def update_scraping_job(self, job_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza job de scraping"""
        try:
            result = self.admin_client.table('scraping_jobs').update(update_data).eq('id', job_id).execute()
            
            self.logger.info(f"✅ Job atualizado: {job_id}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao atualizar job: {str(e)}")
            return {}
    
    def get_scraping_jobs(self, 
                         platform: Optional[str] = None,
                         status: Optional[str] = None,
                         limit: int = 100) -> List[Dict[str, Any]]:
        """Obtém jobs de scraping"""
        try:
            query = self.client.table('scraping_jobs').select('*')
            
            if platform:
                query = query.eq('platform', platform)
            
            if status:
                query = query.eq('status', status)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter jobs: {str(e)}")
            return []
    
    # ========================================================================
    # OPERAÇÕES COM SYSTEM DOCTOR
    # ========================================================================
    
    def save_system_doctor_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva ação do System Doctor"""
        try:
            result = self.admin_client.table('system_doctor_actions').insert(action_data).execute()
            
            self.logger.info(f"✅ Ação do System Doctor salva: {action_data.get('component', 'unknown')}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar ação do System Doctor: {str(e)}")
            return {}
    
    def get_system_doctor_actions(self, 
                                component: Optional[str] = None,
                                limit: int = 100) -> List[Dict[str, Any]]:
        """Obtém ações do System Doctor"""
        try:
            query = self.client.table('system_doctor_actions').select('*')
            
            if component:
                query = query.eq('component', component)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter ações do System Doctor: {str(e)}")
            return []
    
    # ========================================================================
    # OPERAÇÕES COM LOGS
    # ========================================================================
    
    def save_system_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva log do sistema"""
        try:
            result = self.admin_client.table('system_logs').insert(log_data).execute()
            
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar log: {str(e)}")
            return {}
    
    def get_system_logs(self, 
                       component: Optional[str] = None,
                       level: Optional[str] = None,
                       limit: int = 100) -> List[Dict[str, Any]]:
        """Obtém logs do sistema"""
        try:
            query = self.client.table('system_logs').select('*')
            
            if component:
                query = query.eq('component', component)
            
            if level:
                query = query.eq('level', level)
            
            result = query.order('timestamp', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter logs: {str(e)}")
            return []
    
    # ========================================================================
    # OPERAÇÕES COM USUÁRIOS
    # ========================================================================
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Obtém usuário por email"""
        try:
            result = self.client.table('users').select('*').eq('email', email).execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter usuário: {str(e)}")
            return None
    
    def update_user_last_login(self, user_id: str):
        """Atualiza último login do usuário"""
        try:
            result = self.admin_client.table('users').update({
                'last_login': datetime.now().isoformat()
            }).eq('id', user_id).execute()
            
            return result.data[0] if result.data else {}
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao atualizar último login: {str(e)}")
            return {}
    
    # ========================================================================
    # FUNÇÕES UTILITÁRIAS
    # ========================================================================
    
    def calculate_viral_score(self, engagement_metrics: Dict[str, Any], platform: str) -> float:
        """Calcula score viral baseado nas métricas"""
        try:
            likes = engagement_metrics.get('likes', 0)
            comments = engagement_metrics.get('comments', 0)
            shares = engagement_metrics.get('shares', 0)
            views = max(engagement_metrics.get('views', 1), 1)  # Evitar divisão por zero
            
            # Fórmula baseada na plataforma
            if platform == 'instagram':
                score = (likes * 1.0 + comments * 3.0 + shares * 5.0) / views * 100
            elif platform == 'tiktok':
                score = (likes * 0.8 + comments * 2.5 + shares * 4.0) / views * 100
            elif platform == 'youtube':
                score = (likes * 1.2 + comments * 4.0 + shares * 6.0) / views * 100
            else:
                score = (likes * 1.0 + comments * 2.0 + shares * 3.0) / views * 100
            
            # Normalizar (0-100)
            return min(score, 100.0)
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao calcular viral score: {str(e)}")
            return 0.0
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Obtém estatísticas para o dashboard"""
        try:
            # Contar conteúdo por plataforma
            content_stats = {}
            platforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin', 'twitter']
            
            for platform in platforms:
                result = self.client.table('viral_content').select('id', count='exact').eq('platform', platform).execute()
                content_stats[platform] = result.count or 0
            
            # Contar templates
            templates_result = self.client.table('viral_templates').select('id', count='exact').execute()
            templates_count = templates_result.count or 0
            
            # Contar análises hoje
            today = datetime.now().strftime('%Y-%m-%d')
            analyses_result = self.client.table('content_analysis').select('id', count='exact').gte('created_at', today).execute()
            analyses_today = analyses_result.count or 0
            
            # Jobs de scraping ativos
            active_jobs_result = self.client.table('scraping_jobs').select('id', count='exact').eq('status', 'running').execute()
            active_jobs = active_jobs_result.count or 0
            
            return {
                'content_by_platform': content_stats,
                'total_templates': templates_count,
                'analyses_today': analyses_today,
                'active_scraping_jobs': active_jobs,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao obter estatísticas: {str(e)}")
            return {}
    
    def test_connection(self) -> bool:
        """Testa conexão com Supabase"""
        try:
            result = self.client.table('users').select('id').limit(1).execute()
            self.logger.info("✅ Conexão com Supabase OK")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Erro na conexão com Supabase: {str(e)}")
            return False

# Instância global
supabase_client = ViralContentSupabaseClient()

# Teste de conexão na inicialização
if __name__ == "__main__":
    print("🔗 Testando conexão com Supabase...")
    if supabase_client.test_connection():
        print("✅ Conexão estabelecida com sucesso!")
        
        # Testar algumas operações
        stats = supabase_client.get_dashboard_stats()
        print(f"📊 Estatísticas: {stats}")
        
    else:
        print("❌ Falha na conexão!")

