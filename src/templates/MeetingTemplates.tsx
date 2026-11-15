import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  FileText,
  MonitorPlay,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Modal } from '../components/common/UiPrimitives';
import { DEMO_KPIS, DEMO_TEAM, DEMO_TICKETS, DEMO_WEEKLY_PRIORITIES } from '../demo/demoData';
import type { MeetingRecord } from '../types/ops';

export type TemplateViewMode = 'executive' | 'presentation' | 'official_document';

interface SlideItem {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export const MeetingTemplateWorkspace: React.FC<{
  meeting: MeetingRecord;
  initialMode?: TemplateViewMode;
  onClose: () => void;
  onAddDecision: (meetingId: string, decision: string, owner: string, dueDate: string) => void;
  onTriggerPendingPdf: () => void;
}> = ({ meeting, initialMode = 'executive', onClose, onAddDecision, onTriggerPendingPdf }) => {
  const [mode, setMode] = useState<TemplateViewMode>(initialMode);
  const [slideIndex, setSlideIndex] = useState(0);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newDecisionOwner, setNewDecisionOwner] = useState(meeting.participants[0] || 'Gestor de TI');
  const [newDecisionDue, setNewDecisionDue] = useState('Hoje');
  const [detailModalContent, setDetailModalContent] = useState<{ title: string; body: string } | null>(null);

  // Build slides per template code (TPL-01..TPL-04)
  const slides: SlideItem[] = (() => {
    if (meeting.templateCode === 'TPL-01') {
      const noUpdate = DEMO_TICKETS.filter((t) => t.inclusionReasons.includes('sem_atualizacao'));
      return [
        {
          title: '1. Resultados Anteriores & Backlog',
          subtitle: 'Panorama consolidado herdado da operação diária',
          content: (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEMO_KPIS.slice(0, 4).map((k) => (
                <div key={k.key} className="rounded-lg border border-slate-200 dark:border-[#243242] p-4 bg-white dark:bg-[#111923]">
                  <span className="text-xs text-slate-500">{k.label}</span>
                  <div className="mt-1 font-mono text-3xl font-bold tabular-nums">{k.value}</div>
                  <span className="text-xs text-slate-500">{k.subtitle}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '2. Prioridades Herdadas do Alinhamento Semanal',
          subtitle: 'Carteira única aprovada no TPL-02 (sem prioridades paralelas)',
          content: (
            <div className="space-y-2.5">
              {DEMO_WEEKLY_PRIORITIES.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-[#243242] p-3.5 bg-white dark:bg-[#111923]">
                  <div>
                    <div className="font-mono text-xs text-slate-500">#{p.ticketId} · {p.owner} · Prazo {p.dueDate || '—'}</div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Próxima ação: {p.nextAction}</div>
                  </div>
                  <span className="text-xs font-medium text-[#0F5E59] dark:text-[#2DD4BF]">{p.status}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '3. Chamados Sem Atualização & Impedimentos',
          subtitle: 'Itens acima de 48h úteis e bloqueios por macroárea',
          content: (
            <div className="space-y-2.5">
              {noUpdate.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-[#243242] p-3.5 bg-white dark:bg-[#111923]">
                  <div>
                    <div className="font-mono text-xs text-amber-700 dark:text-amber-400">
                      #{t.id} · {t.hoursWithoutUpdate}h sem atualização · {t.techName || 'Sem técnico'}
                    </div>
                    <div className="text-base font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500">{t.classificationReason}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDetailModalContent({
                        title: `Chamado #${t.id}`,
                        body: `${t.title}\n\nMacroárea: ${t.macroArea}\nGrupo: ${t.group}\nMotivo: ${t.classificationReason}`,
                      })
                    }
                    className="rounded border border-slate-200 dark:border-[#243242] px-3 py-1.5 text-xs font-medium"
                  >
                    Inspecionar
                  </button>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '4. Referências por Área, Desafio do Dia e Próximas Ações',
          subtitle: 'Compromissos imediatos da equipe',
          content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4 bg-white dark:bg-[#111923] space-y-2">
                <h4 className="font-semibold text-sm">Referências por Macroárea</h4>
                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  <li><strong>Assistencial:</strong> Carlos Henrique & Juliana Almeida</li>
                  <li><strong>Sistemas Clínicos (PEP):</strong> Mariana Costa</li>
                  <li><strong>Infraestrutura:</strong> Rafael Oliveira & Thiago Mendes</li>
                  <li><strong>Governança:</strong> Beatriz Santos</li>
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4 bg-white dark:bg-[#111923] space-y-2">
                <h4 className="font-semibold text-sm">Desafio do Dia</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Zerar chamados assistenciais sem técnico nominal antes das 14h e validar rollback completo da GMUD-042.
                </p>
              </div>
            </div>
          ),
        },
      ];
    }

    if (meeting.templateCode === 'TPL-02') {
      return [
        { title: 'Etapa 1 de 8 · Abertura', subtitle: 'Contexto institucional e objetivos da semana', content: <p className="text-base leading-relaxed">{meeting.contextSummary}</p> },
        { title: 'Etapa 2 de 8 · Resultados da Semana Anterior', subtitle: 'Indicadores deduplicados de entrega e POP', content: <div className="grid grid-cols-3 gap-4"><div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4"><span className="text-xs text-slate-500">Únicos Concluídos</span><div className="font-mono text-3xl font-bold mt-1">102</div></div><div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4"><span className="text-xs text-slate-500">Tempo Médio</span><div className="font-mono text-3xl font-bold mt-1">14,2h</div></div><div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4"><span className="text-xs text-slate-500">Conformidade POP</span><div className="font-mono text-3xl font-bold mt-1">92%</div></div></div> },
        { title: 'Etapa 3 de 8 · Backlog e Pendências', subtitle: '42 chamados ativos · 2 em desconformidade POP', content: <p className="text-base">Revisão dos itens sem atualização &gt; 48h e pendências críticas de fornecedores.</p> },
        { title: 'Etapa 4 de 8 · Áreas e Referências Técnicas', subtitle: 'Cobertura assistencial, sistemas, infraestrutura e corporativo', content: <div className="grid grid-cols-2 gap-3">{DEMO_TEAM.slice(0, 4).map((m) => <div key={m.id} className="rounded border border-slate-200 dark:border-[#243242] p-3 text-sm"><strong>{m.macroArea}</strong> · {m.name} ({m.activeTickets} ativos)</div>)}</div> },
        { title: 'Etapa 5 de 8 · Projetos e GMUD', subtitle: 'Mudanças programadas e riscos operacionais', content: <p className="text-base">GMUD-042 (Substituição de switch de borda Bloco Administrativo) prevista para janela noturna após 19h.</p> },
        { title: 'Etapa 6 de 8 · Metas e Prioridades', subtitle: 'Definição das 5 prioridades oficiais herdadas pela Daily e Visão Geral', content: <ul className="space-y-2 text-sm">{DEMO_WEEKLY_PRIORITIES.map((p) => <li key={p.id} className="rounded border border-slate-200 dark:border-[#243242] p-2.5"><strong>#{p.ticketId}</strong> — {p.title} ({p.owner})</li>)}</ul> },
        { title: 'Etapa 7 de 8 · Acordos e Responsabilidades', subtitle: 'Decisões registradas e prazos pactuados', content: <ul className="space-y-2 text-sm">{meeting.decisions.map((d) => <li key={d.id} className="rounded border border-slate-200 dark:border-[#243242] p-3"><strong>{d.decision}</strong> · {d.owner} (Prazo: {d.dueDate})</li>)}</ul> },
        { title: 'Etapa 8 de 8 · Encerramento', subtitle: 'Próximos passos e publicação da ata oficial', content: <ul className="list-disc pl-5 space-y-2 text-base">{meeting.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul> },
      ];
    }

    if (meeting.templateCode === 'TPL-03') {
      return [
        {
          title: '1. Identificação & Objetivo do Alinhamento',
          subtitle: `${meeting.participants.join(' · ')} · ${meeting.date}`,
          content: <p className="text-base leading-relaxed">{meeting.contextSummary}</p>,
        },
        {
          title: '2. Pontos Fortes, Desenvolvimento & Feedback',
          subtitle: 'Evolução profissional e reconhecimento estruturado',
          content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4 space-y-1.5">
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">Pontos Fortes</h4>
                <p>Liderança técnica em PEP e integrações DICOM; condução clara durante atualizações assistenciais.</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4 space-y-1.5">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Pontos de Desenvolvimento</h4>
                <p>Proteger janela semanal para documentação arquitetural antes da entrada de novas demandas N2.</p>
              </div>
            </div>
          ),
        },
        {
          title: '3. Metas & Negociações Recíprocas',
          subtitle: 'Compromissos do Colaborador e Compromissos da Gestão',
          content: (
            <div className="space-y-2.5">
              {meeting.commitments.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 dark:border-[#243242] p-3.5 text-sm">
                  <div className="font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                    Parte responsável: {c.party} ({c.owner}) · Prazo {c.dueDate}
                  </div>
                  <div className="mt-1">{c.action}</div>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '4. Próximo Alinhamento & Ciência',
          subtitle: 'Prazos, pendências da gestão e assinaturas',
          content: (
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-4 text-sm space-y-2">
              <p><strong>Próximo alinhamento agendado:</strong> 30/11/2026</p>
              <p><strong>Pendência sob responsabilidade da gestão:</strong> Aprovar janela de parada com Diretoria Assistencial até 16/11.</p>
              <p className="text-xs text-slate-500">Documento oficial inclui campos de ciência e assinatura manual das partes.</p>
            </div>
          ),
        },
      ];
    }

    // TPL-04 Projetos e GMUD
    return [
      {
        title: '1. Identificação, Objetivo & Escopo (TPL-04)',
        subtitle: 'Numeração TPL-04 sujeita à conciliação com catálogo oficial antes da produção',
        content: (
          <div className="space-y-3 text-sm">
            <p className="text-base">{meeting.contextSummary}</p>
            <div className="rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
              Nota de governança: A numeração TPL-04 deve ser conciliada com o catálogo oficial antes da integração produtiva.
            </div>
          </div>
        ),
      },
      {
        title: '2. Cronograma, Marcos & Linha do Tempo',
        subtitle: 'Sequência de execução, riscos e dependências',
        content: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3.5">
              <div className="font-mono text-[#0F5E59] dark:text-[#2DD4BF]">Marco 01 · 15/11</div>
              <div className="mt-1 font-semibold text-sm">Backup de configurações & staging</div>
              <p className="mt-1 text-slate-500">Validar portas e VLANs no ambiente 8788.</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3.5">
              <div className="font-mono text-[#0F5E59] dark:text-[#2DD4BF]">Marco 02 · 16/11 19h</div>
              <div className="mt-1 font-semibold text-sm">Janela de corte físico</div>
              <p className="mt-1 text-slate-500">Substituição dos 3 switches + teste LACP.</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] p-3.5">
              <div className="font-mono text-[#0F5E59] dark:text-[#2DD4BF]">Marco 03 · 17/11 07h</div>
              <div className="mt-1 font-semibold text-sm">Operação assistida & encerramento</div>
              <p className="mt-1 text-slate-500">Monitoramento SNMP e validação com recepção.</p>
            </div>
          </div>
        ),
      },
      {
        title: '3. Checklist, Validações & Riscos',
        subtitle: 'Pré-requisitos de segurança para mudança',
        content: (
          <div className="space-y-2 text-sm">
            {[
              'Script de rollback testado e acessível offline',
              'Comunicação prévia enviada às coordenações administrativas',
              'Nobreak do rack validado com autonomia > 30 min',
              'Monitoramento SNMP preparado para validação imediata',
            ].map((chk, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded border border-slate-200 dark:border-[#243242] p-2.5">
                <CheckSquare size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
                <span>{chk}</span>
              </div>
            ))}
          </div>
        ),
      },
    ];
  })();

  const currentSlide = slides[Math.min(slideIndex, slides.length - 1)];

  return (
    <div className="space-y-4">
      {/* Top Bar of Template Workspace */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#18222F]"
          >
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-[#0F5E59] dark:text-[#2DD4BF]">
              {meeting.templateCode} · {meeting.type} · {meeting.version}
            </div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {meeting.title}
            </h2>
          </div>
        </div>

        {/* 3 Experiences Switcher */}
        <div className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-[#18222F] p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('executive')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
              mode === 'executive'
                ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldCheck size={13} />
            <span>Visão Executiva</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('presentation');
              setSlideIndex(0);
            }}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
              mode === 'presentation'
                ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <MonitorPlay size={13} />
            <span>Modo Apresentação</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('official_document')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
              mode === 'official_document'
                ? 'bg-white dark:bg-[#111923] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileText size={13} />
            <span>Documento Oficial</span>
          </button>
        </div>
      </div>

      {/* MODE 1: VISÃO EXECUTIVA */}
      {mode === 'executive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-3.5">
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contexto</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {meeting.contextSummary}
              </p>
              <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span><strong>Data:</strong> {meeting.date} às {meeting.time}</span>
                <span><strong>Facilitador:</strong> {meeting.facilitator}</span>
                <span><strong>Participantes:</strong> {meeting.participants.join(', ')}</span>
              </div>
            </div>

            {meeting.templateCode === 'TPL-04' && (
              <div className="rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/25 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>A numeração TPL-04 deverá ser conciliada com o catálogo oficial antes da integração produtiva.</span>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">Decisões e Responsáveis</h3>
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(true)}
                  className="text-xs font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline"
                >
                  + Registrar decisão
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#1D2836]">
                {meeting.decisions.map((d) => (
                  <div key={d.id} className="py-2 text-xs flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{d.decision}</span>
                    <span className="font-mono text-slate-500 shrink-0">{d.owner} · {d.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3.5">
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2 text-xs">
              <h3 className="font-display text-sm font-semibold">Compromissos Pactuados</h3>
              {meeting.commitments.map((c) => (
                <div key={c.id} className="rounded border border-slate-200 dark:border-[#243242] p-2.5">
                  <div className="flex justify-between font-medium text-[#0F5E59] dark:text-[#2DD4BF]">
                    <span>{c.party}: {c.owner}</span>
                    <span className="font-mono">{c.dueDate}</span>
                  </div>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{c.action}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2 text-xs">
              <h3 className="font-display text-sm font-semibold">Próximos Passos</h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                {meeting.nextSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: MODO APRESENTAÇÃO (1366x768 optimized, zero excessive scroll) */}
      {mode === 'presentation' && (
        <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-6 min-h-[540px]">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-[#243242] pb-4">
              <div>
                <div className="font-mono text-xs font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                  {meeting.templateCode} · {meeting.type} · Slide {slideIndex + 1} de {slides.length}
                </div>
                <h3 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {currentSlide.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{currentSlide.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModalOpen(true)}
                className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-2 text-xs font-medium text-white dark:text-slate-950 whitespace-nowrap shrink-0"
              >
                + Registrar decisão ao vivo
              </button>
            </div>

            <div className="py-2">{currentSlide.content}</div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#243242] pt-4">
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  aria-label={`Ir para etapa ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === slideIndex
                      ? 'w-6 bg-[#0F5E59] dark:bg-[#2DD4BF]'
                      : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={slideIndex === 0}
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] px-3.5 py-2 text-xs font-medium disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                disabled={slideIndex === slides.length - 1}
                onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950 px-3.5 py-2 text-xs font-medium disabled:opacity-40"
              >
                <span>Próximo</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: DOCUMENTO OFICIAL (Institutional PDF Specification) */}
      {mode === 'official_document' && (
        <div className="space-y-3">
          <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/25 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            <span>
              <strong>Especificação Documental Institucional:</strong> Serviço real de geração PDF server-side pendente de integração. Utilize a visualização ou impressão estruturada para validação.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded border border-amber-400/60 bg-white dark:bg-[#111923] px-2.5 py-1 font-medium text-slate-800 dark:text-slate-200"
              >
                <Printer size={13} />
                <span>Imprimir visualização</span>
              </button>
              <button
                type="button"
                onClick={onTriggerPendingPdf}
                className="inline-flex items-center gap-1.5 rounded bg-[#0F5E59] px-2.5 py-1 font-medium text-white"
              >
                <FileText size={13} />
                <span>Solicitar PDF oficial (Backend)</span>
              </button>
            </div>
          </div>

          <article className="print-only-surface mx-auto max-w-4xl rounded-lg border border-slate-300 dark:border-[#243242] bg-white text-slate-900 p-8 shadow-xs space-y-6">
            {/* Institutional Header */}
            <header className="flex items-start justify-between border-b-2 border-[#0F5E59] pb-4">
              <div>
                <div className="text-xs font-semibold tracking-wider text-[#0F5E59] uppercase">
                  Instituto HEAL — Hospital Espírita André Luiz
                </div>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
                  {meeting.title}
                </h2>
                <div className="mt-1 text-xs text-slate-600">
                  Registro Operacional de Gestão de TI · Template {meeting.templateCode} ({meeting.type})
                </div>
              </div>
              <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
                <div>Data: {meeting.date} · {meeting.time}</div>
                <div>Versão: {meeting.version}</div>
                <div>Situação: {meeting.status}</div>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded border border-slate-200">
              <div>
                <strong>Facilitador:</strong> {meeting.facilitator}
              </div>
              <div>
                <strong>Participantes:</strong> {meeting.participants.join(', ')}
              </div>
            </section>

            <section className="space-y-1.5 text-sm">
              <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                1. Síntese e Contexto
              </h3>
              <p className="text-slate-700 leading-relaxed">{meeting.contextSummary}</p>
            </section>

            <section className="space-y-2 text-xs">
              <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                2. Decisões Registradas
              </h3>
              <table className="w-full border border-slate-200 text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Decisão</th>
                    <th className="p-2 border-b border-slate-200">Responsável</th>
                    <th className="p-2 border-b border-slate-200">Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {meeting.decisions.map((d) => (
                    <tr key={d.id} className="border-b border-slate-200">
                      <td className="p-2">{d.decision}</td>
                      <td className="p-2">{d.owner}</td>
                      <td className="p-2 font-mono">{d.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="space-y-2 text-xs">
              <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                3. Compromissos e Próximos Passos
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {meeting.commitments.map((c) => (
                  <li key={c.id}>
                    <strong>[{c.party}] {c.owner}:</strong> {c.action} (Prazo: {c.dueDate})
                  </li>
                ))}
              </ul>
            </section>

            <section className="pt-6 space-y-4 text-xs">
              <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
                4. Ciência e Assinaturas Manuais (Arquivamento Institucional)
              </h3>
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 text-center text-slate-600">
                    Coordenação / Gestão Operacional de TI
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 text-center text-slate-600">
                    Participante / Referência Técnica
                  </div>
                </div>
              </div>
            </section>
          </article>
        </div>
      )}

      {/* Modal: Record Live Decision */}
      <Modal
        open={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Registrar Decisão da Reunião"
        subtitle={`${meeting.templateCode} · ${meeting.title}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newDecisionText.trim()) return;
            onAddDecision(meeting.id, newDecisionText.trim(), newDecisionOwner, newDecisionDue);
            setNewDecisionText('');
            setDecisionModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descrição da decisão
            </label>
            <textarea
              rows={3}
              required
              value={newDecisionText}
              onChange={(e) => setNewDecisionText(e.target.value)}
              placeholder="Ex.: Definir escala de acompanhamento para impressoras térmicas..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={newDecisionOwner}
                onChange={(e) => setNewDecisionOwner(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prazo
              </label>
              <input
                type="text"
                value={newDecisionDue}
                onChange={(e) => setNewDecisionDue(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Registrar decisão
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail inspection from Presentation slide */}
      <Modal
        open={Boolean(detailModalContent)}
        onClose={() => setDetailModalContent(null)}
        title={detailModalContent?.title || 'Detalhe'}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
            {detailModalContent?.body}
          </p>
          <button
            type="button"
            onClick={() => setDetailModalContent(null)}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      </Modal>
    </div>
  );
};
