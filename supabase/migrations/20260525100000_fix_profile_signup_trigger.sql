create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_full_name text;
  profile_avatar_url text;
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

  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, profile_full_name, profile_avatar_url)
  on conflict (id) do update
  set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
