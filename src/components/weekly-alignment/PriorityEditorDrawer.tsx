import React, { useEffect, useState } from 'react';
import type { TicketItem } from '../../types/ops';
import type { PriorityEditorTarget } from '../../hooks/useWeeklyAlignment';
import { Drawer } from '../common/UiPrimitives';
import { TeamMemberSelector, type CollaboratorOption } from './TeamMemberSelector';

const MACRO_AREA_OPTIONS = [
  'Suporte Técnico',
  'Sistemas',
  'Infraestrutura',
  'Gestão',
  'Assistencial',
  'Sistemas Assistenciais',
  'Corporativo',
];

export const PriorityEditorDrawer: React.FC<{
  target: PriorityEditorTarget | null;
  collaborators: CollaboratorOption[];
  onClose: () => void;
  onSave: (payload: {
    ticket: TicketItem;
    primaryOwnerId: string;
    primaryOwnerName: string;
    supportTechId: string;
    supportTechName: string;
    macroArea: string;
    dueDate: string;
    nextAction: string;
    justification: string;
  }) => void;
}> = ({ target, collaborators, onClose, onSave }) => {
  const [primaryOwnerId, setPrimaryOwnerId] = useState('');
  const [primaryOwnerName, setPrimaryOwnerName] = useState('');
  const [supportTechId, setSupportTechId] = useState('');
  const [supportTechName, setSupportTechName] = useState('');
  const [macroArea, setMacroArea] = useState('Assistencial');
  const [dueDate, setDueDate] = useState('2026-11-20');
  const [nextAction, setNextAction] = useState('');
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (!target) return;
    if (target.existingPriority) {
      setPrimaryOwnerId(target.existingPriority.primaryOwnerId);
      setPrimaryOwnerName(target.existingPriority.primaryOwnerName);
      setSupportTechId(target.existingPriority.supportTechId);
      setSupportTechName(target.existingPriority.supportTechName);
      setMacroArea(target.existingPriority.macroArea);
      setDueDate(target.existingPriority.dueDate || '2026-11-20');
      setNextAction(target.existingPriority.nextAction);
      setJustification(target.existingPriority.justification);
    } else {
      const matchedTech = collaborators.find(
        (c) => c.name === target.ticket.techName
      );
      setPrimaryOwnerId(matchedTech?.id || '');
      setPrimaryOwnerName(matchedTech?.name || '');
      setSupportTechId('');
      setSupportTechName('');
      setMacroArea(target.ticket.macroArea || 'Assistencial');
      setDueDate('2026-11-20');
      setNextAction('');
      setJustification(target.ticket.classificationReason || '');
    }
  }, [target, collaborators]);

  return (
    <Drawer
      open={Boolean(target)}
      onClose={onClose}
      title={
        target?.mode === 'edit'
          ? `Editar Prioridade #${target.ticket.id}`
          : `Priorizar Chamado #${target?.ticket.id || ''}`
      }
      subtitle="Defina responsável principal, apoio técnico opcional, prazo e próxima ação"
      widthClass="max-w-lg"
    >
      {target && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!primaryOwnerId) return;
            onSave({
              ticket: target.ticket,
              primaryOwnerId,
              primaryOwnerName: primaryOwnerName || 'Não definido',
              supportTechId,
              supportTechName,
              macroArea,
              dueDate,
              nextAction: nextAction.trim(),
              justification: justification.trim(),
            });
          }}
          className="space-y-4 text-xs"
        >
          {/* Chamado selecionado */}
          <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-1">
            <div className="font-mono text-[11px] text-[#0F5E59] dark:text-[#2DD4BF]">
              Chamado selecionado · #{target.ticket.id} · {target.ticket.status}
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {target.ticket.title}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Grupo: {target.ticket.group} · Atualização: {target.ticket.lastUpdatedAt}
            </div>
          </div>

          <TeamMemberSelector
            label="Responsável principal"
            value={primaryOwnerId}
            options={collaborators}
            emptyOptionLabel="Selecione o responsável..."
            required
            onChange={(id, name) => {
              setPrimaryOwnerId(id);
              setPrimaryOwnerName(name);
            }}
          />

          <TeamMemberSelector
            label="Técnico de apoio (opcional)"
            value={supportTechId}
            options={collaborators.filter((c) => c.id !== primaryOwnerId)}
            emptyOptionLabel="Sem técnico de apoio"
            onChange={(id, name) => {
              setSupportTechId(id);
              setSupportTechName(name);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Macroárea
              </label>
              <select
                value={macroArea}
                onChange={(e) => setMacroArea(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 text-xs"
              >
                {MACRO_AREA_OPTIONS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prazo
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Próxima ação
            </label>
            <textarea
              rows={2}
              required
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Ex.: Designar técnico de apoio e validar servidor DICOM antes das 16h..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Justificativa
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex.: Impacto direto em unidade assistencial crítica / risco de SLA..."
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2.5 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#243242] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3.5 py-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-4 py-2 font-medium text-white dark:text-slate-950"
            >
              Salvar prioridade
            </button>
          </div>
        </form>
      )}
    </Drawer>
  );
};
