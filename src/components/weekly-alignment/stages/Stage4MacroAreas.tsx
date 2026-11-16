import React from 'react';
import { Layers } from 'lucide-react';
import type { MacroAreaGovernance, MacroAreaId } from '../../../types/weeklyAlignment';
import { MacroAreaCard } from '../MacroAreaCard';
import type { CollaboratorOption } from '../TeamMemberSelector';

export const Stage4MacroAreas: React.FC<{
  macroAreas: MacroAreaGovernance[];
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
  macroAreas,
  collaborators,
  onUpdateArea,
  onAddDeliverable,
  onToggleDeliverable,
  onRemoveDeliverable,
  onAddPending,
  onTogglePending,
}) => {
  const definedCount = macroAreas.filter(
    (m) => m.primaryOwnerId && m.primaryOwnerName && m.primaryOwnerName !== 'Não definido'
  ).length;

  return (
    <div className="space-y-3.5">
      {/* Barra de cobertura das 4 Macroáreas */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Layers size={15} className="text-[#0F5E59] dark:text-[#2DD4BF]" />
          <span>
            Defina responsável principal, técnico de apoio opcional, entregas e pendências por frente operacional. Entregas alimentam automaticamente a Etapa 6.
          </span>
        </div>
        <span
          className={`font-mono font-semibold tabular-nums whitespace-nowrap ${
            definedCount === macroAreas.length
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400'
          }`}
        >
          {definedCount}/{macroAreas.length} frentes com responsável
        </span>
      </div>

      {/* Grade 2x2 das 4 Macroáreas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
        {macroAreas.map((area) => (
          <MacroAreaCard
            key={area.id}
            area={area}
            collaborators={collaborators}
            onUpdateArea={onUpdateArea}
            onAddDeliverable={onAddDeliverable}
            onToggleDeliverable={onToggleDeliverable}
            onRemoveDeliverable={onRemoveDeliverable}
            onAddPending={onAddPending}
            onTogglePending={onTogglePending}
          />
        ))}
      </div>
    </div>
  );
};
