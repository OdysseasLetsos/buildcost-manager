import { createClient } from "@/src/integrations/supabase/server";
import type { Expense, ExpenseFilters, ExpenseWithRelations } from "../types";

export async function getExpenses(
  companyId: string,
  filters: ExpenseFilters = {},
): Promise<ExpenseWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("company_id", companyId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.monthId) query = query.eq("month_id", filters.monthId);
  if (filters.scope) query = query.eq("scope", filters.scope);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.allocationMethod) {
    query = query.eq("allocation_method", filters.allocationMethod);
  }

  const search = filters.search?.trim();
  if (search) {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      `category.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%,notes.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[expenses:getExpenses] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load expenses.");
  }

  const expenses = (data ?? []) as Expense[];
  const monthIds = [...new Set(expenses.map((expense) => expense.month_id))];
  const monthsResult = monthIds.length
    ? await supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
    : { data: [], error: null };

  if (monthsResult.error) {
    console.error("[expenses:getExpenses:relations] Supabase error", {
      monthError: monthsResult.error.message,
    });
    throw new Error("Unable to load expense relations.");
  }

  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );

  return expenses.map((expense) => ({
    ...expense,
    monthKey: monthMap.get(expense.month_id) ?? "-",
  }));
}
