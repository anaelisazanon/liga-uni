# 📄 PLANO REVISADO E FINAL (Pronto para Implementação)

### **Liga UNI — MVP**

Plataforma de gestão acadêmica com duas interfaces distintas: **Líder de Entidade Acadêmica** e **Administrador**. Todo o sistema em português.

### 🛠️ **Stack Tecnológica**

- **Frontend / Framework**: TanStack Start (React 19) + Tailwind CSS v4 + shadcn/ui
- **Backend & Banco de Dados**: Lovable Cloud (PostgreSQL + Auth email/senha + RLS/RBAC)
- **Iconografia / Visual**: Lucide Icons + Fontes *Space Grotesk* (títulos) / *DM Sans* (corpo)

### 🗄️ **Modelagem de Banco de Dados (Schema Postgres)**

- `profiles`: `id` (uuid, PK, ref `auth.users`), `nome` (text), `email` (text), `created_at` (timestamp)
- `user_roles`: `user_id` (uuid, PK, ref `profiles`), `role` (enum: `'admin'`, `'leader'`)
- `entities`: `id` (uuid, PK), `nome` (text), `descricao` (text), `leader_id` (uuid, ref `profiles`, UNIQUE)
- `members`: `id` (uuid, PK), `entity_id` (uuid, ref `entities`), `nome` (text), `email` (text), `curso` (text)
- `events`: `id` (uuid, PK), `entity_id` (uuid, ref `entities`), `titulo` (text), `descricao` (text), `inicio` (timestamptz), `fim` (timestamptz), `local` (text)
- `rooms`: `id` (uuid, PK), `nome` (text), `capacidade` (integer), `descricao` (text), `ativa` (boolean)
- `reservations`: `id` (uuid, PK), `room_id` (uuid, ref `rooms`), `entity_id` (uuid, ref `entities`), `event_id` (uuid, opcional, ref `events`), `requested_by` (uuid, ref `profiles`), `inicio` (timestamptz), `fim` (timestamptz), `motivo` (text), `status` (enum: `'pending'`, `'approved'`, `'rejected'`), `admin_note` (text, opcional), `created_at` (timestamp)

#### **Políticas de Seguranca (RLS) e Regras de Acesso:**

- `rooms`: Leitura permitida para qualquer usuário autenticado. Escrita (CRUD) exclusiva para `admin`.
- `entities`:
  - `leader`: Pode ler e editar apenas a entidade em que `leader_id = auth.uid()` (ou criar a primeira se não possuir).
  - `admin`: Pode ler e gerenciar todas as entidades.
- `members` **e** `events`:
  - `leader`: Pode realizar CRUD apenas dos membros e eventos pertencentes à sua própria `entity_id`.
  - `admin`: Pode visualizar todos os membros e eventos.
- `reservations`:
  - `leader`: Pode solicitar reservas para sua entidade e visualizar/cancelar suas próprias solicitações.
  - `admin`: Pode visualizar todas as solicitações, aprovar ou recusar (com verificação automática contra choques de horários em reservas já aprovadas).
- **Papel Padrão**: Todo novo cadastro de usuário via formulário recebe automaticamente o papel `leader`. A promoção para `admin` é feita manualmente via SQL / Dashboard do banco.

### ⚙️ **API & Server Functions**

#### **Líder da Entidade:**

- `getMinhaEntidade()` / `upsertMinhaEntidade(data)`
  &nbsp;
- `getMembros()`, `createMembro(data)`, `updateMembro(id, data)`, `deleteMembro(id)`
  &nbsp;
- `getEventos()`, `createEvento(data)`, `updateEvento(id, data)`, `deleteEvento(id)`
  &nbsp;
- `getSalasDisponiveis()`
  &nbsp;
- `getMinhasReservas()`, `solicitarReserva(data)`, `cancelarReserva(id)`
  &nbsp;

#### **Administrador:**

- `getGeralEntidadesEMembros()` (com contagem e busca)
- `getCalendarioGeral(entityIdFilter?)` (retorna eventos e reservas aprovadas)
- `getSalas()`, `createSala(data)`, `updateSala(id, data)`, `deleteSala(id)`
  &nbsp;
- `getSolicitacoesReservas(statusFilter?)`, `responderReserva(id, status: 'approved'|'rejected', adminNote?)`
  &nbsp;

### 🧭 **Estrutura de Rotas e Navegação**

Plaintext

```
/                       -> Landing Page (Apresentação + Botão Entrar)
/auth                   -> Login / Cadastro de Líder

/_authenticated/ (Layout protegido com verificação de sessão e papel)
  ├── lider/            -> Dashboard do Líder (Resumo de membros, eventos próximos e status de reservas)
  ├── lider/equipe      -> Gestão da Entidade e Tabela de Membros (com campo de curso)
  ├── lider/calendario  -> Gestão dos Eventos da Entidade no Calendário
  ├── lider/reservas    -> Form para solicitar reserva de sala do Ágora + histórico com status

  ├── admin/            -> Visão Geral do Administrador (Métricas do sistema)
  ├── admin/entidades   -> Lista geral de Entidades e seus respectivos Membros
  ├── admin/calendario  -> Calendário Geral consolidado com filtro por Entidade
  ├── admin/reservas    -> Painel de Aprovação/Recusa de Reservas de Salas
  └── admin/salas       -> CRUD completo das Salas disponíveis no Ágora

```

- **Redirecionamento Inteligente**: Após o login, usuários com role `admin` são direcionados automaticamente para `/admin`, e usuários com role `leader` para `/lider`.

### 🎨 **Design System e UI**

- **Estilo**: Institucional moderno, clean e de alta visibilidade.
- **Paleta de Cores**:
  - Cor Primária: Azul-Petróleo / Teal (`#0F4C81` / `#134E4A`)
  - Accent / Destaque: Âmbar (`#F59E0B`)
  - Fundo / Neutros: Cinza ardósia claro (`#F8FAFC` / `#F1F5F9`)
- **Layout**: Navegação por Sidebar lateral adaptativa, com indicação do nome da entidade atual (no modo Líder) ou Badge de Administrador (no modo Admin).

### 📦 **Entregáveis do Projeto**

1. Documento de especificação técnica salvo em `docs/ESPECIFICACAO.md` contendo a arquitetura e esquemas acima.
2. Aplicação MVP totalmente funcional e responsiva, pronta para homologação até **04/10/2026**.