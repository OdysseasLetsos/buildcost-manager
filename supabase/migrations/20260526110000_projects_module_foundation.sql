alter table public.projects
add column if not exists client_name text,
add column if not exists location text,
add column if not exists budget_amount numeric,
add column if not exists start_date date,
add column if not exists end_date date,
add column if not exists notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_status_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_status_check
    check (status in ('active', 'in_progress', 'completed', 'archived'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_budget_amount_non_negative'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_budget_amount_non_negative
    check (budget_amount is null or budget_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_date_order'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_date_order
    check (end_date is null or start_date is null or end_date >= start_date);
  end if;
end;
$$;

create index if not exists projects_company_status_idx
on public.projects(company_id, status);

create index if not exists projects_company_code_idx
on public.projects(company_id, code);

alter table public.projects enable row level security;

drop policy if exists "Members can read projects" on public.projects;
drop policy if exists "Members can create projects" on public.projects;
drop policy if exists "Members can update projects" on public.projects;
drop policy if exists "Members can delete projects" on public.projects;
drop policy if exists projects_select_active_company_members on public.projects;
drop policy if exists projects_insert_owner_admin_office on public.projects;
drop policy if exists projects_update_owner_admin_office on public.projects;

create policy projects_select_active_company_members
on public.projects for select
to authenticated
using (public.is_company_member(company_id));

create policy projects_insert_owner_admin_office
on public.projects for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy projects_update_owner_admin_office
on public.projects for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));
