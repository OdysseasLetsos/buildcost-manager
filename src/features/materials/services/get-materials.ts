import { createClient } from "@/src/integrations/supabase/server";
import type { Material, MaterialFilters, MaterialWithRelations } from "../types";

export async function getMaterials(
  companyId: string,
  filters: MaterialFilters = {},
): Promise<MaterialWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select("*")
    .eq("company_id", companyId)
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.monthId) query = query.eq("month_id", filters.monthId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.paymentStatus) query = query.eq("payment_status", filters.paymentStatus);
  if (filters.supplierName?.trim()) {
    query = query.ilike("supplier_name", `%${filters.supplierName.trim()}%`);
  }
  if (filters.search?.trim()) {
    const search = filters.search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      `supplier_name.ilike.%${search}%,invoice_number.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[materials:getMaterials] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load materials.");
  }

  const materials = (data ?? []) as Material[];
  const projectIds = [...new Set(materials.map((material) => material.project_id))];
  const monthIds = [...new Set(materials.map((material) => material.month_id))];
  const [projectsResult, monthsResult] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("id, code, name").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    monthIds.length
      ? supabase.from("monthly_periods").select("id, month_key").in("id", monthIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (projectsResult.error || monthsResult.error) {
    console.error("[materials:getMaterials:relations] Supabase error", {
      projectError: projectsResult.error?.message,
      monthError: monthsResult.error?.message,
    });
    throw new Error("Unable to load material relations.");
  }

  const projectMap = new Map(
    (projectsResult.data ?? []).map((project) => [project.id, project]),
  );
  const monthMap = new Map(
    (monthsResult.data ?? []).map((month) => [month.id, month.month_key]),
  );

  return materials.map((material) => {
    const project = projectMap.get(material.project_id);
    return {
      ...material,
      projectCode: project?.code ?? "-",
      projectName: project?.name ?? "-",
      monthKey: monthMap.get(material.month_id) ?? "-",
    };
  });
}
