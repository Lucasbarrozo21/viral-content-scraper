import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  TrendingUp,
  TrendingDown,
  Users,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Plus,
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
  BarChart3,
  Star,
  Clock,
  Target,
  Zap,
  Award,
  User,
  Calendar,
  Hash,
  Video,
  Image,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Profiles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('viral_score');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const queryClient = useQueryClient();

  // Fetch profiles
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles', { search: searchTerm, platform: selectedPlatform, category: selectedCategory, sort: sortBy }],
    queryFn: () => api.profiles.getAll({
      search: searchTerm,
      platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      sort_by: sortBy,
      limit: 50
    }),
    refetchInterval: 60000
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['profiles-stats'],
    queryFn: () => api.profiles.getStats(),
    refetchInterval: 60000
  });

  // Analyze profile mutation
  const analyzeProfileMutation = useMutation({
    mutationFn: (profileUrl) => api.profiles.analyze({ url: profileUrl, analysis_type: 'standard' }),
    onSuccess: () => {
      toast.success('Perfil analisado com sucesso!');
      queryClient.invalidateQueries(['profiles']);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error('Erro ao analisar perfil: ' + error.message);
      setIsAnalyzing(false);
    }
  });

  const profiles = profilesData?.profiles || [];
  const stats = statsData || {
    total_profiles: 0,
    analyzed_today: 0,
    avg_viral_score: 0,
    top_platform: 'N/A'
  };

  const platforms = [
    { value: 'all', label: 'Todas as Plataformas' },
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
    { value: 'tiktok', label: 'TikTok', icon: Video, color: '#000000' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0077B5' },
    { value: 'twitter', label: 'Twitter', icon: Twitter, color: '#1DA1F2' }
  ];

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'mega', label: 'Mega Influencer (1M+)' },
    { value: 'macro', label: 'Macro Influencer (100K-1M)' },
    { value: 'micro', label: 'Micro Influencer (10K-100K)' },
    { value: 'nano', label: 'Nano Influencer (<10K)' },
    { value: 'rising', label: 'Em Ascensão' },
    { value: 'viral', label: 'Viral Recente' }
  ];

  const sortOptions = [
    { value: 'viral_score', label: 'Score Viral' },
    { value: 'followers', label: 'Seguidores' },
    { value: 'engagement_rate', label: 'Taxa de Engajamento' },
    { value: 'growth_rate', label: 'Taxa de Crescimento' },
    { value: 'analyzed_at', label: 'Analisado Recentemente' }
  ];

  const handleAnalyzeProfile = () => {
    const url = prompt('Digite a URL do perfil para analisar:');
    if (url) {
      setIsAnalyzing(true);
      analyzeProfileMutation.mutate(url);
    }
  };

  const getPlatformIcon = (platform) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData?.icon || User;
  };

  const getPlatformColor = (platform) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData?.color || '#6B7280';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryBadge = (category) => {
    const colors = {
      mega: 'bg-purple-100 text-purple-800',
      macro: 'bg-blue-100 text-blue-800',
      micro: 'bg-green-100 text-green-800',
      nano: 'bg-gray-100 text-gray-800',
      rising: 'bg-orange-100 text-orange-800',
      viral: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  // Mock data for charts
  const growthData = [
    { month: 'Jan', followers: 45000, engagement: 3200 },
    { month: 'Fev', followers: 52000, engagement: 3800 },
    { month: 'Mar', followers: 48000, engagement: 3500 },
    { month: 'Abr', followers: 61000, engagement: 4200 },
    { month: 'Mai', followers: 67000, engagement: 4800 },
    { month: 'Jun', followers: 73000, engagement: 5200 }
  ];

  const platformDistribution = [
    { name: 'Instagram', value: 45, color: '#E4405F' },
    { name: 'TikTok', value: 28, color: '#000000' },
    { name: 'YouTube', value: 18, color: '#FF0000' },
    { name: 'LinkedIn', value: 9, color: '#0077B5' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Perfis Analisados</h1>
          <p className="text-muted-foreground">
            Análise completa de influenciadores e criadores de conteúdo
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAnalyzeProfile}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isAnalyzing ? 'Analisando...' : 'Analisar Perfil'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Perfis</p>
              <p className="text-2xl font-bold">{stats.total_profiles.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Analisados Hoje</p>
              <p className="text-2xl font-bold text-green-600">{stats.analyzed_today}</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
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
              <p className="text-sm text-muted-foreground">Plataforma Top</p>
              <p className="text-2xl font-bold">{stats.top_platform}</p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Crescimento de Seguidores</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Seguidores"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Plataforma</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar perfis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

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

      {/* Profiles Grid */}
      <div className="space-y-4">
        {profilesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
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
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum perfil encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou analisar novos perfis de influenciadores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const PlatformIcon = getPlatformIcon(profile.platform);
              const platformColor = getPlatformColor(profile.platform);
              
              return (
                <div key={profile.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div 
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: platformColor }}
                        >
                          <PlatformIcon className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {profile.username || '@usuario'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.display_name || 'Nome do Usuário'}
                        </p>
                      </div>
                      <div className={`text-sm font-bold ${getScoreColor(profile.viral_score || 0)}`}>
                        {profile.viral_score || 0}
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadge(profile.category || 'nano')}`}>
                        {profile.category || 'Nano'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profile.analyzed_at || 'Hoje'}
                      </span>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                        <p className="font-semibold">{formatNumber(profile.followers || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                        <p className="font-semibold">{profile.engagement_rate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Posts</p>
                        <p className="font-semibold">{profile.posts_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Crescimento</p>
                        <div className="flex items-center gap-1">
                          {(profile.growth_rate || 0) >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={`text-sm font-semibold ${
                            (profile.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(profile.growth_rate || 0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Performance */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Performance Recente</p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{formatNumber(profile.avg_likes || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{formatNumber(profile.avg_comments || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Share className="w-3 h-3" />
                            <span>{formatNumber(profile.avg_shares || 0)}</span>
                          </div>
                        </div>
                        <span className="text-muted-foreground">
                          {profile.viral_posts || 0} virais
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedProfile(profile)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Ver Detalhes
                      </button>
                      <button className="flex items-center justify-center gap-1 px-3 py-2 border border-border text-xs rounded hover:bg-muted transition-colors">
                        <ExternalLink className="w-3 h-3" />
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

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Detalhes do Perfil</h2>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProfile.username}</h3>
                      <p className="text-muted-foreground">{selectedProfile.display_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadge(selectedProfile.category)}`}>
                          {selectedProfile.category}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(selectedProfile.viral_score)}`}>
                          Score: {selectedProfile.viral_score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedProfile.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">Bio</h4>
                      <p className="text-sm text-muted-foreground">{selectedProfile.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-semibold">Seguidores</p>
                      <p className="text-lg">{formatNumber(selectedProfile.followers)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-semibold">Engajamento</p>
                      <p className="text-lg">{selectedProfile.engagement_rate}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-semibold">Posts</p>
                      <p className="text-lg">{selectedProfile.posts_count}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-semibold">Crescimento</p>
                      <p className="text-lg">{selectedProfile.growth_rate}%</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Análise de Conteúdo</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Qualidade Visual</span>
                        <span>85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Consistência</span>
                        <span>92%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Potencial Viral</span>
                        <span>78%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Hashtags Mais Usadas</h5>
                    <div className="flex flex-wrap gap-2">
                      {['#lifestyle', '#viral', '#trending', '#fyp', '#content'].map((tag) => (
                        <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Tipos de Conteúdo</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Reels/Vídeos:</span>
                        <span>65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Posts/Imagens:</span>
                        <span>25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Carrosséis:</span>
                        <span>10%</span>
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

export default Profiles;

