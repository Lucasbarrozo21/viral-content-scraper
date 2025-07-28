import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Webhook, 
  Plus, 
  Settings, 
  Trash2, 
  Edit3, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const Webhooks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.webhooks.list(),
    refetchInterval: 30000
  });

  const { data: statsData } = useQuery({
    queryKey: ['webhooks', 'stats'],
    queryFn: () => api.webhooks.stats(),
    refetchInterval: 60000
  });

  const { data: eventsData } = useQuery({
    queryKey: ['webhooks', 'events'],
    queryFn: () => api.webhooks.events(),
    refetchInterval: 10000
  });

  // Mutations
  const createWebhookMutation = useMutation({
    mutationFn: api.webhooks.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
      toast.success('Webhook criado com sucesso!');
      setShowCreateModal(false);
    },
    onError: () => {
      toast.error('Erro ao criar webhook');
    }
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: ({ id, action }) => api.webhooks.toggle(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
      toast.success('Status do webhook atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar webhook');
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: api.webhooks.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
      toast.success('Webhook removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover webhook');
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: api.webhooks.test,
    onSuccess: () => {
      toast.success('Webhook testado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao testar webhook');
    }
  });

  // Mock data
  const webhooks = webhooksData?.webhooks || [
    {
      id: 1,
      name: 'Conteúdo Viral Detectado',
      url: 'https://api.exemplo.com/webhooks/viral-content',
      events: ['content.viral_detected', 'content.trending'],
      status: 'active',
      last_triggered: '2025-01-27T20:30:00Z',
      success_rate: 98.5,
      total_calls: 1247,
      failed_calls: 18,
      created_at: '2025-01-20T10:00:00Z'
    },
    {
      id: 2,
      name: 'Novos Templates Extraídos',
      url: 'https://webhook.site/unique-url-123',
      events: ['template.extracted', 'template.viral_score_high'],
      status: 'active',
      last_triggered: '2025-01-27T19:45:00Z',
      success_rate: 95.2,
      total_calls: 892,
      failed_calls: 43,
      created_at: '2025-01-18T14:30:00Z'
    },
    {
      id: 3,
      name: 'Análise de Perfil Concluída',
      url: 'https://api.cliente.com/notifications',
      events: ['profile.analyzed', 'profile.viral_content_found'],
      status: 'paused',
      last_triggered: '2025-01-27T18:20:00Z',
      success_rate: 89.7,
      total_calls: 456,
      failed_calls: 47,
      created_at: '2025-01-15T09:15:00Z'
    },
    {
      id: 4,
      name: 'Scraping Completado',
      url: 'https://discord.com/api/webhooks/123456789',
      events: ['scraping.completed', 'scraping.error'],
      status: 'error',
      last_triggered: '2025-01-27T17:10:00Z',
      success_rate: 76.3,
      total_calls: 234,
      failed_calls: 55,
      created_at: '2025-01-12T16:45:00Z'
    }
  ];

  const stats = statsData || {
    total_webhooks: 4,
    active_webhooks: 2,
    total_calls_today: 156,
    success_rate: 94.2,
    failed_calls_today: 9,
    avg_response_time: 245
  };

  const recentEvents = eventsData?.events || [
    {
      id: 1,
      webhook_name: 'Conteúdo Viral Detectado',
      event_type: 'content.viral_detected',
      status: 'success',
      response_time: 234,
      timestamp: '2025-01-27T20:30:15Z',
      payload_size: '2.1KB'
    },
    {
      id: 2,
      webhook_name: 'Novos Templates Extraídos',
      event_type: 'template.extracted',
      status: 'success',
      response_time: 189,
      timestamp: '2025-01-27T20:28:42Z',
      payload_size: '1.8KB'
    },
    {
      id: 3,
      webhook_name: 'Scraping Completado',
      event_type: 'scraping.error',
      status: 'failed',
      response_time: 5000,
      timestamp: '2025-01-27T20:25:33Z',
      payload_size: '0.9KB'
    },
    {
      id: 4,
      webhook_name: 'Conteúdo Viral Detectado',
      event_type: 'content.trending',
      status: 'success',
      response_time: 312,
      timestamp: '2025-01-27T20:22:18Z',
      payload_size: '3.2KB'
    }
  ];

  // Filter webhooks
  const filteredWebhooks = webhooks.filter(webhook => {
    const matchesSearch = webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webhook.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || webhook.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || webhook.events.some(event => 
      event.toLowerCase().includes(eventFilter.toLowerCase())
    );
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada para a área de transferência!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Webhook className="w-7 h-7 text-blue-600" />
            Webhooks
          </h1>
          <p className="text-muted-foreground">
            Configure notificações em tempo real para eventos do sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Webhook
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Webhooks</p>
              <p className="text-2xl font-bold">{stats.total_webhooks}</p>
            </div>
            <Webhook className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Webhooks Ativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active_webhooks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chamadas Hoje</p>
              <p className="text-2xl font-bold">{stats.total_calls_today}</p>
            </div>
            <ExternalLink className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-green-600">{stats.success_rate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Falhas Hoje</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed_calls_today}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
              <p className="text-2xl font-bold">{stats.avg_response_time}ms</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar webhooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="error">Erro</option>
          </select>

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Eventos</option>
            <option value="content">Conteúdo</option>
            <option value="template">Template</option>
            <option value="profile">Perfil</option>
            <option value="scraping">Scraping</option>
          </select>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Webhooks Configurados</h2>
        </div>
        
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando webhooks...
            </div>
          ) : filteredWebhooks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum webhook encontrado
            </div>
          ) : (
            filteredWebhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(webhook.status)}`}>
                        {getStatusIcon(webhook.status)}
                        {webhook.status === 'active' ? 'Ativo' : 
                         webhook.status === 'paused' ? 'Pausado' : 'Erro'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <span className="font-mono">{webhook.url}</span>
                        <button
                          onClick={() => copyToClipboard(webhook.url)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Eventos: {webhook.events.join(', ')}</span>
                      <span>•</span>
                      <span>Último disparo: {formatTimestamp(webhook.last_triggered)}</span>
                      <span>•</span>
                      <span>Taxa de sucesso: {webhook.success_rate}%</span>
                      <span>•</span>
                      <span>{webhook.total_calls} chamadas ({webhook.failed_calls} falhas)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testWebhookMutation.mutate(webhook.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Testar webhook"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedWebhook(webhook);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleWebhookMutation.mutate({
                        id: webhook.id,
                        action: webhook.status === 'active' ? 'pause' : 'activate'
                      })}
                      className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                      title={webhook.status === 'active' ? 'Pausar' : 'Ativar'}
                    >
                      {webhook.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remover webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Eventos Recentes</h2>
        </div>
        
        <div className="divide-y divide-border">
          {recentEvents.map((event) => (
            <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{event.webhook_name}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm font-mono text-muted-foreground">{event.event_type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'success' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {event.status === 'success' ? 'Sucesso' : 'Falha'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatTimestamp(event.timestamp)}</span>
                    <span>•</span>
                    <span>{event.response_time}ms</span>
                    <span>•</span>
                    <span>{event.payload_size}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Webhooks;

