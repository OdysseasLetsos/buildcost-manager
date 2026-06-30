"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { benefitInputSchema } from "../benefit-validators";
import { validateBenefitRelations } from "../services/validate-benefit-relations";
import type { BenefitActionState } from "../types";

function fieldErrors(validation: ReturnType<typeof benefitInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function createEmployeeBenefit(
  _previousState: BenefitActionState,
  formData: FormData,
): Promise<BenefitActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "payments");

  const validation = benefitInputSchema.safeParse({
    monthId: formData.get("monthId"),
    employeeId: formData.get("employeeId"),
    benefitType: formData.get("benefitType"),
    amount: formData.get("amount"),
    benefitDate: formData.get("benefitDate"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία της εγγραφής.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;

  try {
    const { monthlyPeriod } = await validateBenefitRelations(companyId, input);
    const supabase = await createClient();
    const { data: benefit, error } = await supabase
      .from("employee_benefits")
      .insert({
        company_id: companyId,
        employee_id: input.employeeId,
        month_key: monthlyPeriod.month_key,
        benefit_type: input.benefitType,
        amount: input.amount,
        benefit_date: input.benefitDate,
        notes: input.notes,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !benefit) {
      console.error("[payments:createEmployeeBenefit] Supabase error", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία εγγραφής." };
    }

    await writeAuditLog({
      companyId,
      action: "employee_benefit.created",
      entityType: "employee_benefit",
      entityId: benefit.id,
      metadata: { amount: input.amount, benefitDate: input.benefitDate },
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Η εγγραφή δεν είναι έγκυρη.",
    };
  }

  revalidatePath("/payments");
  return { ok: true, message: "Η εγγραφή αποθηκεύτηκε." };
}
