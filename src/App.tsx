import React from 'react';
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

const PortalRouter: React.FC = () => {
  const { activeModule, computedTickets } = useOps();

  return (
    <AppShell>
      {activeModule === 'visao-geral' && <OverviewPage />}
      {activeModule === 'equipe' && <TeamPage />}
      {activeModule === 'pendencias-auditoria' && <PendingAuditPage />}
      {activeModule === 'relatorios' && <ReportsPage />}
      {activeModule === 'agente' && <AgentPage />}
      {activeModule === 'reunioes' && <MeetingsPage />}
      {activeModule === 'configuracoes' && <SettingsPage />}
      <TicketDrawer tickets={computedTickets} />
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
