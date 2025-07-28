/**
 * INSTAGRAM SCRAPING PAGE
 * Página para controle de scraping do Instagram
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  Square,
  Settings,
  User,
  Hash,
  MapPin,
  Clock,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Trash2,
  Edit,
  Filter
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
  Bar
} from 'recharts';
import { scraping } from '../lib/api';
import toast from 'react-hot-toast';

const InstagramScraping = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [newTarget, setNewTarget] = useState({ type: 'profile', value: '', enabled: true });
  const [showNewTargetForm, setShowNewTargetForm] = useState(false);

  // Query para status do scraping
  const { data: scrapingStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['instagram-scraping-status'],
    queryFn: () => scraping.getStatus('instagram'),
    refetchInterval: 5000
  });

  // Query para targets configurados
  const { data: targets, isLoading: targetsLoading, refetch: refetchTargets } = useQuery({
    queryKey: ['instagram-targets'],
    queryFn: () => scraping.getTargets('instagram'),
    refetchInterval: 30000
  });

  // Query para estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['instagram-stats'],
    queryFn: () => scraping.getStats('instagram'),
    refetchInterval: 60000
  });

  // Mutations
  const startScrapingMutation = useMutation({
    mutationFn: () => scraping.start('instagram'),
    onSuccess: () => {
      toast.success('Scraping iniciado com sucesso!');
      refetchStatus();
    },
    onError: (error) => {
      toast.error('Erro ao iniciar scraping: ' + error.message);
    }
  });

  const stopScrapingMutation = useMutation({
    mutationFn: () => scraping.stop('instagram'),
    onSuccess: () => {
      toast.success('Scraping pausado com sucesso!');
      refetchStatus();
    },
    onError: (error) => {
      toast.error('Erro ao pausar scraping: ' + error.message);
    }
  });

  const addTargetMutation = useMutation({
    mutationFn: (target) => scraping.addTarget('instagram', target),
    onSuccess: () => {
      toast.success('Target adicionado com sucesso!');
      setNewTarget({ type: 'profile', value: '', enabled: true });
      setShowNewTargetForm(false);
      refetchTargets();
    },
    onError: (error) => {
      toast.error('Erro ao adicionar target: ' + error.message);
    }
  });

  // Dados mockados para demonstração
  const mockStatus = {
    status: 'running',
    uptime: '2h 34m',
    targets_active: 8,
    content_collected: 1247,
    last_collection: '2025-01-27T21:25:00Z',
    rate_limit_status: 'healthy',
    errors_count: 2,
    success_rate: 98.4
  };

  const mockStats = [
    { time: '18:00', collected: 45, analyzed: 42, viral: 8 },
    { time: '19:00', collected: 52, analyzed: 48, viral: 12 },
    { time: '20:00', collected: 38, analyzed: 35, viral: 6 },
    { time: '21:00', collected: 61, analyzed: 58, viral: 15 }
  ];

  const mockTargets = [
    {
      id: 1,
      type: 'profile',
      value: '@produtividade_max',
      status: 'active',
      last_scraped: '2025-01-27T21:20:00Z',
      content_count: 156,
      viral_count: 23,
      enabled: true
    },
    {
      id: 2,
      type: 'hashtag',
      value: '#produtividade2025',
      status: 'active',
      last_scraped: '2025-01-27T21:18:00Z',
      content_count: 89,
      viral_count: 12,
      enabled: true
    },
    {
      id: 3,
      type: 'profile',
      value: '@lifestyle_tips',
      status: 'paused',
      last_scraped: '2025-01-27T20:45:00Z',
      content_count: 67,
      viral_count: 8,
      enabled: false
    },
    {
      id: 4,
      type: 'location',
      value: 'São Paulo, Brazil',
      status: 'active',
      last_scraped: '2025-01-27T21:15:00Z',
      content_count: 234,
      viral_count: 31,
      enabled: true
    }
  ];

  const mockRecentContent = [
    {
      id: 1,
      type: 'Reel',
      title: '5 Dicas de Produtividade',
      author: '@produtividade_max',
      viral_score: 87,
      likes: 12500,
      comments: 234,
      shares: 89,
      collected_at: '2025-01-27T21:20:00Z'
    },
    {
      id: 2,
      type: 'Carousel',
      title: 'Rotina Matinal Perfeita',
      author: '@lifestyle_tips',
      viral_score: 92,
      likes: 18900,
      comments: 456,
      shares: 167,
      collected_at: '2025-01-27T21:18:00Z'
    },
    {
      id: 3,
      type: 'Post',
      title: 'Mindset de Sucesso',
      author: '@business_mentor',
      viral_score: 78,
      likes: 8900,
      comments: 123,
      shares: 45,
      collected_at: '2025-01-27T21:15:00Z'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'stopped':
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <AlertCircle className="w-4 h-4" />;
      case 'stopped':
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case 'profile':
        return <User className="w-4 h-4" />;
      case 'hashtag':
        return <Hash className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const handleAddTarget = () => {
    if (!newTarget.value.trim()) {
      toast.error('Por favor, insira um valor válido');
      return;
    }

    addTargetMutation.mutate(newTarget);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📸 Scraping Instagram
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitore e colete conteúdo viral do Instagram automaticamente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchStatus()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          
          {mockStatus.status === 'running' ? (
            <button
              onClick={() => stopScrapingMutation.mutate()}
              disabled={stopScrapingMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
            >
              <Pause className="w-4 h-4" />
              {stopScrapingMutation.isPending ? 'Pausando...' : 'Pausar'}
            </button>
          ) : (
            <button
              onClick={() => startScrapingMutation.mutate()}
              disabled={startScrapingMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              {startScrapingMutation.isPending ? 'Iniciando...' : 'Iniciar'}
            </button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Status
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(mockStatus.status)}`}>
                  {getStatusIcon(mockStatus.status)}
                  {mockStatus.status === 'running' ? 'Ativo' : 'Pausado'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Uptime: {mockStatus.uptime}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conteúdo Coletado
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {mockStatus.content_collected.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Última coleta: {formatTimeAgo(mockStatus.last_collection)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Targets Ativos
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {mockStatus.targets_active}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Taxa de sucesso: {mockStatus.success_rate}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rate Limit
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  mockStatus.rate_limit_status === 'healthy' 
                    ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                    : 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {mockStatus.rate_limit_status === 'healthy' ? 'Saudável' : 'Limitado'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Erros: {mockStatus.errors_count}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'targets', label: 'Targets', icon: User },
              { id: 'content', label: 'Conteúdo Recente', icon: Eye },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estatísticas de Coleta
              </h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" className="text-gray-600 dark:text-gray-400" />
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
                    dataKey="collected"
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
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Targets Tab */}
          {activeTab === 'targets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Targets de Scraping
                </h3>
                <button
                  onClick={() => setShowNewTargetForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Target
                </button>
              </div>

              {/* Formulário de Novo Target */}
              {showNewTargetForm && (
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Novo Target
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo
                      </label>
                      <select
                        value={newTarget.type}
                        onChange={(e) => setNewTarget({ ...newTarget, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="profile">Perfil</option>
                        <option value="hashtag">Hashtag</option>
                        <option value="location">Localização</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor
                      </label>
                      <input
                        type="text"
                        value={newTarget.value}
                        onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })}
                        placeholder={
                          newTarget.type === 'profile' ? '@username' :
                          newTarget.type === 'hashtag' ? '#hashtag' :
                          'São Paulo, Brazil'
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleAddTarget}
                        disabled={addTargetMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {addTargetMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                      </button>
                      <button
                        onClick={() => setShowNewTargetForm(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Targets */}
              <div className="space-y-3">
                {mockTargets.map((target) => (
                  <div key={target.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        {getTargetIcon(target.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {target.value}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            {target.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(target.status)}`}>
                            {getStatusIcon(target.status)}
                            {target.status === 'active' ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {target.content_count} conteúdos • {target.viral_count} virais • 
                          Última coleta: {formatTimeAgo(target.last_scraped)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conteúdo Coletado Recentemente
              </h3>
              
              <div className="space-y-4">
                {mockRecentContent.map((content) => (
                  <div key={content.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {content.type.charAt(0)}
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
                          {content.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {content.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {content.comments.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          {content.shares.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(content.collected_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        content.viral_score >= 90 ? 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400' :
                        content.viral_score >= 80 ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400' :
                        content.viral_score >= 70 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        Score: {content.viral_score}
                      </div>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações de Scraping
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Intervalo de Coleta (minutos)
                    </label>
                    <input
                      type="number"
                      defaultValue={15}
                      min={5}
                      max={120}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo de Conteúdo por Target
                    </label>
                    <input
                      type="number"
                      defaultValue={50}
                      min={10}
                      max={200}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Score Viral Mínimo
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      defaultValue={70}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Análise Automática
                    </label>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notificações de Conteúdo Viral
                    </label>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Backup Automático
                    </label>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rate Limiting Inteligente
                    </label>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramScraping;

