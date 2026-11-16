import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Clock,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import type { WeeklyAlignmentDraft } from '../../../types/weeklyAlignment';

export const Stage1Opening: React.FC<{
  draft: WeeklyAlignmentDraft;
  onToggleParticipant: (participantId: string) => void;
  onUpdateObservation: (text: string) => void;
  onUpdateBlockerStatus: (
    blockerId: string,
    status: 'Em aberto' | 'Encaminhado' | 'Tratado'
  ) => void;
  onOpenDecisionModal: () => void;
}> = ({
  draft,
  onToggleParticipant,
  onUpdateObservation,
  onUpdateBlockerStatus,
  onOpenDecisionModal,
}) => {
  const presentCount = draft.participants.filter((p) => p.present).length;

  return (
    <div className="space-y-3.5">
      {/* Faixa superior: Presença interativa da equipe + Observação ao vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <section className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Check-in de Participantes
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#0F5E59] dark:text-[#2DD4BF]">
              {presentCount}/{draft.participants.length} presentes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {draft.participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggleParticipant(p.id)}
                className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors ${
                  p.present
                    ? 'border-[#0F5E59] bg-[#0F5E59]/[0.06] dark:border-[#2DD4BF]/70 dark:bg-[#2DD4BF]/10'
                    : 'border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] opacity-75'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {p.role} · {p.macroArea}
                  </div>
                </div>
                <UserCheck
                  size={14}
                  className={
                    p.present
                      ? 'shrink-0 text-[#0F5E59] dark:text-[#2DD4BF]'
                      : 'shrink-0 text-slate-400'
                  }
                />
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col justify-between rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="opening-observation"
                className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Pauta & Contexto de Abertura
              </label>
              <button
                type="button"
                onClick={onOpenDecisionModal}
                className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:border-[#0F5E59]"
              >
                <CheckSquare size={12} />
                <span>Registrar decisão</span>
              </button>
            </div>
            <textarea
              id="opening-observation"
              rows={3}
              value={draft.openingObservation}
              onChange={(e) => onUpdateObservation(e.target.value)}
              placeholder="Registre o recorte da semana, escalas especiais ou avisos hospitalares..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-[#1D2836] pt-2.5 text-center">
            {draft.previousResults.map((res) => (
              <div
                key={res.id}
                className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
              >
                <div className="text-[11px] text-slate-500 truncate">{res.label}</div>
                <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {res.value}
                </div>
                <div
                  className={`font-mono text-[10px] font-medium ${
                    res.status === 'atingido'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : res.status === 'critico'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {res.delta} ({res.target})
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Linha inferior: Prioridades concluídas | Compromissos anteriores | Problemas recorrentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Prioridades anteriores */}
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Retrospectiva da Carteira Anterior
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {draft.completedPriorities.length} item(ns)
            </span>
          </div>
          <div className="space-y-1.5">
            {draft.completedPriorities.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    #{item.ticketId}
                  </span>
                  <span
                    className={
                      item.outcome === 'Concluída'
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'font-medium text-amber-700 dark:text-amber-400'
                    }
                  >
                    {item.outcome}
                  </span>
                </div>
                <div className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Responsável: {item.owner}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compromissos pendentes herdados */}
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Compromissos Herdáveis em Aberto
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {draft.inheritedPendingCommitments.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {draft.inheritedPendingCommitments.map((c) => (
              <div
                key={c.id}
                className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                  <span>{c.owner}</span>
                  <span>Prazo {c.dueDate}</span>
                </div>
                <div className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                  {c.text}
                </div>
                <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  {c.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problemas recorrentes interativos */}
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Impedimentos Recorrentes
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
              <TrendingUp size={11} />
              <span>Ação ao vivo</span>
            </span>
          </div>
          <div className="space-y-1.5">
            {draft.recurrentBlockers.map((rb) => (
              <div
                key={rb.id}
                className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                    {rb.title}
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-red-700 dark:text-red-400 shrink-0">
                    {rb.recurrences}x
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">{rb.area}</span>
                  <select
                    aria-label={`Situação de ${rb.title}`}
                    value={rb.status}
                    onChange={(e) =>
                      onUpdateBlockerStatus(
                        rb.id,
                        e.target.value as 'Em aberto' | 'Encaminhado' | 'Tratado'
                      )
                    }
                    className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-0.5 text-[11px] font-medium"
                  >
                    <option value="Em aberto">Em aberto</option>
                    <option value="Encaminhado">Encaminhado</option>
                    <option value="Tratado">Tratado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
