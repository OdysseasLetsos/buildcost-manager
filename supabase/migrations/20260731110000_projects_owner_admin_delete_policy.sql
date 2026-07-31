drop policy if exists projects_delete_owner_admin
on public.projects;

create policy projects_delete_owner_admin
on public.projects for delete
to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']));

grant delete on public.projects to authenticated;
