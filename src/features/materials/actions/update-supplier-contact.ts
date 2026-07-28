"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { supplierContactInputSchema } from "../supplier-validators";
import type { Supplier, SupplierActionState } from "../types";

function fieldErrors(
  validation: ReturnType<typeof supplierContactInputSchema.safeParse>,
) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function updateSupplierContact(
  formData: FormData,
): Promise<SupplierActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "materials");

  const validation = supplierContactInputSchema.safeParse({
    id: formData.get("id"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του προμηθευτή.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const supabase = await createClient();
  const input = validation.data;

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      address: input.address,
      phone: input.phone,
      email: input.email,
    })
    .eq("company_id", companyId)
    .eq("id", input.id)
    .eq("active", true)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[materials:updateSupplierContact] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return {
      ok: false,
      message: "Δεν ήταν δυνατή η ενημέρωση των στοιχείων προμηθευτή.",
    };
  }

  await writeAuditLog({
    companyId,
    action: "supplier.updated",
    entityType: "supplier",
    entityId: data.id,
    metadata: {
      updatedFields: ["address", "phone", "email"],
    },
  });

  revalidatePath("/materials");
  revalidatePath("/expenses");

  return {
    ok: true,
    message: "Τα στοιχεία του προμηθευτή ενημερώθηκαν.",
    supplier: data as Supplier,
  };
}
