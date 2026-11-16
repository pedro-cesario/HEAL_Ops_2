import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Plus,
  Printer,
  Save,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import type {
  BilateralCommitmentItem,
  IndividualAlignmentRecord,
  IndividualMeetingType,
  MeetingRecord,
} from '../../types/ops';

const INDIVIDUAL_MEETING_TYPES: IndividualMeetingType[] = [
  'Alinhamento Mensal',
  'Feedback de Reconhecimento',
  'Feedback de Desenvolvimento',
  'Registro Esporádico',
];

export const IndividualAlignmentWorkspace: React.FC<{
  meeting: MeetingRecord;
  initialView?: 'editor' | 'document';
  onClose: () => void;
}> = ({ meeting, initialView = 'editor', onClose }) => {
  const {
    teamMembers,
    individualAlignments,
    upsertIndividualAlignment,
    createIndividualAlignmentForMember,
    addPending,
    pushToast,
  } = useOps();

  const matchingRecords = useMemo(() => {
    const byMeeting = individualAlignments.find((r) => r.meetingId === meeting.id);
    if (byMeeting) {
      return individualAlignments.filter(
        (r) => r.collaboratorId === byMeeting.collaboratorId
      );
    }
    const matchedMember = teamMembers.find((m) =>
      meeting.participants.some((p) => p.toLowerCase() === m.name.toLowerCase())
    );
    if (matchedMember) {
      return individualAlignments.filter((r) => r.collaboratorId === matchedMember.id);
    }
    return individualAlignments;
  }, [individualAlignments, meeting, teamMembers]);

  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    () => matchingRecords[0]?.id || individualAlignments[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'editor' | 'document'>(initialView);

  const activeRecord = useMemo(
    () =>
      individualAlignments.find((r) => r.id === selectedRecordId) ||
      matchingRecords[0] ||
      individualAlignments[0],
    [individualAlignments, selectedRecordId, matchingRecords]
  );

  const collaboratorHistory = useMemo(() => {
    if (!activeRecord) return [];
    return individualAlignments.filter(
      (r) => r.collaboratorId === activeRecord.collaboratorId
    );
  }, [individualAlignments, activeRecord]);

  const [draft, setDraft] = useState<IndividualAlignmentRecord | null>(() => activeRecord || null);

  // Sync draft when user switches record or collaborator
  React.useEffect(() => {
    if (activeRecord && draft?.id !== activeRecord.id) {
      setDraft(activeRecord);
    }
  }, [activeRecord, draft?.id]);

  const [newGoalText, setNewGoalText] = useState('');
  const [newColabAction, setNewColabAction] = useState('');
  const [newColabDue, setNewColabDue] = useState('25/11/2026');
  const [newManagerAction, setNewManagerAction] = useState('');
  const [newManagerDue, setNewManagerDue] = useState('22/11/2026');
  const [linkManagerToPending, setLinkManagerToPending] = useState(false);

  if (!draft) {
    return null;
  }

  const updateField = <K extends keyof IndividualAlignmentRecord>(
    key: K,
    value: IndividualAlignmentRecord[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = (finalize = false) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const nextRecord: IndividualAlignmentRecord = {
      ...draft,
      status: finalize ? 'Finalizado' : draft.status,
      lastSavedAt: nowTime,
      acknowledgmentDate:
        draft.acknowledgedInSession && !draft.acknowledgmentDate
          ? new Date().toLocaleDateString('pt-BR')
          : draft.acknowledgmentDate,
    };
    setDraft(nextRecord);
    upsertIndividualAlignment(nextRecord);
    pushToast({
      title: finalize
        ? `Alinhamento TPL-03 finalizado (${nowTime})`
        : `Alinhamento TPL-03 salvo às ${nowTime}`,
      description:
        'Compromissos bilaterais sincronizados com o perfil do colaborador em Equipe e na Central de Reuniões.',
      tone: 'success',
    });
  };

  const handleCreateNewEncounter = (meetingType: IndividualMeetingType) => {
    const member = teamMembers.find((m) => m.id === draft.collaboratorId);
    if (!member) return;
    const created = createIndividualAlignmentForMember(member, meetingType);
    setSelectedRecordId(created.id);
    setDraft(created);
    pushToast({
      title: `Novo registro (${meetingType}) criado para ${member.name}`,
      description:
        'Compromissos em aberto do ciclo anterior foram reapresentados automaticamente.',
      tone: 'info',
    });
  };

  const handleAddCommitment = (party: 'Colaborador' | 'Gestor') => {
    const text = party === 'Colaborador' ? newColabAction.trim() : newManagerAction.trim();
    const due = party === 'Colaborador' ? newColabDue.trim() : newManagerDue.trim();
    if (!text) return;

    let linkedPendingId: string | undefined;
    if (party === 'Gestor' && linkManagerToPending) {
      const createdPending = addPending({
        origin: 'Alinhamento Individual',
        description: `[1:1 ${draft.collaboratorName}] ${text}`,
        owner: draft.conductorName || 'Gestor de TI',
        criticality: 'Média',
        dueDate: due || 'Esta semana',
        status: 'Aberta',
        nextAction: `Apoio pactuado com ${draft.collaboratorName} no TPL-03`,
      });
      linkedPendingId = createdPending.id;
    }

    const item: BilateralCommitmentItem = {
      id: `bil-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      party,
      ownerName:
        party === 'Colaborador' ? draft.collaboratorName : draft.conductorName || 'Gestor de TI',
      description: text,
      dueDate: due || 'A definir',
      status: 'Em dia',
      linkedPendingId,
    };

    if (party === 'Colaborador') {
      updateField('collaboratorCommitments', [...draft.collaboratorCommitments, item]);
      setNewColabAction('');
    } else {
      updateField('managerCommitments', [...draft.managerCommitments, item]);
      setNewManagerAction('');
      setLinkManagerToPending(false);
    }
  };

  const cycleCommitmentStatus = (party: 'Colaborador' | 'Gestor', id: string) => {
    const nextOf = (s: BilateralCommitmentItem['status']): BilateralCommitmentItem['status'] =>
      s === 'Em dia' ? 'Concluído' : s === 'Concluído' ? 'Pendente' : 'Em dia';

    if (party === 'Colaborador') {
      updateField(
        'collaboratorCommitments',
        draft.collaboratorCommitments.map((c) =>
          c.id === id ? { ...c, status: nextOf(c.status) } : c
        )
      );
    } else {
      updateField(
        'managerCommitments',
        draft.managerCommitments.map((c) =>
          c.id === id ? { ...c, status: nextOf(c.status) } : c
        )
      );
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-3.5">
      {/* Top Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#18222F] whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
          <div className="min-w-0">
            <div className="text-[11px] font-mono font-semibold text-[#0F5E59] dark:text-[#2DD4BF] truncate">
              TPL-03 · {draft.meetingType} · {draft.status}
              {draft.lastSavedAt ? ` · Salvo ${draft.lastSavedAt}` : ''}
            </div>
            <h1 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {draft.collaboratorName} — {draft.collaboratorRole} ({draft.macroArea})
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
          <select
            aria-label="Selecionar colaborador para TPL-03"
            value={draft.collaboratorId}
            onChange={(e) => {
              const target = individualAlignments.find(
                (r) => r.collaboratorId === e.target.value
              );
              if (target) {
                setSelectedRecordId(target.id);
                setDraft(target);
              }
            }}
            className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-medium"
          >
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                Colaborador: {m.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'editor' ? 'document' : 'editor')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 font-medium hover:border-[#0F5E59] whitespace-nowrap"
          >
            <FileText size={13} />
            <span>{viewMode === 'editor' ? 'Prévia Documento A4' : 'Voltar à Edição'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 font-medium hover:border-[#0F5E59] whitespace-nowrap"
          >
            <Save size={13} />
            <span>Salvar Rascunho</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 font-medium text-white dark:text-slate-950 whitespace-nowrap"
          >
            <CheckCircle2 size={13} />
            <span>Finalizar Alinhamento</span>
          </button>
        </div>
      </div>

      {/* Explicit Non-Disciplinary Clarification + History Timeline */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Info size={14} className="text-[#0F5E59] dark:text-[#2DD4BF] shrink-0" />
          <span>
            <strong>Caráter de Desenvolvimento:</strong> Este registro de alinhamento e feedback visa acompanhamento bilateral e clareza de expectativas —{' '}
            <em>não equivale nem substitui processo ou advertência disciplinar</em>.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {collaboratorHistory.map((hist) => (
            <button
              key={hist.id}
              type="button"
              onClick={() => {
                setSelectedRecordId(hist.id);
                setDraft(hist);
              }}
              className={`rounded border px-2 py-1 text-[11px] font-mono ${
                hist.id === draft.id
                  ? 'border-[#0F5E59] bg-[#0F5E59]/10 text-[#0F5E59] dark:border-[#2DD4BF] dark:text-[#2DD4BF] font-semibold'
                  : 'border-slate-200 dark:border-[#243242] text-slate-600 dark:text-slate-400'
              }`}
            >
              {hist.date} · {hist.meetingType}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleCreateNewEncounter('Registro Esporádico')}
            className="inline-flex items-center gap-1 rounded border border-[#0F5E59]/40 dark:border-[#2DD4BF]/40 px-2 py-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:bg-[#0F5E59]/10"
          >
            <Plus size={12} />
            <span>Novo encontro 1:1</span>
          </button>
        </div>
      </div>

      {viewMode === 'document' ? (
        <div className="space-y-3">
          <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/25 px-4 py-2 text-xs text-amber-900 dark:text-amber-200">
            <span>
              <strong>Documento Institucional A4 (TPL-03):</strong> Exportação definitiva em PDF server-side aguarda FastAPI (:3312). Utilize Imprimir visualização para arquivamento imediato.
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded bg-[#0F5E59] px-3 py-1 font-medium text-white"
            >
              <Printer size={13} />
              <span>Imprimir A4</span>
            </button>
          </div>

          <article className="print-only-surface mx-auto max-w-4xl rounded-lg border border-slate-300 dark:border-[#243242] bg-white text-slate-900 p-6 sm:p-8 shadow-xs space-y-5 text-xs">
            <header className="print-avoid-break flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#0F5E59] pb-4">
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-[#0F5E59] uppercase">
                  Instituto HEAL — Hospital Espírita André Luiz
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Registro Bilateral de {draft.meetingType} (TPL-03)
                </h2>
                <div className="mt-0.5 text-slate-600">
                  Colaborador: <strong>{draft.collaboratorName}</strong> · {draft.collaboratorRole} ·{' '}
                  {draft.macroArea}
                </div>
              </div>
              <div className="font-mono text-right text-slate-600 space-y-0.5">
                <div>Data: {draft.date}</div>
                <div>Condutor: {draft.conductorName}</div>
                <div>Situação: {draft.status}</div>
              </div>
            </header>

            <section className="print-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded border border-slate-200 p-3 space-y-1">
                <h3 className="font-bold text-slate-900">1. Pontos Fortes & Reconhecimentos</h3>
                <p className="text-slate-700 leading-relaxed">
                  {draft.strengths || 'Não registrado.'}
                </p>
              </div>
              <div className="rounded border border-slate-200 p-3 space-y-1">
                <h3 className="font-bold text-slate-900">2. Pontos de Desenvolvimento</h3>
                <p className="text-slate-700 leading-relaxed">
                  {draft.developmentPoints || 'Não registrado.'}
                </p>
              </div>
            </section>

            <section className="print-avoid-break space-y-1.5">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                3. Avaliação de Compromissos Anteriores
              </h3>
              {draft.previousCommitmentsEvaluation.length === 0 ? (
                <p className="text-slate-500">Sem compromissos pendentes do ciclo anterior.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {draft.previousCommitmentsEvaluation.map((ev) => (
                    <li key={ev.commitmentId}>
                      <strong>[{ev.outcome}]</strong> ({ev.party}) {ev.description} —{' '}
                      {ev.evaluationNote}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="print-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                  4. Compromissos do Colaborador
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {draft.collaboratorCommitments.length === 0 ? (
                    <li className="text-slate-500">Nenhum compromisso registrado.</li>
                  ) : (
                    draft.collaboratorCommitments.map((c) => (
                      <li key={c.id}>
                        {c.description} (Prazo: {c.dueDate} · {c.status})
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                  5. Compromissos e Apoio da Gestão
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {draft.managerCommitments.length === 0 ? (
                    <li className="text-slate-500">Nenhum compromisso registrado.</li>
                  ) : (
                    draft.managerCommitments.map((c) => (
                      <li key={c.id}>
                        {c.description} (Prazo: {c.dueDate} · {c.status})
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </section>

            <section className="print-avoid-break space-y-1.5">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                6. Metas, Negociações e Acompanhamento
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {draft.nextAlignmentGoals.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
              <p className="pt-1">
                <strong>Negociações e Acordos:</strong> {draft.negotiationsAndAgreements || '—'}
              </p>
              <p>
                <strong>Acompanhamento & Prazos:</strong> {draft.trackingNotes} · Próximo alinhamento:{' '}
                <strong className="font-mono">{draft.nextAlignmentDate}</strong>
              </p>
              <p>
                <strong>Considerações finais:</strong> {draft.finalConsiderations}
              </p>
            </section>

            <section className="print-avoid-break pt-4 space-y-5">
              <div className="rounded bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600">
                Ciência registrada em sessão:{' '}
                <strong>{draft.acknowledgedInSession ? `Sim (${draft.acknowledgmentDate})` : 'Pendente'}</strong>{' '}
                · Documento de orientação gerencial e desenvolvimento (não disciplinar).
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                <div className="border-t border-slate-400 pt-1.5 text-center text-slate-600">
                  {draft.conductorName} · Coordenação de TI
                </div>
                <div className="border-t border-slate-400 pt-1.5 text-center text-slate-600">
                  {draft.collaboratorName} · Ciência e Assinatura Manual
                </div>
              </div>
            </section>
          </article>
        </div>
      ) : (
        /* INTERACTIVE WORKSPACE EDITOR */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 text-xs">
          {/* Left Column: Identificação, Desenvolvimento, Compromissos Anteriores & Metas */}
          <div className="xl:col-span-6 space-y-3">
            {/* Identificação & Tipo */}
            <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#1D2836] pb-2">
                1. Identificação, Tipo de Encontro e Condução
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tipo de encontro</label>
                  <select
                    value={draft.meetingType}
                    onChange={(e) =>
                      updateField('meetingType', e.target.value as IndividualMeetingType)
                    }
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 font-medium"
                  >
                    {INDIVIDUAL_MEETING_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Data do encontro</label>
                  <input
                    type="text"
                    value={draft.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Condutor</label>
                  <input
                    type="text"
                    value={draft.conductorName}
                    onChange={(e) => updateField('conductorName', e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                    Pontos fortes e reconhecimentos
                  </label>
                  <textarea
                    rows={3}
                    value={draft.strengths}
                    onChange={(e) => updateField('strengths', e.target.value)}
                    placeholder="Evidências positivas, entregas e comportamento técnico..."
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-amber-700 dark:text-amber-400 mb-1">
                    Pontos de desenvolvimento e orientação
                  </label>
                  <textarea
                    rows={3}
                    value={draft.developmentPoints}
                    onChange={(e) => updateField('developmentPoints', e.target.value)}
                    placeholder="Ajustes de processo, documentação POP, organização ou suporte..."
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
              </div>
            </section>

            {/* Avaliação de Compromissos Anteriores (reapresentação automática) */}
            <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  2. Revisão de Compromissos Anteriores ({draft.previousCommitmentsEvaluation.length})
                </h2>
                <span className="text-[11px] text-slate-500">
                  Itens não concluídos são reapresentados
                </span>
              </div>
              {draft.previousCommitmentsEvaluation.length === 0 ? (
                <p className="text-slate-500">
                  Sem compromissos pendentes do ciclo anterior para este colaborador.
                </p>
              ) : (
                <div className="space-y-2">
                  {draft.previousCommitmentsEvaluation.map((ev, idx) => (
                    <div
                      key={ev.commitmentId}
                      className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                          {ev.party} · Prazo {ev.dueDate}
                        </span>
                        <select
                          value={ev.outcome}
                          onChange={(e) => {
                            const next = [...draft.previousCommitmentsEvaluation];
                            next[idx] = {
                              ...ev,
                              outcome: e.target.value as
                                | 'Cumprido'
                                | 'Parcial'
                                | 'Em aberto (reapresentado)',
                            };
                            updateField('previousCommitmentsEvaluation', next);
                          }}
                          className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-0.5 text-[11px] font-medium"
                        >
                          <option value="Cumprido">Cumprido</option>
                          <option value="Parcial">Parcial</option>
                          <option value="Em aberto (reapresentado)">
                            Em aberto (reapresentado)
                          </option>
                        </select>
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {ev.description}
                      </div>
                      <input
                        type="text"
                        value={ev.evaluationNote}
                        onChange={(e) => {
                          const next = [...draft.previousCommitmentsEvaluation];
                          next[idx] = { ...ev, evaluationNote: e.target.value };
                          updateField('previousCommitmentsEvaluation', next);
                        }}
                        placeholder="Observação da revisão..."
                        className="w-full rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Metas para o próximo alinhamento */}
            <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#1D2836] pb-2">
                3. Metas para o Próximo Alinhamento ({draft.nextAlignmentGoals.length})
              </h2>
              <ul className="space-y-1.5">
                {draft.nextAlignmentGoals.map((goal, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{goal}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'nextAlignmentGoals',
                          draft.nextAlignmentGoals.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-slate-400 hover:text-red-500"
                      aria-label="Remover meta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newGoalText.trim()) return;
                  updateField('nextAlignmentGoals', [
                    ...draft.nextAlignmentGoals,
                    newGoalText.trim(),
                  ]);
                  setNewGoalText('');
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="Nova meta acordada para o próximo ciclo..."
                  className="flex-1 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded bg-[#0F5E59] dark:bg-[#14B8A6] px-2.5 py-1.5 font-medium text-white dark:text-slate-950"
                >
                  <Plus size={13} />
                  <span>Meta</span>
                </button>
              </form>
            </section>
          </div>

          {/* Right Column: Compromissos Bilaterais (Colaborador vs Gestão), Acordos & Ciência */}
          <div className="xl:col-span-6 space-y-3">
            {/* Compromissos Bilaterais */}
            <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#1D2836] pb-2">
                4. Compromissos Bilaterais (Colaborador ⇄ Gestão)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Bloco Colaborador -> Gestão */}
                <div className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-2">
                  <div className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                    Colaborador ({draft.collaboratorName})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {draft.collaboratorCommitments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-1.5 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {c.description}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            Prazo: {c.dueDate}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => cycleCommitmentStatus('Colaborador', c.id)}
                          className="rounded border border-slate-200 dark:border-[#243242] px-1.5 py-0.5 text-[10px] font-medium shrink-0"
                        >
                          {c.status}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      value={newColabAction}
                      onChange={(e) => setNewColabAction(e.target.value)}
                      placeholder="Compromisso do colaborador..."
                      className="w-full rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newColabDue}
                        onChange={(e) => setNewColabDue(e.target.value)}
                        className="w-28 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCommitment('Colaborador')}
                        className="flex-1 rounded bg-[#0F5E59] dark:bg-[#14B8A6] px-2 py-1 font-medium text-white dark:text-slate-950"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bloco Gestor -> Colaborador */}
                <div className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-2">
                  <div className="font-semibold text-amber-700 dark:text-amber-400">
                    Gestão / Apoio ao Colaborador
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {draft.managerCommitments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-1.5 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {c.description}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            Prazo: {c.dueDate}
                            {c.linkedPendingId ? ' · Em Pendências' : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => cycleCommitmentStatus('Gestor', c.id)}
                          className="rounded border border-slate-200 dark:border-[#243242] px-1.5 py-0.5 text-[10px] font-medium shrink-0"
                        >
                          {c.status}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      value={newManagerAction}
                      onChange={(e) => setNewManagerAction(e.target.value)}
                      placeholder="Compromisso ou desbloqueio da gestão..."
                      className="w-full rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={linkManagerToPending}
                        onChange={(e) => setLinkManagerToPending(e.target.checked)}
                      />
                      <span>Espelhar também em Pendências e Auditoria</span>
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newManagerDue}
                        onChange={(e) => setNewManagerDue(e.target.value)}
                        className="w-28 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCommitment('Gestor')}
                        className="flex-1 rounded bg-[#0F5E59] dark:bg-[#14B8A6] px-2 py-1 font-medium text-white dark:text-slate-950"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Negociações, Acompanhamento, Considerações Finais & Ciência */}
            <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#1D2836] pb-2">
                5. Negociações, Acompanhamento, Considerações e Ciência
              </h2>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Negociações e acordos firmados
                </label>
                <textarea
                  rows={2}
                  value={draft.negotiationsAndAgreements}
                  onChange={(e) => updateField('negotiationsAndAgreements', e.target.value)}
                  className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Prazos, responsáveis e indicadores de acompanhamento
                  </label>
                  <input
                    type="text"
                    value={draft.trackingNotes}
                    onChange={(e) => updateField('trackingNotes', e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Próximo alinhamento
                  </label>
                  <input
                    type="text"
                    value={draft.nextAlignmentDate}
                    onChange={(e) => updateField('nextAlignmentDate', e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Considerações finais
                </label>
                <textarea
                  rows={2}
                  value={draft.finalConsiderations}
                  onChange={(e) => updateField('finalConsiderations', e.target.value)}
                  className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5">
                <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={draft.acknowledgedInSession}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField('acknowledgedInSession', checked);
                      if (checked && !draft.acknowledgmentDate) {
                        updateField(
                          'acknowledgmentDate',
                          new Date().toLocaleDateString('pt-BR')
                        );
                      }
                    }}
                  />
                  <UserCheck size={14} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
                  <span>Ciência registrada na sessão (assinatura manual disponível na prévia A4)</span>
                </label>
                <input
                  type="text"
                  value={draft.acknowledgmentDate}
                  onChange={(e) => updateField('acknowledgmentDate', e.target.value)}
                  placeholder="Data da ciência"
                  className="w-28 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 font-mono text-[11px]"
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
