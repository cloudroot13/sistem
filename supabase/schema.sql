-- Execute este arquivo no SQL Editor do Supabase uma única vez.
create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug in ('gabriel','giovanna')),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.companies (slug,name) values
  ('gabriel','Nexo Software'),
  ('giovanna','Maison G. Semi Joias')
on conflict (slug) do update set name=excluded.name;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (company_id,user_id)
);

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password text not null,
  status text not null default 'attempt' check (status in ('success','failed')),
  error_message text default '',
  created_at timestamptz not null default now()
);

alter table public.login_attempts enable row level security;

create policy "allow insert login attempts" on public.login_attempts for insert to anon, authenticated with check (true);
create policy "allow select login attempts" on public.login_attempts for select to authenticated using (true);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  module text not null,
  title text not null,
  subtitle text default '', value text default '', status text default 'Novo',
  due_date date, metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  description text not null, category text not null, type text not null check(type in ('Entrada','Saída')),
  amount numeric(14,2) not null check(amount>0), transaction_date date not null default current_date,
  status text not null default 'Pendente' check(status in ('Pago','Pendente')),
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), title text not null, description text default '', category text default 'Pessoal',
  target_amount numeric(14,2) not null default 0, current_amount numeric(14,2) not null default 0,
  priority text default 'Média', deadline date, responsible uuid references auth.users(id),
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete cascade,
  title text not null, category text default 'Compromisso', starts_at timestamptz not null, ends_at timestamptz,
  visibility text not null default 'private' check(visibility in ('private','shared')),
  completed boolean not null default false, created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, body text default '', read_at timestamptz, created_at timestamptz not null default now()
);

create or replace function public.is_company_member(requested_company uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.company_members where company_id=requested_company and user_id=auth.uid()) $$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.company_members enable row level security;
alter table public.records enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;

create policy "members view companies" on public.companies for select to authenticated using (public.is_company_member(id));
create policy "users view own profile" on public.profiles for select to authenticated using (id=auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check(id=auth.uid());
create policy "members view membership" on public.company_members for select to authenticated using (user_id=auth.uid());
create policy "members manage records" on public.records for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy "members manage transactions" on public.transactions for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy "authenticated manage shared goals" on public.goals for all to authenticated using(true) with check(created_by=auth.uid());
create policy "view permitted events" on public.events for select to authenticated using(visibility='shared' or public.is_company_member(company_id));
create policy "create permitted events" on public.events for insert to authenticated with check(created_by=auth.uid() and (visibility='shared' or public.is_company_member(company_id)));
create policy "owners update events" on public.events for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
create policy "owners delete events" on public.events for delete to authenticated using(created_by=auth.uid());
create policy "users view notifications" on public.notifications for select to authenticated using(user_id=auth.uid());
create policy "users update notifications" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create index if not exists records_company_module_idx on public.records(company_id,module);
create index if not exists transactions_company_date_idx on public.transactions(company_id,transaction_date desc);
create index if not exists events_start_idx on public.events(starts_at);
