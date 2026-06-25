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
import {
  employeeInputSchema,
  employeeProjectContractsInputSchema,
  type EmployeeProjectContractInput,
} from "../validators";
import {
  syncEmployeeProjectContracts,
  validateContractProjects,
} from "../services/sync-employee-project-contracts";

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

function parseContractRows(formData: FormData): {
  rawContracts: Array<{
    id?: string;
    projectId: FormDataEntryValue | null;
    contractAmount: FormDataEntryValue | null;
    notes: FormDataEntryValue | null;
  }>;
} {
  const ids = formData.getAll("contractId");
  const projectIds = formData.getAll("contractProjectId");
  const amounts = formData.getAll("contractAmount");
  const notes = formData.getAll("contractNotes");

  return {
    rawContracts: projectIds
      .map((projectId, index) => ({
        id: typeof ids[index] === "string" && ids[index] ? String(ids[index]) : undefined,
        projectId,
        contractAmount: amounts[index] ?? null,
        notes: notes[index] ?? null,
      }))
      .filter(
        (contract) =>
          String(contract.projectId ?? "").trim() ||
          String(contract.contractAmount ?? "").trim() ||
          String(contract.notes ?? "").trim(),
      ),
  };
}

async function validateContracts(
  companyId: string,
  formData: FormData,
): Promise<
  | { ok: true; contracts: EmployeeProjectContractInput[] }
  | { ok: false; state: EmployeeActionState }
> {
  const { rawContracts } = parseContractRows(formData);
  const validation = employeeProjectContractsInputSchema.safeParse(rawContracts);

  if (!validation.success) {
    return {
      ok: false,
      state: {
        ok: false,
        message: "Ελέγξτε τις συμβάσεις έργων του συνεργάτη.",
        fieldErrors: {
          projectContracts:
            validation.error.issues[0]?.message ??
            "Οι συμβάσεις έργων δεν είναι έγκυρες.",
        },
      },
    };
  }

  const projectIds = validation.data.map((contract) => contract.projectId);
  const projectsAreValid = await validateContractProjects(companyId, projectIds);

  if (!projectsAreValid) {
    return {
      ok: false,
      state: {
        ok: false,
        message: "Επιλέξτε ενεργά έργα της τρέχουσας εταιρείας.",
        fieldErrors: {
          projectContracts: "Κάποιο έργο δεν είναι διαθέσιμο.",
        },
      },
    };
  }

  return { ok: true, contracts: validation.data };
}

export async function createEmployee(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "employees");

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
  const contractsResult =
    input.employeeType === "subcontractor"
      ? await validateContracts(companyId, formData)
      : ({ ok: true, contracts: [] } satisfies {
          ok: true;
          contracts: EmployeeProjectContractInput[];
        });

  if (!contractsResult.ok) {
    return contractsResult.state;
  }

  const supabase = await createClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .insert({
      company_id: companyId,
      full_name: input.fullName,
      employee_type: input.employeeType,
      daily_rate: input.employeeType === "subcontractor" ? null : input.dailyRate,
      hourly_rate: input.employeeType === "subcontractor" ? null : input.hourlyRate,
      overtime_rate: input.employeeType === "subcontractor" ? null : input.overtimeRate,
      active: input.active,
      status: input.active ? "active" : "inactive",
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !employee) {
    console.error("[employees:createEmployee] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η δημιουργία εργαζομένου." };
  }

  try {
    await syncEmployeeProjectContracts({
      companyId,
      employeeId: employee.id,
      createdBy: user.id,
      contracts: contractsResult.contracts,
    });
  } catch (error) {
    console.error("[employees:createEmployee:contracts] Error", error);
    return {
      ok: false,
      message: "Ο εργαζόμενος δημιουργήθηκε, αλλά δεν αποθηκεύτηκαν οι συμβάσεις έργων.",
    };
  }

  await writeAuditLog({
    companyId,
    action: "employee.created",
    entityType: "employee",
    entityId: employee.id,
    metadata: { fullName: input.fullName, employeeType: input.employeeType },
  });

  revalidatePath("/employees");
  revalidatePath("/project-summary");

  return { ok: true, message: "Ο εργαζόμενος δημιουργήθηκε." };
}
