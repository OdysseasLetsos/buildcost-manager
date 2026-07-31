"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import type { ExpenseActionState } from "../types";
import { taxExpenseBatchInputSchema } from "../validators";

const fixedTaxFields = [
  { field: "vatAmount", subtype: "vat", label: "ΦΠΑ" },
  { field: "feeAmount", subtype: "fee", label: "ΦΕΕ" },
  { field: "fmyAmount", subtype: "fmy", label: "ΦΜΥ" },
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

export async function saveTaxExpenses(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const customTaxNames = formData.getAll("customTaxName");
  const customTaxAmounts = formData.getAll("customTaxAmount");
  const validation = taxExpenseBatchInputSchema.safeParse({
    monthId: formData.get("monthId"),
    expenseDate: formData.get("expenseDate"),
    vatAmount: formData.get("vatAmount"),
    feeAmount: formData.get("feeAmount"),
    fmyAmount: formData.get("fmyAmount"),
    otherAmount: formData.get("otherAmount"),
    customTaxes: customTaxNames.map((name, index) => ({
      name,
      amount: customTaxAmounts[index] ?? "",
    })),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία των φόρων.",
      fieldErrors: Object.fromEntries(
        Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
          field,
          messages?.[0],
        ]),
      ),
    };
  }

  const input = validation.data;
  const lines = [
    ...fixedTaxFields
      .map((amountField) => ({
        subtype: amountField.subtype,
        label: amountField.label,
        amount: input[amountField.field],
        description: amountField.label,
      }))
      .filter((line) => line.amount > 0),
    ...input.customTaxes
      .filter((customTax) => customTax.amount > 0)
      .map((customTax) => ({
        subtype: "custom",
        label: customTax.name,
        amount: customTax.amount,
        description: customTax.name,
      })),
  ];

  if (lines.length === 0) {
    return {
      ok: false,
      message: "Συμπληρώστε τουλάχιστον ένα ποσό φόρου.",
    };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  try {
    const monthlyPeriod = await requireOpenMonth(input.monthId);

    if (monthlyPeriod.company_id !== companyId) {
      return { ok: false, message: "Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία." };
    }

    if (!input.expenseDate.startsWith(`${monthlyPeriod.month_key}-`)) {
      return {
        ok: false,
        message: "Η ημερομηνία φόρου πρέπει να ανήκει στον επιλεγμένο μήνα.",
      };
    }

    if (input.expenseDate > getTodayDateKey()) {
      return {
        ok: false,
        message: "Δεν μπορείτε να καταχωρήσετε φόρο σε μελλοντική ημερομηνία.",
      };
    }

    const supabase = await createClient();
    let createdCount = 0;
    let updatedCount = 0;

    for (const line of lines) {
      let existingQuery = supabase
        .from("expenses")
        .select("id")
        .eq("company_id", companyId)
        .eq("month_id", input.monthId)
        .eq("expense_date", input.expenseDate)
        .eq("category", "taxes")
        .eq("expense_subtype", line.subtype)
        .is("office_id", null)
        .is("vehicle_id", null);

      if (line.subtype === "custom") {
        existingQuery = existingQuery.eq("description", line.description);
      }

      const { data: existingExpense, error: existingError } = await existingQuery
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error("[expenses:saveTaxExpenses:lookup] Supabase error", {
          message: existingError.message,
          code: existingError.code,
          details: existingError.details,
          hint: existingError.hint,
        });
        return { ok: false, message: "Δεν ήταν δυνατή η αποθήκευση των φόρων." };
      }

      if (existingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update({
            amount: line.amount,
            description: line.description,
            notes: input.notes,
            allocation_method: "equal_per_active_project",
          })
          .eq("company_id", companyId)
          .eq("id", existingExpense.id);

        if (error) {
          console.error("[expenses:saveTaxExpenses:update] Supabase error", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση των φόρων." };
        }

        updatedCount += 1;
        await writeAuditLog({
          companyId,
          action: "expense.tax.updated",
          entityType: "expense",
          entityId: existingExpense.id,
          metadata: {
            amount: line.amount,
            subtype: line.subtype,
            description: line.description,
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
            category: "taxes",
            expense_subtype: line.subtype,
            office_id: null,
            vehicle_id: null,
            description: line.description,
            amount: line.amount,
            allocation_method: "equal_per_active_project",
            allocation_status: "pending",
            notes: input.notes,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error || !expense) {
          console.error("[expenses:saveTaxExpenses:create] Supabase error", {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
          });
          return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία των φόρων." };
        }

        createdCount += 1;
        await writeAuditLog({
          companyId,
          action: "expense.tax.created",
          entityType: "expense",
          entityId: expense.id,
          metadata: {
            amount: line.amount,
            subtype: line.subtype,
            description: line.description,
          },
        });
      }
    }

    revalidatePath("/expenses");
    return {
      ok: true,
      message:
        updatedCount > 0 && createdCount === 0
          ? "Οι φόροι ενημερώθηκαν επιτυχώς."
          : "Οι φόροι αποθηκεύτηκαν επιτυχώς.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Δεν ήταν δυνατή η αποθήκευση των φόρων.",
    };
  }
}
