import { createClient } from "@/src/integrations/supabase/server";
import type { Material } from "../types";

export async function getMaterialById(
  companyId: string,
  materialId: string,
): Promise<Material | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", materialId)
    .maybeSingle();

  if (error) {
    console.error("[materials:getMaterialById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load material.");
  }

  return (data ?? null) as Material | null;
}
