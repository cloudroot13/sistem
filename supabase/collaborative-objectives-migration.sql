-- Execute uma vez no SQL Editor após objectives-migration.sql.
-- Habilita objetivos individuais/conjuntos, progresso por pessoa e notificações.

alter table public.objectives
  add column if not exists visibility text not null default 'individual';
alter table public.objectives drop constraint if exists objectives_visibility_check;
alter table public.objectives
  add constraint objectives_visibility_check
  check (visibility in ('individual','shared'));

alter table public.notifications
  add column if not exists objective_id uuid,
  add column if not exists actor_id uuid references auth.users(id),
  add column if not exists event_key text;
drop index if exists public.notifications_event_key_idx;
create unique index notifications_event_key_idx
  on public.notifications(event_key);

-- Nunca armazene credenciais digitadas. Remove a estrutura antiga, se existir.
drop table if exists public.login_attempts;

alter table public.objective_checkins
  drop constraint if exists objective_checkins_activity_id_day_key_key;
alter table public.objective_checkins
  drop constraint if exists objective_checkins_activity_id_day_key_completed_by_key;
alter table public.objective_checkins
  add constraint objective_checkins_activity_id_day_key_completed_by_key
  unique(activity_id,day_key,completed_by);

drop policy if exists "users view own profile" on public.profiles;
drop policy if exists "authenticated view profiles" on public.profiles;
create policy "authenticated view profiles" on public.profiles
  for select to authenticated using(true);

drop policy if exists "authenticated view objectives" on public.objectives;
drop policy if exists "view permitted objectives" on public.objectives;
create policy "view permitted objectives" on public.objectives
  for select to authenticated
  using(visibility='shared' or created_by=auth.uid());

drop policy if exists "authenticated view objective activities" on public.objective_activities;
drop policy if exists "view permitted objective activities" on public.objective_activities;
create policy "view permitted objective activities" on public.objective_activities
  for select to authenticated using(
    exists(select 1 from public.objectives o where o.id=objective_id
      and (o.visibility='shared' or o.created_by=auth.uid()))
  );

drop policy if exists "authenticated view objective checkins" on public.objective_checkins;
drop policy if exists "authenticated create objective checkins" on public.objective_checkins;
drop policy if exists "authenticated delete objective checkins" on public.objective_checkins;
drop policy if exists "view permitted objective checkins" on public.objective_checkins;
drop policy if exists "create own objective checkins" on public.objective_checkins;
drop policy if exists "delete own objective checkins" on public.objective_checkins;
create policy "view permitted objective checkins" on public.objective_checkins
  for select to authenticated using(
    exists(select 1 from public.objectives o where o.id=objective_id
      and (o.visibility='shared' or o.created_by=auth.uid()))
  );
create policy "create own objective checkins" on public.objective_checkins
  for insert to authenticated with check(
    completed_by=auth.uid() and exists(
      select 1 from public.objectives o where o.id=objective_id
      and (o.visibility='shared' or o.created_by=auth.uid())
    )
  );
create policy "delete own objective checkins" on public.objective_checkins
  for delete to authenticated using(completed_by=auth.uid());

create or replace function public.notify_shared_objective_completion()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  activity_total integer;
  completed_total integer;
  objective_row public.objectives%rowtype;
  actor_name text;
begin
  select * into objective_row from public.objectives where id=new.objective_id;
  if objective_row.visibility <> 'shared' then return new; end if;

  select count(*) into activity_total
  from public.objective_activities where objective_id=new.objective_id;
  select count(*) into completed_total
  from public.objective_checkins
  where objective_id=new.objective_id
    and day_key=new.day_key
    and completed_by=new.completed_by;

  if activity_total > 0 and completed_total = activity_total then
    select coalesce(display_name,'Alguém') into actor_name
    from public.profiles where id=new.completed_by;

    insert into public.notifications(
      user_id,title,body,objective_id,actor_id,event_key
    )
    select
      p.id,
      'Objetivo concluído',
      actor_name || ' concluiu ' || objective_row.title || ' — ' || new.day_key,
      objective_row.id,
      new.completed_by,
      objective_row.id::text || ':' || new.day_key || ':' || new.completed_by::text
    from public.profiles p
    where p.id<>new.completed_by
    on conflict(event_key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists objective_completion_notification
  on public.objective_checkins;
create trigger objective_completion_notification
after insert on public.objective_checkins
for each row execute function public.notify_shared_objective_completion();

-- Realtime para que o sino atualize sem recarregar a página.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
