"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { getExpenseById } from "../services/get-expense-by-id";
import { validateExpenseRelations } from "../services/validate-expense-relations";
import type { ExpenseActionState } from "../types";
import { expenseInputSchema } from "../validators";

function fieldErrors(validation: ReturnType<typeof expenseInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function updateExpense(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const validation = expenseInputSchema.safeParse({
    id: formData.get("id"),
    monthId: formData.get("monthId"),
    expenseDate: formData.get("expenseDate"),
    scope: formData.get("scope"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    allocationMethod: formData.get("allocationMethod"),
    notes: formData.get("notes"),
  });

  if (!validation.success || !validation.data.id) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του εξόδου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;
  const expenseId = input.id;

  if (!expenseId) {
    return { ok: false, message: "Το έξοδο δεν είναι έγκυρο." };
  }

  const expense = await getExpenseById(companyId, expenseId);

  if (!expense) return { ok: false, message: "Το έξοδο δεν βρέθηκε." };

  try {
    await requireOpenMonth(expense.month_id);
    await validateExpenseRelations(companyId, input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Το έξοδο δεν είναι έγκυρο.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      month_id: input.monthId,
      expense_date: input.expenseDate,
      scope: input.scope,
      category: input.category,
      description: input.description,
      amount: input.amount,
      allocation_method: input.allocationMethod,
      notes: input.notes,
    })
    .eq("company_id", companyId)
    .eq("id", expenseId);

  if (error) {
    console.error("[expenses:updateExpense] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση του εξόδου." };
  }

  await writeAuditLog({
    companyId,
    action: "expense.updated",
    entityType: "expense",
    entityId: expenseId,
    metadata: { amount: input.amount, scope: input.scope, category: input.category },
  });

  revalidatePath("/expenses");
  return { ok: true, message: "Το έξοδο ενημερώθηκε." };
}
