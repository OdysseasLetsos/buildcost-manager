import { createClient } from "@/src/integrations/supabase/server";
import type { PaymentAllocationPreview } from "../types";

type DailyWorkAllocationRow = {
  employee_id: string;
  project_id: string;
  hours: number;
  overtime_hours: number;
};

export async function getPaymentAllocationPreview(
  companyId: string,
  monthId: string,
): Promise<PaymentAllocationPreview> {
  const supabase = await createClient();
  const [paymentsResult, workResult, employeesResult, projectsResult] =
    await Promise.all([
      supabase
        .from("employee_payments")
        .select("employee_id, amount")
        .eq("company_id", companyId)
        .eq("month_id", monthId),
      supabase
        .from("daily_work_entries")
        .select("employee_id, project_id, hours, overtime_hours")
        .eq("company_id", companyId)
        .eq("month_id", monthId),
      supabase.from("employees").select("id, full_name").eq("company_id", companyId),
      supabase.from("projects").select("id, code, name").eq("company_id", companyId),
    ]);

  if (
    paymentsResult.error ||
    workResult.error ||
    employeesResult.error ||
    projectsResult.error
  ) {
    console.error("[payments:getPaymentAllocationPreview] Supabase error", {
      paymentsError: paymentsResult.error?.message,
      workError: workResult.error?.message,
      employeesError: employeesResult.error?.message,
      projectsError: projectsResult.error?.message,
    });
    throw new Error("Unable to load payment allocation preview.");
  }

  const paymentsByEmployee = new Map<string, number>();
  for (const payment of paymentsResult.data ?? []) {
    paymentsByEmployee.set(
      payment.employee_id,
      (paymentsByEmployee.get(payment.employee_id) ?? 0) + Number(payment.amount),
    );
  }

  const employeeMap = new Map(
    (employeesResult.data ?? []).map((employee) => [employee.id, employee.full_name]),
  );
  const projectMap = new Map(
    (projectsResult.data ?? []).map((project) => [project.id, project]),
  );
  const employeeWorkUnits = new Map<string, number>();
  const employeeProjectWorkUnits = new Map<string, Map<string, number>>();

  for (const entry of (workResult.data ?? []) as DailyWorkAllocationRow[]) {
    const workUnits = Number(entry.hours) + Number(entry.overtime_hours);
    employeeWorkUnits.set(
      entry.employee_id,
      (employeeWorkUnits.get(entry.employee_id) ?? 0) + workUnits,
    );

    const projectUnits =
      employeeProjectWorkUnits.get(entry.employee_id) ?? new Map<string, number>();
    projectUnits.set(entry.project_id, (projectUnits.get(entry.project_id) ?? 0) + workUnits);
    employeeProjectWorkUnits.set(entry.employee_id, projectUnits);
  }

  const projectTotals = new Map<
    string,
    { allocatedAmount: number; workUnits: number }
  >();
  const warnings = [];
  const totalPayments = Array.from(paymentsByEmployee.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  for (const [employeeId, amount] of paymentsByEmployee) {
    const totalWorkUnits = employeeWorkUnits.get(employeeId) ?? 0;

    if (totalWorkUnits <= 0) {
      warnings.push({
        employeeId,
        employeeName: employeeMap.get(employeeId) ?? "-",
        amount,
        message: "Δεν μπορεί να γίνει κατανομή γιατί δεν υπάρχουν ώρες εργασίας.",
      });
      continue;
    }

    for (const [projectId, workUnits] of employeeProjectWorkUnits.get(employeeId) ?? []) {
      const allocatedAmount = (amount * workUnits) / totalWorkUnits;
      const existing = projectTotals.get(projectId) ?? {
        allocatedAmount: 0,
        workUnits: 0,
      };
      existing.allocatedAmount += allocatedAmount;
      existing.workUnits += workUnits;
      projectTotals.set(projectId, existing);
    }
  }

  return {
    projectTotals: Array.from(projectTotals.entries()).map(([projectId, total]) => {
      const project = projectMap.get(projectId);
      return {
        projectId,
        projectCode: project?.code ?? "-",
        projectName: project?.name ?? "-",
        allocatedAmount: total.allocatedAmount,
        workUnits: total.workUnits,
        percentage: totalPayments > 0 ? (total.allocatedAmount / totalPayments) * 100 : 0,
      };
    }),
    warnings,
  };
}
