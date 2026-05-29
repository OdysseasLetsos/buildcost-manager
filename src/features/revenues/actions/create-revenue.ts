"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { checkDuplicateRevenueInvoice } from "../services/check-duplicate-revenue-invoice";
import { normalizeRevenueInput } from "../services/normalize-revenue-input";
import { validateRevenueRelations } from "../services/validate-revenue-relations";
import type { RevenueActionState } from "../types";
import { revenueInputSchema } from "../validators";

function fieldErrors(validation: ReturnType<typeof revenueInputSchema.safeParse>) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

export async function createRevenue(
  _previousState: RevenueActionState,
  formData: FormData,
): Promise<RevenueActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "revenues");

  const validation = revenueInputSchema.safeParse({
    monthId: formData.get("monthId"),
    projectId: formData.get("projectId"),
    revenueDate: formData.get("revenueDate"),
    clientName: formData.get("clientName"),
    invoiceNumber: formData.get("invoiceNumber"),
    revenueType: formData.get("revenueType"),
    invoicedAmount: formData.get("invoicedAmount"),
    receivedAmount: formData.get("receivedAmount"),
    remainingAmount: formData.get("remainingAmount"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του εσόδου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;

  let normalized;
  try {
    await validateRevenueRelations(companyId, input);
    normalized = normalizeRevenueInput(input);
    await checkDuplicateRevenueInvoice({
      companyId,
      invoiceNumber: input.invoiceNumber,
      revenueType: input.revenueType,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Το έσοδο δεν είναι έγκυρο.",
    };
  }

  const supabase = await createClient();
  const { data: revenue, error } = await supabase
    .from("revenues")
    .insert({
      company_id: companyId,
      month_id: input.monthId,
      project_id: input.projectId,
      revenue_date: input.revenueDate,
      client_name: input.clientName,
      invoice_number: input.invoiceNumber,
      revenue_type: input.revenueType,
      invoiced_amount: normalized.invoicedAmount,
      received_amount: normalized.receivedAmount,
      remaining_amount: normalized.remainingAmount,
      status: normalized.status,
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !revenue) {
    console.error("[revenues:createRevenue] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία του εσόδου." };
  }

  await writeAuditLog({
    companyId,
    action: "revenue.created",
    entityType: "revenue",
    entityId: revenue.id,
    metadata: {
      revenueType: input.revenueType,
      invoicedAmount: normalized.invoicedAmount,
      receivedAmount: normalized.receivedAmount,
    },
  });

  revalidatePath("/revenues");
  return { ok: true, message: "Το έσοδο δημιουργήθηκε." };
}
