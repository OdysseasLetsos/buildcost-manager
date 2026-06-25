create table if not exists public.employee_project_contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  contract_amount numeric not null default 0,
  notes text,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employee_project_contracts_amount_non_negative'
      and conrelid = 'public.employee_project_contracts'::regclass
  ) then
    alter table public.employee_project_contracts
    add constraint employee_project_contracts_amount_non_negative
    check (contract_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employee_project_contracts_status_check'
      and conrelid = 'public.employee_project_contracts'::regclass
  ) then
    alter table public.employee_project_contracts
    add constraint employee_project_contracts_status_check
    check (status in ('active', 'completed', 'cancelled'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employee_project_contracts_company_employee_project_key'
      and conrelid = 'public.employee_project_contracts'::regclass
  ) then
    alter table public.employee_project_contracts
    add constraint employee_project_contracts_company_employee_project_key
    unique (company_id, employee_id, project_id);
  end if;
end;
$$;

create index if not exists employee_project_contracts_company_idx
on public.employee_project_contracts(company_id);

create index if not exists employee_project_contracts_company_employee_idx
on public.employee_project_contracts(company_id, employee_id);

create index if not exists employee_project_contracts_company_project_idx
on public.employee_project_contracts(company_id, project_id);

create index if not exists employee_project_contracts_company_status_idx
on public.employee_project_contracts(company_id, status);

alter table public.employee_project_contracts enable row level security;

drop policy if exists employee_project_contracts_select_company_members
on public.employee_project_contracts;
drop policy if exists employee_project_contracts_insert_owner_admin_office
on public.employee_project_contracts;
drop policy if exists employee_project_contracts_update_owner_admin_office
on public.employee_project_contracts;
drop policy if exists employee_project_contracts_delete_owner_admin_office
on public.employee_project_contracts;

create policy employee_project_contracts_select_company_members
on public.employee_project_contracts for select
to authenticated
using (public.is_company_member(company_id));

create policy employee_project_contracts_insert_owner_admin_office
on public.employee_project_contracts for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_project_contracts_update_owner_admin_office
on public.employee_project_contracts for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_project_contracts_delete_owner_admin_office
on public.employee_project_contracts for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

grant select, insert, update, delete on public.employee_project_contracts to authenticated;
