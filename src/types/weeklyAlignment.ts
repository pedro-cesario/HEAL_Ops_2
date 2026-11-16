import type { TicketItem } from './ops';

export type WeeklyStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AlignmentStageMeta {
  id: WeeklyStageId;
  shortLabel: string;
  title: string;
  subtitle: string;
}

export const WEEKLY_ALIGNMENT_STAGES: AlignmentStageMeta[] = [
  {
    id: 1,
    shortLabel: 'Abertura',
    title: '1. Abertura e Retrospectiva',
    subtitle: 'Check-in da equipe, resultados anteriores, entregas concluídas e impedimentos recorrentes',
  },
  {
    id: 2,
    shortLabel: 'Indicadores',
    title: '2. Indicadores Operacionais',
    subtitle: 'Indicadores vivos clicáveis com detalhamento de chamados e evolução semanal',
  },
  {
    id: 3,
    shortLabel: 'Prioridades & Meta',
    title: '3. Chamados, Prioridades e Metas',
    subtitle: 'Seleção da carteira semanal (até 5 prioridades), responsáveis, apoios e meta de backlog',
  },
  {
    id: 4,
    shortLabel: 'Macroáreas',
    title: '4. Macroáreas e Responsáveis',
    subtitle: 'Governança ao vivo de Suporte Técnico, Sistemas, Infraestrutura e Gestão',
  },
  {
    id: 5,
    shortLabel: 'Projetos & GMUD',
    title: '5. Projetos e GMUD',
    subtitle: 'Mudanças programadas, riscos operacionais e encaminhamentos',
  },
  {
    id: 6,
    shortLabel: 'Acordos',
    title: '6. Acordos e Compromissos',
    subtitle: 'Consolidação automática das prioridades, meta, entregas, decisões e compromissos',
  },
  {
    id: 7,
    shortLabel: 'Encerramento',
    title: '7. Encerramento',
    subtitle: 'Resumo executivo final, revisão, salvamento e conclusão do alinhamento',
  },
];

export interface AlignmentParticipant {
  id: string;
  name: string;
  role: string;
  macroArea: string;
  present: boolean;
}

export interface PreviousResultMetric {
  id: string;
  label: string;
  value: string;
  target: string;
  delta: string;
  status: 'atingido' | 'atencao' | 'critico';
}

export interface CompletedPriorWeekItem {
  id: string;
  ticketId: number;
  title: string;
  owner: string;
  outcome: 'Concluída' | 'Parcial' | 'Reprogramada';
}

export interface RecurrentBlockerItem {
  id: string;
  title: string;
  area: string;
  recurrences: number;
  status: 'Em aberto' | 'Encaminhado' | 'Tratado';
  note?: string;
}

export interface AlignmentPriorityItem {
  id: string;
  ticketId: number;
  ticketTitle: string;
  ticketStatus: TicketItem['status'];
  ticketLastUpdated: string;
  currentTech: string | null;
  macroArea: string;
  primaryOwnerId: string;
  primaryOwnerName: string;
  supportTechId: string;
  supportTechName: string;
  dueDate: string;
  nextAction: string;
  justification: string;
  order: number;
}

export interface WeeklyGoalDraft {
  reductionPercent: number;
  targetCount: number;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  note: string;
}

export type MacroAreaId = 'suporte' | 'sistemas' | 'infraestrutura' | 'gestao';

export interface MacroAreaDeliverable {
  id: string;
  text: string;
  done: boolean;
}

export interface MacroAreaPending {
  id: string;
  text: string;
  resolved: boolean;
}

export interface MacroAreaGovernance {
  id: MacroAreaId;
  name: string;
  primaryOwnerId: string;
  primaryOwnerName: string;
  supportTechId: string;
  supportTechName: string;
  objective: string;
  deliverables: MacroAreaDeliverable[];
  pendings: MacroAreaPending[];
  dueDate: string;
}

export interface ProjectGmudReferral {
  id: string;
  text: string;
  ownerName: string;
  createdAt: string;
}

export interface ProjectGmudItem {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  status: 'Em preparação' | 'Em execução' | 'Janela programada' | 'Atenção';
  dueDate: string;
  nextAction: string;
  risk: 'Baixo' | 'Médio' | 'Alto';
  referrals: ProjectGmudReferral[];
}

export interface AlignmentDecisionItem {
  id: string;
  stage: WeeklyStageId;
  decision: string;
  ownerName: string;
  dueDate: string;
  createdAt: string;
}

export type CommitmentSituation = 'Pendente' | 'Em curso' | 'Confirmado' | 'Concluído';

export type CommitmentOriginType =
  | 'Prioridade'
  | 'Meta Semanal'
  | 'Macroárea'
  | 'Decisão'
  | 'Projeto/GMUD'
  | 'Compromisso Adicional';

export interface ExtraCommitmentItem {
  id: string;
  commitment: string;
  ownerId: string;
  ownerName: string;
  supportId: string;
  supportName: string;
  dueDate: string;
  status: CommitmentSituation;
}

export interface ConsolidatedCommitmentRow {
  key: string;
  origin: CommitmentOriginType;
  originStage: WeeklyStageId;
  sourceRefId: string;
  commitment: string;
  ownerName: string;
  supportName: string;
  dueDate: string;
  status: CommitmentSituation;
  editable: boolean;
}

export type WeeklyIndicatorKey =
  | 'abertos'
  | 'novos'
  | 'em_atendimento'
  | 'pendentes'
  | 'sem_atualizacao'
  | 'sem_tecnico_pop'
  | 'concluidos_semana'
  | 'tempo_medio';

export interface WeeklyIndicatorCardData {
  key: WeeklyIndicatorKey;
  label: string;
  value: string | number | null;
  subtitle: string;
  delta?: string;
  available: boolean;
  semantic: 'nominal' | 'attention' | 'critical' | 'neutral' | 'unavailable';
}

export interface WeeklyEvolutionPoint {
  week: string;
  abertos: number;
  concluidos: number;
  meta: number;
}

export interface WeeklyAlignmentDraft {
  meetingId: string;
  weekLabel: string;
  date: string;
  title: string;
  status: 'Rascunho' | 'Finalizado';
  participants: AlignmentParticipant[];
  openingObservation: string;
  previousResults: PreviousResultMetric[];
  completedPriorities: CompletedPriorWeekItem[];
  inheritedPendingCommitments: { id: string; text: string; owner: string; dueDate: string; status: string }[];
  recurrentBlockers: RecurrentBlockerItem[];
  priorities: AlignmentPriorityItem[];
  weeklyGoal: WeeklyGoalDraft;
  macroAreas: MacroAreaGovernance[];
  projectsGmud: ProjectGmudItem[];
  decisions: AlignmentDecisionItem[];
  extraCommitments: ExtraCommitmentItem[];
  consolidatedStatusOverrides: Record<string, CommitmentSituation>;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  finalizedAt: string | null;
}
