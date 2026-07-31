alter table public.revenues
add column if not exists payment_method text not null default 'bank';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'revenues_payment_method_valid'
      and conrelid = 'public.revenues'::regclass
  ) then
    alter table public.revenues
    add constraint revenues_payment_method_valid
    check (payment_method in ('bank', 'cash', 'other'));
  end if;
end;
$$;

create index if not exists revenues_company_payment_method_idx
on public.revenues(company_id, payment_method);
