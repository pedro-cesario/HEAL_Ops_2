import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  FolderKanban,
  Gauge,
  Mail,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Users,
} from 'lucide-react';
import { DEFAULT_ENDPOINT_CONFIG, INTEGRATION_STATUS_META, PERSISTENCE_LABELS } from '../design/tokens';
import { useOps } from '../context/OpsContext';
import type { RuntimeDataMode, StaleTimeBasis } from '../types/ops';

type SettingsSectionId =
  | 'geral'
  | 'usuarios'
  | 'integracoes'
  | 'glpi'
  | 'm365'
  | 'ia'
  | 'pop'
  | 'indicadores'
  | 'auditoria'
  | 'templates'
  | 'catalogo'
  | 'guia'
  | 'documentos'
  | 'aparencia';

const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'geral', label: 'Configurações gerais', icon: Sliders },
  { id: 'usuarios', label: 'Usuários e permissões', icon: Users },
  { id: 'integracoes', label: 'Integrações (Visão Geral)', icon: Database },
  { id: 'glpi', label: 'GLPI', icon: FolderKanban },
  { id: 'm365', label: 'Microsoft 365', icon: Mail },
  { id: 'ia', label: 'IA local', icon: Bot },
  { id: 'pop', label: 'Regras POP', icon: Shield },
  { id: 'indicadores', label: 'Indicadores', icon: Gauge },
  { id: 'auditoria', label: 'Auditoria e amostragem', icon: ClipboardCheck },
  { id: 'templates', label: 'Templates (TPL-01..04)', icon: FileText },
  { id: 'catalogo', label: 'Catálogo', icon: BookOpen },
  { id: 'guia', label: 'Guia operacional', icon: BookOpen },
  { id: 'documentos', label: 'Documentos e PDF', icon: FileText },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
];

const PERSISTENCE_MATRIX: { capability: string; classification: string; note: string }[] = [
  {
    capability: 'Tema claro/escuro, filtros e rascunhos locais (heal_ops_session_v1)',
    classification: PERSISTENCE_LABELS.sessao_local,
    note: 'Rascunhos e edições da sessão ficam salvos no localStorage com botão explícito para restaurar a base demonstrativa.',
  },
  {
    capability: 'Parâmetros editáveis (endpoints, URL GLPI, regra de horas sem atualização)',
    classification: PERSISTENCE_LABELS.sessao_local,
    note: 'Aplicados imediatamente nos KPIs, TicketDrawer, Relatórios e apresentações TPL-01/TPL-02.',
  },
  {
    capability: 'Reuniões (Daily TPL-01, Alinhamento TPL-02, TPL-03, TPL-04, decisões e acordos)',
    classification: PERSISTENCE_LABELS.sessao_local,
    note: 'Prioridades e acordos propagam entre módulos na sessão; gravação definitiva depende do FastAPI (:3312).',
  },
  {
    capability: 'Auditoria manual de amostra, pendências e checklist POP',
    classification: PERSISTENCE_LABELS.sessao_local,
    note: 'Vereditos Não Conforme geram pendência automaticamente na sessão até homologação do backend.',
  },
  {
    capability: 'Indicadores, carteira de equipe, relatórios (7d/30d/90d) e preview de amostragem',
    classification: PERSISTENCE_LABELS.demonstrativa,
    note: 'Dataset isolado e conciliado para validação visual sem alterar produção.',
  },
  {
    capability: 'Amostragem estratificada oficial, CSV/PDF oficial e ações do Agente IA',
    classification: PERSISTENCE_LABELS.dependente_backend,
    note: 'Bloqueadas para gravação real sem conexão autenticada com :3312 / R7 :3310.',
  },
  {
    capability: 'Microsoft 365 (Calendário Outlook e Caixa de Entrada)',
    classification: PERSISTENCE_LABELS.nao_implementada,
    note: 'Sem OAuth/Graph conectado; blocos visuais preparados para contrato futuro.',
  },
];

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    dataMode,
    setDataMode,
    endpointConfig,
    updateEndpointConfig,
    integrations,
    updateIntegrationEndpoint,
    pushToast,
    resetDemoSession,
    macroAreasConfig,
    updateMacroAreaConfig,
    addMacroAreaConfig,
    toggleMacroAreaActive,
    teamMembers,
  } = useOps();

  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroLead, setNewMacroLead] = useState(teamMembers[0]?.name || 'Gestor de TI');

  const [section, setSection] = useState<SettingsSectionId>('integracoes');
  const [glpiInput, setGlpiInput] = useState(endpointConfig.glpiTicketUrlTemplate);
  const [portalInput, setPortalInput] = useState(endpointConfig.portalFastApiUrl);
  const [r7Input, setR7Input] = useState(endpointConfig.r7RuntimeUrl);
  const [stagingInput, setStagingInput] = useState(endpointConfig.stagingUrl);
  const [aiInput, setAiInput] = useState(endpointConfig.localAiUrl);
  const [refreshSec, setRefreshSec] = useState(endpointConfig.autoRefreshSeconds);
  const [staleHoursInput, setStaleHoursInput] = useState(endpointConfig.staleTicketThresholdHours);
  const [staleBasisInput, setStaleBasisInput] = useState<StaleTimeBasis>(endpointConfig.staleTicketTimeBasis);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleConfirmResetDemo = () => {
    resetDemoSession();
    setGlpiInput(DEFAULT_ENDPOINT_CONFIG.glpiTicketUrlTemplate);
    setPortalInput(DEFAULT_ENDPOINT_CONFIG.portalFastApiUrl);
    setR7Input(DEFAULT_ENDPOINT_CONFIG.r7RuntimeUrl);
    setStagingInput(DEFAULT_ENDPOINT_CONFIG.stagingUrl);
    setAiInput(DEFAULT_ENDPOINT_CONFIG.localAiUrl);
    setRefreshSec(DEFAULT_ENDPOINT_CONFIG.autoRefreshSeconds);
    setStaleHoursInput(DEFAULT_ENDPOINT_CONFIG.staleTicketThresholdHours);
    setStaleBasisInput(DEFAULT_ENDPOINT_CONFIG.staleTicketTimeBasis);
    setConfirmResetOpen(false);
  };

  const handleSaveConfig = () => {
    const safeHours = Math.min(168, Math.max(1, Number(staleHoursInput) || 24));
    const safeRefresh = Math.min(600, Math.max(15, Number(refreshSec) || 60));
    setStaleHoursInput(safeHours);
    setRefreshSec(safeRefresh);

    updateEndpointConfig({
      glpiTicketUrlTemplate: glpiInput,
      portalFastApiUrl: portalInput,
      r7RuntimeUrl: r7Input,
      stagingUrl: stagingInput,
      localAiUrl: aiInput,
      autoRefreshSeconds: safeRefresh,
      staleTicketThresholdHours: safeHours,
      staleTicketTimeBasis: staleBasisInput,
    });
    updateIntegrationEndpoint('int-portal', portalInput);
    updateIntegrationEndpoint('int-r7', r7Input);
    updateIntegrationEndpoint('int-staging', stagingInput);
    updateIntegrationEndpoint('int-glpi', glpiInput);
    updateIntegrationEndpoint('int-ai', aiInput);
    pushToast({
      title: 'Configurações atualizadas na sessão',
      description: `Regra de atualização (${safeHours}h ${staleBasisInput}) aplicada. Serviços mantêm status pendente até conexão real.`,
      tone: 'success',
    });
  };

  const renderStaleRuleEditor = () => (
    <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-4 space-y-3">
      <div>
        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
          Parâmetro de Chamados Sem Atualização (Regra Editável)
        </h3>
        <p className="mt-0.5 text-slate-600 dark:text-slate-400">
          Padrão de homologação adotado: <strong>24 horas corridas</strong> (editável nesta sessão para conciliação futura com o POP oficial e o backend FastAPI).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Limite de horas sem atualização
          </label>
          <input
            type="number"
            min={1}
            max={168}
            value={staleHoursInput}
            onChange={(e) => setStaleHoursInput(Number(e.target.value))}
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 font-mono"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Base de contagem
          </label>
          <select
            value={staleBasisInput}
            onChange={(e) => setStaleBasisInput(e.target.value as StaleTimeBasis)}
            className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2"
          >
            <option value="corridas">Horas corridas (padrão oficial adotado)</option>
            <option value="uteis">Horas úteis (conciliação alternativa)</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
          {PERSISTENCE_LABELS.sessao_local} · Atualiza KPIs, TicketDrawer, Relatórios e TPL-01/TPL-02
        </span>
        <button
          type="button"
          onClick={handleSaveConfig}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] dark:hover:bg-[#0D9488] px-3.5 py-1.5 font-medium text-white dark:text-slate-950 whitespace-nowrap"
        >
          <Save size={14} />
          <span>Aplicar parâmetro</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
      {/* Left / Top Navigation */}
      <aside className="lg:col-span-3 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2 flex lg:flex-col gap-1 overflow-x-auto self-start">
        {SETTINGS_SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex lg:w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#18222F]'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="lg:truncate">{item.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Right Content Panel (9 cols) */}
      <section className="lg:col-span-9 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-5 space-y-4">
        {section === 'geral' && (
          <div className="space-y-4 text-xs">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Configurações Gerais e Atualização Automática
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Modo de execução dos dados (Homologação Frontend)
                </label>
                <select
                  value={dataMode}
                  onChange={(e) => setDataMode(e.target.value as RuntimeDataMode)}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2"
                >
                  <option value="demo">Modo Demonstração (Dados isolados)</option>
                  <option value="disconnected">Desconectado (Sem Backend)</option>
                  <option value="unavailable">Serviço Indisponível</option>
                  <option value="stale">Dados Desatualizados</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Intervalo de atualização automática (segundos)
                </label>
                <input
                  type="number"
                  min={15}
                  max={600}
                  value={refreshSec}
                  onChange={(e) => setRefreshSec(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 font-mono"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  Sugestão inicial: 60 segundos, sujeito à capacidade real do backend FastAPI (:3312).
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-3.5 py-2 font-medium text-white dark:text-slate-950 whitespace-nowrap"
              >
                <Save size={14} />
                <span>Salvar parâmetros gerais</span>
              </button>

              {!confirmResetOpen ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#243242] hover:border-red-400 px-3 py-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                >
                  <RotateCcw size={14} />
                  <span>Restaurar base demonstrativa</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-300 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/25 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-red-800 dark:text-red-300">
                    Limpar rascunhos locais e restaurar dados iniciais?
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmResetDemo}
                    className="rounded bg-red-700 hover:bg-red-800 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap"
                  >
                    Confirmar restauração
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(false)}
                    className="rounded border border-slate-300 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 text-[11px]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Classificação Transparente de Persistência e Estados
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#243242]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#18222F] text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="p-2.5">Capacidade / Módulo</th>
                      <th className="p-2.5">Classificação</th>
                      <th className="p-2.5">Comportamento atual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#243242]">
                    {PERSISTENCE_MATRIX.map((row) => (
                      <tr key={row.capability}>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{row.capability}</td>
                        <td className="p-2.5 font-mono text-[11px] text-[#0F5E59] dark:text-[#2DD4BF] whitespace-nowrap">
                          {row.classification}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {section === 'integracoes' && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Mapa de Integrações e Estados Auditados
              </h2>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Endereços identificados na auditoria pré-preenchidos como padrões editáveis. Nenhuma integração ausente é exibida como conectada.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-[#243242] rounded-lg border border-slate-200 dark:border-[#243242]">
              {integrations.map((intItem) => {
                const statusMeta = INTEGRATION_STATUS_META[intItem.status];
                return (
                  <div key={intItem.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {intItem.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-medium ${statusMeta.textClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-400">{intItem.description}</p>
                      {intItem.auditNote && (
                        <p className="mt-0.5 text-[11px] text-slate-500">{intItem.auditNote}</p>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#18222F] border border-slate-200 dark:border-[#243242] rounded px-2.5 py-1.5 shrink-0 max-w-full sm:max-w-xs truncate">
                      {intItem.endpoint}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-medium mb-1">FastAPI Principal (3312)</label>
                <input
                  type="text"
                  value={portalInput}
                  onChange={(e) => setPortalInput(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Runtime R7 (3310)</label>
                <input
                  type="text"
                  value={r7Input}
                  onChange={(e) => setR7Input(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Staging Gerencial (8788)</label>
                <input
                  type="text"
                  value={stagingInput}
                  onChange={(e) => setStagingInput(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-3.5 py-2 font-medium text-white dark:text-slate-950"
            >
              <Save size={14} />
              <span>Atualizar endereços padrão</span>
            </button>
          </div>
        )}

        {section === 'glpi' && (
          <div className="space-y-4 text-xs">
            <h2 className="font-display text-base font-semibold">Integração GLPI</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Os dados dos chamados são consumidos via backend autenticado. O link abaixo controla exclusivamente a abertura direta do chamado na interface web do GLPI (nunca usando URL da API REST).
            </p>
            <div>
              <label className="block font-medium mb-1">Padrão de URL do chamado no GLPI</label>
              <input
                type="text"
                value={glpiInput}
                onChange={(e) => setGlpiInput(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 font-mono"
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Padrão institucional auditado: http://192.168.4.20/front/ticket.form.php?id={'{id}'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-2 font-medium"
            >
              <Save size={14} />
              <span>Salvar padrão de URL GLPI</span>
            </button>
          </div>
        )}

        {section === 'm365' && (
          <div className="space-y-3 text-xs">
            <h2 className="font-display text-base font-semibold">Microsoft 365 (Agenda e E-mails)</h2>
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-4 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Estado atual: Não configurado ({PERSISTENCE_LABELS.nao_implementada})
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                A auditoria técnica confirmou que a integração com Microsoft Graph (Calendário e Outlook) ainda não está implementada. O frontend mantém os blocos Minha Agenda e E-mails e Pendências preparados com ações locais de sessão até receber os contratos OAuth/backend futuros.
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#243242]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#18222F] text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="p-2.5">Contrato Graph Esperado</th>
                    <th className="p-2.5">Escopo OAuth</th>
                    <th className="p-2.5">Uso no Portal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#243242]">
                  <tr>
                    <td className="p-2.5 font-mono">/me/calendarview</td>
                    <td className="p-2.5 font-mono text-slate-500">Calendars.Read</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">Sincronização de ritos TPL-01..04 em Minha Agenda</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono">/me/messages</td>
                    <td className="p-2.5 font-mono text-slate-500">Mail.Read</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">Leitura de alertas de fornecedores/diretoria (sem envio real)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'ia' && (
          <div className="space-y-4 text-xs">
            <h2 className="font-display text-base font-semibold">IA Local e Agente Gerencial</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Estado: <strong>Requer autorização</strong>. Ações sugeridas pela IA nunca alteram GLPI ou atas oficiais sem confirmação explícita do gestor.
            </p>
            <div>
              <label className="block font-medium mb-1">Endpoint do Agente (R7)</label>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-3 py-2 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3.5 py-2 font-medium"
            >
              <Save size={14} />
              <span>Atualizar endpoint IA</span>
            </button>
          </div>
        )}

        {section === 'aparencia' && (
          <div className="space-y-4 text-xs">
            <h2 className="font-display text-base font-semibold">Aparência Institucional</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Paleta institucional em verde-petróleo e ardósia neutra com alternância imediata entre tema claro e escuro.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`rounded-lg border p-3.5 text-left transition-colors ${
                  theme === 'light'
                    ? 'border-[#0F5E59] bg-[#0F5E59]/8'
                    : 'border-slate-200 dark:border-[#243242]'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>Tema Claro</span>
                  {theme === 'light' && <CheckCircle2 size={15} className="text-[#0F5E59]" />}
                </div>
                <span className="mt-1 block text-[11px] text-slate-500">Fundo #F8FAFC · Alto contraste diurno</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`rounded-lg border p-3.5 text-left transition-colors ${
                  theme === 'dark'
                    ? 'border-[#2DD4BF] bg-[#2DD4BF]/10'
                    : 'border-slate-200 dark:border-[#243242]'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>Tema Escuro</span>
                  {theme === 'dark' && <CheckCircle2 size={15} className="text-[#2DD4BF]" />}
                </div>
                <span className="mt-1 block text-[11px] text-slate-500">Fundo #0B1117 · Conforto em sala escura</span>
              </button>
            </div>
          </div>
        )}

        {['usuarios', 'pop', 'indicadores', 'auditoria', 'templates', 'catalogo', 'guia', 'documentos'].includes(section) && (
          <div className="space-y-3 text-xs">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {SETTINGS_SECTIONS.find((s) => s.id === section)?.label}
            </h2>
            <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-4 space-y-2 leading-relaxed text-slate-700 dark:text-slate-300">
              {section === 'usuarios' && (
                <>
                  <p>Perfis de acesso corporativos previstos para vinculação com o FastAPI (:3312) e Microsoft Entra ID na fase backend:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {[
                      ['Gestor Operacional', 'Edita prioridades TPL-02, pendências, parâmetros POP e autoriza ações do Agente IA.'],
                      ['Referência Técnica', 'Conduz Daily TPL-01, atualiza triagem da macroárea e compromissos de equipe.'],
                      ['Auditor POP', 'Executa o roteiro de auditoria em 9 etapas e gera não conformidades rastreáveis.'],
                      ['Visualização Executiva', 'Consulta indicadores deduplicados, relatórios 7d/30d/90d e atas oficiais.'],
                    ].map(([role, desc]) => (
                      <div key={role} className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{role}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{desc}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {section === 'pop' && (
                <>
                  <p>As regras de conformidade POP avaliam atribuição nominal e frequência de atualização no GLPI. Exceções verticais autorizadas (ex.: fila de Infraestrutura programada) permanecem sinalizadas explicitamente.</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li>Chamado assistencial/PEP sem técnico nominal fora de exceção entra automaticamente como alerta POP.</li>
                    <li>Parâmetro abaixo recalcula imediatamente a fila sem atualização nos KPIs, TicketDrawer, Relatórios e Daily.</li>
                  </ul>
                </>
              )}
              {section === 'indicadores' && (
                <p>Todos os 16 indicadores do módulo Relatórios possuem origem e regra explícita contra dupla contagem entre chamados solucionados e fechados, com suporte a recorte dinâmico (7d / 30d / 90d) e parâmetro editável de atualização abaixo.</p>
              )}
              {section === 'auditoria' && (
                <>
                  <p>Fluxo completo de Auditoria em 9 etapas ativo na sessão local (Critérios, Tamanho, Geração, Inspeção, Checklist POP, Classificação, Comparação com IA, Resultados Consolidados e Ações Corretivas).</p>
                  <p className="text-[11px] text-slate-500">Vereditos marcados como Não Conforme propagam automaticamente uma nova pendência gerencial para tratativa.</p>
                </>
              )}
              {section === 'templates' && (
                <div className="space-y-4">
                  <p>Catálogo de ritos e templates institucionais homologados no frontend:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      ['TPL-01 · Daily Operacional', 'Apresentação interativa em 4 etapas (Evolução, Macroáreas, Fila Crítica, Desafio & Ata) com herança direta do TPL-02.'],
                      ['TPL-02 · Alinhamento Semanal', 'Apresentação interativa em 7 etapas com definição de prioridades, macroáreas, GMUD e acordos.'],
                      ['TPL-03 · Individual e Feedback', 'Workspace bilateral (Colaborador/Gestor), histórico e prévia A4 integrado a Equipe.'],
                      ['TPL-04 · Projetos e GMUD', 'Fluxo completo de estados (GMUD-042), checklists por fase e trilha simulada (numeração sujeita à conciliação oficial).'],
                    ].map(([code, desc]) => (
                      <div key={code} className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2.5">
                        <div className="font-mono font-semibold text-[#0F5E59] dark:text-[#2DD4BF]">{code}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-3.5 space-y-2.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Macroáreas Configuráveis da Daily (TPL-01)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {macroAreasConfig.map((mc) => (
                        <div
                          key={mc.id}
                          className="flex flex-wrap items-center gap-2 rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] p-2"
                        >
                          <input
                            type="text"
                            value={mc.name}
                            onChange={(e) => updateMacroAreaConfig(mc.id, { name: e.target.value })}
                            className="flex-1 min-w-[130px] rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 text-xs font-medium"
                          />
                          <select
                            value={mc.defaultLeadName}
                            onChange={(e) =>
                              updateMacroAreaConfig(mc.id, { defaultLeadName: e.target.value })
                            }
                            className="rounded border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] px-2 py-1 text-xs"
                          >
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => toggleMacroAreaActive(mc.id)}
                            className={`rounded px-2 py-1 text-[11px] font-medium ${
                              mc.active
                                ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:text-[#2DD4BF]'
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
                        addMacroAreaConfig(newMacroName, newMacroLead);
                        setNewMacroName('');
                      }}
                      className="flex flex-wrap items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        value={newMacroName}
                        onChange={(e) => setNewMacroName(e.target.value)}
                        placeholder="Nova macroárea para a Daily..."
                        className="flex-1 min-w-[180px] rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                      />
                      <select
                        value={newMacroLead}
                        onChange={(e) => setNewMacroLead(e.target.value)}
                        className="rounded border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-1.5"
                      >
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded bg-[#0F5E59] text-white dark:bg-[#14B8A6] dark:text-slate-950 px-3 py-1.5 font-medium"
                      >
                        + Adicionar macroárea
                      </button>
                    </form>
                  </div>
                </div>
              )}
              {section === 'catalogo' && (
                <p>O catálogo oficial de serviços GLPI, macroáreas (Assistencial, Sistemas Clínicos, Infraestrutura, Governança & Corporativo) e exceções POP será sincronizado com o repositório da Matrix na etapa de backend.</p>
              )}
              {section === 'guia' && (
                <p>Princípio HEAL Ops 2.0: Sintético primeiro, analítico sob demanda. Priorize os alertas em desconformidade POP na Visão Geral, conduza a Daily (TPL-01) e o Alinhamento Semanal (TPL-02) direto na apresentação interativa sem excesso de rolagem em 1366×768.</p>
              )}
              {section === 'documentos' && (
                <p>A geração oficial de PDF server-side para arquivamento aguarda implementação no FastAPI (:3312); todos os templates TPL-01 a TPL-04 possuem visualização documental institucional estruturada e pronta para impressão em A4.</p>
              )}
            </div>

            {(section === 'pop' || section === 'indicadores') && renderStaleRuleEditor()}
          </div>
        )}
      </section>
    </div>
  );
};

