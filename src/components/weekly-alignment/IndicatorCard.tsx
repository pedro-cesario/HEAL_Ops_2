import React from 'react';
import { ArrowUpRight, ServerOff } from 'lucide-react';
import { SemanticLabel } from '../common/UiPrimitives';
import type { WeeklyIndicatorCardData } from '../../types/weeklyAlignment';

export const IndicatorCard: React.FC<{
  item: WeeklyIndicatorCardData;
  updatedAt: string;
  onClick: () => void;
}> = ({ item, updatedAt, onClick }) => {
  const isCritical = item.semantic === 'critical' && item.available;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col justify-between rounded-lg border p-3.5 text-left transition-colors ${
        !item.available
          ? 'border-slate-200 dark:border-[#243242] bg-slate-50/80 dark:bg-[#111923]/80'
          : isCritical
            ? 'border-red-300 dark:border-red-900/70 bg-white dark:bg-[#111923] hover:border-red-400'
            : 'border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
          {item.label}
        </span>
        {item.available ? (
          <ArrowUpRight
            size={14}
            className="shrink-0 text-slate-400 group-hover:text-[#0F5E59] dark:group-hover:text-[#2DD4BF]"
          />
        ) : (
          <ServerOff size={14} className="shrink-0 text-slate-400" />
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2 w-full">
        {item.available && item.value !== null ? (
          <span
            className={`font-mono text-2xl font-bold tabular-nums ${
              isCritical
                ? 'text-red-700 dark:text-red-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {item.value}
          </span>
        ) : (
          <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">
            Indisponível
          </span>
        )}

        {item.delta && item.available && (
          <span className="font-mono text-[11px] text-[#0F5E59] dark:text-[#2DD4BF] whitespace-nowrap">
            {item.delta}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 w-full text-[11px]">
        <SemanticLabel
          state={item.available ? item.semantic : 'unavailable'}
          label={item.subtitle}
          compact
        />
        <span className="font-mono tabular-nums text-slate-400 shrink-0">{updatedAt}</span>
      </div>
    </button>
  );
};
