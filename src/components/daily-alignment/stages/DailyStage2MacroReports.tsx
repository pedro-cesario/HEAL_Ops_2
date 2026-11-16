import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Settings2 } from 'lucide-react';
import type {
  DailyMacroReport,
  MacroSituationStatus,
} from '../../../types/dailyAlignment';
import type { MacroAreaConfigItem, WeeklyPriority } from '../../../types/ops';

export const DailyStage2MacroReports: React.FC<{
  macroReports: DailyMacroReport[];
  macroConfigs: MacroAreaConfigItem[];
  weeklyPriorities: WeeklyPriority[];
  collaborators: { id: string; name: string }[];
  onUpdateMacroReport: (reportId: string, patch: Partial<DailyMacroReport>) => void;
  onUpdateMacroConfig: (id: string, patch: Partial<MacroAreaConfigItem>) => void;
  onAddMacroConfig: (name: string, defaultLeadName: string) => void;
  onToggleMacroActive: (id: string) => void;
}> = ({
  macroReports,
  macroConfigs,
  weeklyPriorities,
  collaborators,
  onUpdateMacroReport,
  onUpdateMacroConfig,
  onAddMacroConfig,
  onToggleMacroActive,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [configOpen, setConfigOpen] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroLead, setNewMacroLead] = useState(collaborators[0]?.name || 'Gestor de TI');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {/* Header strip + Inline Macroarea Configuration Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5 text-xs">
        <div className="text-slate-600 dark:text-slate-300">
          Rodada executiva por macroárea. As prioridades exibidas no seletor são herdadas diretamente do{' '}
          <strong className="text-[#0F5E59] dark:text-[#2DD4BF]">Alinhamento Semanal (TPL-02)</strong>.
        </div>
        <button
          type="button"
          onClick={() => setConfigOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1 font-medium text-slate-700 dark:text-slate-200 hover:border-[#0F5E59] whitespace-nowrap"
        >
          <Settings2 size={13} />
          <span>{configOpen ? 'Ocultar configuração' : 'Configurar macroáreas'}</span>
        </button>
      </div>

      {configOpen && (
        <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3.5 space-y-3 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            Macroáreas Configuráveis (sincronizadas com Configurações e Equipe)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {macroConfigs.map((mc) => (
              <div
                key={mc.id}
                className="flex flex-wrap items-center gap-2 rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2"
              >
                <input
                  type="text"
                  value={mc.name}
                  onChange={(e) => onUpdateMacroConfig(mc.id, { name: e.target.value })}
                  className="flex-1 min-w-[140px] rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs font-medium"
                />
                <select
                  value={mc.defaultLeadName}
                  onChange={(e) =>
                    onUpdateMacroConfig(mc.id, { defaultLeadName: e.target.value })
                  }
                  className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs"
                >
                  {collaborators.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onToggleMacroActive(mc.id)}
                  className={`rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap ${
                    mc.active
                      ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/15 dark:text-[#2DD4BF]'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {mc.active ? 'Ativa' : 'Oculta'}
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newMacroName.trim()) return;
              onAddMacroConfig(newMacroName, newMacroLead);
              setNewMacroName('');
            }}
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={newMacroName}
              onChange={(e) => setNewMacroName(e.target.value)}
              placeholder="Nova macroárea (ex.: Governança / Dados)..."
              className="flex-1 min-w-[200px] rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2.5 py-1.5"
            />
            <select
              value={newMacroLead}
              onChange={(e) => setNewMacroLead(e.target.value)}
              className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2.5 py-1.5"
            >
              {collaborators.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-3 py-1.5 font-medium text-white dark:text-slate-950"
            >
              <Plus size={13} />
              <span>Adicionar</span>
            </button>
          </form>
        </div>
      )}

      {/* 4 Cards de Parecer Objetivo das Macroáreas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {macroReports.map((mr) => {
          const isExpanded = Boolean(expandedIds[mr.id]);
          const selectedPriority = weeklyPriorities.find((p) => p.id === mr.weeklyPriorityId);

          return (
            <section
              key={mr.id}
              className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2.5 text-xs"
            >
              {/* Row 1: Macroarea Name + Lead + Situation */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {mr.macroArea}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label={`Responsável de referência — ${mr.macroArea}`}
                    value={mr.leadName}
                    onChange={(e) =>
                      onUpdateMacroReport(mr.id, { leadName: e.target.value })
                    }
                    className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs font-medium"
                  >
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label={`Situação — ${mr.macroArea}`}
                    value={mr.situation}
                    onChange={(e) =>
                      onUpdateMacroReport(mr.id, {
                        situation: e.target.value as MacroSituationStatus,
                      })
                    }
                    className={`rounded border px-2 py-1 text-xs font-semibold ${
                      mr.situation === 'Crítica'
                        ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                        : mr.situation === 'Atenção'
                          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                    }`}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Atenção">Atenção</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Parecer objetivo editável */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Parecer objetivo da área
                </label>
                <input
                  type="text"
                  value={mr.summary}
                  onChange={(e) =>
                    onUpdateMacroReport(mr.id, { summary: e.target.value })
                  }
                  placeholder="Resumo objetivo da operação na macroárea..."
                  className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Row 3: Prioridade herdada do TPL-02 + Toggle detalhes */}
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex-1 min-w-[210px]">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Prioridade semanal em tratativa (herdada do TPL-02)
                  </label>
                  <select
                    value={mr.weeklyPriorityId}
                    onChange={(e) =>
                      onUpdateMacroReport(mr.id, { weeklyPriorityId: e.target.value })
                    }
                    className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1.5 text-xs"
                  >
                    <option value="">Sem prioridade semanal vinculada</option>
                    {weeklyPriorities.map((pri) => (
                      <option key={pri.id} value={pri.id}>
                        #{pri.ticketId} — {pri.title} ({pri.status})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => toggleExpand(mr.id)}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-[#0F5E59] whitespace-nowrap"
                >
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <span>{isExpanded ? 'Recolher detalhes' : 'Impedimento & Próxima ação'}</span>
                </button>
              </div>

              {!isExpanded && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="truncate">
                    <strong className="text-slate-700 dark:text-slate-300">Próxima ação:</strong>{' '}
                    {mr.nextAction || 'Não definida'}
                  </span>
                  {mr.blocker && (
                    <span className="font-medium text-amber-700 dark:text-amber-400 truncate">
                      Impedimento ativo
                    </span>
                  )}
                </div>
              )}

              {isExpanded && (
                <div className="space-y-2 border-t border-slate-100 dark:border-[#1D2836] pt-2.5">
                  {selectedPriority && (
                    <div className="rounded bg-[#0F5E59]/[0.05] dark:bg-[#2DD4BF]/[0.08] px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <strong>TPL-02 #{selectedPriority.ticketId}:</strong> {selectedPriority.nextAction} ·{' '}
                      Prazo <span className="font-mono">{selectedPriority.dueDate || 'Semana'}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Impedimento (caso exista)
                    </label>
                    <input
                      type="text"
                      value={mr.blocker}
                      onChange={(e) =>
                        onUpdateMacroReport(mr.id, { blocker: e.target.value })
                      }
                      placeholder="Sem impedimentos registrados..."
                      className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Próxima ação objetiva
                    </label>
                    <input
                      type="text"
                      value={mr.nextAction}
                      onChange={(e) =>
                        onUpdateMacroReport(mr.id, { nextAction: e.target.value })
                      }
                      placeholder="Ação imediata com horário ou critério de conclusão..."
                      className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                    />
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
