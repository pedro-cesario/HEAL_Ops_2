import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Flame,
  Plus,
  Save,
} from 'lucide-react';
import type {
  DailyAlignmentDraft,
  DailyChallengeStage,
  DailyChallengeStatus,
  DailyOperationalChallenge,
} from '../../../types/dailyAlignment';
import type { ManagementPending, WeeklyPriority } from '../../../types/ops';
import type { CommitmentSituation } from '../../../types/weeklyAlignment';
import { Modal } from '../../common/UiPrimitives';

const CHALLENGE_STAGES: DailyChallengeStage[] = [
  'Análise',
  'Planejamento',
  'Projeto',
  'Homologação',
  'Produção',
];

const CHALLENGE_STATUSES: DailyChallengeStatus[] = [
  'Em aberto',
  'Em andamento',
  'Bloqueado',
  'Concluído',
];

export const DailyStage4ChallengeMinutes: React.FC<{
  draft: DailyAlignmentDraft;
  challengesHistory: DailyOperationalChallenge[];
  weeklyPriorities: WeeklyPriority[];
  pendings: ManagementPending[];
  collaborators: { id: string; name: string }[];
  confirmFinalizeOpen: boolean;
  onSetConfirmFinalizeOpen: (open: boolean) => void;
  onUpdateChallenge: (patch: Partial<DailyOperationalChallenge>) => void;
  onUpdateHistoryChallengeStatus: (
    challengeId: string,
    status: DailyChallengeStatus
  ) => void;
  onUpdateMinutesNote: (note: string) => void;
  onUpdateCommitmentStatus: (
    commitmentId: string,
    status: CommitmentSituation
  ) => void;
  onOpenDecisionModal: () => void;
  onAddCommitment: (ownerName: string, action: string, dueDate: string) => void;
  onSaveDraft: () => void;
  onConfirmFinalize: () => void;
  onOpenDocument: () => void;
}> = ({
  draft,
  challengesHistory,
  weeklyPriorities,
  pendings,
  collaborators,
  confirmFinalizeOpen,
  onSetConfirmFinalizeOpen,
  onUpdateChallenge,
  onUpdateHistoryChallengeStatus,
  onUpdateMinutesNote,
  onUpdateCommitmentStatus,
  onOpenDecisionModal,
  onAddCommitment,
  onSaveDraft,
  onConfirmFinalize,
  onOpenDocument,
}) => {
  const [newAction, setNewAction] = useState('');
  const [newOwner, setNewOwner] = useState(collaborators[0]?.name || 'Carlos Henrique');
  const [newDue, setNewDue] = useState('Hoje · 17:00');
  const [showConcludedHistory, setShowConcludedHistory] = useState(false);

  const visiblePriorChallenges = challengesHistory.filter(
    (c) =>
      c.id !== draft.currentChallenge.id &&
      (showConcludedHistory || c.currentStatus !== 'Concluído')
  );

  const openPendingsCount = pendings.filter((p) => p.status !== 'Resolvida').length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
      {/* Left Column: Desafio do Dia + Desafios Pendentes Anteriores */}
      <div className="xl:col-span-6 space-y-3">
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Desafio do Dia (Estruturado)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Criado em {draft.currentChallenge.createdAtDate}
            </span>
          </div>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Problema identificado
            </label>
            <textarea
              rows={2}
              value={draft.currentChallenge.problem}
              onChange={(e) => onUpdateChallenge({ problem: e.target.value })}
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Objetivo da tratativa
            </label>
            <input
              type="text"
              value={draft.currentChallenge.objective}
              onChange={(e) => onUpdateChallenge({ objective: e.target.value })}
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Responsável</label>
              <select
                value={draft.currentChallenge.ownerName}
                onChange={(e) => onUpdateChallenge({ ownerName: e.target.value })}
                className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5"
              >
                {collaborators.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Prazo</label>
              <input
                type="text"
                value={draft.currentChallenge.dueDate}
                onChange={(e) => onUpdateChallenge({ dueDate: e.target.value })}
                className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Etapa do ciclo</label>
              <select
                value={draft.currentChallenge.stage}
                onChange={(e) =>
                  onUpdateChallenge({ stage: e.target.value as DailyChallengeStage })
                }
                className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5"
              >
                {CHALLENGE_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Status atual</label>
              <select
                value={draft.currentChallenge.currentStatus}
                onChange={(e) =>
                  onUpdateChallenge({
                    currentStatus: e.target.value as DailyChallengeStatus,
                  })
                }
                className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 font-medium"
              >
                {CHALLENGE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Resultado esperado
            </label>
            <input
              type="text"
              value={draft.currentChallenge.expectedResult}
              onChange={(e) => onUpdateChallenge({ expectedResult: e.target.value })}
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
            />
          </div>
        </section>

        {/* Desafios Pendentes de Dailys Anteriores */}
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Desafios Pendentes de Dailys Anteriores ({visiblePriorChallenges.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowConcludedHistory((v) => !v)}
              className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
            >
              {showConcludedHistory ? 'Ocultar concluídos' : 'Exibir concluídos'}
            </button>
          </div>

          {visiblePriorChallenges.length === 0 ? (
            <p className="text-slate-500">Nenhum desafio anterior pendente no momento.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {visiblePriorChallenges.map((ch) => (
                <div
                  key={ch.id}
                  className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-500">
                      {ch.createdAtDate} · {ch.stage} · {ch.ownerName} (Prazo {ch.dueDate})
                    </span>
                    <select
                      aria-label={`Status do desafio ${ch.id}`}
                      value={ch.currentStatus}
                      onChange={(e) =>
                        onUpdateHistoryChallengeStatus(
                          ch.id,
                          e.target.value as DailyChallengeStatus
                        )
                      }
                      className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-0.5 text-[11px] font-medium"
                    >
                      {CHALLENGE_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {ch.problem}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Meta: {ch.expectedResult}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Ata Automática Editável + Compromissos + Ações de Encerramento */}
      <div className="xl:col-span-6 space-y-3">
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Ata Consolidada da Daily & Compromissos
              </h2>
              <p className="text-[11px] text-slate-500">
                Consolidado automático de macroáreas, prioridades TPL-02 ({weeklyPriorities.length}), pendências ativas ({openPendingsCount}) e desafio.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDecisionModal}
              className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline whitespace-nowrap"
            >
              + Registrar Decisão
            </button>
          </div>

          {/* Resumo automático dos pareceres por macroárea */}
          <div className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1.5">
            <div className="font-semibold text-[11px] uppercase tracking-wide text-slate-500">
              Síntese das Macroáreas ({draft.macroReports.length})
            </div>
            <ul className="space-y-1 text-[11px]">
              {draft.macroReports.map((mr) => (
                <li key={mr.id} className="text-slate-700 dark:text-slate-300">
                  <strong>
                    {mr.macroArea} [{mr.situation}]
                  </strong>{' '}
                  ({mr.leadName}): {mr.summary}
                </li>
              ))}
            </ul>
          </div>

          {/* Nota executiva editável da ata */}
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Texto consolidado da Ata (editável ao vivo)
            </label>
            <textarea
              rows={2}
              value={draft.minutesExecutiveNote}
              onChange={(e) => onUpdateMinutesNote(e.target.value)}
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Decisões & Compromissos */}
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Decisões ({draft.decisions.length}) & Compromissos ({draft.commitments.length})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {draft.decisions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1.5"
                >
                  <span className="truncate font-medium">
                    [Decisão] {d.decision}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    {d.ownerName} · {d.dueDate}
                  </span>
                </div>
              ))}
              {draft.commitments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">
                      {c.action}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.ownerName} · Prazo {c.dueDate}
                    </span>
                  </div>
                  <select
                    aria-label={`Situação compromisso ${c.id}`}
                    value={c.status}
                    onChange={(e) =>
                      onUpdateCommitmentStatus(
                        c.id,
                        e.target.value as CommitmentSituation
                      )
                    }
                    className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-1.5 py-0.5 text-[11px]"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em curso">Em curso</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAction.trim()) return;
                onAddCommitment(newOwner, newAction, newDue);
                setNewAction('');
              }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 pt-1"
            >
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="Novo compromisso da Daily..."
                className="sm:col-span-6 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
              />
              <select
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5"
              >
                {collaborators.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-3 flex gap-1">
                <input
                  type="text"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="w-full min-w-0 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 font-mono"
                />
                <button
                  type="submit"
                  aria-label="Adicionar compromisso"
                  className="rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-2.5 text-white dark:text-slate-950 shrink-0"
                >
                  <Plus size={13} />
                </button>
              </div>
            </form>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-[#1D2836] pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSaveDraft}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 dark:border-[#243242] px-3 py-1.5 font-medium hover:border-[#0F5E59]"
              >
                <Save size={13} />
                <span>Salvar rascunho</span>
              </button>
              <button
                type="button"
                onClick={onOpenDocument}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 dark:border-[#243242] px-3 py-1.5 font-medium hover:border-[#0F5E59]"
              >
                <FileText size={13} />
                <span>Documento A4</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onSetConfirmFinalizeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-1.5 font-medium text-white dark:text-slate-950"
            >
              <CheckCircle2 size={14} />
              <span>
                {draft.status === 'Finalizado'
                  ? 'Atualizar Ata Finalizada'
                  : 'Finalizar Daily Operacional'}
              </span>
            </button>
          </div>
        </section>
      </div>

      <Modal
        open={confirmFinalizeOpen}
        onClose={() => onSetConfirmFinalizeOpen(false)}
        title="Finalizar Daily Operacional (TPL-01)"
        subtitle="Consolidação da ata do turno e manutenção de pendências em aberto"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-200">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Itens da Fila Crítica ainda não marcados como tratados permanecerão ativos na próxima Daily. A persistência oficial definitiva depende do endpoint FastAPI (:3312).
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onSetConfirmFinalizeOpen(false)}
              className="rounded border border-slate-200 dark:border-[#243242] px-3 py-1.5"
            >
              Revisar
            </button>
            <button
              type="button"
              onClick={onConfirmFinalize}
              className="rounded bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Confirmar finalização
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
