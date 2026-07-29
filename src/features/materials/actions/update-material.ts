"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { requireOpenMonth } from "../../monthly-periods/services/require-open-month";
import { checkDuplicateMaterialInvoice } from "../services/check-duplicate-material-invoice";
import { getMaterialById } from "../services/get-material-by-id";
import { resolveMaterialSupplier } from "../services/resolve-material-supplier";
import { validateMaterialRelations } from "../services/validate-material-relations";
import type { MaterialActionState } from "../types";
import { materialInputSchema } from "../validators";

function fieldErrors(validation: ReturnType<typeof materialInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

function calculateMaterialTotal(netAmount: number, vatAmount: number): number {
  return Math.round((netAmount + vatAmount) * 100) / 100;
}

function normalizePaymentStatus(paidAmount: number, totalAmount: number) {
  if (paidAmount <= 0) return "pending";
  if (Math.abs(paidAmount - totalAmount) <= 0.01) return "paid";
  return "partial";
}

export async function updateMaterial(
  _previousState: MaterialActionState,
  formData: FormData,
): Promise<MaterialActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office", "foreman"]);
  await requireFeature(companyId, "materials");

  const validation = materialInputSchema.safeParse({
    id: formData.get("id"),
    monthId: formData.get("monthId"),
    projectId: formData.get("projectId"),
    invoiceDate: formData.get("invoiceDate"),
    supplierId: formData.get("supplierId"),
    supplierName: formData.get("supplierName"),
    supplierVat: formData.get("supplierVat"),
    invoiceNumber: formData.get("invoiceNumber"),
    description: formData.get("description"),
    netAmount: formData.get("netAmount"),
    vatAmount: formData.get("vatAmount"),
    totalAmount: formData.get("totalAmount"),
    paidAmount: formData.get("paidAmount"),
    paymentStatus: formData.get("paymentStatus"),
    notes: formData.get("notes"),
  });

  if (!validation.success || !validation.data.id) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του τιμολογίου υλικών.",
      fieldErrors: fieldErrors(validation),
    };
  }

  let input = {
    ...validation.data,
    totalAmount: calculateMaterialTotal(
      validation.data.netAmount,
      validation.data.vatAmount,
    ),
  };
  const materialId = input.id;

  if (!materialId) {
    return { ok: false, message: "Το τιμολόγιο υλικών δεν είναι έγκυρο." };
  }

  const material = await getMaterialById(companyId, materialId);

  if (!material) return { ok: false, message: "Το τιμολόγιο υλικών δεν βρέθηκε." };

  try {
    if (input.paidAmount - input.totalAmount > 0.01) {
      throw new Error(
        "Το πληρωμένο ποσό δεν μπορεί να είναι μεγαλύτερο από το σύνολο του τιμολογίου.",
      );
    }

    input.paymentStatus = normalizePaymentStatus(
      input.paidAmount,
      input.totalAmount,
    );
    input = await resolveMaterialSupplier(companyId, input);
    await requireOpenMonth(material.month_id);
    await validateMaterialRelations(companyId, input);
    await checkDuplicateMaterialInvoice({
      companyId,
      supplierName: input.supplierName,
      supplierVat: input.supplierVat,
      invoiceNumber: input.invoiceNumber,
      excludeMaterialId: materialId,
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Το τιμολόγιο υλικών δεν είναι έγκυρο.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({
      month_id: input.monthId,
      project_id: input.projectId,
      supplier_id: input.supplierId,
      invoice_date: input.invoiceDate,
      supplier_name: input.supplierName,
      supplier_vat: input.supplierVat,
      invoice_number: input.invoiceNumber,
      description: input.description,
      net_amount: input.netAmount,
      vat_amount: input.vatAmount,
      total_amount: input.totalAmount,
      paid_amount: input.paidAmount,
      payment_status: input.paymentStatus,
      notes: input.notes,
    })
    .eq("company_id", companyId)
    .eq("id", materialId);

  if (error) {
    console.error("[materials:updateMaterial] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση τιμολογίου υλικών." };
  }

  await writeAuditLog({
    companyId,
    action: "material.updated",
    entityType: "material",
    entityId: materialId,
    metadata: { invoiceNumber: input.invoiceNumber, totalAmount: input.totalAmount },
  });

  revalidatePath("/materials");
  revalidatePath("/expenses");
  return { ok: true, message: "Το τιμολόγιο υλικών ενημερώθηκε." };
}
