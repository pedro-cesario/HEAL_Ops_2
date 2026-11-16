import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOps } from '../context/OpsContext';
import { createDemoDailyAlignmentDraft } from '../demo/dailyAlignmentDemo';
import {
  loadDailyDraftFromStorage,
  saveDailyDraftToStorage,
} from '../services/sessionStorage';
import type {
  DailyAlignmentDraft,
  DailyCriticalQueueItemState,
  DailyMacroReport,
  DailyOperationalChallenge,
  DailyStageId,
} from '../types/dailyAlignment';
import type { ManagementPending, TicketItem } from '../types/ops';
import type { CommitmentSituation } from '../types/weeklyAlignment';

export function useDailyAlignment(
  meetingId: string,
  meetingTitle: string,
  meetingDate: string
) {
  const {
    dataMode,
    sessionEpoch,
    teamMembers,
    weeklyPriorities,
    weeklyBaseline,
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
    computedTickets,
    computedKpis,
    pendings,
    addPending,
    updatePending,
    endpointConfig,
    pushToast,
  } = useOps();

  const [currentStage, setCurrentStage] = useState<DailyStageId>(1);
  const [freeMode, setFreeMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  const [draft, setDraft] = useState<DailyAlignmentDraft | null>(null);
  const [initialError, setInitialError] = useState<string | undefined>();
  const [initialLoading, setInitialLoading] = useState(true);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (dataMode === 'disconnected') {
      setDraft(null);
      setInitialError(
        'Backend principal FastAPI (:3312) desconectado. Ative o Modo Demonstração para conduzir a Daily.'
      );
      setInitialLoading(false);
      return;
    }
    if (dataMode === 'unavailable') {
      setDraft(null);
      setInitialError('Serviço de reuniões temporariamente indisponível.');
      setInitialLoading(false);
      return;
    }

    const cacheKey = `${meetingId}:${sessionEpoch}`;
    if (loadedRef.current === cacheKey && draft !== null) return;

    const stored = loadDailyDraftFromStorage(meetingId);
    const resolved =
      stored ||
      createDemoDailyAlignmentDraft(
        meetingId,
        meetingTitle,
        meetingDate,
        teamMembers,
        macroAreasConfig,
        weeklyPriorities
      );

    setDraft({
      ...resolved,
      criticalQueueStates: {
        ...dailyCriticalQueueStates,
        ...(resolved.criticalQueueStates || {}),
      },
    });
    loadedRef.current = cacheKey;
    setInitialError(undefined);
    setInitialLoading(false);
  }, [
    meetingId,
    meetingTitle,
    meetingDate,
    dataMode,
    sessionEpoch,
    teamMembers,
    macroAreasConfig,
    weeklyPriorities,
    dailyCriticalQueueStates,
    draft,
  ]);

  // Synchronize newly activated/renamed macroareas from Settings seamlessly into live Daily session
  useEffect(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      const activeConfigs = macroAreasConfig.filter((mc) => mc.active);
      const existingById = new Map(prev.macroReports.map((mr) => [mr.id, mr]));
      const nextReports: DailyMacroReport[] = activeConfigs.map((mc, idx) => {
        const expectedId = `mr-${mc.id}`;
        const existing =
          existingById.get(expectedId) ||
          prev.macroReports.find(
            (mr) => mr.macroArea.toLowerCase() === mc.name.toLowerCase()
          );
        if (existing) {
          return {
            ...existing,
            id: expectedId,
            macroArea: mc.name,
            leadName: existing.leadName || mc.defaultLeadName,
          };
        }
        return {
          id: expectedId,
          macroArea: mc.name,
          leadName: mc.defaultLeadName,
          situation: 'Normal',
          summary: 'Acompanhamento operacional em curso na frente.',
          weeklyPriorityId: weeklyPriorities[idx % Math.max(1, weeklyPriorities.length)]?.id || '',
          blocker: '',
          nextAction: 'Revisar chamados da frente antes das 16h.',
        };
      });

      const unchanged =
        nextReports.length === prev.macroReports.length &&
        nextReports.every(
          (r, i) =>
            r.id === prev.macroReports[i]?.id &&
            r.macroArea === prev.macroReports[i]?.macroArea
        );
      if (unchanged) return prev;
      return { ...prev, macroReports: nextReports };
    });
  }, [macroAreasConfig, weeklyPriorities]);

  const collaboratorOptions = useMemo(
    () => [
      { id: 'gestor', name: 'Gestor de TI', role: 'Coordenação Operacional', macroArea: 'Gestão' },
      ...teamMembers.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        macroArea: m.macroArea,
      })),
    ],
    [teamMembers]
  );

  // Header modal: Check-in / participantes
  const toggleParticipantPresence = useCallback((participantId: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            hasUnsavedChanges: true,
            participants: prev.participants.map((p) =>
              p.id === participantId ? { ...p, present: !p.present } : p
            ),
          }
        : prev
    );
  }, []);

  const updateShiftHandoverNote = useCallback((text: string) => {
    setDraft((prev) =>
      prev ? { ...prev, shiftHandoverNote: text, hasUnsavedChanges: true } : prev
    );
  }, []);

  // Stage 2: Parecer das Macroáreas (prioridade estritamente vinculada ao TPL-02)
  const updateMacroReport = useCallback(
    (reportId: string, patch: Partial<DailyMacroReport>) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          macroReports: prev.macroReports.map((mr) =>
            mr.id === reportId ? { ...mr, ...patch } : mr
          ),
        };
      });
    },
    []
  );

  // Stage 3: Fila Crítica (continuidade entre Dailys via OpsContext)
  const updateCriticalItemState = useCallback(
    (itemKey: string, patch: Partial<DailyCriticalQueueItemState>) => {
      upsertDailyCriticalState(itemKey, patch);
      setDraft((prev) => {
        if (!prev) return prev;
        const current = prev.criticalQueueStates[itemKey] || {
          itemKey,
          ownerName: '',
          nextAction: '',
          dueDate: 'Hoje',
          blockerNote: '',
          treatedInDaily: false,
        };
        return {
          ...prev,
          hasUnsavedChanges: true,
          criticalQueueStates: {
            ...prev.criticalQueueStates,
            [itemKey]: { ...current, ...patch, itemKey },
          },
        };
      });
    },
    [upsertDailyCriticalState]
  );

  const toggleCriticalItemTreated = useCallback(
    (itemKey: string) => {
      toggleDailyCriticalTreated(itemKey);
      const today = new Date().toLocaleDateString('pt-BR');
      setDraft((prev) => {
        if (!prev) return prev;
        const current = prev.criticalQueueStates[itemKey] || {
          itemKey,
          ownerName: '',
          nextAction: '',
          dueDate: 'Hoje',
          blockerNote: '',
          treatedInDaily: false,
        };
        const nextTreated = !current.treatedInDaily;
        return {
          ...prev,
          hasUnsavedChanges: true,
          criticalQueueStates: {
            ...prev.criticalQueueStates,
            [itemKey]: {
              ...current,
              treatedInDaily: nextTreated,
              lastTreatedDate: nextTreated ? today : current.lastTreatedDate,
            },
          },
        };
      });
    },
    [toggleDailyCriticalTreated]
  );

  const escalateTicketToPending = useCallback(
    (ticket: TicketItem) => {
      const existing = pendings.find((p) => p.ticketId === ticket.id && p.status !== 'Resolvida');
      if (existing) {
        pushToast({
          title: `Chamado #${ticket.id} já possui pendência ativa`,
          description: `Responsável atual: ${existing.owner} (${existing.status}).`,
          tone: 'info',
        });
        return;
      }

      const itemKey = `ticket-${ticket.id}`;
      const state = dailyCriticalQueueStates[itemKey] || draft?.criticalQueueStates[itemKey];
      const owner = state?.ownerName || ticket.techName || 'Gestão Operacional';
      const created = addPending({
        origin: 'GLPI',
        ticketId: ticket.id,
        description: `[Daily ${draft?.date || 'Hoje'}] ${ticket.title}`,
        owner,
        criticality: ticket.isPopNonCompliant ? 'Crítica' : 'Alta',
        dueDate: state?.dueDate || 'Hoje · 16:00',
        status: 'Aberta',
        nextAction:
          state?.nextAction ||
          (ticket.isPopNonCompliant
            ? 'Atribuir técnico nominal imediatamente conforme POP'
            : 'Registrar atualização técnica no GLPI'),
      });

      updateCriticalItemState(itemKey, {
        ticketId: ticket.id,
        pendingId: created.id,
        ownerName: owner,
        treatedInDaily: true,
      });

      pushToast({
        title: `Pendência criada para #${ticket.id}`,
        description: 'Propagada em tempo real para o módulo Pendências e Auditoria (sessão local).',
        tone: 'success',
      });
    },
    [pendings, dailyCriticalQueueStates, draft, addPending, updateCriticalItemState, pushToast]
  );

  const updatePortalPendingStatus = useCallback(
    (pendingId: string, status: ManagementPending['status']) => {
      updatePending(pendingId, { status });
      pushToast({
        title: 'Situação da pendência atualizada',
        description: `Status alterado para "${status}" em Pendências e Auditoria.`,
        tone: 'success',
      });
    },
    [updatePending, pushToast]
  );

  // Stage 4: Desafio do Dia & Ata
  const updateCurrentChallenge = useCallback(
    (patch: Partial<DailyOperationalChallenge>) => {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              hasUnsavedChanges: true,
              currentChallenge: { ...prev.currentChallenge, ...patch },
            }
          : prev
      );
    },
    []
  );

  const updateMinutesExecutiveNote = useCallback((note: string) => {
    setDraft((prev) =>
      prev ? { ...prev, minutesExecutiveNote: note, hasUnsavedChanges: true } : prev
    );
  }, []);

  const addDailyDecision = useCallback(
    (decision: string, ownerName: string, dueDate: string, stage?: DailyStageId) => {
      if (!decision.trim()) return;
      const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          decisions: [
            ...prev.decisions,
            {
              id: `dd-${Date.now()}`,
              stage: stage ?? currentStage,
              decision: decision.trim(),
              ownerName: ownerName.trim() || 'Gestor de TI',
              dueDate: dueDate.trim() || 'Hoje',
              createdAt: now,
            },
          ],
        };
      });
      pushToast({
        title: 'Decisão registrada na Daily',
        description: 'Consolidada na Etapa 4 (Ata) e no documento do turno.',
        tone: 'success',
      });
    },
    [currentStage, pushToast]
  );

  const addDailyCommitment = useCallback(
    (ownerName: string, action: string, dueDate: string) => {
      if (!action.trim()) return;
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          commitments: [
            ...prev.commitments,
            {
              id: `dc-${Date.now()}`,
              ownerName: ownerName.trim() || 'Equipe Operacional',
              action: action.trim(),
              dueDate: dueDate.trim() || 'Hoje',
              status: 'Pendente',
            },
          ],
        };
      });
      pushToast({
        title: 'Ação / compromisso adicionado à Daily',
        tone: 'success',
      });
    },
    [pushToast]
  );

  const updateDailyCommitmentStatus = useCallback(
    (commitmentId: string, status: CommitmentSituation) => {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              hasUnsavedChanges: true,
              commitments: prev.commitments.map((c) =>
                c.id === commitmentId ? { ...c, status } : c
              ),
            }
          : prev
      );
    },
    []
  );

  const createQuickPending = useCallback(
    (payload: {
      description: string;
      owner: string;
      criticality: ManagementPending['criticality'];
      dueDate: string;
      nextAction: string;
    }) => {
      addPending({
        origin: 'GLPI',
        description: payload.description,
        owner: payload.owner,
        criticality: payload.criticality,
        dueDate: payload.dueDate || 'Hoje',
        status: 'Aberta',
        nextAction: payload.nextAction || 'Tratar bloqueio apontado na Daily',
      });
      setPendingModalOpen(false);
      pushToast({
        title: 'Pendência registrada na sessão',
        description: 'Disponível imediatamente no módulo Pendências e Auditoria.',
        tone: 'success',
      });
    },
    [addPending, pushToast]
  );

  const saveDraftSession = useCallback(() => {
    if (!draft) return;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nextDraft: DailyAlignmentDraft = {
      ...draft,
      hasUnsavedChanges: false,
      lastSavedAt: now,
    };
    setDraft(nextDraft);
    saveDailyDraftToStorage(draft.meetingId, nextDraft);
    upsertDailyChallenge(nextDraft.currentChallenge);
    pushToast({
      title: `Daily salva às ${now} (localStorage)`,
      description: 'Alterações preservadas na sessão local. Persistência definitiva aguarda FastAPI (:3312).',
      tone: 'success',
    });
  }, [draft, upsertDailyChallenge, pushToast]);

  const finalizeDaily = useCallback(() => {
    if (!draft) return;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nextDraft: DailyAlignmentDraft = {
      ...draft,
      status: 'Finalizado',
      hasUnsavedChanges: false,
      lastSavedAt: now,
      finalizedAt: now,
    };
    setDraft(nextDraft);
    saveDailyDraftToStorage(draft.meetingId, nextDraft);
    upsertDailyChallenge(nextDraft.currentChallenge);
    setConfirmFinalizeOpen(false);
    pushToast({
      title: `Daily Operacional finalizada (${now})`,
      description:
        'Ata de turno consolidada; pendências da Fila Crítica não marcadas como tratadas permanecem ativas.',
      tone: 'success',
    });
  }, [draft, upsertDailyChallenge, pushToast]);

  return {
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
  };
}
