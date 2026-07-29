"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { CompanyVehicle, ExpenseResourceActionState } from "../types";

export async function deactivateCompanyVehicle(
  vehicleId: string,
): Promise<ExpenseResourceActionState<CompanyVehicle>> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "expenses");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_vehicles")
    .update({ active: false })
    .eq("company_id", companyId)
    .eq("id", vehicleId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[expenses:deactivateCompanyVehicle] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η απενεργοποίηση του οχήματος." };
  }

  await writeAuditLog({
    companyId,
    action: "vehicle.deactivated",
    entityType: "company_vehicle",
    entityId: data.id,
    metadata: { name: data.name, plateNumber: data.plate_number },
  });

  revalidatePath("/expenses");

  return {
    ok: true,
    message:
      "Το όχημα χρησιμοποιείται ήδη σε έξοδα και δεν μπορεί να διαγραφεί οριστικά. Απενεργοποιήθηκε.",
    resource: data as CompanyVehicle,
  };
}
