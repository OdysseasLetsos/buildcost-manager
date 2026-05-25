-- Harden tenant RLS for the foundational user/company tables.
-- These helpers run as SECURITY DEFINER to avoid recursive RLS checks on
-- company_members while still deriving access exclusively from auth.uid().

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

create or replace function public.has_company_role(
  target_company_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    join public.roles r on r.id = cm.role_id
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and r.code = any(allowed_roles)
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

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_invitations enable row level security;

-- Replace earlier bootstrap policies with stable, explicit policy names.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Members can read their companies" on public.companies;
drop policy if exists "Members can update their companies" on public.companies;

drop policy if exists "Members can read company memberships" on public.company_members;
drop policy if exists "Admins can manage company memberships" on public.company_members;

drop policy if exists "Admins can read company invitations" on public.company_invitations;
drop policy if exists "Admins can create company invitations" on public.company_invitations;
drop policy if exists "Admins can update company invitations" on public.company_invitations;
drop policy if exists "Admins can delete company invitations" on public.company_invitations;

create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy companies_select_active_members
on public.companies for select
to authenticated
using (public.is_company_member(id));

create policy companies_update_owner_admin
on public.companies for update
to authenticated
using (public.has_company_role(id, array['owner', 'admin']))
with check (public.has_company_role(id, array['owner', 'admin']));

create policy company_members_select_same_company_active_members
on public.company_members for select
to authenticated
using (
  status = 'active'
  and public.is_company_member(company_id)
);

create policy company_members_update_owner_admin
on public.company_members for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']))
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_invitations_select_owner_admin
on public.company_invitations for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_invitations_insert_owner_admin
on public.company_invitations for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_invitations_update_owner_admin
on public.company_invitations for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']))
with check (public.has_company_role(company_id, array['owner', 'admin']));

create policy company_invitations_delete_owner_admin
on public.company_invitations for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']));

-- Narrow direct table privileges. The onboarding SECURITY DEFINER RPC can still
-- create the initial company/member rows without exposing direct inserts.
revoke insert, delete on public.companies from authenticated;
revoke insert, delete on public.company_members from authenticated;
revoke update on public.company_members from authenticated;

grant update (role_id, status, updated_at) on public.company_members to authenticated;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.has_company_role(uuid, text[]) to authenticated;
grant execute on function public.current_user_company_role(uuid) to authenticated;
