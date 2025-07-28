import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Copy, 
  Star, 
  TrendingUp,
  Image,
  Video,
  FileText,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
  BarChart3
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const Templates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('viral_score');
  const [viewMode, setViewMode] = useState('grid');

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', { search: searchTerm, category: selectedCategory, platform: selectedPlatform, type: selectedType, sort: sortBy }],
    queryFn: () => api.templates.search({
      search: searchTerm,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      sort_by: sortBy,
      limit: 50
    }),
    refetchInterval: 30000
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['templates-stats'],
    queryFn: () => api.templates.getStats(),
    refetchInterval: 60000
  });

  // Extract template mutation
  const extractTemplateMutation = useMutation({
    mutationFn: (data) => api.templates.extract(data),
    onSuccess: () => {
      toast.success('Template extraído com sucesso!');
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      toast.error('Erro ao extrair template: ' + error.message);
    }
  });

  // Adapt template mutation
  const adaptTemplateMutation = useMutation({
    mutationFn: ({ templateId, adaptationData }) => api.templates.adapt(templateId, adaptationData),
    onSuccess: () => {
      toast.success('Template adaptado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adaptar template: ' + error.message);
    }
  });

  const templates = templatesData?.templates || [];
  const stats = statsData || {
    total_templates: 0,
    viral_templates: 0,
    avg_viral_score: 0,
    top_category: 'N/A'
  };

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' },
    { value: 'tech', label: 'Tech' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'education', label: 'Education' }
  ];

  const platforms = [
    { value: 'all', label: 'Todas as Plataformas' },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'tiktok', label: 'TikTok', icon: Video },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'twitter', label: 'Twitter', icon: Twitter }
  ];

  const types = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'post', label: 'Post', icon: Image },
    { value: 'story', label: 'Story', icon: FileText },
    { value: 'reel', label: 'Reel', icon: Video },
    { value: 'carousel', label: 'Carrossel', icon: Copy }
  ];

  const sortOptions = [
    { value: 'viral_score', label: 'Score Viral' },
    { value: 'created_at', label: 'Mais Recentes' },
    { value: 'usage_count', label: 'Mais Usados' },
    { value: 'success_rate', label: 'Taxa de Sucesso' }
  ];

  const handleExtractTemplate = () => {
    const url = prompt('Digite a URL do conteúdo para extrair template:');
    if (url) {
      extractTemplateMutation.mutate({ url });
    }
  };

  const handleAdaptTemplate = (template) => {
    const objective = prompt('Digite o objetivo para adaptação (ex: vendas, engajamento, awareness):');
    if (objective) {
      adaptTemplateMutation.mutate({
        templateId: template.id,
        adaptationData: { objective, niche: 'general' }
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPlatformIcon = (platform) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData?.icon || FileText;
  };

  const getTypeIcon = (type) => {
    const typeData = types.find(t => t.value === type);
    return typeData?.icon || FileText;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Templates Virais</h1>
          <p className="text-muted-foreground">
            Biblioteca de templates extraídos de conteúdo viral
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExtractTemplate}
            disabled={extractTemplateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {extractTemplateMutation.isPending ? 'Extraindo...' : 'Extrair Template'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Templates</p>
              <p className="text-2xl font-bold">{stats.total_templates.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Templates Virais</p>
              <p className="text-2xl font-bold text-green-600">{stats.viral_templates}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score Viral Médio</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.avg_viral_score}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Categoria Top</p>
              <p className="text-2xl font-bold">{stats.top_category}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {platforms.map(platform => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        {templatesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                <div className="h-32 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou extrair novos templates de conteúdo viral.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const PlatformIcon = getPlatformIcon(template.platform);
              const TypeIcon = getTypeIcon(template.type);
              
              return (
                <div key={template.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Template Preview */}
                  <div className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                    <TypeIcon className="w-12 h-12 text-muted-foreground" />
                  </div>

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                          {template.title || `Template ${template.type}`}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <PlatformIcon className="w-3 h-3" />
                          <span>{template.platform}</span>
                          <span>•</span>
                          <span>{template.category}</span>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${getScoreColor(template.viral_score)}`}>
                        {template.viral_score}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{template.metrics?.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{template.metrics?.comments || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share className="w-3 h-3" />
                          <span>{template.metrics?.shares || 0}</span>
                        </div>
                      </div>
                      <span>{template.usage_count || 0} usos</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdaptTemplate(template)}
                        disabled={adaptTemplateMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Edit className="w-3 h-3" />
                        Adaptar
                      </button>
                      <button className="flex items-center justify-center gap-1 px-3 py-2 border border-border text-xs rounded hover:bg-muted transition-colors">
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                      <button className="flex items-center justify-center gap-1 px-3 py-2 border border-border text-xs rounded hover:bg-muted transition-colors">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;

