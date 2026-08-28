insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'invoice-documents',
  'invoice-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.invoice_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  storage_bucket text not null default 'invoice-documents',
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint,
  status text not null default 'uploaded',
  selected_month_key text,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_documents_storage_path_unique unique (storage_bucket, storage_path),
  constraint invoice_documents_file_name_not_empty check (length(trim(original_file_name)) > 0),
  constraint invoice_documents_mime_type_valid check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  ),
  constraint invoice_documents_status_valid check (
    status in ('uploaded', 'extracting', 'review', 'rejected', 'completed', 'failed')
  ),
  constraint invoice_documents_file_size_positive check (
    file_size_bytes is null or file_size_bytes > 0
  )
);

create table if not exists public.extracted_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_document_id uuid not null references public.invoice_documents(id) on delete cascade,
  supplier_name text,
  supplier_vat text,
  invoice_number text,
  invoice_date date,
  net_amount numeric,
  vat_amount numeric,
  total_amount numeric,
  currency text not null default 'EUR',
  target_type_suggestion text not null default 'unknown',
  category_suggestion text,
  project_suggestion_id uuid references public.projects(id) on delete set null,
  confidence_score numeric,
  line_items jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  raw_extraction jsonb not null default '{}'::jsonb,
  extraction_mode text not null default 'mock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extracted_invoices_target_type_valid check (
    target_type_suggestion in ('material', 'expense', 'revenue', 'unknown')
  ),
  constraint extracted_invoices_extraction_mode_valid check (
    extraction_mode in ('mock', 'external')
  ),
  constraint extracted_invoices_confidence_score_valid check (
    confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)
  ),
  constraint extracted_invoices_amounts_non_negative check (
    (net_amount is null or net_amount >= 0)
    and (vat_amount is null or vat_amount >= 0)
    and (total_amount is null or total_amount >= 0)
  )
);

create table if not exists public.invoice_review_queue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_document_id uuid not null references public.invoice_documents(id) on delete cascade,
  extracted_invoice_id uuid not null references public.extracted_invoices(id) on delete cascade,
  status text not null default 'pending_review',
  assigned_to uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_review_queue_status_valid check (
    status in ('pending_review', 'corrected', 'approved', 'rejected')
  )
);

create index if not exists invoice_documents_company_id_idx
on public.invoice_documents(company_id);

create index if not exists invoice_documents_uploaded_by_idx
on public.invoice_documents(uploaded_by);

create index if not exists invoice_documents_status_idx
on public.invoice_documents(status);

create index if not exists invoice_documents_created_at_idx
on public.invoice_documents(created_at desc);

create index if not exists invoice_documents_month_key_idx
on public.invoice_documents(selected_month_key);

create index if not exists invoice_documents_project_id_idx
on public.invoice_documents(project_id);

create index if not exists extracted_invoices_company_id_idx
on public.extracted_invoices(company_id);

create index if not exists extracted_invoices_document_id_idx
on public.extracted_invoices(invoice_document_id);

create index if not exists extracted_invoices_supplier_invoice_idx
on public.extracted_invoices(company_id, supplier_vat, invoice_number);

create index if not exists invoice_review_queue_company_id_idx
on public.invoice_review_queue(company_id);

create index if not exists invoice_review_queue_document_id_idx
on public.invoice_review_queue(invoice_document_id);

create index if not exists invoice_review_queue_status_idx
on public.invoice_review_queue(status);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'invoice_documents_set_updated_at'
      and tgrelid = 'public.invoice_documents'::regclass
  ) then
    create trigger invoice_documents_set_updated_at
    before update on public.invoice_documents
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'extracted_invoices_set_updated_at'
      and tgrelid = 'public.extracted_invoices'::regclass
  ) then
    create trigger extracted_invoices_set_updated_at
    before update on public.extracted_invoices
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'invoice_review_queue_set_updated_at'
      and tgrelid = 'public.invoice_review_queue'::regclass
  ) then
    create trigger invoice_review_queue_set_updated_at
    before update on public.invoice_review_queue
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.invoice_documents enable row level security;
alter table public.extracted_invoices enable row level security;
alter table public.invoice_review_queue enable row level security;

drop policy if exists invoice_documents_select_owner_admin_office
on public.invoice_documents;
drop policy if exists invoice_documents_insert_owner_admin_office
on public.invoice_documents;
drop policy if exists invoice_documents_update_owner_admin_office
on public.invoice_documents;

create policy invoice_documents_select_owner_admin_office
on public.invoice_documents for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy invoice_documents_insert_owner_admin_office
on public.invoice_documents for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.has_company_role(company_id, array['owner', 'admin', 'office'])
);

create policy invoice_documents_update_owner_admin_office
on public.invoice_documents for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

drop policy if exists extracted_invoices_select_owner_admin_office
on public.extracted_invoices;
drop policy if exists extracted_invoices_insert_owner_admin_office
on public.extracted_invoices;
drop policy if exists extracted_invoices_update_owner_admin_office
on public.extracted_invoices;

create policy extracted_invoices_select_owner_admin_office
on public.extracted_invoices for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy extracted_invoices_insert_owner_admin_office
on public.extracted_invoices for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy extracted_invoices_update_owner_admin_office
on public.extracted_invoices for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

drop policy if exists invoice_review_queue_select_owner_admin_office
on public.invoice_review_queue;
drop policy if exists invoice_review_queue_insert_owner_admin_office
on public.invoice_review_queue;
drop policy if exists invoice_review_queue_update_owner_admin_office
on public.invoice_review_queue;

create policy invoice_review_queue_select_owner_admin_office
on public.invoice_review_queue for select
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy invoice_review_queue_insert_owner_admin_office
on public.invoice_review_queue for insert
to authenticated
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

create policy invoice_review_queue_update_owner_admin_office
on public.invoice_review_queue for update
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin', 'office']))
with check (public.has_company_role(company_id, array['owner', 'admin', 'office']));

drop policy if exists invoice_documents_storage_select_owner_admin_office
on storage.objects;
drop policy if exists invoice_documents_storage_insert_owner_admin_office
on storage.objects;
drop policy if exists invoice_documents_storage_delete_owner_admin_office
on storage.objects;

create policy invoice_documents_storage_select_owner_admin_office
on storage.objects for select
to authenticated
using (
  bucket_id = 'invoice-documents'
  and public.has_company_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'office'])
);

create policy invoice_documents_storage_insert_owner_admin_office
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'invoice-documents'
  and owner = auth.uid()
  and public.has_company_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'office'])
);

create policy invoice_documents_storage_delete_owner_admin_office
on storage.objects for delete
to authenticated
using (
  bucket_id = 'invoice-documents'
  and public.has_company_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'office'])
);

grant select, insert, update on public.invoice_documents to authenticated;
grant select, insert, update on public.extracted_invoices to authenticated;
grant select, insert, update on public.invoice_review_queue to authenticated;
