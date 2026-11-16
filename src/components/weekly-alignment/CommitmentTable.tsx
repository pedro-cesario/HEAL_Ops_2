import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Edit3, Plus, Search } from 'lucide-react';
import type {
  CommitmentOriginType,
  CommitmentSituation,
  ConsolidatedCommitmentRow,
  WeeklyStageId,
} from '../../types/weeklyAlignment';

const SITUATION_OPTIONS: CommitmentSituation[] = [
  'Pendente',
  'Em curso',
  'Confirmado',
  'Concluído',
];

export const CommitmentTable: React.FC<{
  rows: ConsolidatedCommitmentRow[];
  onChangeStatus: (row: ConsolidatedCommitmentRow, nextStatus: CommitmentSituation) => void;
  onEditExtraCommitment: (
    id: string,
    patch: Partial<{ commitment: string; ownerName: string; supportName: string; dueDate: string }>
  ) => void;
  onJumpToStage: (stage: WeeklyStageId) => void;
  onOpenAddCommitment: () => void;
}> = ({
  rows,
  onChangeStatus,
  onEditExtraCommitment,
  onJumpToStage,
  onOpenAddCommitment,
}) => {
  const [originFilter, setOriginFilter] = useState<'Todas' | CommitmentOriginType>('Todas');
  const [ownerFilter, setOwnerFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDue, setEditDue] = useState('');

  const ownerOptions = useMemo(
    () => ['Todos', ...Array.from(new Set(rows.map((r) => r.ownerName).filter(Boolean)))],
    [rows]
  );

  const originCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      counts[r.origin] = (counts[r.origin] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (originFilter !== 'Todas' && row.origin !== originFilter) return false;
      if (ownerFilter !== 'Todos' && row.ownerName !== ownerFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        row.commitment.toLowerCase().includes(q) ||
        row.ownerName.toLowerCase().includes(q) ||
        row.origin.toLowerCase().includes(q)
      );
    });
  }, [rows, originFilter, ownerFilter, search]);

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] overflow-hidden">
      {/* Cabeçalho e Filtros */}
      <div className="border-b border-slate-200 dark:border-[#243242] px-4 py-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Matriz Consolidada de Acordos e Compromissos ({rows.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Consolidada automaticamente de Prioridades ({originCounts['Prioridade'] || 0}), Meta ({originCounts['Meta Semanal'] || 0}), Macroáreas ({originCounts['Macroárea'] || 0}), Projetos/GMUD ({originCounts['Projeto/GMUD'] || 0}), Decisões ({originCounts['Decisão'] || 0}) e Adicionais ({originCounts['Compromisso Adicional'] || 0})
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddCommitment}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3 py-1.5 text-xs font-medium text-white dark:text-slate-950 transition-colors whitespace-nowrap"
          >
            <Plus size={13} />
            <span>Adicionar Compromisso</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          <div className="relative sm:col-span-5">
            <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar compromisso, responsável ou origem..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] pl-7 pr-2.5 py-1.5 text-xs"
            />
          </div>

          <select
            aria-label="Filtrar por origem"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as 'Todas' | CommitmentOriginType)}
            className="sm:col-span-4 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
          >
            <option value="Todas">Origem: Todas</option>
            <option value="Prioridade">Prioridade</option>
            <option value="Meta Semanal">Meta Semanal</option>
            <option value="Macroárea">Macroárea</option>
            <option value="Projeto/GMUD">Projeto/GMUD</option>
            <option value="Decisão">Decisão</option>
            <option value="Compromisso Adicional">Compromisso Adicional</option>
          </select>

          <select
            aria-label="Filtrar por responsável"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="sm:col-span-3 rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 text-xs"
          >
            {ownerOptions.map((ow) => (
              <option key={ow} value={ow}>
                {ow === 'Todos' ? 'Responsável: Todos' : ow}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela unificada */}
      <div className="overflow-auto max-h-[calc(100vh-295px)]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18222F] border-b border-slate-200 dark:border-[#243242] text-[11px] text-slate-500 uppercase">
            <tr>
              <th className="py-2.5 px-3">Origem</th>
              <th className="py-2.5 px-3">Compromisso</th>
              <th className="py-2.5 px-3">Responsável</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Apoio</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Prazo</th>
              <th className="py-2.5 px-3">Situação</th>
              <th className="py-2.5 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1D2836]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum compromisso corresponde aos filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isEditingThis =
                  row.origin === 'Compromisso Adicional' && editingExtraId === row.sourceRefId;

                return (
                  <tr
                    key={row.key}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#18222F]/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">
                        {row.origin}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 max-w-[380px]">
                      {isEditingThis ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded border border-[#0F5E59] bg-white dark:bg-[#111923] px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-slate-100 leading-snug block">
                          {row.commitment}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={
                          row.ownerName === 'Não definido'
                            ? 'font-medium text-amber-700 dark:text-amber-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }
                      >
                        {row.ownerName}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {row.supportName || '—'}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {isEditingThis ? (
                        <input
                          type="date"
                          value={editDue}
                          onChange={(e) => setEditDue(e.target.value)}
                          className="rounded border border-[#0F5E59] bg-white dark:bg-[#111923] px-1.5 py-0.5 text-xs"
                        />
                      ) : (
                        row.dueDate
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <select
                        aria-label={`Situação do compromisso ${row.commitment}`}
                        value={row.status}
                        onChange={(e) =>
                          onChangeStatus(row, e.target.value as CommitmentSituation)
                        }
                        className={`rounded border px-2 py-1 text-[11px] font-medium focus:outline-none ${
                          row.status === 'Concluído' || row.status === 'Confirmado'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : row.status === 'Em curso'
                              ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300'
                              : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {SITUATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {row.origin === 'Compromisso Adicional' ? (
                        isEditingThis ? (
                          <button
                            type="button"
                            onClick={() => {
                              onEditExtraCommitment(row.sourceRefId, {
                                commitment: editText.trim() || row.commitment,
                                dueDate: editDue || row.dueDate,
                              });
                              setEditingExtraId(null);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-[#0F5E59] dark:bg-[#14B8A6] px-2 py-1 text-[11px] font-medium text-white dark:text-slate-950"
                          >
                            <Check size={11} />
                            <span>Salvar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExtraId(row.sourceRefId);
                              setEditText(row.commitment);
                              setEditDue(row.dueDate);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-[#0F5E59]"
                          >
                            <Edit3 size={11} />
                            <span>Editar</span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => onJumpToStage(row.originStage)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-[#243242] px-2 py-1 text-[11px] font-medium text-[#0F5E59] dark:text-[#2DD4BF] hover:border-[#0F5E59]"
                        >
                          <span>Etapa {row.originStage}</span>
                          <ArrowUpRight size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
