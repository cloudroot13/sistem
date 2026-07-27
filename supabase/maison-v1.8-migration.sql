-- Nexo ERP v1.8.0 — catálogo Maison G.
alter table public.products
  add column if not exists collection text not null default '',
  add column if not exists image_url text not null default '',
  add column if not exists reserved integer not null default 0 check(reserved>=0),
  add column if not exists variation text not null default '';
alter table public.products drop constraint if exists products_reserved_stock_check;
alter table public.products add constraint products_reserved_stock_check check(reserved<=stock);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true;
drop policy if exists "authenticated upload product images" on storage.objects;
drop policy if exists "public view product images" on storage.objects;
drop policy if exists "authenticated manage product images" on storage.objects;
drop policy if exists "authenticated delete product images" on storage.objects;
create policy "authenticated upload product images" on storage.objects
for insert to authenticated with check(bucket_id='product-images');
create policy "public view product images" on storage.objects
for select using(bucket_id='product-images');
create policy "authenticated manage product images" on storage.objects
for update to authenticated using(bucket_id='product-images');
create policy "authenticated delete product images" on storage.objects
for delete to authenticated using(bucket_id='product-images');
