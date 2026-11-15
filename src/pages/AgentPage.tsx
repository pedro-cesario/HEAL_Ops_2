import React, { useEffect, useState } from 'react';
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
  LoadingSkeletonGrid,
  SemanticLabel,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import { AgentAdapter } from '../services/opsAdapters';
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
  const { dataMode, refreshTrigger, triggerRefresh, endpointConfig, setActiveModule, pushToast } = useOps();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(undefined);

    AgentAdapter.fetchConversation(dataMode).then((res) => {
      if (!active) return;
      if (res.errorMessage) {
        setErrorMessage(res.errorMessage);
        setMessages([]);
      } else {
        setMessages(res.data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [dataMode, refreshTrigger]);

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

    const agentReply: AgentMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'agent',
      timestamp: now,
      category: 'sugestao',
      content:
        'Solicitação registrada no fluxo demonstrativo. Como o serviço de IA local (R7 :3310) ainda aguarda autenticação e proxy homologado, nenhuma consulta em tempo real ao GLPI ou gravação externa foi executada. Utilize este formato para validar a leitura de evidências e aprovações.',
      sources: [`Contrato IA Local (${endpointConfig.localAiUrl}) — Pendente de autorização`],
      evidence: ['Modo demonstração ativo: resposta restrita à validação de interface e governança.'],
    };

    setMessages((prev) => [...prev, userMsg, agentReply]);
    if (!promptText) setInputText('');
  };

  const handleActionDecision = (msgId: string, approve: boolean) => {
    setMessages((prev) =>
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
      pushToast({
        title: 'Execução bloqueada no modo demonstração',
        description: 'A confirmação foi registrada visualmente, mas alterações no GLPI ou documentos só ocorrem após homologação do backend autenticado.',
        tone: 'warning',
      });
    } else {
      pushToast({
        title: 'Solicitação rejeitada pelo gestor',
        description: 'Nenhuma alteração foi aplicada nos sistemas externos.',
        tone: 'info',
      });
    }
  };

  if (loading) return <LoadingSkeletonGrid rows={4} />;

  if (errorMessage) {
    return (
      <UnavailableState
        title="Agente Gerencial indisponível"
        description={errorMessage}
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

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
            <li className="flex items-start gap-2">
              <History size={13} className="mt-0.5 shrink-0 text-slate-400" />
              <span>12:54 · Proposta de cobrança #48198 gerada (aguardando aprovação).</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
              <span>12:53 · Diagnóstico de gargalos e POP consolidado para revisão.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
