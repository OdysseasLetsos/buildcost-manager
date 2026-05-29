"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import { checkDuplicateRevenueInvoice } from "../services/check-duplicate-revenue-invoice";
import { getRevenueById } from "../services/get-revenue-by-id";
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

export async function updateRevenue(
  _previousState: RevenueActionState,
  formData: FormData,
): Promise<RevenueActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "revenues");

  const validation = revenueInputSchema.safeParse({
    id: formData.get("id"),
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

  if (!validation.success || !validation.data.id) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του εσόδου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  const input = validation.data;
  const revenueId = input.id;

  if (!revenueId) return { ok: false, message: "Το έσοδο δεν είναι έγκυρο." };

  const existingRevenue = await getRevenueById(companyId, revenueId);
  if (!existingRevenue) return { ok: false, message: "Το έσοδο δεν βρέθηκε." };

  let normalized;
  try {
    await requireOpenMonth(existingRevenue.month_id);
    await validateRevenueRelations(companyId, input);
    normalized = normalizeRevenueInput(input);
    await checkDuplicateRevenueInvoice({
      companyId,
      invoiceNumber: input.invoiceNumber,
      revenueType: input.revenueType,
      excludeRevenueId: revenueId,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Το έσοδο δεν είναι έγκυρο.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("revenues")
    .update({
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
    })
    .eq("company_id", companyId)
    .eq("id", revenueId);

  if (error) {
    console.error("[revenues:updateRevenue] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση του εσόδου." };
  }

  await writeAuditLog({
    companyId,
    action: "revenue.updated",
    entityType: "revenue",
    entityId: revenueId,
    metadata: {
      revenueType: input.revenueType,
      invoicedAmount: normalized.invoicedAmount,
      receivedAmount: normalized.receivedAmount,
    },
  });

  revalidatePath("/revenues");
  return { ok: true, message: "Το έσοδο ενημερώθηκε." };
}
