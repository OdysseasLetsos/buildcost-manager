create table if not exists public.employee_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_id uuid not null references public.monthly_periods(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  payment_date date not null,
  amount numeric not null,
  payment_method text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_payments_amount_positive check (amount > 0),
  constraint employee_payments_method_valid check (
    payment_method in ('cash', 'bank', 'other')
  )
);

create table if not exists public.employee_ika (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_id uuid not null references public.monthly_periods(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  ika_amount numeric not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_ika_amount_positive check (ika_amount > 0),
  constraint employee_ika_company_month_employee_unique unique (
    company_id,
    month_id,
    employee_id
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'employee_payments_set_updated_at'
      and tgrelid = 'public.employee_payments'::regclass
  ) then
    create trigger employee_payments_set_updated_at
    before update on public.employee_payments
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'employee_ika_set_updated_at'
      and tgrelid = 'public.employee_ika'::regclass
  ) then
    create trigger employee_ika_set_updated_at
    before update on public.employee_ika
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create index if not exists employee_payments_company_id_idx
on public.employee_payments(company_id);

create index if not exists employee_payments_company_month_idx
on public.employee_payments(company_id, month_id);

create index if not exists employee_payments_company_employee_idx
on public.employee_payments(company_id, employee_id);

create index if not exists employee_ika_company_id_idx
on public.employee_ika(company_id);

create index if not exists employee_ika_company_month_idx
on public.employee_ika(company_id, month_id);

create index if not exists employee_ika_company_employee_idx
on public.employee_ika(company_id, employee_id);

alter table public.employee_payments enable row level security;
alter table public.employee_ika enable row level security;

drop policy if exists employee_payments_select_owner_admin_office
on public.employee_payments;
drop policy if exists employee_payments_insert_owner_admin_office
on public.employee_payments;
drop policy if exists employee_payments_update_owner_admin_office
on public.employee_payments;
drop policy if exists employee_payments_delete_owner_admin_office
on public.employee_payments;

create policy employee_payments_select_owner_admin_office
on public.employee_payments for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_payments_insert_owner_admin_office
on public.employee_payments for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_payments_update_owner_admin_office
on public.employee_payments for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_payments_delete_owner_admin_office
on public.employee_payments for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

drop policy if exists employee_ika_select_owner_admin_office
on public.employee_ika;
drop policy if exists employee_ika_insert_owner_admin_office
on public.employee_ika;
drop policy if exists employee_ika_update_owner_admin_office
on public.employee_ika;
drop policy if exists employee_ika_delete_owner_admin_office
on public.employee_ika;

create policy employee_ika_select_owner_admin_office
on public.employee_ika for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_ika_insert_owner_admin_office
on public.employee_ika for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_ika_update_owner_admin_office
on public.employee_ika for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy employee_ika_delete_owner_admin_office
on public.employee_ika for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

grant select, insert, update, delete on public.employee_payments to authenticated;
grant select, insert, update, delete on public.employee_ika to authenticated;
