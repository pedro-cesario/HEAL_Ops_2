import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, RefreshCw } from 'lucide-react';
import { UnavailableState } from '../../common/UiPrimitives';
import { useOps } from '../../../context/OpsContext';
import type { ExternalWeeklyOpsSnapshot } from '../../../services/weeklyAlignmentAdapter';
import type { WeeklyIndicatorCardData } from '../../../types/weeklyAlignment';
import { IndicatorCard } from '../IndicatorCard';

export const Stage2Indicators: React.FC<{
  snapshot: ExternalWeeklyOpsSnapshot;
  onSelectIndicator: (item: WeeklyIndicatorCardData) => void;
}> = ({ snapshot, onSelectIndicator }) => {
  const { theme, triggerRefresh, setActiveModule } = useOps();
  const isDark = theme === 'dark';

  if (!snapshot.available && snapshot.indicators.every((i) => !i.available)) {
    return (
      <div className="space-y-4">
        <UnavailableState
          title="Indicadores operacionais indisponíveis"
          description="Sem conexão com o backend FastAPI/GLPI para leitura dos KPIs semanais. Você pode avançar para as demais etapas da reunião sem perder edições ou tentar reconectar."
          onRetry={triggerRefresh}
          onConfigure={() => setActiveModule('configuracoes')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Barra contextual de leitura silenciosa */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <BarChart3 size={14} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
          <span>
            Clique em qualquer indicador para abrir os chamados correspondentes e priorizá-los diretamente durante a reunião.
          </span>
        </div>
        <button
          type="button"
          onClick={triggerRefresh}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline whitespace-nowrap"
        >
          <RefreshCw size={12} />
          <span>Sincronizado silenciosamente · {snapshot.fetchedAt}</span>
        </button>
      </div>

      {/* Grade dos 8 Indicadores Operacionais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {snapshot.indicators.map((ind) => (
          <IndicatorCard
            key={ind.key}
            item={ind}
            updatedAt={snapshot.fetchedAt}
            onClick={() => onSelectIndicator(ind)}
          />
        ))}
      </div>

      {/* Gráfico de Evolução Semanal */}
      <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Evolução Semanal de Vazão e Backlog
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Comparativo das últimas 4 semanas entre chamados abertos, concluídos e meta operacional
            </p>
          </div>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Unidade: chamados/semana
          </span>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={snapshot.evolution}
              margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#243242' : '#E2E8F0'}
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fill: isDark ? '#94A3B8' : '#475569', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#243242' : '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: isDark ? '#94A3B8' : '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#111923' : '#FFFFFF',
                  borderColor: isDark ? '#243242' : '#CBD5E1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar
                dataKey="abertos"
                name="Backlog Aberto"
                fill={isDark ? '#64748B' : '#94A3B8'}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="concluidos"
                name="Concluídos na Semana"
                fill={isDark ? '#2DD4BF' : '#0F5E59'}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="meta"
                name="Alvo Semanal"
                fill={isDark ? '#F59E0B' : '#D97706'}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
