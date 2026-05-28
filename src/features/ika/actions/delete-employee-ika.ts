"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import type { IkaActionState } from "../types";
import { ikaIdSchema } from "../validators";

export async function deleteEmployeeIka(
  _previousState: IkaActionState,
  formData: FormData,
): Promise<IkaActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "ika");

  const validation = ikaIdSchema.safeParse(formData.get("id"));

  if (!validation.success) {
    return { ok: false, message: "Η εγγραφή ΙΚΑ δεν είναι έγκυρη." };
  }

  const supabase = await createClient();
  const { data: row, error: loadError } = await supabase
    .from("employee_ika")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", validation.data)
    .maybeSingle();

  if (loadError || !row) {
    console.error("[ika:deleteEmployeeIka:load] Supabase error", {
      message: loadError?.message,
      code: loadError?.code,
      details: loadError?.details,
      hint: loadError?.hint,
    });
    return { ok: false, message: "Η εγγραφή ΙΚΑ δεν βρέθηκε." };
  }

  await requireOpenMonth(row.month_id);

  const { error } = await supabase
    .from("employee_ika")
    .delete()
    .eq("company_id", companyId)
    .eq("id", row.id);

  if (error) {
    console.error("[ika:deleteEmployeeIka] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή ΙΚΑ." };
  }

  await writeAuditLog({
    companyId,
    action: "employee_ika.deleted",
    entityType: "employee_ika",
    entityId: row.id,
    metadata: { amount: row.ika_amount },
  });

  revalidatePath("/payments");
  return { ok: true, message: "Το ΙΚΑ διαγράφηκε." };
}
