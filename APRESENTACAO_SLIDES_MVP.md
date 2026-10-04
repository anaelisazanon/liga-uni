# Apresentação (Pitch) — Portal Liga UNI · Ágora Tech Park

Este documento contém a estrutura completa de **slides** para a apresentação do MVP do **Portal Liga UNI**, contemplando:
1. **Problema & Proposta de Valor**
2. **Demonstração do MVP Funcionando (Fluxo Principal)**
3. **Principais Decisões de Arquitetura**
4. **Próximos Passos (O que seria desenvolvido em seguida)**

---

## Slide 1 — Capa
- **Título:** Portal Liga UNI — Conectando Projetos Universitários ao Ecossistema do Ágora Tech Park
- **Subtítulo:** Gestão de Espaços, Gamificação por LigaCoins e Metas Semestrais de Permanência
- **Elementos visuais no slide:**
  - Logo / Identidade Liga UNI · Ágora Tech Park
  - Universidades parceiras em Joinville: **UDESC, UFSC, IFSC e Univille** (17 entidades reais mapeadas: equipes de competição, empresas juniores, centros acadêmicos e atléticas)

---

## Slide 2 — O Problema & A Oportunidade
- **O Cenário Atual:**
  - Joinville possui dezenas de equipes universitárias de excelência (Robótica, Aerodesign, Eficiência Energética, Fórmula SAE, Empresas Juniores), mas a relação com o parque tecnológico muitas vezes era pontual ou descentralizada.
- **As Dores:**
  - Falta de um canal único para reservar salas, auditórios e espaços do Ágora.
  - Baixa adesão em reuniões gerais de alinhamento e falta de voluntários (Staff) para apoiar eventos do ecossistema.
  - Ausência de critérios claros e transparentes para avaliar se uma equipe está ativa no programa a cada semestre.

---

## Slide 3 — A Solução: Portal Liga UNI (Via de Mão Dupla)
- **Como funciona o ciclo:**
  1. **Boas-vindas:** Toda entidade aprovada entra com **+25 LigaCoins (LC)** e **1 reserva de sala gratuita** no semestre.
  2. **Engajamento Gera Moedas:** A equipe ganha LigaCoins ao participar de **Reuniões Gerais da Liga UNI**, atuar como **Staff em eventos do Ágora** (atividades de alta pontuação), participar de **Capacitações** e ministrar **Oficinas**.
  3. **Recompensa Real:** As moedas acumuladas são trocadas por reservas extras de salas ou benefícios na **Loja de Recompensas** (mentorias, bancada no Maker Space, diária de auditório).
  4. **Permanência Semestral:** Cada equipe acompanha suas **4 metas semestrais obrigatórias** para manter o vínculo ativo no semestre seguinte.

---

## Slide 4 — Demonstração ao Vivo: Fluxo Principal do MVP
*(Roteiro de tela compartilhada — 2 a 3 minutos)*

1. **Tela de Login (`/auth`):**
   - Layout dividido em duas colunas (identidade institucional à esquerda + acesso rápido de demonstração e login à direita).
2. **Visão do Líder (`Líder — GERM UDESC`):**
   - **Painel Principal Limpo:** Saudação *"Olá, equipe do(a) GERM"*, resumo de membros, eventos e solicitações recentes.
   - **Card de Exigências Semestrais na Barra Lateral:** Logo abaixo das LigaCoins, card em **amarelo/âmbar** (`3/4 exigências semestrais cumpridas`) que, ao clicar, abre a página exclusiva de acompanhamento detalhado (`/lider/exigencias`).
   - **Atividades & Salas em Sub-abas (`/lider/capacitacoes`):** Demonstração das 6 sub-abas horizontais (*Capacitações UNI, Oficinas, Staff em Eventos, Reuniões de Equipe, Eventos no Ágora e Reuniões Liga UNI*), destacando os selos de **"Inscrito"** para eventos futuros e a alta recompensa em LC para Staff e Reuniões Gerais.
   - **Calendário em Modo Visualização (`/lider/calendario`):** Consulta segura da agenda geral com atalho direto para a sub-aba correspondente.
3. **Visão de Equipe Recém-Registrada (`Babitonga — UFSC Joinville`):**
   - Simulação de uma equipe nova que acabou de se registrar no portal (`0 LigaCoins` e `0 solicitações`), pronta para iniciar sua jornada do zero.
4. **Visão do Administrador (`Administrador do Ágora`):**
   - **Alerta de Permanência Semestral (`!`):** O Admin visualiza imediatamente quais equipes não bateram as metas do semestre.
   - **Central de Aprovações Horizontal (`/admin/aprovacoes`):** Sub-abas organizadas por tipo de atividade para aprovar reservas e liberar LigaCoins em 1 clique.

---

## Slide 5 — Principais Decisões de Arquitetura
- **1. SPA Reativa com Roteamento Tipado (React 19 + TypeScript + TanStack Router & Query):**
  - *Decisão:* Rotas estruturadas por perfil (`/_authenticated/lider/*` e `/_authenticated/admin/*`) com *guards* de permissão (`user_roles`) e invalidação automática de cache via React Query.
  - *Benefício:* Separação rigorosa entre visão de Líder e Admin, além de navegação fluida por sub-abas (`?tab=...`).
- **2. Fronteira Única de Dados e Segurança (Supabase Client + RLS):**
  - *Decisão:* Centralização das consultas e mutações em `src/lib/data.ts`, apoiada em políticas de *Row-Level Security (RLS)* no banco PostgreSQL.
  - *Benefício:* Cada líder só manipula dados da própria entidade, enquanto o administrador possui visão global e poder de aprovação.
- **3. Motor Determinístico de Pontuação e Metas Semestrais (`calculateEntityCoins` & `calculateSemesterRequirements`):**
  - *Decisão:* O saldo de LigaCoins (creditado vs. pendente) e o status das 4 exigências semestrais são calculados dinamicamente a partir dos registros auditáveis de atividades, presenças e resgates.
  - *Benefício:* Zero risco de saldo dessincronizado e transparência total no extrato de moedas.
- **4. Ambiente Híbrido de Demonstração Resiliente:**
  - *Decisão:* Seed pré-carregado com as 17 entidades reais de Joinville (UDESC e UFSC) + grupo de teste para avaliação imediata em 1 clique.

---

## Slide 6 — Próximos Passos (Se o Projeto Continuasse)
- **1. Check-in Presencial via QR Code Dinâmico:**
  - Geração de QR Code nas Reuniões Gerais da Liga UNI, Capacitações e turnos de Staff para leitura pelo celular dos membros, automatizando a validação de presença pelo Admin.
- **2. Integração com Google Calendar e Alertas Automáticos (WhatsApp / E-mail):**
  - Sincronização automática das reservas de salas aprovadas com a agenda da equipe e disparo de lembretes quando o fim do semestre se aproxima e ainda há exigências pendentes.
- **3. Fechamento Automatizado de Semestre (Histórico + Certificados):**
  - Rotina de virada de semestre (`2026/2` → `2027/1`) que arquiva o histórico de metas cumpridas, gera certificados de horas complementares para os estudantes e reinicia o ciclo semestral.
- **4. Vitrine de Conexão com Empresas Residentes do Ágora:**
  - Espaço para startups e empresas do Ágora Tech Park lançarem desafios técnicos patrocinados (recompensados com LigaCoins) e recrutarem talentos diretamente das entidades universitárias mais engajadas.
