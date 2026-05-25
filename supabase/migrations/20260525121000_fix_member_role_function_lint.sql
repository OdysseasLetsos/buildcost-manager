create or replace function public.update_company_member_role(
  target_membership_id uuid,
  next_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_record public.company_members%rowtype;
  existing_role_code text;
  normalized_role text := lower(trim(next_role));
  next_role_id uuid;
  active_owner_count integer;
begin
  select *
  into membership_record
  from public.company_members
  where id = target_membership_id
  for update;

  if membership_record.id is null then
    raise exception 'Company member was not found.';
  end if;

  if not public.has_company_role(membership_record.company_id, array['owner', 'admin']) then
    raise exception 'Only owner/admin can update member roles.';
  end if;

  if normalized_role not in ('admin', 'office', 'foreman', 'viewer') then
    raise exception 'Member role is not allowed.';
  end if;

  select code
  into existing_role_code
  from public.roles
  where id = membership_record.role_id;

  if existing_role_code = 'owner' then
    select count(*)
    into active_owner_count
    from public.company_members cm
    join public.roles r on r.id = cm.role_id
    where cm.company_id = membership_record.company_id
      and cm.status = 'active'
      and r.code = 'owner';

    if active_owner_count <= 1 then
      raise exception 'Last active owner cannot be demoted.';
    end if;
  end if;

  select id
  into next_role_id
  from public.roles
  where code = normalized_role;

  if next_role_id is null then
    raise exception 'Target role was not found.';
  end if;

  update public.company_members
  set
    role_id = next_role_id,
    updated_at = now()
  where id = target_membership_id;
end;
$$;
