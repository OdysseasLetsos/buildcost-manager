create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_id uuid not null references public.monthly_periods(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  invoice_date date not null,
  supplier_name text not null,
  supplier_vat text,
  invoice_number text not null,
  description text,
  net_amount numeric not null default 0,
  vat_amount numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'pending',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_supplier_name_not_empty check (length(trim(supplier_name)) > 0),
  constraint materials_invoice_number_not_empty check (length(trim(invoice_number)) > 0),
  constraint materials_net_amount_non_negative check (net_amount >= 0),
  constraint materials_vat_amount_non_negative check (vat_amount >= 0),
  constraint materials_total_amount_non_negative check (total_amount >= 0),
  constraint materials_payment_status_valid check (payment_status in ('pending', 'paid'))
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'materials_set_updated_at'
      and tgrelid = 'public.materials'::regclass
  ) then
    create trigger materials_set_updated_at
    before update on public.materials
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create index if not exists materials_company_id_idx
on public.materials(company_id);

create index if not exists materials_company_month_idx
on public.materials(company_id, month_id);

create index if not exists materials_company_project_idx
on public.materials(company_id, project_id);

create index if not exists materials_company_supplier_idx
on public.materials(company_id, supplier_name);

create index if not exists materials_company_invoice_date_idx
on public.materials(company_id, invoice_date);

alter table public.materials enable row level security;

drop policy if exists materials_select_active_company_members
on public.materials;
drop policy if exists materials_insert_owner_admin_office_foreman
on public.materials;
drop policy if exists materials_update_owner_admin_office_foreman
on public.materials;
drop policy if exists materials_delete_owner_admin_office_foreman
on public.materials;

create policy materials_select_active_company_members
on public.materials for select
to authenticated
using (public.is_company_member(company_id));

create policy materials_insert_owner_admin_office_foreman
on public.materials for insert
to authenticated
with check (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
);

create policy materials_update_owner_admin_office_foreman
on public.materials for update
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
)
with check (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
);

create policy materials_delete_owner_admin_office_foreman
on public.materials for delete
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin', 'office', 'foreman'])
);

grant select, insert, update, delete on public.materials to authenticated;
