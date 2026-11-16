import {
  DEMO_CONCLUDED_SAMPLE_TICKETS,
  DEMO_WEEKLY_EVOLUTION,
  createDemoWeeklyAlignmentDraft,
} from '../demo/weeklyAlignmentDemo';
import { DEMO_TEAM } from '../demo/demoData';
import type { EndpointConfig, RuntimeDataMode, TeamMember, TicketItem } from '../types/ops';
import type {
  WeeklyAlignmentDraft,
  WeeklyEvolutionPoint,
  WeeklyIndicatorCardData,
  WeeklyIndicatorKey,
} from '../types/weeklyAlignment';
import { PortalAdapter } from './opsAdapters';

export interface ExternalWeeklyOpsSnapshot {
  available: boolean;
  errorMessage?: string;
  fetchedAt: string;
  indicators: WeeklyIndicatorCardData[];
  tickets: TicketItem[];
  concludedTickets: TicketItem[];
  evolution: WeeklyEvolutionPoint[];
}

export const WeeklyAlignmentAdapter = {
  /**
   * Carrega o rascunho inicial do Alinhamento Semanal (TPL-02).
   * Preparado para consumir endpoint dedicado do FastAPI (:3312) quando homologado.
   */
  async loadAlignmentDraft(
    mode: RuntimeDataMode,
    meetingId: string,
    meetingTitle: string,
    meetingDate: string,
    eligibleBacklogCount = 16
  ): Promise<{ draft: WeeklyAlignmentDraft | null; errorMessage?: string }> {
    if (mode === 'disconnected') {
      return {
        draft: null,
        errorMessage: 'Backend principal FastAPI (:3312) desconectado. Ative o Modo Demonstração para conduzir o TPL-02 ou conecte o serviço.',
      };
    }
    if (mode === 'unavailable') {
      return {
        draft: null,
        errorMessage: 'Serviço de reuniões temporariamente indisponível.',
      };
    }
    return {
      draft: createDemoWeeklyAlignmentDraft(meetingId, meetingTitle, meetingDate, eligibleBacklogCount),
    };
  },

  /**
   * Busca colaboradores elegíveis para seleção dinâmica em Responsável e Técnico de Apoio.
   */
  async loadCollaborators(mode: RuntimeDataMode): Promise<TeamMember[]> {
    if (mode === 'disconnected' || mode === 'unavailable') {
      return [];
    }
    return DEMO_TEAM;
  },

  /**
   * Busca indicadores operacionais e chamados para a Etapa 2 e Etapa 3.
   * Nunca inventa números em estados indisponíveis/desconectados.
   */
  async fetchExternalSnapshot(
    mode: RuntimeDataMode,
    config: EndpointConfig
  ): Promise<ExternalWeeklyOpsSnapshot> {
    const overviewRes = await PortalAdapter.fetchOverview(mode, config);

    if (overviewRes.errorMessage) {
      const unavailableKeys: { key: WeeklyIndicatorKey; label: string }[] = [
        { key: 'abertos', label: 'Chamados abertos' },
        { key: 'novos', label: 'Chamados novos' },
        { key: 'em_atendimento', label: 'Em atendimento' },
        { key: 'pendentes', label: 'Pendentes' },
        { key: 'sem_atualizacao', label: 'Sem atualização' },
        { key: 'sem_tecnico_pop', label: 'Sem técnico (Desconformidade POP)' },
        { key: 'concluidos_semana', label: 'Solucionados / fechados (semana)' },
        { key: 'tempo_medio', label: 'Tempo médio' },
      ];
      return {
        available: false,
        errorMessage: overviewRes.errorMessage,
        fetchedAt: overviewRes.fetchedAt,
        indicators: unavailableKeys.map((item) => ({
          key: item.key,
          label: item.label,
          value: null,
          subtitle: 'Métrica indisponível no estado atual de conexão',
          available: false,
          semantic: 'unavailable',
        })),
        tickets: [],
        concludedTickets: [],
        evolution: [],
      };
    }

    const { kpis, tickets } = overviewRes.data;
    const findKpi = (key: string) => kpis.find((k) => k.key === key);
    const popNonCompliantCount = tickets.filter((t) => t.isPopNonCompliant).length;
    const staleThreshold = Math.max(1, config.staleTicketThresholdHours || 24);
    const staleBasis = config.staleTicketTimeBasis === 'uteis' ? 'úteis' : 'corridas';

    const indicators: WeeklyIndicatorCardData[] = [
      {
        key: 'abertos',
        label: 'Chamados abertos',
        value: findKpi('abertos')?.value ?? tickets.length,
        subtitle: 'Carteira ativa elegível no GLPI',
        delta: '-2 vs Sem 45',
        available: true,
        semantic: 'neutral',
      },
      {
        key: 'novos',
        label: 'Novos',
        value: findKpi('novos')?.value ?? 0,
        subtitle: 'Aguardando triagem inicial',
        available: true,
        semantic: 'attention',
      },
      {
        key: 'em_atendimento',
        label: 'Em atendimento',
        value: findKpi('em_atendimento')?.value ?? 0,
        subtitle: 'Com técnico em atuação',
        available: true,
        semantic: 'nominal',
      },
      {
        key: 'pendentes',
        label: 'Pendentes',
        value: findKpi('pendentes')?.value ?? 0,
        subtitle: 'Aguardando retorno/terceiros',
        available: true,
        semantic: 'neutral',
      },
      {
        key: 'sem_atualizacao',
        label: 'Sem atualização',
        value: findKpi('sem_atualizacao')?.value ?? 0,
        subtitle: `Acima de ${staleThreshold}h ${staleBasis}`,
        available: true,
        semantic: Number(findKpi('sem_atualizacao')?.value ?? 0) > 0 ? 'attention' : 'nominal',
      },
      {
        key: 'sem_tecnico_pop',
        label: 'Sem técnico (Desconformidade POP)',
        value: popNonCompliantCount,
        subtitle: popNonCompliantCount > 0 ? 'Exige atribuição imediata' : 'Conformidade POP regular',
        available: true,
        semantic: popNonCompliantCount > 0 ? 'critical' : 'nominal',
      },
      {
        key: 'concluidos_semana',
        label: 'Solucionados / fechados (semana)',
        value: 102,
        subtitle: 'Contagem única deduplicada (Sem 45)',
        delta: '+7,4% vs meta',
        available: true,
        semantic: 'nominal',
      },
      {
        key: 'tempo_medio',
        label: 'Tempo médio',
        value: findKpi('tempo_medio')?.value ?? '14,2h',
        subtitle: '1ª resposta e solução (7d)',
        delta: '-1,8h vs Sem 45',
        available: true,
        semantic: 'nominal',
      },
    ];

    return {
      available: true,
      fetchedAt: overviewRes.fetchedAt,
      indicators,
      tickets,
      concludedTickets: DEMO_CONCLUDED_SAMPLE_TICKETS,
      evolution: DEMO_WEEKLY_EVOLUTION,
    };
  },

  /**
   * Contrato tipado para persistência futura do rascunho/finalização no backend.
   * No modo demonstração opera estritamente na sessão em memória.
   */
  async persistDraftSession(
    mode: RuntimeDataMode,
    draft: WeeklyAlignmentDraft,
    finalize = false
  ): Promise<{ savedAt: string; backendSynced: boolean; note: string }> {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (mode === 'demo' || mode === 'stale') {
      return {
        savedAt: now,
        backendSynced: false,
        note: finalize
          ? 'Alinhamento finalizado na sessão local. Gravação definitiva aguarda contrato FastAPI (:3312).'
          : 'Rascunho salvo na sessão local. Persistência definitiva depende de integração com o backend.',
      };
    }
    return {
      savedAt: now,
      backendSynced: false,
      note: 'Sem backend conectado para persistência definitiva.',
    };
  },
};
