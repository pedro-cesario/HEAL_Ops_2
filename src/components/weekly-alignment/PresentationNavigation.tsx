import React from 'react';
import { ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react';
import { WEEKLY_ALIGNMENT_STAGES, type WeeklyStageId } from '../../types/weeklyAlignment';

export const PresentationNavigation: React.FC<{
  currentStage: WeeklyStageId;
  freeMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFreeMode: () => void;
  onSelectStage: (stage: WeeklyStageId) => void;
}> = ({
  currentStage,
  freeMode,
  onPrev,
  onNext,
  onToggleFreeMode,
  onSelectStage,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#243242] bg-white/95 dark:bg-[#111923]/95 px-4 py-2 shrink-0">
      {/* Stepper visual das 7 etapas */}
      <nav aria-label="Etapas do Alinhamento Semanal" className="flex items-center gap-1 overflow-x-auto">
        {WEEKLY_ALIGNMENT_STAGES.map((st) => {
          const active = !freeMode && currentStage === st.id;
          const completed = st.id < currentStage;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStage(st.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950'
                  : completed
                    ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF] hover:bg-[#0F5E59]/15'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18222F]'
              }`}
            >
              <span className="font-mono text-[11px] tabular-nums">{st.id}.</span>
              <span className="hidden md:inline">{st.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Botões Anterior, Modo Livre e Próximo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleFreeMode}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            freeMode
              ? 'border-[#0F5E59] bg-[#0F5E59]/10 text-[#0F5E59] dark:border-[#2DD4BF] dark:bg-[#2DD4BF]/15 dark:text-[#2DD4BF]'
              : 'border-slate-200 dark:border-[#243242] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18222F]'
          }`}
        >
          <LayoutGrid size={13} />
          <span>{freeMode ? 'Voltar à etapa' : 'Modo Livre'}</span>
        </button>

        <button
          type="button"
          disabled={currentStage === 1 && !freeMode}
          onClick={onPrev}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18222F] disabled:opacity-40 whitespace-nowrap"
        >
          <ArrowLeft size={13} />
          <span>Anterior</span>
        </button>

        <button
          type="button"
          disabled={currentStage === 7 && !freeMode}
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 disabled:opacity-40 whitespace-nowrap"
        >
          <span>Próximo</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
