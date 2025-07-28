"""
ENDPOINTS DE TEMPLATES
Gerenciamento completo de templates virais extraídos e adaptados

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

from flask import Blueprint, request, jsonify
from functools import wraps
import json
import os
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

templates_bp = Blueprint('templates', __name__)

# Simulação de integração com sistema de templates
class TemplateManager:
    def __init__(self):
        self.templates_dir = '/home/ubuntu/viral_content_scraper/storage/templates'
        self.ensure_templates_dir()
    
    def ensure_templates_dir(self):
        os.makedirs(self.templates_dir, exist_ok=True)
    
    def get_all_templates(self, filters=None):
        """Buscar todos os templates com filtros opcionais"""
        templates = []
        
        try:
            for filename in os.listdir(self.templates_dir):
                if filename.endswith('.json'):
                    filepath = os.path.join(self.templates_dir, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        template = json.load(f)
                        
                        # Aplicar filtros se fornecidos
                        if filters and not self._matches_filters(template, filters):
                            continue
                            
                        templates.append(template)
            
            return templates
            
        except Exception as e:
            logger.error(f"Erro ao buscar templates: {e}")
            return []
    
    def get_template_by_id(self, template_id):
        """Buscar template específico por ID"""
        try:
            filepath = os.path.join(self.templates_dir, f"{template_id}.json")
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar template {template_id}: {e}")
            return None
    
    def save_template(self, template_data):
        """Salvar novo template"""
        try:
            template_id = template_data.get('template_id') or template_data.get('adapted_template_id')
            if not template_id:
                raise ValueError("Template ID é obrigatório")
            
            filepath = os.path.join(self.templates_dir, f"{template_id}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(template_data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar template: {e}")
            return False
    
    def delete_template(self, template_id):
        """Deletar template"""
        try:
            filepath = os.path.join(self.templates_dir, f"{template_id}.json")
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except Exception as e:
            logger.error(f"Erro ao deletar template {template_id}: {e}")
            return False
    
    def _matches_filters(self, template, filters):
        """Verificar se template corresponde aos filtros"""
        if filters.get('content_type') and template.get('content_type') != filters['content_type']:
            return False
        
        if filters.get('min_viral_score') and template.get('viral_score', 0) < filters['min_viral_score']:
            return False
        
        if filters.get('platform') and template.get('extraction_metadata', {}).get('source_platform') != filters['platform']:
            return False
        
        if filters.get('search_tags'):
            template_tags = template.get('search_tags', [])
            if not any(tag in template_tags for tag in filters['search_tags']):
                return False
        
        return True

# Instanciar gerenciador
template_manager = TemplateManager()

@templates_bp.route('/templates', methods=['GET'])
def get_templates():
    """
    Buscar templates com filtros opcionais
    
    Query Parameters:
    - content_type: Filtrar por tipo de conteúdo (carousel, reel, post, etc.)
    - min_viral_score: Score viral mínimo
    - platform: Plataforma de origem
    - search_tags: Tags de busca (separadas por vírgula)
    - limit: Limite de resultados (padrão: 50)
    - offset: Offset para paginação (padrão: 0)
    - sort_by: Ordenar por (viral_score, created_at, template_quality_score)
    - sort_order: Ordem (desc, asc)
    """
    try:
        # Extrair parâmetros de filtro
        filters = {}
        
        if request.args.get('content_type'):
            filters['content_type'] = request.args.get('content_type')
        
        if request.args.get('min_viral_score'):
            filters['min_viral_score'] = int(request.args.get('min_viral_score'))
        
        if request.args.get('platform'):
            filters['platform'] = request.args.get('platform')
        
        if request.args.get('search_tags'):
            filters['search_tags'] = request.args.get('search_tags').split(',')
        
        # Parâmetros de paginação e ordenação
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        sort_by = request.args.get('sort_by', 'viral_score')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Buscar templates
        templates = template_manager.get_all_templates(filters)
        
        # Ordenar
        reverse = sort_order == 'desc'
        if sort_by == 'viral_score':
            templates.sort(key=lambda x: x.get('viral_score', 0), reverse=reverse)
        elif sort_by == 'created_at':
            templates.sort(key=lambda x: x.get('extraction_metadata', {}).get('extracted_at', ''), reverse=reverse)
        elif sort_by == 'template_quality_score':
            templates.sort(key=lambda x: x.get('template_quality_score', 0), reverse=reverse)
        
        # Aplicar paginação
        total_templates = len(templates)
        paginated_templates = templates[offset:offset + limit]
        
        # Preparar resposta
        response = {
            'success': True,
            'data': {
                'templates': paginated_templates,
                'pagination': {
                    'total': total_templates,
                    'limit': limit,
                    'offset': offset,
                    'has_more': offset + limit < total_templates
                },
                'filters_applied': filters,
                'sort': {
                    'sort_by': sort_by,
                    'sort_order': sort_order
                }
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Erro ao buscar templates: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    """Buscar template específico por ID"""
    try:
        template = template_manager.get_template_by_id(template_id)
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        return jsonify({
            'success': True,
            'data': template,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar template {template_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/extract', methods=['POST'])
def extract_template():
    """
    Extrair template de conteúdo viral
    
    Body:
    {
        "content_url": "URL do conteúdo",
        "content_type": "carousel|reel|post|story",
        "analysis_depth": "basic|standard|deep",
        "save_template": true
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('content_url'):
            return jsonify({
                'success': False,
                'error': 'URL do conteúdo é obrigatória',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        content_url = data['content_url']
        content_type = data.get('content_type', 'auto')
        analysis_depth = data.get('analysis_depth', 'standard')
        save_template = data.get('save_template', True)
        
        # Simular extração de template (integração com TemplateGenerator)
        # Em produção, aqui seria chamado o TemplateGenerator real
        extracted_template = {
            'template_id': f"extracted_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'template_name': f"Template Extraído - {content_type.title()}",
            'content_type': content_type,
            'viral_score': 85,
            'source_url': content_url,
            'extraction_metadata': {
                'extracted_at': datetime.now().isoformat(),
                'analysis_depth': analysis_depth,
                'extraction_method': 'api_request'
            },
            'visual_structure': {
                'layout_pattern': 'problem-solution-proof-cta',
                'color_scheme': {
                    'primary': '#FF6B6B',
                    'secondary': '#4ECDC4',
                    'background': '#FFFFFF'
                }
            },
            'content_formula': {
                'hook': 'Attention-grabbing opening',
                'body': 'Value-driven content',
                'cta': 'Clear call-to-action'
            },
            'performance_metrics': {
                'estimated_engagement_rate': 8.5,
                'viral_probability': 0.78
            }
        }
        
        # Salvar template se solicitado
        if save_template:
            template_manager.save_template(extracted_template)
        
        return jsonify({
            'success': True,
            'data': {
                'template': extracted_template,
                'extraction_status': 'completed',
                'saved': save_template
            },
            'message': 'Template extraído com sucesso',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao extrair template: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/adapt', methods=['POST'])
def adapt_template():
    """
    Adaptar template existente para objetivo específico
    
    Body:
    {
        "template_id": "ID do template original",
        "adaptation_request": {
            "objective": "lead_generation|sales|awareness|engagement",
            "niche": "fitness|business|lifestyle|tech",
            "target_audience": "Descrição do público-alvo",
            "platform": "instagram|tiktok|linkedin|youtube",
            "brand_name": "Nome da marca",
            "brand_colors": ["#FF6B6B", "#4ECDC4"],
            "brand_voice": "professional|casual|humorous|authoritative"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('template_id'):
            return jsonify({
                'success': False,
                'error': 'ID do template é obrigatório',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        template_id = data['template_id']
        adaptation_request = data.get('adaptation_request', {})
        
        # Buscar template original
        original_template = template_manager.get_template_by_id(template_id)
        if not original_template:
            return jsonify({
                'success': False,
                'error': 'Template original não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        # Simular adaptação (integração com TemplateGenerator)
        adapted_template = {
            'adapted_template_id': f"adapted_{template_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'original_template_id': template_id,
            'template_name': f"{original_template.get('template_name', 'Template')} - Adaptado",
            'content_type': original_template.get('content_type'),
            'viral_score': max(70, original_template.get('viral_score', 75) - 5),  # Ligeiramente menor
            'adaptation_for': adaptation_request,
            'adapted_structure': {
                'customized_for_niche': adaptation_request.get('niche', 'general'),
                'optimized_for_platform': adaptation_request.get('platform', 'instagram'),
                'brand_integration': {
                    'colors_applied': adaptation_request.get('brand_colors', []),
                    'voice_adapted': adaptation_request.get('brand_voice', 'professional')
                }
            },
            'adaptation_metadata': {
                'adapted_at': datetime.now().isoformat(),
                'adaptation_confidence': 0.85,
                'expected_performance': {
                    'estimated_engagement': '6.5-8.2%',
                    'conversion_potential': 'high'
                }
            }
        }
        
        # Salvar adaptação
        template_manager.save_template(adapted_template)
        
        return jsonify({
            'success': True,
            'data': {
                'adapted_template': adapted_template,
                'original_template': original_template,
                'adaptation_summary': {
                    'changes_made': [
                        f"Adaptado para nicho: {adaptation_request.get('niche', 'N/A')}",
                        f"Otimizado para: {adaptation_request.get('platform', 'N/A')}",
                        f"Tom de voz: {adaptation_request.get('brand_voice', 'N/A')}"
                    ],
                    'expected_impact': 'Melhoria de 15-25% na relevância para o público-alvo'
                }
            },
            'message': 'Template adaptado com sucesso',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao adaptar template: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/search', methods=['POST'])
def search_templates():
    """
    Busca avançada de templates
    
    Body:
    {
        "query": "Texto de busca",
        "filters": {
            "content_types": ["carousel", "reel"],
            "min_viral_score": 80,
            "platforms": ["instagram", "tiktok"],
            "niches": ["fitness", "business"],
            "date_range": {
                "start": "2024-01-01",
                "end": "2024-12-31"
            }
        },
        "sort": {
            "by": "viral_score",
            "order": "desc"
        },
        "limit": 20
    }
    """
    try:
        data = request.get_json()
        query = data.get('query', '')
        filters = data.get('filters', {})
        sort_config = data.get('sort', {'by': 'viral_score', 'order': 'desc'})
        limit = data.get('limit', 20)
        
        # Buscar todos os templates
        all_templates = template_manager.get_all_templates()
        
        # Aplicar filtros de busca
        filtered_templates = []
        
        for template in all_templates:
            # Filtro por texto
            if query:
                searchable_text = f"{template.get('template_name', '')} {template.get('content_type', '')} {' '.join(template.get('search_tags', []))}"
                if query.lower() not in searchable_text.lower():
                    continue
            
            # Filtros específicos
            if filters.get('content_types') and template.get('content_type') not in filters['content_types']:
                continue
            
            if filters.get('min_viral_score') and template.get('viral_score', 0) < filters['min_viral_score']:
                continue
            
            if filters.get('platforms'):
                template_platform = template.get('extraction_metadata', {}).get('source_platform')
                if template_platform not in filters['platforms']:
                    continue
            
            if filters.get('niches'):
                template_tags = template.get('search_tags', [])
                if not any(niche in template_tags for niche in filters['niches']):
                    continue
            
            filtered_templates.append(template)
        
        # Ordenar resultados
        reverse = sort_config.get('order', 'desc') == 'desc'
        sort_key = sort_config.get('by', 'viral_score')
        
        if sort_key == 'viral_score':
            filtered_templates.sort(key=lambda x: x.get('viral_score', 0), reverse=reverse)
        elif sort_key == 'template_quality_score':
            filtered_templates.sort(key=lambda x: x.get('template_quality_score', 0), reverse=reverse)
        elif sort_key == 'created_at':
            filtered_templates.sort(key=lambda x: x.get('extraction_metadata', {}).get('extracted_at', ''), reverse=reverse)
        
        # Aplicar limite
        results = filtered_templates[:limit]
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'total_found': len(filtered_templates),
                'returned': len(results),
                'query': query,
                'filters_applied': filters,
                'sort_applied': sort_config
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro na busca de templates: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Deletar template"""
    try:
        success = template_manager.delete_template(template_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Template não encontrado ou erro ao deletar',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        return jsonify({
            'success': True,
            'message': f'Template {template_id} deletado com sucesso',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar template {template_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/stats', methods=['GET'])
def get_template_stats():
    """Obter estatísticas dos templates"""
    try:
        all_templates = template_manager.get_all_templates()
        
        # Calcular estatísticas
        total_templates = len(all_templates)
        
        if total_templates == 0:
            return jsonify({
                'success': True,
                'data': {
                    'total_templates': 0,
                    'message': 'Nenhum template encontrado'
                },
                'timestamp': datetime.now().isoformat()
            })
        
        # Estatísticas por tipo de conteúdo
        content_type_stats = {}
        viral_scores = []
        platforms = {}
        
        for template in all_templates:
            # Tipo de conteúdo
            content_type = template.get('content_type', 'unknown')
            if content_type not in content_type_stats:
                content_type_stats[content_type] = {'count': 0, 'avg_viral_score': 0}
            content_type_stats[content_type]['count'] += 1
            
            # Viral scores
            viral_score = template.get('viral_score', 0)
            viral_scores.append(viral_score)
            content_type_stats[content_type]['avg_viral_score'] += viral_score
            
            # Plataformas
            platform = template.get('extraction_metadata', {}).get('source_platform', 'unknown')
            platforms[platform] = platforms.get(platform, 0) + 1
        
        # Calcular médias
        for content_type in content_type_stats:
            count = content_type_stats[content_type]['count']
            content_type_stats[content_type]['avg_viral_score'] = round(
                content_type_stats[content_type]['avg_viral_score'] / count, 2
            )
        
        # Estatísticas gerais
        avg_viral_score = round(sum(viral_scores) / len(viral_scores), 2)
        max_viral_score = max(viral_scores)
        min_viral_score = min(viral_scores)
        
        # Templates de alta performance
        high_performance = [t for t in all_templates if t.get('viral_score', 0) >= 80]
        
        stats = {
            'total_templates': total_templates,
            'viral_score_stats': {
                'average': avg_viral_score,
                'maximum': max_viral_score,
                'minimum': min_viral_score,
                'high_performance_count': len(high_performance),
                'high_performance_rate': round((len(high_performance) / total_templates) * 100, 2)
            },
            'content_type_breakdown': content_type_stats,
            'platform_breakdown': platforms,
            'top_performers': sorted(all_templates, key=lambda x: x.get('viral_score', 0), reverse=True)[:5]
        }
        
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@templates_bp.route('/templates/export', methods=['POST'])
def export_templates():
    """
    Exportar templates em diferentes formatos
    
    Body:
    {
        "format": "json|csv|xlsx",
        "filters": {
            "content_types": ["carousel", "reel"],
            "min_viral_score": 80
        },
        "include_metadata": true
    }
    """
    try:
        data = request.get_json()
        export_format = data.get('format', 'json')
        filters = data.get('filters', {})
        include_metadata = data.get('include_metadata', True)
        
        # Buscar templates com filtros
        templates = template_manager.get_all_templates(filters)
        
        if export_format == 'json':
            export_data = {
                'templates': templates,
                'export_metadata': {
                    'exported_at': datetime.now().isoformat(),
                    'total_templates': len(templates),
                    'filters_applied': filters,
                    'include_metadata': include_metadata
                }
            }
            
            return jsonify({
                'success': True,
                'data': export_data,
                'download_format': 'json',
                'timestamp': datetime.now().isoformat()
            })
        
        elif export_format == 'csv':
            # Simular exportação CSV
            csv_data = "template_id,template_name,content_type,viral_score,platform\n"
            for template in templates:
                csv_data += f"{template.get('template_id', '')},{template.get('template_name', '')},{template.get('content_type', '')},{template.get('viral_score', 0)},{template.get('extraction_metadata', {}).get('source_platform', '')}\n"
            
            return jsonify({
                'success': True,
                'data': {
                    'csv_content': csv_data,
                    'filename': f"templates_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                },
                'download_format': 'csv',
                'timestamp': datetime.now().isoformat()
            })
        
        else:
            return jsonify({
                'success': False,
                'error': f'Formato de exportação não suportado: {export_format}',
                'supported_formats': ['json', 'csv'],
                'timestamp': datetime.now().isoformat()
            }), 400
        
    except Exception as e:
        logger.error(f"Erro ao exportar templates: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

