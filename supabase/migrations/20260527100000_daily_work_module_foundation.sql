create table if not exists public.daily_work_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_id uuid not null references public.monthly_periods(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  work_date date not null,
  hours numeric not null default 0,
  overtime_hours numeric not null default 0,
  expense_amount numeric not null default 0,
  expense_description text,
  work_description text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_work_entries_hours_non_negative check (hours >= 0),
  constraint daily_work_entries_overtime_hours_non_negative check (overtime_hours >= 0),
  constraint daily_work_entries_expense_amount_non_negative check (expense_amount >= 0),
  constraint daily_work_entries_has_value check (
    hours > 0 or overtime_hours > 0 or expense_amount > 0
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'daily_work_entries_set_updated_at'
      and tgrelid = 'public.daily_work_entries'::regclass
  ) then
    create trigger daily_work_entries_set_updated_at
    before update on public.daily_work_entries
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create index if not exists daily_work_entries_company_id_idx
on public.daily_work_entries(company_id);

create index if not exists daily_work_entries_company_month_idx
on public.daily_work_entries(company_id, month_id);

create index if not exists daily_work_entries_company_project_idx
on public.daily_work_entries(company_id, project_id);

create index if not exists daily_work_entries_company_employee_idx
on public.daily_work_entries(company_id, employee_id);

create index if not exists daily_work_entries_company_work_date_idx
on public.daily_work_entries(company_id, work_date);

alter table public.daily_work_entries enable row level security;

drop policy if exists daily_work_entries_select_active_company_members
on public.daily_work_entries;
drop policy if exists daily_work_entries_insert_owner_admin_office_foreman
on public.daily_work_entries;
drop policy if exists daily_work_entries_update_owner_admin_office_foreman
on public.daily_work_entries;
drop policy if exists daily_work_entries_delete_owner_admin_office_foreman
on public.daily_work_entries;

create policy daily_work_entries_select_active_company_members
on public.daily_work_entries for select
to authenticated
using (public.is_company_member(company_id));

create policy daily_work_entries_insert_owner_admin_office_foreman
on public.daily_work_entries for insert
to authenticated
with check (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
);

create policy daily_work_entries_update_owner_admin_office_foreman
on public.daily_work_entries for update
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
)
with check (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
);

create policy daily_work_entries_delete_owner_admin_office_foreman
on public.daily_work_entries for delete
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
);

grant select, insert, update, delete on public.daily_work_entries to authenticated;
