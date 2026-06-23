drop policy if exists project_quotes_delete_owner_admin_office
on public.project_quotes;

create policy project_quotes_delete_owner_admin_office
on public.project_quotes for delete
to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin', 'office'])
  and status <> 'approved'
);

grant delete on public.project_quotes to authenticated;
