import type { IkaAmountRow, ProjectSummaryWarning, WorkUnitRow } from "../types";

export function calculateIkaAllocations({
  ikaRows,
  workRows,
  employeeNames,
}: {
  ikaRows: IkaAmountRow[];
  workRows: WorkUnitRow[];
  employeeNames: Map<string, string>;
}) {
  const ikaByEmployee = new Map<string, number>();
  const workUnitsByEmployee = new Map<string, number>();
  const workUnitsByEmployeeProject = new Map<string, Map<string, number>>();
  const allocations = new Map<string, number>();
  const warnings: ProjectSummaryWarning[] = [];

  for (const row of ikaRows) {
    ikaByEmployee.set(
      row.employee_id,
      (ikaByEmployee.get(row.employee_id) ?? 0) + Number(row.ika_amount),
    );
  }

  for (const row of workRows) {
    const workUnits = Number(row.hours) + Number(row.overtime_hours);
    workUnitsByEmployee.set(
      row.employee_id,
      (workUnitsByEmployee.get(row.employee_id) ?? 0) + workUnits,
    );
    const projectUnits =
      workUnitsByEmployeeProject.get(row.employee_id) ?? new Map<string, number>();
    projectUnits.set(row.project_id, (projectUnits.get(row.project_id) ?? 0) + workUnits);
    workUnitsByEmployeeProject.set(row.employee_id, projectUnits);
  }

  for (const [employeeId, ikaAmount] of ikaByEmployee) {
    const totalWorkUnits = workUnitsByEmployee.get(employeeId) ?? 0;
    if (totalWorkUnits <= 0) {
      warnings.push({
        type: "ika",
        entityName: employeeNames.get(employeeId) ?? "-",
        amount: ikaAmount,
        message: "Ο εργαζόμενος έχει ΙΚΑ αλλά δεν έχει ώρες εργασίας.",
      });
      continue;
    }

    for (const [projectId, projectWorkUnits] of workUnitsByEmployeeProject.get(employeeId) ?? []) {
      const allocatedAmount = (ikaAmount * projectWorkUnits) / totalWorkUnits;
      allocations.set(projectId, (allocations.get(projectId) ?? 0) + allocatedAmount);
    }
  }

  return { allocations, warnings };
}
