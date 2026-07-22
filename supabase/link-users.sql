-- 1. Crie Gabriel e Giovanna em Authentication > Users.
-- 2. Substitua os e-mails abaixo e execute no SQL Editor.

insert into public.profiles (id, display_name)
select id, 'Gabriel' from auth.users where email = 'bielcavalcanti13@gmail.com'
on conflict (id) do update set display_name=excluded.display_name;

insert into public.profiles (id, display_name)
select id, 'Giovanna' from auth.users where email = 'giovannaac@gmail.com'
on conflict (id) do update set display_name=excluded.display_name;

insert into public.company_members (company_id,user_id,role)
select c.id,u.id,'owner' from public.companies c cross join auth.users u
where c.slug='gabriel' and u.email='bielcavalcanti13@gmail.com'
on conflict (company_id,user_id) do nothing;

insert into public.company_members (company_id,user_id,role)
select c.id,u.id,'owner' from public.companies c cross join auth.users u
where c.slug='giovanna' and u.email='giovannaac@gmail.com'
on conflict (company_id,user_id) do nothing;
