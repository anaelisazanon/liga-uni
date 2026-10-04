# Liga UNI — Guia de funcionamento do portal

Este documento descreve, perfil por perfil e página por página, como o portal Liga UNI funciona. Ele foi escrito a partir da leitura do código-fonte (`remix-of-exact-match-main`), então reflete o comportamento real do MVP. Os pontos de atenção e observações de arquitetura estão reunidos na seção 9.

---

## 1. Visão geral

O **Liga UNI** é a união entre o **Liga Ágora** (programa voluntário de capacitação de talentos universitários) e os **projetos universitários** do **Ágora Tech Park** (Joinville). No portal, cada projeto é uma **entidade acadêmica** (equipe de competição, empresa júnior, centro acadêmico, atlética etc.).

Existem dois perfis:

| Perfil | Quem é | O que faz |
| :---- | :---- | :---- |
| **Líder** | Responsável por uma entidade | Cadastra a equipe, inscreve membros em atividades, reserva salas, propõe oficinas, acompanha LigaCoins e metas do semestre |
| **Administrador** | Gestão do Ágora | Convoca reuniões, capacitações e chamados de staff, configura salas, benefícios e quantidade de exigências semestrais, aprova/recusa solicitações (com justificativa obrigatória), acompanha pendências de todas as equipes, dispara cobranças por e-mail e exporta relatórios CSV de auditoria |

### Ciclo geral

1. A equipe **solicita cadastro** → o administrador **aprova** → a entidade é criada e o acesso é liberado.  
2. O líder **inscreve membros** em reuniões, capacitações e chamados de staff, **propõe oficinas** e **reserva salas**.  
3. Depois do evento, o administrador **valida a presença** (individualmente ou em lote por evento) e as **LigaCoins** são creditadas.  
4. As moedas viram **salas de reunião** (custo padrão de 15 LC, configurável pelo admin) ou **benefícios** na Loja (catálogo editável pelo admin).  
5. Em paralelo, cada entidade cumpre **4 frentes de metas por semestre** (cuja quantidade também é configurável pelo admin) para manter o vínculo; o administrador acompanha o contador de pendências, envia cobrança aos líderes e exporta auditorias em CSV.

### Como o MVP roda hoje

- Front-end: TanStack Start (React 19), TanStack Router/Query, Tailwind v4 e shadcn/ui.  
- O acesso a dados está concentrado em `src/lib/data.ts` e no cliente `src/integrations/supabase/client.ts`.  
- **Importante:** nesta versão, `createSupabaseClient()` devolve um **cliente simulado (mock)** persistido no `localStorage` do navegador (chaves `liga_uni_demo_db_v22`, `liga_uni_demo_user_v22`, `liga_uni_portal_config_v1`, `liga_uni_reward_catalog_v1` e `liga_uni_admin_action_log_v1`), com 17 entidades, salas, reuniões, capacitações e chamados de staff de exemplo.  
- O papel do usuário (`admin` ou `leader`) define para onde ele é redirecionado e quais rotas pode abrir.

---

## 2. Regras de negócio compartilhadas

### 2.1 Tabela de LigaCoins (LC) — Padrão e Editável pelo Admin

Todos os valores abaixo vêm configurados por padrão, mas **podem ser editados dinamicamente pelo Administrador** em `/admin/configuracoes` (aba **Exigências Semestrais & Pontos**):

| Atividade | Fórmula padrão | Exemplo |
| :---- | :---- | :---- |
| Boas-vindas da entidade | +30 LC (uma vez) | 30 |
| **Reunião Liga UNI** | 50 LC por reunião + 25 LC por representante | 3 representantes → 125 LC |
| **Staff em evento** | 40 LC por evento + 30 LC por voluntário | 2 voluntários → 100 LC |
| **Oficina para outras equipes** | 25 LC base + 10 LC por ministrante (+20 LC se for em conjunto com outro projeto) | 3 ministrantes em conjunto → 75 LC |
| **Capacitação UNI** | 10 LC por capacitação + 5 LC por membro | 4 membros → 30 LC |

Reuniões e Staff são as atividades de maior pontuação, porque exigem presença física e comprometimento direto com o ecossistema.

### 2.2 Saldo, pendente e gasto

- **Creditadas (ganhas):** boas-vindas + atividades já validadas pelo administrador.  
- **Pendentes:** atividades com inscrição feita, mas ainda não validadas. Aparecem como "+X LC aguardando pós-evento" e **não entram no saldo**.  
- **Gastos:** **15 LC** (valor padrão unificado em todo o portal, inclusive na explicação de "Como funciona" da Central LigaCoins, e editável pelo admin) por cada reserva de sala de "Reunião de Equipe" **aprovada** + o custo dos resgates da Loja (resgates recusados estornam as moedas e não contam).  
- **Saldo disponível** = creditadas − gastos (nunca fica abaixo de zero).  
- Reserva de sala para **oficina** é **gratuita** (finalidade "capacitação geral").

### 2.3 Loja de Benefícios (Catálogo Editável pelo Admin)

O catálogo padrão conta com 5 prêmios, mas o administrador pode **criar novos benefícios, editar título, descrição, categoria, custo em LC, ocultar/exibir ou excluir** em `/admin/configuracoes?tab=beneficios`:

| Benefício (Padrão) | Categoria | Custo Padrão |
| :---- | :---- | :---- |
| Mentoria VIP com empresa residente do Ágora (1h30) | Ecossistema | 100 LC |
| Destaque nas redes oficiais do Ágora e Liga UNI | Divulgação | 150 LC |
| Estande/bancada garantida na Mostra Tecnológica | Estrutura | 220 LC |
| Kit coffee break para evento ou workshop da equipe | Estrutura | 280 LC |
| Troféu e Kit Liga UNI — Prêmio Entidade Destaque do Ano | Reconhecimento | 400 LC |

### 2.4 Exigências semestrais de permanência (Configuráveis pelo Admin)

Renovadas a cada semestre (rótulo padrão `2026/2`, editável pelo admin). As 4 frentes de metas possuem quantidades configuráveis pelo administrador em `/admin/configuracoes?tab=regras`:

| # | Meta | Regra Padrão (Editável pelo Admin) | Como é contada |
| :---- | :---- | :---- | :---- |
| 1 | **Reuniões Liga UNI** | Presença em **todas** as Reuniões ativas do semestre (ou número fixo definido pelo admin) | Presenças registradas da entidade |
| 2 | **Staff em Eventos** | Atuar como Staff em **2 eventos** | Inscrições de staff da entidade |
| 3 | **Capacitações UNI** | Participar de **2 Capacitações UNI** | Inscrições em capacitações |
| 4 | **Oficinas Oferecidas** | Oferecer **1 Oficina** para outras equipes | Oficinas próprias ou como parceira, exceto recusadas |

Observações:

- A contagem usa **inscrições/registros**, não a validação pós-evento do administrador.  
- O alerta fica "crítico" quando a entidade cumpriu 1 meta ou menos.  
- A equipe é considerada **em dia** (`0 PENDÊNCIAS`) quando cumpre todas as metas ativas do semestre.

### 2.5 Status, Recusa com Justificativa Obrigatória e Envio Automático

Solicitações usam três estados: **pendente**, **aprovada** e **recusada**.

- **Modal de Justificativa Obrigatória:** Sempre que o administrador clica em **Recusar** em uma **Reserva de Sala**, **Oficina / Evento**, **Resgate de Benefício** ou **Novo Cadastro**, abre-se um modal exigindo o preenchimento obrigatório do motivo da recusa (o botão de confirmação permanece desabilitado enquanto o campo estiver vazio).  
- **Envio Automático para a Equipe Responsável:** Ao confirmar a recusa, a justificativa é gravada na solicitação (`admin_note`), exibida em destaque nos cards da equipe (no Painel do Líder, em Oficinas e em Reuniões de Equipe) e **enviada automaticamente como um comunicado na aba Chamados (`/lider/contato`)** da entidade responsável.  
- Se uma proposta de oficina for recusada e houver uma reserva de sala gratuita vinculada a ela, a reserva vinculada também é recusada automaticamente com a mesma justificativa.

---

## 3. Páginas públicas

### 3.1 `/` (raiz)

Apenas redireciona para `/auth`.

### 3.2 `/auth` — Login e cadastro

Layout em duas colunas: à esquerda, a identidade institucional (Liga UNI · Ágora Tech Park; Joinville · UDESC · UFSC · IFSC · Univille); à direita, o acesso.

**Se já houver sessão**, a página redireciona direto para `/admin` ou `/lider`, conforme o papel.

**Acesso rápido de demonstração** (visível por padrão; some se `VITE_DEMO_LOGIN=false`). Três botões de 1 clique:

- **Líder — GERM (UDESC Joinville):** entra com a equipe de robótica de exemplo.  
- **Administrador:** entra com a conta de gestão do Ágora.  
- **Equipe recém-registrada — Babitonga (UFSC Joinville):** equipe zerada (0 LC, 0 solicitações, 4 pendências semestrais), útil para demonstrar o início da jornada e os alertas de cobrança.

**Aba "Entrar":** e-mail e senha. Mensagens de erro tratadas.

**Aba "Novo cadastro":** nome do líder, e-mail, senha (mínimo 6 caracteres), faculdade/universidade, nome do projeto/entidade e descrição. O envio cria uma **solicitação pendente** e **não inicia sessão**.

### 3.3 `/sobre` — Apresentação institucional

Página pública com o texto "A ponte entre a universidade e o ecossistema de inovação", os 4 pilares do programa e a tabela de LigaCoins.

---

## 4. Estrutura comum das telas autenticadas (barra lateral)

Todas as páginas logadas usam o mesmo layout (`AppShell`).

**Barra lateral do Líder**

- Selo "Líder" e nome da entidade (clicável → Minha Equipe).  
- **Cartão de LigaCoins:** saldo e, quando houver, "+X LC aguardando pós-evento". Clique abre a Central LigaCoins.  
- **Cartão de exigências semestrais** logo abaixo (âmbar quando há pendências, verde quando concluído): "N/4 exigências cumpridas". Clique abre `/lider/exigencias`.  
- Menu de navegação (seção 5).  
- **Como funciona o portal** (guia do líder).  
- **Falar com o Admin** (abre os chamados e comunicados automáticos recebidos da coordenação).  
- **Sair**.

**Barra lateral do Administrador**

- Selo "Administrador" e "Gestão do Ágora".  
- **Alerta "!"** em vermelho quando existem equipes com exigências pendentes ("Equipes com exigências pendentes: N"), levando a `/admin/pendencias-semestrais`.  
- Menu de navegação (seção 6), incluindo atalhos diretos para **Eventos & Capacitações** (`/admin/capacitacoes`) e **Salas, Benefícios & Config.** (`/admin/configuracoes`), além dos contadores de pendências.  
- Guia do administrador e **Sair**.

---

## 5. Perfil Líder

Rotas sob `/lider`. Um administrador que tente entrar aqui é redirecionado para `/admin`.

**Menu do líder**

1. Painel  
2. Reuniões Liga UNI (contador de reuniões abertas)  
3. Atividades & Salas, com 4 sub-abas: Capacitações UNI, Staff, Oferecer Oficina e Reuniões de Equipe  
4. Calendário

### 5.1 Painel — `/lider`

- Título "Olá, equipe do(a) {nome da entidade}" e botão **Como funciona o portal**.  
- **Três cartões de resumo:** Membros da equipe, Próximos eventos do projeto e Solicitações pendentes.  
- **Minhas Solicitações Recentes (Salas, Oficinas & LigaCoins):** lista unificada das solicitações mais recentes. Quando uma reserva de sala, oficina ou resgate é recusado pelo admin, a linha exibe em destaque o bloco **"Motivo da recusa enviado pelo Admin"**.  
- Atalhos **Oferecer Oficina** e **Reservar Sala**.

### 5.2 Reuniões Liga UNI — `/lider/reunioes`

- Lista de próximas reuniões convocadas pela coordenação.  
- Permite **Selecionar participantes** (mínimo 1 representante) e **Editar participantes** até a reunião acontecer.  
- Após validação do administrador, exibe "+X LC creditadas".

### 5.3 Atividades & Salas — `/lider/capacitacoes`

Página-hub com 4 cartões de acesso rápido e navegação por sub-abas (`?tab=...`):

- **a) Capacitações UNI (`?tab=capacitacoes`):** inscrição gratuita de membros da equipe, rendendo moedas após validação.  
- **b) Staff (`?tab=staff`):** escalação de voluntários para apoio em grandes eventos do Ágora.  
- **c) Oferecer Oficina (`?tab=oficinas`):** proposta de oficina ministrada pela própria equipe (individual ou em conjunto com outro projeto), com **sala gratuita**. Caso recusada pelo admin, exibe a justificativa enviada pela coordenação.  
- **d) Reuniões de Equipe (`?tab=reunioes-equipe`):** reserva de salas do Ágora para encontros internos da equipe. Custa **15 LC** (ou o valor configurado pelo admin), cobrados quando aprovada. Caso recusada, exibe na tabela o motivo enviado pelo administrador.

### 5.4 Calendário — `/lider/calendario`

Agenda mensal em modo visualização com filtros por tipo e modal de detalhes com atalho para a atividade.

### 5.5 Minha Equipe — `/lider/equipe`

Edição da descrição da entidade, interruptor de avisos por e-mail e CRUD completo de membros (Nome, E-mail e Curso).

### 5.6 Central LigaCoins — `/lider/ligacoins`

Três cartões de resumo (**Saldo disponível**, **Pontuação anual** e **Total trocado/utilizado**) e cinco abas:

1. **Como funciona:** explica as regras de ganho e uso de LigaCoins sincronizadas com as configurações atuais do portal (incluindo de forma consistente o custo de **15 LC** para reservar salas do Ágora em todos os blocos explicativos).  
2. **Benefícios:** exibe os itens ativos do catálogo configurado pelo administrador. Permite solicitar o resgate com LigaCoins.  
3. **Ranking:** classificação anual de todas as entidades pelo total de LigaCoins ganhas.  
4. **Entradas:** extrato detalhado de ganhos creditados e pendentes.  
5. **Saídas:** extrato de reservas de sala aprovadas e resgates de benefícios (incluindo justificativa caso algum resgate tenha sido recusado e estornado).

### 5.7 Exigências Semestrais — `/lider/exigencias`

Mostra o cumprimento das 4 metas configuradas para o semestre vigente, percentual de progresso e atalhos para cada atividade.

### 5.8 Guia do Líder — `/lider/guia`

Página de ajuda detalhando o funcionamento do portal para os líderes.

---

## 6. Perfil Administrador

Rotas sob `/admin`. Um líder que tente entrar aqui é redirecionado para `/lider`.

**Menu do administrador**

1. **Visão geral** (`/admin`)  
2. **Aprovações** (`/admin/aprovacoes`), com 6 categorias e contador total  
3. **Entidades** (`/admin/entidades`)  
4. **Eventos & Capacitações** (`/admin/capacitacoes`) — página unificada para adicionar/editar Capacitações UNI, Eventos de Staff e Reuniões Liga UNI  
5. **Salas, Benefícios & Config.** (`/admin/configuracoes`) — página dedicada para gerenciar salas do Ágora, catálogo de benefícios da Loja e regras/quantidades de exigências semestrais e LigaCoins  
6. **Calendário** (`/admin/calendario`)  
7. **Chamados** (`/admin/chamados`)

### 6.1 Visão geral — `/admin`

- **Cabeçalho com ações rápidas:** botões para **Adicionar Eventos & Capacitações**, **Salas, Benefícios & Config.** e **Central de Aprovações**.  
- **Card de Alerta de Permanência Semestral** (no topo, em vermelho): destaca quantas equipes possuem exigências pendentes no semestre atual e traz o botão **"Ver equipes e pendências"** (que leva a `/admin/pendencias-semestrais`, evitando repetição da listagem completa na home).  
- **Indicadores rápidos (StatCards):** Entidades ativas, Central de Aprovações, Reuniões Liga UNI, Capacitações & Staff e Chamados abertos.  
- **Aprovações por Tipo de Atividade:** 6 atalhos diretos com contadores em aberto.  
- **Últimas Solicitações Pendentes:** fila horizontal com as solicitações mais recentes.  
- **Log de Ações do Administrador (Aprovações & Recusas):** exibido no rodapé da visão geral com histórico cronológico, filtros e botões para exportar relatórios CSV de auditoria.

### 6.2 Central de Aprovações (Layout Compacto e Agrupado por Evento) — `/admin/aprovacoes`

Projetada para alta produtividade (ex.: aprovar 20 grupos em 20 eventos sem poluição visual):

- **Barra horizontal compacta de categorias no topo:** permite alternar em 1 clique entre **Reuniões**, **Capacitações**, **Staff**, **Oficinas**, **Reservas de Sala** e **Benefícios & Cadastros**, mostrando o contador de pendências em cada aba.  
- **Busca instantânea e filtro por evento/sala:** campo de busca por equipe, evento ou membro + seletor dropdown para filtrar uma reunião, capacitação, evento de staff ou sala específica.  
- **Agrupamento por Evento (Acordeão Compacto) e Aprovação em Lote:**  
  - Nas abas **Reuniões**, **Capacitações** e **Staff**, as inscrições ficam agrupadas por evento.  
  - O cabeçalho de cada evento exibe o total de equipes inscritas, o total de LigaCoins e o botão **"Aprovar/Liberar todas deste evento (X)"** para validar todas as equipes daquele evento em 1 clique.  
  - Dentro do evento, cada equipe ocupa apenas **uma linha horizontal compacta** com nome da entidade, número e nomes dos participantes, LigaCoins calculadas e botão rápido **Validar / Liberar**.  
  - Também há um botão geral no topo da barra de filtros para **validar/aprovar todas as pendências filtradas da aba** de uma só vez.  
- **Linhas compactas para Oficinas, Reservas de Sala e Benefícios & Cadastros:**  
  - Exibe todos os dados essenciais em uma única faixa horizontal por solicitação, com botões rápidos de **Aprovar / Publicar** e **Recusar**.  
- **Modal de Justificativa Obrigatória na Recusa:** clicar em **Recusar** em qualquer item abre o modal que exige justificativa e envia a mensagem automaticamente para a equipe responsável.  
- **Log de Ações do Administrador:** integrado logo abaixo da lista de aprovações, registrando em tempo real cada aprovação (individual ou em lote) e cada recusa com data, item e justificativa.

### 6.3 Alerta de Permanência Semestral & Cobrança de Equipes — `/admin/pendencias-semestrais`

Página dedicada que renderiza o componente **`AdminTeamsPendingDashboard`**:

- **Filtro padrão "Somente com pendências":** ao abrir a página, exibe inicialmente apenas as equipes que possuem exigências pendentes no semestre. As demais equipes só aparecem se o administrador clicar nos filtros **"Mostrar todas as equipes"** ou **"Em dia"** (além de contar com busca por nome da equipe ou líder).  
- **Cards Horizontais com Contador em Destaque:** cada equipe ocupa uma linha horizontal completa contendo:  
  - À esquerda: **contador numérico em destaque** (`X PENDÊNCIAS` em vermelho para equipes pendentes ou `0 PENDÊNCIAS` em verde para equipes em dia), nome da entidade, nome e e-mail do líder.  
  - Ao centro: selos compactos das 4 metas semestrais (`R.`, `S.`, `C.`, `O.`) mostrando realizado/meta.  
  - À direita: botão **"Cobrar líder por e-mail"** (ou indicador "Cobrança enviada").  
- **Modal de Detalhes e Disparo de E-mail de Cobrança:** clicar em qualquer equipe abre o modal com os dados completos do líder, o detalhamento das 4 metas semestrais e uma mensagem de cobrança pré-preenchida (editável) pronta para disparo ao líder — registrando também o aviso no histórico de **Chamados** da equipe.  
- **Exportação CSV de Pendências:** botão **"Exportar Pendências (CSV)"** no cabeçalho para baixar a planilha de auditoria das equipes listadas.

### 6.4 Eventos & Capacitações — `/admin/capacitacoes`

Página unificada (acessível diretamente na barra lateral do Admin) com 3 abas para criar, editar e excluir atividades que valem LigaCoins e contam para as metas semestrais:

1. **Capacitações UNI (`?tab=capacitacoes`):** criar/editar título, descrição, ministrante, sala do Ágora, data, horário de início/fim, limite de vagas, se é obrigatória e se está ativa. Permite expandir os inscritos e liberar moedas diretamente.  
2. **Staff em Eventos (`?tab=staff`):** criar/editar chamados de staff (nome do evento, descrição das atribuições, local, vagas de voluntários, data, horários e status ativo) e liberar moedas para voluntários.  
3. **Reuniões Liga UNI (`?tab=reunioes`):** convocar/editar reuniões gerais (título, pauta, sala, data, horários, bônus base e status ativo) e gerenciar a lista de chamada das entidades.

### 6.5 Salas, Benefícios & Configurações — `/admin/configuracoes`

Página de configuração geral do portal (acessível na barra lateral do Admin) dividida em 3 abas:

1. **Salas do Ágora (`?tab=salas`):** adicionar novas salas, editar nome, capacidade, descrição, ativar/desativar salas para reserva ou remover salas cadastradas.  
2. **Benefícios da Loja (`?tab=beneficios`):** adicionar novos benefícios ao catálogo de LigaCoins, editar título, categoria (`Ecossistema`, `Divulgação`, `Estrutura`, `Reconhecimento`), descrição, custo em LC, ativar/ocultar ou excluir itens (com botão para restaurar o catálogo padrão).  
3. **Exigências Semestrais & Pontos (`?tab=regras`):**  
   - Definir o **rótulo do semestre vigente** (ex.: `2026/2`).  
   - Definir a **quantidade de exigências semestrais** de cada uma das 4 frentes: Reuniões Liga UNI (100% das reuniões ativas ou quantidade fixa personalizada), quantidade mínima de Staff em Eventos, quantidade mínima de Capacitações UNI e quantidade mínima de Oficinas Oferecidas.  
   - Definir todos os **valores de LigaCoins**: custo de reserva de sala para reunião de equipe, bônus de boas-vindas e pontuação por evento/por membro de Reuniões, Staff, Capacitações e Oficinas.

### 6.6 Log de Ações do Administrador & Exportação CSV de Auditoria

O componente **`AdminActionLog`** (presente em `/admin/aprovacoes` e em `/admin`) registra todas as decisões do administrador:

- **Dados registrados:** Data/Hora, Ação (`Aprovado` ou `Recusado`), Categoria, Item avaliado, Equipe/Solicitante, LigaCoins envolvidas e **Justificativa / Detalhe fornecido**.  
- **Filtros rápidos:** Todas, Aprovadas e Recusadas.  
- **Exportação CSV para Auditoria:**  
  - **Exportar Auditoria Completa (CSV):** gera um arquivo `.csv` compatível com Excel (UTF-8 com BOM e separador `;`) contendo duas seções completas: **(1) Pendências atuais de todas as equipes** (líder, e-mail, status semestral, quantidade de pendências e progresso nas 4 metas) e **(2) Histórico completo do Log de Ações do Administrador** (aprovações, recusas e justificativas).  
  - **Exportar Logs (CSV):** baixa o arquivo `.csv` apenas com os registros do log de ações (respeitando o filtro selecionado).  
  - **Exportar Pendências (CSV):** disponível em `/admin/pendencias-semestrais` para exportar especificamente a tabela de equipes e pendências semestrais.

### 6.7 Entidades (`/admin/entidades`), Calendário (`/admin/calendario`), Chamados (`/admin/chamados`) e Guia (`/admin/guia`)

- **Entidades:** consulta de todas as entidades por universidade ou filtro de pendências semestrais, visualização de membros e aba de aprovação/recusa de novos cadastros.  
- **Calendário:** agenda mensal consolidada com filtro por entidade e por tipo de evento.  
- **Chamados:** atendimento aos chamados abertos pelos líderes e histórico de comunicados automáticos (recusas e cobranças semestrais).  
- **Guia do Administrador:** resumo operacional atualizado com links diretos para as páginas de configuração e catálogo dinâmico de benefícios.

---

## 7. Redirecionamentos de rotas antigas

| Rota antiga | Destino |
| :---- | :---- |
| `/` | `/auth` |
| `/lider/reservas` | `/lider/capacitacoes?tab=reunioes-equipe` |
| `/lider/apoio-eventos` | `/lider/capacitacoes?tab=staff` |
| `/admin/apoio-eventos` | `/admin/capacitacoes` |
| `/admin/reunioes` | Página de gestão de Reuniões (também integrada em `/admin/capacitacoes?tab=reunioes`) |
| `/admin/cadastros` | `/admin/entidades` |
| `/admin/reservas` | `/admin/aprovacoes` |
| `/admin/salas` | `/admin/reservas` |

---

## 8. Dados e contas de demonstração

- **Contas de teste:** líder GERM (`lider.teste@example.com`), administrador (`admin.teste@example.com`) e a equipe recém-registrada Babitonga (UFSC Joinville).  
- **Entidades de exemplo:** 17 entidades entre UDESC, UFSC, IFSC e Univille.  
- **Persistência local:** dados operacionais, configurações de metas/moedas, catálogo de benefícios e logs de auditoria ficam salvos no `localStorage` do navegador durante a demonstração.

---

## 9. Observações técnicas do MVP

1. **Cliente simulado (`localStorage`).** O app roda de forma 100% interativa no navegador usando o cliente mock em `src/integrations/supabase/client.ts` combinado com configurações persistidas localmente em `src/lib/data.ts`.  
2. **Notificações de cobrança e recusa.** Como não há servidor SMTP conectado no ambiente de demonstração, o disparo de e-mail de cobrança semestral e o envio automático da justificativa de recusa gravam um comunicado oficial diretamente na caixa de **Chamados** (`/lider/contato`) da equipe responsável e exibem confirmação imediata na interface.  
3. **Metas contam inscrições.** As exigências semestrais contabilizam as inscrições/registros realizados pela equipe no semestre vigente, permitindo acompanhamento em tempo real.
