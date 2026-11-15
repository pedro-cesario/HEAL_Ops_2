import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Bot,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import { INSTITUTIONAL_BRAND } from '../../design/tokens';
import type { ModuleId, RuntimeDataMode } from '../../types/ops';

interface NavItem {
  id: ModuleId;
  label: string;
  contextHint: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    contextHint: 'Central de comando diária do gestor',
    icon: LayoutDashboard,
  },
  {
    id: 'equipe',
    label: 'Equipe',
    contextHint: 'Colaboradores, jornadas, metas e alinhamentos',
    icon: Users,
  },
  {
    id: 'pendencias-auditoria',
    label: 'Pendências e Auditoria',
    contextHint: 'Pendências gerenciais e amostragem estratificada POP',
    icon: ClipboardCheck,
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    contextHint: 'Catálogo analítico sem dupla contagem',
    icon: BarChart3,
  },
  {
    id: 'agente',
    label: 'Agente Gerencial',
    contextHint: 'Assistente operacional com aprovação explícita',
    icon: Bot,
  },
  {
    id: 'reunioes',
    label: 'Reuniões',
    contextHint: 'Ritos TPL-01 a TPL-04, apresentações e atas oficiais',
    icon: CalendarClock,
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    contextHint: 'Integrações auditadas, regras POP e catálogo',
    icon: Settings,
  },
];

const DATA_MODE_LABELS: Record<RuntimeDataMode, string> = {
  demo: 'Modo Demonstração',
  disconnected: 'Desconectado',
  unavailable: 'Serviço Indisponível',
  stale: 'Dados Desatualizados',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    toggleTheme,
    dataMode,
    setDataMode,
    isRefreshing,
    lastValidSync,
    triggerRefresh,
    endpointConfig,
    notifications,
    markAllNotificationsRead,
    toasts,
    dismissToast,
  } = useOps();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((item) => item.id === activeModule) || NAV_ITEMS[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSelectModule = (id: ModuleId) => {
    setActiveModule(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1117] text-slate-900 dark:text-slate-100">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`no-print hidden lg:flex flex-col border-r border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] transition-[width] duration-150 ${
          sidebarCollapsed ? 'w-[64px]' : 'w-[228px]'
        } shrink-0`}
        aria-label="Navegação principal"
      >
        <div className="flex h-[52px] items-center justify-between border-b border-slate-200 dark:border-[#243242] px-3">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="font-display text-sm font-bold tracking-tight text-[#0F5E59] dark:text-[#2DD4BF] whitespace-nowrap block">
                {INSTITUTIONAL_BRAND.shortName}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                Instituto HEAL
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className={`rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-[#18222F] dark:hover:text-slate-100 transition-colors ${
              sidebarCollapsed ? 'mx-auto' : ''
            }`}
          >
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectModule(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#18222F] dark:hover:text-slate-100'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  size={17}
                  className={`shrink-0 ${
                    isActive
                      ? 'text-[#0F5E59] dark:text-[#2DD4BF]'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {sidebarCollapsed && (
                  <span className="pointer-events-none fixed left-[70px] z-50 hidden rounded-md border border-slate-200 dark:border-[#243242] bg-slate-900 dark:bg-[#18222F] px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-[#243242] p-2.5">
          {!sidebarCollapsed ? (
            <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              <div className="font-medium text-slate-700 dark:text-slate-300 truncate">
                Hospital Espírita André Luiz
              </div>
              <div className="mt-0.5 truncate">
                {dataMode === 'demo' ? 'Base demonstrativa isolada' : DATA_MODE_LABELS[dataMode]}
              </div>
            </div>
          ) : (
            <div
              className="mx-auto text-center font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400"
              title="Instituto HEAL — HEAL Ops 2.0"
            >
              HEAL
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative z-10 flex w-64 flex-col bg-white dark:bg-[#111923] border-r border-slate-200 dark:border-[#243242]">
            <div className="flex h-[52px] items-center justify-between border-b border-slate-200 dark:border-[#243242] px-4">
              <span className="font-display text-sm font-bold text-[#0F5E59] dark:text-[#2DD4BF]">
                {INSTITUTIONAL_BRAND.shortName}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-1.5 text-slate-500"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectModule(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF]'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Compact Top Header (52px) */}
        <header className="no-print flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#18222F] lg:hidden"
              aria-label="Abrir navegação"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="font-display text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                  {currentNav.label}
                </h1>
                <span className="hidden md:inline text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
                  /
                </span>
                <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentNav.contextHint}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Explicit Data Status + Runtime Mode Selector */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <select
                aria-label="Modo de operação dos dados"
                value={dataMode}
                onChange={(e) => setDataMode(e.target.value as RuntimeDataMode)}
                className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none ${
                  dataMode === 'demo'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                    : dataMode === 'disconnected' || dataMode === 'unavailable'
                      ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                <option value="demo">Demonstração (Design)</option>
                <option value="disconnected">Desconectado (Sem Backend)</option>
                <option value="unavailable">Serviço Indisponível</option>
                <option value="stale">Dados Desatualizados</option>
              </select>

              <span className="hidden xl:inline text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
                {dataMode === 'demo'
                  ? `Ref. demo ${lastValidSync} · ${endpointConfig.autoRefreshSeconds}s`
                  : dataMode === 'stale'
                    ? `Última válida ${lastValidSync}`
                    : 'Sem leitura válida'}
              </span>

              <button
                type="button"
                onClick={triggerRefresh}
                disabled={isRefreshing}
                title="Atualizar leitura operacional"
                aria-label="Atualizar leitura operacional"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden md:inline">{isRefreshing ? 'Atualizando' : 'Atualizar'}</span>
              </button>
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((p) => !p);
                  setUserMenuOpen(false);
                }}
                aria-label="Notificações operacionais"
                className="relative rounded-md border border-slate-200 dark:border-[#243242] p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#18222F] transition-colors"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] shadow-lg z-40">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#243242] px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Notificações ({notifications.length})
                    </span>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
                    >
                      Marcar como lidas
                    </button>
                  </div>
                  <div className="max-h-72 divide-y divide-slate-200 dark:divide-[#243242] overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setActiveModule(n.targetModule);
                          setNotifOpen(false);
                        }}
                        className="block w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-[#18222F] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-medium ${
                              n.read
                                ? 'text-slate-600 dark:text-slate-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {n.detail}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
              aria-label={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
              className="rounded-md border border-slate-200 dark:border-[#243242] p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#18222F] transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* User Access Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((p) => !p);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#18222F] transition-colors whitespace-nowrap"
              >
                <User size={14} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
                <span className="hidden md:inline">Gestor TI</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] shadow-lg z-40 p-3 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Coordenação Operacional de TI
                  </div>
                  <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                    Instituto HEAL · Sessão de Homologação
                  </div>
                  <div className="mt-2.5 border-t border-slate-200 dark:border-[#243242] pt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModule('configuracoes');
                        setUserMenuOpen(false);
                      }}
                      className="block w-full rounded px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#18222F]"
                    >
                      Gerenciar integrações e permissões
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Honest Runtime Status Strip (Only when Demo, Stale, Disconnected, or Unavailable) */}
        <div
          className={`no-print flex flex-wrap items-center justify-between gap-2 border-b px-4 py-1.5 text-xs ${
            dataMode === 'demo'
              ? 'border-amber-200/80 bg-amber-50/70 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200'
              : dataMode === 'stale'
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold whitespace-nowrap">
              {dataMode === 'demo'
                ? 'MODO DEMONSTRAÇÃO'
                : dataMode === 'stale'
                  ? 'DADOS DESATUALIZADOS'
                  : dataMode === 'unavailable'
                    ? 'SERVIÇO INDISPONÍVEL'
                    : 'BACKEND DESCONECTADO'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">
              {dataMode === 'demo'
                ? 'Dados ilustrativos isolados para validação de interface. Ações persistentes e integrações M365/PDF aguardam homologação de backend.'
                : dataMode === 'stale'
                  ? `Última leitura válida registrada às ${lastValidSync}. Tentando restabelecer atualização automática.`
                  : 'Sem comunicação com FastAPI (:3312) ou R7 (:3310). Alterne para Demonstração ou configure os endpoints.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerRefresh}
              className="font-medium underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
            >
              Tentar novamente
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveModule('configuracoes')}
              className="font-medium underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
            >
              Ver integrações
            </button>
          </div>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4">{children}</main>
      </div>

      {/* Non-blocking Toasts */}
      {toasts.length > 0 && (
        <div className="no-print fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-start justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 shadow-lg text-xs"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{toast.title}</div>
                {toast.description && (
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Fechar aviso"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
