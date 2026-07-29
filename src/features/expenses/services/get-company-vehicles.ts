import { createClient } from "@/src/integrations/supabase/server";
import type { CompanyVehicle } from "../types";

export async function getCompanyVehicles(
  companyId: string,
): Promise<CompanyVehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_vehicles")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[expenses:getCompanyVehicles] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load company vehicles.");
  }

  return (data ?? []) as CompanyVehicle[];
}

export async function getCompanyVehicleById(
  companyId: string,
  vehicleId: string,
): Promise<CompanyVehicle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_vehicles")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    console.error("[expenses:getCompanyVehicleById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load company vehicle.");
  }

  return data as CompanyVehicle | null;
}
