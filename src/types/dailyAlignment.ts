import type { CommitmentSituation } from './weeklyAlignment';

export type DailyStageId = 1 | 2 | 3 | 4;

export interface DailyStageMeta {
  id: DailyStageId;
  shortLabel: string;
  title: string;
  subtitle: string;
}

export const DAILY_ALIGNMENT_STAGES: DailyStageMeta[] = [
  {
    id: 1,
    shortLabel: 'Evolução',
    title: '1. Evolução da Semana',
    subtitle: 'Como começamos a semana no Alinhamento Semanal (TPL-02) e como estamos agora',
  },
  {
    id: 2,
    shortLabel: 'Macroáreas',
    title: '2. Parecer das Macroáreas',
    subtitle: 'Rodada rápida executiva por macroárea vinculada às prioridades do TPL-02',
  },
  {
    id: 3,
    shortLabel: 'Fila Crítica',
    title: '3. Fila Crítica',
    subtitle: 'Criticidade operacional, não conformidades POP, impedimentos e continuidade de pendências',
  },
  {
    id: 4,
    shortLabel: 'Desafio & Ata',
    title: '4. Desafio & Ata',
    subtitle: 'Desafio do dia (com histórico pendente) e consolidação editável da ata com compromissos',
  },
];

export interface DailyParticipant {
  id: string;
  name: string;
  role: string;
  macroArea: string;
  present: boolean;
}

export type MacroSituationStatus = 'Normal' | 'Atenção' | 'Crítica';

export interface DailyMacroReport {
  id: string;
  macroArea: string;
  leadName: string;
  situation: MacroSituationStatus;
  summary: string;
  weeklyPriorityId: string;
  blocker: string;
  nextAction: string;
}

export interface DailyCriticalQueueItemState {
  itemKey: string;
  ticketId?: number;
  pendingId?: string;
  ownerName: string;
  nextAction: string;
  dueDate: string;
  blockerNote: string;
  treatedInDaily: boolean;
  lastTreatedDate?: string;
}

export type DailyChallengeStage =
  | 'Análise'
  | 'Planejamento'
  | 'Projeto'
  | 'Homologação'
  | 'Produção';

export type DailyChallengeStatus =
  | 'Em aberto'
  | 'Em andamento'
  | 'Bloqueado'
  | 'Concluído';

export interface DailyOperationalChallenge {
  id: string;
  createdAtDate: string;
  problem: string;
  objective: string;
  ownerName: string;
  dueDate: string;
  stage: DailyChallengeStage;
  expectedResult: string;
  currentStatus: DailyChallengeStatus;
}

export interface DailyDecisionItem {
  id: string;
  stage: DailyStageId;
  decision: string;
  ownerName: string;
  dueDate: string;
  createdAt: string;
}

export interface DailyCommitmentItem {
  id: string;
  ownerName: string;
  action: string;
  dueDate: string;
  status: CommitmentSituation;
}

export interface DailyAlignmentDraft {
  meetingId: string;
  title: string;
  date: string;
  shiftLabel: string;
  status: 'Rascunho' | 'Finalizado';
  participants: DailyParticipant[];
  shiftHandoverNote: string;
  macroReports: DailyMacroReport[];
  criticalQueueStates: Record<string, DailyCriticalQueueItemState>;
  currentChallenge: DailyOperationalChallenge;
  minutesExecutiveNote: string;
  decisions: DailyDecisionItem[];
  commitments: DailyCommitmentItem[];
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  finalizedAt: string | null;
}
