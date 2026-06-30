create table if not exists public.employee_benefits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  month_key text not null,
  benefit_type text not null,
  amount numeric not null default 0,
  benefit_date date not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_benefits_month_key_format_check
    check (month_key ~ '^\d{4}-\d{2}$'),
  constraint employee_benefits_type_check
    check (benefit_type in (
      'allowance',
      'christmas_gift',
      'easter_gift',
      'vacation_allowance',
      'other'
    )),
  constraint employee_benefits_amount_positive_check check (amount > 0)
);

create index if not exists employee_benefits_company_id_idx
  on public.employee_benefits(company_id);

create index if not exists employee_benefits_employee_id_idx
  on public.employee_benefits(employee_id);

create index if not exists employee_benefits_month_key_idx
  on public.employee_benefits(month_key);

create index if not exists employee_benefits_benefit_date_idx
  on public.employee_benefits(benefit_date);

create index if not exists employee_benefits_company_month_idx
  on public.employee_benefits(company_id, month_key);

alter table public.employee_benefits enable row level security;

drop policy if exists employee_benefits_select_company_members
  on public.employee_benefits;
drop policy if exists employee_benefits_insert_owner_admin_office
  on public.employee_benefits;
drop policy if exists employee_benefits_update_owner_admin_office
  on public.employee_benefits;
drop policy if exists employee_benefits_delete_owner_admin_office
  on public.employee_benefits;

create policy employee_benefits_select_company_members
on public.employee_benefits
for select
using (public.is_company_member(company_id));

create policy employee_benefits_insert_owner_admin_office
on public.employee_benefits
for insert
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_benefits_update_owner_admin_office
on public.employee_benefits
for update
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_benefits_delete_owner_admin_office
on public.employee_benefits
for delete
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));
