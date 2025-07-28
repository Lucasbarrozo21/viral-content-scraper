/**
 * CONTENT ANALYSIS PAGE
 * Página para análise detalhada de conteúdo
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Upload, 
  Link, 
  Search, 
  Eye, 
  Brain, 
  BarChart3,
  Download,
  RefreshCw,
  Zap,
  Image,
  Video,
  FileText,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Star
} from 'lucide-react';
import { analysis } from '../lib/api';
import toast from 'react-hot-toast';

const ContentAnalysis = () => {
  const [analysisType, setAnalysisType] = useState('single');
  const [contentUrl, setContentUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Mutation para análise de conteúdo
  const analyzeContentMutation = useMutation({
    mutationFn: async (data) => {
      if (analysisType === 'single') {
        return await analysis.analyzeContent(data.contentId, data.options);
      } else {
        const urls = batchUrls.split('\n').filter(url => url.trim());
        return await analysis.batchAnalyze(urls, data.options);
      }
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast.success('Análise concluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro na análise: ' + error.message);
    }
  });

  // Query para análises recentes
  const { data: recentAnalyses, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-analyses'],
    queryFn: () => analysis.getAnalysisTrends({ limit: 10 }),
    refetchInterval: 60000
  });

  const handleAnalyze = () => {
    if (analysisType === 'single' && !contentUrl.trim()) {
      toast.error('Por favor, insira uma URL válida');
      return;
    }
    
    if (analysisType === 'batch' && !batchUrls.trim()) {
      toast.error('Por favor, insira pelo menos uma URL');
      return;
    }

    const options = {
      include_visual: true,
      include_sentiment: true,
      include_metrics: true,
      include_predictions: true
    };

    analyzeContentMutation.mutate({
      contentId: contentUrl,
      options
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      toast.success('Arquivo selecionado: ' + file.name);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const renderAnalysisResults = () => {
    if (!analysisResults?.data) return null;

    const data = analysisResults.data;

    return (
      <div className="space-y-6">
        {/* Resumo da Análise */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumo da Análise
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(data.overall_score || 0)}`}>
                Score Geral: {data.overall_score || 0}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.visual_score || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visual</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Brain className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.sentiment_score || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sentimento</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.engagement_score || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Engajamento</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.viral_potential || 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Potencial Viral</p>
            </div>
          </div>
        </div>

        {/* Análise Detalhada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Análise Visual */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Análise Visual
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Composição</span>
                  <span className="text-sm font-medium">{data.visual_analysis?.composition || 0}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${data.visual_analysis?.composition || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cores</span>
                  <span className="text-sm font-medium">{data.visual_analysis?.colors || 0}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${data.visual_analysis?.colors || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Qualidade</span>
                  <span className="text-sm font-medium">{data.visual_analysis?.quality || 0}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${data.visual_analysis?.quality || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {data.visual_analysis?.insights && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Insights:</strong> {data.visual_analysis.insights}
                </p>
              </div>
            )}
          </div>

          {/* Análise de Sentimento */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              Análise de Sentimento
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.sentiment_analysis?.positive || 0}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Positivo</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {data.sentiment_analysis?.neutral || 0}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Neutro</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {data.sentiment_analysis?.negative || 0}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Negativo</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Emoções Detectadas:</p>
                <div className="flex flex-wrap gap-2">
                  {data.sentiment_analysis?.emotions?.map((emotion, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                    >
                      {emotion.name}: {emotion.intensity}%
                    </span>
                  )) || []}
                </div>
              </div>
            </div>

            {data.sentiment_analysis?.summary && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Resumo:</strong> {data.sentiment_analysis.summary}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Métricas e Predições */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métricas de Engajamento */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Métricas de Engajamento
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.metrics?.likes?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Likes</p>
              </div>
              
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.metrics?.comments?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Comentários</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Share2 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.metrics?.shares?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Compartilhamentos</p>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.metrics?.views?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Visualizações</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Engajamento</span>
                <span className="text-sm font-medium">{data.metrics?.engagement_rate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${data.metrics?.engagement_rate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Predições */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Predições
            </h4>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Potencial Viral</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {data.predictions?.viral_potential || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Probabilidade de se tornar viral nas próximas 24h
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Crescimento Esperado</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    +{data.predictions?.growth_prediction || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Crescimento de engajamento nos próximos 7 dias
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Melhor Horário</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {data.predictions?.best_time || '18:00'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Horário ideal para máximo engajamento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {data.recommendations && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Recomendações para Melhoria
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      rec.priority === 'high' ? 'bg-red-500' :
                      rec.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                        {rec.title}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Impacto: +{rec.impact}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            Análise de Conteúdo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise avançada de conteúdo com IA para insights profundos
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Formulário de Análise */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Nova Análise
        </h3>

        {/* Tipo de Análise */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tipo de Análise
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setAnalysisType('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                analysisType === 'single'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50'
              }`}
            >
              <Link className="w-4 h-4" />
              Análise Individual
            </button>
            <button
              onClick={() => setAnalysisType('batch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                analysisType === 'batch'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Análise em Lote
            </button>
            <button
              onClick={() => setAnalysisType('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                analysisType === 'upload'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload de Arquivo
            </button>
          </div>
        </div>

        {/* Campos de Input */}
        <div className="space-y-4">
          {analysisType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL do Conteúdo
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          )}

          {analysisType === 'batch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URLs do Conteúdo (uma por linha)
              </label>
              <textarea
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                placeholder="https://instagram.com/p/...&#10;https://tiktok.com/@user/video/...&#10;https://youtube.com/watch?v=..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Máximo de 50 URLs por análise
              </p>
            </div>
          )}

          {analysisType === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload de Arquivo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.txt,.csv"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Clique para fazer upload ou arraste o arquivo aqui
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Suporta imagens, vídeos, TXT e CSV (máx. 10MB)
                  </p>
                </label>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão de Análise */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleAnalyze}
            disabled={analyzeContentMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {analyzeContentMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {analyzeContentMutation.isPending ? 'Analisando...' : 'Iniciar Análise'}
          </button>
        </div>
      </div>

      {/* Resultados da Análise */}
      {renderAnalysisResults()}

      {/* Análises Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análises Recentes
          </h3>
          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            Ver todas
          </button>
        </div>

        {recentLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnalyses?.data?.analyses?.slice(0, 5).map((analysis, index) => (
              <div key={analysis.id || index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {analysis.type === 'image' ? (
                    <Image className="w-8 h-8 text-white" />
                  ) : analysis.type === 'video' ? (
                    <Video className="w-8 h-8 text-white" />
                  ) : (
                    <FileText className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {analysis.title || `Análise ${analysis.type || 'Conteúdo'}`}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Score: {analysis.score || 0}/100 • {analysis.platform || 'Instagram'} • {new Date(analysis.created_at || Date.now()).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getScoreColor(analysis.score || 0)}`}>
                    {analysis.score || 0}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) || []}

            {(!recentAnalyses?.data?.analyses || recentAnalyses.data.analyses.length === 0) && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhuma análise recente encontrada
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Faça sua primeira análise usando o formulário acima
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentAnalysis;

