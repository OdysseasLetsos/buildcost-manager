import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeProjectContract } from "../types";

type ContractRow = Omit<EmployeeProjectContract, "project">;

type ProjectLabel = {
  id: string;
  code: string;
  name: string;
};

export async function getEmployeeProjectContracts(
  companyId: string,
  employeeId?: string,
): Promise<EmployeeProjectContract[]> {
  const supabase = await createClient();
  let query = supabase
    .from("employee_project_contracts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[employees:getEmployeeProjectContracts] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load employee project contracts.");
  }

  const contracts = (data ?? []) as ContractRow[];
  const projectIds = [...new Set(contracts.map((contract) => contract.project_id))];

  if (projectIds.length === 0) {
    return contracts.map((contract) => ({ ...contract, project: null }));
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, code, name")
    .eq("company_id", companyId)
    .in("id", projectIds);

  if (projectsError) {
    console.error("[employees:getEmployeeProjectContracts:projects] Supabase error", {
      message: projectsError.message,
      code: projectsError.code,
      details: projectsError.details,
      hint: projectsError.hint,
    });

    throw new Error("Unable to load employee contract project labels.");
  }

  const projectsById = new Map(
    ((projectsData ?? []) as ProjectLabel[]).map((project) => [project.id, project]),
  );

  return contracts.map((contract) => ({
    ...contract,
    project: projectsById.get(contract.project_id) ?? null,
  }));
}
