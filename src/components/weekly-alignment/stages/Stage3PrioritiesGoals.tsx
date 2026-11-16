import React from 'react';
import { ListChecks } from 'lucide-react';
import type { TicketItem } from '../../../types/ops';
import type {
  AlignmentPriorityItem,
  WeeklyGoalDraft,
} from '../../../types/weeklyAlignment';
import type { CollaboratorOption } from '../TeamMemberSelector';
import { GoalEditor } from '../GoalEditor';
import { PriorityCard } from '../PriorityCard';
import { TicketTable } from '../TicketTable';

export const Stage3PrioritiesGoals: React.FC<{
  tickets: TicketItem[];
  priorities: AlignmentPriorityItem[];
  weeklyGoal: WeeklyGoalDraft;
  eligibleBacklogCount: number;
  collaborators: CollaboratorOption[];
  onPrioritizeTicket: (ticket: TicketItem) => void;
  onEditPriority: (priority: AlignmentPriorityItem) => void;
  onRemovePriority: (priorityId: string) => void;
  onReorderPriority: (priorityId: string, direction: 'up' | 'down') => void;
  onUpdateGoal: (patch: Partial<WeeklyGoalDraft>) => void;
}> = ({
  tickets,
  priorities,
  weeklyGoal,
  eligibleBacklogCount,
  collaborators,
  onPrioritizeTicket,
  onEditPriority,
  onRemovePriority,
  onReorderPriority,
  onUpdateGoal,
}) => {
  const emptySlots = Math.max(0, 5 - priorities.length);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      {/* Coluna Esquerda: Chamados disponíveis com busca e 4 filtros */}
      <div className="lg:col-span-7">
        <TicketTable
          tickets={tickets}
          priorities={priorities}
          onPrioritize={onPrioritizeTicket}
        />
      </div>

      {/* Coluna Direita: Prioridades da Semana (X/5) + Meta da Semana */}
      <div className="lg:col-span-5 space-y-3">
        {/* Bloco 1: Prioridades da Semana (até 5) */}
        <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-[#243242] bg-[#0F5E59]/10 dark:bg-[#2DD4BF]/10 text-[#0F5E59] dark:text-[#2DD4BF]">
                <ListChecks size={14} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Prioridades da Semana
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selecione até 5 chamados críticos com dono e prazo
                </p>
              </div>
            </div>
            <span
              className={`font-mono text-sm font-bold tabular-nums whitespace-nowrap ${
                priorities.length >= 5
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-[#0F5E59] dark:text-[#2DD4BF]'
              }`}
            >
              {priorities.length}/5
            </span>
          </div>

          <div className="space-y-2">
            {priorities.map((item, idx) => (
              <PriorityCard
                key={item.id}
                item={item}
                isFirst={idx === 0}
                isLast={idx === priorities.length - 1}
                onMoveUp={() => onReorderPriority(item.id, 'up')}
                onMoveDown={() => onReorderPriority(item.id, 'down')}
                onEdit={() => onEditPriority(item)}
                onRemove={() => onRemovePriority(item.id)}
              />
            ))}

            {emptySlots > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Array.from({ length: emptySlots }).map((_, idx) => {
                  const slotNumber = priorities.length + idx + 1;
                  return (
                    <div
                      key={slotNumber}
                      className="flex items-center justify-between rounded-md border border-dashed border-slate-200 dark:border-[#243242] bg-slate-50/50 dark:bg-[#18222F]/40 px-2.5 py-2 text-[11px] text-slate-400 dark:text-slate-500"
                    >
                      <span className="font-mono font-semibold">Vaga P{slotNumber}</span>
                      <span>Disponível à esquerda</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Bloco 2: Meta da Semana */}
        <GoalEditor
          goal={weeklyGoal}
          eligibleBacklogCount={eligibleBacklogCount}
          collaborators={collaborators}
          onChange={onUpdateGoal}
        />
      </div>
    </div>
  );
};
