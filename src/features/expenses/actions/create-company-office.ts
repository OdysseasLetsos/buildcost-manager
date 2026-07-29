"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { CompanyOffice, ExpenseResourceActionState } from "../types";
import { companyOfficeInputSchema } from "../validators";

function fieldErrors(validation: ReturnType<typeof companyOfficeInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function createCompanyOffice(
  formData: FormData,
): Promise<ExpenseResourceActionState<CompanyOffice>> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const validation = companyOfficeInputSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του γραφείου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_offices")
    .insert({
      company_id: companyId,
      name: input.name,
      address: input.address,
      notes: input.notes,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[expenses:createCompanyOffice] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η αποθήκευση του γραφείου." };
  }

  await writeAuditLog({
    companyId,
    action: "office.created",
    entityType: "company_office",
    entityId: data.id,
    metadata: { name: input.name },
  });

  revalidatePath("/expenses");

  return {
    ok: true,
    message: "Το γραφείο αποθηκεύτηκε.",
    resource: data as CompanyOffice,
  };
}
