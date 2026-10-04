# Liga UNI · Ágora Tech Park

O **Liga UNI** é a união entre o **Liga Ágora** (programa voluntário de capacitação de talentos universitários) e os projetos universitários dentro do **Ágora Tech Park** (Joinville).

Neste MVP, cada projeto universitário é representado como uma **entidade acadêmica**:

- **Líder de entidade acadêmica**: cadastra sua equipe, membros e cursos, registra eventos no calendário e solicita reservas de salas do Ágora.
- **Administrador**: visualiza todas as entidades e membros, acompanha o calendário geral com filtros, aprova ou recusa solicitações de reserva e gerencia as salas disponíveis.

## Como rodar localmente

Requisitos: Node.js 22+ e npm.

```sh
npm install
npm run dev
```

O servidor de desenvolvimento sobe em `http://localhost:3000`.

### Scripts disponíveis

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — gera a build de produção
- `npm run test` — executa os testes automatizados (Vitest)
- `npm run lint` — executa a verificação do ESLint

## Variáveis de ambiente

Consulte o arquivo `.env.example`:

- `VITE_SUPABASE_URL` / `SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` — chave pública (anon/publishable) do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — chave de serviço (usada apenas no servidor para preparar dados de demonstração)
- `DEMO_LOGIN=true` e `VITE_DEMO_LOGIN=true` — habilitam os botões de **Acesso de teste** na tela `/auth`

O esquema completo do banco de dados está versionado em `supabase/migrations/20261003000000_liga_uni_schema.sql`.

## Contas de teste (homologação)

Quando `VITE_DEMO_LOGIN=true` está ativo, a tela de login (`/auth`) exibe dois botões de acesso rápido:

- **Entrar como líder (teste)**: cria/atualiza `lider.teste@example.com` e popula dados de exemplo (entidade, 4 membros, 3 eventos, 3 salas e 2 reservas).
- **Entrar como administrador (teste)**: cria/atualiza `admin.teste@example.com` com papel `admin`.

## Como promover um usuário a administrador

Todo cadastro novo recebe o papel `leader` por padrão. Para promover uma conta existente a administrador no banco de dados Supabase, execute:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'EMAIL_DO_ADMIN'
on conflict (user_id, role) do nothing;
```
