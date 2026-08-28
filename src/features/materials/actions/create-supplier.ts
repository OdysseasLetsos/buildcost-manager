"use server";

import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { normalizeVat } from "@/src/shared/utils/normalize-vat";
import { supplierInputSchema } from "../supplier-validators";
import type { Supplier, SupplierActionState } from "../types";

function fieldErrors(validation: ReturnType<typeof supplierInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function createSupplier(formData: FormData): Promise<SupplierActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "materials");

  const validation = supplierInputSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του προμηθευτή.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;
  const supabase = await createClient();
  const existingResult = await supabase
    .from("suppliers")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true);

  if (existingResult.error) {
    console.error("[materials:createSupplier:existing] Supabase error", {
      message: existingResult.error.message,
      code: existingResult.error.code,
      details: existingResult.error.details,
      hint: existingResult.error.hint,
    });
    return {
      ok: false,
      message: "Δεν ήταν δυνατή η αποθήκευση του προμηθευτή.",
    };
  }

  const normalizedInputTaxId = normalizeVat(input.taxId);
  const existingSupplier = ((existingResult.data ?? []) as Supplier[]).find(
    (supplier) => normalizeVat(supplier.tax_id) === normalizedInputTaxId,
  );

  if (existingSupplier) {
    return {
      ok: false,
      message: "Υπάρχει ήδη προμηθευτής με αυτό το ΑΦΜ.",
      existingSupplier,
    };
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      company_id: companyId,
      name: input.name,
      tax_id: input.taxId,
      address: input.address,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[materials:createSupplier] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return {
      ok: false,
      message: "Δεν ήταν δυνατή η αποθήκευση του προμηθευτή.",
    };
  }

  await writeAuditLog({
    companyId,
    action: "supplier.created",
    entityType: "supplier",
    entityId: data.id,
    metadata: { taxId: input.taxId, name: input.name },
  });

  return {
    ok: true,
    message: "Ο προμηθευτής αποθηκεύτηκε επιτυχώς.",
    supplier: data as Supplier,
  };
}
