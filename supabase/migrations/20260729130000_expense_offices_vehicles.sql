create table if not exists public.company_offices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address text,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_offices_name_not_empty check (length(trim(name)) > 0)
);

create table if not exists public.company_vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  plate_number text,
  model text,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_vehicles_name_not_empty check (length(trim(name)) > 0)
);

alter table public.expenses
add column if not exists office_id uuid references public.company_offices(id) on delete set null,
add column if not exists vehicle_id uuid references public.company_vehicles(id) on delete set null,
add column if not exists expense_subtype text;

create index if not exists company_offices_company_active_idx
on public.company_offices(company_id, active);

create index if not exists company_vehicles_company_active_idx
on public.company_vehicles(company_id, active);

create index if not exists expenses_office_id_idx
on public.expenses(office_id);

create index if not exists expenses_vehicle_id_idx
on public.expenses(vehicle_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'company_offices_set_updated_at'
      and tgrelid = 'public.company_offices'::regclass
  ) then
    create trigger company_offices_set_updated_at
    before update on public.company_offices
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'company_vehicles_set_updated_at'
      and tgrelid = 'public.company_vehicles'::regclass
  ) then
    create trigger company_vehicles_set_updated_at
    before update on public.company_vehicles
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.company_offices enable row level security;
alter table public.company_vehicles enable row level security;

drop policy if exists company_offices_select_company_members
on public.company_offices;
drop policy if exists company_offices_insert_owner_admin_office
on public.company_offices;
drop policy if exists company_offices_update_owner_admin_office
on public.company_offices;
drop policy if exists company_offices_delete_owner_admin_office
on public.company_offices;

create policy company_offices_select_company_members
on public.company_offices for select
to authenticated
using (public.is_company_member(company_id));

create policy company_offices_insert_owner_admin_office
on public.company_offices for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy company_offices_update_owner_admin_office
on public.company_offices for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy company_offices_delete_owner_admin_office
on public.company_offices for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

drop policy if exists company_vehicles_select_company_members
on public.company_vehicles;
drop policy if exists company_vehicles_insert_owner_admin_office
on public.company_vehicles;
drop policy if exists company_vehicles_update_owner_admin_office
on public.company_vehicles;
drop policy if exists company_vehicles_delete_owner_admin_office
on public.company_vehicles;

create policy company_vehicles_select_company_members
on public.company_vehicles for select
to authenticated
using (public.is_company_member(company_id));

create policy company_vehicles_insert_owner_admin_office
on public.company_vehicles for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy company_vehicles_update_owner_admin_office
on public.company_vehicles for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy company_vehicles_delete_owner_admin_office
on public.company_vehicles for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

grant select, insert, update, delete on public.company_offices to authenticated;
grant select, insert, update, delete on public.company_vehicles to authenticated;
