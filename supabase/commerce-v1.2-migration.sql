-- Nexo ERP v1.2.0 — carrinho e cancelamento transacional
alter table public.transactions
  add column if not exists source_order_id uuid references public.orders(id) on delete set null;
create unique index if not exists transactions_source_order_idx
  on public.transactions(source_order_id) where source_order_id is not null;

create or replace function public.create_integrated_order(
  requested_company uuid, requested_customer uuid, requested_payment text,
  requested_status text, requested_items jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare new_order uuid; line jsonb; product_row public.products%rowtype; total_value numeric(14,2):=0; requested_quantity integer;
begin
  if not public.is_company_member(requested_company) then raise exception 'Acesso negado'; end if;
  if jsonb_array_length(requested_items)=0 then raise exception 'Pedido sem itens'; end if;
  if requested_customer is not null and not exists(
    select 1 from public.customers where id=requested_customer and company_id=requested_company
  ) then raise exception 'Cliente inválido'; end if;
  insert into public.orders(company_id,customer_id,payment_method,status,created_by)
  values(requested_company,requested_customer,requested_payment,requested_status,auth.uid()) returning id into new_order;
  for line in select * from jsonb_array_elements(requested_items) loop
    requested_quantity:=(line->>'quantity')::integer;
    if requested_quantity<1 then raise exception 'Quantidade inválida'; end if;
    select * into product_row from public.products
      where id=(line->>'product_id')::uuid and company_id=requested_company for update;
    if not found then raise exception 'Produto inválido'; end if;
    if requested_status<>'Pendente' and product_row.stock<requested_quantity then
      raise exception 'Estoque insuficiente para %',product_row.name;
    end if;
    insert into public.order_items(order_id,product_id,quantity,unit_price)
      values(new_order,product_row.id,requested_quantity,product_row.price);
    total_value:=total_value+product_row.price*requested_quantity;
    if requested_status<>'Pendente' then
      update public.products set stock=stock-requested_quantity,updated_at=now() where id=product_row.id;
    end if;
  end loop;
  update public.orders set total=total_value where id=new_order;
  if requested_status<>'Pendente' then
    insert into public.transactions(company_id,description,category,type,amount,transaction_date,status,created_by,source_order_id)
    values(requested_company,'Pedido #'||(select order_number from public.orders where id=new_order),
      'Pedidos','Entrada',total_value,current_date,'Pago',auth.uid(),new_order);
  end if;
  return new_order;
end $$;

create or replace function public.cancel_integrated_order(requested_order uuid)
returns void language plpgsql security definer set search_path=public as $$
declare order_row public.orders%rowtype; line record;
begin
  select * into order_row from public.orders where id=requested_order for update;
  if not found or not public.is_company_member(order_row.company_id) then raise exception 'Pedido inválido'; end if;
  if order_row.status='Cancelado' then return; end if;
  if order_row.status<>'Pendente' then
    for line in select product_id,quantity from public.order_items where order_id=requested_order loop
      update public.products set stock=stock+line.quantity,updated_at=now() where id=line.product_id;
    end loop;
    delete from public.transactions where source_order_id=requested_order;
  end if;
  update public.orders set status='Cancelado' where id=requested_order;
end $$;
grant execute on function public.cancel_integrated_order(uuid) to authenticated;
