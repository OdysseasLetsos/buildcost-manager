alter table public.projects
add column if not exists cancellation_date date;

notify pgrst, 'reload schema';