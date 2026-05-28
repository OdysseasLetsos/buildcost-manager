import { createClient } from "@/src/integrations/supabase/server";
import type { EmployeePayment } from "../types";

export async function getEmployeePaymentById(
  companyId: string,
  paymentId: string,
): Promise<EmployeePayment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_payments")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    console.error("[payments:getEmployeePaymentById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load employee payment.");
  }

  return (data ?? null) as EmployeePayment | null;
}
