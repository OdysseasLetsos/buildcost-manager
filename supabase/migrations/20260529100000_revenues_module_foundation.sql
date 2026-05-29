create table if not exists public.revenues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_id uuid not null references public.monthly_periods(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  revenue_date date not null,
  client_name text not null,
  invoice_number text,
  revenue_type text not null,
  invoiced_amount numeric not null default 0,
  received_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  status text not null default 'pending',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint revenues_client_name_not_empty check (length(trim(client_name)) > 0),
  constraint revenues_invoiced_amount_non_negative check (invoiced_amount >= 0),
  constraint revenues_received_amount_non_negative check (received_amount >= 0),
  constraint revenues_remaining_amount_non_negative check (remaining_amount >= 0),
  constraint revenues_type_valid check (
    revenue_type in ('invoice', 'advance', 'payment', 'credit')
  ),
  constraint revenues_status_valid check (
    status in ('pending', 'partial', 'paid', 'cancelled')
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'revenues_set_updated_at'
      and tgrelid = 'public.revenues'::regclass
  ) then
    create trigger revenues_set_updated_at
    before update on public.revenues
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create index if not exists revenues_company_id_idx
on public.revenues(company_id);

create index if not exists revenues_company_month_idx
on public.revenues(company_id, month_id);

create index if not exists revenues_company_project_idx
on public.revenues(company_id, project_id);

create index if not exists revenues_company_client_idx
on public.revenues(company_id, client_name);

create index if not exists revenues_company_revenue_date_idx
on public.revenues(company_id, revenue_date);

create index if not exists revenues_company_invoice_number_idx
on public.revenues(company_id, invoice_number);

alter table public.revenues enable row level security;

drop policy if exists revenues_select_owner_admin_office
on public.revenues;
drop policy if exists revenues_insert_owner_admin_office
on public.revenues;
drop policy if exists revenues_update_owner_admin_office
on public.revenues;
drop policy if exists revenues_delete_owner_admin_office
on public.revenues;

create policy revenues_select_owner_admin_office
on public.revenues for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy revenues_insert_owner_admin_office
on public.revenues for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy revenues_update_owner_admin_office
on public.revenues for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy revenues_delete_owner_admin_office
on public.revenues for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

grant select, insert, update, delete on public.revenues to authenticated;
