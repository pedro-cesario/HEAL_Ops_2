import React, { useState } from 'react';
import { AlertTriangle, Calendar, FolderKanban, Plus, ShieldAlert } from 'lucide-react';
import { EmptyState } from '../../common/UiPrimitives';
import type { ProjectGmudItem } from '../../../types/weeklyAlignment';

export const Stage5ProjectsGmud: React.FC<{
  projects: ProjectGmudItem[];
  onAddReferral: (projectId: string, text: string, ownerName: string) => void;
}> = ({ projects, onAddReferral }) => {
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>({});
  const [draftOwners, setDraftOwners] = useState<Record<string, string>>({});

  if (projects.length === 0) {
    return (
      <EmptyState
        title="Nenhum projeto ou GMUD previsto para este alinhamento."
        description="Quando houver mudanças programadas (GMUD) ou frentes de projeto para a semana, elas serão exibidas aqui para decisão e encaminhamento."
      />
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <FolderKanban size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
          <span>
            Revise janelas assistenciais, riscos de mudança e registre encaminhamentos ao vivo (consolidados automaticamente na Etapa 6).
          </span>
        </div>
        <span className="font-mono font-semibold tabular-nums text-slate-600 dark:text-slate-300">
          {projects.length} item(ns) ativos
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {projects.map((pg) => {
          const textVal = draftTexts[pg.id] || '';
          const ownerVal = draftOwners[pg.id] ?? pg.ownerName;

          return (
            <section
              key={pg.id}
              className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-[#1D2836] pb-2">
                  <div>
                    <div className="font-mono text-[11px] font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                      {pg.code} · {pg.status}
                    </div>
                    <h3 className="mt-0.5 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {pg.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${
                      pg.risk === 'Alto'
                        ? 'text-red-700 dark:text-red-400'
                        : pg.risk === 'Médio'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {pg.risk === 'Alto' ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}
                    <span>Risco {pg.risk}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[11px] text-slate-400">Responsável</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {pg.ownerName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Prazo / Janela</span>
                    <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                      <Calendar size={11} />
                      {pg.dueDate}
                    </span>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 text-xs">
                  <span className="block text-[11px] text-slate-400 mb-0.5">Próxima ação prevista</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {pg.nextAction}
                  </p>
                </div>

                {/* Encaminhamentos registrados durante a reunião */}
                {pg.referrals.length > 0 && (
                  <div className="space-y-1">
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Encaminhamentos da reunião ({pg.referrals.length})
                    </span>
                    <ul className="space-y-1 max-h-24 overflow-y-auto">
                      {pg.referrals.map((r) => (
                        <li
                          key={r.id}
                          className="rounded border border-[#0F5E59]/30 dark:border-[#2DD4BF]/30 bg-[#0F5E59]/[0.04] dark:bg-[#2DD4BF]/[0.06] px-2 py-1.5 text-[11px]"
                        >
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {r.text}
                          </div>
                          <div className="text-slate-500">
                            {r.ownerName} · {r.createdAt}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Registrar encaminhamento inline */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!textVal.trim()) return;
                  onAddReferral(pg.id, textVal, ownerVal);
                  setDraftTexts((prev) => ({ ...prev, [pg.id]: '' }));
                }}
                className="space-y-1.5 border-t border-slate-100 dark:border-[#1D2836] pt-2.5"
              >
                <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Registrar encaminhamento
                </span>
                <input
                  type="text"
                  value={textVal}
                  onChange={(e) =>
                    setDraftTexts((prev) => ({ ...prev, [pg.id]: e.target.value }))
                  }
                  placeholder="Ex.: Validar rollback com plantão antes de 18h"
                  className="w-full rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={ownerVal}
                    onChange={(e) =>
                      setDraftOwners((prev) => ({ ...prev, [pg.id]: e.target.value }))
                    }
                    placeholder="Responsável"
                    className="flex-1 min-w-0 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-2.5 py-1 text-[11px] font-medium text-white dark:text-slate-950 whitespace-nowrap"
                  >
                    <Plus size={12} />
                    <span>Registrar</span>
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
};
