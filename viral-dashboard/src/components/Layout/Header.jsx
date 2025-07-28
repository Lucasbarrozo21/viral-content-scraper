/**
 * HEADER COMPONENT
 * Cabeçalho do dashboard com navegação e controles
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { auth } from '../../lib/api';
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Zap
} from 'lucide-react';

const Header = ({ onThemeToggle, isDarkMode }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Simular notificações
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        title: 'Conteúdo viral encontrado',
        message: 'Novo post com 50K likes detectado',
        time: '2 min atrás',
        type: 'success',
        unread: true
      },
      {
        id: 2,
        title: 'Scraping concluído',
        message: 'Instagram #fitness - 100 posts coletados',
        time: '5 min atrás',
        type: 'info',
        unread: true
      },
      {
        id: 3,
        title: 'Template extraído',
        message: 'Novo template de carrossel salvo',
        time: '10 min atrás',
        type: 'info',
        unread: false
      }
    ]);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/analysis/content': 'Análise de Conteúdo',
      '/analysis/sentiment': 'Análise de Sentimento',
      '/analysis/trends': 'Tendências',
      '/scraping/instagram': 'Scraping Instagram',
      '/scraping/tiktok': 'Scraping TikTok',
      '/scraping/sessions': 'Sessões de Scraping',
      '/scraping/schedule': 'Jobs Agendados',
      '/content/templates': 'Templates Virais',
      '/content/profiles': 'Perfis Analisados',
      '/content/viral': 'Conteúdo Viral',
      '/ai-agents': 'Agentes IA',
      '/webhooks': 'Webhooks',
      '/admin': 'Administração',
      '/settings': 'Configurações'
    };
    
    return titles[path] || 'Dashboard';
  };

  const handleLogout = () => {
    auth.logout();
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conteúdo, templates, perfis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-accent/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* System Status */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
          <Zap className="h-3 w-3 text-green-600" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Sistema Online
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notificações</h3>
                <p className="text-sm text-muted-foreground">
                  {unreadCount} não lidas
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors",
                      notification.unread && "bg-accent/20"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.time}
                        </p>
                      </div>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-border">
                <button className="text-sm text-primary hover:underline">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            {user && (
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user.name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            )}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-popover border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <p className="font-medium text-foreground">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    {user?.plan || 'Premium'}
                  </span>
                </div>
              </div>
              
              <div className="py-2">
                <button className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <User className="h-4 w-4 mr-3" />
                  Meu Perfil
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Settings className="h-4 w-4 mr-3" />
                  Configurações
                </button>
              </div>
              
              <div className="py-2 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;

