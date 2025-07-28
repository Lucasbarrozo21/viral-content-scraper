/**
 * SIDEBAR COMPONENT
 * Barra lateral de navegação do dashboard
 * 
 * Autor: Manus AI
 * Data: 27 de Janeiro de 2025
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Globe,
  Home,
  Image,
  MessageSquare,
  Search,
  Settings,
  TrendingUp,
  Users,
  Webhook,
  Zap
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    analysis: true,
    scraping: true,
    content: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      exact: true
    },
    {
      id: 'analysis',
      label: 'Análise',
      icon: BarChart3,
      expandable: true,
      children: [
        {
          id: 'content-analysis',
          label: 'Análise de Conteúdo',
          icon: FileText,
          path: '/analysis/content'
        },
        {
          id: 'sentiment-analysis',
          label: 'Análise de Sentimento',
          icon: MessageSquare,
          path: '/analysis/sentiment'
        },
        {
          id: 'trends',
          label: 'Tendências',
          icon: TrendingUp,
          path: '/analysis/trends'
        }
      ]
    },
    {
      id: 'scraping',
      label: 'Scraping',
      icon: Search,
      expandable: true,
      children: [
        {
          id: 'instagram-scraping',
          label: 'Instagram',
          icon: Globe,
          path: '/scraping/instagram'
        },
        {
          id: 'tiktok-scraping',
          label: 'TikTok',
          icon: Globe,
          path: '/scraping/tiktok'
        },
        {
          id: 'scraping-sessions',
          label: 'Sessões Ativas',
          icon: Zap,
          path: '/scraping/sessions'
        },
        {
          id: 'scheduled-jobs',
          label: 'Jobs Agendados',
          icon: Calendar,
          path: '/scraping/schedule'
        }
      ]
    },
    {
      id: 'content',
      label: 'Conteúdo',
      icon: Image,
      expandable: true,
      children: [
        {
          id: 'templates',
          label: 'Templates Virais',
          icon: FileText,
          path: '/content/templates'
        },
        {
          id: 'profiles',
          label: 'Perfis Analisados',
          icon: Users,
          path: '/content/profiles'
        },
        {
          id: 'viral-content',
          label: 'Conteúdo Viral',
          icon: TrendingUp,
          path: '/content/viral'
        }
      ]
    },
    {
      id: 'ai-agents',
      label: 'Agentes IA',
      icon: Bot,
      path: '/ai-agents'
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      icon: Webhook,
      path: '/webhooks'
    },
    {
      id: 'admin',
      label: 'Administração',
      icon: Database,
      path: '/admin'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      path: '/settings'
    }
  ];

  const isActiveItem = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const isActiveSection = (section) => {
    return section.children?.some(child => isActiveItem(child));
  };

  const renderMenuItem = (item, isChild = false) => {
    const isActive = isActiveItem(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.id];
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleSection(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              isActiveSection(item)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex items-center">
              <Icon className="h-4 w-4" />
              {!isCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="ml-auto">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
          
          {!isCollapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map(child => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isChild && "pl-6",
          isCollapsed && !isChild && "justify-center"
        )}
      >
        <Icon className="h-4 w-4" />
        {!isCollapsed && (
          <span className="ml-3">{item.label}</span>
        )}
      </Link>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Viral Scraper</h1>
              <p className="text-xs text-muted-foreground">AI Dashboard</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            !isCollapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Sistema Ativo</p>
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span>Todos os serviços online</span>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

