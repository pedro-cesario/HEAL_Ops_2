import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  MonitorPlay,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  EmptyState,
  LoadingSkeletonGrid,
  Modal,
  UnavailableState,
} from '../components/common/UiPrimitives';
import { useOps } from '../context/OpsContext';
import { MeetingsDocumentsAdapter } from '../services/opsAdapters';
import { MeetingTemplateWorkspace, type TemplateViewMode } from '../templates/MeetingTemplates';
import type { MeetingCategory, MeetingRecord, MeetingTemplateCode } from '../types/ops';

const WORKFLOW_STAGES = [
  '1. Preparação',
  '2. Revisão',
  '3. Apresentação',
  '4. Registro de decisões',
  '5. Finalização',
  '6. Documento',
  '7. Acompanhamento',
];

export const MeetingsPage: React.FC = () => {
  const { dataMode, refreshTrigger, triggerRefresh, setActiveModule, pushToast } = useOps();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'Todas' | 'Próxima' | 'Em andamento' | 'Rascunho' | 'Finalizada'>('Todas');
  const [activeWorkspace, setActiveWorkspace] = useState<{
    meetingId: string;
    mode: TemplateViewMode;
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MeetingCategory>('Daily Operacional');
  const [newTemplate, setNewTemplate] = useState<MeetingTemplateCode>('TPL-01');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(undefined);

    MeetingsDocumentsAdapter.fetchMeetings(dataMode).then((res) => {
      if (!active) return;
      if (res.errorMessage) {
        setErrorMessage(res.errorMessage);
        setMeetings([]);
      } else {
        setMeetings(res.data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [dataMode, refreshTrigger]);

  const filteredMeetings = useMemo(() => {
    if (statusFilter === 'Todas') return meetings;
    return meetings.filter((m) => m.status === statusFilter);
  }, [meetings, statusFilter]);

  const pendingCommitments = useMemo(
    () =>
      meetings.flatMap((m) =>
        m.commitments.map((c) => ({ ...c, meetingTitle: m.title, templateCode: m.templateCode }))
      ),
    [meetings]
  );

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === activeWorkspace?.meetingId) || null,
    [meetings, activeWorkspace]
  );

  const handleAddDecision = (meetingId: string, decision: string, owner: string, dueDate: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              decisions: [
                ...m.decisions,
                { id: `d-${Date.now()}`, decision, owner, dueDate },
              ],
            }
          : m
      )
    );
    pushToast({
      title: 'Decisão registrada na sessão',
      description: 'Sincronização definitiva depende do endpoint de reuniões do backend.',
      tone: 'info',
    });
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: MeetingRecord = {
      id: `mtg-${Date.now()}`,
      templateCode: newTemplate,
      type: newType,
      title: newTitle.trim(),
      date: '16/11/2026',
      time: '10:00',
      status: 'Rascunho',
      facilitator: 'Gestor de TI',
      participants: ['Gestor de TI', 'Equipe Operacional'],
      version: 'v0.1 (Rascunho)',
      contextSummary: 'Rascunho criado para preparação de pauta e validação de template.',
      decisions: [],
      commitments: [],
      nextSteps: ['Revisar indicadores e registrar decisões em modo apresentação'],
      documentStatus: 'Visualização disponível · PDF server-side pendente',
    };
    setMeetings((prev) => [created, ...prev]);
    setCreateModalOpen(false);
    setNewTitle('');
    setActiveWorkspace({ meetingId: created.id, mode: 'executive' });
  };

  if (loading) return <LoadingSkeletonGrid rows={5} />;

  if (errorMessage) {
    return (
      <UnavailableState
        title="Central de reuniões indisponível"
        description={errorMessage}
        onRetry={triggerRefresh}
        onConfigure={() => setActiveModule('configuracoes')}
      />
    );
  }

  if (selectedMeeting && activeWorkspace) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <MeetingTemplateWorkspace
          meeting={selectedMeeting}
          initialMode={activeWorkspace.mode}
          onClose={() => setActiveWorkspace(null)}
          onAddDecision={handleAddDecision}
          onTriggerPendingPdf={() =>
            pushToast({
              title: 'Geração oficial de PDF pendente no backend',
              description: 'O serviço server-side de PDF institucional ainda não foi implantado. Use "Imprimir visualização" para arquivamento imediato.',
              tone: 'warning',
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Workflow Strip + Create Action */}
      <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Central de Reuniões, Templates (TPL-01 a TPL-04) e Documentos Oficiais
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fluxo operacional completo: Preparação → Revisão → Apresentação → Decisões → Finalização → Documento → Acompanhamento
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 transition-colors whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Nova reunião / pauta</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 text-[11px]">
          {WORKFLOW_STAGES.map((stage) => (
            <div
              key={stage}
              className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 truncate"
            >
              {stage}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-3.5 py-2.5">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {(['Todas', 'Próxima', 'Em andamento', 'Rascunho', 'Finalizada'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#18222F]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-slate-500">
          {filteredMeetings.length} registro(s)
        </span>
      </div>

      {/* Meetings Grid + Side Commitments/Documents */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-2.5">
          {filteredMeetings.length === 0 ? (
            <EmptyState
              title="Nenhuma reunião nesta situação"
              description="Altere o filtro acima ou crie uma nova pauta de reunião."
            />
          ) : (
            filteredMeetings.map((mtg) => (
              <div
                key={mtg.id}
                className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                        {mtg.templateCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{mtg.type}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{mtg.date} às {mtg.time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{mtg.status}</span>
                    </div>
                    <h3 className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {mtg.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {mtg.contextSummary}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-[#1D2836] pt-2.5">
                  <span className="text-[11px] text-slate-500">
                    {mtg.decisions.length} decisão(ões) · {mtg.commitments.length} compromisso(s) · {mtg.documentStatus}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveWorkspace({ meetingId: mtg.id, mode: 'executive' })}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1 text-xs font-medium hover:border-[#0F5E59] transition-colors"
                    >
                      <ShieldCheck size={13} />
                      <span>Executiva</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspace({ meetingId: mtg.id, mode: 'presentation' })}
                      className="inline-flex items-center gap-1 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-2.5 py-1 text-xs font-medium text-white dark:text-slate-950 transition-colors"
                    >
                      <MonitorPlay size={13} />
                      <span>Apresentar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspace({ meetingId: mtg.id, mode: 'official_document' })}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1 text-xs font-medium hover:border-[#0F5E59] transition-colors"
                    >
                      <FileText size={13} />
                      <span>Documento</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Summary Rail: Commitments & Generated Documents */}
        <aside className="xl:col-span-4 space-y-3.5">
          <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#243242] pb-2">
              <CheckCircle2 size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
              <h3 className="font-display text-sm font-semibold">Compromissos Pendentes</h3>
            </div>
            <div className="space-y-2">
              {pendingCommitments.map((c) => (
                <div key={c.id} className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                    <span>{c.templateCode} · {c.party}</span>
                    <span>Prazo {c.dueDate}</span>
                  </div>
                  <div className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{c.action}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Responsável: {c.owner}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#243242] pb-2">
              <CalendarClock size={15} className="text-slate-500" />
              <h3 className="font-display text-sm font-semibold">Documentos & Atas (TPL-01..04)</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Visualização documental institucional ativa para todos os templates. Geração PDF automática em servidor marcada como pendente até homologação.
            </p>
          </div>
        </aside>
      </div>

      {/* Create Draft Meeting Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Preparar Nova Reunião"
        subtitle="Selecione o tipo de rito e o template correspondente (TPL-01 a TPL-04)"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título da reunião
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex.: Daily Operacional — Turno Tarde"
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo de reunião
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as MeetingCategory)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2"
              >
                <option value="Daily Operacional">Daily Operacional</option>
                <option value="Alinhamento Semanal">Alinhamento Semanal</option>
                <option value="Alinhamento Individual">Alinhamento Individual</option>
                <option value="Feedback">Feedback</option>
                <option value="Reunião Esporádica">Reunião Esporádica</option>
                <option value="Reunião de Projeto">Reunião de Projeto</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Template estruturado
              </label>
              <select
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value as MeetingTemplateCode)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono"
              >
                <option value="TPL-01">TPL-01 · Daily Operacional</option>
                <option value="TPL-02">TPL-02 · Alinhamento Semanal</option>
                <option value="TPL-03">TPL-03 · Individual e Feedback</option>
                <option value="TPL-04">TPL-04 · Projetos e GMUD</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F5E59] text-white dark:bg-[#2DD4BF] dark:text-slate-950 px-3.5 py-1.5 font-medium"
            >
              Criar rascunho
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
