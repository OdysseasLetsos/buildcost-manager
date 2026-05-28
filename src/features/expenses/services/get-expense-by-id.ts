import { createClient } from "@/src/integrations/supabase/server";
import type { Expense } from "../types";

export async function getExpenseById(
  companyId: string,
  expenseId: string,
): Promise<Expense | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    console.error("[expenses:getExpenseById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load expense.");
  }

  return (data as Expense | null) ?? null;
}
