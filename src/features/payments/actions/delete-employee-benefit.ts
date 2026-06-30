"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { createClient } from "@/src/integrations/supabase/server";
import { benefitIdSchema } from "../benefit-validators";
import { assertWritablePaymentMonth } from "../services/payment-month-rules";
import type { BenefitActionState, EmployeeBenefit } from "../types";

export async function deleteEmployeeBenefit(
  _previousState: BenefitActionState,
  formData: FormData,
): Promise<BenefitActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "payments");

  const validation = benefitIdSchema.safeParse(formData.get("id"));

  if (!validation.success) {
    return { ok: false, message: "Η εγγραφή δεν είναι έγκυρη." };
  }

  const supabase = await createClient();
  const { data: row, error: loadError } = await supabase
    .from("employee_benefits")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", validation.data)
    .maybeSingle();

  if (loadError || !row) {
    console.error("[payments:deleteEmployeeBenefit:load] Supabase error", {
      message: loadError?.message,
      code: loadError?.code,
      details: loadError?.details,
      hint: loadError?.hint,
    });
    return { ok: false, message: "Η εγγραφή δεν βρέθηκε." };
  }

  const benefit = row as EmployeeBenefit;
  const month = (await getMonthlyPeriods(companyId)).find(
    (period) => period.month_key === benefit.month_key,
  );

  if (!month) {
    return { ok: false, message: "Ο μήνας δεν βρέθηκε." };
  }

  try {
    assertWritablePaymentMonth(month);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Η εγγραφή δεν είναι έγκυρη.",
    };
  }

  const { error } = await supabase
    .from("employee_benefits")
    .delete()
    .eq("company_id", companyId)
    .eq("id", benefit.id);

  if (error) {
    console.error("[payments:deleteEmployeeBenefit] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή εγγραφής." };
  }

  await writeAuditLog({
    companyId,
    action: "employee_benefit.deleted",
    entityType: "employee_benefit",
    entityId: benefit.id,
    metadata: { amount: benefit.amount, benefitDate: benefit.benefit_date },
  });

  revalidatePath("/payments");
  return { ok: true, message: "Η εγγραφή διαγράφηκε." };
}
