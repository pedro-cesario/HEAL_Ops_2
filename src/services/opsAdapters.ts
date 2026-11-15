import {
  DEMO_AGENT_AUDIT_SUGGESTIONS,
  DEMO_AGENT_MESSAGES,
  DEMO_AGENDA_LOCAL,
  DEMO_AUDIT_ITEMS,
  DEMO_KPIS,
  DEMO_MAIL_ITEMS,
  DEMO_MEETINGS,
  DEMO_PENDINGS,
  DEMO_REPORTS,
  DEMO_SAMPLING_HISTORY,
  DEMO_TEAM,
  DEMO_TICKETS,
  DEMO_WEEKLY_PRIORITIES,
} from '../demo/demoData';
import type {
  AgendaEvent,
  AgentAuditSuggestion,
  AgentMessage,
  AuditSampleItem,
  EndpointConfig,
  MailPendingItem,
  ManagementPending,
  MeetingRecord,
  OperationalKpi,
  ReportCatalogItem,
  RuntimeDataMode,
  SamplingConfig,
  SamplingHistoryEntry,
  TeamMember,
  TicketItem,
  WeeklyPriority,
} from '../types/ops';

export interface AdapterResult<T> {
  data: T;
  sourceMode: RuntimeDataMode;
  fetchedAt: string;
  errorMessage?: string;
}

export function buildGlpiTicketUrl(template: string, ticketId: number): string {
  const safeTemplate = template.trim() || 'http://192.168.4.20/front/ticket.form.php?id={id}';
  return safeTemplate.replace('{id}', String(ticketId));
}

function nowTimeFormatted(): string {
  const d = new Date();
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const PortalAdapter = {
  async fetchOverview(mode: RuntimeDataMode, config: EndpointConfig): Promise<
    AdapterResult<{
      kpis: OperationalKpi[];
      tickets: TicketItem[];
      priorities: WeeklyPriority[];
    }>
  > {
    if (mode === 'disconnected') {
      return {
        data: { kpis: [], tickets: [], priorities: [] },
        sourceMode: 'disconnected',
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Backend principal FastAPI (:3312) não conectado. Configure a integração ou ative o modo demonstração.',
      };
    }
    if (mode === 'unavailable') {
      return {
        data: { kpis: [], tickets: [], priorities: [] },
        sourceMode: 'unavailable',
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Serviço temporariamente indisponível ao consultar indicadores operacionais.',
      };
    }

    const threshold = Math.max(1, config.staleTicketThresholdHours || 24);
    const basisLabel = config.staleTicketTimeBasis === 'uteis' ? 'úteis' : 'corridas';

    const dynamicTickets: TicketItem[] = DEMO_TICKETS.map((t) => {
      const baseReasons = t.inclusionReasons.filter((r) => r !== 'sem_atualizacao');
      const isStale = t.hoursWithoutUpdate > threshold;
      return {
        ...t,
        inclusionReasons: isStale ? [...baseReasons, 'sem_atualizacao'] : baseReasons,
      };
    });

    const staleCount = dynamicTickets.filter((t) => t.inclusionReasons.includes('sem_atualizacao')).length;
    const dynamicKpis: OperationalKpi[] = DEMO_KPIS.map((k) => {
      if (k.key !== 'sem_atualizacao') return k;
      return {
        ...k,
        value: staleCount,
        subtitle: `Regra ref.: > ${threshold}h ${basisLabel} (parametrizável)`,
      };
    });

    return {
      data: {
        kpis: dynamicKpis,
        tickets: dynamicTickets,
        priorities: DEMO_WEEKLY_PRIORITIES,
      },
      sourceMode: mode,
      fetchedAt: mode === 'stale' ? '09:15 (Desatualizado)' : nowTimeFormatted(),
    };
  },
};

export const GlpiAdapter = {
  getTicketExternalUrl(config: EndpointConfig, ticketId: number): string {
    return buildGlpiTicketUrl(config.glpiTicketUrlTemplate, ticketId);
  },
};

export const Microsoft365Adapter = {
  async fetchAgenda(mode: RuntimeDataMode, config: EndpointConfig): Promise<AdapterResult<AgendaEvent[]>> {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return {
        data: [],
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Agenda indisponível no estado atual de conexão.',
      };
    }
    // Even in demo mode, M365 calendar sync is explicitly unconfigured unless toggled/configured;
    // local operational commitments are returned separately from M365 events.
    const events = config.m365Configured
      ? DEMO_AGENDA_LOCAL
      : DEMO_AGENDA_LOCAL.filter((e) => e.origin === 'Gestão Operacional');
    return {
      data: events,
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },

  async fetchMailbox(mode: RuntimeDataMode, config: EndpointConfig): Promise<AdapterResult<MailPendingItem[]>> {
    if (mode === 'disconnected' || mode === 'unavailable' || !config.m365Configured) {
      return {
        data: mode === 'demo' ? DEMO_MAIL_ITEMS : [],
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: !config.m365Configured
          ? 'Integração Microsoft 365 não configurada. Exibição restrita a registros demonstrativos para validação de layout.'
          : undefined,
      };
    }
    return {
      data: DEMO_MAIL_ITEMS,
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },
};

export const TeamAdapter = {
  async fetchTeam(mode: RuntimeDataMode): Promise<AdapterResult<TeamMember[]>> {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return {
        data: [],
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Cadastro da equipe indisponível sem conexão com o portal principal.',
      };
    }
    return {
      data: DEMO_TEAM,
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },
};

export const StratifiedAuditAdapter = {
  async fetchPendingAndAudit(mode: RuntimeDataMode): Promise<
    AdapterResult<{
      pendings: ManagementPending[];
      history: SamplingHistoryEntry[];
      samples: AuditSampleItem[];
      aiSuggestions: AgentAuditSuggestion[];
    }>
  > {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return {
        data: { pendings: [], history: [], samples: [], aiSuggestions: [] },
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Motor de pendências e auditoria estratificada aguardando conexão com backend (:3312 / R7 :3310).',
      };
    }
    return {
      data: {
        pendings: DEMO_PENDINGS,
        history: DEMO_SAMPLING_HISTORY,
        samples: DEMO_AUDIT_ITEMS,
        aiSuggestions: DEMO_AGENT_AUDIT_SUGGESTIONS,
      },
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },

  calculateProposalPreview(config: SamplingConfig): {
    eligibleTotal: number;
    selectedCount: number;
    distribution: { stratum: string; eligible: number; selected: number }[];
  } {
    const baseEligible =
      config.universe === 'Todos os chamados encerrados'
        ? 140
        : config.universe === 'Chamados sem técnico ou com atraso'
          ? 28
          : config.universe === 'Chamados críticos assistenciais'
            ? 46
            : 182;

    const selectedCount = Math.max(1, Math.round((baseEligible * config.percentage) / 100));

    const primaryStratum = config.strata[0] || 'macroarea';
    const buckets: Record<StratumDimensionKey, { label: string; weight: number }[]> = {
      macroarea: [
        { label: 'Assistencial', weight: 0.4 },
        { label: 'Sistemas Assistenciais', weight: 0.23 },
        { label: 'Infraestrutura', weight: 0.2 },
        { label: 'Corporativo', weight: 0.17 },
      ],
      tecnico: [
        { label: 'Carlos Henrique', weight: 0.27 },
        { label: 'Juliana Almeida', weight: 0.21 },
        { label: 'Rafael Oliveira', weight: 0.16 },
        { label: 'Thiago Mendes', weight: 0.14 },
        { label: 'Mariana Costa', weight: 0.12 },
        { label: 'Beatriz Santos', weight: 0.1 },
      ],
      categoria: [
        { label: 'PEP / Prontuário', weight: 0.28 },
        { label: 'Impressão & Periféricos', weight: 0.24 },
        { label: 'Acessos e Identidade', weight: 0.2 },
        { label: 'Estações & Redes', weight: 0.28 },
      ],
      status: [
        { label: 'Solucionado', weight: 0.65 },
        { label: 'Fechado', weight: 0.35 },
      ],
      grupo: [
        { label: 'Suporte N1 Assistencial', weight: 0.42 },
        { label: 'Sistemas Clínicos (PEP)', weight: 0.25 },
        { label: 'Infraestrutura & Redes', weight: 0.2 },
        { label: 'Segurança & Governança', weight: 0.13 },
      ],
      periodo: [
        { label: '1ª Quinzena', weight: 0.48 },
        { label: '2ª Quinzena', weight: 0.52 },
      ],
    };

    const selectedBuckets = buckets[primaryStratum];
    const distribution = selectedBuckets.map((b) => {
      const eligible = Math.max(1, Math.round(baseEligible * b.weight));
      const selected = Math.max(1, Math.round(selectedCount * b.weight));
      return { stratum: b.label, eligible, selected };
    });

    return { eligibleTotal: baseEligible, selectedCount, distribution };
  },
};

type StratumDimensionKey = 'tecnico' | 'macroarea' | 'categoria' | 'status' | 'grupo' | 'periodo';

export const ReportsAdapter = {
  async fetchCatalog(mode: RuntimeDataMode): Promise<AdapterResult<ReportCatalogItem[]>> {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return {
        data: [],
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Módulo de relatórios sem acesso à base analítica do FastAPI (:3312).',
      };
    }
    return {
      data: DEMO_REPORTS,
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },
};

export const AgentAdapter = {
  async fetchConversation(mode: RuntimeDataMode): Promise<AdapterResult<AgentMessage[]>> {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return {
        data: [],
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Serviço do Agente Gerencial (R7 :3310) indisponível ou não autenticado.',
      };
    }
    return {
      data: DEMO_AGENT_MESSAGES,
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },
};

export const MeetingsDocumentsAdapter = {
  async fetchMeetings(mode: RuntimeDataMode): Promise<AdapterResult<MeetingRecord[]>> {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return {
        data: [],
        sourceMode: mode,
        fetchedAt: nowTimeFormatted(),
        errorMessage: 'Repositório de reuniões e atas aguardando conexão com o backend.',
      };
    }
    return {
      data: DEMO_MEETINGS,
      sourceMode: mode,
      fetchedAt: nowTimeFormatted(),
    };
  },
};
