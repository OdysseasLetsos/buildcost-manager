insert into public.roles (code, name)
values
  ('office', 'Office'),
  ('foreman', 'Foreman')
on conflict (code) do update set name = excluded.name;

create or replace function public.create_company_invitation(
  target_company_id uuid,
  invite_email text,
  invite_role text,
  invite_token text,
  invite_expires_at timestamptz
)
returns table (
  id uuid,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(invite_email));
  normalized_role text := lower(trim(invite_role));
  invitation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.has_company_role(target_company_id, array['owner', 'admin']) then
    raise exception 'Only owner/admin can create invitations.';
  end if;

  if normalized_email = '' then
    raise exception 'Invitation email is required.';
  end if;

  if normalized_role not in ('admin', 'office', 'foreman', 'viewer') then
    raise exception 'Invitation role is not allowed.';
  end if;

  insert into public.company_invitations (
    company_id,
    email,
    role,
    token,
    status,
    invited_by,
    expires_at
  )
  values (
    target_company_id,
    normalized_email,
    normalized_role,
    invite_token,
    'pending',
    auth.uid(),
    invite_expires_at
  )
  returning company_invitations.id into invitation_id;

  return query
  select invitation_id, invite_token, invite_expires_at;
end;
$$;

create or replace function public.accept_company_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text;
  invitation_record public.company_invitations%rowtype;
  invite_role_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select lower(email)
  into current_user_email
  from auth.users
  where id = current_user_id;

  select *
  into invitation_record
  from public.company_invitations
  where token = invite_token
  for update;

  if invitation_record.id is null then
    raise exception 'Invitation was not found.';
  end if;

  if invitation_record.status <> 'pending' then
    raise exception 'Invitation is not pending.';
  end if;

  if invitation_record.expires_at is not null
    and invitation_record.expires_at <= now() then
    update public.company_invitations
    set status = 'expired'
    where id = invitation_record.id;

    raise exception 'Invitation has expired.';
  end if;

  if lower(invitation_record.email) <> current_user_email then
    raise exception 'Invitation email does not match current user.';
  end if;

  select id
  into invite_role_id
  from public.roles
  where code = invitation_record.role;

  if invite_role_id is null then
    raise exception 'Invitation role does not exist.';
  end if;

  insert into public.company_members (
    company_id,
    user_id,
    role_id,
    status,
    created_by
  )
  values (
    invitation_record.company_id,
    current_user_id,
    invite_role_id,
    'active',
    invitation_record.invited_by
  )
  on conflict (company_id, user_id) do update
  set
    role_id = excluded.role_id,
    status = 'active',
    updated_at = now();

  update public.company_invitations
  set
    status = 'accepted',
    accepted_at = now()
  where id = invitation_record.id;

  return invitation_record.company_id;
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
    au.email,
    r.code as role,
    cm.status,
    cm.created_at
  from public.company_members cm
  join public.roles r on r.id = cm.role_id
  join auth.users au on au.id = cm.user_id
  where cm.company_id = target_company_id
    and public.has_company_role(target_company_id, array['owner', 'admin'])
  order by cm.created_at asc;
$$;

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
  current_role text;
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
  into current_role
  from public.roles
  where id = membership_record.role_id;

  if current_role = 'owner' then
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

create or replace function public.disable_company_member(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_record public.company_members%rowtype;
  membership_role text;
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
    raise exception 'Only owner/admin can disable members.';
  end if;

  if membership_record.user_id = auth.uid() then
    raise exception 'Users cannot disable themselves.';
  end if;

  select code
  into membership_role
  from public.roles
  where id = membership_record.role_id;

  if membership_role = 'owner' then
    select count(*)
    into active_owner_count
    from public.company_members cm
    join public.roles r on r.id = cm.role_id
    where cm.company_id = membership_record.company_id
      and cm.status = 'active'
      and r.code = 'owner';

    if active_owner_count <= 1 then
      raise exception 'Last active owner cannot be disabled.';
    end if;
  end if;

  update public.company_members
  set
    status = 'suspended',
    updated_at = now()
  where id = target_membership_id;
end;
$$;

grant execute on function public.create_company_invitation(uuid, text, text, text, timestamptz)
to authenticated;
grant execute on function public.accept_company_invitation(text)
to authenticated;
grant execute on function public.list_company_members(uuid)
to authenticated;
grant execute on function public.update_company_member_role(uuid, text)
to authenticated;
grant execute on function public.disable_company_member(uuid)
to authenticated;
