import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  MonitorPlay,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import {
  Drawer,
  EmptyState,
  SemanticLabel,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import { GlpiAdapter } from '../services/opsAdapters';

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
  const {
    dataMode,
    triggerRefresh,
    endpointConfig,
    setActiveModule,
    pushToast,
    teamMembers,
    computedTickets,
    addMemberAlignment,
    addMemberFeedback,
    updateMemberGoalProgress,
    addMemberCommitment,
    toggleMemberCommitmentStatus,
    launchIndividualAlignmentForMember,
  } = useOps();

  const [macroFilter, setMacroFilter] = useState<string>('Todas');
  const [contractFilter, setContractFilter] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MemberTabId>('perfil');

  // Inline quick-add form states inside Drawer
  const [alignSummary, setAlignSummary] = useState('');
  const [alignMood, setAlignMood] = useState('Engajado');
  const [fbType, setFbType] = useState<'Reconhecimento' | 'Desenvolvimento'>('Reconhecimento');
  const [fbNote, setFbNote] = useState('');
  const [commitOwner, setCommitOwner] = useState<'Colaborador' | 'Gestor'>('Colaborador');
  const [commitDesc, setCommitDesc] = useState('');
  const [commitDue, setCommitDue] = useState('22/11/2026');

  const selectedMember = useMemo(
    () => teamMembers.find((m) => m.id === selectedMemberId) || null,
    [teamMembers, selectedMemberId]
  );

  const macroAreas = useMemo(
    () => ['Todas', ...Array.from(new Set(teamMembers.map((m) => m.macroArea)))],
    [teamMembers]
  );

  const contracts = useMemo(
    () => ['Todos', ...Array.from(new Set(teamMembers.map((m) => m.contractType)))],
    [teamMembers]
  );

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
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
  }, [teamMembers, macroFilter, contractFilter, search]);

  if (dataMode === 'disconnected' || dataMode === 'unavailable') {
    return (
      <UnavailableState
        title="Diretório da equipe indisponível"
        description="Cadastro da equipe indisponível sem conexão com o portal principal."
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  const memberTickets = selectedMember
    ? computedTickets.filter((t) => t.techName === selectedMember.name)
    : [];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Compact Team Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Colaboradores ativos</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {teamMembers.length}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            4 vínculos e jornadas distintas
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Chamados em carteira</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {teamMembers.reduce((acc, m) => acc + m.activeTickets, 0)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Carteira nominal consolidada
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Concluídos na semana</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {teamMembers.reduce((acc, m) => acc + m.resolvedWeek, 0)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Consolidado por colaborador</span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Conformidade média POP</span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {teamMembers.length
              ? Math.round(teamMembers.reduce((acc, m) => acc + m.popComplianceRate, 0) / teamMembers.length)
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
                setSelectedMemberId(member.id);
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

      {/* Collaborator Detail Drawer (8 sub-views + live session editing + TPL-03 launcher) */}
      <Drawer
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMemberId(null)}
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] pb-2">
              <div className="flex items-center gap-1 overflow-x-auto">
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

              <button
                type="button"
                onClick={() => {
                  setSelectedMemberId(null);
                  launchIndividualAlignmentForMember(selectedMember);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 whitespace-nowrap"
              >
                <MonitorPlay size={13} />
                <span>Conduzir TPL-03 (Individual)</span>
              </button>
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3">
                    <span className="text-xs text-slate-500">Carteira nominal total</span>
                    <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{selectedMember.activeTickets}</div>
                    <span className="text-[10px] text-slate-400">{memberTickets.length} em destaque na amostra</span>
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
              </div>
            )}

            {activeTab === 'chamados' && (
              <div className="space-y-2">
                {memberTickets.length === 0 ? (
                  <EmptyState
                    title="Sem chamados críticos em destaque na amostra atual"
                    description={`A carteira nominal completa possui ${selectedMember.activeTickets} chamado(s) no GLPI. Consulte a fila completa no GLPI.`}
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
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!alignSummary.trim()) return;
                    addMemberAlignment(selectedMember.id, alignSummary, alignMood);
                    setAlignSummary('');
                    pushToast({
                      title: 'Registro de alinhamento salvo na sessão (localStorage)',
                      tone: 'success',
                    });
                  }}
                  className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-2 text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    + Registrar nota de alinhamento (Sessão Local)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={alignSummary}
                      onChange={(e) => setAlignSummary(e.target.value)}
                      placeholder="Síntese do acompanhamento 1:1..."
                      className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2.5 py-1.5"
                    />
                    <select
                      value={alignMood}
                      onChange={(e) => setAlignMood(e.target.value)}
                      className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1.5"
                    >
                      <option value="Engajado">Engajado</option>
                      <option value="Focado">Focado</option>
                      <option value="Estável">Estável</option>
                      <option value="Atenção">Atenção</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3 py-1 font-medium"
                    >
                      <Plus size={12} />
                      <span>Adicionar registro</span>
                    </button>
                  </div>
                </form>

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
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!fbNote.trim()) return;
                    addMemberFeedback(selectedMember.id, fbType, fbNote);
                    setFbNote('');
                    pushToast({
                      title: 'Feedback registrado na sessão (localStorage)',
                      tone: 'success',
                    });
                  }}
                  className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-2 text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    + Registrar feedback estruturado (Sessão Local)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={fbType}
                      onChange={(e) =>
                        setFbType(e.target.value as 'Reconhecimento' | 'Desenvolvimento')
                      }
                      className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1.5"
                    >
                      <option value="Reconhecimento">Reconhecimento</option>
                      <option value="Desenvolvimento">Desenvolvimento</option>
                    </select>
                    <input
                      type="text"
                      value={fbNote}
                      onChange={(e) => setFbNote(e.target.value)}
                      placeholder="Descreva o fato observado e o retorno..."
                      className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2.5 py-1.5"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3 py-1 font-medium"
                    >
                      <Plus size={12} />
                      <span>Registrar feedback</span>
                    </button>
                  </div>
                </form>

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
                  <div key={goal.id} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{goal.title}</span>
                      <span className="font-mono text-slate-500">Alvo: {goal.target}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-[#0F5E59] dark:bg-[#2DD4BF] transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                      <span>Progresso: {goal.progress}% · Prazo: {goal.dueDate}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          aria-label={`Ajustar progresso da meta ${goal.title}`}
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={goal.progress}
                          onChange={(e) =>
                            updateMemberGoalProgress(
                              selectedMember.id,
                              goal.id,
                              Number(e.target.value)
                            )
                          }
                          className="w-28 accent-[#0F5E59] dark:accent-[#2DD4BF]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'compromissos' && (
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!commitDesc.trim()) return;
                    addMemberCommitment(selectedMember.id, commitOwner, commitDesc, commitDue);
                    setCommitDesc('');
                    pushToast({
                      title: 'Compromisso recíproco adicionado na sessão',
                      tone: 'success',
                    });
                  }}
                  className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-2 text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    + Pactuar novo compromisso (TPL-03 · Sessão Local)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      value={commitOwner}
                      onChange={(e) => setCommitOwner(e.target.value as 'Colaborador' | 'Gestor')}
                      className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1.5"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Gestor">Gestor</option>
                    </select>
                    <input
                      type="text"
                      value={commitDesc}
                      onChange={(e) => setCommitDesc(e.target.value)}
                      placeholder="Compromisso assumido..."
                      className="sm:col-span-6 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      value={commitDue}
                      onChange={(e) => setCommitDue(e.target.value)}
                      className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1.5 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3 py-1 font-medium"
                    >
                      <Plus size={12} />
                      <span>Pactuar</span>
                    </button>
                  </div>
                </form>

                {selectedMember.commitments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3 text-xs flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                        Parte: {c.owner === 'Gestor' ? 'Gestão' : `Colaborador (${selectedMember.name})`} · Prazo {c.dueDate}
                      </div>
                      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{c.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMemberCommitmentStatus(selectedMember.id, c.id)}
                      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium shrink-0 ${
                        c.status === 'Concluído'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-[#243242] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 size={12} />
                      <span>{c.status}</span>
                    </button>
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
