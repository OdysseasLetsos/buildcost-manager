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
  const officeIds = [
    ...new Set(
      expenses
        .map((expense) => expense.office_id)
        .filter((officeId): officeId is string => Boolean(officeId)),
    ),
  ];
  const vehicleIds = [
    ...new Set(
      expenses
        .map((expense) => expense.vehicle_id)
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
    ),
  ];
  const [monthsResult, officesResult, vehiclesResult] = await Promise.all([
    monthIds.length
      ? supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
      : Promise.resolve({ data: [], error: null }),
    officeIds.length
      ? supabase.from("company_offices").select("id, name").in("id", officeIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleIds.length
      ? supabase.from("company_vehicles").select("id, name").in("id", vehicleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (monthsResult.error || officesResult.error || vehiclesResult.error) {
    console.error("[expenses:getExpenses:relations] Supabase error", {
      monthError: monthsResult.error?.message,
      officeError: officesResult.error?.message,
      vehicleError: vehiclesResult.error?.message,
    });
    throw new Error("Unable to load expense relations.");
  }

  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );
  const officeMap = new Map(
    (officesResult.data ?? []).map((office) => [office.id, office.name]),
  );
  const vehicleMap = new Map(
    (vehiclesResult.data ?? []).map((vehicle) => [vehicle.id, vehicle.name]),
  );

  return expenses.map((expense) => ({
    ...expense,
    monthKey: monthMap.get(expense.month_id) ?? "-",
    officeName: expense.office_id ? officeMap.get(expense.office_id) ?? null : null,
    vehicleName: expense.vehicle_id
      ? vehicleMap.get(expense.vehicle_id) ?? null
      : null,
  }));
}
