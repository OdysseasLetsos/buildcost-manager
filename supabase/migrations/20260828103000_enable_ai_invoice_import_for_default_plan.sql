insert into public.features (code, name)
values ('ai_invoice_import', 'AI Invoice Import')
on conflict (code) do update
set
  name = excluded.name,
  updated_at = now();

insert into public.plan_features (plan_id, feature_id)
select p.id, f.id
from public.plans p
join public.features f on f.code = 'ai_invoice_import'
where p.code in ('professional', 'enterprise')
on conflict (plan_id, feature_id) do nothing;

update storage.buckets
set file_size_limit = 10485760
where id = 'invoice-documents';
