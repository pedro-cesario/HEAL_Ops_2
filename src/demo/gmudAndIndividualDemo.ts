import type {
  GmudRecord,
  IndividualAlignmentRecord,
  MeetingRecord,
  TeamMember,
} from '../types/ops';

export const INITIAL_GMUD_042: GmudRecord = {
  id: 'gmud-042',
  code: 'GMUD-042',
  title: 'Modernização de Switching do Bloco Administrativo',
  status: 'Aguardando Aprovação',
  objective:
    'Substituição de 3 switches de acesso legados por equipamentos gerenciáveis com redundância LACP e monitoramento SNMP.',
  justification: '',
  scope:
    'Substituição de 3 switches de acesso legados no Bloco Administrativo Térreo, mantendo redundância LACP e ativação de monitoramento SNMP.',
  equipmentAndLocations: 'Bloco Administrativo Térreo · 3 switches de acesso legados (modelos/patrimônios pendentes de preenchimento)',
  technicalLead: 'Rafael Oliveira',
  executingTeam: 'Rafael Oliveira, Thiago Mendes, Gestor de TI',
  executionWindow: '16/11/2026 após 19h (operação assistida em 17/11 às 07h)',
  impactAndRiskAnalysis:
    'Risco Médio · Janela noturna após 19h para mitigar indisponibilidade na recepção e área administrativa (detalhamento de estações/ramais impactados pendente de preenchimento).',
  dependencies:
    'Backup de configurações e validação em staging (:8788), autonomia de nobreak > 30 min e comunicação prévia à recepção/administrativo até 18h.',
  executionPlan:
    'Marco 01 (15/11): Backup e validação de portas/VLANs em staging (:8788). Marco 02 (16/11 · 19h): Janela de corte físico dos 3 switches e teste LACP. Marco 03 (17/11 · 07h): Operação assistida.',
  communicationPlan:
    'Notificação prévia às coordenações administrativas e recepção antes das 18h sobre a janela após 19h.',
  testPlan:
    'Checklist de portas, validação de agregação LACP, monitoramento SNMP e validação de conectividade com recepção.',
  rollbackPlan:
    'Script de rollback testado e acessível offline (pendente de anexo formal no registro antes das 18h).',
  evidencesNote: 'Checklist de portas e teste de LACP validados no ambiente de staging (:8788) em 15/11 às 16:30.',
  approvals: [
    {
      id: 'apv-1',
      role: 'Coordenação / Gestão Operacional de TI',
      approverName: 'Gestor de TI',
      decision: 'Pendente',
      note: 'Aguardando validação final do anexo de rollback antes das 18h.',
      updatedAt: '—',
    },
    {
      id: 'apv-2',
      role: 'Responsável Técnico de Infraestrutura',
      approverName: 'Rafael Oliveira',
      decision: 'Aprovado (Simulação)',
      note: 'Validação técnica de LACP concluída em staging (:8788).',
      updatedAt: '15/11 · 16:30',
    },
    {
      id: 'apv-3',
      role: 'Ciência Administrativa / Recepção',
      approverName: '',
      decision: 'Pendente',
      note: '',
      updatedAt: '—',
    },
  ],
  closureResult: '',
  checklist: [
    {
      id: 'chk-pre-1',
      phase: 'Pré-Execução',
      text: 'Backup de configurações e validação de portas/VLANs no ambiente staging (:8788)',
      ownerName: 'Rafael Oliveira',
      done: true,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-pre-2',
      phase: 'Pré-Execução',
      text: 'Script de rollback testado, acessível offline e anexado ao registro antes das 18h',
      ownerName: 'Rafael Oliveira',
      done: false,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-pre-3',
      phase: 'Pré-Execução',
      text: 'Nobreak do rack validado com autonomia > 30 min',
      ownerName: 'Thiago Mendes',
      done: true,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-pre-4',
      phase: 'Pré-Execução',
      text: 'Comunicação prévia enviada às coordenações administrativas e recepção',
      ownerName: 'Gestor de TI',
      done: false,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-exe-1',
      phase: 'Execução',
      text: 'Substituição física dos 3 switches de acesso legados no Bloco Administrativo Térreo',
      ownerName: 'Rafael Oliveira',
      done: false,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-exe-2',
      phase: 'Execução',
      text: 'Ativação da redundância LACP e monitoramento SNMP',
      ownerName: 'Thiago Mendes',
      done: false,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-val-1',
      phase: 'Validação',
      text: 'Testes de conectividade de portas com recepção e administrativo',
      ownerName: 'Thiago Mendes',
      done: false,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-val-2',
      phase: 'Validação',
      text: 'Validação imediata de telemetria no monitoramento SNMP',
      ownerName: 'Rafael Oliveira',
      done: false,
      fromOriginalRecord: true,
    },
    {
      id: 'chk-enc-1',
      phase: 'Encerramento',
      text: 'Operação assistida às 07h e registro formal de encerramento sem pendências',
      ownerName: 'Rafael Oliveira',
      done: false,
      fromOriginalRecord: true,
    },
  ],
  transitions: [
    {
      id: 'tr-1',
      fromStatus: 'Rascunho',
      toStatus: 'Análise',
      actorName: 'Rafael Oliveira',
      note: 'Plano de corte e validação de staging (:8788) registrados.',
      timestamp: '15/11 · 16:00',
      isSimulatedDemo: true,
    },
    {
      id: 'tr-2',
      fromStatus: 'Análise',
      toStatus: 'Aguardando Aprovação',
      actorName: 'Rafael Oliveira',
      note: 'Checklist de portas LACP validado; aguardando anexo de rollback e aprovação final.',
      timestamp: '15/11 · 16:30',
      isSimulatedDemo: true,
    },
  ],
  lastUpdatedAt: '15/11/2026 · 16:30',
};

export function createInitialIndividualAlignments(
  teamMembers: TeamMember[],
  meetings: MeetingRecord[]
): IndividualAlignmentRecord[] {
  const m3 = meetings.find((m) => m.id === 'mtg-3');

  return teamMembers.map((member, idx) => {
    const isMariana = member.id === 'tm-2';
    const lastAlign = member.alignments[0];
    const strengthsText = member.feedbacks
      .filter((f) => f.type === 'Reconhecimento')
      .map((f) => `${f.date}: ${f.note}`)
      .join(' ') || member.profileSummary;
    const devText = member.feedbacks
      .filter((f) => f.type === 'Desenvolvimento')
      .map((f) => `${f.date}: ${f.note}`)
      .join(' ') || 'Manter atualização contínua dos chamados no GLPI conforme POP.';

    const collaboratorCommitments = member.commitments
      .filter((c) => c.owner === 'Colaborador')
      .map((c) => ({
        id: `bil-${member.id}-${c.id}`,
        party: 'Colaborador' as const,
        ownerName: member.name,
        description: c.description,
        dueDate: c.dueDate,
        status: c.status,
      }));

    const managerCommitments = member.commitments
      .filter((c) => c.owner === 'Gestor')
      .map((c) => ({
        id: `bil-${member.id}-${c.id}`,
        party: 'Gestor' as const,
        ownerName: 'Gestor de TI',
        description: c.description,
        dueDate: c.dueDate,
        status: c.status,
      }));

    const pendingPrior = member.commitments
      .filter((c) => c.status !== 'Concluído')
      .map((c) => ({
        commitmentId: c.id,
        party: c.owner,
        description: c.description,
        dueDate: c.dueDate,
        previousStatus: c.status,
        outcome:
          c.status === 'Pendente'
            ? ('Em aberto (reapresentado)' as const)
            : ('Parcial' as const),
        evaluationNote:
          c.status === 'Pendente'
            ? 'Reapresentado automaticamente por permanecer pendente do ciclo anterior.'
            : 'Em execução dentro do prazo pactuado.',
      }));

    return {
      id: `ind-${member.id}-1`,
      meetingId: isMariana && m3 ? m3.id : `mtg-ind-${member.id}`,
      collaboratorId: member.id,
      collaboratorName: member.name,
      collaboratorRole: member.role,
      macroArea: member.macroArea,
      date: isMariana && m3 ? m3.date : member.lastAlignmentDate,
      conductorName: 'Gestor de TI',
      meetingType: idx === 4 ? 'Feedback de Desenvolvimento' : 'Alinhamento Mensal',
      strengths: strengthsText,
      developmentPoints: devText,
      previousCommitmentsEvaluation: pendingPrior,
      nextAlignmentGoals: member.goals.map(
        (g) => `${g.title} (Alvo: ${g.target} · Atual: ${g.progress}% · Prazo ${g.dueDate})`
      ),
      collaboratorCommitments,
      managerCommitments,
      negotiationsAndAgreements:
        isMariana && m3
          ? m3.decisions[0]?.decision ||
            'Alinhado equilíbrio entre demandas N2 e janelas protegidas de documentação.'
          : lastAlign?.summary || 'Pactuação bilateral de metas operacionais e apoio gerencial.',
      trackingNotes: `Conformidade POP atual: ${member.popComplianceRate}% · Carteira nominal: ${member.activeTickets} chamados · TMA: ${member.avgResponseHours}h.`,
      finalConsiderations:
        'Registro de alinhamento e desenvolvimento contínuo (não substitui processo disciplinar ou advertência formal).',
      nextAlignmentDate: member.nextAlignmentDate,
      acknowledgedInSession: !isMariana,
      acknowledgmentDate: !isMariana ? member.lastAlignmentDate : '',
      status: isMariana ? 'Rascunho' : 'Finalizado',
      lastSavedAt: isMariana ? null : member.lastAlignmentDate,
    };
  });
}
