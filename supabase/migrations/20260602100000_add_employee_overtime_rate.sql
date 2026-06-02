alter table public.employees
add column if not exists overtime_rate numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_overtime_rate_non_negative'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
    add constraint employees_overtime_rate_non_negative
    check (overtime_rate is null or overtime_rate >= 0);
  end if;
end;
$$;
