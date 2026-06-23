create table if not exists public.project_quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  quote_number text not null,
  version integer not null default 1,
  quote_type text not null default 'supplemental',
  title text not null,
  description text,
  amount numeric not null default 0,
  vat_amount numeric not null default 0,
  total_amount numeric not null default 0,
  quote_date date not null default current_date,
  status text not null default 'draft',
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_quotes_quote_number_not_empty
    check (length(trim(quote_number)) > 0),
  constraint project_quotes_title_not_empty
    check (length(trim(title)) > 0),
  constraint project_quotes_version_positive
    check (version > 0),
  constraint project_quotes_amount_non_negative
    check (amount >= 0),
  constraint project_quotes_vat_amount_non_negative
    check (vat_amount >= 0),
  constraint project_quotes_total_amount_non_negative
    check (total_amount >= 0),
  constraint project_quotes_total_matches_amounts
    check (abs(total_amount - (amount + vat_amount)) <= 0.01),
  constraint project_quotes_type_valid
    check (quote_type in ('initial', 'supplemental')),
  constraint project_quotes_status_valid
    check (
      status in (
        'draft',
        'sent',
        'pending_approval',
        'approved',
        'rejected',
        'cancelled',
        'revised'
      )
    ),
  constraint project_quotes_rejection_reason_required
    check (
      status <> 'rejected'
      or length(trim(coalesce(rejection_reason, ''))) > 0
    ),
  constraint project_quotes_company_number_unique
    unique (company_id, quote_number)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'project_quotes_set_updated_at'
      and tgrelid = 'public.project_quotes'::regclass
  ) then
    create trigger project_quotes_set_updated_at
    before update on public.project_quotes
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

create index if not exists project_quotes_company_id_idx
on public.project_quotes(company_id);

create index if not exists project_quotes_company_project_idx
on public.project_quotes(company_id, project_id);

create index if not exists project_quotes_company_status_idx
on public.project_quotes(company_id, status);

create index if not exists project_quotes_project_quote_date_idx
on public.project_quotes(project_id, quote_date desc);

alter table public.project_quotes enable row level security;

drop policy if exists project_quotes_select_active_company_members
on public.project_quotes;
drop policy if exists project_quotes_insert_owner_admin_office
on public.project_quotes;
drop policy if exists project_quotes_update_owner_admin_office
on public.project_quotes;

create policy project_quotes_select_active_company_members
on public.project_quotes for select
to authenticated
using (public.is_company_member(company_id));

create policy project_quotes_insert_owner_admin_office
on public.project_quotes for insert
to authenticated
with check (
  public.has_company_role(company_id, array['owner', 'admin', 'office'])
);

create policy project_quotes_update_owner_admin_office
on public.project_quotes for update
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin', 'office'])
)
with check (
  public.has_company_role(company_id, array['owner', 'admin', 'office'])
);

grant select, insert, update on public.project_quotes to authenticated;
