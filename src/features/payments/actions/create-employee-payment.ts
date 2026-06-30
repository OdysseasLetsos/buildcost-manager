"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
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

export async function createEmployeePayment(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "payments");

  const validation = paymentInputSchema.safeParse({
    monthId: formData.get("monthId"),
    employeeId: formData.get("employeeId"),
    paymentDate: formData.get("paymentDate"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία της πληρωμής.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;

  try {
    await validatePaymentRelations(companyId, input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Η πληρωμή δεν είναι έγκυρη.",
    };
  }

  const supabase = await createClient();
  const { data: payment, error } = await supabase
    .from("employee_payments")
    .insert({
      company_id: companyId,
      month_id: input.monthId,
      employee_id: input.employeeId,
      payment_date: input.paymentDate,
      amount: input.amount,
      payment_method: input.paymentMethod,
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !payment) {
    console.error("[payments:createEmployeePayment] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία πληρωμής." };
  }

  await writeAuditLog({
    companyId,
    action: "employee_payment.created",
    entityType: "employee_payment",
    entityId: payment.id,
    metadata: { amount: input.amount, paymentDate: input.paymentDate },
  });

  revalidatePath("/payments");
  return { ok: true, message: "Η πληρωμή δημιουργήθηκε." };
}
