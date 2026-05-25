import { createClient } from "@/src/integrations/supabase/server";
import { AuthorizationError, NotFoundError } from "@/src/core/errors";
import { requireCompanyMember } from "@/src/core/tenants";
import type { RoleCode } from "./types";

export async function requireRole(
  companyId: string,
  allowedRoles: readonly RoleCode[],
): Promise<RoleCode> {
  const membership = await requireCompanyMember(companyId);
  const supabase = await createClient();

  const { data: role, error } = await supabase
    .from("roles")
    .select("code")
    .eq("id", membership.role_id)
    .single();

  if (error || !role) {
    throw new NotFoundError("Company member role was not found.");
  }

  if (!allowedRoles.includes(role.code)) {
    throw new AuthorizationError(
      `Required role: ${allowedRoles.join(", ")}. Current role: ${role.code}.`,
    );
  }

  return role.code;
}

export type { RoleCode } from "./types";
