"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { getEmployeePaymentById } from "../services/get-employee-payment-by-id";
import { validatePaymentRelations } from "../services/validate-payment-relations";
import type { PaymentActionState } from "../types";
import { paymentInputSchema } from "../validators";

function fieldErrors(validation: ReturnType<typeof paymentInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function updateEmployeePayment(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "payments");

  const validation = paymentInputSchema.safeParse({
    id: formData.get("id"),
    monthId: formData.get("monthId"),
    employeeId: formData.get("employeeId"),
    paymentDate: formData.get("paymentDate"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes"),
  });

  if (!validation.success || !validation.data.id) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία της πληρωμής.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;
  const paymentId = input.id;

  if (!paymentId) {
    return { ok: false, message: "Η πληρωμή δεν είναι έγκυρη." };
  }

  const existing = await getEmployeePaymentById(companyId, paymentId);

  if (!existing) return { ok: false, message: "Η πληρωμή δεν βρέθηκε." };

  try {
    await validatePaymentRelations(companyId, input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Η πληρωμή δεν είναι έγκυρη.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_payments")
    .update({
      month_id: input.monthId,
      employee_id: input.employeeId,
      payment_date: input.paymentDate,
      amount: input.amount,
      payment_method: input.paymentMethod,
      notes: input.notes,
    })
    .eq("company_id", companyId)
    .eq("id", paymentId);

  if (error) {
    console.error("[payments:updateEmployeePayment] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση πληρωμής." };
  }

  await writeAuditLog({
    companyId,
    action: "employee_payment.updated",
    entityType: "employee_payment",
    entityId: paymentId,
    metadata: { amount: input.amount, paymentDate: input.paymentDate },
  });

  revalidatePath("/payments");
  return { ok: true, message: "Η πληρωμή ενημερώθηκε." };
}
