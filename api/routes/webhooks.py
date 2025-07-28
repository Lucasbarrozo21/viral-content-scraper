"""
SISTEMA DE WEBHOOKS
Notificações em tempo real para eventos do sistema de scraping inteligente

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

from flask import Blueprint, request, jsonify
from functools import wraps
import json
import os
import requests
import hashlib
import hmac
from datetime import datetime, timedelta
import logging
import threading
import time
from queue import Queue

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

webhooks_bp = Blueprint('webhooks', __name__)

class WebhookManager:
    def __init__(self):
        self.webhooks_dir = '/home/ubuntu/viral_content_scraper/storage/webhooks'
        self.ensure_webhooks_dir()
        self.active_webhooks = {}
        self.event_queue = Queue()
        self.delivery_stats = {
            'total_sent': 0,
            'successful': 0,
            'failed': 0,
            'retries': 0
        }
        
        # Iniciar worker thread para processamento de webhooks
        self.start_webhook_worker()
    
    def ensure_webhooks_dir(self):
        os.makedirs(self.webhooks_dir, exist_ok=True)
        os.makedirs(f'{self.webhooks_dir}/logs', exist_ok=True)
    
    def start_webhook_worker(self):
        """Iniciar thread worker para processamento de webhooks"""
        def webhook_worker():
            while True:
                try:
                    if not self.event_queue.empty():
                        event_data = self.event_queue.get()
                        self.process_webhook_event(event_data)
                        self.event_queue.task_done()
                    else:
                        time.sleep(1)  # Aguardar novos eventos
                except Exception as e:
                    logger.error(f"Erro no webhook worker: {e}")
                    time.sleep(5)
        
        worker_thread = threading.Thread(target=webhook_worker, daemon=True)
        worker_thread.start()
        logger.info("Webhook worker iniciado")
    
    def register_webhook(self, webhook_data):
        """Registrar novo webhook"""
        try:
            webhook_id = f"webhook_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            webhook = {
                'webhook_id': webhook_id,
                'url': webhook_data['url'],
                'events': webhook_data.get('events', []),
                'secret': webhook_data.get('secret', ''),
                'active': True,
                'created_at': datetime.now().isoformat(),
                'last_triggered': None,
                'delivery_count': 0,
                'failure_count': 0,
                'metadata': webhook_data.get('metadata', {}),
                'retry_config': {
                    'max_retries': webhook_data.get('max_retries', 3),
                    'retry_delay': webhook_data.get('retry_delay', 5),
                    'timeout': webhook_data.get('timeout', 30)
                }
            }
            
            # Salvar webhook
            webhook_file = os.path.join(self.webhooks_dir, f"{webhook_id}.json")
            with open(webhook_file, 'w', encoding='utf-8') as f:
                json.dump(webhook, f, indent=2, ensure_ascii=False)
            
            # Adicionar aos webhooks ativos
            self.active_webhooks[webhook_id] = webhook
            
            return webhook_id, webhook
            
        except Exception as e:
            logger.error(f"Erro ao registrar webhook: {e}")
            return None, None
    
    def get_webhook(self, webhook_id):
        """Buscar webhook por ID"""
        try:
            if webhook_id in self.active_webhooks:
                return self.active_webhooks[webhook_id]
            
            webhook_file = os.path.join(self.webhooks_dir, f"{webhook_id}.json")
            if os.path.exists(webhook_file):
                with open(webhook_file, 'r', encoding='utf-8') as f:
                    webhook = json.load(f)
                    self.active_webhooks[webhook_id] = webhook
                    return webhook
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar webhook {webhook_id}: {e}")
            return None
    
    def get_all_webhooks(self):
        """Buscar todos os webhooks"""
        try:
            webhooks = []
            
            for filename in os.listdir(self.webhooks_dir):
                if filename.endswith('.json') and filename.startswith('webhook_'):
                    webhook_file = os.path.join(self.webhooks_dir, filename)
                    with open(webhook_file, 'r', encoding='utf-8') as f:
                        webhook = json.load(f)
                        webhooks.append(webhook)
            
            return webhooks
            
        except Exception as e:
            logger.error(f"Erro ao buscar webhooks: {e}")
            return []
    
    def update_webhook(self, webhook_id, update_data):
        """Atualizar webhook existente"""
        try:
            webhook = self.get_webhook(webhook_id)
            if not webhook:
                return False
            
            # Atualizar campos
            for key, value in update_data.items():
                if key in ['url', 'events', 'secret', 'active', 'metadata', 'retry_config']:
                    webhook[key] = value
            
            webhook['updated_at'] = datetime.now().isoformat()
            
            # Salvar alterações
            webhook_file = os.path.join(self.webhooks_dir, f"{webhook_id}.json")
            with open(webhook_file, 'w', encoding='utf-8') as f:
                json.dump(webhook, f, indent=2, ensure_ascii=False)
            
            # Atualizar cache
            self.active_webhooks[webhook_id] = webhook
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atualizar webhook {webhook_id}: {e}")
            return False
    
    def delete_webhook(self, webhook_id):
        """Deletar webhook"""
        try:
            webhook_file = os.path.join(self.webhooks_dir, f"{webhook_id}.json")
            if os.path.exists(webhook_file):
                os.remove(webhook_file)
            
            if webhook_id in self.active_webhooks:
                del self.active_webhooks[webhook_id]
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar webhook {webhook_id}: {e}")
            return False
    
    def trigger_event(self, event_type, event_data):
        """Disparar evento para webhooks relevantes"""
        try:
            event = {
                'event_id': f"event_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
                'event_type': event_type,
                'timestamp': datetime.now().isoformat(),
                'data': event_data
            }
            
            # Adicionar à fila de processamento
            self.event_queue.put(event)
            
            logger.info(f"Evento {event_type} adicionado à fila de webhooks")
            
        except Exception as e:
            logger.error(f"Erro ao disparar evento {event_type}: {e}")
    
    def process_webhook_event(self, event):
        """Processar evento e enviar para webhooks relevantes"""
        try:
            event_type = event['event_type']
            
            # Buscar webhooks que devem receber este evento
            relevant_webhooks = []
            for webhook_id, webhook in self.active_webhooks.items():
                if webhook.get('active', False) and (
                    not webhook.get('events') or  # Sem filtro de eventos
                    event_type in webhook.get('events', []) or
                    'all' in webhook.get('events', [])
                ):
                    relevant_webhooks.append((webhook_id, webhook))
            
            # Enviar para cada webhook relevante
            for webhook_id, webhook in relevant_webhooks:
                self.send_webhook(webhook_id, webhook, event)
            
        except Exception as e:
            logger.error(f"Erro ao processar evento webhook: {e}")
    
    def send_webhook(self, webhook_id, webhook, event):
        """Enviar webhook para URL específica"""
        try:
            url = webhook['url']
            secret = webhook.get('secret', '')
            timeout = webhook.get('retry_config', {}).get('timeout', 30)
            
            # Preparar payload
            payload = {
                'webhook_id': webhook_id,
                'event': event,
                'delivery_attempt': 1,
                'timestamp': datetime.now().isoformat()
            }
            
            payload_json = json.dumps(payload, ensure_ascii=False)
            
            # Gerar assinatura se secret fornecido
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'ViralScraper-Webhook/1.0',
                'X-Webhook-Event': event['event_type'],
                'X-Webhook-Delivery': event['event_id']
            }
            
            if secret:
                signature = hmac.new(
                    secret.encode('utf-8'),
                    payload_json.encode('utf-8'),
                    hashlib.sha256
                ).hexdigest()
                headers['X-Webhook-Signature'] = f'sha256={signature}'
            
            # Tentar enviar
            max_retries = webhook.get('retry_config', {}).get('max_retries', 3)
            retry_delay = webhook.get('retry_config', {}).get('retry_delay', 5)
            
            for attempt in range(max_retries + 1):
                try:
                    payload['delivery_attempt'] = attempt + 1
                    payload_json = json.dumps(payload, ensure_ascii=False)
                    
                    response = requests.post(
                        url,
                        data=payload_json,
                        headers=headers,
                        timeout=timeout
                    )
                    
                    if response.status_code == 200:
                        # Sucesso
                        self.log_webhook_delivery(webhook_id, event, 'success', response.status_code, attempt + 1)
                        self.update_webhook_stats(webhook_id, True)
                        self.delivery_stats['successful'] += 1
                        break
                    else:
                        # Erro HTTP
                        if attempt == max_retries:
                            self.log_webhook_delivery(webhook_id, event, 'failed', response.status_code, attempt + 1, response.text)
                            self.update_webhook_stats(webhook_id, False)
                            self.delivery_stats['failed'] += 1
                        else:
                            self.delivery_stats['retries'] += 1
                            time.sleep(retry_delay)
                
                except requests.exceptions.RequestException as req_error:
                    if attempt == max_retries:
                        self.log_webhook_delivery(webhook_id, event, 'failed', 0, attempt + 1, str(req_error))
                        self.update_webhook_stats(webhook_id, False)
                        self.delivery_stats['failed'] += 1
                    else:
                        self.delivery_stats['retries'] += 1
                        time.sleep(retry_delay)
            
            self.delivery_stats['total_sent'] += 1
            
        except Exception as e:
            logger.error(f"Erro ao enviar webhook {webhook_id}: {e}")
            self.log_webhook_delivery(webhook_id, event, 'error', 0, 1, str(e))
    
    def log_webhook_delivery(self, webhook_id, event, status, status_code, attempt, error_message=None):
        """Registrar log de entrega de webhook"""
        try:
            log_entry = {
                'webhook_id': webhook_id,
                'event_id': event['event_id'],
                'event_type': event['event_type'],
                'status': status,
                'status_code': status_code,
                'attempt': attempt,
                'timestamp': datetime.now().isoformat(),
                'error_message': error_message
            }
            
            # Salvar log
            log_file = os.path.join(self.webhooks_dir, 'logs', f"{webhook_id}_deliveries.jsonl")
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
            
        except Exception as e:
            logger.error(f"Erro ao registrar log de webhook: {e}")
    
    def update_webhook_stats(self, webhook_id, success):
        """Atualizar estatísticas do webhook"""
        try:
            webhook = self.get_webhook(webhook_id)
            if webhook:
                webhook['delivery_count'] = webhook.get('delivery_count', 0) + 1
                webhook['last_triggered'] = datetime.now().isoformat()
                
                if not success:
                    webhook['failure_count'] = webhook.get('failure_count', 0) + 1
                
                # Salvar alterações
                webhook_file = os.path.join(self.webhooks_dir, f"{webhook_id}.json")
                with open(webhook_file, 'w', encoding='utf-8') as f:
                    json.dump(webhook, f, indent=2, ensure_ascii=False)
                
                self.active_webhooks[webhook_id] = webhook
            
        except Exception as e:
            logger.error(f"Erro ao atualizar stats do webhook {webhook_id}: {e}")
    
    def get_webhook_logs(self, webhook_id, limit=100):
        """Buscar logs de entrega de um webhook"""
        try:
            log_file = os.path.join(self.webhooks_dir, 'logs', f"{webhook_id}_deliveries.jsonl")
            logs = []
            
            if os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            logs.append(json.loads(line.strip()))
                
                # Retornar os mais recentes
                logs.reverse()
                return logs[:limit]
            
            return []
            
        except Exception as e:
            logger.error(f"Erro ao buscar logs do webhook {webhook_id}: {e}")
            return []

# Instanciar gerenciador
webhook_manager = WebhookManager()

@webhooks_bp.route('/webhooks', methods=['POST'])
def register_webhook():
    """
    Registrar novo webhook
    
    Body:
    {
        "url": "https://example.com/webhook",
        "events": ["content_analyzed", "viral_content_found", "scraping_completed"],
        "secret": "optional_secret_for_signature",
        "max_retries": 3,
        "retry_delay": 5,
        "timeout": 30,
        "metadata": {
            "description": "Webhook para notificações de conteúdo viral",
            "owner": "user@example.com"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('url'):
            return jsonify({
                'success': False,
                'error': 'URL do webhook é obrigatória',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Validar URL
        url = data['url']
        if not url.startswith(('http://', 'https://')):
            return jsonify({
                'success': False,
                'error': 'URL deve começar com http:// ou https://',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Registrar webhook
        webhook_id, webhook = webhook_manager.register_webhook(data)
        
        if not webhook_id:
            return jsonify({
                'success': False,
                'error': 'Erro ao registrar webhook',
                'timestamp': datetime.now().isoformat()
            }), 500
        
        return jsonify({
            'success': True,
            'data': webhook,
            'message': 'Webhook registrado com sucesso',
            'timestamp': datetime.now().isoformat()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao registrar webhook: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks', methods=['GET'])
def get_webhooks():
    """Listar todos os webhooks"""
    try:
        webhooks = webhook_manager.get_all_webhooks()
        
        # Calcular estatísticas
        total_webhooks = len(webhooks)
        active_webhooks = len([w for w in webhooks if w.get('active', False)])
        total_deliveries = sum(w.get('delivery_count', 0) for w in webhooks)
        
        return jsonify({
            'success': True,
            'data': {
                'webhooks': webhooks,
                'summary': {
                    'total_webhooks': total_webhooks,
                    'active_webhooks': active_webhooks,
                    'total_deliveries': total_deliveries,
                    'delivery_stats': webhook_manager.delivery_stats
                }
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar webhooks: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/<webhook_id>', methods=['GET'])
def get_webhook(webhook_id):
    """Buscar webhook específico"""
    try:
        webhook = webhook_manager.get_webhook(webhook_id)
        
        if not webhook:
            return jsonify({
                'success': False,
                'error': 'Webhook não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        # Buscar logs recentes
        recent_logs = webhook_manager.get_webhook_logs(webhook_id, 10)
        
        return jsonify({
            'success': True,
            'data': {
                'webhook': webhook,
                'recent_deliveries': recent_logs
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar webhook {webhook_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/<webhook_id>', methods=['PUT'])
def update_webhook(webhook_id):
    """
    Atualizar webhook existente
    
    Body:
    {
        "url": "https://newurl.com/webhook",
        "events": ["content_analyzed"],
        "active": false
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados de atualização são obrigatórios',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        success = webhook_manager.update_webhook(webhook_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Webhook não encontrado ou erro na atualização',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        updated_webhook = webhook_manager.get_webhook(webhook_id)
        
        return jsonify({
            'success': True,
            'data': updated_webhook,
            'message': 'Webhook atualizado com sucesso',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao atualizar webhook {webhook_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/<webhook_id>', methods=['DELETE'])
def delete_webhook(webhook_id):
    """Deletar webhook"""
    try:
        success = webhook_manager.delete_webhook(webhook_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Webhook não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        return jsonify({
            'success': True,
            'message': f'Webhook {webhook_id} deletado com sucesso',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar webhook {webhook_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/<webhook_id>/test', methods=['POST'])
def test_webhook(webhook_id):
    """
    Testar webhook com evento de exemplo
    
    Body:
    {
        "event_type": "test_event",
        "test_data": {
            "message": "Este é um teste do webhook"
        }
    }
    """
    try:
        data = request.get_json() or {}
        
        webhook = webhook_manager.get_webhook(webhook_id)
        if not webhook:
            return jsonify({
                'success': False,
                'error': 'Webhook não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        # Criar evento de teste
        test_event = {
            'event_id': f"test_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            'event_type': data.get('event_type', 'webhook_test'),
            'timestamp': datetime.now().isoformat(),
            'data': data.get('test_data', {
                'message': 'Teste de webhook',
                'webhook_id': webhook_id,
                'test_timestamp': datetime.now().isoformat()
            })
        }
        
        # Enviar teste
        webhook_manager.send_webhook(webhook_id, webhook, test_event)
        
        return jsonify({
            'success': True,
            'message': 'Teste de webhook enviado',
            'test_event': test_event,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao testar webhook {webhook_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/<webhook_id>/logs', methods=['GET'])
def get_webhook_logs(webhook_id):
    """
    Buscar logs de entrega de um webhook
    
    Query Parameters:
    - limit: Limite de logs (padrão: 50)
    - status: Filtrar por status (success, failed, error)
    """
    try:
        limit = int(request.args.get('limit', 50))
        status_filter = request.args.get('status')
        
        logs = webhook_manager.get_webhook_logs(webhook_id, limit * 2)  # Buscar mais para filtrar
        
        # Aplicar filtro de status se fornecido
        if status_filter:
            logs = [log for log in logs if log.get('status') == status_filter]
        
        # Aplicar limite final
        logs = logs[:limit]
        
        # Calcular estatísticas dos logs
        total_logs = len(logs)
        success_count = len([log for log in logs if log.get('status') == 'success'])
        failed_count = len([log for log in logs if log.get('status') in ['failed', 'error']])
        
        return jsonify({
            'success': True,
            'data': {
                'logs': logs,
                'summary': {
                    'total_logs': total_logs,
                    'successful_deliveries': success_count,
                    'failed_deliveries': failed_count,
                    'success_rate': f"{(success_count / total_logs * 100):.1f}%" if total_logs > 0 else "0%"
                },
                'filters': {
                    'limit': limit,
                    'status': status_filter
                }
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar logs do webhook {webhook_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/events/trigger', methods=['POST'])
def trigger_webhook_event():
    """
    Disparar evento manualmente para todos os webhooks relevantes
    
    Body:
    {
        "event_type": "content_analyzed",
        "event_data": {
            "content_id": "post_123",
            "viral_score": 85,
            "platform": "instagram"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('event_type'):
            return jsonify({
                'success': False,
                'error': 'Tipo de evento é obrigatório',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        event_type = data['event_type']
        event_data = data.get('event_data', {})
        
        # Disparar evento
        webhook_manager.trigger_event(event_type, event_data)
        
        # Contar webhooks relevantes
        relevant_count = 0
        for webhook in webhook_manager.active_webhooks.values():
            if webhook.get('active', False) and (
                not webhook.get('events') or
                event_type in webhook.get('events', []) or
                'all' in webhook.get('events', [])
            ):
                relevant_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Evento {event_type} disparado para {relevant_count} webhooks',
            'event_type': event_type,
            'webhooks_notified': relevant_count,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao disparar evento: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/events/types', methods=['GET'])
def get_event_types():
    """Listar tipos de eventos disponíveis"""
    try:
        event_types = {
            'scraping_events': [
                'scraping_started',
                'scraping_completed',
                'scraping_failed',
                'content_found',
                'viral_content_found'
            ],
            'analysis_events': [
                'content_analyzed',
                'profile_analyzed',
                'template_generated',
                'pattern_identified',
                'trend_detected'
            ],
            'system_events': [
                'system_maintenance',
                'backup_completed',
                'service_started',
                'service_stopped',
                'error_occurred'
            ],
            'user_events': [
                'user_registered',
                'user_upgraded',
                'api_limit_reached',
                'subscription_expired'
            ]
        }
        
        # Contar total de tipos
        total_types = sum(len(events) for events in event_types.values())
        
        return jsonify({
            'success': True,
            'data': {
                'event_types': event_types,
                'total_types': total_types,
                'special_events': {
                    'all': 'Receber todos os eventos',
                    'test_event': 'Evento de teste para validação'
                }
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar tipos de eventos: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@webhooks_bp.route('/webhooks/stats', methods=['GET'])
def get_webhook_stats():
    """Obter estatísticas gerais dos webhooks"""
    try:
        webhooks = webhook_manager.get_all_webhooks()
        
        stats = {
            'total_webhooks': len(webhooks),
            'active_webhooks': len([w for w in webhooks if w.get('active', False)]),
            'inactive_webhooks': len([w for w in webhooks if not w.get('active', False)]),
            'total_deliveries': sum(w.get('delivery_count', 0) for w in webhooks),
            'total_failures': sum(w.get('failure_count', 0) for w in webhooks),
            'delivery_stats': webhook_manager.delivery_stats,
            'events_in_queue': webhook_manager.event_queue.qsize(),
            'most_used_events': {},
            'top_webhooks_by_deliveries': []
        }
        
        # Calcular taxa de sucesso geral
        if stats['total_deliveries'] > 0:
            success_rate = ((stats['total_deliveries'] - stats['total_failures']) / stats['total_deliveries']) * 100
            stats['overall_success_rate'] = f"{success_rate:.1f}%"
        else:
            stats['overall_success_rate'] = "0%"
        
        # Top webhooks por entregas
        webhooks_with_deliveries = [(w['webhook_id'], w.get('delivery_count', 0)) for w in webhooks]
        webhooks_with_deliveries.sort(key=lambda x: x[1], reverse=True)
        stats['top_webhooks_by_deliveries'] = webhooks_with_deliveries[:5]
        
        # Eventos mais usados (simulado)
        stats['most_used_events'] = {
            'content_analyzed': 1250,
            'viral_content_found': 890,
            'scraping_completed': 650,
            'profile_analyzed': 420,
            'template_generated': 380
        }
        
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas de webhooks: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Funções auxiliares para disparar eventos do sistema
def trigger_content_analyzed(content_id, analysis_result):
    """Disparar evento quando conteúdo é analisado"""
    webhook_manager.trigger_event('content_analyzed', {
        'content_id': content_id,
        'viral_score': analysis_result.get('viral_score', 0),
        'platform': analysis_result.get('platform', ''),
        'content_type': analysis_result.get('content_type', ''),
        'analysis_timestamp': datetime.now().isoformat()
    })

def trigger_viral_content_found(content_data):
    """Disparar evento quando conteúdo viral é encontrado"""
    webhook_manager.trigger_event('viral_content_found', {
        'content_id': content_data.get('id', ''),
        'viral_score': content_data.get('viral_score', 0),
        'platform': content_data.get('platform', ''),
        'engagement_rate': content_data.get('engagement_rate', 0),
        'found_timestamp': datetime.now().isoformat()
    })

def trigger_scraping_completed(scraping_session):
    """Disparar evento quando scraping é concluído"""
    webhook_manager.trigger_event('scraping_completed', {
        'session_id': scraping_session.get('session_id', ''),
        'platform': scraping_session.get('platform', ''),
        'total_content': scraping_session.get('total_content', 0),
        'viral_content': scraping_session.get('viral_content', 0),
        'duration_seconds': scraping_session.get('duration_seconds', 0),
        'completed_timestamp': datetime.now().isoformat()
    })

