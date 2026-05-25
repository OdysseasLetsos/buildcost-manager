alter table public.profiles
add column if not exists email text;

create index if not exists profiles_email_idx
on public.profiles(email);

update public.profiles p
set email = lower(au.email)
from auth.users au
where au.id = p.id
  and p.email is null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_full_name text;
  profile_avatar_url text;
  profile_email text;
begin
  profile_full_name := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(coalesce(new.email, ''), '@', 1)
      )
    ),
    ''
  );

  profile_avatar_url := nullif(
    trim(coalesce(new.raw_user_meta_data->>'avatar_url', '')),
    ''
  );

  profile_email := nullif(lower(trim(coalesce(new.email, ''))), '');

  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, profile_email, profile_full_name, profile_avatar_url)
  on conflict (id) do update
  set
    email = coalesce(public.profiles.email, excluded.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

create or replace function public.list_company_members(target_company_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cm.id as membership_id,
    cm.user_id,
    p.email,
    r.code as role,
    cm.status,
    cm.created_at
  from public.company_members cm
  join public.roles r on r.id = cm.role_id
  left join public.profiles p on p.id = cm.user_id
  where cm.company_id = target_company_id
    and public.has_company_role(target_company_id, array['owner', 'admin'])
  order by cm.created_at asc;
$$;
