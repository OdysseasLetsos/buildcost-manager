alter table public.employees
add column if not exists employee_type text not null default 'permanent',
add column if not exists daily_rate numeric,
add column if not exists hourly_rate numeric,
add column if not exists active boolean not null default true,
add column if not exists notes text;

update public.employees
set active = (status <> 'inactive')
where active is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_employee_type_check'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
    add constraint employees_employee_type_check
    check (employee_type in ('permanent', 'daily_worker', 'subcontractor'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_daily_rate_non_negative'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
    add constraint employees_daily_rate_non_negative
    check (daily_rate is null or daily_rate >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_hourly_rate_non_negative'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
    add constraint employees_hourly_rate_non_negative
    check (hourly_rate is null or hourly_rate >= 0);
  end if;
end;
$$;

create index if not exists employees_company_active_idx
on public.employees(company_id, active);

create index if not exists employees_company_employee_type_idx
on public.employees(company_id, employee_type);

alter table public.employees enable row level security;

drop policy if exists "Members can read employees" on public.employees;
drop policy if exists "Members can create employees" on public.employees;
drop policy if exists "Members can update employees" on public.employees;
drop policy if exists "Members can delete employees" on public.employees;
drop policy if exists employees_select_active_company_members on public.employees;
drop policy if exists employees_insert_owner_admin_office on public.employees;
drop policy if exists employees_update_owner_admin_office on public.employees;

create policy employees_select_active_company_members
on public.employees for select
to authenticated
using (public.is_company_member(company_id));

create policy employees_insert_owner_admin_office
on public.employees for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employees_update_owner_admin_office
on public.employees for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));
