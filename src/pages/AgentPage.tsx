import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileSearch,
  History,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import {
  SemanticLabel,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import type { AgentMessage, AgentMessageCategory } from '../types/ops';

const QUICK_PROMPTS = [
  { label: 'Analisar chamados críticos', text: 'Analisar os chamados assistenciais sem técnico nominal e apontar riscos POP.' },
  { label: 'Identificar gargalos', text: 'Quais os principais gargalos de fila acima de 24h corridas hoje?' },
  { label: 'Preparar Daily (TPL-01)', text: 'Preparar roteiro da Daily Operacional herdando as prioridades do Alinhamento Semanal.' },
  { label: 'Sugerir pendências', text: 'Identificar itens recorrentes que merecem virar pendência gerencial.' },
  { label: 'Apoiar auditoria', text: 'Listar pontos de atenção na amostra de auditoria atual.' },
  { label: 'Preparar relatório', text: 'Estruturar resumo executivo de chamados únicos concluídos da semana.' },
];

const CATEGORY_LABELS: Record<AgentMessageCategory, { label: string; tone: 'nominal' | 'attention' | 'critical' | 'neutral' | 'unavailable' }> = {
  sugestao: { label: 'Sugestão (Demonstrativa)', tone: 'neutral' },
  analise: { label: 'Análise (Demonstrativa)', tone: 'nominal' },
  aprovacao_pendente: { label: 'Aguardando aprovação', tone: 'attention' },
  executada: { label: 'Executado no backend', tone: 'nominal' },
  bloqueada_demo: { label: 'Bloqueado (Sem backend conectado)', tone: 'attention' },
  falha: { label: 'Rejeitada / Falha', tone: 'critical' },
  indisponivel: { label: 'Serviço indisponível', tone: 'unavailable' },
};

export const AgentPage: React.FC = () => {
  const {
    dataMode,
    triggerRefresh,
    endpointConfig,
    setActiveModule,
    pushToast,
    agentMessages,
    setAgentMessages,
    agentActivityLogs,
    appendAgentActivity,
    computedTickets,
    computedKpis,
    weeklyPriorities,
    pendings,
    auditSamples,
  } = useOps();

  const [inputText, setInputText] = useState('');

  const buildContextualAgentReply = (query: string): AgentMessage => {
    const q = query.toLowerCase();
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const thresholdHours = Math.max(1, endpointConfig.staleTicketThresholdHours || 24);
    const basisLabel = endpointConfig.staleTicketTimeBasis === 'uteis' ? 'úteis' : 'corridas';

    const popNonCompliant = computedTickets.filter((t) => t.isPopNonCompliant);
    const staleTickets = computedTickets.filter((t) => t.hoursWithoutUpdate > thresholdHours);
    const noTechTickets = computedTickets.filter((t) => !t.techName);
    const openPendings = pendings.filter((p) => p.status !== 'Resolvida');
    const nonConformingAudits = auditSamples.filter((a) => a.verdict === 'Não Conforme');
    const pendingAudits = auditSamples.filter((a) => a.auditStatus !== 'Concluída');

    if (q.includes('pop') || q.includes('sem técnico') || q.includes('crític')) {
      return {
        id: `a-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: now,
        category: 'analise',
        content: `Diagnóstico POP na sessão atual: ${popNonCompliant.length} chamado(s) em desconformidade POP entre ${noTechTickets.length} sem técnico nominal (${computedTickets.length} na amostra ativa). Os demais sem técnico seguem exceções verticais autorizadas.`,
        evidence: popNonCompliant.slice(0, 4).map(
          (t) => `#${t.id} (${t.macroArea} · SLA ${t.slaRisk}) — ${t.title} [${t.classificationReason}]`
        ),
        sources: [
          'Amostra GLPI da sessão (Base Demonstrativa)',
          `Regra POP HEAL + parâmetro > ${thresholdHours}h ${basisLabel}`,
        ],
      };
    }

    if (q.includes('gargal') || q.includes('atualiza') || q.includes('24h') || q.includes('fila')) {
      return {
        id: `a-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: now,
        category: 'analise',
        content: `Mapeamento de gargalos (> ${thresholdHours}h ${basisLabel}): foram identificados ${staleTickets.length} chamado(s) sem interação válida dentro da regra vigente configurada em Configurações.`,
        evidence:
          staleTickets.length > 0
            ? staleTickets.map(
                (t) =>
                  `#${t.id} · ${t.hoursWithoutUpdate}h sem atualização · ${t.techName || 'Sem técnico'} (${t.macroArea})`
              )
            : [`Nenhum chamado ativo acima de ${thresholdHours}h ${basisLabel} na sessão atual.`],
        sources: [
          `Configuração vigente: > ${thresholdHours}h ${basisLabel}`,
          'Visão Geral / TicketDrawer sincronizado',
        ],
      };
    }

    if (q.includes('daily') || q.includes('tpl-01') || q.includes('prioridade')) {
      return {
        id: `a-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: now,
        category: 'sugestao',
        content: `Roteiro sugerido para a Daily Operacional (TPL-01): herdar as ${weeklyPriorities.length} prioridades oficiais do Alinhamento Semanal (TPL-02), priorizando os ${popNonCompliant.length} item(ns) POP e os ${staleTickets.length} chamado(s) acima de ${thresholdHours}h ${basisLabel}.`,
        evidence: weeklyPriorities.slice(0, 5).map(
          (p) => `#${p.ticketId} (${p.status}) — ${p.title} · Resp.: ${p.owner} · Próx.: ${p.nextAction}`
        ),
        sources: ['Prioridades sincronizadas do TPL-02', 'Carteira de chamados da sessão'],
      };
    }

    if (q.includes('pendên') || q.includes('recorrent')) {
      return {
        id: `a-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: now,
        category: 'sugestao',
        content: `Consolidado de pendências na sessão: existem ${openPendings.length} pendência(s) aberta(s)/em tratamento (${pendings.length} no total) e ${nonConformingAudits.length} auditoria(s) marcadas como Não Conforme que exigem tratativa gerencial.`,
        evidence: openPendings.slice(0, 4).map(
          (p) => `${p.id} [${p.criticality}] · ${p.description} · Resp.: ${p.owner} (Prazo ${p.dueDate})`
        ),
        sources: ['Módulo Pendências e Auditoria (sessão local)'],
      };
    }

    if (q.includes('auditor') || q.includes('amostra')) {
      return {
        id: `a-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: now,
        category: 'analise',
        content: `Situação da amostra de auditoria na sessão: ${auditSamples.length} item(ns) selecionados na amostra, sendo ${nonConformingAudits.length} avaliado(s) como Não Conforme e ${pendingAudits.length} ainda pendente(s)/em revisão.`,
        evidence: auditSamples.slice(0, 4).map(
          (a) => `#${a.ticketId} (${a.techName} · ${a.macroArea}) — ${a.auditStatus} · Veredito: ${a.verdict}`
        ),
        sources: ['Workflow de Auditoria (9 etapas · sessão local)'],
      };
    }

    const abertosKpi = computedKpis.find((k) => k.key === 'abertos');
    return {
      id: `a-${Date.now() + 1}`,
      sender: 'agent',
      timestamp: now,
      category: 'sugestao',
      content: `Resumo executivo contextual (Base Demonstrativa · IA R7 ${endpointConfig.localAiUrl} aguardando homologação): ${abertosKpi?.value ?? computedTickets.length} chamados abertos na amostra ativa, ${popNonCompliant.length} em desconformidade POP, ${staleTickets.length} acima de ${thresholdHours}h ${basisLabel} e ${openPendings.length} pendências em aberto. Nenhuma alteração automática foi enviada ao GLPI ou documentos.`,
      evidence: [
        `Prioridades oficiais ativas: ${weeklyPriorities.length} item(ns) sincronizados do TPL-02.`,
        `Modo de execução: ${dataMode} (sem escrita externa no GLPI/M365).`,
      ],
      sources: [`Contrato IA Local (${endpointConfig.localAiUrl}) — Leitura contextual local`],
    };
  };

  const handleSend = (promptText?: string) => {
    const text = (promptText ?? inputText).trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      timestamp: now,
      content: text,
    };

    const agentReply = buildContextualAgentReply(text);

    setAgentMessages((prev) => [...prev, userMsg, agentReply]);
    appendAgentActivity(
      `Consulta contextual respondida (Base Demonstrativa): "${text.slice(0, 62)}${text.length > 62 ? '...' : ''}".`,
      'info'
    );
    if (!promptText) setInputText('');
  };

  const handleActionDecision = (msgId: string, approve: boolean) => {
    const targetMsg = agentMessages.find((m) => m.id === msgId);
    setAgentMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.proposedAction) return m;
        return {
          ...m,
          category: approve ? 'bloqueada_demo' : 'falha',
          proposedAction: {
            ...m.proposedAction,
            approvalStatus: approve ? 'approved_blocked_demo' : 'rejected',
          },
        };
      })
    );

    if (approve) {
      appendAgentActivity(
        `Aprovação visual registrada (${targetMsg?.proposedAction?.targetSystem || 'GLPI'}); envio bloqueado no modo demonstração.`,
        'warning'
      );
      pushToast({
        title: 'Execução bloqueada no modo demonstração',
        description: 'A confirmação foi registrada visualmente, mas alterações no GLPI ou documentos só ocorrem após homologação do backend autenticado.',
        tone: 'warning',
      });
    } else {
      appendAgentActivity(
        `Solicitação recusada pelo gestor (${targetMsg?.proposedAction?.targetSystem || 'GLPI'}).`,
        'info'
      );
      pushToast({
        title: 'Solicitação rejeitada pelo gestor',
        description: 'Nenhuma alteração foi aplicada nos sistemas externos.',
        tone: 'info',
      });
    }
  };

  if (dataMode === 'disconnected' || dataMode === 'unavailable') {
    return (
      <UnavailableState
        title="Agente Gerencial indisponível"
        description={`O motor de IA local (${endpointConfig.localAiUrl}) encontra-se ${dataMode === 'disconnected' ? 'desconectado' : 'indisponível'} no modo de simulação selecionado.`}
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  const messages = agentMessages;
  const pendingApprovals = messages.filter(
    (m) => m.proposedAction?.approvalStatus === 'pending_approval'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
      {/* Main Chat & Prompt Workspace (8 cols) */}
      <section className="lg:col-span-8 flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] h-[calc(100vh-128px)] min-h-[520px]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#243242] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Bot size={17} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Agente Gerencial — Assistente Operacional
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Governança estrita: a IA não altera GLPI ou documentos sem autorização explícita
              </p>
            </div>
          </div>

          <SemanticLabel
            state="attention"
            label={`IA Local (${endpointConfig.localAiUrl}) · Requer autorização`}
            compact
          />
        </div>

        {/* Quick Capabilities Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              type="button"
              onClick={() => handleSend(qp.text)}
              className="rounded-md border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] whitespace-nowrap shrink-0 transition-colors"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Conversation Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-lg border p-3.5 text-xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'border-[#0F5E59]/30 bg-[#0F5E59]/8 dark:border-[#2DD4BF]/30 dark:bg-[#2DD4BF]/10 text-slate-900 dark:text-slate-100'
                    : 'border-slate-200 dark:border-[#243242] bg-slate-50/60 dark:bg-[#18222F]/70 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {msg.sender === 'agent' && msg.category ? (
                    <SemanticLabel
                      state={CATEGORY_LABELS[msg.category].tone}
                      label={CATEGORY_LABELS[msg.category].label}
                      compact
                    />
                  ) : (
                    <span className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                      Gestor de TI
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>

                <p className="text-[13px] leading-relaxed">{msg.content}</p>

                {msg.evidence && msg.evidence.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-[#243242] pt-2">
                    <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Evidências consultadas
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {msg.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>Fontes:</strong> {msg.sources.join(' · ')}
                  </div>
                )}

                {msg.proposedAction && (
                  <div className="mt-2 rounded-md border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">
                        Solicitação de Aprovação ({msg.proposedAction.targetSystem})
                      </span>
                      <span className="font-mono text-[11px] text-amber-800 dark:text-amber-300">
                        {msg.proposedAction.approvalStatus === 'pending_approval'
                          ? 'Aguardando confirmação'
                          : msg.proposedAction.approvalStatus === 'approved_blocked_demo'
                            ? 'Bloqueado (Demo/Sem Backend)'
                            : 'Rejeitada'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200">
                      {msg.proposedAction.summary}
                    </p>
                    <pre className="overflow-x-auto rounded bg-slate-900 text-slate-100 p-2 font-mono text-[11px]">
                      {msg.proposedAction.payloadPreview}
                    </pre>
                    {msg.proposedAction.approvalStatus === 'pending_approval' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleActionDecision(msg.id, false)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111923] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          <XCircle size={13} />
                          <span>Recusar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionDecision(msg.id, true)}
                          className="inline-flex items-center gap-1 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1 text-xs font-medium text-white dark:text-slate-950"
                        >
                          <CheckCircle2 size={13} />
                          <span>Autorizar execução</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t border-slate-200 dark:border-[#243242] p-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Solicite análise de chamados, gargalos, apoio à auditoria ou preparação de pauta..."
            className="flex-1 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0F5E59]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-2 text-xs font-medium text-white dark:text-slate-950 transition-colors whitespace-nowrap"
          >
            <Send size={13} />
            <span>Enviar</span>
          </button>
        </form>
      </section>

      {/* Right Governance & Traceability Rail (4 cols) */}
      <aside className="lg:col-span-4 space-y-3.5">
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Estado do Serviço de IA
            </h3>
            <button
              type="button"
              onClick={() => setActiveModule('configuracoes')}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
            >
              <SlidersHorizontal size={12} />
              <span>Configurar</span>
            </button>
          </div>
          <div className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Motor R7</span>
              <span className="font-mono text-amber-700 dark:text-amber-400">Requer autorização</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Endpoint</span>
              <span className="font-mono truncate max-w-[180px]">{endpointConfig.localAiUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Escrita automática</span>
              <span className="font-semibold text-red-700 dark:text-red-400">Desabilitada por segurança</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 text-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} className="text-amber-600 dark:text-amber-400" />
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aprovações Pendentes ({pendingApprovals.length})
            </h3>
          </div>
          {pendingApprovals.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">
              Nenhuma ação aguardando autorização no momento.
            </p>
          ) : (
            pendingApprovals.map((item) => (
              <div key={item.id} className="rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-2.5">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {item.proposedAction?.summary}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Destino: {item.proposedAction?.targetSystem} · Revisão humana obrigatória
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <FileSearch size={15} className="text-slate-500" />
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Histórico e Atividades
            </h3>
          </div>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            {agentActivityLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-2">
                {log.tone === 'warning' ? (
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                ) : (
                  <History size={13} className="mt-0.5 shrink-0 text-slate-400" />
                )}
                <span>
                  <strong className="font-mono text-slate-700 dark:text-slate-300">{log.timestamp}</strong> · {log.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};
