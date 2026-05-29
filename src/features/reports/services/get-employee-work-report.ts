import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeeWorkReportRow } from "../types";
import { requireReportsAccess } from "./require-reports-access";

type WorkRow = {
  employee_id: string;
  project_id: string;
  hours: number;
  overtime_hours: number;
  expense_amount: number;
};

type EmployeeRow = {
  id: string;
  full_name: string;
};

type ProjectRow = {
  id: string;
  code: string;
  name: string;
};

type PaymentRow = {
  employee_id: string;
  amount: number;
};

type IkaRow = {
  employee_id: string;
  ika_amount: number;
};

function addAmount(map: Map<string, number>, id: string, amount: number): void {
  map.set(id, (map.get(id) ?? 0) + Number(amount ?? 0));
}

export async function getEmployeeWorkReport({
  companyId,
  monthId,
  employeeId,
}: {
  companyId: string;
  monthId: string;
  employeeId?: string;
}): Promise<EmployeeWorkReportRow[]> {
  await requireReportsAccess(companyId);
  if (!monthId) return [];

  const supabase = await createClient();
  let workQuery = supabase
    .from("daily_work_entries")
    .select("employee_id, project_id, hours, overtime_hours, expense_amount")
    .eq("company_id", companyId)
    .eq("month_id", monthId);

  let paymentsQuery = supabase
    .from("employee_payments")
    .select("employee_id, amount")
    .eq("company_id", companyId)
    .eq("month_id", monthId);

  let ikaQuery = supabase
    .from("employee_ika")
    .select("employee_id, ika_amount")
    .eq("company_id", companyId)
    .eq("month_id", monthId);

  if (employeeId) {
    workQuery = workQuery.eq("employee_id", employeeId);
    paymentsQuery = paymentsQuery.eq("employee_id", employeeId);
    ikaQuery = ikaQuery.eq("employee_id", employeeId);
  }

  const [employeesResult, projectsResult, workResult, paymentsResult, ikaResult] =
    await Promise.all([
      supabase.from("employees").select("id, full_name").eq("company_id", companyId),
      supabase.from("projects").select("id, code, name").eq("company_id", companyId),
      workQuery,
      paymentsQuery,
      ikaQuery,
    ]);

  const firstError =
    employeesResult.error ??
    projectsResult.error ??
    workResult.error ??
    paymentsResult.error ??
    ikaResult.error;

  if (firstError) {
    console.error("[reports:getEmployeeWorkReport] Supabase error", {
      message: firstError.message,
      code: firstError.code,
      details: firstError.details,
      hint: firstError.hint,
    });
    throw new Error("Unable to load employee work report.");
  }

  const employees = (employeesResult.data ?? []) as EmployeeRow[];
  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const workRows = (workResult.data ?? []) as WorkRow[];
  const paymentRows = (paymentsResult.data ?? []) as PaymentRow[];
  const ikaRows = (ikaResult.data ?? []) as IkaRow[];
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee.full_name]));
  const projectMap = new Map(
    projects.map((project) => [project.id, `${project.code} - ${project.name}`]),
  );
  const paymentsByEmployee = new Map<string, number>();
  const ikaByEmployee = new Map<string, number>();

  for (const payment of paymentRows) {
    addAmount(paymentsByEmployee, payment.employee_id, payment.amount);
  }

  for (const ika of ikaRows) {
    addAmount(ikaByEmployee, ika.employee_id, ika.ika_amount);
  }

  const rowsByEmployee = new Map<EmployeeWorkReportRow["employeeId"], EmployeeWorkReportRow>();

  for (const row of workRows) {
    const existing = rowsByEmployee.get(row.employee_id) ?? {
      employeeId: row.employee_id,
      employeeName: employeeMap.get(row.employee_id) ?? "-",
      totalHours: 0,
      totalOvertimeHours: 0,
      employeeExpenses: 0,
      payments: 0,
      ika: 0,
      projectLabels: [],
    };

    existing.totalHours += Number(row.hours ?? 0);
    existing.totalOvertimeHours += Number(row.overtime_hours ?? 0);
    existing.employeeExpenses += Number(row.expense_amount ?? 0);
    const projectLabel = projectMap.get(row.project_id);
    if (projectLabel && !existing.projectLabels.includes(projectLabel)) {
      existing.projectLabels.push(projectLabel);
    }
    rowsByEmployee.set(row.employee_id, existing);
  }

  for (const employee of employees) {
    if (employeeId && employee.id !== employeeId) continue;
    const paymentAmount = paymentsByEmployee.get(employee.id) ?? 0;
    const ikaAmount = ikaByEmployee.get(employee.id) ?? 0;
    if (!rowsByEmployee.has(employee.id) && (paymentAmount > 0 || ikaAmount > 0)) {
      rowsByEmployee.set(employee.id, {
        employeeId: employee.id,
        employeeName: employee.full_name,
        totalHours: 0,
        totalOvertimeHours: 0,
        employeeExpenses: 0,
        payments: 0,
        ika: 0,
        projectLabels: [],
      });
    }
  }

  for (const row of rowsByEmployee.values()) {
    row.payments = paymentsByEmployee.get(row.employeeId) ?? 0;
    row.ika = ikaByEmployee.get(row.employeeId) ?? 0;
    row.projectLabels.sort((a, b) => a.localeCompare(b, "el"));
  }

  return Array.from(rowsByEmployee.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, "el"),
  );
}
