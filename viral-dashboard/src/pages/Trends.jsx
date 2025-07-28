/**
 * TRENDS PAGE
 * Página para análise de tendências virais
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown,
  Hash,
  User,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Star,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Target,
  Flame
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { trends } from '../lib/api';
import toast from 'react-hot-toast';

const Trends = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minViralScore, setMinViralScore] = useState(70);

  // Query para conteúdo viral
  const { data: viralContent, isLoading: viralLoading, refetch: refetchViral } = useQuery({
    queryKey: ['viral-content', selectedPeriod, selectedPlatform, minViralScore],
    queryFn: () => trends.getViral({
      period: selectedPeriod,
      platform: selectedPlatform,
      min_score: minViralScore,
      limit: 20
    }),
    refetchInterval: 30000
  });

  // Query para hashtags trending
  const { data: trendingHashtags, isLoading: hashtagsLoading } = useQuery({
    queryKey: ['trending-hashtags', selectedPeriod, selectedPlatform],
    queryFn: () => trends.getHashtags({
      period: selectedPeriod,
      platform: selectedPlatform,
      limit: 15
    }),
    refetchInterval: 60000
  });

  // Query para creators trending
  const { data: trendingCreators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['trending-creators', selectedPeriod, selectedPlatform],
    queryFn: () => trends.getCreators({
      period: selectedPeriod,
      platform: selectedPlatform,
      limit: 10
    }),
    refetchInterval: 60000
  });

  // Query para predições
  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['trend-predictions', selectedPlatform],
    queryFn: () => trends.getPredictions({
      platform: selectedPlatform,
      timeframe: '24h'
    }),
    refetchInterval: 300000 // 5 minutos
  });

  // Dados mockados para demonstração
  const mockViralTrends = [
    { date: '21 Jan', viral: 45, emerging: 12, declining: 8 },
    { date: '22 Jan', viral: 52, emerging: 15, declining: 6 },
    { date: '23 Jan', viral: 48, emerging: 18, declining: 9 },
    { date: '24 Jan', viral: 61, emerging: 22, declining: 5 },
    { date: '25 Jan', viral: 58, emerging: 25, declining: 7 },
    { date: '26 Jan', viral: 67, emerging: 28, declining: 4 },
    { date: '27 Jan', viral: 73, emerging: 32, declining: 3 }
  ];

  const mockPlatformDistribution = [
    { name: 'Instagram', value: 42, color: '#E4405F' },
    { name: 'TikTok', value: 35, color: '#000000' },
    { name: 'YouTube', value: 15, color: '#FF0000' },
    { name: 'LinkedIn', value: 8, color: '#0A66C2' }
  ];

  const mockCategoryTrends = [
    { category: 'Lifestyle', count: 245, growth: 18.5 },
    { category: 'Business', count: 189, growth: 12.3 },
    { category: 'Tech', count: 156, growth: 25.7 },
    { category: 'Fitness', count: 134, growth: 8.9 },
    { category: 'Food', count: 98, growth: 15.2 },
    { category: 'Travel', count: 87, growth: -3.4 }
  ];

  const mockViralContent = [
    {
      id: 1,
      title: "10 Dicas para Produtividade",
      platform: "Instagram",
      type: "Carousel",
      viral_score: 95,
      views: 2400000,
      likes: 180000,
      comments: 12500,
      shares: 8900,
      growth_rate: 245.8,
      creator: "@produtividade_max",
      created_at: "2025-01-27T10:30:00Z"
    },
    {
      id: 2,
      title: "Receita Viral de Brownie",
      platform: "TikTok",
      type: "Video",
      viral_score: 92,
      views: 1800000,
      likes: 220000,
      comments: 8900,
      shares: 15600,
      growth_rate: 189.3,
      creator: "@chef_viral",
      created_at: "2025-01-27T08:15:00Z"
    },
    {
      id: 3,
      title: "Transformação de 30 Dias",
      platform: "Instagram",
      type: "Reel",
      viral_score: 89,
      views: 1200000,
      likes: 95000,
      comments: 4200,
      shares: 6800,
      growth_rate: 156.7,
      creator: "@fitness_journey",
      created_at: "2025-01-27T06:45:00Z"
    }
  ];

  const mockHashtags = [
    { hashtag: "produtividade2025", count: 45600, growth: 234.5, trend: "up" },
    { hashtag: "receitasviral", count: 38900, growth: 189.2, trend: "up" },
    { hashtag: "transformacao", count: 32100, growth: 156.8, trend: "up" },
    { hashtag: "dicastech", count: 28700, growth: 98.4, trend: "up" },
    { hashtag: "lifestyle", count: 25300, growth: 67.9, trend: "stable" },
    { hashtag: "businesstips", count: 22800, growth: 45.2, trend: "stable" }
  ];

  const mockCreators = [
    {
      username: "@produtividade_max",
      platform: "Instagram",
      followers: 245000,
      viral_score: 94,
      growth_rate: 18.5,
      avg_engagement: 8.7,
      category: "Business",
      trend: "rising"
    },
    {
      username: "@chef_viral",
      platform: "TikTok", 
      followers: 189000,
      viral_score: 91,
      growth_rate: 25.3,
      avg_engagement: 12.4,
      category: "Food",
      trend: "rising"
    },
    {
      username: "@fitness_journey",
      platform: "Instagram",
      followers: 156000,
      viral_score: 87,
      growth_rate: 15.8,
      avg_engagement: 9.2,
      category: "Fitness",
      trend: "stable"
    }
  ];

  const getPlatformIcon = (platform) => {
    const icons = {
      Instagram: '📸',
      TikTok: '🎵',
      YouTube: '📺',
      LinkedIn: '💼'
    };
    return icons[platform] || '📱';
  };

  const getViralScoreColor = (score) => {
    if (score >= 90) return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    if (score >= 80) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatGrowth = (growth) => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tendências Virais
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitore conteúdo viral e tendências emergentes em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="business">Business</option>
            <option value="tech">Tech</option>
            <option value="fitness">Fitness</option>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
          </select>
          
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Plataformas</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
          
          <button
            onClick={() => {
              refetchViral();
              toast.success('Dados atualizados!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conteúdo Viral
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                73
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
              <Flame className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+18.5%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs ontem</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hashtags Emergentes
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                32
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+25.3%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs ontem</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Creators em Alta
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                18
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+12.8%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs ontem</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Score Viral Médio
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                84
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+3.2%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs ontem</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendências Virais */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Evolução de Tendências Virais
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockViralTrends}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
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
                dataKey="viral"
                stackId="1"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="emerging"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="declining"
                stackId="1"
                stroke="#6B7280"
                fill="#6B7280"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Plataforma */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Distribuição por Plataforma
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={mockPlatformDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockPlatformDistribution.map((entry, index) => (
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
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conteúdo Viral */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conteúdo Viral Recente
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Score mínimo:</span>
            <input
              type="range"
              min="50"
              max="100"
              value={minViralScore}
              onChange={(e) => setMinViralScore(e.target.value)}
              className="w-20"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
              {minViralScore}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {mockViralContent.map((content) => (
            <div key={content.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center text-2xl">
                {getPlatformIcon(content.platform)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {content.title}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    • {content.type}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {content.creator}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatNumber(content.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {formatNumber(content.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {formatNumber(content.comments)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-4 h-4" />
                    {formatNumber(content.shares)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getViralScoreColor(content.viral_score)}`}>
                    {content.viral_score}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formatGrowth(content.growth_rate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Crescimento</p>
                </div>
                
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags e Creators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hashtags Trending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Hashtags em Alta
          </h3>
          
          <div className="space-y-3">
            {mockHashtags.map((hashtag, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {hashtag.hashtag}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatNumber(hashtag.count)} posts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatGrowth(hashtag.growth)}
                  </span>
                  {getTrendIcon(hashtag.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creators Trending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Creators em Ascensão
          </h3>
          
          <div className="space-y-4">
            {mockCreators.map((creator, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                  {creator.username.charAt(1).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {creator.username}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full">
                      {creator.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatNumber(creator.followers)} seguidores</span>
                    <span>{creator.avg_engagement}% engajamento</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getViralScoreColor(creator.viral_score)}`}>
                    {creator.viral_score}
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    {getTrendIcon(creator.trend)}
                    <span className="text-sm font-medium">
                      {formatGrowth(creator.growth_rate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorias Trending */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Tendências por Categoria
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockCategoryTrends}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="category" className="text-gray-600 dark:text-gray-400" />
            <YAxis className="text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgb(31 41 55)',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Trends;

