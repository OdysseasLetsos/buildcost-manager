create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  tax_id text not null,
  address text,
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_name_not_empty check (length(trim(name)) > 0),
  constraint suppliers_tax_id_not_empty check (length(trim(tax_id)) > 0),
  constraint suppliers_company_tax_id_unique unique (company_id, tax_id)
);

alter table public.materials
add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;

create index if not exists suppliers_company_id_idx
on public.suppliers(company_id);

create index if not exists suppliers_tax_id_idx
on public.suppliers(tax_id);

create index if not exists suppliers_active_idx
on public.suppliers(active);

create index if not exists suppliers_company_active_idx
on public.suppliers(company_id, active);

create index if not exists materials_supplier_id_idx
on public.materials(supplier_id);

alter table public.suppliers enable row level security;

drop policy if exists suppliers_select_company_members on public.suppliers;
drop policy if exists suppliers_insert_owner_admin_office on public.suppliers;
drop policy if exists suppliers_update_owner_admin_office on public.suppliers;

create policy suppliers_select_company_members
on public.suppliers
for select
using (public.is_company_member(company_id));

create policy suppliers_insert_owner_admin_office
on public.suppliers
for insert
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy suppliers_update_owner_admin_office
on public.suppliers
for update
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));
