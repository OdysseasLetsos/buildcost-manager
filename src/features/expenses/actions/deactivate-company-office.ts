"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { CompanyOffice, ExpenseResourceActionState } from "../types";

export async function deactivateCompanyOffice(
  officeId: string,
): Promise<ExpenseResourceActionState<CompanyOffice>> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_offices")
    .update({ active: false })
    .eq("company_id", companyId)
    .eq("id", officeId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[expenses:deactivateCompanyOffice] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η απενεργοποίηση του γραφείου." };
  }

  await writeAuditLog({
    companyId,
    action: "office.deactivated",
    entityType: "company_office",
    entityId: data.id,
    metadata: { name: data.name },
  });

  revalidatePath("/expenses");

  return {
    ok: true,
    message:
      "Το γραφείο χρησιμοποιείται ήδη σε έξοδα και δεν μπορεί να διαγραφεί οριστικά. Απενεργοποιήθηκε.",
    resource: data as CompanyOffice,
  };
}
