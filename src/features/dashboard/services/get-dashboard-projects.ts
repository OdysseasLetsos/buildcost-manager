import { createClient } from "@/src/integrations/supabase/server";
import type { DashboardProject, DashboardProjectStats } from "../types";

export async function getDashboardProjects(
  companyId: string,
): Promise<DashboardProjectStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, code, name, client_name, location, status, budget_amount")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard:getDashboardProjects] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load dashboard projects.");
  }

  const projects = (data ?? []) as DashboardProject[];
  const activeProjects = projects.filter((project) =>
    ["active", "in_progress"].includes(project.status),
  );
  const latestActiveProjects = activeProjects.slice(0, 6);

  return {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    completedProjects: projects.filter((project) => project.status === "completed")
      .length,
    archivedProjects: projects.filter((project) => project.status === "archived")
      .length,
    latestActiveProjects,
  };
}
