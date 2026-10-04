# Liga UNI — Especificação técnica (MVP)

## Contexto

O **Liga UNI** conecta o programa **Liga Ágora** aos projetos universitários (tratados neste MVP como **entidades acadêmicas**) dentro do **Ágora Tech Park** (Joinville).

## Stack

- TanStack Start (React 19) + Tailwind v4 + shadcn/ui
- Supabase (Lovable Cloud): Postgres, Auth (e-mail/senha), RLS por papel

## Banco de dados

Migração versionada em `supabase/migrations/20261003000000_liga_uni_schema.sql`.

| Tabela       | Campos                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| profiles     | id (= auth user), nome, email, created_at                                                                                  |
| user_roles   | user_id, role (`admin` \| `leader`)                                                                                        |
| entities     | id, nome, descricao, leader_id (único)                                                                                     |
| members      | id, entity_id, nome, email, curso                                                                                          |
| events       | id, entity_id, titulo, descricao, inicio, fim, local                                                                       |
| rooms        | id, nome, capacidade, descricao, ativa                                                                                     |
| reservations | id, room_id, entity_id, event_id?, requested_by, inicio, fim, motivo, status (`pending`/`approved`/`rejected`), admin_note |

Funções:

- `has_role(user, role)` e `owns_entity(entity)` para verificação em policies.
- `room_busy(_room, _from, _to)` (`security definer`): retorna apenas os intervalos `(inicio, fim)` de reservas aprovadas de uma sala, permitindo ao líder visualizar horários ocupados sem expor dados de outras entidades.
- Trigger `validate_reservation`: impede `fim <= inicio` e bloqueia aprovação com choque de horário na mesma sala.
- Trigger `handle_new_user`: cria perfil em `profiles` e papel padrão `leader` em `user_roles`.

## Regras de acesso (RLS)

- `profiles`: usuário lê/edita o próprio perfil; admin lê todos os perfis (para identificar solicitantes de reserva).
- `user_roles`: leitura do próprio papel (ou admin). Escrita apenas via SQL ou service role.
- `rooms`: leitura para autenticados; escrita só admin.
- `entities`: líder lê/edita a própria; admin lê/gerencia todas.
- `members`, `events`: CRUD do líder dono; admin lê tudo.
- `reservations`: líder cria (status `pending`) e cancela pendentes da sua entidade; admin lê tudo e decide status (`approved`/`rejected`) com observação.

## Rotas

```
/                      redireciona para /auth (sem sessão) ou para /lider / /admin (com sessão)
/sobre                 apresentação institucional do Liga UNI · Ágora Tech Park
/auth                  login, cadastro e botões de acesso de teste (quando DEMO_LOGIN=true)
/lider                 painel do líder (saudação pelo nome do perfil, resumo e contadores)
/lider/equipe          cadastro/edição da entidade e CRUD de membros
/lider/calendario      calendário de eventos da entidade (suporte a eventos de múltiplos dias)
/lider/reservas        solicitação de salas com validação de datas, consulta de horários ocupados e alerta de conflito
/admin                 visão geral com métricas e alerta de pendências
/admin/entidades       listagem e busca por entidade, membro ou curso
/admin/calendario      calendário geral com filtro por entidade e por tipo, e diálogo de detalhes
/admin/reservas        aprovação/recusa via diálogo com observação, alerta de conflito e dados do solicitante
/admin/salas           CRUD de salas com opção de ativar/desativar e proteção contra exclusão com reservas futuras aprovadas
```

## Promover administrador

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@exemplo.com'
on conflict (user_id, role) do nothing;
```
