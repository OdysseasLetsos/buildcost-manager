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
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import type { DailyWorkActionState } from "../types";
import { getDailyWorkEntryById } from "../services/get-daily-work-entry-by-id";
import { dailyWorkEntryIdSchema } from "../validators";

export async function deleteDailyWorkEntry(
  _previousState: DailyWorkActionState,
  formData: FormData,
): Promise<DailyWorkActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office", "foreman"]);
  await requireFeature(companyId, "daily_work");

  const entryId = dailyWorkEntryIdSchema.safeParse(formData.get("entryId"));

  if (!entryId.success) {
    return { ok: false, message: "Η καταχώρηση δεν είναι έγκυρη." };
  }

  const existingEntry = await getDailyWorkEntryById(companyId, entryId.data);

  if (!existingEntry) {
    return { ok: false, message: "Η καταχώρηση δεν βρέθηκε." };
  }

  try {
    await requireOpenMonth(existingEntry.month_id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Η καταχώρηση δεν μπορεί να διαγραφεί.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_work_entries")
    .delete()
    .eq("company_id", companyId)
    .eq("id", entryId.data);

  if (error) {
    console.error("[daily-work:deleteDailyWorkEntry] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή καταχώρησης." };
  }

  await writeAuditLog({
    companyId,
    action: "daily_work.deleted",
    entityType: "daily_work_entry",
    entityId: entryId.data,
    metadata: { workDate: existingEntry.work_date },
  });

  revalidatePath("/daily-work");

  return { ok: true, message: "Η καταχώρηση διαγράφηκε." };
}
