"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { createClient } from "@/src/integrations/supabase/server";
import { getRevenueById } from "../services/get-revenue-by-id";
import type { RevenueActionState } from "../types";
import { revenueIdSchema } from "../validators";

export async function deleteRevenue(
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

  const validation = revenueIdSchema.safeParse(formData.get("id"));
  if (!validation.success) {
    return { ok: false, message: "Το έσοδο δεν είναι έγκυρο." };
  }

  const revenue = await getRevenueById(companyId, validation.data);
  if (!revenue) return { ok: false, message: "Το έσοδο δεν βρέθηκε." };

  try {
    await requireOpenMonth(revenue.month_id);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("revenues")
    .delete()
    .eq("company_id", companyId)
    .eq("id", revenue.id);

  if (error) {
    console.error("[revenues:deleteRevenue] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή του εσόδου." };
  }

  await writeAuditLog({
    companyId,
    action: "revenue.deleted",
    entityType: "revenue",
    entityId: revenue.id,
    metadata: {
      revenueType: revenue.revenue_type,
      invoicedAmount: revenue.invoiced_amount,
      receivedAmount: revenue.received_amount,
    },
  });

  revalidatePath("/revenues");
  revalidatePath("/project-summary");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { ok: true, message: "Το έσοδο διαγράφηκε." };
}
