"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { validateIkaRelations } from "../services/validate-ika-relations";
import type { IkaActionState } from "../types";
import { ikaInputSchema } from "../validators";

function fieldErrors(validation: ReturnType<typeof ikaInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function upsertEmployeeIka(
  _previousState: IkaActionState,
  formData: FormData,
): Promise<IkaActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "ika");

  const validation = ikaInputSchema.safeParse({
    id: formData.get("id") || undefined,
    monthId: formData.get("monthId"),
    employeeId: formData.get("employeeId"),
    ikaAmount: formData.get("ikaAmount"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία ΙΚΑ.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;

  try {
    await validateIkaRelations(companyId, input);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Η εγγραφή ΙΚΑ δεν είναι έγκυρη.",
    };
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("employee_ika")
    .upsert(
      {
        id: input.id,
        company_id: companyId,
        month_id: input.monthId,
        employee_id: input.employeeId,
        ika_amount: input.ikaAmount,
        notes: input.notes,
        created_by: user.id,
      },
      { onConflict: "company_id,month_id,employee_id" },
    )
    .select("id")
    .single();

  if (error || !row) {
    console.error("[ika:upsertEmployeeIka] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η αποθήκευση ΙΚΑ." };
  }

  await writeAuditLog({
    companyId,
    action: "employee_ika.upserted",
    entityType: "employee_ika",
    entityId: row.id,
    metadata: { amount: input.ikaAmount },
  });

  revalidatePath("/payments");
  return { ok: true, message: "Το ΙΚΑ αποθηκεύτηκε." };
}
