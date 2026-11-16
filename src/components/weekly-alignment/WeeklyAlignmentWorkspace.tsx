import React, { useCallback, useEffect, useRef } from 'react';
import { ArrowUpRight, LayoutGrid, X } from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import { useWeeklyAlignment } from '../../hooks/useWeeklyAlignment';
import type { MeetingRecord } from '../../types/ops';
import {
  WEEKLY_ALIGNMENT_STAGES,
  type WeeklyStageId,
} from '../../types/weeklyAlignment';
import { DecisionEditor, ExtraCommitmentModal } from './DecisionEditor';
import { PresentationHeader } from './PresentationHeader';
import { PresentationLayout } from './PresentationLayout';
import { PresentationNavigation } from './PresentationNavigation';
import { PriorityEditorDrawer } from './PriorityEditorDrawer';
import { TicketDetailsDrawer } from './TicketDetailsDrawer';
import { Stage1Opening } from './stages/Stage1Opening';
import { Stage2Indicators } from './stages/Stage2Indicators';
import { Stage3PrioritiesGoals } from './stages/Stage3PrioritiesGoals';
import { Stage4MacroAreas } from './stages/Stage4MacroAreas';
import { Stage5ProjectsGmud } from './stages/Stage5ProjectsGmud';
import { Stage6Commitments } from './stages/Stage6Commitments';
import { Stage7Closing } from './stages/Stage7Closing';
import { LoadingSkeletonGrid, UnavailableState } from '../common/UiPrimitives';

export const WeeklyAlignmentWorkspace: React.FC<{
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
    launchGmud042,
  } = useOps();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const alignment = useWeeklyAlignment(meeting.id, meeting.title, meeting.date);
  const {
    currentStage,
    setCurrentStage,
    freeMode,
    setFreeMode,
    elapsedSeconds,
    initialLoading,
    initialError,
    draft,
    externalSnapshot,
    collaboratorOptions,
    eligibleBacklogCount,
    indicatorDrawerItem,
    setIndicatorDrawerItem,
    priorityEditorTarget,
    setPriorityEditorTarget,
    decisionModalOpen,
    setDecisionModalOpen,
    commitmentModalOpen,
    setCommitmentModalOpen,
    confirmFinalizeOpen,
    setConfirmFinalizeOpen,
    toggleParticipantPresence,
    updateOpeningObservation,
    updateRecurrentBlockerStatus,
    openPriorityEditor,
    savePriority,
    removePriority,
    reorderPriority,
    updateWeeklyGoal,
    updateMacroArea,
    addMacroDeliverable,
    toggleMacroDeliverable,
    removeMacroDeliverable,
    addMacroPending,
    toggleMacroPending,
    addProjectReferral,
    addDecision,
    addExtraCommitment,
    consolidatedCommitments,
    updateCommitmentSituation,
    updateExtraCommitment,
    saveDraftSession,
    finalizeAlignment,
  } = alignment;

  const buildMeetingSyncPatch = useCallback((): Partial<MeetingRecord> | undefined => {
    if (!draft) return undefined;
    return {
      status: draft.status === 'Finalizado' ? 'Finalizada' : 'Em andamento',
      participants: draft.participants.filter((p) => p.present).map((p) => p.name),
      contextSummary: draft.openingObservation || meeting.contextSummary,
      decisions: draft.decisions.map((d) => ({
        id: d.id,
        decision: d.decision,
        owner: d.ownerName,
        dueDate: d.dueDate,
      })),
      commitments: consolidatedCommitments.map((c) => ({
        id: c.key,
        party: c.ownerName === 'Gestor de TI' ? 'Gestor' : c.origin === 'Meta Semanal' ? 'Equipe' : 'Colaborador',
        owner: c.ownerName,
        action: `${c.origin}: ${c.commitment}`,
        dueDate: c.dueDate,
        status: c.status,
      })),
      nextSteps: [
        ...draft.priorities.map((p) => `P${p.order} #${p.ticketId} (${p.primaryOwnerName}): ${p.nextAction}`),
        `Meta semanal: reduzir backlog em ${draft.weeklyGoal.reductionPercent}% (${draft.weeklyGoal.targetCount} chamados)`,
      ],
    };
  }, [draft, consolidatedCommitments, meeting.contextSummary]);

  const handleSaveAndSync = useCallback(async () => {
    await saveDraftSession();
    const patch = buildMeetingSyncPatch();
    if (patch && onSyncToMeetingList) {
      onSyncToMeetingList(meeting.id, patch);
    }
  }, [saveDraftSession, buildMeetingSyncPatch, onSyncToMeetingList, meeting.id]);

  const handleFinalizeAndSync = useCallback(async () => {
    await finalizeAlignment();
    const patch = buildMeetingSyncPatch();
    if (patch && onSyncToMeetingList) {
      onSyncToMeetingList(meeting.id, { ...patch, status: 'Finalizada' });
    }
  }, [finalizeAlignment, buildMeetingSyncPatch, onSyncToMeetingList, meeting.id]);

  // Navegação segura por teclado (ArrowLeft/ArrowRight ignorados em inputs e overlays)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      if (
        indicatorDrawerItem ||
        priorityEditorTarget ||
        decisionModalOpen ||
        commitmentModalOpen ||
        confirmFinalizeOpen
      ) {
        return;
      }
      if (e.key === 'ArrowRight' && currentStage < 7) {
        setFreeMode(false);
        setCurrentStage((prev) => (prev < 7 ? ((prev + 1) as WeeklyStageId) : prev));
      } else if (e.key === 'ArrowLeft' && currentStage > 1) {
        setFreeMode(false);
        setCurrentStage((prev) => (prev > 1 ? ((prev - 1) as WeeklyStageId) : prev));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentStage,
    setCurrentStage,
    setFreeMode,
    indicatorDrawerItem,
    priorityEditorTarget,
    decisionModalOpen,
    commitmentModalOpen,
    confirmFinalizeOpen,
  ]);

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1117] p-6">
        <div className="w-full max-w-3xl">
          <LoadingSkeletonGrid rows={5} />
        </div>
      </div>
    );
  }

  if (initialError || !draft) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1117] p-6">
        <div className="w-full max-w-xl">
          <UnavailableState
            title="Alinhamento Semanal indisponível"
            description={initialError || 'Não foi possível preparar a sessão interativa.'}
            onRetry={triggerRefresh}
            onConfigure={() => setActiveModule('configuracoes')}
          />
        </div>
      </div>
    );
  }

  const stageMeta =
    WEEKLY_ALIGNMENT_STAGES.find((s) => s.id === currentStage) ||
    WEEKLY_ALIGNMENT_STAGES[0];

  const handleSelectPriorityFromDrawer = (ticket: typeof externalSnapshot.tickets[number]) => {
    setIndicatorDrawerItem(null);
    setFreeMode(false);
    setCurrentStage(4);
    openPriorityEditor(ticket);
  };

  const getStageSummaryBadge = (stageId: WeeklyStageId): string => {
    switch (stageId) {
      case 1:
        return `${draft.participants.filter((p) => p.present).length}/${draft.participants.length} presentes`;
      case 2:
        return `${externalSnapshot.indicators.filter((i) => i.available).length}/8 indicadores`;
      case 3:
        return `${
          draft.macroAreas.filter(
            (m) => m.primaryOwnerId && m.primaryOwnerName && m.primaryOwnerName !== 'Não definido'
          ).length
        }/4 macroáreas`;
      case 4:
        return `${draft.priorities.length}/5 prioridades · Meta -${draft.weeklyGoal.reductionPercent}%`;
      case 5:
        return `${draft.projectsGmud.length} item(ns)`;
      case 6:
        return `${consolidatedCommitments.length} acordo(s)`;
      case 7:
        return draft.status;
    }
  };

  const overlays = (
    <>
      <TicketDetailsDrawer
        indicator={indicatorDrawerItem}
        tickets={externalSnapshot.tickets}
        concludedTickets={externalSnapshot.concludedTickets}
        fetchedAt={externalSnapshot.fetchedAt}
        onClose={() => setIndicatorDrawerItem(null)}
        onPrioritizeFromDrawer={handleSelectPriorityFromDrawer}
      />

      <PriorityEditorDrawer
        target={priorityEditorTarget}
        collaborators={collaboratorOptions}
        onClose={() => setPriorityEditorTarget(null)}
        onSave={savePriority}
      />

      <DecisionEditor
        open={decisionModalOpen}
        currentStage={currentStage}
        collaborators={collaboratorOptions}
        onClose={() => setDecisionModalOpen(false)}
        onSaveDecision={addDecision}
      />

      <ExtraCommitmentModal
        open={commitmentModalOpen}
        collaborators={collaboratorOptions}
        onClose={() => setCommitmentModalOpen(false)}
        onSaveCommitment={addExtraCommitment}
      />

      {/* Toasts dentro do containerRef para permanecerem visíveis durante Fullscreen API */}
      {toasts.length > 0 && (
        <div className="no-print fixed bottom-16 right-4 z-[60] flex w-80 flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-start justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 shadow-lg text-xs"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {toast.title}
                </div>
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

  return (
    <PresentationLayout
      containerRef={containerRef}
      header={
        <PresentationHeader
          weekLabel={draft.weekLabel}
          currentStage={currentStage}
          elapsedSeconds={elapsedSeconds}
          lastIndicatorSync={externalSnapshot.fetchedAt}
          hasUnsavedChanges={draft.hasUnsavedChanges}
          lastSavedAt={draft.lastSavedAt}
          status={draft.status}
          theme={theme}
          onToggleTheme={toggleTheme}
          fullscreenTargetRef={containerRef}
          onOpenDecision={() => setDecisionModalOpen(true)}
          onOpenCommitment={() => setCommitmentModalOpen(true)}
          onSaveDraft={handleSaveAndSync}
          onExit={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
            onExit(buildMeetingSyncPatch());
          }}
        />
      }
      navigation={
        <PresentationNavigation
          currentStage={currentStage}
          freeMode={freeMode}
          onPrev={() => {
            setFreeMode(false);
            setCurrentStage((prev) => (prev > 1 ? ((prev - 1) as WeeklyStageId) : prev));
          }}
          onNext={() => {
            setFreeMode(false);
            setCurrentStage((prev) => (prev < 7 ? ((prev + 1) as WeeklyStageId) : prev));
          }}
          onSelectStage={(stage) => {
            setFreeMode(false);
            setCurrentStage(stage);
          }}
          onToggleFreeMode={() => setFreeMode((prev) => !prev)}
        />
      }
      overlays={overlays}
    >
      {freeMode ? (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Modo Livre — Painel Geral do Alinhamento
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Salte diretamente para qualquer uma das 7 etapas sem perder edições nem reiniciar a apresentação.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFreeMode(false)}
              className="rounded-md bg-[#0F5E59] dark:bg-[#14B8A6] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950"
            >
              Retomar Etapa {currentStage}/7
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {WEEKLY_ALIGNMENT_STAGES.map((st) => {
              const isCurrent = st.id === currentStage;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setCurrentStage(st.id);
                    setFreeMode(false);
                  }}
                  className={`flex flex-col justify-between rounded-lg border p-4 text-left transition-colors ${
                    isCurrent
                      ? 'border-[#0F5E59] dark:border-[#2DD4BF] bg-[#0F5E59]/[0.05] dark:bg-[#2DD4BF]/[0.06]'
                      : 'border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] hover:border-[#0F5E59]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-[#0F5E59] dark:text-[#2DD4BF]">
                      <span>ETAPA {st.id}/7</span>
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
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Título compacto da Etapa */}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {stageMeta.title}
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stageMeta.subtitle}
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
              {getStageSummaryBadge(currentStage)}
            </span>
          </div>

          {currentStage === 1 && (
            <Stage1Opening
              draft={draft}
              onToggleParticipant={toggleParticipantPresence}
              onUpdateObservation={updateOpeningObservation}
              onUpdateBlockerStatus={updateRecurrentBlockerStatus}
              onOpenDecisionModal={() => setDecisionModalOpen(true)}
            />
          )}

          {currentStage === 2 && (
            <Stage2Indicators
              snapshot={externalSnapshot}
              onSelectIndicator={(ind) => setIndicatorDrawerItem(ind)}
            />
          )}

          {currentStage === 3 && (
            <Stage4MacroAreas
              macroAreas={draft.macroAreas}
              collaborators={collaboratorOptions}
              onUpdateArea={updateMacroArea}
              onAddDeliverable={addMacroDeliverable}
              onToggleDeliverable={toggleMacroDeliverable}
              onRemoveDeliverable={removeMacroDeliverable}
              onAddPending={addMacroPending}
              onTogglePending={toggleMacroPending}
            />
          )}

          {currentStage === 4 && (
            <Stage3PrioritiesGoals
              tickets={externalSnapshot.tickets}
              priorities={draft.priorities}
              weeklyGoal={draft.weeklyGoal}
              eligibleBacklogCount={eligibleBacklogCount}
              collaborators={collaboratorOptions}
              onPrioritizeTicket={openPriorityEditor}
              onEditPriority={(pri) => {
                const ticket = externalSnapshot.tickets.find((t) => t.id === pri.ticketId) || {
                  id: pri.ticketId,
                  title: pri.ticketTitle,
                  status: pri.ticketStatus,
                  techName: pri.currentTech,
                  group: pri.macroArea,
                  category: pri.macroArea,
                  macroArea: pri.macroArea,
                  lastUpdatedAt: pri.ticketLastUpdated,
                  hoursWithoutUpdate: 0,
                  inclusionReasons: [],
                  classificationReason: 'Prioridade da carteira semanal',
                  isPopNonCompliant: false,
                  slaRisk: 'normal',
                };
                openPriorityEditor(ticket);
              }}
              onRemovePriority={removePriority}
              onReorderPriority={reorderPriority}
              onUpdateGoal={updateWeeklyGoal}
            />
          )}

          {currentStage === 5 && (
            <Stage5ProjectsGmud
              projects={draft.projectsGmud}
              onAddReferral={addProjectReferral}
              onOpenGmud042={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                const patch = buildMeetingSyncPatch();
                if (patch && onSyncToMeetingList) {
                  onSyncToMeetingList(meeting.id, patch);
                }
                launchGmud042();
              }}
            />
          )}

          {currentStage === 6 && (
            <Stage6Commitments
              rows={consolidatedCommitments}
              onChangeStatus={updateCommitmentSituation}
              onEditExtraCommitment={updateExtraCommitment}
              onJumpToStage={(stage) => {
                setFreeMode(false);
                setCurrentStage(stage);
              }}
              onOpenAddCommitment={() => setCommitmentModalOpen(true)}
            />
          )}

          {currentStage === 7 && (
            <Stage7Closing
              draft={draft}
              consolidatedCommitments={consolidatedCommitments}
              confirmFinalizeOpen={confirmFinalizeOpen}
              onSetConfirmFinalizeOpen={setConfirmFinalizeOpen}
              onGoToStage={(stage) => {
                setFreeMode(false);
                setCurrentStage(stage);
              }}
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
