import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Save,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import type {
  ConsolidatedCommitmentRow,
  WeeklyAlignmentDraft,
  WeeklyStageId,
} from '../../types/weeklyAlignment';

export const MeetingSummary: React.FC<{
  draft: WeeklyAlignmentDraft;
  consolidatedCommitments: ConsolidatedCommitmentRow[];
  onGoToStage: (stage: WeeklyStageId) => void;
  onSaveDraft: () => void;
  onRequestFinalize: () => void;
  onOpenDocument: () => void;
}> = ({
  draft,
  consolidatedCommitments,
  onGoToStage,
  onSaveDraft,
  onRequestFinalize,
  onOpenDocument,
}) => {
  const presentCount = draft.participants.filter((p) => p.present).length;
  const macroDefinedCount = draft.macroAreas.filter(
    (m) => m.primaryOwnerId && m.primaryOwnerName && m.primaryOwnerName !== 'Não definido'
  ).length;
  const pendingReviewCount = consolidatedCommitments.filter((c) => c.ownerName === 'Não definido').length;

  return (
    <div className="space-y-4">
      {/* Banner executivo de prontidão */}
      <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={17} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Fechamento Executivo — {draft.weekLabel}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Revise os itens consolidados antes de encerrar a reunião ou gerar a ata oficial. Nenhuma informação é descartada ao navegar entre etapas.
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <span
            className={`font-semibold ${
              draft.status === 'Finalizado'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            Situação: {draft.status}
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
            {draft.finalizedAt
              ? `Finalizado às ${draft.finalizedAt}`
              : draft.lastSavedAt
                ? `Último salvamento às ${draft.lastSavedAt}`
                : 'Aguardando salvamento'}
          </span>
        </div>
      </div>

      {/* 6 Blocos numéricos de resumo ao vivo */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onGoToStage(1)}
          className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-left hover:border-[#0F5E59] transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Presentes</span>
            <Users size={13} />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {presentCount}/{draft.participants.length}
          </div>
          <div className="text-[11px] text-slate-500">Participantes</div>
        </button>

        <button
          type="button"
          onClick={() => onGoToStage(4)}
          className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-left hover:border-[#0F5E59] transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Prioridades</span>
            <Target size={13} />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F5E59] dark:text-[#2DD4BF]">
            {draft.priorities.length}/5
          </div>
          <div className="text-[11px] text-slate-500">Carteira semanal</div>
        </button>

        <button
          type="button"
          onClick={() => onGoToStage(4)}
          className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-left hover:border-[#0F5E59] transition-colors"
        >
          <div className="text-[11px] text-slate-500">Meta de Backlog</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            -{draft.weeklyGoal.reductionPercent}%
          </div>
          <div className="text-[11px] text-slate-500">
            {draft.weeklyGoal.targetCount} chamado(s)
          </div>
        </button>

        <button
          type="button"
          onClick={() => onGoToStage(3)}
          className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-left hover:border-[#0F5E59] transition-colors"
        >
          <div className="text-[11px] text-slate-500">Macroáreas</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {macroDefinedCount}/{draft.macroAreas.length}
          </div>
          <div className="text-[11px] text-slate-500">Com responsável</div>
        </button>

        <button
          type="button"
          onClick={() => onGoToStage(5)}
          className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-left hover:border-[#0F5E59] transition-colors"
        >
          <div className="text-[11px] text-slate-500">Projetos & GMUD</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {draft.projectsGmud.length}
          </div>
          <div className="text-[11px] text-slate-500">Itens acompanhados</div>
        </button>

        <button
          type="button"
          onClick={() => onGoToStage(6)}
          className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-left hover:border-[#0F5E59] transition-colors"
        >
          <div className="text-[11px] text-slate-500">Compromissos</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {consolidatedCommitments.length}
          </div>
          <div className="text-[11px] text-slate-500">
            {draft.decisions.length} decisão(ões)
          </div>
        </button>
      </div>

      {/* Síntese detalhada: Carteira Semanal + Macroáreas + Decisões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Prioridades Definidas ({draft.priorities.length}/5)
            </h3>
            <button
              type="button"
              onClick={() => onGoToStage(4)}
              className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
            >
              Revisar
            </button>
          </div>
          {draft.priorities.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Nenhuma prioridade selecionada.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {draft.priorities.map((p) => (
                <li
                  key={p.id}
                  className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                >
                  <div className="font-mono text-[11px] text-[#0F5E59] dark:text-[#2DD4BF]">
                    P{p.order} · #{p.ticketId} · Prazo {p.dueDate}
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {p.ticketTitle}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {p.primaryOwnerName}
                    {p.supportTechName ? ` + Apoio: ${p.supportTechName}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Governança de Macroáreas
            </h3>
            <button
              type="button"
              onClick={() => onGoToStage(3)}
              className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
            >
              Revisar
            </button>
          </div>
          <ul className="space-y-1.5 text-xs">
            {draft.macroAreas.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {m.primaryOwnerName}
                    {m.supportTechName ? ` · Apoio: ${m.supportTechName}` : ''}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {m.deliverables.length} entrega(s)
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Decisões & Alerta de Revisão
            </h3>
            <button
              type="button"
              onClick={() => onGoToStage(6)}
              className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
            >
              Ver matriz
            </button>
          </div>
          {pendingReviewCount > 0 && (
            <div className="rounded border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-2 text-[11px] text-amber-800 dark:text-amber-300">
              {pendingReviewCount} item(ns) na matriz consolidada ainda estão sem responsável definido.
            </div>
          )}
          {draft.decisions.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              Nenhuma decisão registrada até o momento nesta sessão.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {draft.decisions.map((d) => (
                <li
                  key={d.id}
                  className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">{d.decision}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {d.ownerName} · Prazo {d.dueDate}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Barra de Ações Finais */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-3">
        <button
          type="button"
          onClick={() => onGoToStage(6)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#0F5E59]"
        >
          <ArrowLeft size={14} />
          <span>Voltar e revisar</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#0F5E59]"
          >
            <Save size={14} />
            <span>Salvar rascunho</span>
          </button>

          <button
            type="button"
            onClick={onOpenDocument}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#0F5E59]"
          >
            <FileText size={14} />
            <span>Gerar documento</span>
          </button>

          <button
            type="button"
            onClick={onRequestFinalize}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 transition-colors"
          >
            <CheckCircle2 size={14} />
            <span>
              {draft.status === 'Finalizado' ? 'Alinhamento Finalizado' : 'Finalizar alinhamento'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
