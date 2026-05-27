import { createClient } from "@/src/integrations/supabase/server";
import type { DailyWorkEntry } from "../types";

export async function getDailyWorkEntryById(
  companyId: string,
  entryId: string,
): Promise<DailyWorkEntry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_work_entries")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", entryId)
    .maybeSingle();

  if (error) {
    console.error("[daily-work:getDailyWorkEntryById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to load daily work entry.");
  }

  return data;
}
