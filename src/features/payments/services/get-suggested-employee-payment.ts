"use server";

import { requireUser } from "@/src/core/auth";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { SuggestedEmployeePayment } from "../types";

type EmployeeRateRow = {
  id: string;
  daily_rate: number | string | null;
  hourly_rate: number | string | null;
  overtime_rate: number | string | null;
};

type DailyWorkRateRow = {
  hours: number | string | null;
  overtime_hours: number | string | null;
  expense_amount: number | string | null;
};

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function rateFromEmployee(employee: EmployeeRateRow): {
  regularHourlyRate: number;
  overtimeHourlyRate: number;
  hasRates: boolean;
} {
  const dailyRate =
    employee.daily_rate === null || employee.daily_rate === undefined
      ? null
      : toNumber(employee.daily_rate);
  const hourlyRate =
    employee.hourly_rate === null || employee.hourly_rate === undefined
      ? null
      : toNumber(employee.hourly_rate);
  const overtimeRate =
    employee.overtime_rate === null || employee.overtime_rate === undefined
      ? null
      : toNumber(employee.overtime_rate);
  const dailyRateAsHourly = dailyRate !== null ? dailyRate / 8 : null;
  const regularHourlyRate = hourlyRate ?? dailyRateAsHourly ?? 0;
  const overtimeHourlyRate = overtimeRate ?? hourlyRate ?? dailyRateAsHourly ?? 0;

  return {
    regularHourlyRate,
    overtimeHourlyRate,
    hasRates:
      (dailyRate !== null && dailyRate > 0) ||
      (hourlyRate !== null && hourlyRate > 0) ||
      (overtimeRate !== null && overtimeRate > 0),
  };
}

export async function getSuggestedEmployeePayment(input: {
  monthId: string;
  employeeId: string;
}): Promise<SuggestedEmployeePayment | null> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany || !input.monthId || !input.employeeId) {
    return null;
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "payments");

  const supabase = await createClient();
  const [employeeResult, workResult] = await Promise.all([
    supabase
      .from("employees")
      .select("id, daily_rate, hourly_rate, overtime_rate")
      .eq("company_id", companyId)
      .eq("id", input.employeeId)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("daily_work_entries")
      .select("hours, overtime_hours, expense_amount")
      .eq("company_id", companyId)
      .eq("month_id", input.monthId)
      .eq("employee_id", input.employeeId),
  ]);

  if (employeeResult.error || workResult.error) {
    const error = employeeResult.error ?? workResult.error;
    console.error("[payments:getSuggestedEmployeePayment] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Unable to calculate suggested employee payment.");
  }

  const employee = employeeResult.data as EmployeeRateRow | null;

  if (!employee) {
    return null;
  }

  const workRows = (workResult.data ?? []) as DailyWorkRateRow[];
  const rates = rateFromEmployee(employee);
  const totals = workRows.reduce(
    (summary, row) => {
      summary.regularHours += toNumber(row.hours);
      summary.overtimeHours += toNumber(row.overtime_hours);
      summary.employeeExpenses += toNumber(row.expense_amount);
      return summary;
    },
    {
      regularHours: 0,
      overtimeHours: 0,
      employeeExpenses: 0,
    },
  );
  const regularAmount = totals.regularHours * rates.regularHourlyRate;
  const overtimeAmount = totals.overtimeHours * rates.overtimeHourlyRate;

  return {
    employee_id: employee.id,
    month_id: input.monthId,
    regular_hours: totals.regularHours,
    overtime_hours: totals.overtimeHours,
    regular_hourly_rate: rates.regularHourlyRate,
    overtime_hourly_rate: rates.overtimeHourlyRate,
    regular_amount: regularAmount,
    overtime_amount: overtimeAmount,
    employee_expenses: totals.employeeExpenses,
    suggested_payment_amount: regularAmount + overtimeAmount,
    has_work_entries: workRows.length > 0,
    has_rates: rates.hasRates,
  };
}
