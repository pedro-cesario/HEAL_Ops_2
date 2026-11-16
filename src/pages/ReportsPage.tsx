import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Info, Search, ShieldCheck } from 'lucide-react';
import {
  EmptyState,
  LoadingSkeletonGrid,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import { ReportsAdapter } from '../services/opsAdapters';
import type { ReportCatalogItem, ReportId } from '../types/ops';

export const ReportsPage: React.FC = () => {
  const {
    dataMode,
    triggerRefresh,
    setActiveModule,
    pushToast,
    theme,
    endpointConfig,
    computedTickets,
  } = useOps();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [catalog, setCatalog] = useState<ReportCatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState<ReportId>('abertos');
  const [groupFilter, setGroupFilter] = useState<string>('Todos');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(undefined);

    ReportsAdapter.fetchCatalog(dataMode).then((res) => {
      if (!active) return;
      if (res.errorMessage) {
        setErrorMessage(res.errorMessage);
        setCatalog([]);
      } else {
        setCatalog(res.data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [dataMode]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (groupFilter !== 'Todos' && item.group !== groupFilter) return false;
      if (!search.trim()) return true;
      return (
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.summary.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [catalog, groupFilter, search]);

  const activeReport = useMemo(
    () => catalog.find((r) => r.id === selectedId) || filteredCatalog[0] || null,
    [catalog, selectedId, filteredCatalog]
  );

  const periodComputedReport = useMemo(() => {
    if (!activeReport) return null;
    const factor = period === '7d' ? 0.28 : period === '30d' ? 1 : 2.75;
    const thresholdHours = Math.max(1, endpointConfig.staleTicketThresholdHours || 24);
    const basisLabel = endpointConfig.staleTicketTimeBasis === 'uteis' ? 'úteis' : 'corridas';

    const scaleNumber = (val: number, preserveSingleDigit = false) => {
      if (preserveSingleDigit && val <= 6) return val;
      return Math.max(1, Math.round(val * factor));
    };

    let chartData = activeReport.chartData.map((pt, idx) => {
      const pointName =
        period === '7d' && activeReport.chartType === 'line'
          ? `D-${activeReport.chartData.length - idx}`
          : period === '90d' && activeReport.chartType === 'line'
            ? `Mês/S${idx + 1}`
            : pt.name;
      return {
        ...pt,
        name: pointName,
        primary: scaleNumber(pt.primary, activeReport.id === 'sem_tecnico' || activeReport.id === 'sem_atualizacao'),
        secondary:
          typeof pt.secondary === 'number'
            ? scaleNumber(pt.secondary, activeReport.id === 'sem_tecnico')
            : undefined,
      };
    });

    let rows = activeReport.rows.map((r) => ({
      ...r,
      count: scaleNumber(r.count, activeReport.id === 'sem_tecnico' || activeReport.id === 'sem_atualizacao'),
      note: period === '30d' ? r.note : `${r.note} (recorte demonstrativo ${period})`,
    }));

    if (activeReport.id === 'sem_atualizacao') {
      const staleNow = computedTickets.filter((t) => t.hoursWithoutUpdate > thresholdHours);
      const bucket1 = staleNow.filter((t) => t.hoursWithoutUpdate <= thresholdHours * 1.5).length;
      const bucket2 = staleNow.filter(
        (t) => t.hoursWithoutUpdate > thresholdHours * 1.5 && t.hoursWithoutUpdate <= thresholdHours * 2
      ).length;
      const bucket3 = staleNow.filter((t) => t.hoursWithoutUpdate > thresholdHours * 2).length;
      const windowScale = period === '7d' ? 1 : period === '30d' ? 1 : 2;
      chartData = [
        { name: `${thresholdHours}h–${Math.round(thresholdHours * 1.5)}h`, primary: bucket1 * windowScale, secondary: undefined },
        { name: `${Math.round(thresholdHours * 1.5) + 1}h–${thresholdHours * 2}h`, primary: bucket2 * windowScale, secondary: undefined },
        { name: `>${thresholdHours * 2}h`, primary: bucket3 * windowScale, secondary: undefined },
      ];
      const totalStale = staleNow.length || 1;
      rows = [
        {
          label: `Faixa ${thresholdHours}h–${Math.round(thresholdHours * 1.5)}h sem interação`,
          count: bucket1 * windowScale,
          share: `${Math.round((bucket1 / totalStale) * 100)}%`,
          avgHours: `${Math.round(thresholdHours * 1.25)}h`,
          note: `Calculado ao vivo pela regra > ${thresholdHours}h ${basisLabel} (${period})`,
        },
        {
          label: `Faixa ${Math.round(thresholdHours * 1.5) + 1}h–${thresholdHours * 2}h`,
          count: bucket2 * windowScale,
          share: `${Math.round((bucket2 / totalStale) * 100)}%`,
          avgHours: `${Math.round(thresholdHours * 1.75)}h`,
          note: `Acompanhamento com referência da macroárea (${period})`,
        },
        {
          label: `Acima de ${thresholdHours * 2}h críticas`,
          count: bucket3 * windowScale,
          share: `${Math.round((bucket3 / totalStale) * 100)}%`,
          avgHours: `${Math.round(thresholdHours * 2.5)}h`,
          note: `Prioridade imediata em Daily TPL-01 e TPL-02 (${period})`,
        },
      ];
    }

    return {
      ...activeReport,
      chartData,
      rows,
    };
  }, [activeReport, period, endpointConfig, computedTickets]);

  const handleExportCsv = () => {
    if (!periodComputedReport) return;
    const csvEscape = (value: string | number) => {
      const str = String(value ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines = [
      `# HEAL Ops 2.0 - Exportacao Local (BASE DEMONSTRATIVA / SESSAO)`,
      `# Relatorio: ${periodComputedReport.title} | Janela: ${period} | Fonte oficial pendente: FastAPI (:3312)`,
      ['Dimensao', 'Quantidade', 'Participacao', 'Tempo Medio', 'Observacao Operacional'].map(csvEscape).join(';'),
      ...periodComputedReport.rows.map((r) =>
        [r.label, r.count, r.share, r.avgHours, r.note].map(csvEscape).join(';')
      ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heal-ops-demo-${periodComputedReport.id}-${period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    pushToast({
      title: 'CSV demonstrativo exportado localmente',
      description: `Arquivo gerado a partir da base demonstrativa (${period}). A exportação oficial de produção depende do FastAPI (:3312).`,
      tone: 'info',
    });
  };

  if (loading) return <LoadingSkeletonGrid rows={5} />;

  if (errorMessage) {
    return (
      <UnavailableState
        title="Catálogo de relatórios indisponível"
        description={errorMessage}
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
      {/* Left Catalog Sidebar (4 cols) */}
      <aside className="lg:col-span-4 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] flex flex-col max-h-[calc(100vh-120px)]">
        <div className="border-b border-slate-200 dark:border-[#243242] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Catálogo de Relatórios ({catalog.length})
            </h2>
            <span className="font-mono text-[11px] text-slate-400">
              {dataMode === 'demo' ? 'Demo' : dataMode}
            </span>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar relatório..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0F5E59]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {['Todos', 'Fluxo de Chamados', 'Distribuição', 'Qualidade & POP', 'Tendência'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  groupFilter === g
                    ? 'bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-[#18222F] text-slate-600 dark:text-slate-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1D2836]">
          {filteredCatalog.map((item) => {
            const isSelected = periodComputedReport?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`block w-full px-3.5 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-[#0F5E59]/8 dark:bg-[#2DD4BF]/10'
                    : 'hover:bg-slate-50 dark:hover:bg-[#18222F]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected
                        ? 'text-[#0F5E59] dark:text-[#2DD4BF]'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.group}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {item.summary}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Analytical Detail (8 cols) */}
      <section className="lg:col-span-8 space-y-3.5">
        {!periodComputedReport ? (
          <EmptyState
            title="Selecione um relatório"
            description="Escolha um indicador no catálogo ao lado para visualizar gráficos, definição e drilldown."
          />
        ) : (
          <>
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF]">
                    {periodComputedReport.group} · Janela {period === '7d' ? 'Últimos 7 dias' : period === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}
                  </div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    {periodComputedReport.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {periodComputedReport.id === 'sem_atualizacao'
                      ? `Tickets ativos sem interação válida acima de ${endpointConfig.staleTicketThresholdHours}h ${endpointConfig.staleTicketTimeBasis} (regra gerencial parametrizável).`
                      : periodComputedReport.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-md bg-slate-100 dark:bg-[#18222F] p-0.5 text-xs">
                    {(['7d', '30d', '90d'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriod(p)}
                        className={`rounded px-2 py-1 font-mono text-[11px] font-medium ${
                          period === p
                            ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18222F] whitespace-nowrap"
                  >
                    <Download size={13} />
                    <span>Exportar CSV (Demo)</span>
                  </button>
                </div>
              </div>

              {/* Explicit Origin, Definition & Anti-Double-Counting Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 text-[11px]">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-[#0F5E59] dark:text-[#2DD4BF] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Origem e Definição
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Fonte:</strong> {periodComputedReport.origin}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Regra:</strong> {periodComputedReport.definition}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Integridade de Contagem
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {periodComputedReport.doubleCountGuard}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[240px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {periodComputedReport.chartType === 'line' ? (
                    <LineChart data={periodComputedReport.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#111923' : '#FFFFFF',
                          borderColor: theme === 'dark' ? '#243242' : '#E2E8F0',
                          color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
                          fontSize: '12px',
                          borderRadius: '6px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="primary"
                        name={periodComputedReport.primaryLabel}
                        stroke={theme === 'dark' ? '#2DD4BF' : '#0F5E59'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      {periodComputedReport.secondaryLabel && (
                        <Line
                          type="monotone"
                          dataKey="secondary"
                          name={periodComputedReport.secondaryLabel}
                          stroke="#D97706"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 2 }}
                        />
                      )}
                    </LineChart>
                  ) : (
                    <BarChart data={periodComputedReport.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#111923' : '#FFFFFF',
                          borderColor: theme === 'dark' ? '#243242' : '#E2E8F0',
                          color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
                          fontSize: '12px',
                          borderRadius: '6px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        dataKey="primary"
                        name={periodComputedReport.primaryLabel}
                        fill={theme === 'dark' ? '#2DD4BF' : '#0F5E59'}
                        radius={[3, 3, 0, 0]}
                      />
                      {periodComputedReport.secondaryLabel && (
                        <Bar
                          dataKey="secondary"
                          name={periodComputedReport.secondaryLabel}
                          fill="#64748B"
                          radius={[3, 3, 0, 0]}
                        />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drilldown Table */}
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] overflow-hidden">
              <div className="border-b border-slate-200 dark:border-[#243242] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Detalhamento Analítico (Dados demonstrativos · Exportação oficial dependente de backend)
                </h3>
                <span className="font-mono text-[11px] text-slate-400">
                  {periodComputedReport.rows.length} linha(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Dimensão</th>
                    <th className="px-4 py-2 font-semibold text-right">Quantidade</th>
                    <th className="px-4 py-2 font-semibold text-right">Participação</th>
                    <th className="px-4 py-2 font-semibold text-right">Tempo Médio</th>
                    <th className="px-4 py-2 font-semibold">Observação operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1D2836]">
                  {periodComputedReport.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50">
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {r.label}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">{r.count}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {r.share}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {r.avgHours}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
