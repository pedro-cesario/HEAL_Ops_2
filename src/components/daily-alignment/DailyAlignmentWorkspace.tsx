import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  LayoutGrid,
  LogOut,
  Moon,
  Save,
  ShieldPlus,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import { useDailyAlignment } from '../../hooks/useDailyAlignment';
import {
  DAILY_ALIGNMENT_STAGES,
  type DailyStageId,
} from '../../types/dailyAlignment';
import type { ManagementPending, MeetingRecord } from '../../types/ops';
import { LoadingSkeletonGrid, Modal, UnavailableState } from '../common/UiPrimitives';
import { FullscreenControl } from '../weekly-alignment/FullscreenControl';
import { PresentationLayout } from '../weekly-alignment/PresentationLayout';
import { DailyStage1Evolution } from './stages/DailyStage1Evolution';
import { DailyStage2MacroReports } from './stages/DailyStage2MacroReports';
import { DailyStage3CriticalQueue } from './stages/DailyStage3CriticalQueue';
import { DailyStage4ChallengeMinutes } from './stages/DailyStage4ChallengeMinutes';

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const DailyAlignmentWorkspace: React.FC<{
  meeting: MeetingRecord;
  onExit: (syncedPatch?: Partial<MeetingRecord>) => void;
  onOpenOfficialDocument: (syncedPatch: Partial<MeetingRecord>) => void;
  onSyncToMeetingList?: (meetingId: string, syncedPatch: Partial<MeetingRecord>) => void;
}> = ({ meeting, onExit, onOpenOfficialDocument, onSyncToMeetingList }) => {
  const {
    theme,
    toggleTheme,
    toasts,
    dismissToast,
    triggerRefresh,
    setActiveModule,
    openTicketDrawer,
    lastValidSync,
  } = useOps();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    currentStage,
    setCurrentStage,
    freeMode,
    setFreeMode,
    elapsedSeconds,
    initialLoading,
    initialError,
    draft,
    computedTickets,
    computedKpis,
    weeklyPriorities,
    weeklyBaseline,
    macroAreasConfig,
    updateMacroAreaConfig,
    addMacroAreaConfig,
    toggleMacroAreaActive,
    pendings,
    dailyCriticalQueueStates,
    dailyChallengesHistory,
    updateDailyChallengeStatus,
    endpointConfig,
    collaboratorOptions,
    participantsModalOpen,
    setParticipantsModalOpen,
    decisionModalOpen,
    setDecisionModalOpen,
    pendingModalOpen,
    setPendingModalOpen,
    confirmFinalizeOpen,
    setConfirmFinalizeOpen,
    toggleParticipantPresence,
    updateShiftHandoverNote,
    updateMacroReport,
    updateCriticalItemState,
    toggleCriticalItemTreated,
    escalateTicketToPending,
    updatePortalPendingStatus,
    updateCurrentChallenge,
    updateMinutesExecutiveNote,
    addDailyDecision,
    addDailyCommitment,
    updateDailyCommitmentStatus,
    createQuickPending,
    saveDraftSession,
    finalizeDaily,
  } = useDailyAlignment(meeting.id, meeting.title, meeting.date);

  const [newDecisionText, setNewDecisionText] = useState('');
  const [newDecisionOwner, setNewDecisionOwner] = useState('Gestor de TI');
  const [newDecisionDue, setNewDecisionDue] = useState('Hoje · 16:00');

  const [pendingDesc, setPendingDesc] = useState('');
  const [pendingOwner, setPendingOwner] = useState('Carlos Henrique');
  const [pendingCrit, setPendingCrit] = useState<ManagementPending['criticality']>('Alta');
  const [pendingDue, setPendingDue] = useState('Hoje · 16:00');
  const [pendingNext, setPendingNext] = useState('');

  const buildMeetingSyncPatch = useCallback((): Partial<MeetingRecord> | undefined => {
    if (!draft) return undefined;
    return {
      status: draft.status === 'Finalizado' ? 'Finalizada' : 'Em andamento',
      participants: draft.participants.filter((p) => p.present).map((p) => p.name),
      contextSummary: draft.minutesExecutiveNote || draft.shiftHandoverNote || meeting.contextSummary,
      decisions: draft.decisions.map((d) => ({
        id: d.id,
        decision: d.decision,
        owner: d.ownerName,
        dueDate: d.dueDate,
      })),
      commitments: draft.commitments.map((c) => ({
        id: c.id,
        party: c.ownerName === 'Gestor de TI' ? 'Gestor' : 'Equipe',
        owner: c.ownerName,
        action: c.action,
        dueDate: c.dueDate,
        status: c.status,
      })),
      nextSteps: [
        `Desafio do dia (${draft.currentChallenge.ownerName} · ${draft.currentChallenge.stage}): ${draft.currentChallenge.objective}`,
        ...draft.macroReports.map(
          (mr) => `${mr.macroArea} [${mr.situation}]: ${mr.nextAction || mr.summary}`
        ),
      ],
    };
  }, [draft, meeting.contextSummary]);

  const handleSaveAndSync = useCallback(() => {
    saveDraftSession();
    const patch = buildMeetingSyncPatch();
    if (patch && onSyncToMeetingList) {
      onSyncToMeetingList(meeting.id, patch);
    }
  }, [saveDraftSession, buildMeetingSyncPatch, onSyncToMeetingList, meeting.id]);

  const handleFinalizeAndSync = useCallback(() => {
    finalizeDaily();
    const patch = buildMeetingSyncPatch();
    if (patch && onSyncToMeetingList) {
      onSyncToMeetingList(meeting.id, { ...patch, status: 'Finalizada' });
    }
  }, [finalizeDaily, buildMeetingSyncPatch, onSyncToMeetingList, meeting.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      if (participantsModalOpen || decisionModalOpen || pendingModalOpen || confirmFinalizeOpen) {
        return;
      }
      if (e.key === 'ArrowRight' && currentStage < 4) {
        setFreeMode(false);
        setCurrentStage((prev) => (prev < 4 ? ((prev + 1) as DailyStageId) : prev));
      } else if (e.key === 'ArrowLeft' && currentStage > 1) {
        setFreeMode(false);
        setCurrentStage((prev) => (prev > 1 ? ((prev - 1) as DailyStageId) : prev));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentStage,
    setCurrentStage,
    setFreeMode,
    participantsModalOpen,
    decisionModalOpen,
    pendingModalOpen,
    confirmFinalizeOpen,
  ]);

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1117] p-6">
        <div className="w-full max-w-3xl">
          <LoadingSkeletonGrid rows={4} />
        </div>
      </div>
    );
  }

  if (initialError || !draft) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1117] p-6">
        <div className="w-full max-w-xl">
          <UnavailableState
            title="Daily Operacional indisponível"
            description={initialError || 'Não foi possível preparar a sessão interativa da Daily.'}
            onRetry={triggerRefresh}
            onConfigure={() => setActiveModule('configuracoes')}
          />
        </div>
      </div>
    );
  }

  const stageMeta =
    DAILY_ALIGNMENT_STAGES.find((s) => s.id === currentStage) || DAILY_ALIGNMENT_STAGES[0];
  const presentCount = draft.participants.filter((p) => p.present).length;

  const getStageSummaryBadge = (stageId: DailyStageId): string => {
    switch (stageId) {
      case 1: {
        const delta = computedTickets.length - weeklyBaseline.initialActiveCount;
        return `${weeklyBaseline.initialActiveCount} → ${computedTickets.length} ativos (${delta >= 0 ? `+${delta}` : delta})`;
      }
      case 2: {
        const critical = draft.macroReports.filter((mr) => mr.situation !== 'Normal').length;
        return `${draft.macroReports.length} macroáreas · ${critical} em alerta`;
      }
      case 3:
        return `${computedTickets.filter((t) => t.isPopNonCompliant).length} POP · ${
          computedTickets.filter((t) => t.inclusionReasons.includes('sem_atualizacao')).length
        } sem atualiz.`;
      case 4:
        return `${draft.commitments.length} compromisso(s) · ${draft.status}`;
    }
  };

  const overlays = (
    <>
      {/* Modal Compacto: Check-in / Participantes (removido da Etapa 1) */}
      <Modal
        open={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        title="Check-in e Participantes da Daily"
        subtitle={`${presentCount}/${draft.participants.length} presentes · ${draft.shiftLabel}`}
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {draft.participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleParticipantPresence(p.id)}
                className={`flex items-center justify-between gap-2 rounded-md border p-2.5 text-left transition-colors ${
                  p.present
                    ? 'border-[#0F5E59]/50 dark:border-[#2DD4BF]/40 bg-[#0F5E59]/[0.05] dark:bg-[#2DD4BF]/[0.08]'
                    : 'border-slate-200 dark:border-[#243242] opacity-70'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {p.macroArea} · {p.role}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold shrink-0 ${
                    p.present ? 'text-[#0F5E59] dark:text-[#2DD4BF]' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {p.present ? 'Presente' : 'Ausente'}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setParticipantsModalOpen(false)}
              className="rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Concluir check-in
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Registrar Decisão da Daily (TPL-01)"
        subtitle={`Etapa ${currentStage}/4 · Consolidada na ata oficial do turno`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newDecisionText.trim()) return;
            addDailyDecision(newDecisionText, newDecisionOwner, newDecisionDue);
            setNewDecisionText('');
            setDecisionModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Decisão tomada
            </label>
            <textarea
              rows={3}
              required
              value={newDecisionText}
              onChange={(e) => setNewDecisionText(e.target.value)}
              placeholder="Ex.: Alocar técnico reserva na Farmácia Central durante troca de cabeça térmica..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <select
                value={newDecisionOwner}
                onChange={(e) => setNewDecisionOwner(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2"
              >
                {collaboratorOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prazo
              </label>
              <input
                type="text"
                value={newDecisionDue}
                onChange={(e) => setNewDecisionDue(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Registrar decisão
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        title="Criar Pendência Gerencial a partir da Daily"
        subtitle="Propaga imediatamente para Pendências e Auditoria (sessão local)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!pendingDesc.trim()) return;
            createQuickPending({
              description: pendingDesc.trim(),
              owner: pendingOwner,
              criticality: pendingCrit,
              dueDate: pendingDue,
              nextAction: pendingNext.trim(),
            });
            setPendingDesc('');
            setPendingNext('');
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descrição da pendência / impedimento
            </label>
            <textarea
              rows={2}
              required
              value={pendingDesc}
              onChange={(e) => setPendingDesc(e.target.value)}
              placeholder="Ex.: Aguardando confirmação de acesso remoto do fornecedor..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium mb-1">Responsável</label>
              <select
                value={pendingOwner}
                onChange={(e) => setPendingOwner(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-2"
              >
                {collaboratorOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Criticidade</label>
              <select
                value={pendingCrit}
                onChange={(e) =>
                  setPendingCrit(e.target.value as ManagementPending['criticality'])
                }
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-2"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Prazo</label>
              <input
                type="text"
                value={pendingDue}
                onChange={(e) => setPendingDue(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Próxima ação</label>
            <input
              type="text"
              value={pendingNext}
              onChange={(e) => setPendingNext(e.target.value)}
              placeholder="Ação de desbloqueio acordada..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPendingModalOpen(false)}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Criar pendência
            </button>
          </div>
        </form>
      </Modal>

      {toasts.length > 0 && (
        <div className="no-print fixed bottom-16 right-4 z-[60] flex w-80 flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-start justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 shadow-lg text-xs"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{toast.title}</div>
                {toast.description && (
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Fechar aviso"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5 shrink-0">
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <span className="font-display text-sm font-bold tracking-tight text-[#0F5E59] dark:text-[#2DD4BF] whitespace-nowrap">
          HEAL | Daily Operacional
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
          {draft.date}
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
          Etapa {currentStage}/4
        </span>
        <span className="hidden lg:inline text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
          · Sessão {formatElapsed(elapsedSeconds)} · Pulso {lastValidSync}
        </span>
        <span
          className={`hidden sm:inline text-[11px] font-mono whitespace-nowrap ${
            draft.status === 'Finalizado'
              ? 'text-emerald-700 dark:text-emerald-400'
              : draft.hasUnsavedChanges
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {draft.status === 'Finalizado'
            ? '· Finalizado'
            : draft.hasUnsavedChanges
              ? '· Em edição'
              : draft.lastSavedAt
                ? `· Salvo ${draft.lastSavedAt}`
                : '· Sessão ao vivo'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setParticipantsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <Users size={13} />
          <span>Check-in ({presentCount}/{draft.participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setDecisionModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-2.5 py-1.5 text-xs font-medium text-white dark:text-slate-950 transition-colors whitespace-nowrap"
        >
          <CheckSquare size={13} />
          <span>Registrar Decisão</span>
        </button>

        <button
          type="button"
          onClick={() => setPendingModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <ShieldPlus size={13} />
          <span>Criar Pendência</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAndSync}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <Save size={13} />
          <span>Salvar</span>
        </button>

        <FullscreenControl targetRef={containerRef} />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          className="rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] p-1.5 text-slate-600 dark:text-slate-300 hover:border-[#0F5E59]"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          type="button"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
            onExit(buildMeetingSyncPatch());
          }}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <LogOut size={13} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );

  const navigation = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#243242] bg-white/95 dark:bg-[#111923]/95 px-4 py-2 shrink-0">
      <nav aria-label="Etapas da Daily Operacional" className="flex items-center gap-1 overflow-x-auto">
        {DAILY_ALIGNMENT_STAGES.map((st) => {
          const active = !freeMode && currentStage === st.id;
          const completed = st.id < currentStage;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setFreeMode(false);
                setCurrentStage(st.id);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950'
                  : completed
                    ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18222F]'
              }`}
            >
              <span className="font-mono text-[11px] tabular-nums">{st.id}.</span>
              <span className="hidden md:inline">{st.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setFreeMode((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            freeMode
              ? 'border-[#0F5E59] bg-[#0F5E59]/10 text-[#0F5E59] dark:border-[#2DD4BF] dark:bg-[#2DD4BF]/15 dark:text-[#2DD4BF]'
              : 'border-slate-200 dark:border-[#243242] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18222F]'
          }`}
        >
          <LayoutGrid size={13} />
          <span>{freeMode ? 'Voltar à etapa' : 'Modo Livre'}</span>
        </button>

        <button
          type="button"
          disabled={currentStage === 1 && !freeMode}
          onClick={() => {
            setFreeMode(false);
            setCurrentStage((prev) => (prev > 1 ? ((prev - 1) as DailyStageId) : prev));
          }}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 whitespace-nowrap"
        >
          <ArrowLeft size={13} />
          <span>Anterior</span>
        </button>

        <button
          type="button"
          disabled={currentStage === 4 && !freeMode}
          onClick={() => {
            setFreeMode(false);
            setCurrentStage((prev) => (prev < 4 ? ((prev + 1) as DailyStageId) : prev));
          }}
          className="inline-flex items-center gap-1 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 disabled:opacity-40 whitespace-nowrap"
        >
          <span>Próximo</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <PresentationLayout
      containerRef={containerRef}
      header={header}
      navigation={navigation}
      overlays={overlays}
    >
      {freeMode ? (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Modo Livre — Mapa da Daily Operacional (4 etapas)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Salte diretamente para qualquer etapa da Daily preservando alterações ao vivo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFreeMode(false)}
              className="rounded-md bg-[#0F5E59] dark:bg-[#14B8A6] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950"
            >
              Retomar Etapa {currentStage}/4
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DAILY_ALIGNMENT_STAGES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setCurrentStage(st.id);
                  setFreeMode(false);
                }}
                className={`flex flex-col justify-between rounded-lg border p-4 text-left transition-colors ${
                  st.id === currentStage
                    ? 'border-[#0F5E59] dark:border-[#2DD4BF] bg-[#0F5E59]/[0.05] dark:bg-[#2DD4BF]/[0.06]'
                    : 'border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] hover:border-[#0F5E59]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#0F5E59] dark:text-[#2DD4BF]">
                    <span>ETAPA {st.id}/4</span>
                    <ArrowUpRight size={14} />
                  </div>
                  <h3 className="mt-1.5 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {st.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {st.subtitle}
                  </p>
                </div>
                <div className="mt-3 border-t border-slate-100 dark:border-[#1D2836] pt-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {getStageSummaryBadge(st.id)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {stageMeta.title}
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400">{stageMeta.subtitle}</span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
              {getStageSummaryBadge(currentStage)}
            </span>
          </div>

          {currentStage === 1 && (
            <DailyStage1Evolution
              draft={draft}
              baseline={weeklyBaseline}
              currentActiveCount={computedTickets.length}
              kpis={computedKpis}
              onUpdateHandoverNote={updateShiftHandoverNote}
              onJumpToCriticalQueue={() => {
                setFreeMode(false);
                setCurrentStage(3);
              }}
              onOpenTicketDrawer={(filter) => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onExit(buildMeetingSyncPatch());
                openTicketDrawer(filter);
              }}
            />
          )}

          {currentStage === 2 && (
            <DailyStage2MacroReports
              macroReports={draft.macroReports}
              macroConfigs={macroAreasConfig}
              weeklyPriorities={weeklyPriorities}
              collaborators={collaboratorOptions}
              onUpdateMacroReport={updateMacroReport}
              onUpdateMacroConfig={updateMacroAreaConfig}
              onAddMacroConfig={addMacroAreaConfig}
              onToggleMacroActive={toggleMacroAreaActive}
            />
          )}

          {currentStage === 3 && (
            <DailyStage3CriticalQueue
              tickets={computedTickets}
              pendings={pendings}
              weeklyPriorities={weeklyPriorities}
              criticalQueueStates={dailyCriticalQueueStates}
              collaborators={collaboratorOptions}
              endpointConfig={endpointConfig}
              onUpdateCriticalState={updateCriticalItemState}
              onToggleTreated={toggleCriticalItemTreated}
              onEscalateTicket={escalateTicketToPending}
              onUpdatePendingStatus={updatePortalPendingStatus}
            />
          )}

          {currentStage === 4 && (
            <DailyStage4ChallengeMinutes
              draft={draft}
              challengesHistory={dailyChallengesHistory}
              weeklyPriorities={weeklyPriorities}
              pendings={pendings}
              collaborators={collaboratorOptions}
              confirmFinalizeOpen={confirmFinalizeOpen}
              onSetConfirmFinalizeOpen={setConfirmFinalizeOpen}
              onUpdateChallenge={updateCurrentChallenge}
              onUpdateHistoryChallengeStatus={updateDailyChallengeStatus}
              onUpdateMinutesNote={updateMinutesExecutiveNote}
              onUpdateCommitmentStatus={updateDailyCommitmentStatus}
              onOpenDecisionModal={() => setDecisionModalOpen(true)}
              onAddCommitment={addDailyCommitment}
              onSaveDraft={handleSaveAndSync}
              onConfirmFinalize={handleFinalizeAndSync}
              onOpenDocument={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                const patch = buildMeetingSyncPatch();
                if (patch) {
                  onOpenOfficialDocument(patch);
                }
              }}
            />
          )}
        </div>
      )}
    </PresentationLayout>
  );
};
