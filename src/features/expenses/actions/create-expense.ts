"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
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

export async function createExpense(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const validation = expenseInputSchema.safeParse({
    monthId: formData.get("monthId"),
    expenseDate: formData.get("expenseDate"),
    scope: formData.get("scope"),
    category: formData.get("category"),
    expenseSubtype: formData.get("expenseSubtype"),
    officeId: formData.get("officeId"),
    vehicleId: formData.get("vehicleId"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    allocationMethod: formData.get("allocationMethod"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του εξόδου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;

  try {
    await validateExpenseRelations(companyId, input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Το έξοδο δεν είναι έγκυρο.",
    };
  }

  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      company_id: companyId,
      month_id: input.monthId,
      expense_date: input.expenseDate,
      scope: input.scope,
      category: input.category,
      expense_subtype: input.expenseSubtype,
      office_id: input.category === "office" ? input.officeId : null,
      vehicle_id: input.category === "transport" ? input.vehicleId : null,
      description: input.description,
      amount: input.amount,
      allocation_method: input.allocationMethod,
      allocation_status: "pending",
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !expense) {
    console.error("[expenses:createExpense] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία του εξόδου." };
  }

  await writeAuditLog({
    companyId,
    action: "expense.created",
    entityType: "expense",
    entityId: expense.id,
    metadata: {
      amount: input.amount,
      scope: input.scope,
      category: input.category,
      expenseSubtype: input.expenseSubtype,
    },
  });

  revalidatePath("/expenses");
  return { ok: true, message: "Το έξοδο δημιουργήθηκε." };
}
