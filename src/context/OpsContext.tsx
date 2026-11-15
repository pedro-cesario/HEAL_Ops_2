import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_INTEGRATIONS, DEMO_NOTIFICATIONS } from '../demo/demoData';
import { DEFAULT_ENDPOINT_CONFIG } from '../design/tokens';
import type {
  EndpointConfig,
  IntegrationDescriptor,
  ModuleId,
  NotificationItem,
  RuntimeDataMode,
  ThemeMode,
  TicketFilterKey,
} from '../types/ops';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'info' | 'warning' | 'success' | 'error';
}

interface OpsContextValue {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  dataMode: RuntimeDataMode;
  setDataMode: (mode: RuntimeDataMode) => void;
  isRefreshing: boolean;
  lastValidSync: string;
  refreshTrigger: number;
  triggerRefresh: () => void;
  endpointConfig: EndpointConfig;
  updateEndpointConfig: (patch: Partial<EndpointConfig>) => void;
  integrations: IntegrationDescriptor[];
  updateIntegrationEndpoint: (id: string, endpoint: string) => void;
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  activeTicketDrawerFilter: TicketFilterKey | null;
  openTicketDrawer: (filter: TicketFilterKey) => void;
  closeTicketDrawer: () => void;
}

const OpsContext = createContext<OpsContextValue | null>(null);

export const OpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ModuleId>('visao-geral');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [dataMode, setDataMode] = useState<RuntimeDataMode>('demo');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastValidSync, setLastValidSync] = useState<string>('13:00');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [endpointConfig, setEndpointConfig] = useState<EndpointConfig>(DEFAULT_ENDPOINT_CONFIG);
  const [integrations, setIntegrations] = useState<IntegrationDescriptor[]>(DEFAULT_INTEGRATIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTicketDrawerFilter, setActiveTicketDrawerFilter] = useState<TicketFilterKey | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 5200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshTrigger((n) => n + 1);
      if (dataMode === 'demo') {
        const now = new Date();
        setLastValidSync(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    }, 320);
  }, [dataMode]);

  // Configurable auto-refresh (default 60s)
  useEffect(() => {
    if (endpointConfig.autoRefreshSeconds <= 0) return;
    const ms = Math.max(15, endpointConfig.autoRefreshSeconds) * 1000;
    const timer = window.setInterval(() => {
      triggerRefresh();
    }, ms);
    return () => window.clearInterval(timer);
  }, [endpointConfig.autoRefreshSeconds, triggerRefresh]);

  const updateEndpointConfig = useCallback((patch: Partial<EndpointConfig>) => {
    setEndpointConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateIntegrationEndpoint = useCallback((id: string, endpoint: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, endpoint } : item))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const openTicketDrawer = useCallback((filter: TicketFilterKey) => {
    setActiveTicketDrawerFilter(filter);
  }, []);

  const closeTicketDrawer = useCallback(() => {
    setActiveTicketDrawerFilter(null);
  }, []);

  return (
    <OpsContext.Provider
      value={{
        activeModule,
        setActiveModule,
        sidebarCollapsed,
        setSidebarCollapsed,
        theme,
        toggleTheme,
        setTheme,
        dataMode,
        setDataMode,
        isRefreshing,
        lastValidSync,
        refreshTrigger,
        triggerRefresh,
        endpointConfig,
        updateEndpointConfig,
        integrations,
        updateIntegrationEndpoint,
        notifications,
        markAllNotificationsRead,
        toasts,
        pushToast,
        dismissToast,
        activeTicketDrawerFilter,
        openTicketDrawer,
        closeTicketDrawer,
      }}
    >
      {children}
    </OpsContext.Provider>
  );
};

export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext);
  if (!ctx) {
    throw new Error('useOps deve ser utilizado dentro de OpsProvider');
  }
  return ctx;
}
