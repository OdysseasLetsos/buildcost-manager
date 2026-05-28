import { createClient } from "@/src/integrations/supabase/server";
import type {
  EmployeePayment,
  EmployeePaymentFilters,
  EmployeePaymentWithRelations,
} from "../types";

export async function getEmployeePayments(
  companyId: string,
  filters: EmployeePaymentFilters = {},
): Promise<EmployeePaymentWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("employee_payments")
    .select("*")
    .eq("company_id", companyId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.monthId) query = query.eq("month_id", filters.monthId);
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[payments:getEmployeePayments] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load employee payments.");
  }

  const payments = (data ?? []) as EmployeePayment[];
  const employeeIds = [...new Set(payments.map((payment) => payment.employee_id))];
  const monthIds = [...new Set(payments.map((payment) => payment.month_id))];

  const [employeesResult, monthsResult] = await Promise.all([
    employeeIds.length
      ? supabase.from("employees").select("id, full_name").in("id", employeeIds)
      : Promise.resolve({ data: [], error: null }),
    monthIds.length
      ? supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (employeesResult.error || monthsResult.error) {
    console.error("[payments:getEmployeePayments:relations] Supabase error", {
      employeeError: employeesResult.error?.message,
      monthError: monthsResult.error?.message,
    });
    throw new Error("Unable to load payment relations.");
  }

  const employeeMap = new Map(
    (employeesResult.data ?? []).map((employee) => [employee.id, employee.full_name]),
  );
  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );

  return payments.map((payment) => ({
    ...payment,
    employeeName: employeeMap.get(payment.employee_id) ?? "-",
    monthKey: monthMap.get(payment.month_id) ?? "-",
  }));
}
