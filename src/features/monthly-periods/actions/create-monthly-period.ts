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
import {
  FUTURE_MONTH_ERROR,
  getCurrentMonthKey,
  isCurrentMonth,
  isFutureMonth,
  isPastMonth,
} from "../services/month-rules";
import { monthlyPeriodInputSchema } from "../validators";

function getMonthDates(monthKey: string): { startsOn: string; endsOn: string } {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  const startsOn = `${monthKey}-01`;
  const lastDay = new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
  const endsOn = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

  return { startsOn, endsOn };
}

function duplicateMonthMessage(code?: string): string {
  return code === "23505"
    ? "Υπάρχει ήδη περίοδος για αυτόν τον μήνα."
    : "Δεν ήταν δυνατή η δημιουργία μήνα.";
}

export async function createMonthlyPeriod(
  _previousState: MonthlyPeriodActionState,
  formData: FormData,
): Promise<MonthlyPeriodActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "monthly_periods");

  const validation = monthlyPeriodInputSchema.safeParse({
    monthKey: formData.get("monthKey"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του μήνα.",
      fieldErrors: {
        monthKey: validation.error.flatten().fieldErrors.monthKey?.[0],
      },
    };
  }

  const { monthKey } = validation.data;
  const currentMonthKey = getCurrentMonthKey();

  if (isFutureMonth(monthKey, currentMonthKey)) {
    await writeAuditLog({
      companyId,
      action: "monthly_period.open_rejected",
      entityType: "monthly_period",
      entityId: null,
      metadata: { monthKey, reason: "future_month" },
    });

    return {
      ok: false,
      message: FUTURE_MONTH_ERROR,
      fieldErrors: { monthKey: FUTURE_MONTH_ERROR },
    };
  }

  const { startsOn, endsOn } = getMonthDates(monthKey);
  const createLocked = isPastMonth(monthKey, currentMonthKey);
  const supabase = await createClient();
  const { data: monthlyPeriod, error } = await supabase
    .from("monthly_periods")
    .insert({
      company_id: companyId,
      month_key: monthKey,
      starts_on: startsOn,
      ends_on: endsOn,
      is_locked: createLocked,
      status: createLocked ? "locked" : "open",
      locked_at: createLocked ? new Date().toISOString() : null,
      locked_by: createLocked ? user.id : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !monthlyPeriod) {
    console.error("[monthly-periods:createMonthlyPeriod] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });

    return { ok: false, message: duplicateMonthMessage(error?.code) };
  }

  await writeAuditLog({
    companyId,
    action: createLocked
      ? "monthly_period.previous_created_locked"
      : "monthly_period.created",
    entityType: "monthly_period",
    entityId: monthlyPeriod.id,
    metadata: {
      monthKey,
      currentMonth: isCurrentMonth(monthKey, currentMonthKey),
      lockedByDefault: createLocked,
    },
  });

  revalidatePath("/months");

  return {
    ok: true,
    message: createLocked
      ? "Ο προηγούμενος μήνας δημιουργήθηκε κλειδωμένος."
      : "Ο μήνας δημιουργήθηκε.",
  };
}
