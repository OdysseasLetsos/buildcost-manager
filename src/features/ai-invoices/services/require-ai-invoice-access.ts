import { requireUser } from "@/src/core/auth";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";

export type AiInvoiceAccessContext = {
  userId: string;
  companyId: string;
};

export async function requireAiInvoiceAccess(): Promise<AiInvoiceAccessContext> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new Error("Δεν βρέθηκε ενεργή εταιρεία.");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "ai_invoice_import");

  return {
    userId: user.id,
    companyId,
  };
}
