-- Migração versionada do Liga UNI (MVP)
-- Tipos
do $$ begin
  create type public.app_role as enum ('admin', 'leader');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.reservation_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- Tabelas
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  leader_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  nome text not null,
  email text not null default '',
  curso text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  inicio timestamptz not null,
  fim timestamptz not null,
  local text not null default '',
  created_at timestamptz not null default now(),
  check (fim > inicio)
);
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  capacidade integer not null default 1 check (capacidade > 0),
  descricao text not null default '',
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  requested_by uuid not null references auth.users(id),
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text not null default '',
  status public.reservation_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);
create table if not exists public.leader_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome_lider text not null,
  email text not null,
  faculdade text not null,
  projeto text not null,
  descricao text not null default '',
  status public.reservation_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);
create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  ministrante text not null default '',
  local text not null default '',
  inicio timestamptz not null,
  fim timestamptz not null,
  vagas int not null default 30,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  participantes text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.staff_calls (
  id uuid primary key default gen_random_uuid(),
  evento text not null,
  descricao text not null default '',
  local text not null default '',
  inicio timestamptz not null,
  fim timestamptz not null,
  vagas int not null default 10,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.staff_volunteers (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.staff_calls(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  participantes text not null,
  observacao text not null default '',
  created_at timestamptz not null default now()
);

-- Funções de apoio
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.owns_entity(_entity uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.entities where id = _entity and leader_id = auth.uid())
$$;

-- Perfil e solicitação de cadastro de líder (aguarda aprovação do admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'nome', ''))
  on conflict (id) do nothing;
  insert into public.leader_requests (user_id, nome_lider, email, faculdade, projeto, descricao, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'faculdade', ''),
    coalesce(new.raw_user_meta_data->>'projeto', ''),
    coalesce(new.raw_user_meta_data->>'descricao', ''),
    'pending'
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Validação de reserva: datas coerentes e sem choque ao aprovar
create or replace function public.validate_reservation()
returns trigger language plpgsql as $$
begin
  if new.fim <= new.inicio then
    raise exception 'O término deve ser após o início';
  end if;
  if new.status = 'approved' and exists (
    select 1 from public.reservations r
    where r.room_id = new.room_id and r.status = 'approved' and r.id <> new.id
      and tstzrange(r.inicio, r.fim) && tstzrange(new.inicio, new.fim)
  ) then
    raise exception 'Choque de horário com outra reserva aprovada nesta sala';
  end if;
  return new;
end $$;

drop trigger if exists trg_validate_reservation on public.reservations;
create trigger trg_validate_reservation before insert or update on public.reservations
  for each row execute function public.validate_reservation();

-- Horários ocupados de uma sala, sem expor dados de outras entidades
create or replace function public.room_busy(_room uuid, _from timestamptz, _to timestamptz)
returns table (inicio timestamptz, fim timestamptz)
language sql stable security definer set search_path = public as $$
  select r.inicio, r.fim from public.reservations r
  where r.room_id = _room and r.status = 'approved' and r.inicio < _to and r.fim > _from
$$;
revoke execute on function public.room_busy(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.room_busy(uuid, timestamptz, timestamptz) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.entities enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.rooms enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "profiles: ler o próprio ou admin" on public.profiles;
create policy "profiles: ler o próprio ou admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles: editar o próprio" on public.profiles;
create policy "profiles: editar o próprio" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: só leitura do próprio papel (ou admin). Escrita apenas por SQL ou service role.
drop policy if exists "roles: ler o próprio ou admin" on public.user_roles;
create policy "roles: ler o próprio ou admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "entities: ler" on public.entities;
create policy "entities: ler" on public.entities for select to authenticated
  using (leader_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "entities: criar a própria" on public.entities;
create policy "entities: criar a própria" on public.entities for insert to authenticated
  with check (leader_id = auth.uid());

drop policy if exists "entities: editar" on public.entities;
create policy "entities: editar" on public.entities for update to authenticated
  using (leader_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (leader_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "entities: admin remove" on public.entities;
create policy "entities: admin remove" on public.entities for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "members: líder dono" on public.members;
create policy "members: líder dono" on public.members for all to authenticated
  using (public.owns_entity(entity_id)) with check (public.owns_entity(entity_id));

drop policy if exists "members: admin lê" on public.members;
create policy "members: admin lê" on public.members for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "events: líder dono" on public.events;
create policy "events: líder dono" on public.events for all to authenticated
  using (public.owns_entity(entity_id)) with check (public.owns_entity(entity_id));

drop policy if exists "events: admin lê" on public.events;
create policy "events: admin lê" on public.events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "rooms: autenticados leem" on public.rooms;
create policy "rooms: autenticados leem" on public.rooms for select to authenticated using (true);

drop policy if exists "rooms: admin escreve" on public.rooms;
create policy "rooms: admin escreve" on public.rooms for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "reservations: ler" on public.reservations;
create policy "reservations: ler" on public.reservations for select to authenticated
  using (public.owns_entity(entity_id) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "reservations: líder solicita" on public.reservations;
create policy "reservations: líder solicita" on public.reservations for insert to authenticated
  with check (public.owns_entity(entity_id) and requested_by = auth.uid() and status = 'pending');

drop policy if exists "reservations: líder cancela pendente" on public.reservations;
create policy "reservations: líder cancela pendente" on public.reservations for delete to authenticated
  using (public.owns_entity(entity_id) and status = 'pending');

drop policy if exists "reservations: admin decide" on public.reservations;
create policy "reservations: admin decide" on public.reservations for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
