alter table public.projects
add column if not exists offer_date date;

notify pgrst, 'reload schema';