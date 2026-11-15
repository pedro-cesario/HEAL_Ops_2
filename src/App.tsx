import React, { useCallback, useState } from 'react';
import { TicketDrawer } from './components/common/TicketDrawer';
import { AppShell } from './components/layout/AppShell';
import { OpsProvider, useOps } from './context/OpsContext';
import { AgentPage } from './pages/AgentPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { OverviewPage } from './pages/OverviewPage';
import { PendingAuditPage } from './pages/PendingAuditPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamPage } from './pages/TeamPage';
import type { TicketItem } from './types/ops';

const PortalRouter: React.FC = () => {
  const { activeModule } = useOps();
  const [cachedTickets, setCachedTickets] = useState<TicketItem[]>([]);

  const handleTicketsLoaded = useCallback((tickets: TicketItem[]) => {
    setCachedTickets(tickets);
  }, []);

  return (
    <AppShell>
      {activeModule === 'visao-geral' && <OverviewPage onTicketsLoaded={handleTicketsLoaded} />}
      {activeModule === 'equipe' && <TeamPage />}
      {activeModule === 'pendencias-auditoria' && <PendingAuditPage />}
      {activeModule === 'relatorios' && <ReportsPage />}
      {activeModule === 'agente' && <AgentPage />}
      {activeModule === 'reunioes' && <MeetingsPage />}
      {activeModule === 'configuracoes' && <SettingsPage />}
      <TicketDrawer tickets={cachedTickets} />
    </AppShell>
  );
};

export default function App() {
  return (
    <OpsProvider>
      <PortalRouter />
    </OpsProvider>
  );
}
