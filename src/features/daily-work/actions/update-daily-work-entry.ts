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
import type { DailyWorkActionState } from "../types";
import { getDailyWorkEntryById } from "../services/get-daily-work-entry-by-id";
import { validateDailyWorkRelations } from "../services/validate-daily-work-relations";
import { dailyWorkEntryIdSchema, dailyWorkInputSchema } from "../validators";

function mapValidationErrors(
  validation: ReturnType<typeof dailyWorkInputSchema.safeParse>,
): DailyWorkActionState["fieldErrors"] {
  if (validation.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(
      ([field, messages]) => [field, messages?.[0]],
    ),
  );
}

export async function updateDailyWorkEntry(
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

  const validation = dailyWorkInputSchema.safeParse({
    monthId: formData.get("monthId"),
    employeeId: formData.get("employeeId"),
    projectId: formData.get("projectId"),
    workDate: formData.get("workDate"),
    hours: formData.get("hours"),
    overtimeHours: formData.get("overtimeHours"),
    expenseAmount: formData.get("expenseAmount"),
    expenseDescription: formData.get("expenseDescription"),
    workDescription: formData.get("workDescription"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία της καταχώρησης.",
      fieldErrors: mapValidationErrors(validation),
    };
  }

  const input = validation.data;

  try {
    await validateDailyWorkRelations(companyId, input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Η καταχώρηση δεν είναι έγκυρη.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_work_entries")
    .update({
      month_id: input.monthId,
      employee_id: input.employeeId,
      project_id: input.projectId,
      work_date: input.workDate,
      hours: input.hours,
      overtime_hours: input.overtimeHours,
      expense_amount: input.expenseAmount,
      expense_description: input.expenseDescription,
      work_description: input.workDescription,
      notes: input.notes,
    })
    .eq("company_id", companyId)
    .eq("id", entryId.data);

  if (error) {
    console.error("[daily-work:updateDailyWorkEntry] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση καταχώρησης." };
  }

  await writeAuditLog({
    companyId,
    action: "daily_work.updated",
    entityType: "daily_work_entry",
    entityId: entryId.data,
    metadata: {
      previousWorkDate: existingEntry.work_date,
      nextWorkDate: input.workDate,
    },
  });

  revalidatePath("/daily-work");

  return { ok: true, message: "Η καταχώρηση ενημερώθηκε." };
}
