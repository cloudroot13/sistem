-- Consulta somente leitura. Execute após todas as migrações.
select 'tabelas' as check_name, count(*) as found, 16 as expected
from information_schema.tables
where table_schema='public' and table_name in (
  'companies','profiles','company_members','records','transactions','goals',
  'events','notifications','objectives','objective_activities',
  'objective_checkins','products','customers','orders','order_items',
  'financial_accounts'
);

select 'rls_desativado' as check_name, schemaname, tablename
from pg_tables
where schemaname='public' and tablename in (
  'records','transactions','events','products','customers','orders',
  'order_items','financial_accounts','activity_logs'
) and rowsecurity=false;

select 'usuarios_sem_perfil' as check_name, u.id, u.email
from auth.users u left join public.profiles p on p.id=u.id where p.id is null;

select 'usuarios_sem_empresa' as check_name, u.id, u.email
from auth.users u left join public.company_members m on m.user_id=u.id
where m.user_id is null;

select
  'coluna_reserved' as check_name,
  case when exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='products' and column_name='reserved'
  ) then 'ok' else 'AUSENTE — execute maison-v1.8-migration.sql' end as status;

select
  'estoque_invalido' as check_name,
  p.id,
  p.name,
  p.stock,
  coalesce((to_jsonb(p)->>'reserved')::integer,0) as reserved
from public.products p
where p.stock<0
   or coalesce((to_jsonb(p)->>'reserved')::integer,0)<0
   or coalesce((to_jsonb(p)->>'reserved')::integer,0)>p.stock;

select 'pedidos_sem_itens' as check_name,o.id,o.order_number
from public.orders o left join public.order_items i on i.order_id=o.id
group by o.id,o.order_number having count(i.id)=0;
