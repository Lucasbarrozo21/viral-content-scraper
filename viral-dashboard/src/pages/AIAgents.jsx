import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, 
  Activity, 
  Eye, 
  Settings, 
  Play, 
  Pause, 
  Square,
  RefreshCw,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Cpu,
  Database,
  Network,
  Lightbulb,
  BookOpen,
  Award,
  Users,
  MessageSquare,
  Image,
  Video,
  FileText,
  Hash,
  Star
} from 'lucide-react';
import { api } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const AIAgents = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const queryClient = useQueryClient();

  // Fetch agents status
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['ai-agents-status'],
    queryFn: () => api.aiAgents.getStatus(),
    refetchInterval: 5000
  });

  // Fetch agents performance
  const { data: performanceData } = useQuery({
    queryKey: ['ai-agents-performance'],
    queryFn: () => api.aiAgents.getPerformance(),
    refetchInterval: 30000
  });

  // Fetch memory stats
  const { data: memoryData } = useQuery({
    queryKey: ['ai-agents-memory'],
    queryFn: () => api.aiAgents.getMemoryStats(),
    refetchInterval: 60000
  });

  // Control mutations
  const controlAgentMutation = useMutation({
    mutationFn: ({ agentId, action }) => api.aiAgents.control(agentId, action),
    onSuccess: (data, variables) => {
      toast.success(`Agente ${variables.action === 'start' ? 'iniciado' : variables.action === 'pause' ? 'pausado' : 'parado'} com sucesso!`);
      queryClient.invalidateQueries(['ai-agents-status']);
    },
    onError: (error) => {
      toast.error('Erro ao controlar agente: ' + error.message);
    }
  });

  const agents = agentsData?.agents || [];
  const performance = performanceData || {};
  const memory = memoryData || {};

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 text-green-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'stopped': return <Square className="w-4 h-4 text-red-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'stopped': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAgentIcon = (type) => {
    switch (type) {
      case 'visual_analyzer': return <Eye className="w-5 h-5" />;
      case 'content_analyzer': return <FileText className="w-5 h-5" />;
      case 'engagement_analyzer': return <BarChart3 className="w-5 h-5" />;
      case 'template_generator': return <Lightbulb className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Mock data for charts
  const performanceChartData = [
    { time: '18:00', visual: 45, content: 38, engagement: 52, template: 23 },
    { time: '19:00', visual: 52, content: 42, engagement: 48, template: 28 },
    { time: '20:00', visual: 38, content: 35, engagement: 41, template: 19 },
    { time: '21:00', visual: 67, content: 58, engagement: 62, template: 34 },
    { time: '22:00', visual: 73, content: 65, engagement: 68, template: 41 }
  ];

  const memoryEvolutionData = [
    { generation: 1, patterns: 120, accuracy: 65 },
    { generation: 2, patterns: 145, accuracy: 72 },
    { generation: 3, patterns: 168, accuracy: 78 },
    { generation: 4, patterns: 192, accuracy: 84 },
    { generation: 5, patterns: 215, accuracy: 89 }
  ];

  const agentWorkloadData = [
    { name: 'Visual Analyzer', value: 35, color: '#3b82f6' },
    { name: 'Content Analyzer', value: 28, color: '#10b981' },
    { name: 'Engagement Analyzer', value: 22, color: '#f59e0b' },
    { name: 'Template Generator', value: 15, color: '#8b5cf6' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Agentes de IA
          </h1>
          <p className="text-muted-foreground">
            Monitoramento e controle dos agentes de inteligência artificial
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => queryClient.invalidateQueries(['ai-agents-status'])}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" />
            Configurações
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Agentes Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.status === 'running').length}
              </p>
              <p className="text-xs text-muted-foreground">de {agents.length} total</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Análises/Hora</p>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-xs text-green-600">+12% vs ontem</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Precisão Média</p>
              <p className="text-2xl font-bold text-yellow-600">89.2%</p>
              <p className="text-xs text-green-600">+2.1% esta semana</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Memória Evolutiva</p>
              <p className="text-2xl font-bold text-purple-600">Gen 5</p>
              <p className="text-xs text-muted-foreground">215 padrões</p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Performance dos Agentes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="visual" stroke="#3b82f6" name="Visual" strokeWidth={2} />
                <Line type="monotone" dataKey="content" stroke="#10b981" name="Conteúdo" strokeWidth={2} />
                <Line type="monotone" dataKey="engagement" stroke="#f59e0b" name="Engajamento" strokeWidth={2} />
                <Line type="monotone" dataKey="template" stroke="#8b5cf6" name="Template" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Evolution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Evolução da Memória</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memoryEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="generation" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="patterns"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  name="Padrões"
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Precisão %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agentsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agente configurado</h3>
            <p className="text-muted-foreground">
              Configure agentes de IA para começar a análise automatizada.
            </p>
          </div>
        ) : (
          agents.map((agent) => {
            const AgentIcon = getAgentIcon(agent.type);
            
            return (
              <div key={agent.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
                {/* Agent Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                      <AgentIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {agent.name || 'Agente IA'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(agent.status)}
                        <span className={`text-xs capitalize ${getStatusColor(agent.status)}`}>
                          {agent.status === 'running' ? 'Ativo' : 
                           agent.status === 'paused' ? 'Pausado' : 
                           agent.status === 'stopped' ? 'Parado' : 'Erro'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {agent.description || 'Agente de análise de conteúdo viral'}
                  </p>
                </div>

                {/* Agent Metrics */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-semibold">{formatUptime(agent.uptime || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Análises</p>
                        <p className="font-semibold">{agent.analyses_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Precisão</p>
                        <p className="font-semibold text-green-600">{agent.accuracy || 0}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CPU</p>
                        <p className="font-semibold">{agent.cpu_usage || 0}%</p>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Carga de Trabalho</span>
                          <span>{agent.workload || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${agent.workload || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Memória</span>
                          <span>{agent.memory_usage || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${agent.memory_usage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Atividade Recente</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Análise visual concluída</span>
                          <span className="text-muted-foreground ml-auto">2min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Padrão identificado</span>
                          <span className="text-muted-foreground ml-auto">5min</span>
                        </div>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-1 pt-2">
                      {agent.status === 'running' ? (
                        <button
                          onClick={() => controlAgentMutation.mutate({ agentId: agent.id, action: 'pause' })}
                          disabled={controlAgentMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          <Pause className="w-3 h-3" />
                          Pausar
                        </button>
                      ) : (
                        <button
                          onClick={() => controlAgentMutation.mutate({ agentId: agent.id, action: 'start' })}
                          disabled={controlAgentMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3 h-3" />
                          Iniciar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAgent(agent)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 border border-border text-xs rounded hover:bg-muted transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="flex items-center justify-center gap-1 px-2 py-1.5 border border-border text-xs rounded hover:bg-muted transition-colors">
                        <Settings className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Workload Distribution */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Distribuição de Carga de Trabalho</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agentWorkloadData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {agentWorkloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Estatísticas por Agente</h4>
            {agentWorkloadData.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: agent.color }}
                  ></div>
                  <span className="font-medium">{agent.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{agent.value}%</div>
                  <div className="text-xs text-muted-foreground">carga atual</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                    {getAgentIcon(selectedAgent.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedAgent.status)}
                      <span className={`text-sm capitalize ${getStatusColor(selectedAgent.status)}`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações do Agente</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <span className="font-medium">{selectedAgent.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Versão:</span>
                        <span className="font-medium">{selectedAgent.version || 'v1.0.0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Criado em:</span>
                        <span className="font-medium">{selectedAgent.created_at || 'Hoje'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última atualização:</span>
                        <span className="font-medium">{selectedAgent.updated_at || 'Hoje'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-semibold">Análises Totais</p>
                        <p className="text-lg">{selectedAgent.analyses_count || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-semibold">Precisão</p>
                        <p className="text-lg text-green-600">{selectedAgent.accuracy || 0}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-semibold">Tempo Médio</p>
                        <p className="text-lg">{selectedAgent.avg_time || 0}ms</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-semibold">Taxa de Erro</p>
                        <p className="text-lg text-red-600">{selectedAgent.error_rate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Resources */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recursos do Sistema</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU</span>
                          <span>{selectedAgent.cpu_usage || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${selectedAgent.cpu_usage || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memória</span>
                          <span>{selectedAgent.memory_usage || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${selectedAgent.memory_usage || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Carga de Trabalho</span>
                          <span>{selectedAgent.workload || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${selectedAgent.workload || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Configurações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Intervalo de análise:</span>
                        <span>30s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Batch size:</span>
                        <span>10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeout:</span>
                        <span>60s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto retry:</span>
                        <span>Ativo</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Logs Recentes</h4>
                    <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <div className="space-y-1 text-xs font-mono">
                        <div className="text-green-600">[INFO] Análise visual concluída - Score: 85</div>
                        <div className="text-blue-600">[DEBUG] Processando batch de 10 itens</div>
                        <div className="text-green-600">[INFO] Padrão viral identificado</div>
                        <div className="text-yellow-600">[WARN] Alta carga de trabalho detectada</div>
                        <div className="text-green-600">[INFO] Memória evolutiva atualizada</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;

