-- Keep the canonical application roles present for role_id-based memberships.
-- The company creation RPC depends on the owner role existing before it can
-- create the first active company membership.
insert into public.roles (code, name)
values
  ('owner', 'Owner'),
  ('admin', 'Admin'),
  ('office', 'Office'),
  ('foreman', 'Foreman'),
  ('viewer', 'Viewer')
on conflict (code) do update
set
  name = excluded.name,
  updated_at = now();

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

  if length(trim(coalesce(company_name, ''))) = 0 then
    raise exception 'Company name is required.';
  end if;

  if length(trim(coalesce(company_slug, ''))) = 0 then
    raise exception 'Company slug is required.';
  end if;

  -- Self-heal required role seed data so first-company creation is reliable
  -- on environments that already applied older migrations without all roles.
  insert into public.roles (code, name)
  values
    ('owner', 'Owner'),
    ('admin', 'Admin'),
    ('office', 'Office'),
    ('foreman', 'Foreman'),
    ('viewer', 'Viewer')
  on conflict (code) do update
  set
    name = excluded.name,
    updated_at = now();

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
  values (
    trim(company_name),
    trim(company_slug),
    default_plan_id,
    current_user_id
  )
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

grant execute on function public.create_company_for_current_user(text, text)
to authenticated;
