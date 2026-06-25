import { writeAuditLog } from "@/src/core/audit";
import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeProjectContractInput } from "../validators";

type ExistingContract = {
  id: string;
  project_id: string;
  contract_amount: number;
  notes: string | null;
  status: string;
};

export async function validateContractProjects(
  companyId: string,
  projectIds: string[],
): Promise<boolean> {
  if (projectIds.length === 0) {
    return true;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .neq("status", "archived")
    .in("id", projectIds);

  if (error) {
    console.error("[employees:validateContractProjects] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to validate employee project contracts.");
  }

  return (data ?? []).length === projectIds.length;
}

export async function syncEmployeeProjectContracts({
  companyId,
  employeeId,
  createdBy,
  contracts,
}: {
  companyId: string;
  employeeId: string;
  createdBy: string;
  contracts: EmployeeProjectContractInput[];
}): Promise<void> {
  const supabase = await createClient();
  const { data: existingData, error: existingError } = await supabase
    .from("employee_project_contracts")
    .select("id, project_id, contract_amount, notes, status")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId);

  if (existingError) {
    console.error("[employees:syncEmployeeProjectContracts:load] Supabase error", {
      message: existingError.message,
      code: existingError.code,
      details: existingError.details,
      hint: existingError.hint,
    });

    throw new Error("Unable to load employee project contracts.");
  }

  const existingContracts = (existingData ?? []) as ExistingContract[];
  const existingById = new Map(existingContracts.map((contract) => [contract.id, contract]));
  const submittedIds = new Set(contracts.flatMap((contract) => (contract.id ? [contract.id] : [])));

  for (const contract of existingContracts) {
    if (submittedIds.has(contract.id)) {
      continue;
    }

    const { error } = await supabase
      .from("employee_project_contracts")
      .delete()
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("id", contract.id);

    if (error) {
      console.error("[employees:syncEmployeeProjectContracts:delete] Supabase error", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      throw new Error("Unable to delete employee project contract.");
    }

    await writeAuditLog({
      companyId,
      action: "employee_project_contract.deleted",
      entityType: "employee_project_contract",
      entityId: contract.id,
      metadata: { employeeId, projectId: contract.project_id },
    });
  }

  for (const contract of contracts) {
    if (contract.id && existingById.has(contract.id)) {
      const { error } = await supabase
        .from("employee_project_contracts")
        .update({
          project_id: contract.projectId,
          contract_amount: contract.contractAmount,
          notes: contract.notes,
          status: "active",
        })
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("id", contract.id);

      if (error) {
        console.error("[employees:syncEmployeeProjectContracts:update] Supabase error", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });

        throw new Error("Unable to update employee project contract.");
      }

      await writeAuditLog({
        companyId,
        action: "employee_project_contract.updated",
        entityType: "employee_project_contract",
        entityId: contract.id,
        metadata: {
          employeeId,
          projectId: contract.projectId,
          contractAmount: contract.contractAmount,
        },
      });

      continue;
    }

    const { data, error } = await supabase
      .from("employee_project_contracts")
      .insert({
        company_id: companyId,
        employee_id: employeeId,
        project_id: contract.projectId,
        contract_amount: contract.contractAmount,
        notes: contract.notes,
        status: "active",
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[employees:syncEmployeeProjectContracts:create] Supabase error", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });

      throw new Error("Unable to create employee project contract.");
    }

    await writeAuditLog({
      companyId,
      action: "employee_project_contract.created",
      entityType: "employee_project_contract",
      entityId: data.id,
      metadata: {
        employeeId,
        projectId: contract.projectId,
        contractAmount: contract.contractAmount,
      },
    });
  }
}
