-- Nexo ERP v1.7.0 — trilha de auditoria
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check(action in ('INSERT','UPDATE','DELETE')),
  entity text not null, entity_id uuid, summary text not null default '',
  changes jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;
create policy "members view activity logs" on public.activity_logs for select to authenticated
using(company_id is null or public.is_company_member(company_id));
create index if not exists activity_logs_company_date_idx on public.activity_logs(company_id,created_at desc);

create or replace function public.audit_business_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare row_data jsonb; old_data jsonb; company uuid; record_id uuid; label text;
begin
  row_data:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  old_data:=case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  company:=nullif(row_data->>'company_id','')::uuid;
  record_id:=nullif(row_data->>'id','')::uuid;
  label:=coalesce(row_data->>'name',row_data->>'title',row_data->>'description',
    case when row_data ? 'order_number' then 'Pedido #'||(row_data->>'order_number') else tg_table_name end);
  insert into public.activity_logs(company_id,actor_id,action,entity,entity_id,summary,changes)
  values(company,auth.uid(),tg_op,tg_table_name,record_id,label,
    case when tg_op='UPDATE' then jsonb_build_object('before',old_data,'after',row_data) else row_data end);
  return case when tg_op='DELETE' then old else new end;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['products','customers','orders','transactions','financial_accounts','records','events'] loop
    execute format('drop trigger if exists %I on public.%I','audit_'||table_name,table_name);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_business_change()','audit_'||table_name,table_name);
  end loop;
end $$;
