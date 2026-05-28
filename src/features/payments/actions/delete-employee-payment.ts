"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { getEmployeePaymentById } from "../services/get-employee-payment-by-id";
import type { PaymentActionState } from "../types";
import { paymentIdSchema } from "../validators";

export async function deleteEmployeePayment(
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

  const validation = paymentIdSchema.safeParse(formData.get("id"));

  if (!validation.success) {
    return { ok: false, message: "Η πληρωμή δεν είναι έγκυρη." };
  }

  const payment = await getEmployeePaymentById(companyId, validation.data);

  if (!payment) return { ok: false, message: "Η πληρωμή δεν βρέθηκε." };

  await requireOpenMonth(payment.month_id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_payments")
    .delete()
    .eq("company_id", companyId)
    .eq("id", payment.id);

  if (error) {
    console.error("[payments:deleteEmployeePayment] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή πληρωμής." };
  }

  await writeAuditLog({
    companyId,
    action: "employee_payment.deleted",
    entityType: "employee_payment",
    entityId: payment.id,
    metadata: { amount: payment.amount, paymentDate: payment.payment_date },
  });

  revalidatePath("/payments");
  return { ok: true, message: "Η πληρωμή διαγράφηκε." };
}
