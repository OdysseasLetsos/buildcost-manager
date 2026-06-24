alter table public.project_quotes
add column if not exists quote_type text;

alter table public.project_quotes
alter column quote_type set default 'supplemental';

update public.project_quotes
set quote_type = 'supplemental'
where quote_type is null
  or quote_type not in ('initial', 'supplemental');

alter table public.project_quotes
alter column quote_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_quotes_type_valid'
      and conrelid = 'public.project_quotes'::regclass
  ) then
    alter table public.project_quotes
    add constraint project_quotes_type_valid
      check (quote_type in ('initial', 'supplemental'));
  end if;
end;
$$;
