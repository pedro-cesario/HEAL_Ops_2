import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  FileText,
  History,
  Plus,
  Printer,
  ShieldAlert,
  ShieldPlus,
} from 'lucide-react';
import { useOps } from '../../context/OpsContext';
import type {
  GmudApprovalSlot,
  GmudChecklistPhase,
  GmudWorkflowStatus,
} from '../../types/ops';

const MAIN_FLOW_STATES: GmudWorkflowStatus[] = [
  'Rascunho',
  'Análise',
  'Aguardando Aprovação',
  'Aprovada',
  'Em Execução',
  'Validação',
  'Concluída',
];

const ALL_WORKFLOW_STATES: GmudWorkflowStatus[] = [
  ...MAIN_FLOW_STATES,
  'Rejeitada',
  'Cancelada',
  'Rollback Executado',
];

const CHECKLIST_PHASES: GmudChecklistPhase[] = [
  'Pré-Execução',
  'Execução',
  'Validação',
  'Encerramento',
];

function PendingBadge({ value }: { value: string }) {
  if (value.trim()) return null;
  return (
    <span className="ml-1.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400">
      · Pendente de preenchimento
    </span>
  );
}

export const Gmud042Workspace: React.FC<{
  initialView?: 'workspace' | 'document';
  onClose: () => void;
}> = ({ initialView = 'workspace', onClose }) => {
  const {
    gmud042,
    updateGmud042,
    transitionGmud042,
    toggleGmudChecklistItem,
    addGmudChecklistItem,
    updateGmudApproval,
    teamMembers,
    addPending,
    pushToast,
  } = useOps();

  const [viewMode, setViewMode] = useState<'workspace' | 'document'>(initialView);
  const [activeTab, setActiveTab] = useState<'escopo' | 'planos' | 'checklists' | 'governanca'>(
    'escopo'
  );
  const [targetState, setTargetState] = useState<GmudWorkflowStatus>(gmud042.status);
  const [transitionActor, setTransitionActor] = useState('Gestor de TI');
  const [transitionNote, setTransitionNote] = useState('');

  const [newCheckPhase, setNewCheckPhase] = useState<GmudChecklistPhase>('Pré-Execução');
  const [newCheckText, setNewCheckText] = useState('');
  const [newCheckOwner, setNewCheckOwner] = useState('Rafael Oliveira');

  const pendingFields = useMemo(() => {
    const missing: string[] = [];
    if (!gmud042.justification.trim()) missing.push('Justificativa formal');
    if (!gmud042.closureResult.trim()) missing.push('Resultado final / encerramento');
    if (gmud042.approvals.some((a) => !a.approverName.trim())) {
      missing.push('Aprovador de Ciência Administrativa / Recepção');
    }
    if (gmud042.equipmentAndLocations.toLowerCase().includes('pendente')) {
      missing.push('Modelos / patrimônios exatos dos 3 switches');
    }
    if (gmud042.rollbackPlan.toLowerCase().includes('pendente')) {
      missing.push('Anexo do script de rollback offline');
    }
    return missing;
  }, [gmud042]);

  const doneChecklistCount = gmud042.checklist.filter((c) => c.done).length;

  const handleTransition = (nextState: GmudWorkflowStatus) => {
    transitionGmud042(nextState, transitionActor, transitionNote);
    setTargetState(nextState);
    setTransitionNote('');
    pushToast({
      title: `GMUD-042 movida para "${nextState}" (Simulação Demo)`,
      description:
        'Transição registrada localmente para homologação visual; nenhuma aprovação real ou alteração em switch ocorreu.',
      tone: 'info',
    });
  };

  const handleEscalatePending = () => {
    addPending({
      origin: 'GMUD',
      description: `[${gmud042.code}] Acompanhamento de campos/pré-requisitos pendentes (${pendingFields[0] || 'Checklist pré-execução'})`,
      owner: gmud042.technicalLead || 'Rafael Oliveira',
      criticality: 'Alta',
      dueDate: '16/11 · 18:00',
      status: 'Aberta',
      nextAction: 'Concluir anexo de rollback offline e aprovações antes da janela das 19h',
    });
    pushToast({
      title: 'Pendência vinculada à GMUD-042',
      description: 'Encaminhada para o módulo Pendências e Auditoria na sessão local.',
      tone: 'success',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-3.5">
      {/* Header Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#18222F] whitespace-nowrap"
          >
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="font-bold text-[#0F5E59] dark:text-[#2DD4BF]">{gmud042.code}</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                Status: {gmud042.status}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">
                Checklist {doneChecklistCount}/{gmud042.checklist.length} · Campos pendentes:{' '}
                {pendingFields.length}
              </span>
            </div>
            <h1 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {gmud042.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
          <button
            type="button"
            onClick={handleEscalatePending}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:border-[#0F5E59] whitespace-nowrap"
          >
            <ShieldPlus size={13} />
            <span>Criar Pendência GMUD</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'workspace' ? 'document' : 'workspace')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 font-medium hover:border-[#0F5E59] whitespace-nowrap"
          >
            <FileText size={13} />
            <span>{viewMode === 'workspace' ? 'Prévia Documento A4' : 'Voltar à GMUD'}</span>
          </button>
        </div>
      </div>

      {/* Explicit Demo Safety Banner */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/75 dark:bg-amber-950/25 px-4 py-2 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="shrink-0" />
          <span>
            <strong>Ambiente Demonstrativo (TPL-04):</strong> Aprovação e mudanças de estado abaixo simulam o fluxo de governança apenas no navegador — nenhuma ação real é executada em switches e a numeração TPL-04 aguarda conciliação oficial.
          </span>
        </div>
        <span className="font-mono text-[11px]">Atualizado em {gmud042.lastUpdatedAt}</span>
      </div>

      {viewMode === 'document' ? (
        <div className="space-y-3">
          <div className="no-print flex justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded bg-[#0F5E59] px-3 py-1.5 text-xs font-medium text-white"
            >
              <Printer size={13} />
              <span>Imprimir GMUD-042 em A4</span>
            </button>
          </div>

          <article className="print-only-surface mx-auto max-w-4xl rounded-lg border border-slate-300 dark:border-[#243242] bg-white text-slate-900 p-6 sm:p-8 shadow-xs space-y-4 text-xs">
            <header className="print-avoid-break flex flex-wrap justify-between gap-4 border-b-2 border-[#0F5E59] pb-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0F5E59]">
                  Instituto HEAL · Gestão de Mudanças (GMUD)
                </div>
                <h2 className="mt-1 font-display text-lg font-bold">
                  {gmud042.code} — {gmud042.title}
                </h2>
                <div className="text-slate-600 mt-0.5">
                  Líder Técnico: {gmud042.technicalLead} · Equipe: {gmud042.executingTeam}
                </div>
              </div>
              <div className="font-mono text-right text-slate-600 space-y-0.5">
                <div>Status (Simulado): {gmud042.status}</div>
                <div>Janela: {gmud042.executionWindow}</div>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <strong>Objetivo:</strong> {gmud042.objective}
              </div>
              <div>
                <strong>Justificativa:</strong>{' '}
                {gmud042.justification || 'Pendente de preenchimento'}
              </div>
              <div>
                <strong>Escopo:</strong> {gmud042.scope}
              </div>
              <div>
                <strong>Equipamentos e Locais:</strong> {gmud042.equipmentAndLocations}
              </div>
              <div>
                <strong>Impacto e Riscos:</strong> {gmud042.impactAndRiskAnalysis}
              </div>
              <div>
                <strong>Dependências:</strong> {gmud042.dependencies}
              </div>
              <div>
                <strong>Plano de Execução:</strong> {gmud042.executionPlan}
              </div>
              <div>
                <strong>Plano de Comunicação:</strong> {gmud042.communicationPlan}
              </div>
              <div>
                <strong>Plano de Testes:</strong> {gmud042.testPlan}
              </div>
              <div>
                <strong>Plano de Rollback:</strong> {gmud042.rollbackPlan}
              </div>
              <div>
                <strong>Evidências:</strong> {gmud042.evidencesNote}
              </div>
              <div>
                <strong>Resultado Final:</strong>{' '}
                {gmud042.closureResult || 'Pendente de preenchimento'}
              </div>
            </div>

            <section className="print-avoid-break space-y-1.5">
              <h3 className="font-bold border-b border-slate-200 pb-1">
                Checklist Operacional ({doneChecklistCount}/{gmud042.checklist.length})
              </h3>
              <ul className="space-y-1">
                {gmud042.checklist.map((item) => (
                  <li key={item.id}>
                    [{item.done ? 'X' : ' '}] <strong>[{item.phase}]</strong> {item.text} (
                    {item.ownerName})
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </div>
      ) : (
        <>
          {/* Workflow Stepper & Simulated State Transition Bar */}
          <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Fluxo de Estados da Mudança (Simulação Demo Livre)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(['Rejeitada', 'Cancelada', 'Rollback Executado'] as GmudWorkflowStatus[]).map(
                  (alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => handleTransition(alt)}
                      className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                        gmud042.status === alt
                          ? 'border-red-500 bg-red-600 text-white'
                          : 'border-slate-200 dark:border-[#243242] text-slate-600 dark:text-slate-300 hover:border-red-400'
                      }`}
                    >
                      {alt}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
              {MAIN_FLOW_STATES.map((st, idx) => {
                const isCurrent = gmud042.status === st;
                const currentIdx = MAIN_FLOW_STATES.indexOf(gmud042.status);
                const passed = currentIdx >= 0 && idx < currentIdx;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleTransition(st)}
                    className={`rounded border px-2 py-1.5 text-left text-[11px] font-medium transition-colors ${
                      isCurrent
                        ? 'border-[#0F5E59] bg-[#0F5E59] text-white dark:border-[#2DD4BF] dark:bg-[#2DD4BF] dark:text-slate-950 font-semibold'
                        : passed
                          ? 'border-[#0F5E59]/40 bg-[#0F5E59]/10 text-[#0F5E59] dark:text-[#2DD4BF]'
                          : 'border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] text-slate-600 dark:text-slate-400 hover:border-[#0F5E59]'
                    }`}
                  >
                    <span className="font-mono">{idx + 1}.</span> {st}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100 dark:border-[#1D2836]">
              <select
                aria-label="Estado destino da GMUD-042"
                value={targetState}
                onChange={(e) => setTargetState(e.target.value as GmudWorkflowStatus)}
                className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 font-medium"
              >
                {ALL_WORKFLOW_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <select
                aria-label="Responsável pela transição"
                value={transitionActor}
                onChange={(e) => setTransitionActor(e.target.value)}
                className="sm:col-span-3 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5"
              >
                <option value="Gestor de TI">Gestor de TI</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="Justificativa / registro da transição simulada..."
                className="sm:col-span-4 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleTransition(targetState)}
                className="sm:col-span-2 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-3 py-1.5 font-medium text-white dark:text-slate-950 whitespace-nowrap"
              >
                Aplicar estado
              </button>
            </div>
          </div>

          {/* Pending Fields Notice */}
          {pendingFields.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-4 py-2 text-xs text-slate-700 dark:text-slate-300">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Campos sinalizados como Pendente de preenchimento ({pendingFields.length}):</strong>{' '}
                {pendingFields.join(' · ')} (edite livremente abaixo sem inventar dados não confirmados).
              </span>
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-1.5 text-xs">
            {[
              { id: 'escopo', label: '1. Escopo, Equipe, Riscos & Janela' },
              { id: 'planos', label: '2. Execução, Comunicação, Testes & Rollback' },
              {
                id: 'checklists',
                label: `3. Checklists por Fase (${doneChecklistCount}/${gmud042.checklist.length})`,
              },
              {
                id: 'governanca',
                label: `4. Aprovações, Encerramento & Histórico (${gmud042.transitions.length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id as 'escopo' | 'planos' | 'checklists' | 'governanca')
                }
                className={`rounded-md px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18222F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Identificação, Objetivo, Justificativa, Escopo, Equipamentos, Equipe, Janela, Riscos, Dependências */}
          {activeTab === 'escopo' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 text-xs">
              <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Identificação, Objetivo, Justificativa & Escopo
                </h2>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Objetivo
                    <PendingBadge value={gmud042.objective} />
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.objective}
                    onChange={(e) => updateGmud042({ objective: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Justificativa formal
                    <PendingBadge value={gmud042.justification} />
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.justification}
                    onChange={(e) => updateGmud042({ justification: e.target.value })}
                    placeholder="Pendente de preenchimento — registre a motivação assistencial/administrativa..."
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Escopo
                    <PendingBadge value={gmud042.scope} />
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.scope}
                    onChange={(e) => updateGmud042({ scope: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Equipamentos e Locais envolvidos
                  </label>
                  <input
                    type="text"
                    value={gmud042.equipmentAndLocations}
                    onChange={(e) => updateGmud042({ equipmentAndLocations: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                  />
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Responsabilidade, Janela, Riscos de Disponibilidade & Dependências
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Responsável técnico
                    </label>
                    <input
                      type="text"
                      value={gmud042.technicalLead}
                      onChange={(e) => updateGmud042({ technicalLead: e.target.value })}
                      className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Janela prevista
                    </label>
                    <input
                      type="text"
                      value={gmud042.executionWindow}
                      onChange={(e) => updateGmud042({ executionWindow: e.target.value })}
                      className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Equipe executora
                  </label>
                  <input
                    type="text"
                    value={gmud042.executingTeam}
                    onChange={(e) => updateGmud042({ executingTeam: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-amber-700 dark:text-amber-400 mb-1">
                    Análise de impacto e risco de disponibilidade
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.impactAndRiskAnalysis}
                    onChange={(e) => updateGmud042({ impactAndRiskAnalysis: e.target.value })}
                    className="w-full rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/15 p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Dependências e pré-requisitos técnicos
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.dependencies}
                    onChange={(e) => updateGmud042({ dependencies: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
              </section>
            </div>
          )}

          {/* Tab 2: Planos de Execução, Comunicação, Testes, Rollback e Evidências */}
          {activeTab === 'planos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 text-xs">
              <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Plano de Execução & Comunicação
                </h2>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Plano de execução passo a passo
                  </label>
                  <textarea
                    rows={4}
                    value={gmud042.executionPlan}
                    onChange={(e) => updateGmud042({ executionPlan: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Plano de comunicação às áreas
                  </label>
                  <textarea
                    rows={3}
                    value={gmud042.communicationPlan}
                    onChange={(e) => updateGmud042({ communicationPlan: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Testes, Rollback e Evidências
                </h2>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Plano de testes pós-corte
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.testPlan}
                    onChange={(e) => updateGmud042({ testPlan: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-red-700 dark:text-red-400 mb-1">
                    Plano de rollback
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.rollbackPlan}
                    onChange={(e) => updateGmud042({ rollbackPlan: e.target.value })}
                    className="w-full rounded border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/15 p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Evidências anexadas / registradas
                  </label>
                  <textarea
                    rows={2}
                    value={gmud042.evidencesNote}
                    onChange={(e) => updateGmud042({ evidencesNote: e.target.value })}
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: Checklists por fase */}
          {activeTab === 'checklists' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CHECKLIST_PHASES.map((phase) => {
                  const items = gmud042.checklist.filter((c) => c.phase === phase);
                  const phaseDone = items.filter((c) => c.done).length;
                  return (
                    <section
                      key={phase}
                      className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
                        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                          Fase: {phase}
                        </h3>
                        <span className="font-mono font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                          {phaseDone}/{items.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <label
                            key={item.id}
                            className={`flex items-start justify-between gap-2 rounded border p-2 cursor-pointer transition-colors ${
                              item.done
                                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/15'
                                : 'border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F]'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => toggleGmudChecklistItem(item.id)}
                                className="mt-0.5 accent-[#0F5E59]"
                              />
                              <span className={item.done ? 'line-through text-slate-500' : ''}>
                                {item.text}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                              {item.ownerName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCheckText.trim()) return;
                  addGmudChecklistItem(newCheckPhase, newCheckText, newCheckOwner);
                  setNewCheckText('');
                }}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3"
              >
                <CheckSquare size={14} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
                <select
                  value={newCheckPhase}
                  onChange={(e) => setNewCheckPhase(e.target.value as GmudChecklistPhase)}
                  className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5"
                >
                  {CHECKLIST_PHASES.map((ph) => (
                    <option key={ph} value={ph}>
                      {ph}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCheckText}
                  onChange={(e) => setNewCheckText(e.target.value)}
                  placeholder="Adicionar novo item verificável ao checklist..."
                  className="flex-1 min-w-[220px] rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={newCheckOwner}
                  onChange={(e) => setNewCheckOwner(e.target.value)}
                  placeholder="Responsável"
                  className="w-36 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded bg-[#0F5E59] dark:bg-[#14B8A6] px-3 py-1.5 font-medium text-white dark:text-slate-950"
                >
                  <Plus size={13} />
                  <span>Adicionar item</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Aprovações (simulação), Encerramento e Histórico de Transições */}
          {activeTab === 'governanca' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 text-xs">
              <section className="lg:col-span-6 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  15. Aprovações (Simulação Demo) & 16. Resultado Final
                </h2>

                <div className="space-y-2">
                  {gmud042.approvals.map((apv) => (
                    <div
                      key={apv.id}
                      className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {apv.role}
                        </span>
                        <select
                          value={apv.decision}
                          onChange={(e) =>
                            updateGmudApproval(apv.id, {
                              decision: e.target.value as GmudApprovalSlot['decision'],
                            })
                          }
                          className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-0.5 text-[11px] font-medium"
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Aprovado (Simulação)">Aprovado (Simulação)</option>
                          <option value="Rejeitado (Simulação)">Rejeitado (Simulação)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={apv.approverName}
                          onChange={(e) =>
                            updateGmudApproval(apv.id, { approverName: e.target.value })
                          }
                          placeholder="Pendente de preenchimento..."
                          className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1"
                        />
                        <input
                          type="text"
                          value={apv.note}
                          onChange={(e) =>
                            updateGmudApproval(apv.id, { note: e.target.value })
                          }
                          placeholder="Observação da aprovação..."
                          className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Resultado final / encerramento da GMUD
                    <PendingBadge value={gmud042.closureResult} />
                  </label>
                  <textarea
                    rows={3}
                    value={gmud042.closureResult}
                    onChange={(e) => updateGmud042({ closureResult: e.target.value })}
                    placeholder="Pendente de preenchimento — registre o resultado após a janela e operação assistida..."
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                  />
                </div>
              </section>

              <section className="lg:col-span-6 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1D2836] pb-2">
                  <div className="flex items-center gap-2">
                    <History size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
                    <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      Trilha de Transições Simuladas ({gmud042.transitions.length})
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    localStorage ativo
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
                  {gmud042.transitions.map((tr) => (
                    <div
                      key={tr.id}
                      className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                          {tr.fromStatus} → {tr.toStatus}
                        </span>
                        <span className="text-slate-500">
                          {tr.timestamp} · {tr.actorName}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{tr.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
};
