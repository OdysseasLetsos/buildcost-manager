"use server";

import { requireUser } from "@/src/core/auth";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getCurrentMonthKey } from "@/src/features/monthly-periods/services/month-rules";
import { createClient } from "@/src/integrations/supabase/server";
import type {
  PreviousPaymentBalanceBreakdown,
  SuggestedEmployeePayment,
  SuggestedEmployeePaymentWithCarryover,
} from "../types";

type EmployeeRateRow = {
  id: string;
  daily_rate: number | string | null;
  hourly_rate: number | string | null;
  overtime_rate: number | string | null;
};

type MonthlyPeriodSuggestionRow = {
  id: string;
  month_key: string;
};

type DailyWorkRateRow = {
  month_id: string;
  hours: number | string | null;
  overtime_hours: number | string | null;
  expense_amount: number | string | null;
};

type EmployeePaymentAmountRow = {
  month_id: string;
  amount: number | string | null;
};

type WorkTotals = {
  regularHours: number;
  overtimeHours: number;
  employeeExpenses: number;
  rowCount: number;
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

function emptyWorkTotals(): WorkTotals {
  return {
    regularHours: 0,
    overtimeHours: 0,
    employeeExpenses: 0,
    rowCount: 0,
  };
}

function calculateSuggestedAmount(
  totals: WorkTotals,
  rates: ReturnType<typeof rateFromEmployee>,
) {
  const regularAmount = totals.regularHours * rates.regularHourlyRate;
  const overtimeAmount = totals.overtimeHours * rates.overtimeHourlyRate;

  return {
    regularAmount,
    overtimeAmount,
    suggestedAmount: regularAmount + overtimeAmount,
  };
}

function groupWorkByMonth(workRows: DailyWorkRateRow[]) {
  return workRows.reduce((map, row) => {
    const totals = map.get(row.month_id) ?? emptyWorkTotals();
    totals.regularHours += toNumber(row.hours);
    totals.overtimeHours += toNumber(row.overtime_hours);
    totals.employeeExpenses += toNumber(row.expense_amount);
    totals.rowCount += 1;
    map.set(row.month_id, totals);
    return map;
  }, new Map<string, WorkTotals>());
}

function groupPaidByMonth(paymentRows: EmployeePaymentAmountRow[]) {
  return paymentRows.reduce((map, row) => {
    map.set(row.month_id, (map.get(row.month_id) ?? 0) + toNumber(row.amount));
    return map;
  }, new Map<string, number>());
}

async function requirePaymentSuggestionContext() {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return null;
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "payments");

  return companyId;
}

export async function getSuggestedEmployeePaymentWithCarryover(input: {
  monthId: string;
  employeeId: string;
}): Promise<SuggestedEmployeePaymentWithCarryover | null> {
  const companyId = await requirePaymentSuggestionContext();

  if (!companyId || !input.monthId || !input.employeeId) {
    return null;
  }

  const supabase = await createClient();
  const [employeeResult, selectedMonthResult] = await Promise.all([
    supabase
      .from("employees")
      .select("id, daily_rate, hourly_rate, overtime_rate")
      .eq("company_id", companyId)
      .eq("id", input.employeeId)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("monthly_periods")
      .select("id, month_key")
      .eq("company_id", companyId)
      .eq("id", input.monthId)
      .maybeSingle(),
  ]);

  if (employeeResult.error || selectedMonthResult.error) {
    const error = employeeResult.error ?? selectedMonthResult.error;
    console.error("[payments:getSuggestedEmployeePaymentWithCarryover] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατός ο υπολογισμός της προτεινόμενης πληρωμής.");
  }

  const employee = employeeResult.data as EmployeeRateRow | null;
  const selectedMonth = selectedMonthResult.data as MonthlyPeriodSuggestionRow | null;

  if (!employee || !selectedMonth) {
    return null;
  }

  const currentMonthKey = getCurrentMonthKey();
  const previousMonthsResult = await supabase
    .from("monthly_periods")
    .select("id, month_key")
    .eq("company_id", companyId)
    .lt("month_key", selectedMonth.month_key)
    .lte("month_key", currentMonthKey)
    .order("month_key", { ascending: true });

  if (previousMonthsResult.error) {
    console.error("[payments:getSuggestedEmployeePaymentWithCarryover:months] Supabase error", {
      message: previousMonthsResult.error.message,
      code: previousMonthsResult.error.code,
      details: previousMonthsResult.error.details,
      hint: previousMonthsResult.error.hint,
    });
    throw new Error("Δεν ήταν δυνατός ο υπολογισμός υπολοίπων προηγούμενων μηνών.");
  }

  const previousMonths = (previousMonthsResult.data ?? []) as MonthlyPeriodSuggestionRow[];
  const monthIds = [selectedMonth.id, ...previousMonths.map((month) => month.id)];
  const [workResult, paymentsResult] = await Promise.all([
    supabase
      .from("daily_work_entries")
      .select("month_id, hours, overtime_hours, expense_amount")
      .eq("company_id", companyId)
      .eq("employee_id", input.employeeId)
      .in("month_id", monthIds),
    previousMonths.length
      ? supabase
          .from("employee_payments")
          .select("month_id, amount")
          .eq("company_id", companyId)
          .eq("employee_id", input.employeeId)
          .in(
            "month_id",
            previousMonths.map((month) => month.id),
          )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (workResult.error || paymentsResult.error) {
    const error = workResult.error ?? paymentsResult.error;
    console.error("[payments:getSuggestedEmployeePaymentWithCarryover:amounts] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατός ο υπολογισμός της προτεινόμενης πληρωμής.");
  }

  const rates = rateFromEmployee(employee);
  const workByMonth = groupWorkByMonth((workResult.data ?? []) as DailyWorkRateRow[]);
  const paidByMonth = groupPaidByMonth(
    (paymentsResult.data ?? []) as EmployeePaymentAmountRow[],
  );
  const selectedTotals = workByMonth.get(selectedMonth.id) ?? emptyWorkTotals();
  const selectedAmounts = calculateSuggestedAmount(selectedTotals, rates);
  const previousMonthBreakdown: PreviousPaymentBalanceBreakdown[] = previousMonths
    .map((month) => {
      const totals = workByMonth.get(month.id) ?? emptyWorkTotals();
      const amounts = calculateSuggestedAmount(totals, rates);
      const paidAmount = paidByMonth.get(month.id) ?? 0;
      const remainingAmount = Math.max(amounts.suggestedAmount - paidAmount, 0);

      return {
        monthKey: month.month_key,
        suggestedAmount: amounts.suggestedAmount,
        paidAmount,
        remainingAmount,
      };
    })
    .filter((row) => row.remainingAmount > 0);
  const previousMonthsRemainingAmount = previousMonthBreakdown.reduce(
    (sum, row) => sum + row.remainingAmount,
    0,
  );
  const totalSuggestedPaymentAmount =
    selectedAmounts.suggestedAmount + previousMonthsRemainingAmount;

  return {
    employee_id: employee.id,
    month_id: input.monthId,
    regular_hours: selectedTotals.regularHours,
    overtime_hours: selectedTotals.overtimeHours,
    regular_hourly_rate: rates.regularHourlyRate,
    overtime_hourly_rate: rates.overtimeHourlyRate,
    regular_amount: selectedAmounts.regularAmount,
    overtime_amount: selectedAmounts.overtimeAmount,
    employee_expenses: selectedTotals.employeeExpenses,
    suggested_payment_amount: selectedAmounts.suggestedAmount,
    selected_month_suggested_amount: selectedAmounts.suggestedAmount,
    previous_months_remaining_amount: previousMonthsRemainingAmount,
    total_suggested_payment_amount: totalSuggestedPaymentAmount,
    previous_month_breakdown: previousMonthBreakdown,
    has_work_entries: selectedTotals.rowCount > 0,
    has_rates: rates.hasRates,
  };
}

export async function getSuggestedEmployeePayment(input: {
  monthId: string;
  employeeId: string;
}): Promise<SuggestedEmployeePayment | null> {
  const suggestion = await getSuggestedEmployeePaymentWithCarryover(input);

  if (!suggestion) {
    return null;
  }

  return {
    employee_id: suggestion.employee_id,
    month_id: suggestion.month_id,
    regular_hours: suggestion.regular_hours,
    overtime_hours: suggestion.overtime_hours,
    regular_hourly_rate: suggestion.regular_hourly_rate,
    overtime_hourly_rate: suggestion.overtime_hourly_rate,
    regular_amount: suggestion.regular_amount,
    overtime_amount: suggestion.overtime_amount,
    employee_expenses: suggestion.employee_expenses,
    suggested_payment_amount: suggestion.suggested_payment_amount,
    has_work_entries: suggestion.has_work_entries,
    has_rates: suggestion.has_rates,
  };
}
