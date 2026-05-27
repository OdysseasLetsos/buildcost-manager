"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import {
  getCurrentCompany,
  requireCompanyMember,
} from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { MonthlyPeriodActionState } from "../types";
import { getMonthlyPeriodById } from "../services/get-monthly-period-by-id";
import { monthlyPeriodIdSchema } from "../validators";

export async function reopenMonthlyPeriod(
  _previousState: MonthlyPeriodActionState,
  formData: FormData,
): Promise<MonthlyPeriodActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin"]);
  await requireFeature(companyId, "monthly_periods");

  const monthId = monthlyPeriodIdSchema.safeParse(formData.get("monthId"));

  if (!monthId.success) {
    return { ok: false, message: "Ο μήνας δεν είναι έγκυρος." };
  }

  const monthlyPeriod = await getMonthlyPeriodById(companyId, monthId.data);

  if (!monthlyPeriod) {
    return { ok: false, message: "Ο μήνας δεν βρέθηκε." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_periods")
    .update({
      status: "open",
      is_locked: false,
      locked_at: null,
      locked_by: null,
    })
    .eq("company_id", companyId)
    .eq("id", monthId.data);

  if (error) {
    console.error("[monthly-periods:reopenMonthlyPeriod] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατό το άνοιγμα του μήνα." };
  }

  await writeAuditLog({
    companyId,
    action: "monthly_period.reopened",
    entityType: "monthly_period",
    entityId: monthId.data,
    metadata: { monthKey: monthlyPeriod.month_key },
  });

  revalidatePath("/months");

  return { ok: true, message: "Ο μήνας άνοιξε ξανά." };
}
