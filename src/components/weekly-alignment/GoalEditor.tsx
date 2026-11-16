import React from 'react';
import { Target, TrendingDown } from 'lucide-react';
import type { WeeklyGoalDraft } from '../../types/weeklyAlignment';
import { TeamMemberSelector, type CollaboratorOption } from './TeamMemberSelector';

export const GoalEditor: React.FC<{
  goal: WeeklyGoalDraft;
  eligibleBacklogCount: number;
  collaborators: CollaboratorOption[];
  onChange: (patch: Partial<WeeklyGoalDraft>) => void;
}> = ({ goal, eligibleBacklogCount, collaborators, onChange }) => {
  const projectedFinal = Math.max(0, eligibleBacklogCount - goal.targetCount);
  const reductionWidth = Math.min(100, Math.max(0, goal.reductionPercent));

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-[#243242] bg-[#0F5E59]/10 dark:bg-[#2DD4BF]/10 text-[#0F5E59] dark:text-[#2DD4BF]">
            <Target size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Meta da Semana (Redução de Backlog)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Meta global de vazão — não ocupa vaga nas 5 prioridades nominais
            </p>
          </div>
        </div>
        <div className="text-right font-mono tabular-nums">
          <span className="text-base font-bold text-[#0F5E59] dark:text-[#2DD4BF]">
            -{goal.reductionPercent}%
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
            {goal.targetCount} de {eligibleBacklogCount} elegíveis
          </span>
        </div>
      </div>

      {/* Termômetro visual Atual -> Redução -> Alvo */}
      <div className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
          <span className="text-slate-600 dark:text-slate-300">
            Backlog atual: <strong className="text-slate-900 dark:text-slate-100">{eligibleBacklogCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <TrendingDown size={12} />
            -{goal.targetCount} chamado(s)
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            Alvo final: <strong className="text-[#0F5E59] dark:text-[#2DD4BF]">{projectedFinal}</strong>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-[#0F5E59] dark:bg-[#2DD4BF] transition-all duration-200"
            style={{ width: `${reductionWidth}%` }}
          />
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <label htmlFor="goal-reduction-slider" className="text-[11px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Percentual (%):
          </label>
          <input
            id="goal-reduction-slider"
            type="range"
            min={0}
            max={60}
            step={5}
            value={goal.reductionPercent}
            onChange={(e) => onChange({ reductionPercent: Number(e.target.value) })}
            className="flex-1 accent-[#0F5E59] dark:accent-[#2DD4BF] cursor-pointer"
          />
          <input
            type="number"
            min={0}
            max={100}
            aria-label="Percentual de redução do backlog"
            value={goal.reductionPercent}
            onChange={(e) => onChange({ reductionPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            className="w-16 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 font-mono text-xs text-right tabular-nums text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Responsável + Prazo + Observação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <TeamMemberSelector
          label="Responsável pela meta"
          value={goal.ownerId}
          options={collaborators}
          emptyOptionLabel="Equipe TI (Geral)"
          onChange={(ownerId, ownerName) =>
            onChange({
              ownerId,
              ownerName: ownerName || 'Equipe TI',
            })
          }
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prazo da meta
          </label>
          <input
            type="date"
            value={goal.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59] dark:focus:border-[#2DD4BF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Critério operacional / Observação
        </label>
        <input
          type="text"
          value={goal.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="Ex.: Priorizar fila >24h sem resposta e chamados sem técnico"
          className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59] dark:focus:border-[#2DD4BF]"
        />
      </div>
    </div>
  );
};
