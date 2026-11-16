import React from 'react';
import type {
  CommitmentSituation,
  ConsolidatedCommitmentRow,
  WeeklyStageId,
} from '../../../types/weeklyAlignment';
import { CommitmentTable } from '../CommitmentTable';

export const Stage6Commitments: React.FC<{
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
  return (
    <CommitmentTable
      rows={rows}
      onChangeStatus={onChangeStatus}
      onEditExtraCommitment={onEditExtraCommitment}
      onJumpToStage={onJumpToStage}
      onOpenAddCommitment={onOpenAddCommitment}
    />
  );
};
