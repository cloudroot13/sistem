-- Nexo ERP v1.4.0 — contas a pagar e receber
create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  description text not null, category text not null default 'Geral',
  type text not null check(type in ('Pagar','Receber')),
  amount numeric(14,2) not null check(amount>0), due_date date not null,
  status text not null default 'Pendente' check(status in ('Pendente','Baixado','Cancelado')),
  recurrence text not null default 'Nenhuma' check(recurrence in ('Nenhuma','Mensal','Anual')),
  installment integer not null default 1, installment_total integer not null default 1,
  settled_at timestamptz, created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.financial_accounts enable row level security;
create policy "members manage financial accounts" on public.financial_accounts for all to authenticated
using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create index if not exists financial_accounts_due_idx on public.financial_accounts(company_id,due_date);

create or replace function public.settle_financial_account(requested_account uuid)
returns void language plpgsql security definer set search_path=public as $$
declare account_row public.financial_accounts%rowtype;
begin
  select * into account_row from public.financial_accounts where id=requested_account for update;
  if not found or not public.is_company_member(account_row.company_id) then raise exception 'Conta inválida'; end if;
  if account_row.status<>'Pendente' then raise exception 'Conta já processada'; end if;
  insert into public.transactions(company_id,description,category,type,amount,transaction_date,status,created_by)
  values(account_row.company_id,account_row.description,account_row.category,
    case when account_row.type='Receber' then 'Entrada' else 'Saída' end,
    account_row.amount,current_date,'Pago',auth.uid());
  update public.financial_accounts set status='Baixado',settled_at=now() where id=requested_account;
end $$;
grant execute on function public.settle_financial_account(uuid) to authenticated;
