"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import { getExpenseById } from "../services/get-expense-by-id";
import type { ExpenseActionState } from "../types";
import { expenseIdSchema } from "../validators";

export async function deleteExpense(
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

  const validation = expenseIdSchema.safeParse(formData.get("id"));
  if (!validation.success) {
    return { ok: false, message: "Το έξοδο δεν είναι έγκυρο." };
  }

  const expense = await getExpenseById(companyId, validation.data);
  if (!expense) return { ok: false, message: "Το έξοδο δεν βρέθηκε." };

  try {
    await requireOpenMonth(expense.month_id);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("company_id", companyId)
    .eq("id", expense.id);

  if (error) {
    console.error("[expenses:deleteExpense] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή του εξόδου." };
  }

  await writeAuditLog({
    companyId,
    action: "expense.deleted",
    entityType: "expense",
    entityId: expense.id,
    metadata: { amount: expense.amount, scope: expense.scope, category: expense.category },
  });

  revalidatePath("/expenses");
  return { ok: true, message: "Το έξοδο διαγράφηκε." };
}
