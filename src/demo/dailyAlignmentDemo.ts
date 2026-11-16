import type {
  MacroAreaConfigItem,
  TeamMember,
  WeeklyBaselineSnapshot,
  WeeklyPriority,
} from '../types/ops';
import type {
  DailyAlignmentDraft,
  DailyOperationalChallenge,
} from '../types/dailyAlignment';

export const DEFAULT_WEEKLY_BASELINE_SNAPSHOT: WeeklyBaselineSnapshot = {
  alignmentDate: '11/11/2026',
  weekLabel: 'Semana 46 · 16/11 a 22/11/2026',
  initialActiveCount: 18,
  openedSinceAlignment: 4,
  closedSinceAlignment: 6,
  weeklyGoalReductionPercent: 25,
  weeklyGoalTargetCount: 4,
  weeklyGoalOwnerName: 'Gestor de TI',
  weeklyGoalDueDate: '22/11/2026',
  weeklyGoalNote:
    'Reduzir backlog sem atualização (>24h corridas) e regularizar chamados assistenciais POP sem técnico.',
};

export const DEFAULT_MACRO_AREA_CONFIGS: MacroAreaConfigItem[] = [
  {
    id: 'macro-suporte',
    name: 'Suporte Técnico',
    defaultLeadName: 'Carlos Henrique',
    active: true,
  },
  {
    id: 'macro-sistemas',
    name: 'Sistemas',
    defaultLeadName: 'Mariana Costa',
    active: true,
  },
  {
    id: 'macro-infra',
    name: 'Infraestrutura',
    defaultLeadName: 'Rafael Oliveira',
    active: true,
  },
  {
    id: 'macro-seguranca',
    name: 'Segurança da Informação',
    defaultLeadName: 'Beatriz Santos',
    active: true,
  },
];

export const INITIAL_DAILY_CHALLENGES_HISTORY: DailyOperationalChallenge[] = [
  {
    id: 'dch-prev-1',
    createdAtDate: '14/11/2026',
    problem: 'Fila DICOM/PACS (#48212) sem retorno técnico atualizado há mais de 48h úteis.',
    objective: 'Validar captura de pacotes com Engenharia Clínica e estabilizar envio de exames.',
    ownerName: 'Mariana Costa',
    dueDate: '17/11/2026',
    stage: 'Análise',
    expectedResult: 'Diagnóstico definitivo registrado no #48212 e normalização do fluxo Raio-X.',
    currentStatus: 'Em andamento',
  },
  {
    id: 'dch-prev-2',
    createdAtDate: '15/11/2026',
    problem: 'Script de rollback da GMUD-042 ainda pendente de anexo formal para janela noturna.',
    objective: 'Publicar script testado offline e concluir checklist de pré-execução antes das 18h.',
    ownerName: 'Rafael Oliveira',
    dueDate: '16/11/2026',
    stage: 'Homologação',
    expectedResult: 'Rollback validado em staging (:8788) com ciência da equipe executora.',
    currentStatus: 'Em aberto',
  },
];

export function createDemoDailyAlignmentDraft(
  meetingId: string,
  title: string,
  date: string,
  teamMembers: TeamMember[],
  macroConfigs: MacroAreaConfigItem[] = DEFAULT_MACRO_AREA_CONFIGS,
  weeklyPriorities: WeeklyPriority[] = []
): DailyAlignmentDraft {
  const safeDate = date || '16/11/2026';
  const pickPriId = (ticketId: number, fallbackIdx: number) =>
    weeklyPriorities.find((p) => p.ticketId === ticketId)?.id ||
    weeklyPriorities[fallbackIdx]?.id ||
    '';

  const macroDefaultsByName: Record<
    string,
    { situation: 'Normal' | 'Atenção' | 'Crítica'; summary: string; blocker: string; nextAction: string; priTicket: number }
  > = {
    'Suporte Técnico': {
      situation: 'Crítica',
      summary: 'Chamado #48291 da Farmácia Central abriu sem técnico nominal em desconformidade POP.',
      blocker: 'Falta reserva imediata de cabeça térmica Zebra no posto.',
      nextAction: 'Alocar técnico N1 presencialmente antes das 14h e validar estoque com Suprimentos.',
      priTicket: 48291,
    },
    Sistemas: {
      situation: 'Atenção',
      summary: 'PEP estável após ajuste de dispensação; fila DICOM (#48212) segue lenta com fornecedor.',
      blocker: 'Dependência do dump de rede para engenharia clínica do fabricante PACS.',
      nextAction: 'Conduzir reunião técnica às 15h e atualizar registro no GLPI.',
      priTicket: 48212,
    },
    Infraestrutura: {
      situation: 'Atenção',
      summary: 'Switch do Bloco Administrativo pronto em staging (:8788); ramais IP (#48198) sem atualização >90h.',
      blocker: 'Retorno pendente da operadora SIP sobre tronco 02.',
      nextAction: 'Anexar rollback da GMUD-042 até 18h e cobrar protocolo da operadora às 16h.',
      priTicket: 48240,
    },
    'Segurança da Informação': {
      situation: 'Normal',
      summary: 'Cadeia de certificados TLS (#48144) e revisão de perfil de auditoria (#48159) sob controle.',
      blocker: 'Aguardando emissão final da autoridade certificadora.',
      nextAction: 'Aplicar certificado em homologação (:8788) assim que cadeia for emitida.',
      priTicket: 48144,
    },
  };

  return {
    meetingId,
    title: title || 'Daily Operacional de TI — Turno Manhã',
    date: safeDate,
    shiftLabel: 'Turno Diurno · 08:30',
    status: meetingId === 'mtg-1' ? 'Finalizado' : 'Rascunho',
    participants: teamMembers.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      macroArea: m.macroArea,
      present: m.id !== 'tm-6',
    })),
    shiftHandoverNote:
      'Passagem do plantão noturno sem quedas de link. Farmácia Central (#48291) e Ala Norte PEP (#48274) requerem atribuição POP imediata.',
    macroReports: macroConfigs
      .filter((mc) => mc.active)
      .map((mc, idx) => {
        const preset = macroDefaultsByName[mc.name];
        return {
          id: `mr-${mc.id}`,
          macroArea: mc.name,
          leadName: mc.defaultLeadName,
          situation: preset?.situation ?? 'Normal',
          summary:
            preset?.summary ??
            'Operação regular na frente com acompanhamento das prioridades da semana.',
          weeklyPriorityId: preset
            ? pickPriId(preset.priTicket, idx)
            : weeklyPriorities[idx % Math.max(1, weeklyPriorities.length)]?.id || '',
          blocker: preset?.blocker ?? '',
          nextAction:
            preset?.nextAction ??
            'Atualizar chamados da frente antes das 16h.',
        };
      }),
    criticalQueueStates: {
      'ticket-48291': {
        itemKey: 'ticket-48291',
        ticketId: 48291,
        ownerName: 'Carlos Henrique',
        nextAction: 'Substituir cabeça térmica e testar spooler local antes das 14h',
        dueDate: 'Hoje · 14:00',
        blockerNote: 'Reserva de impressora térmica em validação com Suprimentos',
        treatedInDaily: true,
        lastTreatedDate: safeDate,
      },
      'ticket-48274': {
        itemKey: 'ticket-48274',
        ticketId: 48274,
        ownerName: 'Mariana Costa',
        nextAction: 'Assumir chamado PEP Ala Norte (POP) e validar cache AD',
        dueDate: 'Hoje · 13:30',
        blockerNote: '',
        treatedInDaily: false,
      },
      'ticket-48198': {
        itemKey: 'ticket-48198',
        ticketId: 48198,
        ownerName: 'Thiago Mendes',
        nextAction: 'Cobrar protocolo SIP da operadora e registrar histórico no GLPI',
        dueDate: 'Hoje · 16:00',
        blockerNote: 'Dependência de retorno da operadora de telefonia (tronco 02)',
        treatedInDaily: false,
      },
    },
    currentChallenge: {
      id: `dch-${meetingId}`,
      createdAtDate: safeDate,
      problem:
        '2 chamados assistenciais (#48291, #48274) ultrapassaram 2h sem técnico nominal e 5 tickets seguem >24h sem atualização.',
      objective:
        'Zerar desconformidades POP da fila assistencial e atualizar 100% dos tickets >24h até as 16h.',
      ownerName: 'Carlos Henrique',
      dueDate: 'Hoje · 16:00',
      stage: 'Produção',
      expectedResult:
        '0 chamados em desconformidade POP + redução de pelo menos 2 itens sem atualização no painel.',
      currentStatus: 'Em andamento',
    },
    minutesExecutiveNote:
      'Ata de acompanhamento diário consolidada com foco em regularização POP assistencial, cobrança de impedimentos externos (PACS/SIP) e preparação segura da GMUD-042.',
    decisions:
      meetingId === 'mtg-1'
        ? [
            {
              id: 'dd-1',
              stage: 3,
              decision:
                'Priorizar atendimento presencial na Farmácia Central (#48291) antes das 14h',
              ownerName: 'Carlos Henrique',
              dueDate: 'Hoje · 14:00',
              createdAt: '08:38',
            },
            {
              id: 'dd-2',
              stage: 4,
              decision: 'Validar rollback completo da GMUD-042 antes da janela das 19h',
              ownerName: 'Rafael Oliveira',
              dueDate: 'Hoje · 18:00',
              createdAt: '08:42',
            },
          ]
        : [],
    commitments:
      meetingId === 'mtg-1'
        ? [
            {
              id: 'dc-1',
              ownerName: 'Thiago Mendes',
              action: 'Atualizar log dos ramais IP (#48198) até 16h com resposta da operadora',
              dueDate: 'Hoje · 16:00',
              status: 'Pendente',
            },
          ]
        : [],
    hasUnsavedChanges: false,
    lastSavedAt: meetingId === 'mtg-1' ? '08:50' : null,
    finalizedAt: meetingId === 'mtg-1' ? '08:50' : null,
  };
}
