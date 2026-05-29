import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { requireCompanyMember } from "@/src/core/tenants";

export async function requireReportsAccess(companyId: string): Promise<void> {
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "project_summary");
}
