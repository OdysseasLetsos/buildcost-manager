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
import {
  FUTURE_MONTH_ERROR,
  getCurrentMonthKey,
  isFutureMonth,
  isPastMonth,
} from "../services/month-rules";
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
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "monthly_periods");

  const monthId = monthlyPeriodIdSchema.safeParse(formData.get("monthId"));

  if (!monthId.success) {
    return { ok: false, message: "Ο μήνας δεν είναι έγκυρος." };
  }

  const monthlyPeriod = await getMonthlyPeriodById(companyId, monthId.data);

  if (!monthlyPeriod) {
    return { ok: false, message: "Ο μήνας δεν βρέθηκε." };
  }

  const currentMonthKey = getCurrentMonthKey();

  if (isFutureMonth(monthlyPeriod.month_key, currentMonthKey)) {
    await writeAuditLog({
      companyId,
      action: "monthly_period.open_rejected",
      entityType: "monthly_period",
      entityId: monthId.data,
      metadata: { monthKey: monthlyPeriod.month_key, reason: "future_month" },
    });

    return { ok: false, message: FUTURE_MONTH_ERROR };
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

    return { ok: false, message: "Δεν ήταν δυνατό το ξεκλείδωμα του μήνα." };
  }

  await writeAuditLog({
    companyId,
    action: isPastMonth(monthlyPeriod.month_key, currentMonthKey)
      ? "monthly_period.unlocked_for_corrections"
      : "monthly_period.reopened",
    entityType: "monthly_period",
    entityId: monthId.data,
    metadata: { monthKey: monthlyPeriod.month_key },
  });

  revalidatePath("/months");

  return {
    ok: true,
    message: isPastMonth(monthlyPeriod.month_key, currentMonthKey)
      ? "Ο μήνας ξεκλειδώθηκε για διορθώσεις."
      : "Ο μήνας άνοιξε.",
  };
}
