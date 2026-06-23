import { createClient } from "@/src/integrations/supabase/server";
import type { ProjectQuote } from "../types";

export async function getProjectQuotes(
  companyId: string,
  projectId?: string,
): Promise<ProjectQuote[]> {
  const supabase = await createClient();
  let query = supabase
    .from("project_quotes")
    .select("*")
    .eq("company_id", companyId)
    .order("quote_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[projects:getProjectQuotes] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load project quotes.");
  }

  return (data ?? []) as ProjectQuote[];
}
