do $$
begin
  if exists (
    select 1
    from (
      select company_id, employee_id, project_id, work_date
      from public.daily_work_entries
      group by company_id, employee_id, project_id, work_date
      having count(*) > 1
    ) duplicates
  ) then
    raise notice
      'Skipping daily_work_entries unique index because duplicate employee/project/date rows already exist.';
  else
    create unique index if not exists daily_work_entries_company_employee_project_date_uidx
    on public.daily_work_entries(company_id, employee_id, project_id, work_date);
  end if;
end;
$$;
