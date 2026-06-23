import { createClient } from "@/src/integrations/supabase/server";
import {
  toProjectStatus,
  type ManagedProject,
  type Project,
} from "../types";

export async function getProjectById(
  companyId: string,
  projectId: string,
): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.error("[projects:getProjectById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load project.");
  }

  return data as Project | null;
}

export async function getManagedProjectById(
  companyId: string,
  projectId: string,
): Promise<ManagedProject | null> {
  const project = await getProjectById(companyId, projectId);

  return project
    ? {
        ...project,
        status: toProjectStatus(project.status),
      }
    : null;
}
