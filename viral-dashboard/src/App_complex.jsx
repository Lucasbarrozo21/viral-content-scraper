/**
 * APP COMPONENT
 * Componente principal da aplicação
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ContentAnalysis from './pages/ContentAnalysis';
import SentimentAnalysis from './pages/SentimentAnalysis';
import Trends from './pages/Trends';
import InstagramScraping from './pages/InstagramScraping';
import Templates from './pages/Templates';
import TikTokScraping from './pages/TikTokScraping';
import Profiles from './pages/Profiles';
import AIAgents from './pages/AIAgents';
import Webhooks from './pages/Webhooks';
import './App.css';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente de rota protegida (placeholder)
const ProtectedRoute = ({ children }) => {
  // TODO: Implementar verificação de autenticação
  const isAuthenticated = true; // Placeholder
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componentes placeholder para páginas não implementadas

const ScrapingSessions = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Sessões de Scraping</h1>
    <div className="bg-card rounded-lg border border-border p-6">
      <p className="text-muted-foreground">
        Página de sessões de scraping em desenvolvimento...
      </p>
    </div>
  </div>
);

const ScheduledJobs = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Jobs Agendados</h1>
    <div className="bg-card rounded-lg border border-border p-6">
      <p className="text-muted-foreground">
        Página de jobs agendados em desenvolvimento...
      </p>
    </div>
  </div>
);

const ViralContent = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Conteúdo Viral</h1>
    <div className="bg-card rounded-lg border border-border p-6">
      <p className="text-muted-foreground">
        Página de conteúdo viral em desenvolvimento...
      </p>
    </div>
  </div>
);

const Admin = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Administração</h1>
    <div className="bg-card rounded-lg border border-border p-6">
      <p className="text-muted-foreground">
        Página de administração em desenvolvimento...
      </p>
    </div>
  </div>
);

const Settings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Configurações</h1>
    <div className="bg-card rounded-lg border border-border p-6">
      <p className="text-muted-foreground">
        Página de configurações em desenvolvimento...
      </p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="p-6">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-4">Página não encontrada</p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Voltar
      </button>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />
              
              {/* Análise */}
              <Route path="analysis/content" element={<ContentAnalysis />} />
              <Route path="analysis/sentiment" element={<SentimentAnalysis />} />
              <Route path="analysis/trends" element={<Trends />} />
              
              {/* Scraping */}
              <Route path="scraping/instagram" element={<InstagramScraping />} />
              <Route path="scraping/tiktok" element={<TikTokScraping />} />
              <Route path="scraping/sessions" element={<ScrapingSessions />} />
              <Route path="scraping/jobs" element={<ScheduledJobs />} />
              
              {/* Conteúdo */}
              <Route path="content/templates" element={<Templates />} />
              <Route path="content/profiles" element={<Profiles />} />
              <Route path="content/viral" element={<ViralContent />} />
              
              {/* Outras páginas */}
              <Route path="agents" element={<AIAgents />} />
              <Route path="webhooks" element={<Webhooks />} />
              <Route path="admin" element={<Admin />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgb(31 41 55)',
            color: 'white',
            border: '1px solid rgb(75 85 99)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      
      {/* React Query DevTools (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

export default App;

