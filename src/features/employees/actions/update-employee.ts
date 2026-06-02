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
import { employeeIdSchema, employeeInputSchema } from "../validators";

function mapValidationErrors(
  validation: ReturnType<typeof employeeInputSchema.safeParse>,
): EmployeeActionState["fieldErrors"] {
  if (validation.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(
      ([field, messages]) => [field, messages?.[0]],
    ),
  );
}

export async function updateEmployee(
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

  const validation = employeeInputSchema.safeParse({
    fullName: formData.get("fullName"),
    employeeType: formData.get("employeeType"),
    dailyRate: formData.get("dailyRate"),
    hourlyRate: formData.get("hourlyRate"),
    overtimeRate: formData.get("overtimeRate"),
    active: formData.get("active"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του εργαζομένου.",
      fieldErrors: mapValidationErrors(validation),
    };
  }

  const input = validation.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      full_name: input.fullName,
      employee_type: input.employeeType,
      daily_rate: input.dailyRate,
      hourly_rate: input.hourlyRate,
      overtime_rate: input.overtimeRate,
      active: input.active,
      status: input.active ? "active" : "inactive",
      notes: input.notes,
    })
    .eq("company_id", companyId)
    .eq("id", employeeId.data);

  if (error) {
    console.error("[employees:updateEmployee] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η ενημέρωση εργαζομένου." };
  }

  await writeAuditLog({
    companyId,
    action: "employee.updated",
    entityType: "employee",
    entityId: employeeId.data,
    metadata: {
      previousFullName: existingEmployee.full_name,
      nextFullName: input.fullName,
      employeeType: input.employeeType,
      active: input.active,
    },
  });

  revalidatePath("/employees");

  return { ok: true, message: "Ο εργαζόμενος ενημερώθηκε." };
}
