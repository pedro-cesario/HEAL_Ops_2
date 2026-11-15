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
  Save,
  Shield,
  Sliders,
  Users,
} from 'lucide-react';
import { useOps } from '../context/OpsContext';
import { INTEGRATION_STATUS_META } from '../design/tokens';
import type { RuntimeDataMode } from '../types/ops';

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
  } = useOps();

  const [section, setSection] = useState<SettingsSectionId>('integracoes');
  const [glpiInput, setGlpiInput] = useState(endpointConfig.glpiTicketUrlTemplate);
  const [portalInput, setPortalInput] = useState(endpointConfig.portalFastApiUrl);
  const [r7Input, setR7Input] = useState(endpointConfig.r7RuntimeUrl);
  const [stagingInput, setStagingInput] = useState(endpointConfig.stagingUrl);
  const [aiInput, setAiInput] = useState(endpointConfig.localAiUrl);
  const [refreshSec, setRefreshSec] = useState(endpointConfig.autoRefreshSeconds);

  const handleSaveConfig = () => {
    updateEndpointConfig({
      glpiTicketUrlTemplate: glpiInput,
      portalFastApiUrl: portalInput,
      r7RuntimeUrl: r7Input,
      stagingUrl: stagingInput,
      localAiUrl: aiInput,
      autoRefreshSeconds: refreshSec,
    });
    updateIntegrationEndpoint('int-portal', portalInput);
    updateIntegrationEndpoint('int-r7', r7Input);
    updateIntegrationEndpoint('int-staging', stagingInput);
    updateIntegrationEndpoint('int-glpi', glpiInput);
    updateIntegrationEndpoint('int-ai', aiInput);
    pushToast({
      title: 'Configurações atualizadas na sessão',
      description: 'As integrações mantêm o status de pendente/não configurado até a homologação real com os serviços.',
      tone: 'success',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
      {/* Left Navigation (3 cols) */}
      <aside className="lg:col-span-3 rounded-lg border border-slate-200 dark:border-[#243242] bg-white dark:bg-[#111923] p-2 space-y-0.5 self-start">
        {SETTINGS_SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#0F5E59]/10 text-[#0F5E59] dark:bg-[#2DD4BF]/12 dark:text-[#2DD4BF]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#18222F]'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{item.label}</span>
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
            <button
              type="button"
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F5E59] hover:bg-[#0B4A46] dark:bg-[#14B8A6] px-3.5 py-2 font-medium text-white dark:text-slate-950"
            >
              <Save size={14} />
              <span>Salvar parâmetros gerais</span>
            </button>
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
                      <div className="flex items-center gap-2">
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
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#18222F] border border-slate-200 dark:border-[#243242] rounded px-2.5 py-1.5 shrink-0 max-w-xs truncate">
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
                Estado atual: Não configurado
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                A auditoria técnica confirmou que a integração com Microsoft Graph (Calendário e Outlook) ainda não está implementada. O frontend mantém os blocos Minha Agenda e E-mails e Pendências preparados para receber os contratos OAuth/backend futuros.
              </p>
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
            <div className="grid grid-cols-2 gap-3 max-w-md">
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
                <p>Perfis de acesso (Gestor Operacional, Referência Técnica, Auditor, Visualização) serão vinculados à autenticação corporativa na etapa de homologação com o FastAPI (:3312).</p>
              )}
              {section === 'pop' && (
                <p>As regras de conformidade POP (incluindo exceções de fluxos verticais para chamados sem técnico nominal) são avaliadas exclusivamente pelo backend para não duplicar nem inventar regras fictícias no navegador.</p>
              )}
              {section === 'indicadores' && (
                <p>Todos os 16 indicadores do módulo Relatórios possuem origem e regra explícita contra dupla contagem entre chamados solucionados e fechados.</p>
              )}
              {section === 'auditoria' && (
                <p>A seleção aleatória oficial por amostragem estratificada (Técnico, Macroárea, Categoria, Status, Grupo, Período) aguarda implementação do serviço dedicado no backend.</p>
              )}
              {section === 'templates' && (
                <p>Templates ativos: TPL-01 (Daily Operacional), TPL-02 (Alinhamento Semanal em 8 etapas), TPL-03 (Alinhamentos Individuais e Feedback recíprocos) e TPL-04 (Projetos e GMUD, com numeração sujeita à conciliação oficial).</p>
              )}
              {section === 'catalogo' && (
                <p>O catálogo oficial de templates, critérios POP e macroáreas será sincronizado com o repositório documental da Matrix na homologação.</p>
              )}
              {section === 'guia' && (
                <p>Princípio HEAL Ops 2.0: Sintético primeiro, analítico sob demanda. Priorize os alertas em desconformidade POP na Visão Geral e utilize o Modo Apresentação para condução dos ritos sem excesso de rolagem em 1366×768.</p>
              )}
              {section === 'documentos' && (
                <p>A geração oficial de PDF para arquivamento encontra-se pendente de serviço server-side; o portal disponibiliza visualização documental institucional estruturada e compatível com impressão.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
