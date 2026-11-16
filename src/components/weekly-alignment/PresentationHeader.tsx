import React from 'react';
import {
  CheckSquare,
  Handshake,
  LogOut,
  Moon,
  Save,
  Sun,
} from 'lucide-react';
import type { ThemeMode } from '../../types/ops';
import type { WeeklyStageId } from '../../types/weeklyAlignment';
import { FullscreenControl } from './FullscreenControl';

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const PresentationHeader: React.FC<{
  weekLabel: string;
  currentStage: WeeklyStageId;
  elapsedSeconds: number;
  lastIndicatorSync: string;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  status: 'Rascunho' | 'Finalizado';
  theme: ThemeMode;
  onToggleTheme: () => void;
  fullscreenTargetRef: React.RefObject<HTMLDivElement | null>;
  onOpenDecision: () => void;
  onOpenCommitment: () => void;
  onSaveDraft: () => void;
  onExit: () => void;
}> = ({
  weekLabel,
  currentStage,
  elapsedSeconds,
  lastIndicatorSync,
  hasUnsavedChanges,
  lastSavedAt,
  status,
  theme,
  onToggleTheme,
  fullscreenTargetRef,
  onOpenDecision,
  onOpenCommitment,
  onSaveDraft,
  onExit,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5 shrink-0">
      {/* Zona 1: Identificação institucional + Semana + Etapa */}
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <span className="font-display text-sm font-bold tracking-tight text-[#0F5E59] dark:text-[#2DD4BF] whitespace-nowrap">
          HEAL | Alinhamento Semanal
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
          {weekLabel}
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
          Etapa {currentStage}/7
        </span>
        <span className="hidden lg:inline text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
          · Sessão {formatElapsed(elapsedSeconds)} · Indicadores {lastIndicatorSync}
        </span>
        <span
          className={`hidden sm:inline text-[11px] font-mono whitespace-nowrap ${
            status === 'Finalizado'
              ? 'text-emerald-700 dark:text-emerald-400'
              : hasUnsavedChanges
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {status === 'Finalizado'
            ? '· Finalizado'
            : hasUnsavedChanges
              ? '· Alterações em edição'
              : lastSavedAt
                ? `· Salvo ${lastSavedAt}`
                : '· Sessão ao vivo'}
        </span>
      </div>

      {/* Zona 2: Controles rápidos de condução */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenDecision}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-2.5 py-1.5 text-xs font-medium text-white dark:text-slate-950 transition-colors whitespace-nowrap"
        >
          <CheckSquare size={13} />
          <span>Registrar Decisão</span>
        </button>

        <button
          type="button"
          onClick={onOpenCommitment}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <Handshake size={13} />
          <span>Adicionar Compromisso</span>
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <Save size={13} />
          <span>Salvar</span>
        </button>

        <FullscreenControl targetRef={fullscreenTargetRef} />

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          className="rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] p-1.5 text-slate-600 dark:text-slate-300 hover:border-[#0F5E59]"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <LogOut size={13} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};
