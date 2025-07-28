"""
ENDPOINTS DE TENDÊNCIAS
Rotas para análise de tendências, padrões virais e insights preditivos

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
import statistics
from collections import defaultdict, Counter

# Importar analisadores
import sys
sys.path.append('/home/ubuntu/viral_content_scraper')

from ai_agents.src.memory.evolutionary_memory import EvolutionaryMemory

trends_bp = Blueprint('trends', __name__, url_prefix='/api/v1/trends')
logger = logging.getLogger(__name__)

@trends_bp.route('/viral', methods=['GET'])
@jwt_required()
async def get_viral_trends():
    """Obter tendências de conteúdo viral"""
    try:
        # Parâmetros de consulta
        platform = request.args.get('platform')
        period = request.args.get('period', '7d')  # 1d, 7d, 30d, 90d
        content_type = request.args.get('content_type')
        niche = request.args.get('niche')
        min_viral_score = float(request.args.get('min_viral_score', 0.7))
        limit = min(int(request.args.get('limit', 100)), 1000)
        
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
            # Construir query dinamicamente
            where_conditions = [
                "ca.analyzed_at >= NOW() - INTERVAL $1",
                "ca.viral_potential_score >= $2",
                "ca.success = true",
                "sc.is_active = true"
            ]
            params = [sql_interval, min_viral_score]
            param_count = 2
            
            if platform:
                param_count += 1
                where_conditions.append(f"sc.platform = ${param_count}")
                params.append(platform)
            
            if content_type:
                param_count += 1
                where_conditions.append(f"sc.content_type = ${param_count}")
                params.append(content_type)
            
            where_clause = " AND ".join(where_conditions)
            
            # Buscar conteúdo viral
            viral_content = await conn.fetch(f"""
                SELECT 
                    sc.id,
                    sc.platform,
                    sc.content_type,
                    sc.title,
                    sc.description,
                    sc.author_username,
                    sc.author_display_name,
                    sc.author_followers_count,
                    sc.hashtags,
                    sc.published_at,
                    sc.scraped_at,
                    ca.viral_potential_score,
                    ca.overall_score,
                    ca.sentiment_polarity,
                    ca.dominant_emotion,
                    ca.emotional_intensity,
                    ca.analyzed_at,
                    cm.likes_count,
                    cm.comments_count,
                    cm.shares_count,
                    cm.views_count,
                    cm.engagement_rate
                FROM scraped_content sc
                JOIN content_analyses ca ON sc.id = ca.content_id
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true
                WHERE {where_clause}
                ORDER BY ca.viral_potential_score DESC, cm.engagement_rate DESC
                LIMIT ${param_count + 1}
            """, *params, limit)
            
            # Análise de padrões virais
            viral_patterns = await conn.fetch(f"""
                SELECT 
                    sc.platform,
                    sc.content_type,
                    ca.sentiment_polarity,
                    ca.dominant_emotion,
                    COUNT(*) as count,
                    AVG(ca.viral_potential_score) as avg_viral_score,
                    AVG(ca.overall_score) as avg_overall_score,
                    AVG(cm.engagement_rate) as avg_engagement_rate,
                    ARRAY_AGG(DISTINCT hashtag) FILTER (WHERE hashtag IS NOT NULL) as common_hashtags
                FROM scraped_content sc
                JOIN content_analyses ca ON sc.id = ca.content_id
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true,
                UNNEST(COALESCE(sc.hashtags, ARRAY[]::TEXT[])) as hashtag
                WHERE {where_clause}
                GROUP BY sc.platform, sc.content_type, ca.sentiment_polarity, ca.dominant_emotion
                HAVING COUNT(*) >= 3
                ORDER BY avg_viral_score DESC
            """, *params)
            
            # Tendências temporais
            temporal_trends = await conn.fetch(f"""
                SELECT 
                    DATE_TRUNC('day', ca.analyzed_at) as date,
                    COUNT(*) as viral_count,
                    AVG(ca.viral_potential_score) as avg_viral_score,
                    AVG(cm.engagement_rate) as avg_engagement_rate,
                    COUNT(DISTINCT sc.author_username) as unique_creators
                FROM scraped_content sc
                JOIN content_analyses ca ON sc.id = ca.content_id
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true
                WHERE {where_clause}
                GROUP BY DATE_TRUNC('day', ca.analyzed_at)
                ORDER BY date DESC
            """, *params)
        
        # Processar dados de conteúdo viral
        viral_content_list = []
        for row in viral_content:
            viral_content_list.append({
                'id': str(row['id']),
                'platform': row['platform'],
                'content_type': row['content_type'],
                'title': row['title'],
                'description': row['description'][:200] + '...' if row['description'] and len(row['description']) > 200 else row['description'],
                'author': {
                    'username': row['author_username'],
                    'display_name': row['author_display_name'],
                    'followers_count': row['author_followers_count']
                },
                'hashtags': row['hashtags'][:10] if row['hashtags'] else [],  # Limitar hashtags
                'published_at': row['published_at'].isoformat() if row['published_at'] else None,
                'scraped_at': row['scraped_at'].isoformat(),
                'analyzed_at': row['analyzed_at'].isoformat(),
                'scores': {
                    'viral_potential': float(row['viral_potential_score']),
                    'overall_score': float(row['overall_score']) if row['overall_score'] else None,
                    'sentiment_polarity': row['sentiment_polarity'],
                    'dominant_emotion': row['dominant_emotion'],
                    'emotional_intensity': float(row['emotional_intensity']) if row['emotional_intensity'] else None
                },
                'metrics': {
                    'likes_count': row['likes_count'] or 0,
                    'comments_count': row['comments_count'] or 0,
                    'shares_count': row['shares_count'] or 0,
                    'views_count': row['views_count'] or 0,
                    'engagement_rate': float(row['engagement_rate']) if row['engagement_rate'] else 0
                }
            })
        
        # Processar padrões virais
        patterns_list = []
        for row in viral_patterns:
            # Processar hashtags comuns (pegar top 5)
            common_hashtags = row['common_hashtags'][:5] if row['common_hashtags'] else []
            
            patterns_list.append({
                'platform': row['platform'],
                'content_type': row['content_type'],
                'sentiment_polarity': row['sentiment_polarity'],
                'dominant_emotion': row['dominant_emotion'],
                'content_count': row['count'],
                'avg_viral_score': float(row['avg_viral_score']),
                'avg_overall_score': float(row['avg_overall_score']) if row['avg_overall_score'] else None,
                'avg_engagement_rate': float(row['avg_engagement_rate']) if row['avg_engagement_rate'] else None,
                'common_hashtags': common_hashtags
            })
        
        # Processar tendências temporais
        temporal_data = {}
        for row in temporal_trends:
            date_str = row['date'].strftime('%Y-%m-%d')
            temporal_data[date_str] = {
                'viral_count': row['viral_count'],
                'avg_viral_score': float(row['avg_viral_score']),
                'avg_engagement_rate': float(row['avg_engagement_rate']) if row['avg_engagement_rate'] else 0,
                'unique_creators': row['unique_creators']
            }
        
        # Calcular insights
        insights = []
        
        if viral_content_list:
            # Insight sobre plataforma mais viral
            platform_counts = Counter([content['platform'] for content in viral_content_list])
            top_platform = platform_counts.most_common(1)[0]
            insights.append(f"Plataforma mais viral: {top_platform[0]} ({top_platform[1]} conteúdos)")
            
            # Insight sobre tipo de conteúdo
            type_counts = Counter([content['content_type'] for content in viral_content_list])
            top_type = type_counts.most_common(1)[0]
            insights.append(f"Tipo de conteúdo mais viral: {top_type[0]} ({top_type[1]} conteúdos)")
            
            # Insight sobre sentimento
            sentiment_counts = Counter([content['scores']['sentiment_polarity'] for content in viral_content_list if content['scores']['sentiment_polarity']])
            if sentiment_counts:
                top_sentiment = sentiment_counts.most_common(1)[0]
                insights.append(f"Sentimento dominante: {top_sentiment[0]} ({top_sentiment[1]} conteúdos)")
            
            # Insight sobre hashtags
            all_hashtags = []
            for content in viral_content_list:
                all_hashtags.extend(content['hashtags'])
            
            if all_hashtags:
                hashtag_counts = Counter(all_hashtags)
                top_hashtags = hashtag_counts.most_common(5)
                insights.append(f"Top hashtags virais: {', '.join([f'#{tag}' for tag, count in top_hashtags])}")
        
        return jsonify({
            'success': True,
            'period': period,
            'filters': {
                'platform': platform,
                'content_type': content_type,
                'niche': niche,
                'min_viral_score': min_viral_score
            },
            'data': {
                'viral_content': viral_content_list,
                'viral_patterns': patterns_list,
                'temporal_trends': temporal_data,
                'insights': insights,
                'summary': {
                    'total_viral_content': len(viral_content_list),
                    'unique_patterns': len(patterns_list),
                    'date_range': len(temporal_data),
                    'avg_viral_score': statistics.mean([content['scores']['viral_potential'] for content in viral_content_list]) if viral_content_list else 0
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter tendências virais: {e}")
        return jsonify({'error': 'Erro interno ao obter tendências virais'}), 500

@trends_bp.route('/hashtags', methods=['GET'])
@jwt_required()
async def get_hashtag_trends():
    """Obter tendências de hashtags"""
    try:
        # Parâmetros de consulta
        platform = request.args.get('platform')
        period = request.args.get('period', '7d')
        min_usage_count = int(request.args.get('min_usage_count', 5))
        limit = min(int(request.args.get('limit', 50)), 200)
        
        period_mapping = {
            '1d': '1 day',
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days'
        }
        
        if period not in period_mapping:
            return jsonify({'error': 'Período inválido'}), 400
        
        sql_interval = period_mapping[period]
        
        async with current_app.db_pool.acquire() as conn:
            # Construir query base
            where_conditions = [
                "sc.scraped_at >= NOW() - INTERVAL $1",
                "sc.is_active = true",
                "sc.hashtags IS NOT NULL",
                "array_length(sc.hashtags, 1) > 0"
            ]
            params = [sql_interval]
            param_count = 1
            
            if platform:
                param_count += 1
                where_conditions.append(f"sc.platform = ${param_count}")
                params.append(platform)
            
            where_clause = " AND ".join(where_conditions)
            
            # Análise de hashtags trending
            hashtag_trends = await conn.fetch(f"""
                SELECT 
                    hashtag,
                    COUNT(*) as usage_count,
                    COUNT(DISTINCT sc.author_username) as unique_users,
                    COUNT(DISTINCT sc.platform) as platforms_count,
                    AVG(ca.viral_potential_score) as avg_viral_score,
                    AVG(ca.overall_score) as avg_overall_score,
                    AVG(cm.engagement_rate) as avg_engagement_rate,
                    SUM(cm.likes_count) as total_likes,
                    SUM(cm.views_count) as total_views,
                    MAX(sc.scraped_at) as last_seen,
                    ARRAY_AGG(DISTINCT sc.platform) as platforms
                FROM scraped_content sc,
                UNNEST(sc.hashtags) as hashtag
                LEFT JOIN LATERAL (
                    SELECT * FROM content_analyses 
                    WHERE content_id = sc.id 
                    ORDER BY analyzed_at DESC 
                    LIMIT 1
                ) ca ON true
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true
                WHERE {where_clause}
                GROUP BY hashtag
                HAVING COUNT(*) >= ${param_count + 1}
                ORDER BY usage_count DESC, avg_viral_score DESC
                LIMIT ${param_count + 2}
            """, *params, min_usage_count, limit)
            
            # Análise temporal de hashtags (top 10)
            if hashtag_trends:
                top_hashtags = [row['hashtag'] for row in hashtag_trends[:10]]
                
                temporal_hashtag_data = await conn.fetch(f"""
                    SELECT 
                        hashtag,
                        DATE_TRUNC('day', sc.scraped_at) as date,
                        COUNT(*) as daily_usage,
                        AVG(ca.viral_potential_score) as daily_avg_viral_score
                    FROM scraped_content sc,
                    UNNEST(sc.hashtags) as hashtag
                    LEFT JOIN LATERAL (
                        SELECT * FROM content_analyses 
                        WHERE content_id = sc.id 
                        ORDER BY analyzed_at DESC 
                        LIMIT 1
                    ) ca ON true
                    WHERE {where_clause}
                    AND hashtag = ANY(${param_count + 1})
                    GROUP BY hashtag, DATE_TRUNC('day', sc.scraped_at)
                    ORDER BY hashtag, date DESC
                """, *params, top_hashtags)
            else:
                temporal_hashtag_data = []
            
            # Hashtags emergentes (crescimento rápido)
            emerging_hashtags = await conn.fetch(f"""
                WITH hashtag_daily AS (
                    SELECT 
                        hashtag,
                        DATE_TRUNC('day', sc.scraped_at) as date,
                        COUNT(*) as daily_count
                    FROM scraped_content sc,
                    UNNEST(sc.hashtags) as hashtag
                    WHERE {where_clause}
                    GROUP BY hashtag, DATE_TRUNC('day', sc.scraped_at)
                ),
                hashtag_growth AS (
                    SELECT 
                        hashtag,
                        SUM(CASE WHEN date >= NOW() - INTERVAL '3 days' THEN daily_count ELSE 0 END) as recent_count,
                        SUM(CASE WHEN date < NOW() - INTERVAL '3 days' THEN daily_count ELSE 0 END) as older_count,
                        SUM(daily_count) as total_count
                    FROM hashtag_daily
                    GROUP BY hashtag
                    HAVING SUM(daily_count) >= 10
                )
                SELECT 
                    hashtag,
                    recent_count,
                    older_count,
                    total_count,
                    CASE 
                        WHEN older_count > 0 THEN (recent_count::float / older_count::float)
                        ELSE recent_count::float
                    END as growth_ratio
                FROM hashtag_growth
                WHERE recent_count > older_count
                ORDER BY growth_ratio DESC, recent_count DESC
                LIMIT 20
            """, *params)
        
        # Processar dados de hashtags trending
        trending_hashtags = []
        for row in hashtag_trends:
            trending_hashtags.append({
                'hashtag': row['hashtag'],
                'usage_count': row['usage_count'],
                'unique_users': row['unique_users'],
                'platforms_count': row['platforms_count'],
                'platforms': row['platforms'],
                'avg_viral_score': float(row['avg_viral_score']) if row['avg_viral_score'] else 0,
                'avg_overall_score': float(row['avg_overall_score']) if row['avg_overall_score'] else 0,
                'avg_engagement_rate': float(row['avg_engagement_rate']) if row['avg_engagement_rate'] else 0,
                'total_likes': row['total_likes'] or 0,
                'total_views': row['total_views'] or 0,
                'last_seen': row['last_seen'].isoformat(),
                'trend_strength': min(row['usage_count'] / 100, 1.0)  # Normalizar para 0-1
            })
        
        # Processar dados temporais
        temporal_data = defaultdict(dict)
        for row in temporal_hashtag_data:
            hashtag = row['hashtag']
            date_str = row['date'].strftime('%Y-%m-%d')
            temporal_data[hashtag][date_str] = {
                'daily_usage': row['daily_usage'],
                'daily_avg_viral_score': float(row['daily_avg_viral_score']) if row['daily_avg_viral_score'] else 0
            }
        
        # Processar hashtags emergentes
        emerging_list = []
        for row in emerging_hashtags:
            growth_ratio = float(row['growth_ratio'])
            emerging_list.append({
                'hashtag': row['hashtag'],
                'recent_count': row['recent_count'],
                'older_count': row['older_count'],
                'total_count': row['total_count'],
                'growth_ratio': growth_ratio,
                'growth_category': (
                    'explosive' if growth_ratio > 5 else
                    'high' if growth_ratio > 2 else
                    'moderate' if growth_ratio > 1.5 else
                    'steady'
                )
            })
        
        # Gerar insights
        insights = []
        
        if trending_hashtags:
            # Top hashtag
            top_hashtag = trending_hashtags[0]
            insights.append(f"Hashtag mais popular: #{top_hashtag['hashtag']} ({top_hashtag['usage_count']} usos)")
            
            # Hashtag mais viral
            most_viral = max(trending_hashtags, key=lambda x: x['avg_viral_score'])
            if most_viral['avg_viral_score'] > 0:
                insights.append(f"Hashtag mais viral: #{most_viral['hashtag']} (score: {most_viral['avg_viral_score']:.3f})")
            
            # Cross-platform hashtags
            cross_platform = [h for h in trending_hashtags if h['platforms_count'] > 1]
            if cross_platform:
                insights.append(f"{len(cross_platform)} hashtags estão trending em múltiplas plataformas")
        
        if emerging_list:
            explosive_growth = [h for h in emerging_list if h['growth_category'] == 'explosive']
            if explosive_growth:
                insights.append(f"{len(explosive_growth)} hashtags com crescimento explosivo detectadas")
        
        return jsonify({
            'success': True,
            'period': period,
            'filters': {
                'platform': platform,
                'min_usage_count': min_usage_count
            },
            'data': {
                'trending_hashtags': trending_hashtags,
                'emerging_hashtags': emerging_list,
                'temporal_trends': dict(temporal_data),
                'insights': insights,
                'summary': {
                    'total_trending': len(trending_hashtags),
                    'total_emerging': len(emerging_list),
                    'cross_platform_count': len([h for h in trending_hashtags if h['platforms_count'] > 1]),
                    'avg_usage_per_hashtag': statistics.mean([h['usage_count'] for h in trending_hashtags]) if trending_hashtags else 0
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter tendências de hashtags: {e}")
        return jsonify({'error': 'Erro interno ao obter tendências de hashtags'}), 500

@trends_bp.route('/creators', methods=['GET'])
@jwt_required()
async def get_creator_trends():
    """Obter tendências de criadores de conteúdo"""
    try:
        # Parâmetros de consulta
        platform = request.args.get('platform')
        period = request.args.get('period', '7d')
        min_content_count = int(request.args.get('min_content_count', 3))
        sort_by = request.args.get('sort_by', 'viral_score')  # viral_score, engagement, growth, consistency
        limit = min(int(request.args.get('limit', 50)), 200)
        
        period_mapping = {
            '1d': '1 day',
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days'
        }
        
        if period not in period_mapping:
            return jsonify({'error': 'Período inválido'}), 400
        
        sql_interval = period_mapping[period]
        
        async with current_app.db_pool.acquire() as conn:
            # Construir query base
            where_conditions = [
                "sc.scraped_at >= NOW() - INTERVAL $1",
                "sc.is_active = true",
                "sc.author_username IS NOT NULL"
            ]
            params = [sql_interval]
            param_count = 1
            
            if platform:
                param_count += 1
                where_conditions.append(f"sc.platform = ${param_count}")
                params.append(platform)
            
            where_clause = " AND ".join(where_conditions)
            
            # Análise de criadores trending
            creator_trends = await conn.fetch(f"""
                SELECT 
                    sc.author_username,
                    sc.author_display_name,
                    sc.author_followers_count,
                    sc.author_verified,
                    sc.platform,
                    COUNT(*) as content_count,
                    COUNT(DISTINCT sc.content_type) as content_types_count,
                    AVG(ca.viral_potential_score) as avg_viral_score,
                    AVG(ca.overall_score) as avg_overall_score,
                    AVG(ca.sentiment_score) as avg_sentiment_score,
                    AVG(cm.engagement_rate) as avg_engagement_rate,
                    SUM(cm.likes_count) as total_likes,
                    SUM(cm.comments_count) as total_comments,
                    SUM(cm.shares_count) as total_shares,
                    SUM(cm.views_count) as total_views,
                    MAX(sc.scraped_at) as last_content_date,
                    MIN(sc.scraped_at) as first_content_date,
                    STDDEV(ca.viral_potential_score) as viral_score_consistency,
                    ARRAY_AGG(DISTINCT hashtag) FILTER (WHERE hashtag IS NOT NULL) as common_hashtags
                FROM scraped_content sc
                LEFT JOIN LATERAL (
                    SELECT * FROM content_analyses 
                    WHERE content_id = sc.id 
                    ORDER BY analyzed_at DESC 
                    LIMIT 1
                ) ca ON true
                LEFT JOIN LATERAL (
                    SELECT * FROM content_metrics 
                    WHERE content_id = sc.id 
                    ORDER BY collected_at DESC 
                    LIMIT 1
                ) cm ON true,
                UNNEST(COALESCE(sc.hashtags, ARRAY[]::TEXT[])) as hashtag
                WHERE {where_clause}
                GROUP BY sc.author_username, sc.author_display_name, sc.author_followers_count, 
                         sc.author_verified, sc.platform
                HAVING COUNT(*) >= ${param_count + 1}
                ORDER BY 
                    CASE 
                        WHEN '${sort_by}' = 'viral_score' THEN AVG(ca.viral_potential_score)
                        WHEN '${sort_by}' = 'engagement' THEN AVG(cm.engagement_rate)
                        WHEN '${sort_by}' = 'growth' THEN SUM(cm.likes_count + cm.comments_count + cm.shares_count)
                        ELSE AVG(ca.viral_potential_score)
                    END DESC NULLS LAST
                LIMIT ${param_count + 2}
            """, *params, min_content_count, limit)
            
            # Análise de crescimento de criadores (comparar períodos)
            growth_analysis = await conn.fetch(f"""
                WITH creator_periods AS (
                    SELECT 
                        sc.author_username,
                        sc.platform,
                        CASE 
                            WHEN sc.scraped_at >= NOW() - INTERVAL '3 days' THEN 'recent'
                            ELSE 'older'
                        END as period,
                        COUNT(*) as content_count,
                        AVG(ca.viral_potential_score) as avg_viral_score,
                        AVG(cm.engagement_rate) as avg_engagement_rate
                    FROM scraped_content sc
                    LEFT JOIN LATERAL (
                        SELECT * FROM content_analyses 
                        WHERE content_id = sc.id 
                        ORDER BY analyzed_at DESC 
                        LIMIT 1
                    ) ca ON true
                    LEFT JOIN LATERAL (
                        SELECT * FROM content_metrics 
                        WHERE content_id = sc.id 
                        ORDER BY collected_at DESC 
                        LIMIT 1
                    ) cm ON true
                    WHERE {where_clause}
                    GROUP BY sc.author_username, sc.platform, period
                )
                SELECT 
                    author_username,
                    platform,
                    MAX(CASE WHEN period = 'recent' THEN content_count ELSE 0 END) as recent_content_count,
                    MAX(CASE WHEN period = 'older' THEN content_count ELSE 0 END) as older_content_count,
                    MAX(CASE WHEN period = 'recent' THEN avg_viral_score ELSE 0 END) as recent_viral_score,
                    MAX(CASE WHEN period = 'older' THEN avg_viral_score ELSE 0 END) as older_viral_score,
                    MAX(CASE WHEN period = 'recent' THEN avg_engagement_rate ELSE 0 END) as recent_engagement_rate,
                    MAX(CASE WHEN period = 'older' THEN avg_engagement_rate ELSE 0 END) as older_engagement_rate
                FROM creator_periods
                GROUP BY author_username, platform
                HAVING MAX(CASE WHEN period = 'recent' THEN content_count ELSE 0 END) > 0
                ORDER BY 
                    (MAX(CASE WHEN period = 'recent' THEN avg_viral_score ELSE 0 END) - 
                     MAX(CASE WHEN period = 'older' THEN avg_viral_score ELSE 0 END)) DESC
                LIMIT 20
            """, *params)
        
        # Processar dados de criadores trending
        trending_creators = []
        for row in creator_trends:
            # Calcular métricas derivadas
            days_active = (row['last_content_date'] - row['first_content_date']).days + 1
            consistency_score = 1 - min(float(row['viral_score_consistency'] or 0) / 0.5, 1.0)  # Inverter e normalizar
            
            # Calcular engagement total
            total_engagement = (row['total_likes'] or 0) + (row['total_comments'] or 0) + (row['total_shares'] or 0)
            
            # Calcular score de crescimento baseado em frequência
            growth_score = row['content_count'] / max(days_active, 1)
            
            trending_creators.append({
                'username': row['author_username'],
                'display_name': row['author_display_name'],
                'platform': row['platform'],
                'followers_count': row['author_followers_count'],
                'verified': row['author_verified'] or False,
                'content_stats': {
                    'content_count': row['content_count'],
                    'content_types_count': row['content_types_count'],
                    'days_active': days_active,
                    'content_frequency': growth_score
                },
                'performance_scores': {
                    'avg_viral_score': float(row['avg_viral_score']) if row['avg_viral_score'] else 0,
                    'avg_overall_score': float(row['avg_overall_score']) if row['avg_overall_score'] else 0,
                    'avg_sentiment_score': float(row['avg_sentiment_score']) if row['avg_sentiment_score'] else 0,
                    'avg_engagement_rate': float(row['avg_engagement_rate']) if row['avg_engagement_rate'] else 0,
                    'consistency_score': consistency_score
                },
                'engagement_metrics': {
                    'total_likes': row['total_likes'] or 0,
                    'total_comments': row['total_comments'] or 0,
                    'total_shares': row['total_shares'] or 0,
                    'total_views': row['total_views'] or 0,
                    'total_engagement': total_engagement,
                    'avg_engagement_per_content': total_engagement / row['content_count'] if row['content_count'] > 0 else 0
                },
                'common_hashtags': (row['common_hashtags'] or [])[:10],  # Top 10 hashtags
                'activity_period': {
                    'first_content': row['first_content_date'].isoformat(),
                    'last_content': row['last_content_date'].isoformat(),
                    'days_active': days_active
                }
            })
        
        # Processar dados de crescimento
        growth_creators = []
        for row in growth_analysis:
            recent_viral = float(row['recent_viral_score']) if row['recent_viral_score'] else 0
            older_viral = float(row['older_viral_score']) if row['older_viral_score'] else 0
            
            viral_growth = recent_viral - older_viral
            
            recent_engagement = float(row['recent_engagement_rate']) if row['recent_engagement_rate'] else 0
            older_engagement = float(row['older_engagement_rate']) if row['older_engagement_rate'] else 0
            
            engagement_growth = recent_engagement - older_engagement
            
            growth_creators.append({
                'username': row['author_username'],
                'platform': row['platform'],
                'content_growth': {
                    'recent_count': row['recent_content_count'],
                    'older_count': row['older_content_count'],
                    'growth_rate': (row['recent_content_count'] - row['older_content_count']) / max(row['older_content_count'], 1)
                },
                'performance_growth': {
                    'viral_score_growth': viral_growth,
                    'engagement_growth': engagement_growth,
                    'recent_viral_score': recent_viral,
                    'recent_engagement_rate': recent_engagement
                },
                'growth_category': (
                    'rising_star' if viral_growth > 0.2 and engagement_growth > 0.05 else
                    'improving' if viral_growth > 0.1 or engagement_growth > 0.02 else
                    'stable' if abs(viral_growth) <= 0.1 and abs(engagement_growth) <= 0.02 else
                    'declining'
                )
            })
        
        # Gerar insights
        insights = []
        
        if trending_creators:
            # Top creator
            top_creator = trending_creators[0]
            insights.append(f"Creator mais viral: @{top_creator['username']} (score: {top_creator['performance_scores']['avg_viral_score']:.3f})")
            
            # Creators verificados
            verified_count = len([c for c in trending_creators if c['verified']])
            if verified_count > 0:
                insights.append(f"{verified_count}/{len(trending_creators)} creators trending são verificados")
            
            # Consistência
            consistent_creators = [c for c in trending_creators if c['performance_scores']['consistency_score'] > 0.7]
            if consistent_creators:
                insights.append(f"{len(consistent_creators)} creators demonstram alta consistência de performance")
            
            # Diversidade de conteúdo
            diverse_creators = [c for c in trending_creators if c['content_stats']['content_types_count'] > 2]
            if diverse_creators:
                insights.append(f"{len(diverse_creators)} creators produzem múltiplos tipos de conteúdo")
        
        if growth_creators:
            rising_stars = [c for c in growth_creators if c['growth_category'] == 'rising_star']
            if rising_stars:
                insights.append(f"{len(rising_stars)} creators identificados como 'estrelas em ascensão'")
        
        return jsonify({
            'success': True,
            'period': period,
            'filters': {
                'platform': platform,
                'min_content_count': min_content_count,
                'sort_by': sort_by
            },
            'data': {
                'trending_creators': trending_creators,
                'growth_analysis': growth_creators,
                'insights': insights,
                'summary': {
                    'total_trending_creators': len(trending_creators),
                    'total_growth_tracked': len(growth_creators),
                    'verified_creators': len([c for c in trending_creators if c['verified']]),
                    'avg_viral_score': statistics.mean([c['performance_scores']['avg_viral_score'] for c in trending_creators]) if trending_creators else 0,
                    'avg_content_per_creator': statistics.mean([c['content_stats']['content_count'] for c in trending_creators]) if trending_creators else 0
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter tendências de creators: {e}")
        return jsonify({'error': 'Erro interno ao obter tendências de creators'}), 500

@trends_bp.route('/predictions', methods=['GET'])
@jwt_required()
async def get_trend_predictions():
    """Obter predições de tendências usando memória evolutiva"""
    try:
        # Parâmetros de consulta
        platform = request.args.get('platform')
        prediction_horizon = request.args.get('horizon', '24h')  # 24h, 7d, 30d
        confidence_threshold = float(request.args.get('confidence_threshold', 0.7))
        category = request.args.get('category', 'all')  # viral, hashtags, creators, sentiment
        
        # Validar horizonte de predição
        horizon_mapping = {
            '24h': 1,
            '7d': 7,
            '30d': 30
        }
        
        if prediction_horizon not in horizon_mapping:
            return jsonify({'error': 'Horizonte de predição inválido. Use: 24h, 7d, 30d'}), 400
        
        horizon_days = horizon_mapping[prediction_horizon]
        
        # Usar memória evolutiva para predições
        evolutionary_memory = current_app.evolutionary_memory
        
        # Buscar padrões evolutivos relevantes
        pattern_filters = {
            'platforms': [platform] if platform else None,
            'confidence_threshold': confidence_threshold,
            'is_active': True
        }
        
        relevant_patterns = await evolutionary_memory.get_relevant_patterns(
            context={'prediction_horizon': horizon_days, 'category': category},
            filters=pattern_filters
        )
        
        predictions = {
            'viral_content': [],
            'trending_hashtags': [],
            'rising_creators': [],
            'sentiment_shifts': [],
            'platform_trends': []
        }
        
        # Processar padrões para gerar predições
        for pattern in relevant_patterns:
            pattern_type = pattern.get('pattern_type', '')
            pattern_data = pattern.get('pattern_data', {})
            confidence = pattern.get('confidence_score', 0)
            
            if confidence < confidence_threshold:
                continue
            
            if 'viral' in pattern_type.lower() and (category == 'all' or category == 'viral'):
                predictions['viral_content'].append({
                    'prediction_type': 'viral_content_surge',
                    'description': f"Aumento previsto em conteúdo viral do tipo {pattern_data.get('content_type', 'unknown')}",
                    'confidence': confidence,
                    'expected_increase': pattern_data.get('growth_rate', 0.2),
                    'key_factors': pattern_data.get('key_factors', []),
                    'timeline': f"Próximos {horizon_days} dias",
                    'platform': pattern_data.get('platform', platform),
                    'pattern_id': pattern.get('id')
                })
            
            elif 'hashtag' in pattern_type.lower() and (category == 'all' or category == 'hashtags'):
                predictions['trending_hashtags'].append({
                    'hashtag': pattern_data.get('hashtag', ''),
                    'prediction_type': 'hashtag_emergence',
                    'description': f"#{pattern_data.get('hashtag', '')} tem alta probabilidade de se tornar trending",
                    'confidence': confidence,
                    'expected_growth': pattern_data.get('expected_growth', 'high'),
                    'similar_patterns': pattern_data.get('similar_patterns', []),
                    'timeline': f"Próximos {horizon_days} dias",
                    'platforms': pattern_data.get('platforms', [platform] if platform else [])
                })
            
            elif 'creator' in pattern_type.lower() and (category == 'all' or category == 'creators'):
                predictions['rising_creators'].append({
                    'prediction_type': 'creator_breakthrough',
                    'description': f"Creators do nicho {pattern_data.get('niche', 'geral')} mostram padrão de crescimento",
                    'confidence': confidence,
                    'growth_indicators': pattern_data.get('growth_indicators', []),
                    'expected_metrics': pattern_data.get('expected_metrics', {}),
                    'timeline': f"Próximos {horizon_days} dias",
                    'niche': pattern_data.get('niche', 'geral')
                })
            
            elif 'sentiment' in pattern_type.lower() and (category == 'all' or category == 'sentiment'):
                predictions['sentiment_shifts'].append({
                    'prediction_type': 'sentiment_shift',
                    'description': f"Mudança prevista no sentimento dominante para {pattern_data.get('target_sentiment', 'positive')}",
                    'confidence': confidence,
                    'current_sentiment': pattern_data.get('current_sentiment', 'neutral'),
                    'predicted_sentiment': pattern_data.get('target_sentiment', 'positive'),
                    'driving_factors': pattern_data.get('driving_factors', []),
                    'timeline': f"Próximos {horizon_days} dias",
                    'impact_level': pattern_data.get('impact_level', 'medium')
                })
        
        # Gerar predições de plataforma baseadas em dados históricos
        async with current_app.db_pool.acquire() as conn:
            # Análise de crescimento por plataforma
            platform_growth = await conn.fetch("""
                WITH daily_stats AS (
                    SELECT 
                        sc.platform,
                        DATE_TRUNC('day', sc.scraped_at) as date,
                        COUNT(*) as daily_content,
                        AVG(ca.viral_potential_score) as daily_viral_avg
                    FROM scraped_content sc
                    LEFT JOIN content_analyses ca ON sc.id = ca.content_id
                    WHERE sc.scraped_at >= NOW() - INTERVAL '14 days'
                    AND sc.is_active = true
                    GROUP BY sc.platform, DATE_TRUNC('day', sc.scraped_at)
                ),
                platform_trends AS (
                    SELECT 
                        platform,
                        AVG(CASE WHEN date >= NOW() - INTERVAL '7 days' THEN daily_content END) as recent_avg,
                        AVG(CASE WHEN date < NOW() - INTERVAL '7 days' THEN daily_content END) as older_avg,
                        AVG(CASE WHEN date >= NOW() - INTERVAL '7 days' THEN daily_viral_avg END) as recent_viral_avg,
                        AVG(CASE WHEN date < NOW() - INTERVAL '7 days' THEN daily_viral_avg END) as older_viral_avg
                    FROM daily_stats
                    GROUP BY platform
                )
                SELECT 
                    platform,
                    recent_avg,
                    older_avg,
                    recent_viral_avg,
                    older_viral_avg,
                    CASE 
                        WHEN older_avg > 0 THEN (recent_avg - older_avg) / older_avg
                        ELSE 0
                    END as content_growth_rate,
                    CASE 
                        WHEN older_viral_avg > 0 THEN (recent_viral_avg - older_viral_avg) / older_viral_avg
                        ELSE 0
                    END as viral_growth_rate
                FROM platform_trends
                WHERE recent_avg IS NOT NULL AND older_avg IS NOT NULL
                ORDER BY content_growth_rate DESC
            """)
            
            for row in platform_growth:
                content_growth = float(row['content_growth_rate'])
                viral_growth = float(row['viral_growth_rate'])
                
                if abs(content_growth) > 0.1 or abs(viral_growth) > 0.1:
                    trend_direction = 'crescimento' if content_growth > 0 else 'declínio'
                    viral_trend = 'melhoria' if viral_growth > 0 else 'queda'
                    
                    predictions['platform_trends'].append({
                        'platform': row['platform'],
                        'prediction_type': 'platform_activity_trend',
                        'description': f"{row['platform']} mostra {trend_direction} na atividade e {viral_trend} na qualidade viral",
                        'confidence': min(abs(content_growth) + abs(viral_growth), 1.0),
                        'metrics': {
                            'content_growth_rate': content_growth,
                            'viral_growth_rate': viral_growth,
                            'recent_daily_avg': float(row['recent_avg']) if row['recent_avg'] else 0,
                            'recent_viral_avg': float(row['recent_viral_avg']) if row['recent_viral_avg'] else 0
                        },
                        'timeline': f"Próximos {horizon_days} dias",
                        'trend_strength': 'forte' if abs(content_growth) > 0.3 else 'moderada' if abs(content_growth) > 0.1 else 'fraca'
                    })
        
        # Calcular estatísticas de predição
        total_predictions = sum(len(predictions[key]) for key in predictions)
        high_confidence_predictions = sum(
            len([p for p in predictions[key] if p.get('confidence', 0) > 0.8])
            for key in predictions
        )
        
        # Gerar insights de predição
        prediction_insights = []
        
        if predictions['viral_content']:
            prediction_insights.append(f"{len(predictions['viral_content'])} surtos de conteúdo viral previstos")
        
        if predictions['trending_hashtags']:
            top_hashtag_prediction = max(predictions['trending_hashtags'], key=lambda x: x['confidence'])
            prediction_insights.append(f"#{top_hashtag_prediction['hashtag']} tem maior probabilidade de trending")
        
        if predictions['platform_trends']:
            growing_platforms = [p for p in predictions['platform_trends'] if p['metrics']['content_growth_rate'] > 0]
            if growing_platforms:
                prediction_insights.append(f"{len(growing_platforms)} plataformas em crescimento identificadas")
        
        return jsonify({
            'success': True,
            'prediction_horizon': prediction_horizon,
            'filters': {
                'platform': platform,
                'confidence_threshold': confidence_threshold,
                'category': category
            },
            'data': {
                'predictions': predictions,
                'insights': prediction_insights,
                'summary': {
                    'total_predictions': total_predictions,
                    'high_confidence_predictions': high_confidence_predictions,
                    'prediction_categories': len([k for k, v in predictions.items() if v]),
                    'avg_confidence': statistics.mean([
                        p.get('confidence', 0) 
                        for category_predictions in predictions.values() 
                        for p in category_predictions
                    ]) if total_predictions > 0 else 0
                },
                'methodology': {
                    'data_source': 'evolutionary_memory_patterns',
                    'pattern_count': len(relevant_patterns),
                    'confidence_threshold': confidence_threshold,
                    'prediction_algorithm': 'pattern_matching_with_historical_analysis'
                }
            },
            'timestamp': datetime.utcnow().isoformat(),
            'valid_until': (datetime.utcnow() + timedelta(hours=6)).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao gerar predições de tendências: {e}")
        return jsonify({'error': 'Erro interno ao gerar predições'}), 500

