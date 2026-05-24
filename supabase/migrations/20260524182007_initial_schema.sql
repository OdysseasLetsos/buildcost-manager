create extension if not exists pgcrypto;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_code_not_empty check (length(trim(code)) > 0)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_code_not_empty check (length(trim(code)) > 0)
);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint features_code_not_empty check (length(trim(code)) > 0)
);

create table public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (plan_id, feature_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans(id) on delete set null,
  name text not null,
  slug text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_name_not_empty check (length(trim(name)) > 0),
  constraint companies_slug_not_empty check (length(trim(slug)) > 0)
);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table public.company_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  enabled boolean not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, feature_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  constraint projects_code_not_empty check (length(trim(code)) > 0),
  constraint projects_name_not_empty check (length(trim(name)) > 0)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_full_name_not_empty check (length(trim(full_name)) > 0)
);

create table public.monthly_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_key text not null,
  starts_on date not null,
  ends_on date not null,
  is_locked boolean not null default false,
  locked_at timestamptz,
  locked_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, month_key),
  constraint monthly_periods_month_key_format check (
    month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ),
  constraint monthly_periods_date_order check (ends_on >= starts_on),
  constraint monthly_periods_lock_details check (
    (is_locked = false and locked_at is null and locked_by is null)
    or (is_locked = true and locked_at is not null)
  )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_empty check (length(trim(action)) > 0),
  constraint audit_logs_entity_type_not_empty check (length(trim(entity_type)) > 0),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index company_members_company_id_idx on public.company_members(company_id);
create index company_members_user_id_idx on public.company_members(user_id);
create index company_feature_overrides_company_id_idx on public.company_feature_overrides(company_id);
create index projects_company_id_idx on public.projects(company_id);
create index employees_company_id_idx on public.employees(company_id);
create index monthly_periods_company_id_idx on public.monthly_periods(company_id);
create index audit_logs_company_id_idx on public.audit_logs(company_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create trigger features_set_updated_at
before update on public.features
for each row execute function public.set_updated_at();

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create trigger company_members_set_updated_at
before update on public.company_members
for each row execute function public.set_updated_at();

create trigger company_feature_overrides_set_updated_at
before update on public.company_feature_overrides
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create trigger monthly_periods_set_updated_at
before update on public.monthly_periods
for each row execute function public.set_updated_at();

insert into public.roles (code, name)
values
  ('owner', 'Owner'),
  ('admin', 'Admin'),
  ('member', 'Member'),
  ('viewer', 'Viewer')
on conflict (code) do update set name = excluded.name;

insert into public.features (code, name)
values
  ('projects', 'Projects'),
  ('employees', 'Employees'),
  ('monthly_periods', 'Monthly Periods'),
  ('daily_work', 'Daily Work'),
  ('payments', 'Payments'),
  ('ika', 'IKA'),
  ('materials', 'Materials'),
  ('expenses', 'Expenses'),
  ('revenues', 'Revenues'),
  ('project_summary', 'Project Summary'),
  ('reports_pdf', 'PDF Reports'),
  ('reports_excel', 'Excel Reports'),
  ('ai_invoice_import', 'AI Invoice Import'),
  ('email_invoice_import', 'Email Invoice Import'),
  ('advanced_analytics', 'Advanced Analytics')
on conflict (code) do update set name = excluded.name;

insert into public.plans (code, name)
values
  ('basic', 'Basic'),
  ('professional', 'Professional'),
  ('enterprise', 'Enterprise')
on conflict (code) do update set name = excluded.name;

insert into public.plan_features (plan_id, feature_id)
select p.id, f.id
from public.plans p
join public.features f on f.code in (
  'projects',
  'employees',
  'monthly_periods',
  'daily_work',
  'payments',
  'project_summary'
)
where p.code = 'basic'
on conflict (plan_id, feature_id) do nothing;

insert into public.plan_features (plan_id, feature_id)
select p.id, f.id
from public.plans p
join public.features f on f.code in (
  'projects',
  'employees',
  'monthly_periods',
  'daily_work',
  'payments',
  'project_summary',
  'ika',
  'materials',
  'expenses',
  'revenues',
  'reports_pdf',
  'reports_excel'
)
where p.code = 'professional'
on conflict (plan_id, feature_id) do nothing;

insert into public.plan_features (plan_id, feature_id)
select p.id, f.id
from public.plans p
join public.features f on f.code in (
  'projects',
  'employees',
  'monthly_periods',
  'daily_work',
  'payments',
  'project_summary',
  'ika',
  'materials',
  'expenses',
  'revenues',
  'reports_pdf',
  'reports_excel',
  'ai_invoice_import',
  'email_invoice_import',
  'advanced_analytics'
)
where p.code = 'enterprise'
on conflict (plan_id, feature_id) do nothing;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_company_role(target_company_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.company_members cm
  join public.roles r on r.id = cm.role_id
  where cm.company_id = target_company_id
    and cm.user_id = auth.uid()
  limit 1;
$$;

alter table public.roles enable row level security;
alter table public.plans enable row level security;
alter table public.features enable row level security;
alter table public.plan_features enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_feature_overrides enable row level security;
alter table public.projects enable row level security;
alter table public.employees enable row level security;
alter table public.monthly_periods enable row level security;
alter table public.audit_logs enable row level security;

create policy "Authenticated users can read roles"
on public.roles for select
to authenticated
using (true);

create policy "Authenticated users can read plans"
on public.plans for select
to authenticated
using (true);

create policy "Authenticated users can read features"
on public.features for select
to authenticated
using (true);

create policy "Authenticated users can read plan features"
on public.plan_features for select
to authenticated
using (true);

create policy "Members can read their companies"
on public.companies for select
to authenticated
using (public.is_company_member(id));

create policy "Members can update their companies"
on public.companies for update
to authenticated
using (public.current_user_company_role(id) in ('owner', 'admin'))
with check (public.current_user_company_role(id) in ('owner', 'admin'));

create policy "Members can read company memberships"
on public.company_members for select
to authenticated
using (public.is_company_member(company_id));

create policy "Admins can manage company memberships"
on public.company_members for all
to authenticated
using (public.current_user_company_role(company_id) in ('owner', 'admin'))
with check (public.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Members can read company feature overrides"
on public.company_feature_overrides for select
to authenticated
using (public.is_company_member(company_id));

create policy "Admins can manage company feature overrides"
on public.company_feature_overrides for all
to authenticated
using (public.current_user_company_role(company_id) in ('owner', 'admin'))
with check (public.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Members can read projects"
on public.projects for select
to authenticated
using (public.is_company_member(company_id));

create policy "Members can create projects"
on public.projects for insert
to authenticated
with check (public.is_company_member(company_id));

create policy "Members can update projects"
on public.projects for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy "Members can delete projects"
on public.projects for delete
to authenticated
using (public.is_company_member(company_id));

create policy "Members can read employees"
on public.employees for select
to authenticated
using (public.is_company_member(company_id));

create policy "Members can create employees"
on public.employees for insert
to authenticated
with check (public.is_company_member(company_id));

create policy "Members can update employees"
on public.employees for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy "Members can delete employees"
on public.employees for delete
to authenticated
using (public.is_company_member(company_id));

create policy "Members can read monthly periods"
on public.monthly_periods for select
to authenticated
using (public.is_company_member(company_id));

create policy "Members can create monthly periods"
on public.monthly_periods for insert
to authenticated
with check (public.is_company_member(company_id));

create policy "Members can update monthly periods"
on public.monthly_periods for update
to authenticated
using (
  public.is_company_member(company_id)
  and is_locked = false
)
with check (public.is_company_member(company_id));

create policy "Members can delete monthly periods"
on public.monthly_periods for delete
to authenticated
using (
  public.is_company_member(company_id)
  and is_locked = false
);

create policy "Members can read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_company_member(company_id));

create policy "Members can create audit logs"
on public.audit_logs for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and actor_id = auth.uid()
);

grant usage on schema public to authenticated;
grant select on
  public.roles,
  public.plans,
  public.features,
  public.plan_features
to authenticated;

grant select, insert, update, delete on
  public.companies,
  public.company_members,
  public.company_feature_overrides,
  public.projects,
  public.employees,
  public.monthly_periods
to authenticated;

grant select, insert on public.audit_logs to authenticated;
