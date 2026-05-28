create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_id uuid not null references public.monthly_periods(id) on delete restrict,
  expense_date date not null,
  scope text not null,
  category text not null,
  description text,
  amount numeric not null,
  allocation_method text not null,
  allocation_status text not null default 'pending',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_amount_positive check (amount > 0),
  constraint expenses_scope_valid check (scope in ('general', 'office')),
  constraint expenses_category_not_empty check (length(trim(category)) > 0),
  constraint expenses_allocation_method_valid check (
    allocation_method in (
      'by_project_hours',
      'by_project_revenue',
      'equal_per_active_project',
      'manual'
    )
  ),
  constraint expenses_allocation_status_valid check (
    allocation_status in ('pending', 'allocated')
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'expenses_set_updated_at'
      and tgrelid = 'public.expenses'::regclass
  ) then
    create trigger expenses_set_updated_at
    before update on public.expenses
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create index if not exists expenses_company_id_idx
on public.expenses(company_id);

create index if not exists expenses_company_month_idx
on public.expenses(company_id, month_id);

create index if not exists expenses_company_scope_idx
on public.expenses(company_id, scope);

create index if not exists expenses_company_category_idx
on public.expenses(company_id, category);

create index if not exists expenses_company_expense_date_idx
on public.expenses(company_id, expense_date);

alter table public.expenses enable row level security;

drop policy if exists expenses_select_owner_admin_office
on public.expenses;
drop policy if exists expenses_insert_owner_admin_office
on public.expenses;
drop policy if exists expenses_update_owner_admin_office
on public.expenses;
drop policy if exists expenses_delete_owner_admin_office
on public.expenses;

create policy expenses_select_owner_admin_office
on public.expenses for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy expenses_insert_owner_admin_office
on public.expenses for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy expenses_update_owner_admin_office
on public.expenses for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy expenses_delete_owner_admin_office
on public.expenses for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

grant select, insert, update, delete on public.expenses to authenticated;
