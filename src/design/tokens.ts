import type { IntegrationStatus, OperationalSemanticState } from '../types/ops';

export const INSTITUTIONAL_BRAND = {
  shortName: 'HEAL Ops 2.0',
  institution: 'Instituto HEAL — Hospital Espírita André Luiz',
  department: 'Gestão Operacional de TI',
  versionNote: 'Frontend de Homologação',
};

export const SEMANTIC_STATE_STYLES: Record<
  OperationalSemanticState,
  { label: string; textClass: string; surfaceClass: string; borderClass: string }
> = {
  nominal: {
    label: 'Regular',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    surfaceClass: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-900/60',
  },
  attention: {
    label: 'Atenção',
    textClass: 'text-amber-700 dark:text-amber-400',
    surfaceClass: 'bg-amber-50/70 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-900/60',
  },
  critical: {
    label: 'Desconformidade',
    textClass: 'text-red-700 dark:text-red-400',
    surfaceClass: 'bg-red-50/70 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-900/60',
  },
  neutral: {
    label: 'Informativo',
    textClass: 'text-slate-700 dark:text-slate-300',
    surfaceClass: 'bg-slate-100/70 dark:bg-slate-800/40',
    borderClass: 'border-slate-200 dark:border-slate-800',
  },
  unavailable: {
    label: 'Indisponível',
    textClass: 'text-slate-500 dark:text-slate-400',
    surfaceClass: 'bg-slate-100/50 dark:bg-slate-900/50',
    borderClass: 'border-slate-200 dark:border-slate-800',
  },
};

export const INTEGRATION_STATUS_META: Record<
  IntegrationStatus,
  { label: string; textClass: string }
> = {
  configured: {
    label: 'Configurado',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  pending: {
    label: 'Pendente de homologação',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
  not_configured: {
    label: 'Não configurado',
    textClass: 'text-slate-600 dark:text-slate-400',
  },
  unavailable: {
    label: 'Indisponível',
    textClass: 'text-slate-500 dark:text-slate-400',
  },
  error: {
    label: 'Erro de comunicação',
    textClass: 'text-red-700 dark:text-red-400',
  },
  requires_auth: {
    label: 'Requer autorização',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
};

export const DEFAULT_ENDPOINT_CONFIG = {
  portalFastApiUrl: 'http://localhost:3312',
  r7RuntimeUrl: 'http://localhost:3310',
  stagingUrl: 'http://localhost:8788',
  glpiTicketUrlTemplate: 'http://192.168.4.20/front/ticket.form.php?id={id}',
  autoRefreshSeconds: 60,
  staleTicketThresholdHours: 24,
  staleTicketTimeBasis: 'corridas' as const,
  m365Configured: false,
  localAiUrl: 'http://localhost:3310/agent',
  pdfServiceConfigured: false,
};

export const PERSISTENCE_LABELS = {
  persistencia_real: 'Persistência real',
  sessao_local: 'Funcional apenas na sessão',
  demonstrativa: 'Demonstrativa',
  dependente_backend: 'Dependente de backend',
  nao_implementada: 'Não implementada',
} as const;
