import React, { useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  ServerOff,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { OperationalSemanticState } from '../../types/ops';

export const SemanticLabel: React.FC<{
  state: OperationalSemanticState;
  label: string;
  compact?: boolean;
}> = ({ state, label, compact = false }) => {
  const iconSize = compact ? 13 : 14;
  if (state === 'nominal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={iconSize} className="shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (state === 'attention') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <AlertTriangle size={iconSize} className="shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (state === 'critical') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
        <AlertCircle size={iconSize} className="shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (state === 'unavailable') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <ServerOff size={iconSize} className="shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
      <Info size={iconSize} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
};

export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  widthClass?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, widthClass = 'max-w-2xl', headerActions, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />
      <aside
        className={`relative z-10 flex h-full w-full ${widthClass} flex-col bg-white dark:bg-[#111923] border-l border-slate-200 dark:border-[#243242] shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-[#243242] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
};

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, maxWidthClass = 'max-w-xl', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidthClass} max-h-[88vh] flex flex-col rounded-lg bg-white dark:bg-[#111923] border border-slate-200 dark:border-[#243242] shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-[#243242] px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export const UnavailableState: React.FC<{
  title: string;
  description: string;
  onRetry?: () => void;
  onConfigure?: () => void;
  configureLabel?: string;
}> = ({ title, description, onRetry, onConfigure, configureLabel = 'Abrir Configurações' }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] text-slate-500 dark:text-slate-400">
        <ServerOff size={20} />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-2 text-xs font-medium text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw size={14} />
            <span>Tentar novamente</span>
          </button>
        )}
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal size={14} />
            <span>{configureLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-[#243242] px-6 py-8 text-center">
    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
    <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-3 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const LoadingSkeletonGrid: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-2.5" aria-busy="true" aria-label="Carregando dados operacionais">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="h-12 w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-100/80 dark:bg-[#18222F]/70 animate-pulse"
      />
    ))}
  </div>
);
