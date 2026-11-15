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
  const { dataMode, refreshTrigger, triggerRefresh, setActiveModule, pushToast } = useOps();

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
  }, [dataMode, refreshTrigger]);

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

  const handleExportCsv = () => {
    if (!activeReport) return;
    pushToast({
      title: 'Exportação aguardando backend analítico',
      description: `Na demonstração os dados não representam produção. O contrato de exportação oficial será servido pelo FastAPI (:3312) para "${activeReport.title}".`,
      tone: 'warning',
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
            const isSelected = activeReport?.id === item.id;
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
        {!activeReport ? (
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
                    {activeReport.group} · Janela {period === '7d' ? 'Últimos 7 dias' : period === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}
                  </div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    {activeReport.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {activeReport.summary}
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
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18222F]"
                  >
                    <Download size={13} />
                    <span>Exportar</span>
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
                      <strong>Fonte:</strong> {activeReport.origin}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Regra:</strong> {activeReport.definition}
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
                      {activeReport.doubleCountGuard}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[240px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {activeReport.chartType === 'line' ? (
                    <LineChart data={activeReport.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="primary"
                        name={activeReport.primaryLabel}
                        stroke="#0F5E59"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      {activeReport.secondaryLabel && (
                        <Line
                          type="monotone"
                          dataKey="secondary"
                          name={activeReport.secondaryLabel}
                          stroke="#D97706"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 2 }}
                        />
                      )}
                    </LineChart>
                  ) : (
                    <BarChart data={activeReport.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        dataKey="primary"
                        name={activeReport.primaryLabel}
                        fill="#0F5E59"
                        radius={[3, 3, 0, 0]}
                      />
                      {activeReport.secondaryLabel && (
                        <Bar
                          dataKey="secondary"
                          name={activeReport.secondaryLabel}
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
              <div className="border-b border-slate-200 dark:border-[#243242] px-4 py-2.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Detalhamento Analítico (Dados demonstrativos)
                </h3>
                <span className="font-mono text-[11px] text-slate-400">
                  {activeReport.rows.length} linha(s)
                </span>
              </div>
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
                  {activeReport.rows.map((r, i) => (
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
          </>
        )}
      </section>
    </div>
  );
};
