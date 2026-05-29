import type { EmployeeAmountRow, ProjectSummaryWarning, WorkUnitRow } from "../types";

export function calculatePaymentAllocations({
  payments,
  workRows,
  employeeNames,
}: {
  payments: EmployeeAmountRow[];
  workRows: WorkUnitRow[];
  employeeNames: Map<string, string>;
}) {
  const paymentsByEmployee = new Map<string, number>();
  const workUnitsByEmployee = new Map<string, number>();
  const workUnitsByEmployeeProject = new Map<string, Map<string, number>>();
  const allocations = new Map<string, number>();
  const warnings: ProjectSummaryWarning[] = [];

  for (const payment of payments) {
    paymentsByEmployee.set(
      payment.employee_id,
      (paymentsByEmployee.get(payment.employee_id) ?? 0) + Number(payment.amount),
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

  for (const [employeeId, paymentAmount] of paymentsByEmployee) {
    const totalWorkUnits = workUnitsByEmployee.get(employeeId) ?? 0;
    if (totalWorkUnits <= 0) {
      warnings.push({
        type: "payments",
        entityName: employeeNames.get(employeeId) ?? "-",
        amount: paymentAmount,
        message: "Ο εργαζόμενος έχει πληρωμές αλλά δεν έχει ώρες εργασίας.",
      });
      continue;
    }

    for (const [projectId, projectWorkUnits] of workUnitsByEmployeeProject.get(employeeId) ?? []) {
      const allocatedAmount = (paymentAmount * projectWorkUnits) / totalWorkUnits;
      allocations.set(projectId, (allocations.get(projectId) ?? 0) + allocatedAmount);
    }
  }

  return { allocations, warnings };
}
