import { createClient } from "@/src/integrations/supabase/server";
import { AuthorizationError, NotFoundError } from "@/src/core/errors";
import { getCurrentUser, requireUser } from "@/src/core/auth";
import type { Database } from "@/src/integrations/supabase/types";

export {
  acceptInvitation,
  createCompany,
  createInvitation,
  disableMember,
  updateMemberRole,
} from "./actions";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type CompanyMember = Database["public"]["Tables"]["company_members"]["Row"];

export type CompanyMembership = CompanyMember;

export type CurrentCompany = {
  company: Company;
  membership: CompanyMembership;
};

export type CompanyMemberListItem =
  Database["public"]["Functions"]["list_company_members"]["Returns"][number];

export async function getCurrentCompany(): Promise<CurrentCompany | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", membership.company_id)
    .single();

  if (companyError || !company) {
    return null;
  }

  return { company, membership };
}

export async function requireCompanyMember(
  companyId: string,
): Promise<CompanyMembership> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: membership, error } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new AuthorizationError("Unable to verify company membership.");
  }

  if (!membership) {
    throw new AuthorizationError("You are not a member of this company.");
  }

  return membership;
}

export async function requireCurrentCompany(): Promise<CurrentCompany> {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new NotFoundError("No company membership was found for this user.");
  }

  return currentCompany;
}

export async function listCompanyMembers(
  companyId: string,
): Promise<CompanyMemberListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_company_members", {
    target_company_id: companyId,
  });

  if (error) {
    console.error("[tenants:listCompanyMembers] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new AuthorizationError("Unable to load company members.");
  }

  return data ?? [];
}
