import { createClient } from "@/src/integrations/supabase/server";
import type { Project, ProjectFilters, ProjectStatus } from "../types";

export async function getProjects(
  companyId: string,
  filters: ProjectFilters = {},
): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const search = filters.search?.trim();

  if (search) {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      `code.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%,client_name.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%`,
    );
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as ProjectStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[projects:getProjects] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load projects.");
  }

  return (data ?? []) as Project[];
}
