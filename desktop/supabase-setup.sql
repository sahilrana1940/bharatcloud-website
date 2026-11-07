-- BharatCloud desktop workspace
-- Run this entire script in the Supabase SQL editor.
-- Then create Auth users (Authentication → Users → Add user):
--   admin@bharatcloud.in
--   payment@bharatcloud.in
--   ramesh@bharatcloud.in
-- Email confirmations can stay off for a private workspace so sign-in works immediately.

create extension if not exists pgcrypto;

create sequence if not exists public.emp_id_seq start with 1001;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'payment', 'employee', 'blocked')),
  emp_id text unique,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  emp_id text primary key,
  full_name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint employees_company_email check (lower(split_part(email, '@', 2)) = 'bharatcloud.in')
);

-- First successful employee login writes one row. Later logins do not overwrite it.
-- No update or delete grants are issued for this table.
create table if not exists public.emp_backup (
  id uuid primary key default gen_random_uuid(),
  emp_id text not null,
  email text not null unique,
  login_time timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  employee_email text not null,
  employee_name text not null default '',
  amount_inr numeric(12, 2) not null check (amount_inr >= 0),
  status text not null check (status in ('paid', 'pending')),
  note text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  file_name text not null,
  file_type text not null default 'file',
  mime_type text not null default '',
  storage_path text not null unique,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  link_sharing boolean not null default false check (link_sharing = false),
  created_at timestamptz not null default now()
);

create table if not exists public.drive_shares (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads (id) on delete cascade,
  owner_email text not null,
  shared_with text not null,
  created_at timestamptz not null default now(),
  unique (upload_id, shared_with),
  constraint drive_share_company_only check (lower(split_part(shared_with, '@', 2)) = 'bharatcloud.in')
);

create table if not exists public.mails (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  folder text not null check (folder in ('inbox', 'sent')),
  from_email text not null,
  to_email text not null,
  subject text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  constraint mail_company_recipient check (lower(split_part(to_email, '@', 2)) = 'bharatcloud.in')
);

create table if not exists public.mail_backups (
  id uuid primary key default gen_random_uuid(),
  mail_id uuid not null references public.mails (id) on delete cascade,
  owner_email text not null,
  subject text not null default '',
  backed_up_at timestamptz not null default now()
);

create table if not exists public.mail_forwards (
  id uuid primary key default gen_random_uuid(),
  mail_id uuid not null references public.mails (id) on delete cascade,
  from_email text not null,
  to_email text not null,
  created_at timestamptz not null default now(),
  constraint forward_company_only check (lower(split_part(to_email, '@', 2)) = 'bharatcloud.in'),
  constraint forward_blocks_public_mail check (
    lower(split_part(to_email, '@', 2)) not in (
      'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'ymail.com', 'rocketmail.com'
    )
  )
);

create or replace function public.current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_email() = 'admin@bharatcloud.in'
$$;

create or replace function public.is_payment_admin()
returns boolean
language sql
stable
as $$
  select public.current_email() = 'payment@bharatcloud.in'
$$;

create or replace function public.is_employee()
returns boolean
language sql
stable
as $$
  select public.current_email() like '%@bharatcloud.in'
    and public.current_email() not in ('admin@bharatcloud.in', 'payment@bharatcloud.in')
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  em text := lower(new.email);
  assigned_role text;
  eid text;
  person_name text;
begin
  if em = 'admin@bharatcloud.in' then
    assigned_role := 'admin';
  elsif em = 'payment@bharatcloud.in' then
    assigned_role := 'payment';
  elsif split_part(em, '@', 2) = 'bharatcloud.in' then
    assigned_role := 'employee';
  else
    assigned_role := 'blocked';
  end if;

  person_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(em, '@', 1));

  if assigned_role = 'employee' then
    select emp_id into eid from public.employees where email = em;
    if eid is null then
      eid := 'EMP-' || lpad(nextval('public.emp_id_seq')::text, 4, '0');
      insert into public.employees (emp_id, full_name, email)
      values (eid, person_name, em);
    end if;
  end if;

  insert into public.profiles (id, email, role, emp_id, full_name)
  values (new.id, em, assigned_role, eid, person_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.backup_emp_first_login()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  em text := public.current_email();
  eid text;
  inserted_id uuid;
begin
  if not public.is_employee() then
    return jsonb_build_object('backed_up', false, 'reason', 'not_employee');
  end if;

  select emp_id into eid from public.employees where email = em;
  if eid is null then
    select emp_id into eid from public.profiles where email = em;
  end if;
  if eid is null then
    eid := 'EMP-' || lpad(nextval('public.emp_id_seq')::text, 4, '0');
    insert into public.employees (emp_id, full_name, email)
    values (eid, split_part(em, '@', 1), em);
  end if;

  insert into public.emp_backup (emp_id, email, login_time)
  values (eid, em, now())
  on conflict (email) do nothing
  returning id into inserted_id;

  return jsonb_build_object(
    'backed_up', inserted_id is not null,
    'emp_id', eid,
    'email', em
  );
end;
$$;

create or replace function public.create_employee(p_name text, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  em text := lower(trim(p_email));
  eid text;
begin
  if not public.is_admin() then
    raise exception 'Only the admin dashboard can create employees';
  end if;
  if split_part(em, '@', 2) <> 'bharatcloud.in' then
    raise exception 'Employee email must be @bharatcloud.in';
  end if;
  if em in ('admin@bharatcloud.in', 'payment@bharatcloud.in') then
    raise exception 'That mailbox is reserved';
  end if;
  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Employee name is required';
  end if;

  select emp_id into eid from public.employees where email = em;
  if eid is not null then
    return eid;
  end if;

  eid := 'EMP-' || lpad(nextval('public.emp_id_seq')::text, 4, '0');
  insert into public.employees (emp_id, full_name, email)
  values (eid, trim(p_name), em);
  return eid;
end;
$$;

create or replace function public.record_payment(
  p_email text,
  p_name text,
  p_amount numeric,
  p_status text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  em text := lower(trim(p_email));
  new_id uuid;
begin
  if not public.is_payment_admin() then
    raise exception 'Only the payment dashboard can record payments';
  end if;
  if p_status not in ('paid', 'pending') then
    raise exception 'Status must be paid or pending';
  end if;
  if coalesce(p_amount, 0) < 0 then
    raise exception 'Amount cannot be negative';
  end if;

  insert into public.payments (employee_email, employee_name, amount_inr, status, note, paid_at)
  values (
    em,
    coalesce(nullif(trim(p_name), ''), split_part(em, '@', 1)),
    p_amount,
    p_status,
    coalesce(p_note, ''),
    case when p_status = 'paid' then now() else null end
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.send_company_mail(p_to text, p_subject text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sender text := public.current_email();
  recipient text := lower(trim(p_to));
begin
  if not public.is_employee() then
    raise exception 'Only employees can send mail';
  end if;
  if split_part(recipient, '@', 2) <> 'bharatcloud.in' then
    raise exception 'Mail can go only to @bharatcloud.in';
  end if;
  if length(trim(coalesce(p_subject, ''))) = 0 or length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'Subject and message are required';
  end if;

  insert into public.mails (owner_email, folder, from_email, to_email, subject, body)
  values (sender, 'sent', sender, recipient, trim(p_subject), trim(p_body));

  insert into public.mails (owner_email, folder, from_email, to_email, subject, body)
  values (recipient, 'inbox', sender, recipient, trim(p_subject), trim(p_body));
end;
$$;

create or replace function public.forward_company_mail(p_mail_id uuid, p_to text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sender text := public.current_email();
  recipient text := lower(trim(p_to));
  original public.mails%rowtype;
begin
  if not public.is_employee() then
    raise exception 'Only employees can forward mail';
  end if;
  if split_part(recipient, '@', 2) <> 'bharatcloud.in' then
    raise exception 'Forwarding outside @bharatcloud.in is blocked';
  end if;

  select * into original
  from public.mails
  where id = p_mail_id and owner_email = sender;
  if not found then
    raise exception 'Mail not found';
  end if;

  insert into public.mail_forwards (mail_id, from_email, to_email)
  values (original.id, sender, recipient);

  insert into public.mails (owner_email, folder, from_email, to_email, subject, body)
  values (
    recipient,
    'inbox',
    sender,
    recipient,
    case when original.subject like 'Fwd:%' then original.subject else 'Fwd: ' || original.subject end,
    original.body
  );
end;
$$;

create or replace function public.mark_payment_paid(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_payment_admin() then
    raise exception 'Only the payment dashboard can update payments';
  end if;
  update public.payments
    set status = 'paid', paid_at = coalesce(paid_at, now())
    where id = p_id and status = 'pending';
end;
$$;

create or replace function public.backup_mail_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mail_backups (mail_id, owner_email, subject, backed_up_at)
  values (new.id, new.owner_email, new.subject, now());
  return new;
end;
$$;

drop trigger if exists mails_auto_backup on public.mails;
create trigger mails_auto_backup
  after insert on public.mails
  for each row execute function public.backup_mail_row();

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.emp_backup enable row level security;
alter table public.payments enable row level security;
alter table public.uploads enable row level security;
alter table public.drive_shares enable row level security;
alter table public.mails enable row level security;
alter table public.mail_backups enable row level security;
alter table public.mail_forwards enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (email = public.current_email() or public.is_admin());

drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (public.is_admin() or email = public.current_email());

drop policy if exists emp_backup_select_own on public.emp_backup;
create policy emp_backup_select_own on public.emp_backup
  for select to authenticated
  using (email = public.current_email() or public.is_admin());

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (public.is_payment_admin());

drop policy if exists uploads_select on public.uploads;
create policy uploads_select on public.uploads
  for select to authenticated
  using (
    public.is_admin()
    or owner_email = public.current_email()
    or exists (
      select 1 from public.drive_shares s
      where s.upload_id = uploads.id and s.shared_with = public.current_email()
    )
  );

drop policy if exists uploads_insert on public.uploads;
create policy uploads_insert on public.uploads
  for insert to authenticated
  with check (
    public.is_employee()
    and owner_email = public.current_email()
    and link_sharing = false
  );

drop policy if exists uploads_delete_own on public.uploads;
create policy uploads_delete_own on public.uploads
  for delete to authenticated
  using (public.is_employee() and owner_email = public.current_email());

drop policy if exists shares_select on public.drive_shares;
create policy shares_select on public.drive_shares
  for select to authenticated
  using (
    public.is_admin()
    or owner_email = public.current_email()
    or shared_with = public.current_email()
  );

drop policy if exists shares_insert on public.drive_shares;
create policy shares_insert on public.drive_shares
  for insert to authenticated
  with check (
    public.is_employee()
    and owner_email = public.current_email()
    and lower(split_part(shared_with, '@', 2)) = 'bharatcloud.in'
  );

drop policy if exists mails_select on public.mails;
create policy mails_select on public.mails
  for select to authenticated
  using (owner_email = public.current_email() or public.is_admin());

drop policy if exists mails_insert on public.mails;
create policy mails_insert on public.mails
  for insert to authenticated
  with check (
    owner_email = public.current_email()
    and public.is_employee()
    and lower(split_part(to_email, '@', 2)) = 'bharatcloud.in'
  );

drop policy if exists mail_backups_select on public.mail_backups;
create policy mail_backups_select on public.mail_backups
  for select to authenticated
  using (owner_email = public.current_email() or public.is_admin());

drop policy if exists forwards_select on public.mail_forwards;
create policy forwards_select on public.mail_forwards
  for select to authenticated
  using (from_email = public.current_email());

drop policy if exists forwards_insert on public.mail_forwards;
create policy forwards_insert on public.mail_forwards
  for insert to authenticated
  with check (
    public.is_employee()
    and from_email = public.current_email()
    and lower(split_part(to_email, '@', 2)) = 'bharatcloud.in'
  );

revoke all on public.emp_backup from anon, authenticated;
grant select on public.emp_backup to authenticated;

revoke update, delete on public.mail_backups from anon, authenticated;
grant select on public.mail_backups to authenticated;

grant select, insert, delete on public.uploads to authenticated;
grant select, insert on public.drive_shares to authenticated;
grant select, insert on public.mails to authenticated;
grant select, insert on public.mail_forwards to authenticated;
grant select on public.profiles to authenticated;
grant select on public.employees to authenticated;
grant select on public.payments to authenticated;

grant execute on function public.backup_emp_first_login() to authenticated;
grant execute on function public.create_employee(text, text) to authenticated;
grant execute on function public.record_payment(text, text, numeric, text, text) to authenticated;
grant execute on function public.mark_payment_paid(uuid) to authenticated;
grant execute on function public.send_company_mail(text, text, text) to authenticated;
grant execute on function public.forward_company_mail(uuid, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('drive', 'drive', false)
on conflict (id) do update set public = false;

drop policy if exists drive_owner_read on storage.objects;
create policy drive_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'drive'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_email()
      or exists (
        select 1
        from public.uploads u
        join public.drive_shares s on s.upload_id = u.id
        where u.storage_path = name
          and s.shared_with = public.current_email()
      )
    )
  );

drop policy if exists drive_owner_insert on storage.objects;
create policy drive_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'drive'
    and public.is_employee()
    and (storage.foldername(name))[1] = public.current_email()
  );

drop policy if exists drive_owner_delete on storage.objects;
create policy drive_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'drive'
    and public.is_employee()
    and (storage.foldername(name))[1] = public.current_email()
  );

insert into public.employees (emp_id, full_name, email)
values
  ('EMP-1001', 'Ramesh Kumar', 'ramesh@bharatcloud.in'),
  ('EMP-1002', 'Priya Nair', 'priya@bharatcloud.in')
on conflict (email) do nothing;

select setval('public.emp_id_seq', greatest(1002, (select last_value from public.emp_id_seq)));

insert into public.payments (employee_email, employee_name, amount_inr, status, note, paid_at, created_at)
select * from (values
  ('ramesh@bharatcloud.in', 'Ramesh Kumar', 4990::numeric, 'paid', 'April workspace', now() - interval '12 days', now() - interval '20 days'),
  ('priya@bharatcloud.in', 'Priya Nair', 4990::numeric, 'pending', 'April workspace', null::timestamptz, now() - interval '6 days'),
  ('amit@bharatcloud.in', 'Amit Shah', 9990::numeric, 'paid', 'Annual seat', now() - interval '40 days', now() - interval '48 days'),
  ('neha@bharatcloud.in', 'Neha Kulkarni', 4990::numeric, 'pending', 'May workspace', null::timestamptz, now() - interval '1 day')
) as seed(employee_email, employee_name, amount_inr, status, note, paid_at, created_at)
where not exists (select 1 from public.payments);
