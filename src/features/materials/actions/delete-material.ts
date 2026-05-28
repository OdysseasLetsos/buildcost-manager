"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import { getMaterialById } from "../services/get-material-by-id";
import type { MaterialActionState } from "../types";
import { materialIdSchema } from "../validators";

export async function deleteMaterial(
  _previousState: MaterialActionState,
  formData: FormData,
): Promise<MaterialActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office", "foreman"]);
  await requireFeature(companyId, "materials");

  const validation = materialIdSchema.safeParse(formData.get("id"));

  if (!validation.success) {
    return { ok: false, message: "Το τιμολόγιο υλικών δεν είναι έγκυρο." };
  }

  const material = await getMaterialById(companyId, validation.data);

  if (!material) return { ok: false, message: "Το τιμολόγιο υλικών δεν βρέθηκε." };

  await requireOpenMonth(material.month_id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("company_id", companyId)
    .eq("id", material.id);

  if (error) {
    console.error("[materials:deleteMaterial] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή τιμολογίου υλικών." };
  }

  await writeAuditLog({
    companyId,
    action: "material.deleted",
    entityType: "material",
    entityId: material.id,
    metadata: {
      invoiceNumber: material.invoice_number,
      totalAmount: material.total_amount,
    },
  });

  revalidatePath("/materials");
  return { ok: true, message: "Το τιμολόγιο υλικών διαγράφηκε." };
}
