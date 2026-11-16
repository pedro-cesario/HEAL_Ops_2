import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldAlert,
  ShieldPlus,
} from 'lucide-react';
import type { DailyCriticalQueueItemState } from '../../../types/dailyAlignment';
import type {
  EndpointConfig,
  ManagementPending,
  TicketItem,
  WeeklyPriority,
} from '../../../types/ops';
import { EmptyState, Modal } from '../../common/UiPrimitives';

interface QueueRowItem {
  itemKey: string;
  sourceKind: 'ticket' | 'pending';
  ticket?: TicketItem;
  pending?: ManagementPending;
  isPopCategory: boolean;
  codeLabel: string;
  title: string;
  reasonTag: string;
  isAtRiskPriority: boolean;
  isInheritedUntreated: boolean;
}

export const DailyStage3CriticalQueue: React.FC<{
  tickets: TicketItem[];
  pendings: ManagementPending[];
  weeklyPriorities: WeeklyPriority[];
  criticalQueueStates: Record<string, DailyCriticalQueueItemState>;
  collaborators: { id: string; name: string }[];
  endpointConfig: EndpointConfig;
  onUpdateCriticalState: (
    itemKey: string,
    patch: Partial<DailyCriticalQueueItemState>
  ) => void;
  onToggleTreated: (itemKey: string) => void;
  onEscalateTicket: (ticket: TicketItem) => void;
  onUpdatePendingStatus: (
    pendingId: string,
    status: ManagementPending['status']
  ) => void;
}> = ({
  tickets,
  pendings,
  weeklyPriorities,
  criticalQueueStates,
  collaborators,
  endpointConfig,
  onUpdateCriticalState,
  onToggleTreated,
  onEscalateTicket,
  onUpdatePendingStatus,
}) => {
  const [inspectItem, setInspectItem] = useState<QueueRowItem | null>(null);
  const [showTreated, setShowTreated] = useState(true);

  const staleThreshold = Math.max(1, endpointConfig.staleTicketThresholdHours || 24);
  const basisLabel = endpointConfig.staleTicketTimeBasis === 'uteis' ? 'úteis' : 'corridas';

  const { operationalGroup, popGroup } = useMemo(() => {
    const atRiskPriorityTicketIds = new Set(
      weeklyPriorities
        .filter((p) => p.status === 'Risco de prazo' || p.status === 'Aguardando terceiros')
        .map((p) => p.ticketId)
    );

    const rows: QueueRowItem[] = [];

    // 1. Tickets críticos / stale / impedimento / sem técnico POP / prioridades em risco / não tratados em daily anterior
    tickets.forEach((t) => {
      const itemKey = `ticket-${t.id}`;
      const state = criticalQueueStates[itemKey];
      const isAtRisk = atRiskPriorityTicketIds.has(t.id);
      const isStale = t.hoursWithoutUpdate > staleThreshold;
      const isCritical = t.slaRisk === 'critico' || t.slaRisk === 'atencao';
      const isExternalBlocker = t.status === 'Pendente';
      const hasInheritedUntreated = Boolean(state && !state.treatedInDaily);

      if (
        !t.isPopNonCompliant &&
        !isStale &&
        !isCritical &&
        !isExternalBlocker &&
        !isAtRisk &&
        !hasInheritedUntreated
      ) {
        return;
      }

      const reasons: string[] = [];
      if (t.isPopNonCompliant) reasons.push('Não conformidade POP');
      if (isStale) reasons.push(`${t.hoursWithoutUpdate}h sem atualização`);
      if (isExternalBlocker) reasons.push('Impedimento / pendente');
      if (isAtRisk) reasons.push('Prioridade TPL-02 em risco');
      if (t.slaRisk === 'critico') reasons.push('Criticidade alta');

      rows.push({
        itemKey,
        sourceKind: 'ticket',
        ticket: t,
        isPopCategory: t.isPopNonCompliant,
        codeLabel: `#${t.id}`,
        title: t.title,
        reasonTag: reasons.join(' · ') || t.classificationReason,
        isAtRiskPriority: isAtRisk,
        isInheritedUntreated: Boolean(state && !state.treatedInDaily),
      });
    });

    // 2. Pendências gerenciais não resolvidas (auditoria POP vs impedimento operacional)
    pendings
      .filter((p) => p.status !== 'Resolvida')
      .forEach((p) => {
        // Avoid duplicating ticket already listed above if same ticketId
        if (p.ticketId && rows.some((r) => r.ticket?.id === p.ticketId)) {
          return;
        }
        const itemKey = `pending-${p.id}`;
        const state = criticalQueueStates[itemKey];
        const isPopOrigin = p.origin === 'Auditoria';
        rows.push({
          itemKey,
          sourceKind: 'pending',
          pending: p,
          isPopCategory: isPopOrigin,
          codeLabel: p.ticketId ? `#${p.ticketId} (${p.origin})` : p.origin,
          title: p.description,
          reasonTag: `${p.status} · Criticidade ${p.criticality} · Prazo ${p.dueDate}`,
          isAtRiskPriority: false,
          isInheritedUntreated: Boolean(!state || !state.treatedInDaily),
        });
      });

    const filtered = showTreated
      ? rows
      : rows.filter((r) => !criticalQueueStates[r.itemKey]?.treatedInDaily);

    return {
      operationalGroup: filtered.filter((r) => !r.isPopCategory),
      popGroup: filtered.filter((r) => r.isPopCategory),
    };
  }, [tickets, pendings, weeklyPriorities, criticalQueueStates, staleThreshold, showTreated]);

  const renderRowCard = (row: QueueRowItem) => {
    const state = criticalQueueStates[row.itemKey] || {
      itemKey: row.itemKey,
      ticketId: row.ticket?.id,
      pendingId: row.pending?.id,
      ownerName: row.ticket?.techName || row.pending?.owner || '',
      nextAction: row.pending?.nextAction || '',
      dueDate: row.pending?.dueDate || 'Hoje',
      blockerNote: '',
      treatedInDaily: false,
    };

    return (
      <div
        key={row.itemKey}
        className={`rounded-lg border p-3 space-y-2 text-xs transition-colors ${
          state.treatedInDaily
            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/35 dark:bg-emerald-950/15'
            : row.isPopCategory
              ? 'border-red-200 dark:border-red-900/50 bg-white dark:bg-[#111923]'
              : 'border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="font-bold text-[#0F5E59] dark:text-[#2DD4BF]">{row.codeLabel}</span>
              <span className="text-slate-400">·</span>
              <span
                className={
                  row.isPopCategory
                    ? 'font-semibold text-red-700 dark:text-red-400'
                    : 'text-amber-700 dark:text-amber-400'
                }
              >
                {row.reasonTag}
              </span>
              {!state.treatedInDaily && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  · Contínuo até tratativa
                </span>
              )}
            </div>
            <h4 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {row.title}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setInspectItem(row)}
              className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium hover:border-[#0F5E59] whitespace-nowrap"
            >
              <Eye size={12} />
              <span>Detalhes</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleTreated(row.itemKey)}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium whitespace-nowrap ${
                state.treatedInDaily
                  ? 'border-emerald-400 bg-emerald-600 text-white dark:border-emerald-700 dark:bg-emerald-600'
                  : 'border-slate-200 dark:border-[#243242] text-slate-700 dark:text-slate-200 hover:border-[#0F5E59]'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>{state.treatedInDaily ? 'Tratado na Daily' : 'Marcar tratado'}</span>
            </button>

            {row.ticket && (
              <button
                type="button"
                onClick={() => onEscalateTicket(row.ticket!)}
                className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:border-[#0F5E59] whitespace-nowrap"
              >
                <ShieldPlus size={12} />
                <span>Criar Pendência</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Live Editing Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
          <div className="sm:col-span-3">
            <label className="block text-[10px] text-slate-500 mb-0.5">Responsável</label>
            <select
              value={state.ownerName}
              onChange={(e) =>
                onUpdateCriticalState(row.itemKey, { ownerName: e.target.value })
              }
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs"
            >
              <option value="">Definir responsável...</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[10px] text-slate-500 mb-0.5">Próxima ação</label>
            <input
              type="text"
              value={state.nextAction}
              onChange={(e) =>
                onUpdateCriticalState(row.itemKey, { nextAction: e.target.value })
              }
              placeholder="Ação imediata..."
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] text-slate-500 mb-0.5">Prazo</label>
            <input
              type="text"
              value={state.dueDate}
              onChange={(e) =>
                onUpdateCriticalState(row.itemKey, { dueDate: e.target.value })
              }
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 font-mono text-xs"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[10px] text-slate-500 mb-0.5">Impedimento / Nota</label>
            <input
              type="text"
              value={state.blockerNote}
              onChange={(e) =>
                onUpdateCriticalState(row.itemKey, { blockerNote: e.target.value })
              }
              placeholder="Bloqueio externo, se houver..."
              className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs"
            />
          </div>
        </div>

        {row.pending && (
          <div className="flex items-center justify-end gap-2 pt-0.5 text-[11px]">
            <span className="text-slate-500">Status em Pendências e Auditoria:</span>
            <select
              value={row.pending.status}
              onChange={(e) =>
                onUpdatePendingStatus(
                  row.pending!.id,
                  e.target.value as ManagementPending['status']
                )
              }
              className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-0.5 text-[11px] font-medium"
            >
              <option value="Aberta">Aberta</option>
              <option value="Em tratamento">Em tratamento</option>
              <option value="Impedimento externo">Impedimento externo</option>
              <option value="Vencida">Vencida</option>
              <option value="Resolvida">Resolvida</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Top Rule Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5 text-xs">
        <div className="text-slate-600 dark:text-slate-300">
          Itens não tratados permanecem ativos nas Dailys seguintes. Regra de atualização:{' '}
          <strong className="font-mono">
            &gt; {staleThreshold}h {basisLabel}
          </strong>
          .
        </div>
        <button
          type="button"
          onClick={() => setShowTreated((v) => !v)}
          className="rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1 text-[11px] font-medium hover:border-[#0F5E59] whitespace-nowrap"
        >
          {showTreated ? 'Ocultar já tratados' : 'Mostrar todos (incluindo tratados)'}
        </button>
      </div>

      {/* Separated Columns: Criticidade Operacional vs Não Conformidade POP */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        {/* Grupo A: Criticidade Operacional, Atrasos e Impedimentos */}
        <section className="xl:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
              <AlertTriangle size={15} />
              <span>Criticidade Operacional, Atrasos & Impedimentos</span>
            </div>
            <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300">
              {operationalGroup.length} item(ns)
            </span>
          </div>

          {operationalGroup.length === 0 ? (
            <EmptyState
              title="Nenhum item operacional pendente neste filtro"
              description="Todos os chamados críticos/atrasados e impedimentos visíveis foram tratados."
            />
          ) : (
            <div className="space-y-2.5">{operationalGroup.map(renderRowCard)}</div>
          )}
        </section>

        {/* Grupo B: Não Conformidade POP Confirmada */}
        <section className="xl:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-900 dark:text-red-300">
              <ShieldAlert size={15} />
              <span>Não Conformidade POP Confirmada</span>
            </div>
            <span className="font-mono text-xs font-bold text-red-900 dark:text-red-300">
              {popGroup.length} item(ns)
            </span>
          </div>

          {popGroup.length === 0 ? (
            <EmptyState
              title="Zero desconformidades POP ativas"
              description="Nenhum chamado ou auditoria POP pendente de regularização."
            />
          ) : (
            <div className="space-y-2.5">{popGroup.map(renderRowCard)}</div>
          )}
        </section>
      </div>

      {/* Inline Detail Modal */}
      <Modal
        open={Boolean(inspectItem)}
        onClose={() => setInspectItem(null)}
        title={inspectItem ? `Detalhes — ${inspectItem.codeLabel}` : 'Detalhes'}
        subtitle={
          inspectItem?.isPopCategory
            ? 'Enquadramento: Não Conformidade POP Confirmada'
            : 'Enquadramento: Criticidade Operacional / Continuidade'
        }
      >
        {inspectItem && (
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {inspectItem.title}
            </div>
            {inspectItem.ticket ? (
              <div className="grid grid-cols-2 gap-2 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3">
                <div>
                  <span className="text-slate-400 block">Status GLPI</span>
                  <span className="font-medium">{inspectItem.ticket.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Macroárea</span>
                  <span className="font-medium">{inspectItem.ticket.macroArea}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Técnico</span>
                  <span className="font-medium">
                    {inspectItem.ticket.techName || 'Sem técnico nominal'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tempo sem atualização</span>
                  <span className="font-mono font-semibold">
                    {inspectItem.ticket.hoursWithoutUpdate}h ({inspectItem.ticket.lastUpdatedAt})
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Classificação</span>
                  <span>{inspectItem.ticket.classificationReason}</span>
                </div>
              </div>
            ) : inspectItem.pending ? (
              <div className="grid grid-cols-2 gap-2 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3">
                <div>
                  <span className="text-slate-400 block">Origem</span>
                  <span className="font-medium">{inspectItem.pending.origin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Criticidade</span>
                  <span className="font-medium">{inspectItem.pending.criticality}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Próxima ação base</span>
                  <span>{inspectItem.pending.nextAction}</span>
                </div>
              </div>
            ) : null}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-1.5 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
