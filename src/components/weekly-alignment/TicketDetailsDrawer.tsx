import React, { useMemo, useState } from 'react';
import { ExternalLink, Search, ServerOff } from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import { GlpiAdapter } from '../../services/opsAdapters';
import type { TicketItem } from '../../types/ops';
import type { WeeklyIndicatorCardData } from '../../types/weeklyAlignment';
import { Drawer, EmptyState } from '../common/UiPrimitives';

export const TicketDetailsDrawer: React.FC<{
  indicator: WeeklyIndicatorCardData | null;
  tickets: TicketItem[];
  concludedTickets: TicketItem[];
  fetchedAt: string;
  onClose: () => void;
  onPrioritizeFromDrawer?: (ticket: TicketItem) => void;
}> = ({
  indicator,
  tickets,
  concludedTickets,
  fetchedAt,
  onClose,
  onPrioritizeFromDrawer,
}) => {
  const { endpointConfig } = useOps();
  const [search, setSearch] = useState('');

  const matchingTickets = useMemo(() => {
    if (!indicator || !indicator.available) return [];
    let pool: TicketItem[] = [];
    if (indicator.key === 'concluidos_semana') {
      pool = concludedTickets;
    } else if (indicator.key === 'abertos') {
      pool = tickets;
    } else if (indicator.key === 'novos') {
      pool = tickets.filter((t) => t.inclusionReasons.includes('novos'));
    } else if (indicator.key === 'em_atendimento') {
      pool = tickets.filter((t) => t.inclusionReasons.includes('em_atendimento'));
    } else if (indicator.key === 'pendentes') {
      pool = tickets.filter((t) => t.inclusionReasons.includes('pendentes'));
    } else if (indicator.key === 'sem_atualizacao') {
      pool = tickets.filter((t) => t.inclusionReasons.includes('sem_atualizacao'));
    } else if (indicator.key === 'sem_tecnico_pop') {
      pool = tickets.filter((t) => t.isPopNonCompliant);
    } else if (indicator.key === 'tempo_medio') {
      pool = tickets.filter((t) => t.inclusionReasons.includes('tempo_medio'));
    }

    if (!search.trim()) return pool;
    const q = search.toLowerCase();
    return pool.filter(
      (t) =>
        String(t.id).includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.techName || 'sem técnico').toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [indicator, tickets, concludedTickets, search]);

  return (
    <Drawer
      open={Boolean(indicator)}
      onClose={() => {
        setSearch('');
        onClose();
      }}
      title={indicator?.label || 'Chamados Relacionados'}
      subtitle={
        indicator
          ? `Atualizado às ${fetchedAt} · ${indicator.subtitle}`
          : undefined
      }
      widthClass="max-w-2xl"
    >
      {indicator && !indicator.available ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 dark:border-[#243242] p-8 text-center">
          <ServerOff size={24} className="text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Métrica indisponível no estado atual
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Sem conexão ativa com a API do portal/GLPI para detalhar este indicador. Nenhum dado fictício foi exibido.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número, título, técnico, grupo ou categoria..."
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <span className="font-mono text-xs text-slate-500">
              {matchingTickets.length} chamado(s)
            </span>
          </div>

          {matchingTickets.length === 0 ? (
            <EmptyState
              title="Nenhum chamado encontrado neste indicador"
              description="Altere o filtro de busca ou consulte outro indicador operacional."
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#243242] rounded-lg border border-slate-200 dark:border-[#243242]">
              {matchingTickets.map((t) => {
                const glpiUrl = GlpiAdapter.getTicketExternalUrl(endpointConfig, t.id);
                const canPrioritize =
                  Boolean(onPrioritizeFromDrawer) &&
                  t.status !== 'Fechado' &&
                  t.status !== 'Solucionado';
                return (
                  <div key={t.id} className="p-3.5 space-y-2 hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            #{t.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{t.status}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{t.lastUpdatedAt}</span>
                        </div>
                        <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {t.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {canPrioritize && (
                          <button
                            type="button"
                            onClick={() => onPrioritizeFromDrawer?.(t)}
                            className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-2.5 py-1 text-xs font-medium text-white dark:text-slate-950 whitespace-nowrap"
                          >
                            + Priorizar
                          </button>
                        )}
                        <a
                          href={glpiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1 text-xs font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:border-[#0F5E59] whitespace-nowrap"
                        >
                          <span>GLPI</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="block text-[11px] text-slate-400">Técnico</span>
                        <span className={t.techName ? 'font-medium text-slate-800 dark:text-slate-200' : 'font-medium text-red-700 dark:text-red-400'}>
                          {t.techName || 'Sem técnico'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">Grupo</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate block">{t.group}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">Categoria</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate block">{t.category}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">Última atualização</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{t.lastUpdatedAt}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
