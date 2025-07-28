/**
 * SENTIMENT ANALYSIS PAGE
 * Página para análise de sentimento de conteúdo
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Brain, 
  Heart, 
  Frown, 
  Meh, 
  Smile, 
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  MessageCircle,
  Hash,
  User,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { analysis } from '../lib/api';
import toast from 'react-hot-toast';

const SentimentAnalysis = () => {
  const [inputText, setInputText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [analysisResults, setAnalysisResults] = useState(null);

  // Mutation para análise de sentimento
  const analyzeSentimentMutation = useMutation({
    mutationFn: (text) => analysis.analyzeSentiment(text),
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast.success('Análise de sentimento concluída!');
    },
    onError: (error) => {
      toast.error('Erro na análise: ' + error.message);
    }
  });

  // Query para dados de tendências de sentimento
  const { data: sentimentTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['sentiment-trends', selectedPeriod, selectedPlatform],
    queryFn: () => analysis.getAnalysisTrends({ 
      type: 'sentiment',
      period: selectedPeriod,
      platform: selectedPlatform 
    }),
    refetchInterval: 60000
  });

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      toast.error('Por favor, insira um texto para análise');
      return;
    }

    analyzeSentimentMutation.mutate(inputText);
  };

  // Cores para diferentes sentimentos
  const SENTIMENT_COLORS = {
    positive: '#10B981',
    neutral: '#6B7280',
    negative: '#EF4444',
    joy: '#F59E0B',
    anger: '#DC2626',
    fear: '#7C3AED',
    sadness: '#3B82F6',
    surprise: '#EC4899',
    disgust: '#059669',
    trust: '#0D9488',
    anticipation: '#8B5CF6'
  };

  // Dados mockados para demonstração
  const mockSentimentTrends = [
    { date: '21 Jan', positive: 65, neutral: 25, negative: 10 },
    { date: '22 Jan', positive: 72, neutral: 20, negative: 8 },
    { date: '23 Jan', positive: 68, neutral: 22, negative: 10 },
    { date: '24 Jan', positive: 75, neutral: 18, negative: 7 },
    { date: '25 Jan', positive: 70, neutral: 23, negative: 7 },
    { date: '26 Jan', positive: 78, neutral: 15, negative: 7 },
    { date: '27 Jan', positive: 82, neutral: 12, negative: 6 }
  ];

  const mockEmotionDistribution = [
    { name: 'Alegria', value: 35, color: SENTIMENT_COLORS.joy },
    { name: 'Confiança', value: 25, color: SENTIMENT_COLORS.trust },
    { name: 'Surpresa', value: 15, color: SENTIMENT_COLORS.surprise },
    { name: 'Medo', value: 10, color: SENTIMENT_COLORS.fear },
    { name: 'Raiva', value: 8, color: SENTIMENT_COLORS.anger },
    { name: 'Tristeza', value: 4, color: SENTIMENT_COLORS.sadness },
    { name: 'Nojo', value: 3, color: SENTIMENT_COLORS.disgust }
  ];

  const mockPlatformSentiment = [
    { platform: 'Instagram', positive: 78, neutral: 15, negative: 7 },
    { platform: 'TikTok', positive: 82, neutral: 12, negative: 6 },
    { platform: 'YouTube', positive: 71, neutral: 20, negative: 9 },
    { platform: 'LinkedIn', positive: 85, neutral: 12, negative: 3 }
  ];

  const mockTopKeywords = [
    { word: 'incrível', sentiment: 'positive', count: 1250, trend: 'up' },
    { word: 'adorei', sentiment: 'positive', count: 980, trend: 'up' },
    { word: 'perfeito', sentiment: 'positive', count: 875, trend: 'stable' },
    { word: 'problema', sentiment: 'negative', count: 320, trend: 'down' },
    { word: 'ruim', sentiment: 'negative', count: 280, trend: 'down' },
    { word: 'normal', sentiment: 'neutral', count: 450, trend: 'stable' }
  ];

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-5 h-5 text-green-600" />;
      case 'negative': return <Frown className="w-5 h-5 text-red-600" />;
      default: return <Meh className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const renderAnalysisResults = () => {
    if (!analysisResults?.data) return null;

    const data = analysisResults.data;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          Resultado da Análise
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentimento Geral */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Sentimento Geral</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Smile className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.sentiment?.positive || 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Positivo</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Meh className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {data.sentiment?.neutral || 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Neutro</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Frown className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {data.sentiment?.negative || 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Negativo</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Confiança</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {data.confidence || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${data.confidence || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Emoções Detectadas */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Emoções Detectadas</h4>
            
            <div className="space-y-3">
              {data.emotions?.map((emotion, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[emotion.name.toLowerCase()] || '#6B7280' }}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {emotion.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${emotion.intensity}%`,
                          backgroundColor: SENTIMENT_COLORS[emotion.name.toLowerCase()] || '#6B7280'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-10">
                      {emotion.intensity}%
                    </span>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        </div>

        {/* Insights */}
        {data.insights && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              Insights da Análise
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {data.insights}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Análise de Sentimento
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise avançada de sentimentos e emoções em conteúdo
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Formulário de Análise */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Analisar Texto
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Texto para Análise
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Cole aqui o texto que deseja analisar (comentários, captions, reviews, etc.)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {inputText.length}/5000 caracteres
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={analyzeSentimentMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {analyzeSentimentMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {analyzeSentimentMutation.isPending ? 'Analisando...' : 'Analisar Sentimento'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados da Análise */}
      {renderAnalysisResults()}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sentimento Médio
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                78%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Smile className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+5.2%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Textos Analisados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                12.4K
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+12.8%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Emoção Dominante
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                Alegria
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Heart className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">35%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">dos textos analisados</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Confiança Média
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                92%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">+2.1%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Sentimentos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Tendência de Sentimentos
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockSentimentTrends}>
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
                dataKey="positive"
                stackId="1"
                stroke={SENTIMENT_COLORS.positive}
                fill={SENTIMENT_COLORS.positive}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke={SENTIMENT_COLORS.neutral}
                fill={SENTIMENT_COLORS.neutral}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke={SENTIMENT_COLORS.negative}
                fill={SENTIMENT_COLORS.negative}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de Emoções */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Distribuição de Emoções
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={mockEmotionDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockEmotionDistribution.map((entry, index) => (
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

      {/* Sentimento por Plataforma e Palavras-chave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentimento por Plataforma */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Sentimento por Plataforma
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockPlatformSentiment}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="platform" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} />
              <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
              <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Palavras-chave */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Palavras-chave Mais Mencionadas
          </h3>
          
          <div className="space-y-4">
            {mockTopKeywords.map((keyword, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(keyword.sentiment)}
                    <span className="font-medium text-gray-900 dark:text-white">
                      #{keyword.word}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getSentimentColor(keyword.sentiment)}`}>
                    {keyword.sentiment === 'positive' ? 'Positivo' : 
                     keyword.sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {keyword.count.toLocaleString()}
                  </span>
                  {keyword.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : keyword.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;

