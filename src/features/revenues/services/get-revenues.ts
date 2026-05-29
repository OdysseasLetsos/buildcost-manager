import { createClient } from "@/src/integrations/supabase/server";
import type { Revenue, RevenueFilters, RevenueWithRelations } from "../types";

export async function getRevenues(
  companyId: string,
  filters: RevenueFilters = {},
): Promise<RevenueWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("revenues")
    .select("*")
    .eq("company_id", companyId)
    .order("revenue_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.monthId) query = query.eq("month_id", filters.monthId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.revenueType) query = query.eq("revenue_type", filters.revenueType);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.clientName?.trim()) {
    query = query.ilike("client_name", `%${filters.clientName.trim()}%`);
  }

  const search = filters.search?.trim();
  if (search) {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      `client_name.ilike.%${escapedSearch}%,invoice_number.ilike.%${escapedSearch}%,notes.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[revenues:getRevenues] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load revenues.");
  }

  const revenues = (data ?? []) as Revenue[];
  const projectIds = [...new Set(revenues.map((revenue) => revenue.project_id))];
  const monthIds = [...new Set(revenues.map((revenue) => revenue.month_id))];

  const [projectsResult, monthsResult] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("id, code, name").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    monthIds.length
      ? supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (projectsResult.error || monthsResult.error) {
    console.error("[revenues:getRevenues:relations] Supabase error", {
      projectError: projectsResult.error?.message,
      monthError: monthsResult.error?.message,
    });
    throw new Error("Unable to load revenue relations.");
  }

  const projectMap = new Map(
    (projectsResult.data ?? []).map((project) => [project.id, project]),
  );
  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );

  return revenues.map((revenue) => {
    const project = projectMap.get(revenue.project_id);
    return {
      ...revenue,
      projectCode: project?.code ?? "-",
      projectName: project?.name ?? "-",
      monthKey: monthMap.get(revenue.month_id) ?? "-",
    };
  });
}
