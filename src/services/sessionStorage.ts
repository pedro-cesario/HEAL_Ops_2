import type {
  AgentAuditSuggestion,
  AgentMessage,
  AuditSampleItem,
  EndpointConfig,
  GmudRecord,
  IndividualAlignmentRecord,
  MacroAreaConfigItem,
  ManagementPending,
  MeetingRecord,
  SamplingHistoryEntry,
  TeamMember,
  ThemeMode,
  WeeklyBaselineSnapshot,
  WeeklyPriority,
} from '../types/ops';
import type {
  DailyAlignmentDraft,
  DailyCriticalQueueItemState,
  DailyOperationalChallenge,
} from '../types/dailyAlignment';
import type { WeeklyAlignmentDraft } from '../types/weeklyAlignment';

export const HEAL_SESSION_STORAGE_KEY = 'heal_ops_session_v1';

export interface AgentActivityLogItem {
  id: string;
  timestamp: string;
  detail: string;
  tone: 'info' | 'warning' | 'success';
}

export interface OpsSessionSnapshot {
  schemaVersion: 1;
  theme?: ThemeMode;
  endpointConfig?: Partial<EndpointConfig>;
  weeklyPriorities?: WeeklyPriority[];
  weeklyBaseline?: WeeklyBaselineSnapshot;
  macroAreasConfig?: MacroAreaConfigItem[];
  dailyCriticalQueueStates?: Record<string, DailyCriticalQueueItemState>;
  dailyChallengesHistory?: DailyOperationalChallenge[];
  individualAlignments?: IndividualAlignmentRecord[];
  gmud042?: GmudRecord;
  pendings?: ManagementPending[];
  auditSamples?: AuditSampleItem[];
  samplingHistory?: SamplingHistoryEntry[];
  aiSuggestions?: AgentAuditSuggestion[];
  teamMembers?: TeamMember[];
  meetings?: MeetingRecord[];
  resolvedMailIds?: string[];
  agentMessages?: AgentMessage[];
  agentActivityLogs?: AgentActivityLogItem[];
  weeklyDraftsByMeetingId?: Record<string, WeeklyAlignmentDraft>;
  dailyDraftsByMeetingId?: Record<string, DailyAlignmentDraft>;
}

export function loadOpsSession(): OpsSessionSnapshot {
  if (typeof window === 'undefined') {
    return { schemaVersion: 1 };
  }
  try {
    const raw = window.localStorage.getItem(HEAL_SESSION_STORAGE_KEY);
    if (!raw) return { schemaVersion: 1 };
    const parsed = JSON.parse(raw) as OpsSessionSnapshot;
    if (!parsed || parsed.schemaVersion !== 1) {
      return { schemaVersion: 1 };
    }
    return parsed;
  } catch {
    return { schemaVersion: 1 };
  }
}

export function saveOpsSessionPatch(patch: Partial<OpsSessionSnapshot>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadOpsSession();
    const next: OpsSessionSnapshot = {
      ...current,
      ...patch,
      schemaVersion: 1,
    };
    window.localStorage.setItem(HEAL_SESSION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignora falha de quota em modo restrito sem quebrar a sessão
  }
}

export function clearOpsSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(HEAL_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

export function loadWeeklyDraftFromStorage(meetingId: string): WeeklyAlignmentDraft | null {
  const session = loadOpsSession();
  return session.weeklyDraftsByMeetingId?.[meetingId] ?? null;
}

export function saveWeeklyDraftToStorage(meetingId: string, draft: WeeklyAlignmentDraft): void {
  const session = loadOpsSession();
  saveOpsSessionPatch({
    weeklyDraftsByMeetingId: {
      ...(session.weeklyDraftsByMeetingId || {}),
      [meetingId]: draft,
    },
  });
}

export function loadDailyDraftFromStorage(meetingId: string): DailyAlignmentDraft | null {
  const session = loadOpsSession();
  const draft = session.dailyDraftsByMeetingId?.[meetingId];
  if (!draft || !Array.isArray(draft.macroReports) || !draft.currentChallenge) {
    return null;
  }
  return draft;
}

export function saveDailyDraftToStorage(meetingId: string, draft: DailyAlignmentDraft): void {
  const session = loadOpsSession();
  saveOpsSessionPatch({
    dailyDraftsByMeetingId: {
      ...(session.dailyDraftsByMeetingId || {}),
      [meetingId]: draft,
    },
  });
}
