-- Nexo ERP v1.10.0 — endurecimento de segurança
revoke all on public.records,public.transactions,public.events,public.goals,
  public.objectives,public.objective_activities,public.objective_checkins,
  public.products,public.customers,public.orders,public.order_items,
  public.financial_accounts,public.activity_logs from anon;

alter table public.records force row level security;
alter table public.transactions force row level security;
alter table public.events force row level security;
alter table public.products force row level security;
alter table public.customers force row level security;
alter table public.orders force row level security;
alter table public.order_items force row level security;
alter table public.financial_accounts force row level security;
alter table public.activity_logs force row level security;

drop policy if exists "authenticated upload product images" on storage.objects;
drop policy if exists "authenticated manage product images" on storage.objects;
drop policy if exists "authenticated delete product images" on storage.objects;
create policy "users upload own product images" on storage.objects
for insert to authenticated with check(
  bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text
);
create policy "users update own product images" on storage.objects
for update to authenticated using(
  bucket_id='product-images' and owner_id=auth.uid()::text
);
create policy "users delete own product images" on storage.objects
for delete to authenticated using(
  bucket_id='product-images' and owner_id=auth.uid()::text
);

revoke execute on function public.create_integrated_order(uuid,uuid,text,text,jsonb) from anon;
revoke execute on function public.cancel_integrated_order(uuid) from anon;
revoke execute on function public.pay_integrated_order(uuid) from anon;
revoke execute on function public.settle_financial_account(uuid) from anon;
