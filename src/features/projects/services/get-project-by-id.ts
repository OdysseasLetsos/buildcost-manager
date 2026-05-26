import { createClient } from "@/src/integrations/supabase/server";
import type { Project } from "../types";

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
