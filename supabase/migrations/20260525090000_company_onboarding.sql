create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null,
  token text not null unique,
  status text not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint company_invitations_email_not_empty check (length(trim(email)) > 0),
  constraint company_invitations_role_not_empty check (length(trim(role)) > 0),
  constraint company_invitations_status_check check (
    status in ('pending', 'accepted', 'expired', 'revoked')
  )
);

alter table public.company_members
add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_members_status_check'
      and conrelid = 'public.company_members'::regclass
  ) then
    alter table public.company_members
    add constraint company_members_status_check
    check (status in ('active', 'invited', 'suspended'));
  end if;
end;
$$;

create index if not exists company_invitations_company_id_idx
on public.company_invitations(company_id);

create index if not exists company_invitations_email_idx
on public.company_invitations(email);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profiles_set_updated_at'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

create or replace function public.current_user_company_role(target_company_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.company_members cm
  join public.roles r on r.id = cm.role_id
  where cm.company_id = target_company_id
    and cm.user_id = auth.uid()
    and cm.status = 'active'
  limit 1;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created_create_profile'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created_create_profile
    after insert on auth.users
    for each row execute function public.handle_new_user_profile();
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.company_invitations enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can create their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can read company invitations"
on public.company_invitations for select
to authenticated
using (public.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Admins can create company invitations"
on public.company_invitations for insert
to authenticated
with check (public.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Admins can update company invitations"
on public.company_invitations for update
to authenticated
using (public.current_user_company_role(company_id) in ('owner', 'admin'))
with check (public.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Admins can delete company invitations"
on public.company_invitations for delete
to authenticated
using (public.current_user_company_role(company_id) in ('owner', 'admin'));

create or replace function public.create_company_for_current_user(
  company_name text,
  company_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  owner_role_id uuid;
  default_plan_id uuid;
  new_company_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if length(trim(company_name)) = 0 then
    raise exception 'Company name is required.';
  end if;

  if length(trim(company_slug)) = 0 then
    raise exception 'Company slug is required.';
  end if;

  select id into owner_role_id
  from public.roles
  where code = 'owner';

  if owner_role_id is null then
    raise exception 'Owner role is missing.';
  end if;

  select id into default_plan_id
  from public.plans
  where code = 'basic';

  insert into public.companies (name, slug, plan_id, created_by)
  values (trim(company_name), trim(company_slug), default_plan_id, current_user_id)
  returning id into new_company_id;

  insert into public.company_members (
    company_id,
    user_id,
    role_id,
    status,
    created_by
  )
  values (
    new_company_id,
    current_user_id,
    owner_role_id,
    'active',
    current_user_id
  );

  return new_company_id;
end;
$$;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.company_invitations to authenticated;
grant execute on function public.create_company_for_current_user(text, text)
to authenticated;
