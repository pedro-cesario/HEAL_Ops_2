export type ModuleId =
  | 'visao-geral'
  | 'equipe'
  | 'pendencias-auditoria'
  | 'relatorios'
  | 'agente'
  | 'reunioes'
  | 'configuracoes';

export type ThemeMode = 'light' | 'dark';

export type RuntimeDataMode = 'demo' | 'disconnected' | 'unavailable' | 'stale';

export type IntegrationStatus =
  | 'configured'
  | 'pending'
  | 'not_configured'
  | 'unavailable'
  | 'error'
  | 'requires_auth';

export type OperationalSemanticState =
  | 'nominal'
  | 'attention'
  | 'critical'
  | 'neutral'
  | 'unavailable';

export type StaleTimeBasis = 'corridas' | 'uteis';

export type PersistenceClassification =
  | 'persistencia_real'
  | 'sessao_local'
  | 'demonstrativa'
  | 'dependente_backend'
  | 'nao_implementada';

export interface EndpointConfig {
  portalFastApiUrl: string;
  r7RuntimeUrl: string;
  stagingUrl: string;
  glpiTicketUrlTemplate: string;
  autoRefreshSeconds: number;
  staleTicketThresholdHours: number;
  staleTicketTimeBasis: StaleTimeBasis;
  m365Configured: boolean;
  localAiUrl: string;
  pdfServiceConfigured: boolean;
}

export interface IntegrationDescriptor {
  id: string;
  name: string;
  category: 'core' | 'glpi' | 'm365' | 'ai' | 'docs';
  endpoint: string;
  status: IntegrationStatus;
  description: string;
  auditNote?: string;
}

export type TicketFilterKey =
  | 'abertos'
  | 'novos'
  | 'em_atendimento'
  | 'em_andamento'
  | 'sem_tecnico'
  | 'sem_tecnico_pop'
  | 'sem_atualizacao'
  | 'pendentes'
  | 'tempo_medio';

export interface OperationalKpi {
  key: TicketFilterKey;
  label: string;
  value: string | number;
  subtitle: string;
  state: OperationalSemanticState;
  updatedAt: string;
  isDistinctOperationalRule?: boolean;
  popSummary?: {
    totalWithoutTech: number;
    popNonCompliant: number;
    justifiedExceptions: number;
  };
}

export interface TicketItem {
  id: number;
  title: string;
  status: 'Novo' | 'Em atendimento' | 'Em andamento' | 'Pendente' | 'Solucionado' | 'Fechado';
  techName: string | null;
  group: string;
  category: string;
  macroArea: string;
  lastUpdatedAt: string;
  hoursWithoutUpdate: number;
  inclusionReasons: TicketFilterKey[];
  classificationReason: string;
  isPopNonCompliant: boolean;
  slaRisk: 'normal' | 'atencao' | 'critico';
}

export interface WeeklyPriority {
  id: string;
  ticketId: number;
  title: string;
  owner: string;
  status: 'Em curso' | 'Aguardando terceiros' | 'Risco de prazo' | 'Concluída';
  nextAction: string;
  dueDate?: string;
  sourceAlignmentDate: string;
}

export interface AgendaEvent {
  id: string;
  day: 'hoje' | 'amanha';
  startTime: string;
  endTime: string;
  title: string;
  type: 'Reunião' | 'Compromisso' | 'Prazo' | 'Alinhamento Individual';
  participants?: string;
  origin: 'Gestão Operacional' | 'Microsoft 365';
  locationOrLink?: string;
}

export interface MailPendingItem {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string;
  category: 'nao_lido' | 'sinalizado' | 'aguardando_resposta' | 'exige_acao';
  requiresAction: boolean;
  actionReason: string;
  dueDate?: string;
  preview: string;
  body: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  contractType: 'CLT 40h' | 'CLT 36h (Plantão)' | 'Terceirizado Dedicado' | 'Estágio TI';
  schedule: string;
  macroArea: string;
  responsibilities: string[];
  technicalReferences: string[];
  activeTickets: number;
  resolvedWeek: number;
  avgResponseHours: number;
  popComplianceRate: number;
  lastAlignmentDate: string;
  nextAlignmentDate: string;
  profileSummary: string;
  alignments: { date: string; summary: string; mood: string }[];
  feedbacks: { date: string; author: string; type: 'Reconhecimento' | 'Desenvolvimento'; note: string }[];
  goals: { id: string; title: string; target: string; progress: number; dueDate: string }[];
  commitments: { id: string; owner: 'Colaborador' | 'Gestor'; description: string; dueDate: string; status: 'Em dia' | 'Pendente' | 'Concluído' }[];
  pendings: { id: string; description: string; severity: 'Baixa' | 'Média' | 'Alta'; dueDate: string }[];
}

export interface ManagementPending {
  id: string;
  origin: 'GLPI' | 'Auditoria' | 'Alinhamento Semanal' | 'Alinhamento Individual' | 'GMUD';
  ticketId?: number;
  description: string;
  owner: string;
  criticality: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  dueDate: string;
  status: 'Aberta' | 'Em tratamento' | 'Impedimento externo' | 'Vencida' | 'Resolvida';
  nextAction: string;
  recurrenceCount?: number;
}

export type StratumDimension = 'tecnico' | 'macroarea' | 'categoria' | 'status' | 'grupo' | 'periodo';

export interface SamplingConfig {
  periodStart: string;
  periodEnd: string;
  universe: 'Todos os chamados encerrados' | 'Chamados sem técnico ou com atraso' | 'Chamados críticos assistenciais' | 'Abertos no período';
  percentage: number;
  strata: StratumDimension[];
}

export interface SamplingHistoryEntry {
  id: string;
  createdAt: string;
  universe: string;
  percentage: number;
  eligibleTotal: number;
  selectedCount: number;
  originState: 'proposed_preview' | 'backend_generated';
  criteriaSummary: string;
}

export type AuditVerdict = 'Conforme' | 'Não Conforme' | 'Não Aplicável';

export interface AuditSampleItem {
  id: string;
  ticketId: number;
  ticketTitle: string;
  techName: string;
  macroArea: string;
  category: string;
  group: string;
  status: string;
  popCriterion: string;
  verdict?: AuditVerdict;
  observation?: string;
  evidenceNote?: string;
  correctiveAction?: string;
  correctiveOwner?: string;
  correctiveDueDate?: string;
  auditStatus: 'Pendente' | 'Rascunho' | 'Concluída';
}

export interface AgentAuditSuggestion {
  id: string;
  ticketId: number;
  attentionPoint: string;
  rationale: string;
  evidence: string;
  source: string;
  confidence?: number;
  reviewState: 'Aguardando revisão humana' | 'Aceita para auditoria' | 'Descartada';
}

export type ReportId =
  | 'abertos'
  | 'solucionados'
  | 'fechados'
  | 'unicos_concluidos'
  | 'por_tecnico'
  | 'por_macroarea'
  | 'por_categoria'
  | 'evolucao_backlog'
  | 'tempo_medio'
  | 'sem_atualizacao'
  | 'sem_tecnico'
  | 'gargalos'
  | 'reincidencias'
  | 'nao_conformidades'
  | 'resultado_auditorias'
  | 'evolucao_historica';

export interface ReportCatalogItem {
  id: ReportId;
  title: string;
  group: 'Fluxo de Chamados' | 'Distribuição' | 'Qualidade & POP' | 'Tendência';
  summary: string;
  origin: string;
  definition: string;
  doubleCountGuard: string;
  chartType: 'bar' | 'line' | 'composed';
  chartData: Array<{ name: string; primary: number; secondary?: number; target?: number }>;
  primaryLabel: string;
  secondaryLabel?: string;
  rows: Array<{ label: string; count: number; share: string; avgHours: string; note: string }>;
}

export type AgentMessageCategory =
  | 'sugestao'
  | 'analise'
  | 'aprovacao_pendente'
  | 'executada'
  | 'bloqueada_demo'
  | 'falha'
  | 'indisponivel';

export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  category?: AgentMessageCategory;
  content: string;
  sources?: string[];
  evidence?: string[];
  proposedAction?: {
    id: string;
    targetSystem: 'GLPI' | 'Documento' | 'Auditoria' | 'Reunião';
    summary: string;
    payloadPreview: string;
    approvalStatus: 'pending_approval' | 'approved_blocked_demo' | 'rejected';
  };
}

export type MeetingTemplateCode = 'TPL-01' | 'TPL-02' | 'TPL-03' | 'TPL-04';

export type MeetingCategory =
  | 'Daily Operacional'
  | 'Alinhamento Semanal'
  | 'Alinhamento Individual'
  | 'Feedback'
  | 'Reunião Esporádica'
  | 'Reunião de Projeto';

export interface MeetingRecord {
  id: string;
  templateCode: MeetingTemplateCode;
  type: MeetingCategory;
  title: string;
  date: string;
  time: string;
  status: 'Próxima' | 'Em andamento' | 'Rascunho' | 'Finalizada';
  facilitator: string;
  participants: string[];
  version: string;
  contextSummary: string;
  decisions: { id: string; decision: string; owner: string; dueDate: string }[];
  commitments: { id: string; party: 'Gestor' | 'Colaborador' | 'Equipe'; owner: string; action: string; dueDate: string; status: string }[];
  nextSteps: string[];
  documentStatus: 'Visualização disponível · PDF server-side pendente';
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  targetModule: ModuleId;
  read: boolean;
}

export interface WeeklyBaselineSnapshot {
  alignmentDate: string;
  weekLabel: string;
  initialActiveCount: number;
  openedSinceAlignment: number;
  closedSinceAlignment: number;
  weeklyGoalReductionPercent: number;
  weeklyGoalTargetCount: number;
  weeklyGoalOwnerName: string;
  weeklyGoalDueDate: string;
  weeklyGoalNote: string;
}

export interface MacroAreaConfigItem {
  id: string;
  name: string;
  defaultLeadName: string;
  active: boolean;
}

export type IndividualMeetingType =
  | 'Alinhamento Mensal'
  | 'Feedback de Reconhecimento'
  | 'Feedback de Desenvolvimento'
  | 'Registro Esporádico';

export interface BilateralCommitmentItem {
  id: string;
  party: 'Colaborador' | 'Gestor';
  ownerName: string;
  description: string;
  dueDate: string;
  status: 'Em dia' | 'Pendente' | 'Concluído';
  linkedPendingId?: string;
}

export interface PreviousCommitmentEvaluation {
  commitmentId: string;
  party: 'Colaborador' | 'Gestor';
  description: string;
  dueDate: string;
  previousStatus: 'Em dia' | 'Pendente' | 'Concluído';
  outcome: 'Cumprido' | 'Parcial' | 'Em aberto (reapresentado)';
  evaluationNote: string;
}

export interface IndividualAlignmentRecord {
  id: string;
  meetingId: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorRole: string;
  macroArea: string;
  date: string;
  conductorName: string;
  meetingType: IndividualMeetingType;
  strengths: string;
  developmentPoints: string;
  previousCommitmentsEvaluation: PreviousCommitmentEvaluation[];
  nextAlignmentGoals: string[];
  collaboratorCommitments: BilateralCommitmentItem[];
  managerCommitments: BilateralCommitmentItem[];
  negotiationsAndAgreements: string;
  trackingNotes: string;
  finalConsiderations: string;
  nextAlignmentDate: string;
  acknowledgedInSession: boolean;
  acknowledgmentDate: string;
  status: 'Rascunho' | 'Finalizado';
  lastSavedAt: string | null;
}

export type GmudWorkflowStatus =
  | 'Rascunho'
  | 'Análise'
  | 'Aguardando Aprovação'
  | 'Aprovada'
  | 'Em Execução'
  | 'Validação'
  | 'Concluída'
  | 'Rejeitada'
  | 'Cancelada'
  | 'Rollback Executado';

export type GmudChecklistPhase = 'Pré-Execução' | 'Execução' | 'Validação' | 'Encerramento';

export interface GmudChecklistItem {
  id: string;
  phase: GmudChecklistPhase;
  text: string;
  ownerName: string;
  done: boolean;
  fromOriginalRecord: boolean;
}

export interface GmudTransitionLog {
  id: string;
  fromStatus: GmudWorkflowStatus;
  toStatus: GmudWorkflowStatus;
  actorName: string;
  note: string;
  timestamp: string;
  isSimulatedDemo: true;
}

export interface GmudApprovalSlot {
  id: string;
  role: string;
  approverName: string;
  decision: 'Pendente' | 'Aprovado (Simulação)' | 'Rejeitado (Simulação)';
  note: string;
  updatedAt: string;
}

export interface GmudRecord {
  id: string;
  code: string;
  title: string;
  status: GmudWorkflowStatus;
  objective: string;
  justification: string;
  scope: string;
  equipmentAndLocations: string;
  technicalLead: string;
  executingTeam: string;
  executionWindow: string;
  impactAndRiskAnalysis: string;
  dependencies: string;
  executionPlan: string;
  communicationPlan: string;
  testPlan: string;
  rollbackPlan: string;
  evidencesNote: string;
  approvals: GmudApprovalSlot[];
  closureResult: string;
  checklist: GmudChecklistItem[];
  transitions: GmudTransitionLog[];
  lastUpdatedAt: string;
}

