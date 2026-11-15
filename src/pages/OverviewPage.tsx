import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Clock,
  ExternalLink,
  FolderOpen,
  Inbox,
  Layers,
  ListChecks,
  Mail,
  PauseCircle,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  Drawer,
  EmptyState,
  LoadingSkeletonGrid,
  SemanticLabel,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import {
  GlpiAdapter,
  Microsoft365Adapter,
  PortalAdapter,
} from '../services/opsAdapters';
import type {
  AgendaEvent,
  MailPendingItem,
  OperationalKpi,
  TicketFilterKey,
  TicketItem,
  WeeklyPriority,
} from '../types/ops';

const KPI_ICONS: Record<TicketFilterKey, React.ComponentType<{ size?: number; className?: string }>> = {
  abertos: FolderOpen,
  novos: Sparkles,
  em_atendimento: UserCheck,
  em_andamento: Layers,
  sem_tecnico: UserX,
  sem_tecnico_pop: AlertCircle,
  sem_atualizacao: Clock,
  pendentes: PauseCircle,
  tempo_medio: Clock,
};

export const OverviewPage: React.FC<{
  onTicketsLoaded?: (tickets: TicketItem[]) => void;
}> = ({ onTicketsLoaded }) => {
  const {
    dataMode,
    refreshTrigger,
    triggerRefresh,
    endpointConfig,
    openTicketDrawer,
    setActiveModule,
    pushToast,
  } = useOps();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [kpis, setKpis] = useState<OperationalKpi[]>([]);
  const [priorities, setPriorities] = useState<WeeklyPriority[]>([]);
  const [agendaDay, setAgendaDay] = useState<'hoje' | 'amanha'>('hoje');
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [mailItems, setMailItems] = useState<MailPendingItem[]>([]);
  const [mailFilter, setMailFilter] = useState<'todos' | 'exige_acao' | 'aguardando_resposta' | 'nao_lido' | 'sinalizado'>('todos');
  const [selectedMail, setSelectedMail] = useState<MailPendingItem | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(undefined);

    Promise.all([
      PortalAdapter.fetchOverview(dataMode, endpointConfig),
      Microsoft365Adapter.fetchAgenda(dataMode, endpointConfig),
      Microsoft365Adapter.fetchMailbox(dataMode, endpointConfig),
    ]).then(([overviewRes, agendaRes, mailRes]) => {
      if (!active) return;
      if (overviewRes.errorMessage) {
        setErrorMessage(overviewRes.errorMessage);
        setKpis([]);
        setPriorities([]);
        setAgendaEvents([]);
        setMailItems([]);
        onTicketsLoaded?.([]);
      } else {
        setKpis(overviewRes.data.kpis);
        setPriorities(overviewRes.data.priorities.slice(0, 5));
        onTicketsLoaded?.(overviewRes.data.tickets);
        setAgendaEvents(agendaRes.data);
        setMailItems(mailRes.data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [dataMode, refreshTrigger, endpointConfig, onTicketsLoaded]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[88px] rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] animate-pulse"
            />
          ))}
        </div>
        <LoadingSkeletonGrid rows={4} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <UnavailableState
        title={dataMode === 'disconnected' ? 'Portal aguardando conexão com o backend' : 'Indicadores operacionais indisponíveis'}
        description={errorMessage}
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  const visibleAgenda = agendaEvents.filter((ev) => ev.day === agendaDay);
  const filteredMail = mailItems.filter((item) => {
    if (mailFilter === 'todos') return true;
    if (mailFilter === 'exige_acao') return item.requiresAction;
    return item.category === mailFilter;
  });

  return (
    <div className="space-y-3.5 max-w-[1600px] mx-auto">
      {/* Compact KPI Strip — 8 Operational Cards */}
      <section aria-label="Indicadores operacionais">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {kpis.map((kpi) => {
            const Icon = KPI_ICONS[kpi.key] || FolderOpen;
            const isPopCritical = kpi.key === 'sem_tecnico' && (kpi.popSummary?.popNonCompliant ?? 0) > 0;
            return (
              <div
                key={kpi.key}
                className={`group rounded-lg border bg-white dark:bg-[#111923] p-3 transition-colors ${
                  isPopCritical
                    ? 'border-red-300 dark:border-red-900/70 hover:border-red-400'
                    : 'border-slate-200 dark:border-[#243242] hover:border-[#0F5E59]/60 dark:hover:border-[#2DD4BF]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openTicketDrawer(kpi.key)}
                    className="flex-1 text-left focus:outline-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                        {kpi.label}
                      </span>
                      <Icon
                        size={15}
                        className={`shrink-0 ${
                          isPopCritical
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-[#0F5E59] dark:group-hover:text-[#2DD4BF]'
                        }`}
                      />
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between gap-2">
                      {kpi.key === 'sem_tecnico' && kpi.popSummary ? (
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            {kpi.popSummary.totalWithoutTech}
                          </span>
                          <span className="text-xs font-semibold font-mono tabular-nums text-red-700 dark:text-red-400">
                            ({kpi.popSummary.popNonCompliant} POP)
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                          {kpi.value}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] opacity-85 group-hover:opacity-100">
                        <span>Detalhar</span>
                        <ArrowUpRight size={12} />
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                      <SemanticLabel
                        state={kpi.state}
                        label={
                          kpi.key === 'sem_tecnico'
                            ? `${kpi.popSummary?.justifiedExceptions ?? 0} exceções válidas`
                            : kpi.subtitle
                        }
                        compact
                      />
                      <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                        {kpi.updatedAt}
                      </span>
                    </div>
                  </button>
                </div>

                {kpi.key === 'sem_tecnico' && kpi.popSummary && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-[#1D2836] pt-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => openTicketDrawer('sem_tecnico_pop')}
                      className="font-medium text-red-700 dark:text-red-400 hover:underline"
                    >
                      Ver {kpi.popSummary.popNonCompliant} em desconformidade POP
                    </button>
                    <button
                      type="button"
                      onClick={() => openTicketDrawer('sem_tecnico')}
                      className="text-slate-500 dark:text-slate-400 hover:underline"
                    >
                      Todos ({kpi.popSummary.totalWithoutTech})
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Main 3-Zone Operational Grid optimized for 1366x768 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        {/* Left: Prioridades da Semana (5 cols) */}
        <section
          aria-label="Prioridades da Semana"
          className="xl:col-span-5 flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <ListChecks size={16} className="text-[#0F5E59] dark:text-[#2DD4BF] shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Prioridades da Semana
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Carteira aprovada no Alinhamento Semanal · Máximo 5 ativas
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('reunioes')}
              className="text-xs font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline whitespace-nowrap shrink-0"
            >
              Ver alinhamento
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-[#1D2836]">
            {priorities.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Sem prioridades aprovadas"
                  description="As prioridades serão herdadas automaticamente após o próximo Alinhamento Semanal (TPL-02)."
                />
              </div>
            ) : (
              priorities.map((pri) => {
                const glpiUrl = GlpiAdapter.getTicketExternalUrl(endpointConfig, pri.ticketId);
                return (
                  <div key={pri.id} className="px-4 py-2.5 hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            #{pri.ticketId}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{pri.owner}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              pri.status === 'Risco de prazo'
                                ? 'font-medium text-red-700 dark:text-red-400'
                                : pri.status === 'Aguardando terceiros'
                                  ? 'font-medium text-amber-700 dark:text-amber-400'
                                  : 'text-emerald-700 dark:text-emerald-400'
                            }
                          >
                            {pri.status}
                          </span>
                          {pri.dueDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">Prazo {pri.dueDate}</span>
                            </>
                          )}
                        </div>
                        <p className="mt-0.5 text-[13px] font-medium text-slate-900 dark:text-slate-100 leading-snug">
                          {pri.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-snug">
                          Próxima ação: {pri.nextAction}
                        </p>
                      </div>

                      <a
                        href={glpiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Abrir chamado #${pri.ticketId} no GLPI`}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] whitespace-nowrap shrink-0"
                      >
                        <span>GLPI</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Center: Minha Agenda (3.5 -> 3 cols) */}
        <section
          aria-label="Minha Agenda"
          className="xl:col-span-3 flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={16} className="text-[#0F5E59] dark:text-[#2DD4BF] shrink-0" />
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                Minha Agenda
              </h2>
            </div>

            <div className="flex items-center rounded-md bg-slate-100 dark:bg-[#18222F] p-0.5">
              <button
                type="button"
                onClick={() => setAgendaDay('hoje')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  agendaDay === 'hoje'
                    ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setAgendaDay('amanha')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  agendaDay === 'amanha'
                    ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Amanhã
              </button>
            </div>
          </div>

          {!endpointConfig.m365Configured && (
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-4 py-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span>Microsoft 365: não configurado · Exibindo ritos locais</span>
              <button
                type="button"
                onClick={() => setActiveModule('configuracoes')}
                className="font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline whitespace-nowrap shrink-0"
              >
                Configurar
              </button>
            </div>
          )}

          <div className="flex-1 divide-y divide-slate-100 dark:divide-[#1D2836]">
            {visibleAgenda.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Sem compromissos internos para este dia"
                  description="Eventos externos do Outlook aparecerão aqui após configurar o Microsoft 365."
                />
              </div>
            ) : (
              visibleAgenda.map((ev) => (
                <div key={ev.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold tabular-nums text-[#0F5E59] dark:text-[#2DD4BF]">
                      {ev.startTime}–{ev.endTime}
                    </span>
                    <span className="truncate">{ev.type}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-900 dark:text-slate-100 leading-snug">
                    {ev.title}
                  </p>
                  {(ev.participants || ev.locationOrLink) && (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {[ev.participants, ev.locationOrLink].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right: E-mails e Pendências (4 cols) */}
        <section
          aria-label="E-mails e Pendências"
          className="xl:col-span-4 flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={16} className="text-[#0F5E59] dark:text-[#2DD4BF] shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  E-mails e Pendências
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Separação entre informativos e mensagens que exigem ação
                </p>
              </div>
            </div>
          </div>

          {!endpointConfig.m365Configured && (
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] bg-amber-50/60 dark:bg-amber-950/20 px-4 py-2 text-[11px] text-amber-900 dark:text-amber-200">
              <span>Caixa Microsoft 365 não conectada (amostra de contrato)</span>
              <button
                type="button"
                onClick={() => setActiveModule('configuracoes')}
                className="font-medium underline whitespace-nowrap shrink-0"
              >
                Status M365
              </button>
            </div>
          )}

          {/* Segmented Filters */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#243242] px-3 py-1.5 text-[11px]">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'exige_acao', label: 'Exige ação' },
              { id: 'aguardando_resposta', label: 'Aguardando resp.' },
              { id: 'nao_lido', label: 'Não lidos' },
              { id: 'sinalizado', label: 'Sinalizados' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMailFilter(tab.id as typeof mailFilter)}
                className={`rounded px-2 py-1 font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mailFilter === tab.id
                    ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/15 dark:text-[#2DD4BF]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-[#1D2836]">
            {filteredMail.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Nenhuma mensagem neste filtro"
                  description="Selecione outro filtro ou configure a conta Microsoft 365."
                />
              </div>
            ) : (
              filteredMail.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMail(item)}
                  className="block w-full px-4 py-2.5 text-left hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`font-medium ${
                        item.requiresAction
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.requiresAction ? 'Exige resposta / ação' : 'Informativo sem ação imediata'}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400 shrink-0">
                      {item.dueDate ? `Prazo ${item.dueDate}` : item.receivedAt}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.subject}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.sender} · {item.actionReason}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Mail Detail Drawer */}
      <Drawer
        open={Boolean(selectedMail)}
        onClose={() => setSelectedMail(null)}
        title={selectedMail?.subject || 'Detalhe da Mensagem'}
        subtitle={
          selectedMail
            ? `${selectedMail.sender} · Recebido: ${selectedMail.receivedAt}`
            : undefined
        }
        widthClass="max-w-xl"
      >
        {selectedMail && (
          <div className="space-y-4 text-sm">
            <div className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Classificação operacional</span>
                <SemanticLabel
                  state={selectedMail.requiresAction ? 'critical' : 'neutral'}
                  label={selectedMail.requiresAction ? 'Exige ação do gestor' : 'Informativo / Sem resposta obrigatória'}
                  compact
                />
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Motivo:</strong> {selectedMail.actionReason}
              </p>
              {selectedMail.dueDate && (
                <p className="font-mono text-slate-700 dark:text-slate-300">
                  <strong>Prazo identificado:</strong> {selectedMail.dueDate}
                </p>
              )}
            </div>

            <div className="whitespace-pre-line rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
              {selectedMail.body}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#243242] pt-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                <Inbox size={13} />
                Ações de envio exigem conexão Microsoft 365 configurada.
              </span>
              <button
                type="button"
                onClick={() => {
                  pushToast({
                    title: 'Ação indisponível no modo demonstração',
                    description: 'O envio de resposta ou registro de pendência via Outlook depende da homologação da integração Microsoft 365.',
                    tone: 'warning',
                  });
                }}
                className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 transition-colors"
              >
                Converter em pendência gerencial
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
