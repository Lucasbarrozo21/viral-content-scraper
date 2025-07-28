import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Hash,
  MapPin,
  User,
  Video,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import { api } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const TikTokScraping = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [newTarget, setNewTarget] = useState({ type: 'hashtag', value: '', enabled: true });
  const [isAddingTarget, setIsAddingTarget] = useState(false);

  const queryClient = useQueryClient();

  // Fetch scraping status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['tiktok-scraping-status'],
    queryFn: () => api.scraping.getStatus('tiktok'),
    refetchInterval: 5000
  });

  // Fetch scraping targets
  const { data: targetsData, isLoading: targetsLoading } = useQuery({
    queryKey: ['tiktok-scraping-targets'],
    queryFn: () => api.scraping.getTargets('tiktok'),
    refetchInterval: 30000
  });

  // Fetch recent content
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['tiktok-recent-content'],
    queryFn: () => api.scraping.getRecentContent('tiktok'),
    refetchInterval: 30000
  });

  // Fetch scraping stats
  const { data: statsData } = useQuery({
    queryKey: ['tiktok-scraping-stats'],
    queryFn: () => api.scraping.getStats('tiktok'),
    refetchInterval: 60000
  });

  // Control mutations
  const startScrapingMutation = useMutation({
    mutationFn: () => api.scraping.start('tiktok'),
    onSuccess: () => {
      toast.success('Scraping TikTok iniciado!');
      queryClient.invalidateQueries(['tiktok-scraping-status']);
    },
    onError: (error) => {
      toast.error('Erro ao iniciar scraping: ' + error.message);
    }
  });

  const pauseScrapingMutation = useMutation({
    mutationFn: () => api.scraping.pause('tiktok'),
    onSuccess: () => {
      toast.success('Scraping TikTok pausado!');
      queryClient.invalidateQueries(['tiktok-scraping-status']);
    },
    onError: (error) => {
      toast.error('Erro ao pausar scraping: ' + error.message);
    }
  });

  const stopScrapingMutation = useMutation({
    mutationFn: () => api.scraping.stop('tiktok'),
    onSuccess: () => {
      toast.success('Scraping TikTok parado!');
      queryClient.invalidateQueries(['tiktok-scraping-status']);
    },
    onError: (error) => {
      toast.error('Erro ao parar scraping: ' + error.message);
    }
  });

  // Target mutations
  const addTargetMutation = useMutation({
    mutationFn: (target) => api.scraping.addTarget('tiktok', target),
    onSuccess: () => {
      toast.success('Target adicionado com sucesso!');
      setNewTarget({ type: 'hashtag', value: '', enabled: true });
      setIsAddingTarget(false);
      queryClient.invalidateQueries(['tiktok-scraping-targets']);
    },
    onError: (error) => {
      toast.error('Erro ao adicionar target: ' + error.message);
    }
  });

  const removeTargetMutation = useMutation({
    mutationFn: (targetId) => api.scraping.removeTarget('tiktok', targetId),
    onSuccess: () => {
      toast.success('Target removido com sucesso!');
      queryClient.invalidateQueries(['tiktok-scraping-targets']);
    },
    onError: (error) => {
      toast.error('Erro ao remover target: ' + error.message);
    }
  });

  const status = statusData || { status: 'stopped', uptime: 0, collected_today: 0, rate_limit_status: 'ok', errors: 0 };
  const targets = targetsData?.targets || [];
  const recentContent = contentData?.content || [];
  const stats = statsData || { collected: [], analyzed: [], viral: [] };

  const handleAddTarget = () => {
    if (!newTarget.value.trim()) {
      toast.error('Digite um valor válido para o target');
      return;
    }
    addTargetMutation.mutate(newTarget);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'stopped': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 text-green-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'stopped': return <Square className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case 'hashtag': return <Hash className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Mock data for chart
  const chartData = [
    { time: '18:00', coletado: 45, analisado: 42, viral: 8 },
    { time: '19:00', coletado: 52, analisado: 48, viral: 12 },
    { time: '20:00', coletado: 38, analisado: 35, viral: 6 },
    { time: '21:00', coletado: 67, analisado: 61, viral: 15 },
    { time: '22:00', coletado: 73, analisado: 68, viral: 18 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Video className="w-6 h-6" />
            Scraping TikTok
          </h1>
          <p className="text-muted-foreground">
            Monitore e colete conteúdo viral do TikTok automaticamente
          </p>
        </div>
        
        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => queryClient.invalidateQueries(['tiktok-scraping-status'])}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          {status.status === 'running' ? (
            <button
              onClick={() => pauseScrapingMutation.mutate()}
              disabled={pauseScrapingMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
          ) : (
            <button
              onClick={() => startScrapingMutation.mutate()}
              disabled={startScrapingMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Iniciar
            </button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(status.status)}
                <span className={`font-semibold capitalize ${getStatusColor(status.status)}`}>
                  {status.status === 'running' ? 'Ativo' : status.status === 'paused' ? 'Pausado' : 'Parado'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Uptime: {formatUptime(status.uptime)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conteúdo Coletado</p>
              <p className="text-2xl font-bold">{status.collected_today.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Última coleta: 2min atrás</p>
            </div>
            <Download className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Targets Ativos</p>
              <p className="text-2xl font-bold">{targets.filter(t => t.enabled).length}</p>
              <p className="text-xs text-muted-foreground">Taxa de sucesso: 96.2%</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rate Limit</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${status.rate_limit_status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-semibold ${status.rate_limit_status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                  {status.rate_limit_status === 'ok' ? 'Saudável' : 'Limitado'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Erros: {status.errors}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg border border-border">
        <div className="flex border-b border-border">
          {[
            { id: 'overview', label: 'Visão Geral', badge: '22' },
            { id: 'targets', label: 'Targets', badge: targets.length },
            { id: 'content', label: 'Conteúdo Recente', badge: '40' },
            { id: 'settings', label: 'Configurações', badge: '10' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-muted rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Estatísticas de Coleta</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="coletado"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        name="Coletado"
                      />
                      <Area
                        type="monotone"
                        dataKey="analisado"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Analisado"
                      />
                      <Area
                        type="monotone"
                        dataKey="viral"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                        name="Viral"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Performance Hoje</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Vídeos coletados:</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vídeos analisados:</span>
                      <span className="font-medium">1,189</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conteúdo viral:</span>
                      <span className="font-medium text-green-600">73</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Hashtags Trending</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      <span>#fyp</span>
                      <span className="text-green-600 text-xs">+15%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      <span>#viral</span>
                      <span className="text-green-600 text-xs">+12%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      <span>#trending</span>
                      <span className="text-green-600 text-xs">+8%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Próximas Coletas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trending:</span>
                      <span className="text-muted-foreground">5min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hashtags:</span>
                      <span className="text-muted-foreground">12min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usuários:</span>
                      <span className="text-muted-foreground">18min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Targets Tab */}
          {activeTab === 'targets' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Targets de Coleta</h3>
                <button
                  onClick={() => setIsAddingTarget(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Target
                </button>
              </div>

              {/* Add Target Form */}
              {isAddingTarget && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <h4 className="font-semibold mb-3">Novo Target</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={newTarget.type}
                      onChange={(e) => setNewTarget({ ...newTarget, type: e.target.value })}
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="hashtag">Hashtag</option>
                      <option value="user">Usuário</option>
                      <option value="location">Localização</option>
                    </select>
                    <input
                      type="text"
                      placeholder={`Digite ${newTarget.type === 'hashtag' ? 'a hashtag' : newTarget.type === 'user' ? 'o usuário' : 'a localização'}`}
                      value={newTarget.value}
                      onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })}
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTarget}
                        disabled={addTargetMutation.isPending}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {addTargetMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                      </button>
                      <button
                        onClick={() => setIsAddingTarget(false)}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Targets List */}
              <div className="space-y-2">
                {targetsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : targets.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Nenhum target configurado</h4>
                    <p className="text-muted-foreground text-sm">
                      Adicione hashtags, usuários ou localizações para começar a coletar conteúdo.
                    </p>
                  </div>
                ) : (
                  targets.map((target) => (
                    <div key={target.id} className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTargetIcon(target.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{target.value}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                              {target.type}
                            </span>
                            {target.enabled && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Ativo
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Última coleta: {target.last_collected || 'Nunca'} • 
                            Coletados: {target.collected_count || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeTargetMutation.mutate(target.id)}
                          disabled={removeTargetMutation.isPending}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conteúdo Recente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentLoading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse">
                      <div className="h-32 bg-muted rounded-lg mb-3"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  ))
                ) : recentContent.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Nenhum conteúdo coletado</h4>
                    <p className="text-muted-foreground text-sm">
                      Inicie o scraping para começar a coletar conteúdo viral do TikTok.
                    </p>
                  </div>
                ) : (
                  recentContent.map((content) => (
                    <div key={content.id} className="bg-muted/50 rounded-lg overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {content.description || 'Vídeo TikTok'}
                          </h4>
                          <div className={`text-xs font-bold px-2 py-1 rounded ${
                            content.viral_score >= 80 ? 'bg-green-100 text-green-800' :
                            content.viral_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {content.viral_score || 0}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>@{content.author || 'usuario'}</span>
                          <span>{content.created_at || 'Agora'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{content.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{content.comments || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share className="w-3 h-3" />
                              <span>{content.shares || 0}</span>
                            </div>
                          </div>
                          <button className="text-primary hover:text-primary/80">
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configurações de Scraping</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Intervalos de Coleta</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Trending (minutos)</label>
                      <input
                        type="number"
                        defaultValue="15"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hashtags (minutos)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Usuários (minutos)</label>
                      <input
                        type="number"
                        defaultValue="60"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Limites e Filtros</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Vídeos por coleta</label>
                      <input
                        type="number"
                        defaultValue="100"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Score viral mínimo</label>
                      <input
                        type="number"
                        defaultValue="70"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="download-videos" defaultChecked />
                      <label htmlFor="download-videos" className="text-sm">
                        Baixar vídeos automaticamente
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notificações</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="notify-viral" defaultChecked />
                    <label htmlFor="notify-viral" className="text-sm">
                        Notificar quando encontrar conteúdo viral (score &gt; 80)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="notify-errors" defaultChecked />
                    <label htmlFor="notify-errors" className="text-sm">
                      Notificar sobre erros de scraping
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="notify-limits" defaultChecked />
                    <label htmlFor="notify-limits" className="text-sm">
                      Notificar sobre rate limiting
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
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

export default TikTokScraping;

