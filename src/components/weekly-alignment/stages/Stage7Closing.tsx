import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../../common/UiPrimitives';
import type {
  ConsolidatedCommitmentRow,
  WeeklyAlignmentDraft,
  WeeklyStageId,
} from '../../../types/weeklyAlignment';
import { MeetingSummary } from '../MeetingSummary';

export const Stage7Closing: React.FC<{
  draft: WeeklyAlignmentDraft;
  consolidatedCommitments: ConsolidatedCommitmentRow[];
  confirmFinalizeOpen: boolean;
  onSetConfirmFinalizeOpen: (open: boolean) => void;
  onGoToStage: (stage: WeeklyStageId) => void;
  onSaveDraft: () => void;
  onConfirmFinalize: () => void;
  onOpenDocument: () => void;
}> = ({
  draft,
  consolidatedCommitments,
  confirmFinalizeOpen,
  onSetConfirmFinalizeOpen,
  onGoToStage,
  onSaveDraft,
  onConfirmFinalize,
  onOpenDocument,
}) => {
  return (
    <>
      <MeetingSummary
        draft={draft}
        consolidatedCommitments={consolidatedCommitments}
        onGoToStage={onGoToStage}
        onSaveDraft={onSaveDraft}
        onRequestFinalize={() => onSetConfirmFinalizeOpen(true)}
        onOpenDocument={onOpenDocument}
      />

      <Modal
        open={confirmFinalizeOpen}
        onClose={() => onSetConfirmFinalizeOpen(false)}
        title="Confirmar Finalização do Alinhamento Semanal"
        subtitle="Nenhuma edição será descartada · O registro ficará consolidado para o documento oficial"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-3 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Resumo antes de concluir:
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              <li>· Prioridades selecionadas: {draft.priorities.length}/5</li>
              <li>· Meta semanal de backlog: -{draft.weeklyGoal.reductionPercent}% ({draft.weeklyGoal.targetCount} chamado(s))</li>
              <li>· Compromissos consolidados: {consolidatedCommitments.length}</li>
              <li>· Decisões registradas: {draft.decisions.length}</li>
            </ul>
          </div>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Após finalizar, você ainda poderá consultar qualquer etapa ou gerar o documento oficial da reunião. Deseja concluir o alinhamento agora?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1D2836]">
            <button
              type="button"
              onClick={() => onSetConfirmFinalizeOpen(false)}
              className="rounded-md border border-slate-200 dark:border-[#243242] px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Revisar antes
            </button>
            <button
              type="button"
              onClick={onConfirmFinalize}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-4 py-1.5 text-xs font-semibold text-white dark:text-slate-950"
            >
              <CheckCircle2 size={14} />
              <span>Confirmar encerramento</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
