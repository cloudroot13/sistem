-- Nexo ERP v1.3.0 — confirmação segura de pedidos pendentes
create or replace function public.pay_integrated_order(requested_order uuid)
returns void language plpgsql security definer set search_path=public as $$
declare order_row public.orders%rowtype; line record;
begin
  select * into order_row from public.orders where id=requested_order for update;
  if not found or not public.is_company_member(order_row.company_id) then raise exception 'Pedido inválido'; end if;
  if order_row.status<>'Pendente' then raise exception 'Somente pedidos pendentes podem ser pagos'; end if;
  for line in
    select oi.product_id,oi.quantity,p.name,p.stock
    from public.order_items oi join public.products p on p.id=oi.product_id
    where oi.order_id=requested_order for update of p
  loop
    if line.stock<line.quantity then raise exception 'Estoque insuficiente para %',line.name; end if;
    update public.products set stock=stock-line.quantity,updated_at=now() where id=line.product_id;
  end loop;
  update public.orders set status='Pago' where id=requested_order;
  insert into public.transactions(company_id,description,category,type,amount,transaction_date,status,created_by,source_order_id)
  values(order_row.company_id,'Pedido #'||order_row.order_number,'Pedidos','Entrada',
    order_row.total,current_date,'Pago',auth.uid(),requested_order);
end $$;
grant execute on function public.pay_integrated_order(uuid) to authenticated;
