import { createClient } from "@/src/integrations/supabase/server";
import type { Supplier } from "../types";

export async function getSuppliers(companyId: string): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[materials:getSuppliers] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load suppliers.");
  }

  return (data ?? []) as Supplier[];
}

export async function getSupplierById(
  companyId: string,
  supplierId: string,
): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", supplierId)
    .maybeSingle();

  if (error) {
    console.error("[materials:getSupplierById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load supplier.");
  }

  return data as Supplier | null;
}
