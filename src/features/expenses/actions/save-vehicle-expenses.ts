"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import { getCompanyVehicleById } from "../services/get-company-vehicles";
import type { ExpenseActionState } from "../types";
import { vehicleExpenseBatchInputSchema } from "../validators";

const batchAmountFields = [
  {
    field: "maintenanceAmount",
    subtype: "maintenance",
    label: "Έξοδα συντήρησης",
  },
  { field: "otherAmount", subtype: "other", label: "Άλλο" },
] as const;

function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export async function saveVehicleExpenses(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const validation = vehicleExpenseBatchInputSchema.safeParse({
    monthId: formData.get("monthId"),
    vehicleId: formData.get("vehicleId"),
    expenseDate: formData.get("expenseDate"),
    maintenanceAmount: formData.get("maintenanceAmount"),
    otherAmount: formData.get("otherAmount"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία των εξόδων οχήματος.",
      fieldErrors: Object.fromEntries(
        Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
          field,
          messages?.[0],
        ]),
      ),
    };
  }

  const input = validation.data;
  const lines = batchAmountFields
    .map((amountField) => ({
      subtype: amountField.subtype,
      label: amountField.label,
      amount: input[amountField.field],
    }))
    .filter((line) => line.amount > 0);

  if (lines.length === 0) {
    return {
      ok: false,
      message: "Συμπληρώστε τουλάχιστον ένα ποσό εξόδου.",
    };
  }

  try {
    const monthlyPeriod = await requireOpenMonth(input.monthId);

    if (monthlyPeriod.company_id !== companyId) {
      return { ok: false, message: "Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία." };
    }

    if (!input.expenseDate.startsWith(`${monthlyPeriod.month_key}-`)) {
      return {
        ok: false,
        message: "Η ημερομηνία εξόδου πρέπει να ανήκει στον επιλεγμένο μήνα.",
      };
    }

    if (input.expenseDate > getTodayDateKey()) {
      return {
        ok: false,
        message: "Δεν μπορείτε να καταχωρήσετε έξοδο σε μελλοντική ημερομηνία.",
      };
    }

    const vehicle = await getCompanyVehicleById(companyId, input.vehicleId);
    if (!vehicle || !vehicle.active) {
      return { ok: false, message: "Το όχημα δεν είναι διαθέσιμο." };
    }

    const supabase = await createClient();
    let createdCount = 0;
    let updatedCount = 0;

    for (const line of lines) {
      const description = `${line.label} - ${vehicle.name}`;
      const { data: existingExpense, error: existingError } = await supabase
        .from("expenses")
        .select("id")
        .eq("company_id", companyId)
        .eq("month_id", input.monthId)
        .eq("expense_date", input.expenseDate)
        .eq("category", "transport")
        .eq("expense_subtype", line.subtype)
        .eq("vehicle_id", input.vehicleId)
        .is("office_id", null)
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error("[expenses:saveVehicleExpenses:lookup] Supabase error", {
          message: existingError.message,
          code: existingError.code,
          details: existingError.details,
          hint: existingError.hint,
        });
        return { ok: false, message: "Δεν ήταν δυνατή η αποθήκευση των εξόδων οχήματος." };
      }

      if (existingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update({
            amount: line.amount,
            description,
            notes: input.notes,
            allocation_method: "by_project_hours",
          })
          .eq("company_id", companyId)
          .eq("id", existingExpense.id);

        if (error) {
          console.error("[expenses:saveVehicleExpenses:update] Supabase error", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση των εξόδων οχήματος." };
        }

        updatedCount += 1;
        await writeAuditLog({
          companyId,
          action: "expense.vehicle.updated",
          entityType: "expense",
          entityId: existingExpense.id,
          metadata: {
            amount: line.amount,
            subtype: line.subtype,
            vehicleId: input.vehicleId,
          },
        });
      } else {
        const { data: expense, error } = await supabase
          .from("expenses")
          .insert({
            company_id: companyId,
            month_id: input.monthId,
            expense_date: input.expenseDate,
            scope: "general",
            category: "transport",
            expense_subtype: line.subtype,
            office_id: null,
            vehicle_id: input.vehicleId,
            description,
            amount: line.amount,
            allocation_method: "by_project_hours",
            allocation_status: "pending",
            notes: input.notes,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error || !expense) {
          console.error("[expenses:saveVehicleExpenses:create] Supabase error", {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
          });
          return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία των εξόδων οχήματος." };
        }

        createdCount += 1;
        await writeAuditLog({
          companyId,
          action: "expense.vehicle.created",
          entityType: "expense",
          entityId: expense.id,
          metadata: {
            amount: line.amount,
            subtype: line.subtype,
            vehicleId: input.vehicleId,
          },
        });
      }
    }

    revalidatePath("/expenses");
    return {
      ok: true,
      message:
        updatedCount > 0 && createdCount === 0
          ? "Τα έξοδα ενημερώθηκαν επιτυχώς."
          : "Τα έξοδα αποθηκεύτηκαν επιτυχώς.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Δεν ήταν δυνατή η αποθήκευση των εξόδων οχήματος.",
    };
  }
}
