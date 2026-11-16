import React from 'react';
import { ArrowDown, ArrowUp, Edit2, Trash2, UserCheck, Users } from 'lucide-react';
import type { AlignmentPriorityItem } from '../../types/weeklyAlignment';

export const PriorityCard: React.FC<{
  item: AlignmentPriorityItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ item, isFirst, isLast, onEdit, onRemove, onMoveUp, onMoveDown }) => {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50/70 dark:bg-[#18222F] p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="font-bold text-[#0F5E59] dark:text-[#2DD4BF]">
              P{item.order}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              #{item.ticketId}
            </span>
            <span aria-hidden="true">·</span>
            <span>{item.macroArea}</span>
            <span aria-hidden="true">·</span>
            <span>Prazo {item.dueDate || '—'}</span>
          </div>
          <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {item.ticketTitle}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label="Subir prioridade"
            title="Subir prioridade"
            className="rounded p-1 text-slate-500 hover:bg-white dark:hover:bg-[#111923] disabled:opacity-30"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            aria-label="Descer prioridade"
            title="Descer prioridade"
            className="rounded p-1 text-slate-500 hover:bg-white dark:hover:bg-[#111923] disabled:opacity-30"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar prioridade"
            title="Editar responsável, apoio ou prazo"
            className="rounded p-1 text-[#0F5E59] dark:text-[#2DD4BF] hover:bg-white dark:hover:bg-[#111923]"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remover prioridade"
            title="Remover da carteira"
            className="rounded p-1 text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-[#111923]"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-700 dark:text-slate-300">
        <span className="inline-flex items-center gap-1 font-medium">
          <UserCheck size={12} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
          <span>Resp.: {item.primaryOwnerName}</span>
        </span>
        {item.supportTechName && (
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Users size={12} />
            <span>Apoio: {item.supportTechName}</span>
          </span>
        )}
      </div>

      {item.nextAction && (
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
          <strong>Próxima ação:</strong> {item.nextAction}
        </p>
      )}
    </div>
  );
};
