import React, { useState } from 'react';
import { Modal } from '../common/UiPrimitives';
import type { WeeklyStageId } from '../../types/weeklyAlignment';
import { TeamMemberSelector, type CollaboratorOption } from './TeamMemberSelector';

export const DecisionEditor: React.FC<{
  open: boolean;
  currentStage: WeeklyStageId;
  collaborators: CollaboratorOption[];
  onClose: () => void;
  onSaveDecision: (
    decision: string,
    ownerName: string,
    dueDate: string,
    stage: WeeklyStageId
  ) => void;
}> = ({ open, currentStage, collaborators, onClose, onSaveDecision }) => {
  const [decision, setDecision] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('Gestor de TI');
  const [dueDate, setDueDate] = useState('2026-11-20');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim()) return;
    onSaveDecision(decision.trim(), ownerName || 'Gestor de TI', dueDate, currentStage);
    setDecision('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Decisão da Reunião"
      subtitle={`Registrada durante a Etapa ${currentStage}/7 e consolidada automaticamente na Etapa 6`}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Deliberação / Decisão tomada *
          </label>
          <textarea
            required
            rows={3}
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="Descreva objetivamente a decisão acordada pela equipe durante o alinhamento..."
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TeamMemberSelector
            label="Responsável pelo encaminhamento"
            value={ownerId}
            options={collaborators}
            emptyOptionLabel="Gestor de TI"
            onChange={(id, name) => {
              setOwnerId(id);
              setOwnerName(name || 'Gestor de TI');
            }}
          />
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Prazo previsto
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1D2836]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-[#243242] px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-4 py-1.5 text-xs font-medium text-white dark:text-slate-950"
          >
            Registrar decisão
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const ExtraCommitmentModal: React.FC<{
  open: boolean;
  collaborators: CollaboratorOption[];
  onClose: () => void;
  onSaveCommitment: (payload: {
    commitment: string;
    ownerId: string;
    ownerName: string;
    supportId: string;
    supportName: string;
    dueDate: string;
  }) => void;
}> = ({ open, collaborators, onClose, onSaveCommitment }) => {
  const [commitment, setCommitment] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [supportId, setSupportId] = useState('');
  const [supportName, setSupportName] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-20');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitment.trim() || !ownerId) return;
    onSaveCommitment({
      commitment: commitment.trim(),
      ownerId,
      ownerName,
      supportId,
      supportName,
      dueDate,
    });
    setCommitment('');
    setOwnerId('');
    setOwnerName('');
    setSupportId('');
    setSupportName('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar Compromisso Operacional"
      subtitle="Integrado à matriz consolidada da Etapa 6"
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Compromisso / Ação acordada *
          </label>
          <textarea
            required
            rows={2}
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            placeholder="Ex.: Validar checklist de backup das UTIs com a Enfermaria"
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TeamMemberSelector
            label="Responsável principal"
            required
            value={ownerId}
            options={collaborators}
            emptyOptionLabel="Selecione..."
            onChange={(id, name) => {
              setOwnerId(id);
              setOwnerName(name);
            }}
          />
          <TeamMemberSelector
            label="Técnico de apoio (opcional)"
            value={supportId}
            options={collaborators}
            emptyOptionLabel="Sem técnico de apoio"
            onChange={(id, name) => {
              setSupportId(id);
              setSupportName(name);
            }}
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prazo acordado
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 font-mono text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1D2836]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-[#243242] px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-4 py-1.5 text-xs font-medium text-white dark:text-slate-950"
          >
            Adicionar compromisso
          </button>
        </div>
      </form>
    </Modal>
  );
};
