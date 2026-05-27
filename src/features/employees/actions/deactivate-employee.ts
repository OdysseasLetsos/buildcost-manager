"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import {
  getCurrentCompany,
  requireCompanyMember,
} from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeActionState } from "../types";
import { getEmployeeById } from "../services/get-employee-by-id";
import { employeeIdSchema } from "../validators";

export async function deactivateEmployee(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "employees");

  const employeeId = employeeIdSchema.safeParse(formData.get("employeeId"));

  if (!employeeId.success) {
    return { ok: false, message: "Ο εργαζόμενος δεν είναι έγκυρος." };
  }

  const existingEmployee = await getEmployeeById(companyId, employeeId.data);

  if (!existingEmployee) {
    return { ok: false, message: "Ο εργαζόμενος δεν βρέθηκε." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ active: false, status: "inactive" })
    .eq("company_id", companyId)
    .eq("id", employeeId.data);

  if (error) {
    console.error("[employees:deactivateEmployee] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η απενεργοποίηση εργαζομένου." };
  }

  await writeAuditLog({
    companyId,
    action: "employee.deactivated",
    entityType: "employee",
    entityId: employeeId.data,
    metadata: { fullName: existingEmployee.full_name },
  });

  revalidatePath("/employees");

  return { ok: true, message: "Ο εργαζόμενος απενεργοποιήθηκε." };
}
