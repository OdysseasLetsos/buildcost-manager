import { createClient } from "@/src/integrations/supabase/server";
import type { CompanyOffice } from "../types";

export async function getCompanyOffices(companyId: string): Promise<CompanyOffice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_offices")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[expenses:getCompanyOffices] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load company offices.");
  }

  return (data ?? []) as CompanyOffice[];
}

export async function getCompanyOfficeById(
  companyId: string,
  officeId: string,
): Promise<CompanyOffice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_offices")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", officeId)
    .maybeSingle();

  if (error) {
    console.error("[expenses:getCompanyOfficeById] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load company office.");
  }

  return data as CompanyOffice | null;
}
