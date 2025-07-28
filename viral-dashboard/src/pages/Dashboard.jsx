/**
 * DASHBOARD PAGE
 * Página principal do dashboard com métricas e gráficos
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboard } from '../lib/api';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Queries para dados do dashboard
  const { 
    data: overviewData, 
    isLoading: overviewLoading, 
    refetch: refetchOverview 
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboard.getOverview,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 15000, // Considerar dados frescos por 15 segundos
  });

  const { 
    data: statsData, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['dashboard-stats', selectedPeriod],
    queryFn: () => dashboard.getStats(selectedPeriod),
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });

  const { 
    data: activityData, 
    isLoading: activityLoading, 
    refetch: refetchActivity 
  } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboard.getRecentActivity(10),
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  // Função para refresh manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchOverview(),
        refetchStats(),
        refetchActivity()
      ]);
      toast.success('Dashboard atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dados para os cards de métricas
  const getMetricCards = () => {
    if (!overviewData?.data) return [];

    const data = overviewData.data;
    
    return [
      {
        title: 'Total de Conteúdo',
        value: data.total_content?.toLocaleString() || '0',
        change: data.growth_rate ? `+${data.growth_rate}%` : '+0%',
        changeType: 'positive',
        icon: BarChart3,
        color: 'blue'
      },
      {
        title: 'Conteúdo Viral',
        value: data.viral_content?.toLocaleString() || '0',
        change: '+17.9%',
        changeType: 'positive',
        icon: TrendingUp,
        color: 'green'
      },
      {
        title: 'Scrapers Ativos',
        value: data.active_scrapers?.toString() || '0',
        change: '0.0%',
        changeType: 'neutral',
        icon: Activity,
        color: 'purple'
      },
      {
        title: 'Análises IA',
        value: data.ai_analyses?.toLocaleString() || '0',
        change: '+9.5%',
        changeType: 'positive',
        icon: Users,
        color: 'orange'
      }
    ];
  };

  // Cores para os gráficos
  const COLORS = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
    pink: '#EC4899',
    indigo: '#6366F1',
    yellow: '#EAB308'
  };

  // Preparar dados para gráfico de atividade diária
  const getDailyActivityData = () => {
    if (!statsData?.data?.daily_activity) return [];
    
    return statsData.data.daily_activity.map(day => ({
      date: new Date(day.date).toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      scraped: day.scraped,
      analyzed: day.analyzed,
      viral: day.viral
    }));
  };

  // Preparar dados para gráfico de distribuição por plataforma
  const getPlatformData = () => {
    if (!statsData?.data?.content_by_platform) return [];
    
    return statsData.data.content_by_platform.map(platform => ({
      name: platform.platform,
      value: platform.count,
      color: platform.color
    }));
  };

  // Preparar dados para gráfico de score viral
  const getViralScoreData = () => {
    if (!statsData?.data?.viral_score_distribution) return [];
    
    return statsData.data.viral_score_distribution.map(score => ({
      range: score.range,
      count: score.count
    }));
  };

  // Preparar dados de atividade recente
  const getRecentActivities = () => {
    if (!activityData?.data?.activities) return [];
    
    return activityData.data.activities.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp).toLocaleString('pt-BR')
    }));
  };

  const metricCards = getMetricCards();
  const dailyActivity = getDailyActivityData();
  const platformData = getPlatformData();
  const viralScoreData = getViralScoreData();
  const recentActivities = getRecentActivities();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral do sistema de scraping inteligente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Seletor de período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          {/* Botão de refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {overviewLoading ? (
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900/20`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                </div>
              </div>
              
              {!overviewLoading && (
                <div className="flex items-center mt-4">
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                    card.changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    vs período anterior
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Diária */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atividade Diária
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Coletado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Analisado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Viral</span>
              </div>
            </div>
          </div>
          
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scraped"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="analyzed"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="viral"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribuição por Plataforma */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Distribuição por Plataforma
          </h3>
          
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Score Viral e Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Score Viral */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Distribuição de Score Viral
          </h3>
          
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viralScoreData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="range" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Atividade Recente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Atividade Recente
          </h3>
          
          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div key={activity.id || index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    activity.type === 'viral_content' ? 'bg-red-500' :
                    activity.type === 'scraping_completed' ? 'bg-blue-500' :
                    activity.type === 'template_generated' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}>
                    {activity.platform?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              
              {recentActivities.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma atividade recente
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Iniciar Scraping</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coletar novo conteúdo</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Analisar Tendências</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ver conteúdo viral</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Gerar Relatório</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exportar dados</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

