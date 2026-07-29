"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { CompanyVehicle, ExpenseResourceActionState } from "../types";
import { companyVehicleInputSchema } from "../validators";

function fieldErrors(
  validation: ReturnType<typeof companyVehicleInputSchema.safeParse>,
) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function createCompanyVehicle(
  formData: FormData,
): Promise<ExpenseResourceActionState<CompanyVehicle>> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const validation = companyVehicleInputSchema.safeParse({
    name: formData.get("name"),
    plateNumber: formData.get("plateNumber"),
    model: formData.get("model"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του οχήματος.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_vehicles")
    .insert({
      company_id: companyId,
      name: input.name,
      plate_number: input.plateNumber,
      model: input.model,
      notes: input.notes,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[expenses:createCompanyVehicle] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η αποθήκευση του οχήματος." };
  }

  await writeAuditLog({
    companyId,
    action: "vehicle.created",
    entityType: "company_vehicle",
    entityId: data.id,
    metadata: { name: input.name, plateNumber: input.plateNumber },
  });

  revalidatePath("/expenses");

  return {
    ok: true,
    message: "Το όχημα αποθηκεύτηκε.",
    resource: data as CompanyVehicle,
  };
}
