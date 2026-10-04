# Liga UNI — Especificação técnica (MVP)

## Stack
- TanStack Start (React 19) + Tailwind v4 + shadcn/ui
- Lovable Cloud: Postgres, Auth (email/senha), RLS por papel

## Banco de dados
| Tabela | Campos |
|---|---|
| profiles | id (= auth user), nome, email, created_at |
| user_roles | user_id, role (`admin` \| `leader`) |
| entities | id, nome, descricao, leader_id (único) |
| members | id, entity_id, nome, email, curso |
| events | id, entity_id, titulo, descricao, inicio, fim, local |
| rooms | id, nome, capacidade, descricao, ativa |
| reservations | id, room_id, entity_id, event_id?, requested_by, inicio, fim, motivo, status (`pending`/`approved`/`rejected`), admin_note |

Funções: `has_role(user, role)`, `owns_entity(entity)`. Trigger `validate_reservation` impede fim ≤ início e bloqueia aprovação com choque de horário. Trigger `handle_new_user` cria perfil e papel `leader`.

## Regras de acesso (RLS)
- rooms: leitura para autenticados; escrita só admin.
- entities: líder lê/edita a própria; admin lê/gerencia todas.
- members, events: CRUD do líder dono; admin lê tudo.
- reservations: líder cria (status pendente) e cancela pendentes da sua entidade; admin lê tudo e altera status.

## Operações (via cliente com RLS)
Líder: minha entidade (ler/salvar), membros CRUD, eventos CRUD, salas (listar), reservas (solicitar/listar/cancelar).
Admin: entidades + membros (busca), calendário geral (filtro por entidade, inclui reservas aprovadas), salas CRUD, reservas (filtro por status, aprovar/recusar com nota).

## Rotas
```
/                      landing
/auth                  login / cadastro
/lider                 painel
/lider/equipe          entidade + membros
/lider/calendario      eventos
/lider/reservas        solicitar e acompanhar
/admin                 métricas
/admin/entidades       entidades e membros
/admin/calendario      calendário geral com filtro
/admin/reservas        aprovar/recusar
/admin/salas           CRUD salas
```

## Promover administrador
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@exemplo.com';
```
