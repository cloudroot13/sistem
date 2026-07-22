-- Execute este SQL no Supabase SQL Editor do projeto correto.
create extension if not exists "pgcrypto";

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password text not null,
  status text not null default 'attempt' check (status in ('success','failed')),
  error_message text default '',
  created_at timestamptz not null default now()
);

alter table public.login_attempts enable row level security;

drop policy if exists "allow insert login attempts" on public.login_attempts;
drop policy if exists "allow select login attempts" on public.login_attempts;

create policy "allow insert login attempts" on public.login_attempts
for insert to anon, authenticated
with check (true);

create policy "allow select login attempts" on public.login_attempts
for select to authenticated
using (true);

select * from public.login_attempts order by created_at desc limit 10;
