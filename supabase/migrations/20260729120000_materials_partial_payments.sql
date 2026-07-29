alter table public.materials
add column if not exists paid_amount numeric not null default 0;

update public.materials
set paid_amount = case
  when payment_status = 'paid' then total_amount
  else least(paid_amount, total_amount)
end;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'materials_payment_status_valid'
      and conrelid = 'public.materials'::regclass
  ) then
    alter table public.materials
    drop constraint materials_payment_status_valid;
  end if;

  alter table public.materials
  add constraint materials_payment_status_valid
  check (payment_status in ('pending', 'partial', 'paid'));
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'materials_paid_amount_non_negative'
      and conrelid = 'public.materials'::regclass
  ) then
    alter table public.materials
    add constraint materials_paid_amount_non_negative
    check (paid_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'materials_paid_amount_not_above_total'
      and conrelid = 'public.materials'::regclass
  ) then
    alter table public.materials
    add constraint materials_paid_amount_not_above_total
    check (paid_amount <= total_amount);
  end if;
end;
$$;
