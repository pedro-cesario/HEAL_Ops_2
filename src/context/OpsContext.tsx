import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_INTEGRATIONS,
  DEMO_AGENT_AUDIT_SUGGESTIONS,
  DEMO_AGENT_MESSAGES,
  DEMO_AUDIT_ITEMS,
  DEMO_KPIS,
  DEMO_MEETINGS,
  DEMO_NOTIFICATIONS,
  DEMO_PENDINGS,
  DEMO_SAMPLING_HISTORY,
  DEMO_TEAM,
  DEMO_TICKETS,
  DEMO_WEEKLY_PRIORITIES,
} from '../demo/demoData';
import {
  DEFAULT_MACRO_AREA_CONFIGS,
  DEFAULT_WEEKLY_BASELINE_SNAPSHOT,
  INITIAL_DAILY_CHALLENGES_HISTORY,
} from '../demo/dailyAlignmentDemo';
import {
  createInitialIndividualAlignments,
  INITIAL_GMUD_042,
} from '../demo/gmudAndIndividualDemo';
import { DEFAULT_ENDPOINT_CONFIG } from '../design/tokens';
import {
  clearOpsSession,
  loadOpsSession,
  saveOpsSessionPatch,
  type AgentActivityLogItem,
} from '../services/sessionStorage';
import type {
  DailyCriticalQueueItemState,
  DailyOperationalChallenge,
} from '../types/dailyAlignment';
import type {
  AgentAuditSuggestion,
  AgentMessage,
  AuditSampleItem,
  EndpointConfig,
  GmudApprovalSlot,
  GmudChecklistPhase,
  GmudRecord,
  GmudWorkflowStatus,
  IndividualAlignmentRecord,
  IndividualMeetingType,
  IntegrationDescriptor,
  MacroAreaConfigItem,
  ManagementPending,
  MeetingRecord,
  ModuleId,
  NotificationItem,
  OperationalKpi,
  RuntimeDataMode,
  SamplingHistoryEntry,
  TeamMember,
  ThemeMode,
  TicketFilterKey,
  TicketItem,
  WeeklyBaselineSnapshot,
  WeeklyPriority,
} from '../types/ops';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'info' | 'warning' | 'success' | 'error';
}

export interface PendingMeetingLaunch {
  meetingId: string;
  mode: 'executive' | 'presentation' | 'official_document';
}

const DEFAULT_ACTIVITY_LOGS: AgentActivityLogItem[] = [
  {
    id: 'actlog-1',
    timestamp: '12:54',
    detail: 'Proposta de cobrança #48198 gerada (aguardando aprovação).',
    tone: 'warning',
  },
  {
    id: 'actlog-2',
    timestamp: '12:53',
    detail: 'Diagnóstico de gargalos e POP consolidado para revisão.',
    tone: 'info',
  },
];

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrentDate(): string {
  return new Date().toLocaleDateString('pt-BR');
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
  sessionEpoch: number;
  resetDemoSession: () => void;
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

  // Dados operacionais sincronizados na sessão local (propagam entre módulos)
  computedTickets: TicketItem[];
  computedKpis: OperationalKpi[];
  weeklyPriorities: WeeklyPriority[];
  updateWeeklyPriorities: (next: WeeklyPriority[]) => void;
  updateSingleWeeklyPriority: (id: string, patch: Partial<WeeklyPriority>) => void;
  pendings: ManagementPending[];
  addPending: (pending: Omit<ManagementPending, 'id'>) => ManagementPending;
  updatePending: (id: string, patch: Partial<ManagementPending>) => void;
  auditSamples: AuditSampleItem[];
  saveAuditSampleEvaluation: (
    itemId: string,
    patch: Partial<AuditSampleItem>
  ) => { createdPendingId?: string };
  samplingHistory: SamplingHistoryEntry[];
  addSamplingHistoryEntry: (entry: SamplingHistoryEntry) => void;
  aiSuggestions: AgentAuditSuggestion[];
  updateAiSuggestionState: (
    id: string,
    reviewState: AgentAuditSuggestion['reviewState']
  ) => void;
  teamMembers: TeamMember[];
  addMemberAlignment: (memberId: string, summary: string, mood: string) => void;
  addMemberFeedback: (
    memberId: string,
    type: 'Reconhecimento' | 'Desenvolvimento',
    note: string
  ) => void;
  updateMemberGoalProgress: (memberId: string, goalId: string, progress: number) => void;
  addMemberCommitment: (
    memberId: string,
    owner: 'Colaborador' | 'Gestor',
    description: string,
    dueDate: string
  ) => void;
  toggleMemberCommitmentStatus: (memberId: string, commitmentId: string) => void;
  meetings: MeetingRecord[];
  upsertMeetingPatch: (meetingId: string, patch: Partial<MeetingRecord>) => void;
  createMeetingRecord: (record: Omit<MeetingRecord, 'id'>) => MeetingRecord;
  pendingMeetingLaunch: PendingMeetingLaunch | null;
  launchMeetingWorkspace: (
    meetingId: string,
    mode?: 'executive' | 'presentation' | 'official_document'
  ) => void;
  launchIndividualAlignmentForMember: (member: TeamMember) => void;
  launchGmud042: () => void;
  clearPendingMeetingLaunch: () => void;
  resolvedMailIds: string[];
  markMailResolved: (mailId: string) => void;
  agentMessages: AgentMessage[];
  setAgentMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  agentActivityLogs: AgentActivityLogItem[];
  appendAgentActivity: (detail: string, tone?: AgentActivityLogItem['tone']) => void;

  // Baseline semanal congelado, macroáreas configuráveis & continuidade da Daily
  weeklyBaseline: WeeklyBaselineSnapshot;
  updateWeeklyBaseline: (patch: Partial<WeeklyBaselineSnapshot>) => void;
  macroAreasConfig: MacroAreaConfigItem[];
  updateMacroAreaConfig: (id: string, patch: Partial<MacroAreaConfigItem>) => void;
  addMacroAreaConfig: (name: string, defaultLeadName: string) => void;
  toggleMacroAreaActive: (id: string) => void;
  dailyCriticalQueueStates: Record<string, DailyCriticalQueueItemState>;
  upsertDailyCriticalState: (
    itemKey: string,
    patch: Partial<DailyCriticalQueueItemState>
  ) => void;
  toggleDailyCriticalTreated: (itemKey: string) => void;
  dailyChallengesHistory: DailyOperationalChallenge[];
  upsertDailyChallenge: (challenge: DailyOperationalChallenge) => void;
  updateDailyChallengeStatus: (
    challengeId: string,
    status: DailyOperationalChallenge['currentStatus']
  ) => void;

  // TPL-03 Alinhamentos Individuais & Feedback + GMUD-042
  individualAlignments: IndividualAlignmentRecord[];
  upsertIndividualAlignment: (record: IndividualAlignmentRecord) => void;
  createIndividualAlignmentForMember: (
    member: TeamMember,
    meetingType?: IndividualMeetingType
  ) => IndividualAlignmentRecord;
  toggleBilateralCommitmentStatus: (
    recordId: string,
    party: 'Colaborador' | 'Gestor',
    commitmentId: string
  ) => void;
  gmud042: GmudRecord;
  updateGmud042: (patch: Partial<GmudRecord>) => void;
  transitionGmud042: (toStatus: GmudWorkflowStatus, actorName: string, note: string) => void;
  toggleGmudChecklistItem: (itemId: string) => void;
  addGmudChecklistItem: (phase: GmudChecklistPhase, text: string, ownerName: string) => void;
  updateGmudApproval: (
    approvalId: string,
    patch: Partial<GmudApprovalSlot>
  ) => void;
}

const OpsContext = createContext<OpsContextValue | null>(null);

export const OpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSession = useMemo(() => loadOpsSession(), []);

  const [activeModule, setActiveModule] = useState<ModuleId>('visao-geral');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setThemeState] = useState<ThemeMode>(initialSession.theme || 'light');
  const [dataMode, setDataMode] = useState<RuntimeDataMode>('demo');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastValidSync, setLastValidSync] = useState<string>('13:00');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [sessionEpoch, setSessionEpoch] = useState<number>(0);

  const [endpointConfig, setEndpointConfig] = useState<EndpointConfig>({
    ...DEFAULT_ENDPOINT_CONFIG,
    ...(initialSession.endpointConfig || {}),
  });
  const [integrations, setIntegrations] = useState<IntegrationDescriptor[]>(() => {
    const mergedCfg = { ...DEFAULT_ENDPOINT_CONFIG, ...(initialSession.endpointConfig || {}) };
    return DEFAULT_INTEGRATIONS.map((intItem) => {
      if (intItem.id === 'int-portal') return { ...intItem, endpoint: mergedCfg.portalFastApiUrl };
      if (intItem.id === 'int-r7') return { ...intItem, endpoint: mergedCfg.r7RuntimeUrl };
      if (intItem.id === 'int-staging') return { ...intItem, endpoint: mergedCfg.stagingUrl };
      if (intItem.id === 'int-glpi') return { ...intItem, endpoint: mergedCfg.glpiTicketUrlTemplate };
      if (intItem.id === 'int-ai') return { ...intItem, endpoint: mergedCfg.localAiUrl };
      return intItem;
    });
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTicketDrawerFilter, setActiveTicketDrawerFilter] = useState<TicketFilterKey | null>(null);

  // Shared session collections hydrated from localStorage
  const [weeklyPriorities, setWeeklyPrioritiesState] = useState<WeeklyPriority[]>(
    initialSession.weeklyPriorities || DEMO_WEEKLY_PRIORITIES
  );
  const [pendings, setPendingsState] = useState<ManagementPending[]>(
    initialSession.pendings || DEMO_PENDINGS
  );
  const [auditSamples, setAuditSamplesState] = useState<AuditSampleItem[]>(
    initialSession.auditSamples || DEMO_AUDIT_ITEMS
  );
  const [samplingHistory, setSamplingHistoryState] = useState<SamplingHistoryEntry[]>(
    initialSession.samplingHistory || DEMO_SAMPLING_HISTORY
  );
  const [aiSuggestions, setAiSuggestionsState] = useState<AgentAuditSuggestion[]>(
    initialSession.aiSuggestions || DEMO_AGENT_AUDIT_SUGGESTIONS
  );
  const [teamMembers, setTeamMembersState] = useState<TeamMember[]>(
    initialSession.teamMembers || DEMO_TEAM
  );
  const [meetings, setMeetingsState] = useState<MeetingRecord[]>(
    initialSession.meetings || DEMO_MEETINGS
  );
  const [resolvedMailIds, setResolvedMailIdsState] = useState<string[]>(
    initialSession.resolvedMailIds || []
  );
  const [agentMessages, setAgentMessagesState] = useState<AgentMessage[]>(
    initialSession.agentMessages || DEMO_AGENT_MESSAGES
  );
  const [agentActivityLogs, setAgentActivityLogsState] = useState<AgentActivityLogItem[]>(
    initialSession.agentActivityLogs || DEFAULT_ACTIVITY_LOGS
  );
  const [weeklyBaseline, setWeeklyBaselineState] = useState<WeeklyBaselineSnapshot>(
    initialSession.weeklyBaseline || DEFAULT_WEEKLY_BASELINE_SNAPSHOT
  );
  const [macroAreasConfig, setMacroAreasConfigState] = useState<MacroAreaConfigItem[]>(
    initialSession.macroAreasConfig || DEFAULT_MACRO_AREA_CONFIGS
  );
  const [dailyCriticalQueueStates, setDailyCriticalQueueStatesState] = useState<
    Record<string, DailyCriticalQueueItemState>
  >(
    initialSession.dailyCriticalQueueStates || {
      'ticket-48291': {
        itemKey: 'ticket-48291',
        ticketId: 48291,
        ownerName: 'Carlos Henrique',
        nextAction: 'Substituir cabeça térmica e testar spooler local antes das 14h',
        dueDate: 'Hoje · 14:00',
        blockerNote: 'Reserva de impressora térmica em validação com Suprimentos',
        treatedInDaily: true,
        lastTreatedDate: '15/11/2026',
      },
      'ticket-48274': {
        itemKey: 'ticket-48274',
        ticketId: 48274,
        ownerName: 'Mariana Costa',
        nextAction: 'Assumir chamado PEP Ala Norte (POP) e validar cache AD',
        dueDate: 'Hoje · 13:30',
        blockerNote: '',
        treatedInDaily: false,
      },
      'ticket-48198': {
        itemKey: 'ticket-48198',
        ticketId: 48198,
        ownerName: 'Thiago Mendes',
        nextAction: 'Cobrar protocolo SIP da operadora e registrar histórico no GLPI',
        dueDate: 'Hoje · 16:00',
        blockerNote: 'Dependência de retorno da operadora de telefonia (tronco 02)',
        treatedInDaily: false,
      },
    }
  );
  const [dailyChallengesHistory, setDailyChallengesHistoryState] = useState<
    DailyOperationalChallenge[]
  >(initialSession.dailyChallengesHistory || INITIAL_DAILY_CHALLENGES_HISTORY);
  const [individualAlignments, setIndividualAlignmentsState] = useState<IndividualAlignmentRecord[]>(
    () =>
      initialSession.individualAlignments ||
      createInitialIndividualAlignments(
        initialSession.teamMembers || DEMO_TEAM,
        initialSession.meetings || DEMO_MEETINGS
      )
  );
  const [gmud042, setGmud042State] = useState<GmudRecord>(
    initialSession.gmud042 || INITIAL_GMUD_042
  );
  const [pendingMeetingLaunch, setPendingMeetingLaunch] = useState<PendingMeetingLaunch | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveOpsSessionPatch({ theme });
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
        setLastValidSync(formatCurrentTime());
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
    setEndpointConfig((prev) => {
      const next = { ...prev, ...patch };
      saveOpsSessionPatch({ endpointConfig: next });
      return next;
    });
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

  // Derived operational tickets & KPIs reacting live to Settings rule
  const computedTickets = useMemo<TicketItem[]>(() => {
    if (dataMode === 'disconnected' || dataMode === 'unavailable') return [];
    const threshold = Math.max(1, endpointConfig.staleTicketThresholdHours || 24);
    return DEMO_TICKETS.map((t) => {
      const baseReasons = t.inclusionReasons.filter((r) => r !== 'sem_atualizacao');
      const isStale = t.hoursWithoutUpdate > threshold;
      return {
        ...t,
        inclusionReasons: isStale ? [...baseReasons, 'sem_atualizacao'] : baseReasons,
      };
    });
  }, [dataMode, endpointConfig.staleTicketThresholdHours]);

  const computedKpis = useMemo<OperationalKpi[]>(() => {
    if (dataMode === 'disconnected' || dataMode === 'unavailable') return [];
    const threshold = Math.max(1, endpointConfig.staleTicketThresholdHours || 24);
    const basisLabel = endpointConfig.staleTicketTimeBasis === 'uteis' ? 'úteis' : 'corridas';
    const staleCount = computedTickets.filter((t) => t.inclusionReasons.includes('sem_atualizacao')).length;
    return DEMO_KPIS.map((k) => {
      if (k.key !== 'sem_atualizacao') return k;
      return {
        ...k,
        value: staleCount,
        state: staleCount > 0 ? 'attention' : 'nominal',
        subtitle: `Regra ref.: > ${threshold}h ${basisLabel} (parametrizável)`,
      };
    });
  }, [dataMode, computedTickets, endpointConfig.staleTicketThresholdHours, endpointConfig.staleTicketTimeBasis]);

  // Priorities mutators (propagate across TPL-02 <-> Overview <-> TPL-01)
  const updateWeeklyPriorities = useCallback((next: WeeklyPriority[]) => {
    const trimmed = next.slice(0, 5);
    setWeeklyPrioritiesState(trimmed);
    saveOpsSessionPatch({ weeklyPriorities: trimmed });
  }, []);

  const updateSingleWeeklyPriority = useCallback((id: string, patch: Partial<WeeklyPriority>) => {
    setWeeklyPrioritiesState((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      saveOpsSessionPatch({ weeklyPriorities: next });
      return next;
    });
  }, []);

  // Pendings mutators
  const addPending = useCallback((pending: Omit<ManagementPending, 'id'>): ManagementPending => {
    const created: ManagementPending = {
      ...pending,
      id: `pen-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setPendingsState((prev) => {
      const next = [created, ...prev];
      saveOpsSessionPatch({ pendings: next });
      return next;
    });
    return created;
  }, []);

  const updatePending = useCallback((id: string, patch: Partial<ManagementPending>) => {
    setPendingsState((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      saveOpsSessionPatch({ pendings: next });
      return next;
    });
  }, []);

  // Audit mutators (with automatic propagation of 'Não Conforme' -> Pendências Gerenciais)
  const saveAuditSampleEvaluation = useCallback(
    (itemId: string, patch: Partial<AuditSampleItem>): { createdPendingId?: string } => {
      let targetTicket: AuditSampleItem | undefined;
      setAuditSamplesState((prev) => {
        const next = prev.map((item) => {
          if (item.id !== itemId) return item;
          targetTicket = { ...item, ...patch };
          return targetTicket;
        });
        saveOpsSessionPatch({ auditSamples: next });
        return next;
      });

      let createdPendingId: string | undefined;
      if (
        patch.verdict === 'Não Conforme' &&
        patch.auditStatus === 'Concluída' &&
        targetTicket
      ) {
        const ticketNumber = targetTicket.ticketId;
        const alreadyExists = pendings.some(
          (p) => p.origin === 'Auditoria' && p.ticketId === ticketNumber
        );
        if (!alreadyExists) {
          const newPending = addPending({
            origin: 'Auditoria',
            ticketId: ticketNumber,
            description: `Não conformidade POP detectada na auditoria: ${targetTicket.ticketTitle}`,
            owner: patch.correctiveOwner || targetTicket.techName,
            criticality: 'Alta',
            dueDate: patch.correctiveDueDate || '22/11/2026',
            status: 'Aberta',
            nextAction:
              patch.correctiveAction ||
              `Executar ação corretiva referente ao critério ${targetTicket.popCriterion}`,
            recurrenceCount: 1,
          });
          createdPendingId = newPending.id;
        }
      }

      return { createdPendingId };
    },
    [pendings, addPending]
  );

  const addSamplingHistoryEntry = useCallback((entry: SamplingHistoryEntry) => {
    setSamplingHistoryState((prev) => {
      const next = [entry, ...prev];
      saveOpsSessionPatch({ samplingHistory: next });
      return next;
    });
  }, []);

  const updateAiSuggestionState = useCallback(
    (id: string, reviewState: AgentAuditSuggestion['reviewState']) => {
      setAiSuggestionsState((prev) => {
        const next = prev.map((x) => (x.id === id ? { ...x, reviewState } : x));
        saveOpsSessionPatch({ aiSuggestions: next });
        return next;
      });
    },
    []
  );

  // Team mutators
  const updateTeamMembers = useCallback((updater: (prev: TeamMember[]) => TeamMember[]) => {
    setTeamMembersState((prev) => {
      const next = updater(prev);
      saveOpsSessionPatch({ teamMembers: next });
      return next;
    });
  }, []);

  const addMemberAlignment = useCallback(
    (memberId: string, summary: string, mood: string) => {
      if (!summary.trim()) return;
      const date = formatCurrentDate();
      updateTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                lastAlignmentDate: date,
                alignments: [{ date, summary: summary.trim(), mood: mood || 'Estável' }, ...m.alignments],
              }
            : m
        )
      );
    },
    [updateTeamMembers]
  );

  const addMemberFeedback = useCallback(
    (memberId: string, type: 'Reconhecimento' | 'Desenvolvimento', note: string) => {
      if (!note.trim()) return;
      const date = formatCurrentDate();
      updateTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                feedbacks: [
                  { date, author: 'Gestão Operacional', type, note: note.trim() },
                  ...m.feedbacks,
                ],
              }
            : m
        )
      );
    },
    [updateTeamMembers]
  );

  const updateMemberGoalProgress = useCallback(
    (memberId: string, goalId: string, progress: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(progress)));
      updateTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                goals: m.goals.map((g) => (g.id === goalId ? { ...g, progress: clamped } : g)),
              }
            : m
        )
      );
    },
    [updateTeamMembers]
  );

  const addMemberCommitment = useCallback(
    (
      memberId: string,
      owner: 'Colaborador' | 'Gestor',
      description: string,
      dueDate: string
    ) => {
      if (!description.trim()) return;
      updateTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                commitments: [
                  {
                    id: `c-${Date.now()}`,
                    owner,
                    description: description.trim(),
                    dueDate: dueDate || 'Esta semana',
                    status: 'Em dia',
                  },
                  ...m.commitments,
                ],
              }
            : m
        )
      );
    },
    [updateTeamMembers]
  );

  const toggleMemberCommitmentStatus = useCallback(
    (memberId: string, commitmentId: string) => {
      updateTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                commitments: m.commitments.map((c) => {
                  if (c.id !== commitmentId) return c;
                  const nextStatus =
                    c.status === 'Em dia'
                      ? 'Concluído'
                      : c.status === 'Concluído'
                        ? 'Pendente'
                        : 'Em dia';
                  return { ...c, status: nextStatus };
                }),
              }
            : m
        )
      );
    },
    [updateTeamMembers]
  );

  // Meetings & Launch mutators
  const upsertMeetingPatch = useCallback((meetingId: string, patch: Partial<MeetingRecord>) => {
    setMeetingsState((prev) => {
      const next = prev.map((m) => (m.id === meetingId ? { ...m, ...patch } : m));
      saveOpsSessionPatch({ meetings: next });
      return next;
    });
  }, []);

  const createMeetingRecord = useCallback((record: Omit<MeetingRecord, 'id'>): MeetingRecord => {
    const created: MeetingRecord = {
      ...record,
      id: `mtg-${Date.now()}`,
    };
    setMeetingsState((prev) => {
      const next = [created, ...prev];
      saveOpsSessionPatch({ meetings: next });
      return next;
    });
    return created;
  }, []);

  // Weekly baseline & Macroareas & Daily critical queue continuity mutators
  const updateWeeklyBaseline = useCallback((patch: Partial<WeeklyBaselineSnapshot>) => {
    setWeeklyBaselineState((prev) => {
      const next = { ...prev, ...patch };
      saveOpsSessionPatch({ weeklyBaseline: next });
      return next;
    });
  }, []);

  const updateMacroAreaConfig = useCallback(
    (id: string, patch: Partial<MacroAreaConfigItem>) => {
      setMacroAreasConfigState((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
        saveOpsSessionPatch({ macroAreasConfig: next });
        return next;
      });
    },
    []
  );

  const addMacroAreaConfig = useCallback((name: string, defaultLeadName: string) => {
    if (!name.trim()) return;
    const item: MacroAreaConfigItem = {
      id: `macro-${Date.now()}`,
      name: name.trim(),
      defaultLeadName: defaultLeadName.trim() || 'Gestor de TI',
      active: true,
    };
    setMacroAreasConfigState((prev) => {
      const next = [...prev, item];
      saveOpsSessionPatch({ macroAreasConfig: next });
      return next;
    });
  }, []);

  const toggleMacroAreaActive = useCallback((id: string) => {
    setMacroAreasConfigState((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      );
      saveOpsSessionPatch({ macroAreasConfig: next });
      return next;
    });
  }, []);

  const upsertDailyCriticalState = useCallback(
    (itemKey: string, patch: Partial<DailyCriticalQueueItemState>) => {
      setDailyCriticalQueueStatesState((prev) => {
        const existing = prev[itemKey] || {
          itemKey,
          ownerName: '',
          nextAction: '',
          dueDate: 'Hoje',
          blockerNote: '',
          treatedInDaily: false,
        };
        const next = {
          ...prev,
          [itemKey]: { ...existing, ...patch, itemKey },
        };
        saveOpsSessionPatch({ dailyCriticalQueueStates: next });
        return next;
      });
    },
    []
  );

  const toggleDailyCriticalTreated = useCallback((itemKey: string) => {
    const today = formatCurrentDate();
    setDailyCriticalQueueStatesState((prev) => {
      const existing = prev[itemKey] || {
        itemKey,
        ownerName: '',
        nextAction: '',
        dueDate: 'Hoje',
        blockerNote: '',
        treatedInDaily: false,
      };
      const nextTreated = !existing.treatedInDaily;
      const next = {
        ...prev,
        [itemKey]: {
          ...existing,
          treatedInDaily: nextTreated,
          lastTreatedDate: nextTreated ? today : existing.lastTreatedDate,
        },
      };
      saveOpsSessionPatch({ dailyCriticalQueueStates: next });
      return next;
    });
  }, []);

  const upsertDailyChallenge = useCallback((challenge: DailyOperationalChallenge) => {
    setDailyChallengesHistoryState((prev) => {
      const exists = prev.some((c) => c.id === challenge.id);
      const next = exists
        ? prev.map((c) => (c.id === challenge.id ? challenge : c))
        : [challenge, ...prev];
      saveOpsSessionPatch({ dailyChallengesHistory: next });
      return next;
    });
  }, []);

  const updateDailyChallengeStatus = useCallback(
    (challengeId: string, status: DailyOperationalChallenge['currentStatus']) => {
      setDailyChallengesHistoryState((prev) => {
        const next = prev.map((c) =>
          c.id === challengeId ? { ...c, currentStatus: status } : c
        );
        saveOpsSessionPatch({ dailyChallengesHistory: next });
        return next;
      });
    },
    []
  );

  // TPL-03 Individual Alignment mutators (bidirectional sync with TeamMember + MeetingRecord)
  const upsertIndividualAlignment = useCallback(
    (record: IndividualAlignmentRecord) => {
      setIndividualAlignmentsState((prev) => {
        const exists = prev.some((r) => r.id === record.id);
        const next = exists
          ? prev.map((r) => (r.id === record.id ? record : r))
          : [record, ...prev];
        saveOpsSessionPatch({ individualAlignments: next });
        return next;
      });

      // Sync commitments back to teamMembers and matching meeting record
      updateTeamMembers((prev) =>
        prev.map((m) => {
          if (m.id !== record.collaboratorId) return m;
          const syncedCommitments = [
            ...record.collaboratorCommitments.map((c) => ({
              id: c.id,
              owner: 'Colaborador' as const,
              description: c.description,
              dueDate: c.dueDate,
              status: c.status,
            })),
            ...record.managerCommitments.map((c) => ({
              id: c.id,
              owner: 'Gestor' as const,
              description: c.description,
              dueDate: c.dueDate,
              status: c.status,
            })),
          ];
          return {
            ...m,
            lastAlignmentDate: record.date,
            nextAlignmentDate: record.nextAlignmentDate || m.nextAlignmentDate,
            commitments: syncedCommitments.length > 0 ? syncedCommitments : m.commitments,
          };
        })
      );

      upsertMeetingPatch(record.meetingId, {
        status: record.status === 'Finalizado' ? 'Finalizada' : 'Em andamento',
        date: record.date,
        contextSummary: `${record.meetingType} · Pontos fortes: ${record.strengths}`,
        commitments: [
          ...record.collaboratorCommitments.map((c) => ({
            id: c.id,
            party: 'Colaborador' as const,
            owner: c.ownerName,
            action: c.description,
            dueDate: c.dueDate,
            status: c.status,
          })),
          ...record.managerCommitments.map((c) => ({
            id: c.id,
            party: 'Gestor' as const,
            owner: c.ownerName,
            action: c.description,
            dueDate: c.dueDate,
            status: c.status,
          })),
        ],
        nextSteps: [
          ...record.nextAlignmentGoals,
          `Próximo alinhamento: ${record.nextAlignmentDate || 'A definir'}`,
        ],
      });
    },
    [updateTeamMembers, upsertMeetingPatch]
  );

  const createIndividualAlignmentForMember = useCallback(
    (
      member: TeamMember,
      meetingType: IndividualMeetingType = 'Alinhamento Mensal'
    ): IndividualAlignmentRecord => {
      const today = formatCurrentDate();
      const createdMeeting = createMeetingRecord({
        templateCode: 'TPL-03',
        type: meetingType.startsWith('Feedback') ? 'Feedback' : 'Alinhamento Individual',
        title: `${meetingType} — ${member.name}`,
        date: today,
        time: formatCurrentTime(),
        status: 'Em andamento',
        facilitator: 'Gestor de TI',
        participants: ['Gestor de TI', member.name],
        version: 'v1.0 (Sessão local)',
        contextSummary: `Registro estruturado de ${meetingType.toLowerCase()} com ${member.name} (${member.role}).`,
        decisions: [],
        commitments: [],
        nextSteps: [`Próximo acompanhamento: ${member.nextAlignmentDate || 'Em 30 dias'}`],
        documentStatus: 'Visualização disponível · PDF server-side pendente',
      });

      const unresolvedFromMember = member.commitments
        .filter((c) => c.status !== 'Concluído')
        .map((c) => ({
          commitmentId: c.id,
          party: c.owner,
          description: c.description,
          dueDate: c.dueDate,
          previousStatus: c.status,
          outcome: 'Em aberto (reapresentado)' as const,
          evaluationNote: 'Reapresentado automaticamente por pendência em aberto.',
        }));

      const newRecord: IndividualAlignmentRecord = {
        id: `ind-${Date.now()}`,
        meetingId: createdMeeting.id,
        collaboratorId: member.id,
        collaboratorName: member.name,
        collaboratorRole: member.role,
        macroArea: member.macroArea,
        date: today,
        conductorName: 'Gestor de TI',
        meetingType,
        strengths: '',
        developmentPoints: '',
        previousCommitmentsEvaluation: unresolvedFromMember,
        nextAlignmentGoals: member.goals.map(
          (g) => `${g.title} (Alvo: ${g.target} · Prazo ${g.dueDate})`
        ),
        collaboratorCommitments: [],
        managerCommitments: [],
        negotiationsAndAgreements: '',
        trackingNotes: `Conformidade POP atual: ${member.popComplianceRate}% · Carteira nominal: ${member.activeTickets} chamados.`,
        finalConsiderations:
          'Registro gerencial de desenvolvimento e acompanhamento (não constitui advertência disciplinar formal).',
        nextAlignmentDate: member.nextAlignmentDate || '30 dias',
        acknowledgedInSession: false,
        acknowledgmentDate: '',
        status: 'Rascunho',
        lastSavedAt: null,
      };

      setIndividualAlignmentsState((prev) => {
        const next = [newRecord, ...prev];
        saveOpsSessionPatch({ individualAlignments: next });
        return next;
      });
      return newRecord;
    },
    [createMeetingRecord]
  );

  const toggleBilateralCommitmentStatus = useCallback(
    (recordId: string, party: 'Colaborador' | 'Gestor', commitmentId: string) => {
      setIndividualAlignmentsState((prev) => {
        const next = prev.map((rec) => {
          if (rec.id !== recordId) return rec;
          const cycle = (
            st: 'Em dia' | 'Pendente' | 'Concluído'
          ): 'Em dia' | 'Pendente' | 'Concluído' =>
            st === 'Em dia' ? 'Concluído' : st === 'Concluído' ? 'Pendente' : 'Em dia';
          return party === 'Colaborador'
            ? {
                ...rec,
                collaboratorCommitments: rec.collaboratorCommitments.map((c) =>
                  c.id === commitmentId ? { ...c, status: cycle(c.status) } : c
                ),
              }
            : {
                ...rec,
                managerCommitments: rec.managerCommitments.map((c) =>
                  c.id === commitmentId ? { ...c, status: cycle(c.status) } : c
                ),
              };
        });
        saveOpsSessionPatch({ individualAlignments: next });
        return next;
      });
    },
    []
  );

  // GMUD-042 mutators
  const updateGmud042 = useCallback((patch: Partial<GmudRecord>) => {
    const now = `${formatCurrentDate()} · ${formatCurrentTime()}`;
    setGmud042State((prev) => {
      const next = { ...prev, ...patch, lastUpdatedAt: now };
      saveOpsSessionPatch({ gmud042: next });
      return next;
    });
  }, []);

  const transitionGmud042 = useCallback(
    (toStatus: GmudWorkflowStatus, actorName: string, note: string) => {
      const now = `${formatCurrentDate()} · ${formatCurrentTime()}`;
      setGmud042State((prev) => {
        if (prev.status === toStatus) return prev;
        const next: GmudRecord = {
          ...prev,
          status: toStatus,
          lastUpdatedAt: now,
          transitions: [
            ...prev.transitions,
            {
              id: `tr-${Date.now()}`,
              fromStatus: prev.status,
              toStatus,
              actorName: actorName.trim() || 'Gestor de TI',
              note:
                note.trim() ||
                `Transição simulada em sessão para "${toStatus}" (sem aprovação institucional real).`,
              timestamp: now,
              isSimulatedDemo: true,
            },
          ],
        };
        saveOpsSessionPatch({ gmud042: next });
        return next;
      });
    },
    []
  );

  const toggleGmudChecklistItem = useCallback((itemId: string) => {
    const now = `${formatCurrentDate()} · ${formatCurrentTime()}`;
    setGmud042State((prev) => {
      const next: GmudRecord = {
        ...prev,
        lastUpdatedAt: now,
        checklist: prev.checklist.map((c) =>
          c.id === itemId ? { ...c, done: !c.done } : c
        ),
      };
      saveOpsSessionPatch({ gmud042: next });
      return next;
    });
  }, []);

  const addGmudChecklistItem = useCallback(
    (phase: GmudChecklistPhase, text: string, ownerName: string) => {
      if (!text.trim()) return;
      const now = `${formatCurrentDate()} · ${formatCurrentTime()}`;
      setGmud042State((prev) => {
        const next: GmudRecord = {
          ...prev,
          lastUpdatedAt: now,
          checklist: [
            ...prev.checklist,
            {
              id: `chk-${Date.now()}`,
              phase,
              text: text.trim(),
              ownerName: ownerName.trim() || prev.technicalLead,
              done: false,
              fromOriginalRecord: false,
            },
          ],
        };
        saveOpsSessionPatch({ gmud042: next });
        return next;
      });
    },
    []
  );

  const updateGmudApproval = useCallback(
    (approvalId: string, patch: Partial<GmudApprovalSlot>) => {
      const now = `${formatCurrentDate()} · ${formatCurrentTime()}`;
      setGmud042State((prev) => {
        const next: GmudRecord = {
          ...prev,
          lastUpdatedAt: now,
          approvals: prev.approvals.map((a) =>
            a.id === approvalId ? { ...a, ...patch, updatedAt: now } : a
          ),
        };
        saveOpsSessionPatch({ gmud042: next });
        return next;
      });
    },
    []
  );

  const launchMeetingWorkspace = useCallback(
    (meetingId: string, mode: 'executive' | 'presentation' | 'official_document' = 'presentation') => {
      setPendingMeetingLaunch({ meetingId, mode });
      setActiveModule('reunioes');
    },
    []
  );

  const launchIndividualAlignmentForMember = useCallback(
    (member: TeamMember) => {
      const existingInd = individualAlignments.find((r) => r.collaboratorId === member.id);
      if (existingInd) {
        const linkedMeeting = meetings.find((m) => m.id === existingInd.meetingId);
        if (!linkedMeeting) {
          createMeetingRecord({
            templateCode: 'TPL-03',
            type: 'Alinhamento Individual',
            title: `Alinhamento Individual e Feedback — ${member.name}`,
            date: existingInd.date,
            time: '14:00',
            status: existingInd.status === 'Finalizado' ? 'Finalizada' : 'Em andamento',
            facilitator: existingInd.conductorName,
            participants: [existingInd.conductorName, member.name],
            version: 'v1.0 (Sessão local)',
            contextSummary: `${existingInd.meetingType} com ${member.name}.`,
            decisions: [],
            commitments: [],
            nextSteps: existingInd.nextAlignmentGoals,
            documentStatus: 'Visualização disponível · PDF server-side pendente',
          });
        }
        setPendingMeetingLaunch({ meetingId: existingInd.meetingId, mode: 'executive' });
        setActiveModule('reunioes');
        return;
      }

      const createdRecord = createIndividualAlignmentForMember(member, 'Alinhamento Mensal');
      setPendingMeetingLaunch({ meetingId: createdRecord.meetingId, mode: 'executive' });
      setActiveModule('reunioes');
    },
    [individualAlignments, meetings, createMeetingRecord, createIndividualAlignmentForMember]
  );

  const launchGmud042 = useCallback(() => {
    const gmudMeeting = meetings.find(
      (m) => m.id === 'mtg-4' || m.templateCode === 'TPL-04'
    );
    if (gmudMeeting) {
      setPendingMeetingLaunch({ meetingId: gmudMeeting.id, mode: 'executive' });
      setActiveModule('reunioes');
      return;
    }
    const created = createMeetingRecord({
      templateCode: 'TPL-04',
      type: 'Reunião de Projeto',
      title: `${gmud042.code} · ${gmud042.title}`,
      date: formatCurrentDate(),
      time: formatCurrentTime(),
      status: 'Rascunho',
      facilitator: gmud042.technicalLead,
      participants: ['Rafael Oliveira', 'Thiago Mendes', 'Gestor de TI'],
      version: 'v1.2 (Sessão local)',
      contextSummary: gmud042.objective,
      decisions: [],
      commitments: [],
      nextSteps: [],
      documentStatus: 'Visualização disponível · PDF server-side pendente',
    });
    setPendingMeetingLaunch({ meetingId: created.id, mode: 'executive' });
    setActiveModule('reunioes');
  }, [meetings, createMeetingRecord, gmud042]);

  const clearPendingMeetingLaunch = useCallback(() => {
    setPendingMeetingLaunch(null);
  }, []);

  const markMailResolved = useCallback((mailId: string) => {
    setResolvedMailIdsState((prev) => {
      if (prev.includes(mailId)) return prev;
      const next = [...prev, mailId];
      saveOpsSessionPatch({ resolvedMailIds: next });
      return next;
    });
  }, []);

  const setAgentMessages = useCallback(
    (updater: React.SetStateAction<AgentMessage[]>) => {
      setAgentMessagesState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        saveOpsSessionPatch({ agentMessages: next });
        return next;
      });
    },
    []
  );

  const appendAgentActivity = useCallback(
    (detail: string, tone: AgentActivityLogItem['tone'] = 'info') => {
      const item: AgentActivityLogItem = {
        id: `actlog-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: formatCurrentTime(),
        detail,
        tone,
      };
      setAgentActivityLogsState((prev) => {
        const next = [item, ...prev].slice(0, 15);
        saveOpsSessionPatch({ agentActivityLogs: next });
        return next;
      });
    },
    []
  );

  const resetDemoSession = useCallback(() => {
    clearOpsSession();
    setEndpointConfig(DEFAULT_ENDPOINT_CONFIG);
    setIntegrations(DEFAULT_INTEGRATIONS);
    setWeeklyPrioritiesState(DEMO_WEEKLY_PRIORITIES);
    setWeeklyBaselineState(DEFAULT_WEEKLY_BASELINE_SNAPSHOT);
    setMacroAreasConfigState(DEFAULT_MACRO_AREA_CONFIGS);
    setDailyCriticalQueueStatesState({
      'ticket-48291': {
        itemKey: 'ticket-48291',
        ticketId: 48291,
        ownerName: 'Carlos Henrique',
        nextAction: 'Substituir cabeça térmica e testar spooler local antes das 14h',
        dueDate: 'Hoje · 14:00',
        blockerNote: 'Reserva de impressora térmica em validação com Suprimentos',
        treatedInDaily: true,
        lastTreatedDate: '15/11/2026',
      },
      'ticket-48274': {
        itemKey: 'ticket-48274',
        ticketId: 48274,
        ownerName: 'Mariana Costa',
        nextAction: 'Assumir chamado PEP Ala Norte (POP) e validar cache AD',
        dueDate: 'Hoje · 13:30',
        blockerNote: '',
        treatedInDaily: false,
      },
      'ticket-48198': {
        itemKey: 'ticket-48198',
        ticketId: 48198,
        ownerName: 'Thiago Mendes',
        nextAction: 'Cobrar protocolo SIP da operadora e registrar histórico no GLPI',
        dueDate: 'Hoje · 16:00',
        blockerNote: 'Dependência de retorno da operadora de telefonia (tronco 02)',
        treatedInDaily: false,
      },
    });
    setDailyChallengesHistoryState(INITIAL_DAILY_CHALLENGES_HISTORY);
    setIndividualAlignmentsState(createInitialIndividualAlignments(DEMO_TEAM, DEMO_MEETINGS));
    setGmud042State(INITIAL_GMUD_042);
    setPendingsState(DEMO_PENDINGS);
    setAuditSamplesState(DEMO_AUDIT_ITEMS);
    setSamplingHistoryState(DEMO_SAMPLING_HISTORY);
    setAiSuggestionsState(DEMO_AGENT_AUDIT_SUGGESTIONS);
    setTeamMembersState(DEMO_TEAM);
    setMeetingsState(DEMO_MEETINGS);
    setResolvedMailIdsState([]);
    setAgentMessagesState(DEMO_AGENT_MESSAGES);
    setAgentActivityLogsState(DEFAULT_ACTIVITY_LOGS);
    setSessionEpoch((n) => n + 1);
    setRefreshTrigger((n) => n + 1);
    pushToast({
      title: 'Base demonstrativa restaurada',
      description: 'Todos os rascunhos locais (localStorage) de prioridades, Daily, TPL-02, TPL-03, GMUD-042 e equipe foram reiniciados.',
      tone: 'success',
    });
  }, [pushToast]);

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
        sessionEpoch,
        resetDemoSession,
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
        computedTickets,
        computedKpis,
        weeklyPriorities,
        updateWeeklyPriorities,
        updateSingleWeeklyPriority,
        pendings,
        addPending,
        updatePending,
        auditSamples,
        saveAuditSampleEvaluation,
        samplingHistory,
        addSamplingHistoryEntry,
        aiSuggestions,
        updateAiSuggestionState,
        teamMembers,
        addMemberAlignment,
        addMemberFeedback,
        updateMemberGoalProgress,
        addMemberCommitment,
        toggleMemberCommitmentStatus,
        meetings,
        upsertMeetingPatch,
        createMeetingRecord,
        pendingMeetingLaunch,
        launchMeetingWorkspace,
        launchIndividualAlignmentForMember,
        launchGmud042,
        clearPendingMeetingLaunch,
        resolvedMailIds,
        markMailResolved,
        agentMessages,
        setAgentMessages,
        agentActivityLogs,
        appendAgentActivity,
        weeklyBaseline,
        updateWeeklyBaseline,
        macroAreasConfig,
        updateMacroAreaConfig,
        addMacroAreaConfig,
        toggleMacroAreaActive,
        dailyCriticalQueueStates,
        upsertDailyCriticalState,
        toggleDailyCriticalTreated,
        dailyChallengesHistory,
        upsertDailyChallenge,
        updateDailyChallengeStatus,
        individualAlignments,
        upsertIndividualAlignment,
        createIndividualAlignmentForMember,
        toggleBilateralCommitmentStatus,
        gmud042,
        updateGmud042,
        transitionGmud042,
        toggleGmudChecklistItem,
        addGmudChecklistItem,
        updateGmudApproval,
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
