import React, { useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, Filter, UserCheck } from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import { GlpiAdapter } from '../../services/opsAdapters';
import type { TicketFilterKey, TicketItem } from '../../types/ops';
import { Drawer, EmptyState, SemanticLabel } from './UiPrimitives';

function getFilterLabel(filter: TicketFilterKey | null, thresholdHours: number, basis: 'corridas' | 'uteis'): string {
  if (!filter) return 'Detalhamento de Chamados';
  const basisLabel = basis === 'uteis' ? 'úteis' : 'corridas';
  const labels: Record<TicketFilterKey, string> = {
    abertos: 'Chamados abertos',
    novos: 'Chamados novos',
    em_atendimento: 'Em atendimento',
    em_andamento: 'Em andamento (execução programada)',
    sem_tecnico: 'Sem técnico nominal',
    sem_tecnico_pop: 'Sem técnico · Desconformidade POP',
    sem_atualizacao: `Sem atualização (> ${thresholdHours}h ${basisLabel} · ref.)`,
    pendentes: 'Pendentes',
    tempo_medio: 'Amostra de tempo médio',
  };
  return labels[filter];
}

export const TicketDrawer: React.FC<{
  tickets: TicketItem[];
}> = ({ tickets }) => {
  const {
    activeTicketDrawerFilter,
    closeTicketDrawer,
    openTicketDrawer,
    endpointConfig,
    dataMode,
    setActiveModule,
  } = useOps();
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyPopNonCompliant, setOnlyPopNonCompliant] = useState(false);

  const effectiveFilter = activeTicketDrawerFilter;

  const filteredTickets = useMemo(() => {
    if (!effectiveFilter) return [];
    return tickets.filter((ticket) => {
      const matchesFilter =
        effectiveFilter === 'sem_tecnico' && onlyPopNonCompliant
          ? ticket.inclusionReasons.includes('sem_tecnico_pop')
          : ticket.inclusionReasons.includes(effectiveFilter);

      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(ticket.id).includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        (ticket.techName || 'sem técnico').toLowerCase().includes(q) ||
        ticket.macroArea.toLowerCase().includes(q) ||
        ticket.category.toLowerCase().includes(q)
      );
    });
  }, [effectiveFilter, onlyPopNonCompliant, searchQuery, tickets]);

  return (
    <Drawer
      open={Boolean(effectiveFilter)}
      onClose={() => {
        setOnlyPopNonCompliant(false);
        setSearchQuery('');
        closeTicketDrawer();
      }}
      title={getFilterLabel(
        effectiveFilter,
        endpointConfig.staleTicketThresholdHours,
        endpointConfig.staleTicketTimeBasis
      )}
      subtitle={`Origem: GLPI via Backend · ${dataMode === 'demo' ? 'Dados demonstrativos' : 'Estado de conexão: ' + dataMode}`}
      widthClass="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] pb-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por número, título, técnico ou macroárea..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0F5E59] dark:focus:border-[#2DD4BF]"
            />
          </div>

          {(effectiveFilter === 'sem_tecnico' || effectiveFilter === 'sem_tecnico_pop') && (
            <button
              type="button"
              onClick={() => {
                if (effectiveFilter === 'sem_tecnico_pop') {
                  openTicketDrawer('sem_tecnico');
                  setOnlyPopNonCompliant(false);
                } else {
                  setOnlyPopNonCompliant((prev) => !prev);
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                onlyPopNonCompliant || effectiveFilter === 'sem_tecnico_pop'
                  ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] text-slate-700 dark:text-slate-300'
              }`}
            >
              <Filter size={13} />
              <span>Somente desconformidade POP</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Exibindo <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{filteredTickets.length}</strong> registro(s)
          </span>
          <span className="font-mono text-[11px] truncate max-w-[300px]" title={endpointConfig.glpiTicketUrlTemplate}>
            GLPI: {endpointConfig.glpiTicketUrlTemplate}
          </span>
        </div>

        {effectiveFilter === 'sem_atualizacao' && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200">
            <span>
              Regra gerencial de referência parametrizada: <strong>&gt; {endpointConfig.staleTicketThresholdHours}h {endpointConfig.staleTicketTimeBasis}</strong> (sujeita à conciliação oficial com backend/POP).
            </span>
            <button
              type="button"
              onClick={() => {
                closeTicketDrawer();
                setActiveModule('configuracoes');
              }}
              className="font-semibold underline whitespace-nowrap"
            >
              Ajustar parâmetro
            </button>
          </div>
        )}

        {filteredTickets.length === 0 ? (
          <EmptyState
            title="Nenhum chamado encontrado neste recorte"
            description="Ajuste o filtro textual ou verifique o estado da integração com o backend principal."
          />
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-[#243242] rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]">
            {filteredTickets.map((ticket) => {
              const glpiHref = GlpiAdapter.getTicketExternalUrl(endpointConfig, ticket.id);
              return (
                <div key={ticket.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          #{ticket.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ticket.macroArea}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{ticket.lastUpdatedAt} ({ticket.hoursWithoutUpdate}h)</span>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {ticket.title}
                      </h3>
                    </div>

                    <a
                      href={glpiHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] px-2.5 py-1.5 text-xs font-medium text-[#0F5E59] dark:text-[#2DD4BF] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Abrir no GLPI</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">Técnico</span>
                      <span className={`font-medium ${ticket.techName ? 'text-slate-800 dark:text-slate-200' : ticket.isPopNonCompliant ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {ticket.techName || 'Sem técnico nominal'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">Grupo</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">{ticket.group}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">Categoria</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">{ticket.category}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">Conformidade</span>
                      {ticket.isPopNonCompliant ? (
                        <SemanticLabel state="critical" label="Desconformidade POP" compact />
                      ) : ticket.techName === null ? (
                        <SemanticLabel state="nominal" label="Exceção institucional" compact />
                      ) : (
                        <SemanticLabel state="neutral" label="Fluxo regular" compact />
                      )}
                    </div>
                  </div>

                  <div
                    className={`mt-2.5 flex items-start gap-2 rounded-md px-2.5 py-2 text-xs ${
                      ticket.isPopNonCompliant
                        ? 'bg-red-50/70 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200/80 dark:border-red-900/50'
                        : 'bg-slate-50 dark:bg-[#18222F] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#243242]'
                    }`}
                  >
                    {ticket.isPopNonCompliant ? (
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    ) : (
                      <UserCheck size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    )}
                    <div>
                      <span className="font-medium">Motivo de inclusão: </span>
                      <span>{ticket.classificationReason}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
};
