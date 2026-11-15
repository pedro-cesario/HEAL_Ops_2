import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Search,
  Users,
} from 'lucide-react';
import {
  Drawer,
  EmptyState,
  LoadingSkeletonGrid,
  SemanticLabel,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import { GlpiAdapter, PortalAdapter, TeamAdapter } from '../services/opsAdapters';
import type { TeamMember, TicketItem } from '../types/ops';

type MemberTabId =
  | 'perfil'
  | 'indicadores'
  | 'chamados'
  | 'alinhamentos'
  | 'feedbacks'
  | 'metas'
  | 'compromissos'
  | 'pendencias';

const MEMBER_TABS: { id: MemberTabId; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'chamados', label: 'Chamados' },
  { id: 'alinhamentos', label: 'Alinhamentos' },
  { id: 'feedbacks', label: 'Feedbacks' },
  { id: 'metas', label: 'Metas' },
  { id: 'compromissos', label: 'Compromissos' },
  { id: 'pendencias', label: 'Pendências' },
];

export const TeamPage: React.FC = () => {
  const { dataMode, refreshTrigger, triggerRefresh, endpointConfig, setActiveModule } = useOps();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [macroFilter, setMacroFilter] = useState<string>('Todas');
  const [contractFilter, setContractFilter] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<MemberTabId>('perfil');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(undefined);

    Promise.all([
      TeamAdapter.fetchTeam(dataMode),
      PortalAdapter.fetchOverview(dataMode, endpointConfig),
    ]).then(([teamRes, overviewRes]) => {
      if (!active) return;
      if (teamRes.errorMessage) {
        setErrorMessage(teamRes.errorMessage);
        setMembers([]);
        setTickets([]);
      } else {
        setMembers(teamRes.data);
        setTickets(overviewRes.data.tickets || []);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [dataMode, refreshTrigger, endpointConfig]);

  const macroAreas = useMemo(
    () => ['Todas', ...Array.from(new Set(members.map((m) => m.macroArea)))],
    [members]
  );

  const contracts = useMemo(
    () => ['Todos', ...Array.from(new Set(members.map((m) => m.contractType)))],
    [members]
  );

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (macroFilter !== 'Todas' && m.macroArea !== macroFilter) return false;
      if (contractFilter !== 'Todos' && m.contractType !== contractFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.technicalReferences.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [members, macroFilter, contractFilter, search]);

  if (loading) return <LoadingSkeletonGrid rows={5} />;

  if (errorMessage) {
    return (
      <UnavailableState
        title="Diretório da equipe indisponível"
        description={errorMessage}
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  const memberTickets = selectedMember
    ? tickets.filter((t) => t.techName === selectedMember.name)
    : [];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Compact Team Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Colaboradores ativos</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {members.length}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            4 vínculos e jornadas distintas
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Chamados em carteira</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {members.reduce((acc, m) => acc + m.activeTickets, 0)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Atribuídos nominalmente</span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Concluídos na semana</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {members.reduce((acc, m) => acc + m.resolvedWeek, 0)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Consolidado por colaborador</span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Conformidade média POP</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {members.length
              ? Math.round(members.reduce((acc, m) => acc + m.popComplianceRate, 0) / members.length)
              : 0}
            %
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Avaliações registradas</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, função ou referência técnica..."
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0F5E59] dark:focus:border-[#2DD4BF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            aria-label="Filtrar por macroárea"
            value={macroFilter}
            onChange={(e) => setMacroFilter(e.target.value)}
            className="rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
          >
            {macroAreas.map((area) => (
              <option key={area} value={area}>
                Macroárea: {area}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por vínculo"
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
          >
            {contracts.map((c) => (
              <option key={c} value={c}>
                Vínculo: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact Collaborator Cards */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          title="Nenhum colaborador corresponde aos filtros"
          description="Limpe os critérios de busca para visualizar toda a equipe."
          actionLabel="Limpar filtros"
          onAction={() => {
            setMacroFilter('Todas');
            setContractFilter('Todos');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                setSelectedMember(member);
                setActiveTab('perfil');
              }}
              className="group flex flex-col justify-between rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 text-left hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {member.role}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:text-[#0F5E59] dark:group-hover:text-[#2DD4BF] shrink-0 mt-0.5"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-[#0F5E59] dark:text-[#2DD4BF]">{member.macroArea}</span>
                  <span aria-hidden="true">·</span>
                  <span>{member.contractType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{member.schedule}</span>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  Ref. técnicas: {member.technicalReferences.join(' · ')}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 dark:border-[#1D2836] pt-2.5 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400">Ativos</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {member.activeTickets}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Semana</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {member.resolvedWeek}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">1ª Resp.</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {member.avgResponseHours}h
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">POP</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      member.popComplianceRate >= 90
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {member.popComplianceRate}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Collaborator Detail Drawer (8 sub-views) */}
      <Drawer
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || 'Colaborador'}
        subtitle={
          selectedMember
            ? `${selectedMember.role} · ${selectedMember.contractType} · ${selectedMember.macroArea}`
            : undefined
        }
        widthClass="max-w-3xl"
      >
        {selectedMember && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#243242] pb-2">
              {MEMBER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18222F]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'perfil' && (
              <div className="space-y-4 text-xs">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedMember.profileSummary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3.5">
                  <div className="flex items-start gap-2">
                    <Briefcase size={15} className="text-[#0F5E59] dark:text-[#2DD4BF] mt-0.5" />
                    <div>
                      <span className="block text-slate-400">Vínculo e Macroárea</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {selectedMember.contractType} · {selectedMember.macroArea}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={15} className="text-[#0F5E59] dark:text-[#2DD4BF] mt-0.5" />
                    <div>
                      <span className="block text-slate-400">Jornada configurada</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {selectedMember.schedule}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar size={15} className="text-[#0F5E59] dark:text-[#2DD4BF] mt-0.5" />
                    <div>
                      <span className="block text-slate-400">Último / Próximo Alinhamento</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {selectedMember.lastAlignmentDate} → {selectedMember.nextAlignmentDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users size={15} className="text-[#0F5E59] dark:text-[#2DD4BF] mt-0.5" />
                    <div>
                      <span className="block text-slate-400">Referências Técnicas</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {selectedMember.technicalReferences.join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Responsabilidades operacionais
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                    {selectedMember.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'indicadores' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3">
                  <span className="text-xs text-slate-500">Chamados ativos</span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{selectedMember.activeTickets}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3">
                  <span className="text-xs text-slate-500">Concluídos (7d)</span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{selectedMember.resolvedWeek}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3">
                  <span className="text-xs text-slate-500">1ª Resposta média</span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{selectedMember.avgResponseHours}h</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3">
                  <span className="text-xs text-slate-500">Conformidade POP</span>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{selectedMember.popComplianceRate}%</div>
                </div>
              </div>
            )}

            {activeTab === 'chamados' && (
              <div className="space-y-2">
                {memberTickets.length === 0 ? (
                  <EmptyState
                    title="Sem chamados críticos em destaque na amostra atual"
                    description="Consulte a fila completa no GLPI ou filtre na Visão Geral."
                  />
                ) : (
                  memberTickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          #{t.id} · {t.status} · {t.lastUpdatedAt}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {t.title}
                        </div>
                      </div>
                      <a
                        href={GlpiAdapter.getTicketExternalUrl(endpointConfig, t.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 font-medium text-[#0F5E59] dark:text-[#2DD4BF] whitespace-nowrap shrink-0"
                      >
                        <span>GLPI</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'alinhamentos' && (
              <div className="space-y-2.5">
                {selectedMember.alignments.map((al, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs">
                    <div className="flex items-center justify-between font-mono text-slate-500">
                      <span>{al.date}</span>
                      <span>Percepção: {al.mood}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{al.summary}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'feedbacks' && (
              <div className="space-y-2.5">
                {selectedMember.feedbacks.map((fb, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <SemanticLabel
                        state={fb.type === 'Reconhecimento' ? 'nominal' : 'attention'}
                        label={fb.type}
                        compact
                      />
                      <span className="font-mono text-slate-400">{fb.date} · {fb.author}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-800 dark:text-slate-200">{fb.note}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'metas' && (
              <div className="space-y-2.5">
                {selectedMember.goals.map((goal) => (
                  <div key={goal.id} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{goal.title}</span>
                      <span className="font-mono text-slate-500">Alvo: {goal.target}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-[#0F5E59] dark:bg-[#2DD4BF]"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                      <span>Progresso: {goal.progress}%</span>
                      <span>Prazo: {goal.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'compromissos' && (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compromissos recíprocos pactuados entre Colaborador e Gestão (TPL-03 · Base demonstrativa).
                </p>
                {selectedMember.commitments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                        Parte: {c.owner === 'Gestor' ? 'Gestão' : `Colaborador (${c.owner})`}
                      </span>
                      <span className="font-mono text-slate-500 shrink-0">
                        {c.status} · Prazo {c.dueDate}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{c.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pendencias' && (
              <div className="space-y-2.5">
                {selectedMember.pendings.length === 0 ? (
                  <EmptyState
                    title="Nenhuma pendência gerencial atribuída"
                    description="Este colaborador não possui impedimentos ou planos de correção em aberto."
                  />
                ) : (
                  selectedMember.pendings.map((p) => (
                    <div key={p.id} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <SemanticLabel
                          state={p.severity === 'Alta' ? 'critical' : p.severity === 'Média' ? 'attention' : 'neutral'}
                          label={`Criticidade ${p.severity}`}
                          compact
                        />
                        <span className="font-mono text-slate-500">Prazo {p.dueDate}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{p.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
