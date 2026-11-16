import React, { useMemo, useState } from 'react';
import { Check, Edit3, Plus, Search } from 'lucide-react';
import type { TicketItem } from '../../types/ops';
import type { AlignmentPriorityItem } from '../../types/weeklyAlignment';

export const TicketTable: React.FC<{
  tickets: TicketItem[];
  priorities: AlignmentPriorityItem[];
  onPrioritize: (ticket: TicketItem) => void;
}> = ({ tickets, priorities, onPrioritize }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [techFilter, setTechFilter] = useState('Todos');
  const [macroFilter, setMacroFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const statusOptions = useMemo(
    () => ['Todos', ...Array.from(new Set(tickets.map((t) => t.status)))],
    [tickets]
  );
  const techOptions = useMemo(
    () => ['Todos', 'Sem técnico', ...Array.from(new Set(tickets.map((t) => t.techName).filter(Boolean) as string[]))],
    [tickets]
  );
  const macroOptions = useMemo(
    () => ['Todas', ...Array.from(new Set(tickets.map((t) => t.macroArea)))],
    [tickets]
  );
  const categoryOptions = useMemo(
    () => ['Todas', ...Array.from(new Set(tickets.map((t) => t.category)))],
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'Todos' && t.status !== statusFilter) return false;
      if (techFilter === 'Sem técnico' && t.techName !== null) return false;
      if (techFilter !== 'Todos' && techFilter !== 'Sem técnico' && t.techName !== techFilter) return false;
      if (macroFilter !== 'Todas' && t.macroArea !== macroFilter) return false;
      if (categoryFilter !== 'Todas' && t.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return String(t.id).includes(q) || t.title.toLowerCase().includes(q);
    });
  }, [tickets, statusFilter, techFilter, macroFilter, categoryFilter, search]);

  const limitReached = priorities.length >= 5;

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] h-full overflow-hidden">
      <div className="border-b border-slate-200 dark:border-[#243242] px-3.5 py-2.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Chamados Disponíveis
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Selecione chamados ativos durante a reunião para compor a carteira semanal
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {filteredTickets.length} de {tickets.length}
          </span>
        </div>

        {/* Busca + 4 Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 text-xs">
          <div className="relative sm:col-span-4">
            <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nº ou título..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] pl-7 pr-2.5 py-1.5 text-xs"
            />
          </div>

          <select
            aria-label="Filtrar por status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:col-span-2 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 text-xs"
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st === 'Todos' ? 'Status: Todos' : st}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por técnico"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="sm:col-span-2 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 text-xs"
          >
            {techOptions.map((tc) => (
              <option key={tc} value={tc}>
                {tc === 'Todos' ? 'Técnico: Todos' : tc}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por macroárea"
            value={macroFilter}
            onChange={(e) => setMacroFilter(e.target.value)}
            className="sm:col-span-2 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 text-xs"
          >
            {macroOptions.map((ma) => (
              <option key={ma} value={ma}>
                {ma === 'Todas' ? 'Área: Todas' : ma}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por categoria"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sm:col-span-2 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 text-xs"
          >
            {categoryOptions.map((ct) => (
              <option key={ct} value={ct}>
                {ct === 'Todas' ? 'Cat.: Todas' : ct}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela compacta */}
      <div className="flex-1 overflow-auto max-h-[430px] lg:max-h-[calc(100vh-270px)]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18222F] border-b border-slate-200 dark:border-[#243242] text-[11px] text-slate-500 uppercase">
            <tr>
              <th className="py-2 px-3">Nº</th>
              <th className="py-2 px-2">Chamado</th>
              <th className="py-2 px-2 hidden sm:table-cell">Status</th>
              <th className="py-2 px-2 hidden md:table-cell">Técnico</th>
              <th className="py-2 px-2 hidden xl:table-cell">Macroárea</th>
              <th className="py-2 px-2 hidden lg:table-cell">Atualização</th>
              <th className="py-2 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1D2836]">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Nenhum chamado disponível para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const prioritized = priorities.find((p) => p.ticketId === t.id);
                const isClosed = t.status === 'Fechado' || t.status === 'Solucionado';
                const blockedNew = !prioritized && (isClosed || limitReached);

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-[#18222F]/60 transition-colors ${
                      prioritized ? 'bg-[#0F5E59]/[0.04] dark:bg-[#2DD4BF]/[0.05]' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      #{t.id}
                    </td>
                    <td className="py-2 px-2 max-w-[260px]">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate" title={t.title}>
                        {t.title}
                      </div>
                      <div className="sm:hidden text-[11px] text-slate-500">
                        {t.status} · {t.techName || 'Sem técnico'}
                      </div>
                    </td>
                    <td className="py-2 px-2 hidden sm:table-cell whitespace-nowrap">
                      <span
                        className={
                          t.isPopNonCompliant
                            ? 'font-medium text-red-700 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 hidden md:table-cell whitespace-nowrap">
                      <span className={t.techName ? 'text-slate-700 dark:text-slate-300' : 'text-red-700 dark:text-red-400 font-medium'}>
                        {t.techName || 'Sem técnico'}
                      </span>
                    </td>
                    <td className="py-2 px-2 hidden xl:table-cell text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t.macroArea}
                    </td>
                    <td className="py-2 px-2 hidden lg:table-cell font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {t.lastUpdatedAt}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {prioritized ? (
                        <button
                          type="button"
                          onClick={() => onPrioritize(t)}
                          className="inline-flex items-center gap-1 rounded border border-[#0F5E59] dark:border-[#2DD4BF] px-2 py-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:bg-[#0F5E59]/10 whitespace-nowrap"
                        >
                          <Check size={11} />
                          <span>Editar ({prioritized.order}º)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={blockedNew}
                          title={
                            isClosed
                              ? 'Chamados fechados ou solucionados não podem entrar como prioridade'
                              : limitReached
                                ? 'Limite de 5 prioridades atingido'
                                : 'Adicionar à carteira semanal'
                          }
                          onClick={() => onPrioritize(t)}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                            blockedNew
                              ? 'border border-slate-200 dark:border-[#243242] text-slate-400 opacity-50 cursor-not-allowed'
                              : 'bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] text-white dark:text-slate-950'
                          }`}
                        >
                          {isClosed ? <Edit3 size={11} className="hidden" /> : <Plus size={11} />}
                          <span>{isClosed ? 'Encerrado' : '+ Priorizar'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
