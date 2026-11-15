# HEAL Ops 2.0 — Homologação Visual, Funcional e Técnica do Frontend

**Projeto:** HEAL Ops 2.0 — Portal de Gestão Operacional  
**Instituição:** Instituto HEAL — Hospital Espírita André Luiz  
**Escopo:** Auditoria, correção e homologação do frontend React + TypeScript + Vite + Tailwind CSS  
**Status Global:** `Parcialmente homologado` (Frontend validado via build, `tsc --noEmit` e auditoria estrutural de código; testes interativos em navegador real e integrações backend/M365/PDF/amostragem oficial aguardam execução e homologação em ambiente conectado)

---

## 1. Arquivos Modificados

Durante esta etapa de homologação e correção do frontend, os seguintes arquivos foram auditados e atualizados no repositório:

- `src/types/ops.ts` — Adicionados tipos `StaleTimeBasis`, `PersistenceClassification`, propriedades `staleTicketThresholdHours` e `staleTicketTimeBasis` em `EndpointConfig`, além de categoria `bloqueada_demo` em `AgentMessageCategory`.
- `src/design/tokens.ts` — Configurado padrão editável de chamados sem atualização (`staleTicketThresholdHours: 24`, `staleTicketTimeBasis: 'corridas'`) e adicionadas classificações explícitas `PERSISTENCE_LABELS`.
- `src/index.css` — Aprimoradas regras `@media print` com configuração A4 (`@page`), liberação de altura/scroll do container principal na impressão, `break-inside: avoid` (`.print-avoid-break`) e preservação de cabeçalhos de tabelas.
- `src/demo/demoData.ts` — Conciliados rigorosamente os contadores dos KPIs com a lista de chamados demonstrativos (`16` abertos = `3` novos + `6` em atendimento + `2` em andamento + `5` pendentes; `5` sem técnico = `2` desconformes POP + `3` exceções verticais; `5` sem atualização acima de `24h corridas`) e unificada a nomenclatura para `24h corridas` em relatórios, reuniões e metas.
- `src/services/opsAdapters.ts` — Atualizado `PortalAdapter.fetchOverview` para calcular dinamicamente os chamados sem atualização e o KPI `sem_atualizacao` a partir de `endpointConfig.staleTicketThresholdHours` e `endpointConfig.staleTicketTimeBasis`.
- `src/components/common/TicketDrawer.tsx` — Removida expressão fixa `> 48h úteis`; adicionado rótulo dinâmico conforme parâmetro de Configurações, exibição individual de `hoursWithoutUpdate` e atalho direto para ajustar o parâmetro.
- `src/components/layout/AppShell.tsx` — Corrigido recorte de impressão com `print:h-auto print:overflow-visible` e incluídos seletor de modo de execução (`demo`/`disconnected`/`unavailable`/`stale`) e botão de atualização dentro da gaveta móvel (`390×844`).
- `src/pages/OverviewPage.tsx` — Clarificada a dependência real de Microsoft 365 + backend no botão de conversão de e-mail em pendência gerencial.
- `src/pages/TeamPage.tsx` — Explicitada a separação Colaborador vs Gestão e origem demonstrativa na aba de compromissos do colaborador.
- `src/pages/PendingAuditPage.tsx` — Adicionada declaração explícita de persistência apenas na sessão local no rodapé da gaveta de auditoria manual.
- `src/pages/ReportsPage.tsx` — Corrigido contraste do `Tooltip` do Recharts e séries para tema claro e escuro, sincronizada a regra `sem_atualizacao` com `endpointConfig`, adicionado `overflow-x-auto` na tabela de detalhamento e explicitada dependência do backend para exportação real.
- `src/pages/AgentPage.tsx` — Atualizada categoria de aprovações bloqueadas para `bloqueada_demo` (`Bloqueado (Sem backend conectado)`), diferenciando claramente `Sugestão (Demonstrativa)`, `Análise (Demonstrativa)` e `Executado no backend`, além do ajuste do prompt rápido para `24h corridas`.
- `src/templates/MeetingTemplates.tsx` — Integrados KPIs e chamados dinâmicos (regra `24h corridas` em `TPL-01` e `TPL-02`), adicionados navegação por teclado (`←`/`→`/`Esc`), **Modo Livre** no Modo Apresentação, registro ao vivo de **Compromisso** além de **Decisão**, botão explícito **Sair**, remoção de botão `<X>` duplicado no modal de inspeção e proteções de quebra de página em **Documento Oficial**.
- `src/pages/MeetingsPage.tsx` — Implementado `handleAddCommitment`, conectados avisos explícitos de operação apenas em sessão local e garantido `whitespace-nowrap` nas ações dos cards.
- `src/pages/SettingsPage.tsx` — Adicionados controles editáveis da regra de chamados sem atualização (`staleTicketThresholdHours` e `staleTicketTimeBasis`) nas seções **Regras POP** e **Indicadores**, incluída tabela **Classificação Transparente de Persistência e Estados** em **Configurações gerais** e convertida a navegação lateral em barra horizontal rolável em resoluções mobile/tablet.
- `HEAL_OPS_2_HOMOLOGACAO_FRONTEND.md` — Documento final de homologação criado na raiz do workspace.

---

## 2. Problemas Encontrados na Auditoria

1. **Divergência entre KPIs e lista do `TicketDrawer`:** `DEMO_KPIS` exibia totais consolidados (`42` abertos, `7` novos, `19` em atendimento, `6` em andamento, `8` pendentes, `10` sem atualização) enquanto `DEMO_TICKETS` possuía apenas 9 registros, gerando discrepância numérica imediata ao abrir qualquer card.
2. **Regra fixa `> 48h úteis` divergente da regra oficial parametrizável:** `TicketDrawer`, `demoData.ts`, `MeetingTemplates.tsx` e `ReportsPage.tsx` mencionavam `> 48h úteis` de forma estática, sem refletir a regra operacional padrão adotada (`24 horas corridas` editáveis em Configurações).
3. **Ausência de controles para editar a regra de atualização em Configurações:** As seções `Regras POP` e `Indicadores` de `SettingsPage.tsx` exibiam apenas texto estático, sem campos para alterar horas ou base (`corridas` / `uteis`).
4. **Recorte de impressão multi-página no `AppShell`:** O container principal usava `h-screen overflow-hidden`, o que trunca documentos longos (como atas no `Documento Oficial`) durante impressão em PDF/papel pelo navegador.
5. **Controles de execução inacessíveis em viewport mobile (`390×844`):** O seletor de modo de execução (`demo`/`disconnected`/`unavailable`/`stale`) e o botão de atualização ficavam ocultos em `hidden sm:flex` sem alternativa dentro do menu móvel.
6. **Contraste de gráfico e overflow horizontal em Relatórios:** O `Tooltip` do Recharts em `ReportsPage.tsx` não aplicava estilos dedicados ao tema escuro e a tabela de detalhamento não possuía wrapper `overflow-x-auto`.
7. **Lacunas no `MeetingTemplates.tsx`:**
   - `TPL-02` Etapa 3 citava `42 chamados ativos` e `> 48h` fixos.
   - O `Modo Apresentação` não possuía atalhos de teclado (`←`/`→`/`Esc`), nem **Modo Livre** para visão panorâmica e salto direto de etapas, nem botão de saída rápida, nem registro ao vivo de **Compromissos**.
   - O modal de inspeção de chamado exibia um ícone `<X>` duplicado dentro do corpo além do botão padrão do `Modal`.
   - O `Documento Oficial` não tinha classes `print-avoid-break` em seções e assinaturas.
8. **Navegação de Configurações pouco ergonomica em telas estreitas:** A barra lateral empilhava 14 botões verticais acima do formulário em `< 1024px`.
9. **Categorização imprecisa no Agente IA e falta de matriz de persistência:** Aprovação em modo demo marcava categoria como `indisponivel` em vez de estado explícito de bloqueio sem backend, e faltava uma matriz consolidada diferenciando sessão local, demonstrativo, dependente de backend e não implementado.

---

## 3. Correções Aplicadas

- Reconciliados `DEMO_KPIS` e `DEMO_TICKETS` para 16 registros coerentes com a soma exata de status (`3 + 6 + 2 + 5 = 16`), 5 sem técnico (`2` desconformes POP + `3` exceções verticais válidas) e cálculo dinâmico de `sem_atualizacao`.
- Implementado parâmetro editável `staleTicketThresholdHours` (`24` padrão) e `staleTicketTimeBasis` (`corridas` padrão) em `tokens.ts`, `OpsContext`, `SettingsPage.tsx` (`Regras POP` e `Indicadores`), propagado em tempo real para `PortalAdapter.fetchOverview`, `OverviewPage`, `TicketDrawer`, `ReportsPage` e `MeetingTemplates` (`TPL-01`/`TPL-02`).
- Adicionados `print:h-auto print:overflow-visible` no `AppShell`, `@page A4` e `.print-avoid-break` em `index.css` e no `Documento Oficial`.
- Inserido seletor de modo de execução e botão de atualização na gaveta mobile do `AppShell` (`390×844`) e navegação horizontal rolável em `SettingsPage` para `< 1024px`.
- Adicionado estilo dinâmico claro/escuro ao `Tooltip` do Recharts e `overflow-x-auto` à tabela analítica em `ReportsPage`.
- Evoluído o `Modo Apresentação` com **Modo Livre**, navegação por teclado (`ArrowLeft`/`ArrowRight`/`Escape`), botões `+ Registrar decisão ao vivo`, `+ Compromisso` e `Sair`, além da remoção do `<X>` duplicado no modal de inspeção.
- Introduzida a categoria `bloqueada_demo` em `AgentPage.tsx`, alertas explícitos de sessão local em `PendingAuditPage`, `MeetingsPage` e `MeetingTemplates`, e a **Classificação Transparente de Persistência e Estados** em `SettingsPage`.

---

## 4. Telas Revisadas e Status por Módulo

| Área / Módulo | Classificação | Observações |
| --- | --- | --- |
| **Shell Global, Tema & Navegação** (`AppShell`, `OpsContext`) | `Parcialmente homologado` | Layout 1366×768, barra superior, notificações, gaveta mobile e CSS de impressão corrigidos em código; validação em navegador real pendente. |
| **1. Visão Geral** (`OverviewPage`) | `Parcialmente homologado` | 8 cards de KPIs conciliados com `TicketDrawer`, 3 blocos operacionais (Prioridades, Agenda, E-mails), dependência M365 explícita. |
| **TicketDrawer Compartilhado** (`TicketDrawer`) | `Parcialmente homologado` | Totalmente conciliado com KPIs e regra editável de `24h corridas`; link GLPI com abertura direta em nova aba sem API REST. |
| **2. Equipe** (`TeamPage`) | `Parcialmente homologado` | Lista filtrável + drawer de 8 abas com separação Colaborador vs Gestão e base demonstrativa explícita. |
| **3. Pendências & Auditoria** (`PendingAuditPage`) | `Parcialmente homologado` | Abas de Pendências, Amostragem Estratificada (preview) e Auditoria Manual com aviso de sessão local; geração oficial e sugestões IA marcadas como pendentes/bloqueadas. |
| **4. Relatórios** (`ReportsPage`) | `Parcialmente homologado` | 16 indicadores deduplicados, regra explícita de não dupla contagem, Recharts adaptado para claro/escuro e `overflow-x-auto`. |
| **5. Agente Gerencial** (`AgentPage`) | `Parcialmente homologado` | Prompts rápidos, evidências/fontes e fluxo de aprovação humana; execução real bloqueada sem R7 (`:3310`). |
| **6. Reuniões & Documentos** (`MeetingsPage`) | `Parcialmente homologado` | Rascunhos, decisões e compromissos funcionais na sessão local; persistência real e PDF oficial pendentes de backend. |
| **7. Configurações** (`SettingsPage`) | `Parcialmente homologado` | Endpoints editáveis (`:3312`, `:3310`, `:8788`, GLPI), parâmetro editável `24h corridas`, tema claro/escuro e matriz de persistência. |

---

## 5. Templates Revisados (`TPL-01` a `TPL-04`)

| Template | Modos Auditados | Classificação | Observações |
| --- | --- | --- | --- |
| **TPL-01 — Daily Operacional** | Visão Executiva, Modo Apresentação (4 slides), Documento Oficial | `Parcialmente homologado` | Herda prioridades semanais únicas e exibe chamados sem atualização conforme parâmetro `24h corridas` editável. |
| **TPL-02 — Alinhamento Semanal** | Visão Executiva, Modo Apresentação (8 etapas + Modo Livre), Documento Oficial | `Parcialmente homologado` | Corrigida Etapa 3 para refletir totais reais da sessão (`16` ativos, `2` POP) e regra dinâmica. |
| **TPL-03 — Alinhamento Individual & Feedback** | Visão Executiva, Modo Apresentação (4 slides), Documento Oficial | `Parcialmente homologado` | Mantém distinção entre compromissos de Colaborador e Gestor e assinaturas manuais para arquivamento. |
| **TPL-04 — Projetos e GMUD** | Visão Executiva, Modo Apresentação (3 slides), Documento Oficial | `Parcialmente homologado` | Exibe aviso explícito de que a numeração `TPL-04` deve ser conciliada com o catálogo oficial antes da produção. |

---

## 6. Testes Executados

1. **`npx vite build` (`compile_applet`):** Compilação de produção do bundle Vite/React após todas as edições da rodada de homologação.
2. **`npm run lint` (`tsc --noEmit` via `lint_applet`):** Verificação estrita de tipos TypeScript em todo o diretório `src/`.
3. **Varredura estática de código (`grep`):** Busca por ocorrências residuais de `48h`, `window.alert` e `window.open` em `src/`.
4. **Inspeção estrutural de código e CSS responsivo/impressão:** Revisão manual completa de todos os arquivos de layout, páginas, serviços, dados e templates para classes responsivas (`1366×768`, `1024×768`, `768×1024`, `390×844`), tema claro/escuro e `@media print`.

---

## 7. Testes que Passaram

- `compile_applet` (`vite build`): **Passou** sem erros ou falhas de empacotamento após as últimas alterações.
- `lint_applet` (`tsc --noEmit`): **Passou** com código de saída `0` e zero erros de tipagem.
- Varredura `window.alert` / `window.open`: **Passou** (`0` ocorrências; links GLPI usam `<a>` nativo com `rel="noopener noreferrer"`).
- Conciliação `48h` vs `24h corridas`: **Passou** (remanescentes em `demoData.ts` referem-se exclusivamente a faixas de histograma de aging `24h a 48h` / `48h a 72h`, não à regra gerencial).

---

## 8. Testes NÃO Executados (Limitações do Ambiente)

- **Testes visuais e interativos em navegador real / headless (Playwright / Chromium):** `Não executados` — Verificado via ambiente que não há binários de Chromium, Chrome, Firefox ou cache Playwright instalados no sandbox de execução. Portanto, capturas de tela reais, cálculo de bounding boxes em `1366×768`, `1920×1080`, `1440×900`, `1024×768`, `768×1024` e `390×844`, navegação por Tab em runtime e geração real de saída de impressão do navegador **não foram executadas em browser**.
- **Testes de contrato HTTP com backends reais:** `Não executados` — FastAPI (`:3312`), R7 (`:3310`), Staging (`:8788`), GLPI e Microsoft Graph não são acessíveis a partir deste ambiente isolado (e não devem ser acionados em homologação de frontend sem ambiente dedicado).

---

## 9. Integrações e Serviços Pendentes (`Pendente` / `Bloqueado`)

| Integração / Serviço | Endpoint / Escopo Auditado | Status |
| --- | --- | --- |
| **FastAPI Principal** | `http://localhost:3312` | `Pendente` (aguardando conexão e autenticação real) |
| **Runtime R7 & Agente IA** | `http://localhost:3310` / `/agent` | `Pendente` / `Requer autorização` para execução de ações |
| **Staging Gerencial** | `http://localhost:8788` | `Pendente` |
| **GLPI (Consumo Analítico & Escrita)** | Consumo via backend; link web `http://192.168.4.20/front/ticket.form.php?id={id}` | `Pendente` (link direto implementado no frontend; escrita/leitura real depende do backend) |
| **Microsoft 365 (Agenda & Outlook)** | Microsoft Graph / OAuth | `Bloqueado` / `Não implementado` |
| **Amostragem Estratificada Oficial** | Serviço estatístico backend | `Bloqueado` / `Não implementado` |
| **Geração Oficial de PDF (Atas)** | Renderização PDF server-side | `Pendente` (substituída temporariamente por visualização HTML + `@media print`) |

---

## 10. Limitações Conhecidas e Próximos Passos Recomendados

- **Persistência atual:** Configurações de sessão, criação de rascunhos de reunião, decisões ao vivo, compromissos e avaliações manuais de auditoria funcionam **exclusivamente em memória da sessão local** (`localStorage` apenas para tema claro/escuro). Recarregar a página reinicia os registros demonstrativos da sessão.
- **Conciliação de regras POP e numeração `TPL-04`:** O limite padrão de `24 horas corridas` (editável em Configurações) e o código `TPL-04` devem ser validados com o POP oficial e o catálogo institucional antes da virada para produção.
- **Próximo passo imediato antes do go-live:** Executar inspeção visual em navegador real (Chromium/Edge) nas resoluções `1366×768`, `1920×1080`, `1440×900`, `1024×768`, `768×1024` e `390×844` (temas claro e escuro + impressão PDF), seguido de testes de contrato com o FastAPI (`:3312`) e R7 (`:3310`).
