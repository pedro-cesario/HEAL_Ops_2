import React, { useMemo, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Filter,
  History,
  Layers,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import {
  Drawer,
  EmptyState,
  Modal,
  SemanticLabel,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import { GlpiAdapter, StratifiedAuditAdapter } from '../services/opsAdapters';
import type {
  AuditSampleItem,
  AuditVerdict,
  ManagementPending,
  SamplingConfig,
  SamplingHistoryEntry,
  StratumDimension,
} from '../types/ops';

const STRATA_OPTIONS: { id: StratumDimension; label: string }[] = [
  { id: 'tecnico', label: 'Técnico' },
  { id: 'macroarea', label: 'Macroárea' },
  { id: 'categoria', label: 'Categoria' },
  { id: 'status', label: 'Status' },
  { id: 'grupo', label: 'Grupo' },
  { id: 'periodo', label: 'Período' },
];

export const PendingAuditPage: React.FC = () => {
  const {
    dataMode,
    triggerRefresh,
    endpointConfig,
    setActiveModule,
    pushToast,
    pendings,
    addPending,
    updatePending,
    auditSamples,
    saveAuditSampleEvaluation,
    samplingHistory,
    addSamplingHistoryEntry,
    aiSuggestions,
    updateAiSuggestionState,
    teamMembers,
  } = useOps();

  const [activeArea, setActiveArea] = useState<'pendencias' | 'auditoria'>('pendencias');

  // Pendings state
  const [originFilter, setOriginFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [createPendingModalOpen, setCreatePendingModalOpen] = useState(false);

  // Create Pending Form
  const [newOrigin, setNewOrigin] = useState<ManagementPending['origin']>('GLPI');
  const [newTicketId, setNewTicketId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOwner, setNewOwner] = useState('Carlos Henrique');
  const [newCriticality, setNewCriticality] = useState<ManagementPending['criticality']>('Alta');
  const [newDueDate, setNewDueDate] = useState('20/11/2026');
  const [newNextAction, setNewNextAction] = useState('');

  // Pending edit state in Drawer
  const [editStatus, setEditStatus] = useState<ManagementPending['status']>('Aberta');
  const [editOwner, setEditOwner] = useState('');
  const [editNextAction, setEditNextAction] = useState('');

  // Audit & Stratified Sampling state
  const [samplingConfig, setSamplingConfig] = useState<SamplingConfig>({
    periodStart: '2026-11-01',
    periodEnd: '2026-11-15',
    universe: 'Todos os chamados encerrados',
    percentage: 15,
    strata: ['macroarea', 'tecnico'],
  });
  const [activeStep, setActiveStep] = useState<number>(1);
  const configSectionRef = useRef<HTMLDivElement | null>(null);
  const samplesSectionRef = useRef<HTMLDivElement | null>(null);
  const resultsSectionRef = useRef<HTMLDivElement | null>(null);

  // Manual Audit Drawer state
  const [auditingItem, setAuditingItem] = useState<AuditSampleItem | null>(null);
  const [draftVerdict, setDraftVerdict] = useState<AuditVerdict>('Conforme');
  const [draftObservation, setDraftObservation] = useState('');
  const [draftEvidence, setDraftEvidence] = useState('');
  const [draftCorrectiveAction, setDraftCorrectiveAction] = useState('');
  const [draftOwner, setDraftOwner] = useState('');
  const [draftDueDate, setDraftDueDate] = useState('');

  const selectedPending = useMemo(
    () => pendings.find((p) => p.id === selectedPendingId) || null,
    [pendings, selectedPendingId]
  );

  const openPendingDrawer = (item: ManagementPending) => {
    setSelectedPendingId(item.id);
    setEditStatus(item.status);
    setEditOwner(item.owner);
    setEditNextAction(item.nextAction);
  };

  const proposalPreview = useMemo(
    () => StratifiedAuditAdapter.calculateProposalPreview(samplingConfig),
    [samplingConfig]
  );

  const filteredPendings = useMemo(() => {
    return pendings.filter((p) => {
      if (originFilter !== 'Todas' && p.origin !== originFilter) return false;
      if (statusFilter !== 'Todos' && p.status !== statusFilter) return false;
      return true;
    });
  }, [pendings, originFilter, statusFilter]);

  const auditResultsSummary = useMemo(() => {
    const conforme = auditSamples.filter((s) => s.verdict === 'Conforme').length;
    const naoConforme = auditSamples.filter((s) => s.verdict === 'Não Conforme').length;
    const naoAplicavel = auditSamples.filter((s) => s.verdict === 'Não Aplicável').length;
    const pendentes = auditSamples.filter((s) => s.auditStatus === 'Pendente').length;
    const avaliados = conforme + naoConforme;
    const rate = avaliados > 0 ? Math.round((conforme / avaliados) * 100) : 100;
    const correctiveItems = auditSamples.filter(
      (s) => s.verdict === 'Não Conforme' && (s.correctiveAction || s.observation)
    );
    return { conforme, naoConforme, naoAplicavel, pendentes, rate, correctiveItems };
  }, [auditSamples]);

  const toggleStratum = (stratum: StratumDimension) => {
    setSamplingConfig((prev) => {
      const exists = prev.strata.includes(stratum);
      const next = exists ? prev.strata.filter((s) => s !== stratum) : [...prev.strata, stratum];
      return { ...prev, strata: next.length ? next : [stratum] };
    });
  };

  const handleSelectStep = (stepNum: number) => {
    setActiveStep(stepNum);
    if (stepNum <= 5) {
      configSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (stepNum === 6 || stepNum === 7) {
      samplesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const openAuditDrawer = (item: AuditSampleItem) => {
    setAuditingItem(item);
    setDraftVerdict(item.verdict || 'Conforme');
    setDraftObservation(item.observation || '');
    setDraftEvidence(item.evidenceNote || '');
    setDraftCorrectiveAction(item.correctiveAction || '');
    setDraftOwner(item.correctiveOwner || item.techName);
    setDraftDueDate(item.correctiveDueDate || '2026-11-22');
  };

  const handleSaveAuditEvaluation = (mode: 'Rascunho' | 'Concluída') => {
    if (!auditingItem) return;
    const res = saveAuditSampleEvaluation(auditingItem.id, {
      verdict: draftVerdict,
      observation: draftObservation,
      evidenceNote: draftEvidence,
      correctiveAction: draftVerdict === 'Não Conforme' ? draftCorrectiveAction : undefined,
      correctiveOwner: draftVerdict === 'Não Conforme' ? draftOwner : undefined,
      correctiveDueDate: draftVerdict === 'Não Conforme' ? draftDueDate : undefined,
      auditStatus: mode,
    });
    setAuditingItem(null);
    if (res.createdPendingId) {
      setActiveStep(9);
      pushToast({
        title: `Auditoria concluída + Pendência gerencial gerada (#${auditingItem.ticketId})`,
        description: 'Não conformidade propagada automaticamente para Pendências Gerenciais (sessão local).',
        tone: 'success',
      });
    } else {
      pushToast({
        title: `Avaliação salva em sessão (${mode})`,
        description: 'Persistida localmente em localStorage. Gravação oficial aguarda backend (:3312).',
        tone: 'info',
      });
    }
  };

  const handleProposeSample = () => {
    const newEntry: SamplingHistoryEntry = {
      id: `smp-prop-${Date.now().toString().slice(-3)}`,
      createdAt: `${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Proposta local)`,
      universe: samplingConfig.universe,
      percentage: samplingConfig.percentage,
      eligibleTotal: proposalPreview.eligibleTotal,
      selectedCount: proposalPreview.selectedCount,
      originState: 'proposed_preview',
      criteriaSummary: `Proposta de estratificação por ${samplingConfig.strata.join(' + ')} (${samplingConfig.periodStart} a ${samplingConfig.periodEnd})`,
    };
    addSamplingHistoryEntry(newEntry);
    setActiveStep(6);
    pushToast({
      title: 'Amostra proposta gerada para visualização',
      description: 'A geração oficial com sorteio auditável depende do backend de amostragem estratificada.',
      tone: 'warning',
    });
  };

  if (dataMode === 'disconnected' || dataMode === 'unavailable') {
    return (
      <UnavailableState
        title="Módulo de Pendências e Auditoria aguardando backend"
        description="Motor de pendências e auditoria estratificada aguardando conexão com backend (:3312 / R7 :3310)."
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Dual-Area Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5">
        <div className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-[#18222F] p-1">
          <button
            type="button"
            onClick={() => setActiveArea('pendencias')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeArea === 'pendencias'
                ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Pendências Gerenciais ({pendings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveArea('auditoria')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeArea === 'auditoria'
                ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck size={14} />
            <span>Auditoria Estratificada e Manual ({auditSamples.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {activeArea === 'pendencias'
            ? 'Registros gerenciais curados · Auditorias não conformes geram pendência automaticamente'
            : 'Amostragem estratificada pendente no backend · Avaliação manual salva em sessão local'}
        </span>
      </div>

      {/* AREA 1: PENDÊNCIAS GERENCIAIS */}
      {activeArea === 'pendencias' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                aria-label="Filtrar pendências por origem"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
              >
                <option value="Todas">Origem: Todas</option>
                <option value="GLPI">GLPI</option>
                <option value="Auditoria">Auditoria</option>
                <option value="Alinhamento Semanal">Alinhamento Semanal</option>
                <option value="Alinhamento Individual">Alinhamento Individual</option>
                <option value="GMUD">GMUD</option>
              </select>

              <select
                aria-label="Filtrar pendências por situação"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
              >
                <option value="Todos">Situação: Todas</option>
                <option value="Aberta">Aberta</option>
                <option value="Em tratamento">Em tratamento</option>
                <option value="Impedimento externo">Impedimento externo</option>
                <option value="Vencida">Vencida</option>
                <option value="Resolvida">Resolvida</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-500">
                {filteredPendings.length} pendência(s) exibida(s)
              </span>
              <button
                type="button"
                onClick={() => setCreatePendingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 whitespace-nowrap"
              >
                <Plus size={13} />
                <span>Nova pendência</span>
              </button>
            </div>
          </div>

          {filteredPendings.length === 0 ? (
            <EmptyState
              title="Nenhuma pendência neste recorte"
              description="Altere os filtros para visualizar outras origens ou situações."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">Origem</th>
                    <th className="px-3.5 py-2.5 font-semibold">Descrição e próxima ação</th>
                    <th className="px-3.5 py-2.5 font-semibold">Responsável</th>
                    <th className="px-3.5 py-2.5 font-semibold">Criticidade</th>
                    <th className="px-3.5 py-2.5 font-semibold">Prazo</th>
                    <th className="px-3.5 py-2.5 font-semibold">Situação</th>
                    <th className="px-3.5 py-2.5 font-semibold text-right">Tratar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1D2836]">
                  {filteredPendings.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50 transition-colors"
                    >
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.origin}</span>
                        {item.ticketId && (
                          <span className="block font-mono text-[11px] text-slate-500">#{item.ticketId}</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 max-w-md">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.description}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Próxima ação: {item.nextAction}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {item.owner}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <SemanticLabel
                          state={
                            item.criticality === 'Crítica'
                              ? 'critical'
                              : item.criticality === 'Alta'
                                ? 'attention'
                                : 'neutral'
                          }
                          label={item.criticality}
                          compact
                        />
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {item.dueDate}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            item.status === 'Vencida'
                              ? 'text-red-700 dark:text-red-400'
                              : item.status === 'Impedimento externo'
                                ? 'text-amber-700 dark:text-amber-400'
                                : item.status === 'Resolvida'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openPendingDrawer(item)}
                          className="font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AREA 2: AUDITORIA POR AMOSTRAGEM ESTRATIFICADA + MANUAL + IA */}
      {activeArea === 'auditoria' && (
        <div className="space-y-4">
          {/* 9-step Guided Sampling Stepper */}
          <div
            ref={configSectionRef}
            className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] pb-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Fluxo de Auditoria por Amostragem Estratificada (9 etapas)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configuração visual de critérios · Distingue proposta local de sorteio oficial gerado pelo backend
                </p>
              </div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Estado backend: Amostragem estratificada pendente de implantação
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-[11px]">
              {[
                '1. Período',
                '2. Universo',
                '3. Percentual',
                '4. Estratos',
                '5. Gerar amostra',
                '6. Selecionados',
                '7. Auditar',
                '8. Resultados',
                '9. Corretivas',
              ].map((stepLabel, idx) => {
                const stepNum = idx + 1;
                return (
                  <button
                    key={stepLabel}
                    type="button"
                    onClick={() => handleSelectStep(stepNum)}
                    className={`rounded-md border px-2 py-1.5 text-left font-medium transition-colors truncate ${
                      activeStep === stepNum
                        ? 'border-[#0F5E59] bg-[#0F5E59]/10 text-[#0F5E59] dark:border-[#2DD4BF] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF]'
                        : 'border-slate-200 dark:border-[#243242] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#18222F]'
                    }`}
                  >
                    {stepLabel}
                  </button>
                );
              })}
            </div>

            {/* Configuration & Proposal Preview */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`rounded-md p-2 transition-colors ${
                      activeStep === 1 ? 'ring-1 ring-[#0F5E59]/50 bg-[#0F5E59]/[0.03]' : ''
                    }`}
                  >
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      1. Período de referência
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={samplingConfig.periodStart}
                        onChange={(e) =>
                          setSamplingConfig((p) => ({ ...p, periodStart: e.target.value }))
                        }
                        className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono text-xs"
                      />
                      <span className="text-slate-400">a</span>
                      <input
                        type="date"
                        value={samplingConfig.periodEnd}
                        onChange={(e) =>
                          setSamplingConfig((p) => ({ ...p, periodEnd: e.target.value }))
                        }
                        className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div
                    className={`rounded-md p-2 transition-colors ${
                      activeStep === 2 ? 'ring-1 ring-[#0F5E59]/50 bg-[#0F5E59]/[0.03]' : ''
                    }`}
                  >
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      2. Universo elegível
                    </label>
                    <select
                      value={samplingConfig.universe}
                      onChange={(e) =>
                        setSamplingConfig((p) => ({
                          ...p,
                          universe: e.target.value as SamplingConfig['universe'],
                        }))
                      }
                      className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
                    >
                      <option value="Todos os chamados encerrados">Todos os chamados encerrados</option>
                      <option value="Chamados sem técnico ou com atraso">Chamados sem técnico ou com atraso</option>
                      <option value="Chamados críticos assistenciais">Chamados críticos assistenciais</option>
                      <option value="Abertos no período">Abertos no período</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div
                    className={`rounded-md p-2 transition-colors ${
                      activeStep === 3 ? 'ring-1 ring-[#0F5E59]/50 bg-[#0F5E59]/[0.03]' : ''
                    }`}
                  >
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      3. Percentual da amostra ({samplingConfig.percentage}%)
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={40}
                      step={5}
                      value={samplingConfig.percentage}
                      onChange={(e) =>
                        setSamplingConfig((p) => ({ ...p, percentage: Number(e.target.value) }))
                      }
                      className="w-full accent-[#0F5E59] dark:accent-[#2DD4BF]"
                    />
                    <div className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span>5%</span>
                      <span>15%</span>
                      <span>25%</span>
                      <span>40%</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-md p-2 transition-colors ${
                      activeStep === 4 ? 'ring-1 ring-[#0F5E59]/50 bg-[#0F5E59]/[0.03]' : ''
                    }`}
                  >
                    <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      4. Estratos configuráveis
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {STRATA_OPTIONS.map((st) => {
                        const active = samplingConfig.strata.includes(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => toggleStratum(st.id)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                              active
                                ? 'border-[#0F5E59] bg-[#0F5E59] text-white dark:border-[#2DD4BF] dark:bg-[#2DD4BF] dark:text-slate-950'
                                : 'border-slate-200 dark:border-[#243242] text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-[#1D2836] pt-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Critérios documentados determinam a validade estatística no motor R7/FastAPI.
                  </span>
                  <button
                    type="button"
                    onClick={handleProposeSample}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-1.5 text-xs font-medium text-white dark:text-slate-950 transition-colors"
                  >
                    <Layers size={14} />
                    <span>5. Simular proposta de amostra</span>
                  </button>
                </div>
              </div>

              {/* Distribution Preview Box */}
              <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#243242] pb-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Prévia de Distribuição por Estrato
                  </span>
                  <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                    Proposta local (não oficial)
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2">
                    <span className="block text-[10px] text-slate-500">Total elegível</span>
                    <span className="font-mono text-base font-bold tabular-nums">
                      {proposalPreview.eligibleTotal}
                    </span>
                  </div>
                  <div className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2">
                    <span className="block text-[10px] text-slate-500">Percentual</span>
                    <span className="font-mono text-base font-bold tabular-nums">
                      {samplingConfig.percentage}%
                    </span>
                  </div>
                  <div className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2">
                    <span className="block text-[10px] text-slate-500">Selecionados</span>
                    <span className="font-mono text-base font-bold tabular-nums text-[#0F5E59] dark:text-[#2DD4BF]">
                      {proposalPreview.selectedCount}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {proposalPreview.distribution.map((row) => (
                    <div key={row.stratum} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{row.stratum}</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        {row.selected} de {row.eligible}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Step 8 (Resultados) + Step 9 (Plano de Corretivas) Panels */}
          <div
            ref={resultsSectionRef}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          >
            <div
              className={`lg:col-span-5 rounded-lg border bg-white dark:bg-[#111923] p-4 space-y-3 text-xs ${
                activeStep === 8
                  ? 'border-[#0F5E59] dark:border-[#2DD4BF]'
                  : 'border-slate-200 dark:border-[#243242]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  8. Resultados Consolidados da Amostra
                </h3>
                <span className="font-mono font-bold text-[#0F5E59] dark:text-[#2DD4BF]">
                  {auditResultsSummary.rate}% Conforme
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded border border-slate-200 dark:border-[#243242] p-2">
                  <span className="block text-[10px] text-slate-500">Conformes</span>
                  <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {auditResultsSummary.conforme}
                  </span>
                </div>
                <div className="rounded border border-slate-200 dark:border-[#243242] p-2">
                  <span className="block text-[10px] text-slate-500">Não Conf.</span>
                  <span className="font-mono text-lg font-bold text-red-700 dark:text-red-400">
                    {auditResultsSummary.naoConforme}
                  </span>
                </div>
                <div className="rounded border border-slate-200 dark:border-[#243242] p-2">
                  <span className="block text-[10px] text-slate-500">N/A</span>
                  <span className="font-mono text-lg font-bold text-slate-600 dark:text-slate-300">
                    {auditResultsSummary.naoAplicavel}
                  </span>
                </div>
                <div className="rounded border border-slate-200 dark:border-[#243242] p-2">
                  <span className="block text-[10px] text-slate-500">Pendentes</span>
                  <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400">
                    {auditResultsSummary.pendentes}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`lg:col-span-7 rounded-lg border bg-white dark:bg-[#111923] p-4 space-y-2.5 text-xs ${
                activeStep === 9
                  ? 'border-[#0F5E59] dark:border-[#2DD4BF]'
                  : 'border-slate-200 dark:border-[#243242]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  9. Ações Corretivas & Vínculo em Pendências
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveArea('pendencias')}
                  className="text-xs font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
                >
                  Ver fila de pendências →
                </button>
              </div>
              {auditResultsSummary.correctiveItems.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">
                  Nenhuma ação corretiva registrada até o momento nesta amostra.
                </p>
              ) : (
                <div className="space-y-2">
                  {auditResultsSummary.correctiveItems.map((ci) => (
                    <div
                      key={ci.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-semibold text-red-800 dark:text-red-300">
                          #{ci.ticketId} · {ci.correctiveOwner || ci.techName} · Prazo{' '}
                          {ci.correctiveDueDate || '—'}
                        </div>
                        <div className="text-slate-800 dark:text-slate-200">
                          {ci.correctiveAction || ci.observation}
                        </div>
                      </div>
                      <SemanticLabel state="critical" label="Propagada em Pendências" compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Tickets for Manual Audit + AI Suggestions */}
          <div
            ref={samplesSectionRef}
            className="grid grid-cols-1 xl:grid-cols-12 gap-4"
          >
            {/* Manual Audit Table (8 cols) */}
            <div className="xl:col-span-8 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#243242] px-4 py-3">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    6–7. Chamados Selecionados para Auditoria Humana
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Avaliações concluídas como "Não Conforme" geram automaticamente Pendência Gerencial
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#1D2836]">
                {auditSamples.map((item) => (
                  <div key={item.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            #{item.ticketId}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.techName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.macroArea}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.auditStatus}</span>
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.ticketTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          Critério: {item.popCriterion}
                        </p>
                        {item.verdict && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <SemanticLabel
                              state={
                                item.verdict === 'Conforme'
                                  ? 'nominal'
                                  : item.verdict === 'Não Conforme'
                                    ? 'critical'
                                    : 'neutral'
                              }
                              label={`Resultado: ${item.verdict}`}
                              compact
                            />
                            {item.correctiveAction && (
                              <span className="text-[11px] text-red-700 dark:text-red-400">
                                · Corretiva: {item.correctiveAction}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={GlpiAdapter.getTicketExternalUrl(endpointConfig, item.ticketId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-[#0F5E59]"
                        >
                          <span>GLPI</span>
                          <ExternalLink size={11} />
                        </a>
                        <button
                          type="button"
                          onClick={() => openAuditDrawer(item)}
                          className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-2.5 py-1 text-xs font-medium text-white dark:text-slate-950 transition-colors"
                        >
                          {item.auditStatus === 'Pendente' ? 'Auditar' : 'Revisar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Suggestions Panel + History (4 cols) */}
            <div className="xl:col-span-4 space-y-4">
              <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#243242] pb-2.5">
                  <Bot size={16} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      IA na Auditoria (Apoio)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      A IA apenas sugere pontos de atenção e nunca aprova auditorias
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {aiSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          Chamado #{sug.ticketId}
                        </span>
                        {typeof sug.confidence === 'number' && (
                          <span className="text-slate-500">
                            Confiança: {Math.round(sug.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {sug.attentionPoint}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">{sug.rationale}</p>
                      <p className="text-[11px] text-slate-500">
                        <strong>Evidência:</strong> {sug.evidence} · <strong>Fonte:</strong> {sug.source}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          {sug.reviewState}
                        </span>
                        <div className="flex items-center gap-2">
                          {sug.reviewState === 'Aguardando revisão humana' && (
                            <button
                              type="button"
                              onClick={() => updateAiSuggestionState(sug.id, 'Descartada')}
                              className="text-slate-500 hover:text-red-600"
                            >
                              Descartar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const match = auditSamples.find((s) => s.ticketId === sug.ticketId);
                              if (match) {
                                openAuditDrawer(match);
                                updateAiSuggestionState(sug.id, 'Aceita para auditoria');
                              }
                            }}
                            className="font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
                          >
                            Revisar manualmente
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#243242] pb-2">
                  <History size={15} className="text-slate-500" />
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Histórico das Seleções
                  </h3>
                </div>
                <div className="mt-2.5 space-y-2.5 text-xs">
                  {samplingHistory.map((h) => (
                    <div key={h.id} className="border-b border-slate-100 dark:border-[#1D2836] pb-2 last:border-none last:pb-0">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold">{h.createdAt}</span>
                        <span className="text-amber-700 dark:text-amber-400">
                          {h.originState === 'proposed_preview' ? 'Proposta visual' : 'Gerada pelo backend'}
                        </span>
                      </div>
                      <div className="mt-0.5 text-slate-700 dark:text-slate-300">
                        {h.selectedCount} de {h.eligibleTotal} ({h.percentage}%) · {h.universe}
                      </div>
                      <div className="text-[11px] text-slate-500">{h.criteriaSummary}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: + Nova Pendência Gerencial */}
      <Modal
        open={createPendingModalOpen}
        onClose={() => setCreatePendingModalOpen(false)}
        title="Registrar Nova Pendência Gerencial"
        subtitle="Salva localmente em localStorage · Gravação definitiva aguarda FastAPI (:3312)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newDescription.trim()) return;
            addPending({
              origin: newOrigin,
              ticketId: newTicketId ? Number(newTicketId) || undefined : undefined,
              description: newDescription.trim(),
              owner: newOwner,
              criticality: newCriticality,
              dueDate: newDueDate || 'Esta semana',
              status: 'Aberta',
              nextAction: newNextAction.trim() || 'Acompanhar execução junto ao responsável',
            });
            setCreatePendingModalOpen(false);
            setNewDescription('');
            setNewTicketId('');
            setNewNextAction('');
            pushToast({
              title: 'Pendência adicionada na sessão local',
              tone: 'success',
            });
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Origem</label>
              <select
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value as ManagementPending['origin'])}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2"
              >
                <option value="GLPI">GLPI</option>
                <option value="Auditoria">Auditoria</option>
                <option value="Alinhamento Semanal">Alinhamento Semanal</option>
                <option value="Alinhamento Individual">Alinhamento Individual</option>
                <option value="GMUD">GMUD</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Chamado vinculado (opcional)</label>
              <input
                type="number"
                value={newTicketId}
                onChange={(e) => setNewTicketId(e.target.value)}
                placeholder="Ex.: 48291"
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Descrição</label>
            <textarea
              rows={2}
              required
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descreva o impedimento ou ação gerencial necessária..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium mb-1">Responsável</label>
              <select
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-2"
              >
                <option value="Gestão Operacional">Gestão Operacional</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Criticidade</label>
              <select
                value={newCriticality}
                onChange={(e) =>
                  setNewCriticality(e.target.value as ManagementPending['criticality'])
                }
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-2"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Prazo</label>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Próxima ação</label>
            <input
              type="text"
              value={newNextAction}
              onChange={(e) => setNewNextAction(e.target.value)}
              placeholder="Ação de acompanhamento..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreatePendingModalOpen(false)}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Registrar pendência
            </button>
          </div>
        </form>
      </Modal>

      {/* Pending Detail & Tratativa Drawer */}
      <Drawer
        open={Boolean(selectedPending)}
        onClose={() => setSelectedPendingId(null)}
        title="Tratativa da Pendência Gerencial"
        subtitle={selectedPending ? `Origem: ${selectedPending.origin}` : undefined}
      >
        {selectedPending && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Criticidade: {selectedPending.criticality}
                </span>
                <span className="font-mono">Prazo: {selectedPending.dueDate}</span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {selectedPending.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Situação da tratativa
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ManagementPending['status'])}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-2 text-xs"
                >
                  <option value="Aberta">Aberta</option>
                  <option value="Em tratamento">Em tratamento</option>
                  <option value="Impedimento externo">Impedimento externo</option>
                  <option value="Vencida">Vencida</option>
                  <option value="Resolvida">Resolvida</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Responsável
                </label>
                <select
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-2 text-xs"
                >
                  <option value="Gestão Operacional">Gestão Operacional</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Próxima ação / Encaminhamento
              </label>
              <textarea
                rows={3}
                value={editNextAction}
                onChange={(e) => setEditNextAction(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] p-2.5 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#243242] pt-3">
              {selectedPending.ticketId ? (
                <a
                  href={GlpiAdapter.getTicketExternalUrl(endpointConfig, selectedPending.ticketId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5 font-medium text-[#0F5E59] dark:text-[#2DD4BF]"
                >
                  <span>Abrir #{selectedPending.ticketId} no GLPI</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span className="text-[11px] text-slate-500">Salvo em localStorage</span>
              )}

              <button
                type="button"
                onClick={() => {
                  updatePending(selectedPending.id, {
                    status: editStatus,
                    owner: editOwner,
                    nextAction: editNextAction,
                  });
                  setSelectedPendingId(null);
                  pushToast({
                    title: 'Pendência atualizada na sessão',
                    description: `Situação: ${editStatus} · Responsável: ${editOwner}`,
                    tone: 'success',
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-1.5 font-medium text-white dark:text-slate-950"
              >
                <CheckCircle2 size={13} />
                <span>Salvar tratativa</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Manual Audit Evaluation Drawer */}
      <Drawer
        open={Boolean(auditingItem)}
        onClose={() => setAuditingItem(null)}
        title={auditingItem ? `Auditoria Manual · Chamado #${auditingItem.ticketId}` : 'Auditoria Manual'}
        subtitle={auditingItem ? `${auditingItem.techName} · ${auditingItem.macroArea}` : undefined}
        widthClass="max-w-xl"
      >
        {auditingItem && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {auditingItem.ticketTitle}
                </h4>
                <a
                  href={GlpiAdapter.getTicketExternalUrl(endpointConfig, auditingItem.ticketId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#0F5E59] dark:text-[#2DD4BF] font-medium whitespace-nowrap shrink-0"
                >
                  <span>GLPI</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Critério POP:</strong> {auditingItem.popCriterion}
              </p>
              <p className="text-slate-500">
                Grupo: {auditingItem.group} · Categoria: {auditingItem.category} · Status: {auditingItem.status}
              </p>
            </div>

            <div>
              <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Resultado da avaliação
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['Conforme', 'Não Conforme', 'Não Aplicável'] as AuditVerdict[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraftVerdict(v)}
                    className={`rounded-md border px-2.5 py-2 text-xs font-medium transition-colors ${
                      draftVerdict === v
                        ? v === 'Não Conforme'
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-[#0F5E59] bg-[#0F5E59] text-white dark:border-[#2DD4BF] dark:bg-[#2DD4BF] dark:text-slate-950'
                        : 'border-slate-200 dark:border-[#243242] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Observação do auditor
              </label>
              <textarea
                rows={3}
                value={draftObservation}
                onChange={(e) => setDraftObservation(e.target.value)}
                placeholder="Descreva a verificação realizada frente ao POP..."
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] p-2.5 text-xs focus:outline-none focus:border-[#0F5E59]"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Evidências verificadas
              </label>
              <input
                type="text"
                value={draftEvidence}
                onChange={(e) => setDraftEvidence(e.target.value)}
                placeholder="Ex.: Anexo no GLPI, aceite do solicitante, log de alteração..."
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0F5E59]"
              />
            </div>

            {draftVerdict === 'Não Conforme' && (
              <div className="space-y-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-3">
                <div className="font-semibold text-red-800 dark:text-red-300">
                  Plano de Ação Corretiva Obrigatório (gera Pendência Gerencial)
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ação corretiva
                  </label>
                  <input
                    type="text"
                    value={draftCorrectiveAction}
                    onChange={(e) => setDraftCorrectiveAction(e.target.value)}
                    placeholder="Defina a ação necessária para saneamento..."
                    className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={draftOwner}
                      onChange={(e) => setDraftOwner(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Prazo
                    </label>
                    <input
                      type="date"
                      value={draftDueDate}
                      onChange={(e) => setDraftDueDate(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#243242] pt-3">
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                Persistido em sessão local (localStorage).
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAuditEvaluation('Rascunho')}
                  className="rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18222F]"
                >
                  Salvar rascunho
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAuditEvaluation('Concluída')}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-1.5 font-medium text-white dark:text-slate-950"
                >
                  <CheckCircle2 size={14} />
                  <span>Concluir auditoria</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
