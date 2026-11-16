import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOps } from '../context/OpsContext';
import {
  WeeklyAlignmentAdapter,
  type ExternalWeeklyOpsSnapshot,
} from '../services/weeklyAlignmentAdapter';
import type { TeamMember, TicketItem } from '../types/ops';
import type {
  AlignmentPriorityItem,
  CommitmentSituation,
  ConsolidatedCommitmentRow,
  MacroAreaId,
  WeeklyAlignmentDraft,
  WeeklyGoalDraft,
  WeeklyIndicatorCardData,
  WeeklyStageId,
} from '../types/weeklyAlignment';

export interface PriorityEditorTarget {
  mode: 'create' | 'edit';
  ticket: TicketItem;
  existingPriority?: AlignmentPriorityItem;
}

export function useWeeklyAlignment(
  meetingId: string,
  meetingTitle: string,
  meetingDate: string
) {
  const {
    dataMode,
    refreshTrigger,
    endpointConfig,
    pushToast,
    sessionEpoch,
    teamMembers,
    updateWeeklyPriorities,
    updateWeeklyBaseline,
  } = useOps();

  // 1. ESTADO DE NAVEGAÇÃO (imune a atualização automática)
  const [currentStage, setCurrentStage] = useState<WeeklyStageId>(1);
  const [freeMode, setFreeMode] = useState(false);

  // 2. ESTADO DE EDIÇÃO & OVERLAYS (imune a atualização automática)
  const [indicatorDrawerItem, setIndicatorDrawerItem] = useState<WeeklyIndicatorCardData | null>(null);
  const [priorityEditorTarget, setPriorityEditorTarget] = useState<PriorityEditorTarget | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  // 3. ESTADO DA REUNIÃO (carregado uma única vez por reunião; nunca reiniciado por polling)
  const [draft, setDraft] = useState<WeeklyAlignmentDraft | null>(null);
  const [initialError, setInitialError] = useState<string | undefined>();
  const [initialLoading, setInitialLoading] = useState(true);
  const loadedMeetingRef = useRef<string | null>(null);

  // 4. DADOS EXTERNOS & COLABORADORES (atualização silenciosa em segundo plano)
  const [externalSnapshot, setExternalSnapshot] = useState<ExternalWeeklyOpsSnapshot>({
    available: true,
    fetchedAt: '—',
    indicators: [],
    tickets: [],
    concludedTickets: [],
    evolution: [],
  });
  const [collaborators, setCollaborators] = useState<TeamMember[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Cronômetro passivo da duração da reunião
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Carga inicial do rascunho da reunião (apenas ao trocar meetingId ou se base demo for restaurada)
  useEffect(() => {
    let active = true;
    const cacheKey = `${meetingId}:${sessionEpoch}`;
    const isSameMeeting = loadedMeetingRef.current === cacheKey && draft !== null;
    if (isSameMeeting) return;

    setInitialLoading(true);
    setInitialError(undefined);

    WeeklyAlignmentAdapter.loadAlignmentDraft(
      dataMode,
      meetingId,
      meetingTitle,
      meetingDate,
      16
    ).then((res) => {
      if (!active) return;
      if (res.errorMessage || !res.draft) {
        setInitialError(res.errorMessage || 'Não foi possível carregar o Alinhamento Semanal.');
        setDraft(null);
      } else {
        setDraft(res.draft);
        loadedMeetingRef.current = cacheKey;
      }
      setInitialLoading(false);
    });

    return () => {
      active = false;
    };
  }, [meetingId, meetingTitle, meetingDate, dataMode, sessionEpoch, draft]);

  // Atualização silenciosa de indicadores, chamados e colaboradores
  // NUNCA dispara setInitialLoading, NUNCA altera currentStage, drawers ou rascunho
  useEffect(() => {
    let active = true;

    WeeklyAlignmentAdapter.fetchExternalSnapshot(dataMode, endpointConfig).then((snapshot) => {
      if (!active) return;
      setExternalSnapshot(snapshot);
      setCollaborators(teamMembers);

      // Recalcula quantidade-alvo da meta silenciosamente se backlog elegível mudar
      const eligibleCount = snapshot.tickets.filter(
        (t) => t.status !== 'Fechado' && t.status !== 'Solucionado'
      ).length;
      if (eligibleCount > 0) {
        setDraft((prev) => {
          if (!prev) return prev;
          const nextTarget = Math.max(
            0,
            Math.round(eligibleCount * (prev.weeklyGoal.reductionPercent / 100))
          );
          if (nextTarget === prev.weeklyGoal.targetCount) return prev;
          return {
            ...prev,
            weeklyGoal: {
              ...prev.weeklyGoal,
              targetCount: nextTarget,
            },
          };
        });
      }
    });

    return () => {
      active = false;
    };
  }, [dataMode, refreshTrigger, endpointConfig, teamMembers]);

  // Lista dinâmica de opções de colaboradores (sem nomes hardcoded)
  const collaboratorOptions = useMemo(() => {
    const base = collaborators.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      macroArea: m.macroArea,
    }));
    const hasGestor = base.some((c) => c.id === 'gestor');
    if (!hasGestor && collaborators.length > 0) {
      base.unshift({
        id: 'gestor',
        name: 'Gestor de TI',
        role: 'Coordenação Operacional',
        macroArea: 'Gestão',
      });
    }
    return base;
  }, [collaborators]);

  // Mutações isoladas da Etapa 1
  const toggleParticipantPresence = useCallback((participantId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, present: !p.present } : p
        ),
      };
    });
  }, []);

  const updateOpeningObservation = useCallback((text: string) => {
    setDraft((prev) =>
      prev ? { ...prev, openingObservation: text, hasUnsavedChanges: true } : prev
    );
  }, []);

  const updateRecurrentBlockerStatus = useCallback(
    (blockerId: string, status: 'Em aberto' | 'Encaminhado' | 'Tratado', note?: string) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          recurrentBlockers: prev.recurrentBlockers.map((rb) =>
            rb.id === blockerId ? { ...rb, status, note: note ?? rb.note } : rb
          ),
        };
      });
    },
    []
  );

  // Mutações da Etapa 4 (Prioridades X/5 e Meta Semanal)
  const eligibleBacklogCount = useMemo(
    () =>
      externalSnapshot.tickets.filter(
        (t) => t.status !== 'Fechado' && t.status !== 'Solucionado'
      ).length || 16,
    [externalSnapshot.tickets]
  );

  const openPriorityEditor = useCallback(
    (ticket: TicketItem) => {
      if (!draft) return;
      const existing = draft.priorities.find((p) => p.ticketId === ticket.id);
      if (existing) {
        setPriorityEditorTarget({ mode: 'edit', ticket, existingPriority: existing });
        return;
      }
      if (ticket.status === 'Fechado' || ticket.status === 'Solucionado') {
        pushToast({
          title: 'Chamado encerrado não pode ser priorizado',
          description: `O chamado #${ticket.id} está com status "${ticket.status}".`,
          tone: 'warning',
        });
        return;
      }
      if (draft.priorities.length >= 5) {
        pushToast({
          title: 'Limite semanal de 5 prioridades atingido',
          description: 'Remova ou substitua uma prioridade da carteira antes de adicionar a sexta.',
          tone: 'warning',
        });
        return;
      }
      setPriorityEditorTarget({ mode: 'create', ticket });
    },
    [draft, pushToast]
  );

  const savePriority = useCallback(
    (payload: {
      ticket: TicketItem;
      primaryOwnerId: string;
      primaryOwnerName: string;
      supportTechId: string;
      supportTechName: string;
      macroArea: string;
      dueDate: string;
      nextAction: string;
      justification: string;
    }) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const existingIndex = prev.priorities.findIndex(
          (p) => p.ticketId === payload.ticket.id
        );
        if (existingIndex >= 0) {
          const updated = [...prev.priorities];
          updated[existingIndex] = {
            ...updated[existingIndex],
            macroArea: payload.macroArea,
            primaryOwnerId: payload.primaryOwnerId,
            primaryOwnerName: payload.primaryOwnerName,
            supportTechId: payload.supportTechId,
            supportTechName: payload.supportTechName,
            dueDate: payload.dueDate,
            nextAction: payload.nextAction,
            justification: payload.justification,
          };
          return { ...prev, priorities: updated, hasUnsavedChanges: true };
        }
        if (prev.priorities.length >= 5) return prev;
        const newItem: AlignmentPriorityItem = {
          id: `alpri-${Date.now()}`,
          ticketId: payload.ticket.id,
          ticketTitle: payload.ticket.title,
          ticketStatus: payload.ticket.status,
          ticketLastUpdated: payload.ticket.lastUpdatedAt,
          currentTech: payload.ticket.techName,
          macroArea: payload.macroArea,
          primaryOwnerId: payload.primaryOwnerId,
          primaryOwnerName: payload.primaryOwnerName,
          supportTechId: payload.supportTechId,
          supportTechName: payload.supportTechName,
          dueDate: payload.dueDate,
          nextAction: payload.nextAction,
          justification: payload.justification,
          order: prev.priorities.length + 1,
        };
        return {
          ...prev,
          priorities: [...prev.priorities, newItem],
          hasUnsavedChanges: true,
        };
      });
      setPriorityEditorTarget(null);
      pushToast({
        title: `Prioridade #${payload.ticket.id} atualizada na carteira`,
        description: `Responsável: ${payload.primaryOwnerName}${payload.supportTechName ? ` · Apoio: ${payload.supportTechName}` : ''}`,
        tone: 'success',
      });
    },
    [pushToast]
  );

  const removePriority = useCallback((priorityId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const remaining = prev.priorities
        .filter((p) => p.id !== priorityId)
        .map((p, idx) => ({ ...p, order: idx + 1 }));
      return { ...prev, priorities: remaining, hasUnsavedChanges: true };
    });
  }, []);

  const reorderPriority = useCallback((priorityId: string, direction: 'up' | 'down') => {
    setDraft((prev) => {
      if (!prev) return prev;
      const idx = prev.priorities.findIndex((p) => p.id === priorityId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.priorities.length) return prev;
      const list = [...prev.priorities];
      const [moved] = list.splice(idx, 1);
      list.splice(targetIdx, 0, moved);
      return {
        ...prev,
        hasUnsavedChanges: true,
        priorities: list.map((item, i) => ({ ...item, order: i + 1 })),
      };
    });
  }, []);

  const updateWeeklyGoal = useCallback(
    (patch: Partial<WeeklyGoalDraft>) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const nextPercent =
          patch.reductionPercent !== undefined
            ? Math.min(100, Math.max(0, patch.reductionPercent))
            : prev.weeklyGoal.reductionPercent;
        const recalculatedCount =
          patch.reductionPercent !== undefined
            ? Math.max(0, Math.round(eligibleBacklogCount * (nextPercent / 100)))
            : patch.targetCount ?? prev.weeklyGoal.targetCount;
        return {
          ...prev,
          hasUnsavedChanges: true,
          weeklyGoal: {
            ...prev.weeklyGoal,
            ...patch,
            reductionPercent: nextPercent,
            targetCount: recalculatedCount,
          },
        };
      });
    },
    [eligibleBacklogCount]
  );

  // Mutações da Etapa 3 (Macroáreas)
  const updateMacroArea = useCallback(
    (
      areaId: MacroAreaId,
      patch: Partial<{
        primaryOwnerId: string;
        primaryOwnerName: string;
        supportTechId: string;
        supportTechName: string;
        objective: string;
        dueDate: string;
      }>
    ) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          macroAreas: prev.macroAreas.map((m) =>
            m.id === areaId ? { ...m, ...patch } : m
          ),
        };
      });
    },
    []
  );

  const addMacroDeliverable = useCallback((areaId: MacroAreaId, text: string) => {
    if (!text.trim()) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        macroAreas: prev.macroAreas.map((m) =>
          m.id === areaId
            ? {
                ...m,
                deliverables: [
                  ...m.deliverables,
                  { id: `del-${Date.now()}`, text: text.trim(), done: false },
                ],
              }
            : m
        ),
      };
    });
  }, []);

  const toggleMacroDeliverable = useCallback((areaId: MacroAreaId, deliverableId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        macroAreas: prev.macroAreas.map((m) =>
          m.id === areaId
            ? {
                ...m,
                deliverables: m.deliverables.map((d) =>
                  d.id === deliverableId ? { ...d, done: !d.done } : d
                ),
              }
            : m
        ),
      };
    });
  }, []);

  const removeMacroDeliverable = useCallback((areaId: MacroAreaId, deliverableId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        macroAreas: prev.macroAreas.map((m) =>
          m.id === areaId
            ? { ...m, deliverables: m.deliverables.filter((d) => d.id !== deliverableId) }
            : m
        ),
      };
    });
  }, []);

  const addMacroPending = useCallback((areaId: MacroAreaId, text: string) => {
    if (!text.trim()) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        macroAreas: prev.macroAreas.map((m) =>
          m.id === areaId
            ? {
                ...m,
                pendings: [
                  ...m.pendings,
                  { id: `pen-${Date.now()}`, text: text.trim(), resolved: false },
                ],
              }
            : m
        ),
      };
    });
  }, []);

  const toggleMacroPending = useCallback((areaId: MacroAreaId, pendingId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        macroAreas: prev.macroAreas.map((m) =>
          m.id === areaId
            ? {
                ...m,
                pendings: m.pendings.map((p) =>
                  p.id === pendingId ? { ...p, resolved: !p.resolved } : p
                ),
              }
            : m
        ),
      };
    });
  }, []);

  // Mutações da Etapa 5 (Projetos e GMUD)
  const addProjectReferral = useCallback((projectId: string, text: string, ownerName: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasUnsavedChanges: true,
        projectsGmud: prev.projectsGmud.map((pg) =>
          pg.id === projectId
            ? {
                ...pg,
                referrals: [
                  ...pg.referrals,
                  {
                    id: `ref-${Date.now()}`,
                    text: text.trim(),
                    ownerName: ownerName.trim() || pg.ownerName,
                    createdAt: `Hoje · ${now}`,
                  },
                ],
              }
            : pg
        ),
      };
    });
  }, []);

  // Mutações de Decisões & Compromissos adicionais
  const addDecision = useCallback(
    (decision: string, ownerName: string, dueDate: string, stage?: WeeklyStageId) => {
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
              id: `dec-${Date.now()}`,
              stage: stage ?? currentStage,
              decision: decision.trim(),
              ownerName: ownerName.trim() || 'Gestor de TI',
              dueDate: dueDate.trim() || 'Esta semana',
              createdAt: now,
            },
          ],
        };
      });
      pushToast({
        title: 'Decisão registrada na reunião',
        description: 'Consolidada automaticamente na Etapa 6 e no resumo de encerramento.',
        tone: 'success',
      });
    },
    [currentStage, pushToast]
  );

  const addExtraCommitment = useCallback(
    (payload: {
      commitment: string;
      ownerId: string;
      ownerName: string;
      supportId: string;
      supportName: string;
      dueDate: string;
    }) => {
      if (!payload.commitment.trim()) return;
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          extraCommitments: [
            ...prev.extraCommitments,
            {
              id: `ext-${Date.now()}`,
              commitment: payload.commitment.trim(),
              ownerId: payload.ownerId,
              ownerName: payload.ownerName || 'Não definido',
              supportId: payload.supportId,
              supportName: payload.supportName,
              dueDate: payload.dueDate || '2026-11-20',
              status: 'Pendente',
            },
          ],
        };
      });
      pushToast({
        title: 'Compromisso adicionado',
        description: 'Incluído na matriz consolidada da Etapa 6.',
        tone: 'success',
      });
    },
    [pushToast]
  );

  // Consolidação reativa automática para Etapa 6 (ZERO duplicação!)
  const consolidatedCommitments = useMemo<ConsolidatedCommitmentRow[]>(() => {
    if (!draft) return [];
    const rows: ConsolidatedCommitmentRow[] = [];

    // 1. Prioridades da Etapa 4
    draft.priorities.forEach((p) => {
      const key = `priority:${p.id}`;
      rows.push({
        key,
        origin: 'Prioridade',
        originStage: 4,
        sourceRefId: p.id,
        commitment: `#${p.ticketId} — ${p.nextAction || p.ticketTitle}`,
        ownerName: p.primaryOwnerName || 'Não definido',
        supportName: p.supportTechName || '—',
        dueDate: p.dueDate || '—',
        status: draft.consolidatedStatusOverrides[key] || 'Em curso',
        editable: true,
      });
    });

    // 2. Meta Semanal da Etapa 4
    if (draft.weeklyGoal.reductionPercent > 0 || draft.weeklyGoal.note.trim()) {
      const key = 'goal:weekly';
      rows.push({
        key,
        origin: 'Meta Semanal',
        originStage: 4,
        sourceRefId: 'weeklyGoal',
        commitment: `Reduzir backlog em ${draft.weeklyGoal.reductionPercent}% (${draft.weeklyGoal.targetCount} chamado(s))`,
        ownerName: draft.weeklyGoal.ownerName || 'Não definido',
        supportName: 'Equipe TI',
        dueDate: draft.weeklyGoal.dueDate || '—',
        status: draft.consolidatedStatusOverrides[key] || 'Confirmado',
        editable: true,
      });
    }

    // 3. Entregas das Macroáreas (Etapa 3)
    draft.macroAreas.forEach((area) => {
      area.deliverables.forEach((del) => {
        const key = `macro:${area.id}:${del.id}`;
        const defaultStatus: CommitmentSituation = del.done ? 'Concluído' : 'Pendente';
        rows.push({
          key,
          origin: 'Macroárea',
          originStage: 3,
          sourceRefId: area.id,
          commitment: `[${area.name}] ${del.text}`,
          ownerName: area.primaryOwnerName || 'Não definido',
          supportName: area.supportTechName || '—',
          dueDate: area.dueDate || '—',
          status: draft.consolidatedStatusOverrides[key] || defaultStatus,
          editable: true,
        });
      });
    });

    // 4. Encaminhamentos de Projetos e GMUD (Etapa 5)
    draft.projectsGmud.forEach((pg) => {
      pg.referrals.forEach((refItem) => {
        const key = `gmud:${pg.id}:${refItem.id}`;
        rows.push({
          key,
          origin: 'Projeto/GMUD',
          originStage: 5,
          sourceRefId: pg.id,
          commitment: `[${pg.code}] ${refItem.text}`,
          ownerName: refItem.ownerName || pg.ownerName,
          supportName: '—',
          dueDate: pg.dueDate || '—',
          status: draft.consolidatedStatusOverrides[key] || 'Em curso',
          editable: true,
        });
      });
    });

    // 5. Decisões registradas na reunião
    draft.decisions.forEach((dec) => {
      const key = `decision:${dec.id}`;
      rows.push({
        key,
        origin: 'Decisão',
        originStage: dec.stage,
        sourceRefId: dec.id,
        commitment: dec.decision,
        ownerName: dec.ownerName,
        supportName: '—',
        dueDate: dec.dueDate,
        status: draft.consolidatedStatusOverrides[key] || 'Confirmado',
        editable: true,
      });
    });

    // 6. Compromissos adicionais registrados manualmente
    draft.extraCommitments.forEach((ext) => {
      const key = `extra:${ext.id}`;
      rows.push({
        key,
        origin: 'Compromisso Adicional',
        originStage: 6,
        sourceRefId: ext.id,
        commitment: ext.commitment,
        ownerName: ext.ownerName,
        supportName: ext.supportName || '—',
        dueDate: ext.dueDate,
        status: ext.status,
        editable: true,
      });
    });

    return rows;
  }, [draft]);

  const updateCommitmentSituation = useCallback(
    (row: ConsolidatedCommitmentRow, nextStatus: CommitmentSituation) => {
      setDraft((prev) => {
        if (!prev) return prev;
        if (row.origin === 'Compromisso Adicional') {
          return {
            ...prev,
            hasUnsavedChanges: true,
            extraCommitments: prev.extraCommitments.map((ext) =>
              ext.id === row.sourceRefId ? { ...ext, status: nextStatus } : ext
            ),
          };
        }
        return {
          ...prev,
          hasUnsavedChanges: true,
          consolidatedStatusOverrides: {
            ...prev.consolidatedStatusOverrides,
            [row.key]: nextStatus,
          },
        };
      });
    },
    []
  );

  const updateExtraCommitment = useCallback(
    (
      id: string,
      patch: Partial<{ commitment: string; ownerName: string; supportName: string; dueDate: string }>
    ) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasUnsavedChanges: true,
          extraCommitments: prev.extraCommitments.map((ext) =>
            ext.id === id ? { ...ext, ...patch } : ext
          ),
        };
      });
    },
    []
  );

  const syncDraftPrioritiesToPortal = useCallback(
    (sourceDraft: WeeklyAlignmentDraft) => {
      updateWeeklyPriorities(
        sourceDraft.priorities.map((p) => ({
          id: p.id,
          ticketId: p.ticketId,
          title: p.ticketTitle,
          owner: p.primaryOwnerName,
          status:
            p.ticketStatus === 'Pendente'
              ? 'Aguardando terceiros'
              : p.dueDate.toLowerCase().includes('hoje')
                ? 'Risco de prazo'
                : 'Em curso',
          nextAction: p.nextAction,
          dueDate: p.dueDate,
          sourceAlignmentDate: `${sourceDraft.weekLabel} · ${sourceDraft.date}`,
        }))
      );
      // Propaga parâmetros da meta semanal sem sobrescrever o snapshot congelado de início da semana
      updateWeeklyBaseline({
        weekLabel: sourceDraft.weekLabel,
        weeklyGoalReductionPercent: sourceDraft.weeklyGoal.reductionPercent,
        weeklyGoalTargetCount: sourceDraft.weeklyGoal.targetCount,
        weeklyGoalOwnerName: sourceDraft.weeklyGoal.ownerName,
        weeklyGoalDueDate: sourceDraft.weeklyGoal.dueDate,
        weeklyGoalNote: sourceDraft.weeklyGoal.note,
      });
    },
    [updateWeeklyPriorities, updateWeeklyBaseline]
  );

  // Salvar rascunho / Finalizar alinhamento (propaga prioridades para Visão Geral e Daily TPL-01)
  const saveDraftSession = useCallback(async () => {
    if (!draft) return;
    const res = await WeeklyAlignmentAdapter.persistDraftSession(dataMode, draft, false);
    syncDraftPrioritiesToPortal(draft);
    setDraft((prev) =>
      prev ? { ...prev, hasUnsavedChanges: false, lastSavedAt: res.savedAt } : prev
    );
    pushToast({
      title: `Rascunho salvo às ${res.savedAt}`,
      description: res.note,
      tone: 'success',
    });
  }, [draft, dataMode, pushToast, syncDraftPrioritiesToPortal]);

  const finalizeAlignment = useCallback(async () => {
    if (!draft) return;
    const res = await WeeklyAlignmentAdapter.persistDraftSession(dataMode, draft, true);
    syncDraftPrioritiesToPortal(draft);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            status: 'Finalizado',
            hasUnsavedChanges: false,
            lastSavedAt: res.savedAt,
            finalizedAt: res.savedAt,
          }
        : prev
    );
    setConfirmFinalizeOpen(false);
    pushToast({
      title: `Alinhamento Semanal finalizado (${res.savedAt})`,
      description: res.note,
      tone: 'success',
    });
  }, [draft, dataMode, pushToast, syncDraftPrioritiesToPortal]);

  return {
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
  };
}
