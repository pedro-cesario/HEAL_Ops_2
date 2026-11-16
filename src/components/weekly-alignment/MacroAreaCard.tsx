import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Cpu,
  Edit3,
  Headset,
  Network,
  Plus,
  Shield,
  Square,
  Trash2,
} from 'lucide-react';
import type { MacroAreaGovernance, MacroAreaId } from '../../types/weeklyAlignment';
import { TeamMemberSelector, type CollaboratorOption } from './TeamMemberSelector';

const AREA_ICONS: Record<MacroAreaId, React.ComponentType<{ size?: number; className?: string }>> = {
  suporte: Headset,
  sistemas: Cpu,
  infraestrutura: Network,
  gestao: Shield,
};

export const MacroAreaCard: React.FC<{
  area: MacroAreaGovernance;
  collaborators: CollaboratorOption[];
  onUpdateArea: (
    areaId: MacroAreaId,
    patch: Partial<{
      primaryOwnerId: string;
      primaryOwnerName: string;
      supportTechId: string;
      supportTechName: string;
      objective: string;
      dueDate: string;
    }>
  ) => void;
  onAddDeliverable: (areaId: MacroAreaId, text: string) => void;
  onToggleDeliverable: (areaId: MacroAreaId, deliverableId: string) => void;
  onRemoveDeliverable: (areaId: MacroAreaId, deliverableId: string) => void;
  onAddPending: (areaId: MacroAreaId, text: string) => void;
  onTogglePending: (areaId: MacroAreaId, pendingId: string) => void;
}> = ({
  area,
  collaborators,
  onUpdateArea,
  onAddDeliverable,
  onToggleDeliverable,
  onRemoveDeliverable,
  onAddPending,
  onTogglePending,
}) => {
  const [editingObjective, setEditingObjective] = useState(false);
  const [objectiveDraft, setObjectiveDraft] = useState(area.objective);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newPending, setNewPending] = useState('');

  const Icon = AREA_ICONS[area.id];
  const hasOwner = Boolean(area.primaryOwnerId && area.primaryOwnerName && area.primaryOwnerName !== 'Não definido');
  const completedCount = area.deliverables.filter((d) => d.done).length;
  const openPendingsCount = area.pendings.filter((p) => !p.resolved).length;

  const handleSaveObjective = () => {
    onUpdateArea(area.id, { objective: objectiveDraft.trim() || area.objective });
    setEditingObjective(false);
  };

  return (
    <section className="flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3">
      {/* Cabeçalho da Macroárea */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] text-[#0F5E59] dark:text-[#2DD4BF]">
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {area.name}
            </h3>
            <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {completedCount}/{area.deliverables.length} entregas · {openPendingsCount} pendência(s)
            </div>
          </div>
        </div>

        <span
          className={`text-[11px] font-medium whitespace-nowrap ${
            hasOwner
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400'
          }`}
        >
          {hasOwner ? 'Definida' : 'Sem responsável'}
        </span>
      </div>

      {/* Seletores ao vivo: Responsável, Apoio e Prazo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <TeamMemberSelector
          label="Responsável principal"
          value={area.primaryOwnerId}
          options={collaborators}
          emptyOptionLabel="Não definido"
          onChange={(id, name) =>
            onUpdateArea(area.id, {
              primaryOwnerId: id,
              primaryOwnerName: name || 'Não definido',
            })
          }
        />
        <TeamMemberSelector
          label="Técnico de apoio"
          value={area.supportTechId}
          options={collaborators}
          emptyOptionLabel="Sem apoio definido"
          onChange={(id, name) =>
            onUpdateArea(area.id, {
              supportTechId: id,
              supportTechName: name,
            })
          }
        />
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prazo da frente
          </label>
          <input
            type="date"
            value={area.dueDate}
            onChange={(e) => onUpdateArea(area.id, { dueDate: e.target.value })}
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59] dark:focus:border-[#2DD4BF]"
          />
        </div>
      </div>

      {/* Objetivo da Semana (editável ao vivo) */}
      <div className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Objetivo da semana
          </span>
          {!editingObjective ? (
            <button
              type="button"
              onClick={() => {
                setObjectiveDraft(area.objective);
                setEditingObjective(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:underline whitespace-nowrap"
            >
              <Edit3 size={11} />
              <span>Editar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveObjective}
              className="inline-flex items-center gap-1 rounded bg-[#0F5E59] dark:bg-[#14B8A6] px-2 py-0.5 text-[11px] font-medium text-white dark:text-slate-950 whitespace-nowrap"
            >
              <Check size={11} />
              <span>Aplicar</span>
            </button>
          )}
        </div>
        {editingObjective ? (
          <textarea
            rows={2}
            value={objectiveDraft}
            onChange={(e) => setObjectiveDraft(e.target.value)}
            className="w-full rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59]"
          />
        ) : (
          <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">
            {area.objective}
          </p>
        )}
      </div>

      {/* Checklist interativo de Entregas + Pendências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
        {/* Entregas previstas */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Entregas previstas (alimentam Etapa 6)
          </span>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
            {area.deliverables.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-1">
                Nenhuma entrega registrada ainda.
              </p>
            ) : (
              area.deliverables.map((del) => (
                <div
                  key={del.id}
                  className="group flex items-start justify-between gap-1.5 rounded border border-slate-200 dark:border-[#243242] bg-slate-50/70 dark:bg-[#18222F]/60 px-2 py-1.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => onToggleDeliverable(area.id, del.id)}
                    className="flex items-start gap-1.5 text-left min-w-0 flex-1"
                  >
                    {del.done ? (
                      <CheckSquare size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square size={14} className="shrink-0 mt-0.5 text-slate-400" />
                    )}
                    <span
                      className={`leading-snug ${
                        del.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {del.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveDeliverable(area.id, del.id)}
                    aria-label="Remover entrega"
                    className="opacity-60 hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newDeliverable.trim()) return;
              onAddDeliverable(area.id, newDeliverable);
              setNewDeliverable('');
            }}
            className="flex gap-1.5 pt-1"
          >
            <input
              type="text"
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
              placeholder="Nova entrega..."
              className="flex-1 min-w-0 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              <Plus size={12} />
              <span>Adicionar</span>
            </button>
          </form>
        </div>

        {/* Pendências da Macroárea */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pendências & riscos da área
          </span>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
            {area.pendings.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-1">
                Sem pendências abertas.
              </p>
            ) : (
              area.pendings.map((pen) => (
                <button
                  key={pen.id}
                  type="button"
                  onClick={() => onTogglePending(area.id, pen.id)}
                  className="flex w-full items-start gap-1.5 rounded border border-slate-200 dark:border-[#243242] bg-slate-50/70 dark:bg-[#18222F]/60 px-2 py-1.5 text-left text-xs hover:border-[#0F5E59]"
                >
                  <AlertTriangle
                    size={13}
                    className={`shrink-0 mt-0.5 ${
                      pen.resolved
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  />
                  <span
                    className={`leading-snug flex-1 ${
                      pen.resolved
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {pen.text}
                  </span>
                </button>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPending.trim()) return;
              onAddPending(area.id, newPending);
              setNewPending('');
            }}
            className="flex gap-1.5 pt-1"
          >
            <input
              type="text"
              value={newPending}
              onChange={(e) => setNewPending(e.target.value)}
              placeholder="Nova pendência..."
              className="flex-1 min-w-0 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#18222F] hover:border-[#0F5E59] dark:hover:border-[#2DD4BF] px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              <Plus size={12} />
              <span>Adicionar</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
