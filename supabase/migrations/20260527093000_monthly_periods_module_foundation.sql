alter table public.monthly_periods
add column if not exists status text not null default 'open';

update public.monthly_periods
set status = case when is_locked then 'locked' else 'open' end;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'monthly_periods_status_check'
      and conrelid = 'public.monthly_periods'::regclass
  ) then
    alter table public.monthly_periods
    add constraint monthly_periods_status_check
    check (status in ('open', 'locked'));
  end if;
end;
$$;

create index if not exists monthly_periods_company_status_idx
on public.monthly_periods(company_id, status);

create index if not exists monthly_periods_company_month_key_idx
on public.monthly_periods(company_id, month_key);

alter table public.monthly_periods enable row level security;

drop policy if exists "Members can read monthly periods" on public.monthly_periods;
drop policy if exists "Members can create monthly periods" on public.monthly_periods;
drop policy if exists "Members can update monthly periods" on public.monthly_periods;
drop policy if exists "Members can delete monthly periods" on public.monthly_periods;
drop policy if exists monthly_periods_select_active_company_members on public.monthly_periods;
drop policy if exists monthly_periods_insert_owner_admin_office on public.monthly_periods;
drop policy if exists monthly_periods_update_owner_admin on public.monthly_periods;

create policy monthly_periods_select_active_company_members
on public.monthly_periods for select
to authenticated
using (public.is_company_member(company_id));

create policy monthly_periods_insert_owner_admin_office
on public.monthly_periods for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy monthly_periods_update_owner_admin
on public.monthly_periods for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']))
with check (public.has_company_role(company_id, array['owner', 'admin']));
