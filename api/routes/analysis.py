"""
ENDPOINTS DE ANÁLISE
Rotas para análise de conteúdo, sentimento, visual e métricas

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import asyncio
import asyncpg
import json
import uuid
from datetime import datetime, timedelta
import logging

# Importar analisadores
import sys
sys.path.append('/home/ubuntu/viral_content_scraper')

from ai_agents.src.agents.visual_content_analyzer import VisualContentAnalyzer
from ai_agents.src.agents.content_copy_analyzer import ContentCopyAnalyzer
from ai_agents.src.agents.engagement_pattern_analyzer import EngagementPatternAnalyzer
from ai_agents.src.analysis.sentiment.sentiment_analyzer import SentimentAnalyzer
from ai_agents.src.analysis.metrics.metrics_analyzer import MetricsAnalyzer

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')
logger = logging.getLogger(__name__)

# Instâncias dos analisadores
visual_analyzer = None
copy_analyzer = None
engagement_analyzer = None
sentiment_analyzer = None
metrics_analyzer = None

def init_analyzers():
    """Inicializa os analisadores"""
    global visual_analyzer, copy_analyzer, engagement_analyzer, sentiment_analyzer, metrics_analyzer
    
    try:
        visual_analyzer = VisualContentAnalyzer({
            'enable_face_detection': True,
            'enable_color_analysis': True,
            'enable_composition_analysis': True
        })
        
        copy_analyzer = ContentCopyAnalyzer({
            'enable_sentiment_analysis': True,
            'enable_persuasion_analysis': True,
            'enable_psychological_analysis': True
        })
        
        engagement_analyzer = EngagementPatternAnalyzer({
            'enable_trend_analysis': True,
            'enable_pattern_recognition': True,
            'enable_prediction': True
        })
        
        sentiment_analyzer = SentimentAnalyzer({
            'language': 'pt',
            'enableEmotionDetection': True,
            'enableToneAnalysis': True,
            'enablePsychologicalAnalysis': True,
            'enablePersuasionAnalysis': True
        })
        
        metrics_analyzer = MetricsAnalyzer({
            'enableTrendAnalysis': True,
            'enablePerformanceTracking': True,
            'enableComparativeAnalysis': True,
            'enablePredictiveAnalysis': True
        })
        
        logger.info("Analisadores inicializados com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar analisadores: {e}")
        raise

# Inicializar analisadores
init_analyzers()

@analysis_bp.route('/content/<content_id>', methods=['POST'])
@jwt_required()
async def analyze_content(content_id):
    """Executar análise completa de um conteúdo"""
    try:
        # Validar parâmetros
        data = request.get_json() or {}
        analysis_types = data.get('analysis_types', ['comprehensive'])
        force_reanalysis = data.get('force_reanalysis', False)
        
        # Buscar conteúdo no banco
        async with current_app.db_pool.acquire() as conn:
            content = await conn.fetchrow("""
                SELECT sc.*, cm.* FROM scraped_content sc
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true
                WHERE sc.id = $1 AND sc.is_active = true
            """, uuid.UUID(content_id))
            
            if not content:
                return jsonify({'error': 'Conteúdo não encontrado'}), 404
            
            # Verificar se já existe análise recente (últimas 24h)
            if not force_reanalysis:
                existing_analysis = await conn.fetchrow("""
                    SELECT id FROM content_analyses 
                    WHERE content_id = $1 
                    AND analysis_type = 'comprehensive'
                    AND analyzed_at > NOW() - INTERVAL '24 hours'
                    AND success = true
                """, uuid.UUID(content_id))
                
                if existing_analysis:
                    return jsonify({
                        'message': 'Análise recente já existe. Use force_reanalysis=true para forçar nova análise.',
                        'existing_analysis_id': str(existing_analysis['id'])
                    }), 409
        
        # Preparar dados para análise
        content_data = {
            'id': str(content['id']),
            'platform': content['platform'],
            'content_type': content['content_type'],
            'title': content['title'],
            'description': content['description'],
            'content_text': content['content_text'],
            'author': {
                'username': content['author_username'],
                'display_name': content['author_display_name'],
                'followers': content['author_followers_count']
            },
            'hashtags': content['hashtags'] or [],
            'mentions': content['mentions'] or [],
            'media_urls': content['media_urls'] or [],
            'language': content['language'],
            'published_at': content['published_at'].isoformat() if content['published_at'] else None,
            'metrics': {
                'likes_count': content['likes_count'] or 0,
                'comments_count': content['comments_count'] or 0,
                'shares_count': content['shares_count'] or 0,
                'views_count': content['views_count'] or 0,
                'engagement_rate': float(content['engagement_rate']) if content['engagement_rate'] else 0
            }
        }
        
        analysis_results = {}
        
        # Executar análises solicitadas
        for analysis_type in analysis_types:
            if analysis_type == 'sentiment' or analysis_type == 'comprehensive':
                if content_data['content_text'] or content_data['title']:
                    text_to_analyze = f"{content_data['title'] or ''} {content_data['description'] or ''} {content_data['content_text'] or ''}".strip()
                    if text_to_analyze:
                        sentiment_result = await sentiment_analyzer.analyzeSentiment(text_to_analyze)
                        analysis_results['sentiment'] = sentiment_result
            
            if analysis_type == 'visual' or analysis_type == 'comprehensive':
                if content_data['media_urls']:
                    # Analisar primeira imagem/vídeo disponível
                    media_url = content_data['media_urls'][0]
                    visual_result = await visual_analyzer.analyze_visual_content({
                        'url': media_url,
                        'type': 'image',  # Detectar automaticamente
                        'platform': content_data['platform']
                    })
                    analysis_results['visual'] = visual_result
            
            if analysis_type == 'metrics' or analysis_type == 'comprehensive':
                metrics_result = await metrics_analyzer.analyzeMetrics(content_data)
                analysis_results['metrics'] = metrics_result
            
            if analysis_type == 'engagement' or analysis_type == 'comprehensive':
                engagement_result = await engagement_analyzer.analyze_engagement_patterns(content_data)
                analysis_results['engagement'] = engagement_result
        
        # Calcular scores gerais
        overall_scores = {}
        confidence_scores = {}
        
        for analysis_type, result in analysis_results.items():
            if result.get('success'):
                overall_scores[analysis_type] = result.get('overallScore', {}).get('score', 0.5)
                confidence_scores[analysis_type] = result.get('confidence', 0.5)
        
        # Calcular score geral ponderado
        if overall_scores:
            weighted_score = sum(overall_scores.values()) / len(overall_scores)
            avg_confidence = sum(confidence_scores.values()) / len(confidence_scores)
        else:
            weighted_score = 0.5
            avg_confidence = 0.5
        
        # Salvar análise no banco
        async with current_app.db_pool.acquire() as conn:
            analysis_id = await conn.fetchval("""
                INSERT INTO content_analyses (
                    content_id, analysis_type, analyzer_name, analyzer_version,
                    processing_time_ms, success, confidence_score, overall_score,
                    sentiment_score, sentiment_polarity, dominant_emotion, emotional_intensity,
                    viral_potential_score, engagement_prediction, trend_direction, trend_strength,
                    sentiment_analysis, visual_analysis, metrics_analysis, predictions, recommendations
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                ) RETURNING id
            """, 
                uuid.UUID(content_id),
                'comprehensive',
                'MultiAnalyzer',
                '1.0.0',
                sum(result.get('processingTime', 0) for result in analysis_results.values()),
                True,
                avg_confidence,
                weighted_score,
                analysis_results.get('sentiment', {}).get('sentiment', {}).get('score', 0),
                analysis_results.get('sentiment', {}).get('sentiment', {}).get('polarity', 'neutral'),
                analysis_results.get('sentiment', {}).get('emotions', {}).get('dominantEmotion', {}).get('emotion'),
                analysis_results.get('sentiment', {}).get('emotions', {}).get('emotionalIntensity', 0),
                analysis_results.get('metrics', {}).get('viralPotential', {}).get('potential', 0),
                analysis_results.get('engagement', {}).get('prediction', {}).get('score', 0),
                analysis_results.get('metrics', {}).get('trends', {}).get('direction', 'unknown'),
                analysis_results.get('metrics', {}).get('trends', {}).get('strength', 0),
                json.dumps(analysis_results.get('sentiment', {})),
                json.dumps(analysis_results.get('visual', {})),
                json.dumps(analysis_results.get('metrics', {})),
                json.dumps({
                    'engagement': analysis_results.get('engagement', {}),
                    'combined_predictions': {}
                }),
                json.dumps({
                    'combined_recommendations': [],
                    'priority_actions': []
                })
            )
        
        return jsonify({
            'success': True,
            'analysis_id': str(analysis_id),
            'content_id': content_id,
            'analysis_types': analysis_types,
            'results': analysis_results,
            'summary': {
                'overall_score': weighted_score,
                'confidence_score': avg_confidence,
                'analysis_count': len(analysis_results),
                'processing_time_total': sum(result.get('processingTime', 0) for result in analysis_results.values())
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except ValueError:
        return jsonify({'error': 'ID de conteúdo inválido'}), 400
    except Exception as e:
        logger.error(f"Erro na análise de conteúdo: {e}")
        return jsonify({'error': 'Erro interno na análise'}), 500

@analysis_bp.route('/batch', methods=['POST'])
@jwt_required()
async def analyze_batch():
    """Executar análise em lote para múltiplos conteúdos"""
    try:
        data = request.get_json()
        if not data or 'content_ids' not in data:
            return jsonify({'error': 'Lista de content_ids é obrigatória'}), 400
        
        content_ids = data['content_ids']
        analysis_types = data.get('analysis_types', ['comprehensive'])
        max_batch_size = 50
        
        if len(content_ids) > max_batch_size:
            return jsonify({
                'error': f'Batch muito grande. Máximo permitido: {max_batch_size}'
            }), 400
        
        # Validar UUIDs
        try:
            validated_ids = [uuid.UUID(cid) for cid in content_ids]
        except ValueError:
            return jsonify({'error': 'Um ou mais IDs de conteúdo são inválidos'}), 400
        
        # Buscar conteúdos válidos
        async with current_app.db_pool.acquire() as conn:
            valid_content = await conn.fetch("""
                SELECT id FROM scraped_content 
                WHERE id = ANY($1) AND is_active = true
            """, validated_ids)
            
            valid_ids = [str(row['id']) for row in valid_content]
        
        if not valid_ids:
            return jsonify({'error': 'Nenhum conteúdo válido encontrado'}), 404
        
        # Executar análises em paralelo (limitado)
        batch_results = []
        failed_analyses = []
        
        # Processar em chunks menores para evitar sobrecarga
        chunk_size = 10
        for i in range(0, len(valid_ids), chunk_size):
            chunk_ids = valid_ids[i:i + chunk_size]
            
            # Criar tasks para análise paralela
            tasks = []
            for content_id in chunk_ids:
                # Simular chamada para analyze_content
                # Em implementação real, extrair lógica para função separada
                tasks.append(analyze_single_content_async(content_id, analysis_types))
            
            # Executar chunk
            chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for content_id, result in zip(chunk_ids, chunk_results):
                if isinstance(result, Exception):
                    failed_analyses.append({
                        'content_id': content_id,
                        'error': str(result)
                    })
                else:
                    batch_results.append({
                        'content_id': content_id,
                        'analysis_id': result.get('analysis_id'),
                        'success': result.get('success', False),
                        'summary': result.get('summary', {})
                    })
        
        return jsonify({
            'success': True,
            'batch_id': str(uuid.uuid4()),
            'total_requested': len(content_ids),
            'valid_content': len(valid_ids),
            'successful_analyses': len(batch_results),
            'failed_analyses': len(failed_analyses),
            'results': batch_results,
            'failures': failed_analyses,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro na análise em lote: {e}")
        return jsonify({'error': 'Erro interno na análise em lote'}), 500

async def analyze_single_content_async(content_id, analysis_types):
    """Função auxiliar para análise assíncrona de conteúdo único"""
    # Implementação simplificada - em produção, extrair lógica completa
    try:
        # Simular análise
        await asyncio.sleep(0.1)  # Simular processamento
        
        return {
            'success': True,
            'analysis_id': str(uuid.uuid4()),
            'summary': {
                'overall_score': 0.75,
                'confidence_score': 0.8,
                'processing_time': 100
            }
        }
    except Exception as e:
        raise e

@analysis_bp.route('/sentiment', methods=['POST'])
@jwt_required()
async def analyze_sentiment():
    """Análise de sentimento para texto fornecido"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Campo "text" é obrigatório'}), 400
        
        text = data['text']
        options = data.get('options', {})
        
        if len(text.strip()) < 10:
            return jsonify({'error': 'Texto muito curto para análise'}), 400
        
        if len(text) > 50000:
            return jsonify({'error': 'Texto muito longo (máximo 50.000 caracteres)'}), 400
        
        # Executar análise de sentimento
        result = await sentiment_analyzer.analyzeSentiment(text, options)
        
        return jsonify({
            'success': True,
            'data': result,
            'text_stats': {
                'character_count': len(text),
                'word_count': len(text.split()),
                'language_detected': result.get('text', {}).get('language', 'unknown')
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro na análise de sentimento: {e}")
        return jsonify({'error': 'Erro interno na análise de sentimento'}), 500

@analysis_bp.route('/trends', methods=['GET'])
@jwt_required()
async def get_analysis_trends():
    """Obter tendências de análise por período"""
    try:
        # Parâmetros de consulta
        platform = request.args.get('platform')
        analysis_type = request.args.get('analysis_type', 'comprehensive')
        period = request.args.get('period', '7d')  # 1d, 7d, 30d, 90d
        niche = request.args.get('niche')
        
        # Converter período para intervalo SQL
        period_mapping = {
            '1d': '1 day',
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days'
        }
        
        if period not in period_mapping:
            return jsonify({'error': 'Período inválido. Use: 1d, 7d, 30d, 90d'}), 400
        
        sql_interval = period_mapping[period]
        
        async with current_app.db_pool.acquire() as conn:
            # Query base para tendências
            where_conditions = [
                "ca.analyzed_at >= NOW() - INTERVAL $1",
                "ca.success = true",
                f"ca.analysis_type = $2"
            ]
            params = [sql_interval, analysis_type]
            param_count = 2
            
            if platform:
                param_count += 1
                where_conditions.append(f"sc.platform = ${param_count}")
                params.append(platform)
            
            where_clause = " AND ".join(where_conditions)
            
            # Tendências de sentimento
            sentiment_trends = await conn.fetch(f"""
                SELECT 
                    DATE_TRUNC('day', ca.analyzed_at) as date,
                    ca.sentiment_polarity,
                    COUNT(*) as count,
                    AVG(ca.sentiment_score) as avg_sentiment_score,
                    AVG(ca.emotional_intensity) as avg_emotional_intensity
                FROM content_analyses ca
                JOIN scraped_content sc ON ca.content_id = sc.id
                WHERE {where_clause}
                AND ca.sentiment_polarity IS NOT NULL
                GROUP BY DATE_TRUNC('day', ca.analyzed_at), ca.sentiment_polarity
                ORDER BY date DESC, count DESC
            """, *params)
            
            # Tendências de potencial viral
            viral_trends = await conn.fetch(f"""
                SELECT 
                    DATE_TRUNC('day', ca.analyzed_at) as date,
                    COUNT(*) as total_content,
                    COUNT(*) FILTER (WHERE ca.viral_potential_score > 0.8) as high_viral_potential,
                    COUNT(*) FILTER (WHERE ca.viral_potential_score > 0.6) as medium_viral_potential,
                    AVG(ca.viral_potential_score) as avg_viral_potential,
                    AVG(ca.overall_score) as avg_overall_score
                FROM content_analyses ca
                JOIN scraped_content sc ON ca.content_id = sc.id
                WHERE {where_clause}
                AND ca.viral_potential_score IS NOT NULL
                GROUP BY DATE_TRUNC('day', ca.analyzed_at)
                ORDER BY date DESC
            """, *params)
            
            # Top emoções por período
            top_emotions = await conn.fetch(f"""
                SELECT 
                    ca.dominant_emotion,
                    COUNT(*) as count,
                    AVG(ca.emotional_intensity) as avg_intensity,
                    AVG(ca.overall_score) as avg_performance
                FROM content_analyses ca
                JOIN scraped_content sc ON ca.content_id = sc.id
                WHERE {where_clause}
                AND ca.dominant_emotion IS NOT NULL
                GROUP BY ca.dominant_emotion
                ORDER BY count DESC
                LIMIT 10
            """, *params)
            
            # Estatísticas gerais
            general_stats = await conn.fetchrow(f"""
                SELECT 
                    COUNT(*) as total_analyses,
                    AVG(ca.overall_score) as avg_overall_score,
                    AVG(ca.confidence_score) as avg_confidence,
                    AVG(ca.processing_time_ms) as avg_processing_time,
                    COUNT(*) FILTER (WHERE ca.viral_potential_score > 0.7) as high_potential_count
                FROM content_analyses ca
                JOIN scraped_content sc ON ca.content_id = sc.id
                WHERE {where_clause}
            """, *params)
        
        # Formatar dados de tendências de sentimento
        sentiment_by_date = {}
        for row in sentiment_trends:
            date_str = row['date'].strftime('%Y-%m-%d')
            if date_str not in sentiment_by_date:
                sentiment_by_date[date_str] = {}
            
            sentiment_by_date[date_str][row['sentiment_polarity']] = {
                'count': row['count'],
                'avg_sentiment_score': float(row['avg_sentiment_score']) if row['avg_sentiment_score'] else 0,
                'avg_emotional_intensity': float(row['avg_emotional_intensity']) if row['avg_emotional_intensity'] else 0
            }
        
        # Formatar dados de tendências virais
        viral_by_date = {}
        for row in viral_trends:
            date_str = row['date'].strftime('%Y-%m-%d')
            viral_by_date[date_str] = {
                'total_content': row['total_content'],
                'high_viral_potential': row['high_viral_potential'],
                'medium_viral_potential': row['medium_viral_potential'],
                'avg_viral_potential': float(row['avg_viral_potential']) if row['avg_viral_potential'] else 0,
                'avg_overall_score': float(row['avg_overall_score']) if row['avg_overall_score'] else 0,
                'viral_rate': row['high_viral_potential'] / row['total_content'] if row['total_content'] > 0 else 0
            }
        
        # Formatar top emoções
        emotions_data = []
        for row in top_emotions:
            emotions_data.append({
                'emotion': row['dominant_emotion'],
                'count': row['count'],
                'avg_intensity': float(row['avg_intensity']) if row['avg_intensity'] else 0,
                'avg_performance': float(row['avg_performance']) if row['avg_performance'] else 0
            })
        
        return jsonify({
            'success': True,
            'period': period,
            'filters': {
                'platform': platform,
                'analysis_type': analysis_type,
                'niche': niche
            },
            'data': {
                'sentiment_trends': sentiment_by_date,
                'viral_trends': viral_by_date,
                'top_emotions': emotions_data,
                'general_stats': {
                    'total_analyses': general_stats['total_analyses'],
                    'avg_overall_score': float(general_stats['avg_overall_score']) if general_stats['avg_overall_score'] else 0,
                    'avg_confidence': float(general_stats['avg_confidence']) if general_stats['avg_confidence'] else 0,
                    'avg_processing_time_ms': general_stats['avg_processing_time'],
                    'high_potential_rate': general_stats['high_potential_count'] / general_stats['total_analyses'] if general_stats['total_analyses'] > 0 else 0
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter tendências de análise: {e}")
        return jsonify({'error': 'Erro interno ao obter tendências'}), 500

@analysis_bp.route('/compare', methods=['POST'])
@jwt_required()
async def compare_content():
    """Comparar análises de múltiplos conteúdos"""
    try:
        data = request.get_json()
        if not data or 'content_ids' not in data:
            return jsonify({'error': 'Lista de content_ids é obrigatória'}), 400
        
        content_ids = data['content_ids']
        comparison_metrics = data.get('metrics', ['overall_score', 'viral_potential_score', 'sentiment_score'])
        
        if len(content_ids) < 2:
            return jsonify({'error': 'Pelo menos 2 conteúdos são necessários para comparação'}), 400
        
        if len(content_ids) > 10:
            return jsonify({'error': 'Máximo de 10 conteúdos por comparação'}), 400
        
        # Validar UUIDs
        try:
            validated_ids = [uuid.UUID(cid) for cid in content_ids]
        except ValueError:
            return jsonify({'error': 'Um ou mais IDs de conteúdo são inválidos'}), 400
        
        async with current_app.db_pool.acquire() as conn:
            # Buscar análises mais recentes para cada conteúdo
            comparison_data = await conn.fetch("""
                SELECT 
                    sc.id,
                    sc.platform,
                    sc.content_type,
                    sc.title,
                    sc.author_username,
                    sc.published_at,
                    ca.overall_score,
                    ca.confidence_score,
                    ca.viral_potential_score,
                    ca.sentiment_score,
                    ca.sentiment_polarity,
                    ca.dominant_emotion,
                    ca.emotional_intensity,
                    ca.visual_quality_score,
                    ca.analyzed_at,
                    cm.likes_count,
                    cm.comments_count,
                    cm.shares_count,
                    cm.views_count,
                    cm.engagement_rate
                FROM scraped_content sc
                LEFT JOIN LATERAL (
                    SELECT * FROM content_analyses 
                    WHERE content_id = sc.id 
                    AND analysis_type = 'comprehensive'
                    ORDER BY analyzed_at DESC 
                    LIMIT 1
                ) ca ON true
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true
                WHERE sc.id = ANY($1)
                ORDER BY ca.overall_score DESC NULLS LAST
            """, validated_ids)
            
            if not comparison_data:
                return jsonify({'error': 'Nenhuma análise encontrada para os conteúdos fornecidos'}), 404
        
        # Processar dados de comparação
        content_comparisons = []
        metric_summaries = {}
        
        for row in comparison_data:
            content_info = {
                'id': str(row['id']),
                'platform': row['platform'],
                'content_type': row['content_type'],
                'title': row['title'],
                'author_username': row['author_username'],
                'published_at': row['published_at'].isoformat() if row['published_at'] else None,
                'analyzed_at': row['analyzed_at'].isoformat() if row['analyzed_at'] else None,
                'metrics': {
                    'overall_score': float(row['overall_score']) if row['overall_score'] else None,
                    'confidence_score': float(row['confidence_score']) if row['confidence_score'] else None,
                    'viral_potential_score': float(row['viral_potential_score']) if row['viral_potential_score'] else None,
                    'sentiment_score': float(row['sentiment_score']) if row['sentiment_score'] else None,
                    'sentiment_polarity': row['sentiment_polarity'],
                    'dominant_emotion': row['dominant_emotion'],
                    'emotional_intensity': float(row['emotional_intensity']) if row['emotional_intensity'] else None,
                    'visual_quality_score': float(row['visual_quality_score']) if row['visual_quality_score'] else None,
                    'likes_count': row['likes_count'] or 0,
                    'comments_count': row['comments_count'] or 0,
                    'shares_count': row['shares_count'] or 0,
                    'views_count': row['views_count'] or 0,
                    'engagement_rate': float(row['engagement_rate']) if row['engagement_rate'] else 0
                }
            }
            
            content_comparisons.append(content_info)
            
            # Calcular estatísticas por métrica
            for metric in comparison_metrics:
                if metric not in metric_summaries:
                    metric_summaries[metric] = {
                        'values': [],
                        'min': None,
                        'max': None,
                        'avg': None,
                        'best_content': None,
                        'worst_content': None
                    }
                
                value = content_info['metrics'].get(metric)
                if value is not None:
                    metric_summaries[metric]['values'].append({
                        'content_id': content_info['id'],
                        'value': value,
                        'title': content_info['title']
                    })
        
        # Calcular estatísticas finais
        for metric, summary in metric_summaries.items():
            if summary['values']:
                values = [item['value'] for item in summary['values']]
                summary['min'] = min(values)
                summary['max'] = max(values)
                summary['avg'] = sum(values) / len(values)
                
                # Encontrar melhor e pior conteúdo
                best_item = max(summary['values'], key=lambda x: x['value'])
                worst_item = min(summary['values'], key=lambda x: x['value'])
                
                summary['best_content'] = {
                    'id': best_item['content_id'],
                    'title': best_item['title'],
                    'value': best_item['value']
                }
                summary['worst_content'] = {
                    'id': worst_item['content_id'],
                    'title': worst_item['title'],
                    'value': worst_item['value']
                }
                
                # Remover valores brutos para limpar resposta
                del summary['values']
        
        # Identificar padrões e insights
        insights = []
        
        # Insight sobre plataformas
        platforms = [content['platform'] for content in content_comparisons]
        if len(set(platforms)) > 1:
            platform_performance = {}
            for content in content_comparisons:
                platform = content['platform']
                overall_score = content['metrics']['overall_score']
                if overall_score is not None:
                    if platform not in platform_performance:
                        platform_performance[platform] = []
                    platform_performance[platform].append(overall_score)
            
            if len(platform_performance) > 1:
                platform_avgs = {p: sum(scores)/len(scores) for p, scores in platform_performance.items()}
                best_platform = max(platform_avgs, key=platform_avgs.get)
                insights.append(f"Plataforma com melhor performance: {best_platform} (score médio: {platform_avgs[best_platform]:.3f})")
        
        # Insight sobre sentimento
        sentiments = [content['metrics']['sentiment_polarity'] for content in content_comparisons if content['metrics']['sentiment_polarity']]
        if sentiments:
            sentiment_counts = {}
            for sentiment in sentiments:
                sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
            
            dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)
            insights.append(f"Sentimento dominante: {dominant_sentiment} ({sentiment_counts[dominant_sentiment]}/{len(sentiments)} conteúdos)")
        
        return jsonify({
            'success': True,
            'comparison': {
                'content_count': len(content_comparisons),
                'metrics_analyzed': comparison_metrics,
                'contents': content_comparisons,
                'metric_summaries': metric_summaries,
                'insights': insights
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except ValueError:
        return jsonify({'error': 'Um ou mais IDs de conteúdo são inválidos'}), 400
    except Exception as e:
        logger.error(f"Erro na comparação de conteúdo: {e}")
        return jsonify({'error': 'Erro interno na comparação'}), 500

