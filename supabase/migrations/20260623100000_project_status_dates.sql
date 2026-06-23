alter table public.projects
add column if not exists offer_date date,
add column if not exists cancellation_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_status_date_requirements'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_status_date_requirements
    check (
      (status = 'active')
      or (status = 'in_progress' and start_date is not null)
      or (
        status = 'completed'
        and start_date is not null
        and end_date is not null
      )
      or (status = 'archived' and cancellation_date is not null)
    )
    not valid;
  end if;
end;
$$;
