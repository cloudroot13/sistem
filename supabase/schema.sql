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
  title text not null, body text default '', read_at timestamptz,
  objective_id uuid, actor_id uuid references auth.users(id),
  event_key text unique, created_at timestamptz not null default now()
);

create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  calendar_type text not null check(calendar_type in ('calendar','challenge')),
  start_date date not null default current_date,
  total_days integer check(total_days is null or (total_days between 1 and 366)),
  visibility text not null default 'individual' check(visibility in ('individual','shared')),
  color text not null default '#7c6cff',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.objective_activities (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.objective_checkins (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  activity_id uuid not null references public.objective_activities(id) on delete cascade,
  day_key text not null,
  completed_by uuid not null default auth.uid() references auth.users(id),
  completed_at timestamptz not null default now(),
  unique(activity_id,day_key,completed_by)
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
alter table public.objectives enable row level security;
alter table public.objective_activities enable row level security;
alter table public.objective_checkins enable row level security;

create policy "members view companies" on public.companies for select to authenticated using (public.is_company_member(id));
create policy "authenticated view profiles" on public.profiles for select to authenticated using (true);
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
create policy "view permitted objectives" on public.objectives for select to authenticated using(visibility='shared' or created_by=auth.uid());
create policy "authenticated create objectives" on public.objectives for insert to authenticated with check(created_by=auth.uid());
create policy "owners update objectives" on public.objectives for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
create policy "owners delete objectives" on public.objectives for delete to authenticated using(created_by=auth.uid());
create policy "view permitted objective activities" on public.objective_activities for select to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id and (o.visibility='shared' or o.created_by=auth.uid())));
create policy "objective owners create activities" on public.objective_activities for insert to authenticated with check(exists(select 1 from public.objectives o where o.id=objective_id and o.created_by=auth.uid()));
create policy "objective owners update activities" on public.objective_activities for update to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id and o.created_by=auth.uid()));
create policy "objective owners delete activities" on public.objective_activities for delete to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id and o.created_by=auth.uid()));
create policy "view permitted objective checkins" on public.objective_checkins for select to authenticated using(exists(select 1 from public.objectives o where o.id=objective_id and (o.visibility='shared' or o.created_by=auth.uid())));
create policy "create own objective checkins" on public.objective_checkins for insert to authenticated with check(completed_by=auth.uid() and exists(select 1 from public.objectives o where o.id=objective_id and (o.visibility='shared' or o.created_by=auth.uid())));
create policy "delete own objective checkins" on public.objective_checkins for delete to authenticated using(completed_by=auth.uid());

create or replace function public.notify_shared_objective_completion()
returns trigger language plpgsql security definer set search_path=public as $$
declare activity_total integer; completed_total integer; objective_row public.objectives%rowtype; actor_name text;
begin
  select * into objective_row from public.objectives where id=new.objective_id;
  if objective_row.visibility <> 'shared' then return new; end if;
  select count(*) into activity_total from public.objective_activities where objective_id=new.objective_id;
  select count(*) into completed_total from public.objective_checkins where objective_id=new.objective_id and day_key=new.day_key and completed_by=new.completed_by;
  if activity_total > 0 and completed_total = activity_total then
    select coalesce(display_name,'Alguém') into actor_name from public.profiles where id=new.completed_by;
    insert into public.notifications(user_id,title,body,objective_id,actor_id,event_key)
    select p.id,'Objetivo concluído',actor_name || ' concluiu ' || objective_row.title || ' — ' || new.day_key,objective_row.id,new.completed_by,
      objective_row.id::text || ':' || new.day_key || ':' || new.completed_by::text
    from public.profiles p where p.id<>new.completed_by
    on conflict(event_key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists objective_completion_notification on public.objective_checkins;
create trigger objective_completion_notification
after insert on public.objective_checkins
for each row execute function public.notify_shared_objective_completion();

create index if not exists records_company_module_idx on public.records(company_id,module);
create index if not exists transactions_company_date_idx on public.transactions(company_id,transaction_date desc);
create index if not exists events_start_idx on public.events(starts_at);
create index if not exists objective_activities_objective_idx on public.objective_activities(objective_id,position);
create index if not exists objective_checkins_objective_day_idx on public.objective_checkins(objective_id,day_key);
