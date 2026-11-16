import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  FileSpreadsheet,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { DailyAlignmentDraft } from '../../../types/dailyAlignment';
import type { OperationalKpi, TicketFilterKey, WeeklyBaselineSnapshot } from '../../../types/ops';

export const DailyStage1Evolution: React.FC<{
  draft: DailyAlignmentDraft;
  baseline: WeeklyBaselineSnapshot;
  currentActiveCount: number;
  kpis: OperationalKpi[];
  onUpdateHandoverNote: (text: string) => void;
  onJumpToCriticalQueue: () => void;
  onOpenTicketDrawer: (filter: TicketFilterKey) => void;
}> = ({
  draft,
  baseline,
  currentActiveCount,
  kpis,
  onUpdateHandoverNote,
  onJumpToCriticalQueue,
  onOpenTicketDrawer,
}) => {
  const deltaAbsolute = currentActiveCount - baseline.initialActiveCount;
  const deltaPercent =
    baseline.initialActiveCount > 0
      ? (deltaAbsolute / baseline.initialActiveCount) * 100
      : 0;
  const formattedDeltaAbs = `${deltaAbsolute > 0 ? '+' : ''}${deltaAbsolute}`;
  const formattedDeltaPct = `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1).replace('.', ',')}%`;

  const netReduction = Math.max(0, baseline.initialActiveCount - currentActiveCount);
  const goalProgressPercent =
    baseline.weeklyGoalTargetCount > 0
      ? Math.min(100, Math.round((netReduction / baseline.weeklyGoalTargetCount) * 100))
      : 0;

  const popKpi = kpis.find((k) => k.key === 'sem_tecnico_pop');
  const staleKpi = kpis.find((k) => k.key === 'sem_atualizacao');
  const popNonCompliant = popKpi?.popSummary?.popNonCompliant ?? 0;
  const staleCount = Number(staleKpi?.value ?? 0);

  const executiveSummary =
    deltaAbsolute < 0
      ? `Iniciamos a semana em ${baseline.alignmentDate} com ${baseline.initialActiveCount} chamados ativos. Desde então, entraram ${baseline.openedSinceAlignment} novos chamados e foram encerrados ${baseline.closedSinceAlignment}, levando a carteira atual para ${currentActiveCount} ativos (${formattedDeltaAbs} líquidos · ${formattedDeltaPct}). Progresso de ${goalProgressPercent}% frente à meta semanal de redução de ${baseline.weeklyGoalTargetCount} chamados; atenção imediata para ${popNonCompliant} item(ns) POP sem técnico e ${staleCount} sem atualização.`
      : deltaAbsolute === 0
        ? `A carteira ativa permanece estável em ${currentActiveCount} chamados (${baseline.openedSinceAlignment} aberturas compensadas por ${baseline.closedSinceAlignment} encerramentos). Necessário acelerar tratativa da Fila Crítica para avançar na meta de redução semanal (${baseline.weeklyGoalTargetCount} chamados).`
        : `A carteira ativa subiu de ${baseline.initialActiveCount} para ${currentActiveCount} chamados (${formattedDeltaAbs} · ${formattedDeltaPct}), pois houve ${baseline.openedSinceAlignment} aberturas contra ${baseline.closedSinceAlignment} encerramentos. Priorizar desbloqueio da Fila Crítica e redistribuição das macroáreas.`;

  return (
    <div className="space-y-3">
      {/* Banner Pergunta Central */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-3">
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wide text-[#0F5E59] dark:text-[#2DD4BF]">
            Comparativo Congelado TPL-02 → Daily Atual
          </div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            Como começamos a semana e como estamos agora?
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onOpenTicketDrawer('abertos')}
            className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 hover:border-[#0F5E59]"
          >
            <FileSpreadsheet size={13} />
            <span>Ver carteira ativa ({currentActiveCount})</span>
          </button>
          <button
            type="button"
            onClick={onJumpToCriticalQueue}
            className="inline-flex items-center gap-1 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 font-medium text-white dark:text-slate-950"
          >
            <span>Ir para Fila Crítica</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 4 Cards Comparativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Início da Semana (Snapshot Congelado TPL-02) */}
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">Início da Semana (TPL-02)</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <Calendar size={11} />
              {baseline.alignmentDate}
            </span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {baseline.initialActiveCount} ativos
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Snapshot congelado do Alinhamento Semanal (não recalculado retroativamente).
          </p>
        </div>

        {/* Daily Atual */}
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">Daily Atual</span>
            <span className="font-mono">{draft.date}</span>
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-[#0F5E59] dark:text-[#2DD4BF]">
            {currentActiveCount} ativos
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
              <ArrowUpRight size={12} />+{baseline.openedSinceAlignment} abertos
            </span>
            <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400">
              <ArrowDownRight size={12} />-{baseline.closedSinceAlignment} encerrados
            </span>
          </div>
        </div>

        {/* Variação Líquida (Nunca igualada a encerrados) */}
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">Variação Líquida do Backlog</span>
            {deltaAbsolute <= 0 ? (
              <TrendingDown size={14} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingUp size={14} className="text-red-600 dark:text-red-400" />
            )}
          </div>
          <div
            className={`font-mono text-2xl font-bold tabular-nums ${
              deltaAbsolute < 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : deltaAbsolute === 0
                  ? 'text-slate-800 dark:text-slate-200'
                  : 'text-red-700 dark:text-red-400'
            }`}
          >
            {formattedDeltaAbs} ({formattedDeltaPct})
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Saldo entre entradas (+{baseline.openedSinceAlignment}) e encerramentos (-{baseline.closedSinceAlignment}) na semana.
          </p>
        </div>

        {/* Meta Semanal & Progresso */}
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium">
              <Target size={12} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
              Meta Semanal ({baseline.weeklyGoalReductionPercent}%)
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {netReduction}/{baseline.weeklyGoalTargetCount}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {goalProgressPercent}%
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Alvo até {baseline.weeklyGoalDueDate}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-[#0F5E59] dark:bg-[#2DD4BF] transition-all"
              style={{ width: `${goalProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Resumo Executivo Automático + Nota de Passagem de Turno */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <section className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Resumo Executivo Automático da Evolução
            </h3>
            <span className="font-mono text-[11px] text-slate-400">Base conciliada</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {executiveSummary}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => onOpenTicketDrawer('sem_tecnico_pop')}
              className="rounded border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 px-2.5 py-2 text-left hover:border-red-400"
            >
              <div className="flex items-center gap-1 text-[11px] font-medium text-red-700 dark:text-red-300">
                <AlertTriangle size={12} />
                <span>POP sem técnico</span>
              </div>
              <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-red-800 dark:text-red-200">
                {popNonCompliant} chamado(s)
              </div>
            </button>
            <button
              type="button"
              onClick={() => onOpenTicketDrawer('sem_atualizacao')}
              className="rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 px-2.5 py-2 text-left hover:border-amber-400"
            >
              <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Sem atualização (regra)
              </div>
              <div className="mt-0.5 font-mono text-base font-bold tabular-nums text-amber-800 dark:text-amber-200">
                {staleCount} chamado(s)
              </div>
            </button>
            <div className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2">
              <div className="text-[11px] font-medium text-slate-500">Responsável Meta</div>
              <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {baseline.weeklyGoalOwnerName}
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Nota Rápida de Abertura / Passagem de Turno
            </h3>
            <span className="text-[11px] font-mono text-[#0F5E59] dark:text-[#2DD4BF]">
              Editável ao vivo
            </span>
          </div>
          <textarea
            rows={4}
            value={draft.shiftHandoverNote}
            onChange={(e) => onUpdateHandoverNote(e.target.value)}
            placeholder="Registre ocorrências do plantão noturno ou observações iniciais da Daily..."
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Presença da equipe disponível no botão <strong>Check-in</strong> no cabeçalho superior.
          </p>
        </section>
      </div>
    </div>
  );
};
