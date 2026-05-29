import { createClient } from "@/src/integrations/supabase/server";
import type { RevenueType } from "../constants";

export async function checkDuplicateRevenueInvoice({
  companyId,
  invoiceNumber,
  revenueType,
  excludeRevenueId,
}: {
  companyId: string;
  invoiceNumber: string | null;
  revenueType: RevenueType;
  excludeRevenueId?: string;
}) {
  if (!invoiceNumber || !["invoice", "credit"].includes(revenueType)) return;

  const supabase = await createClient();
  let query = supabase
    .from("revenues")
    .select("id")
    .eq("company_id", companyId)
    .eq("invoice_number", invoiceNumber)
    .in("revenue_type", ["invoice", "credit"])
    .limit(1);

  if (excludeRevenueId) {
    query = query.neq("id", excludeRevenueId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[revenues:checkDuplicateRevenueInvoice] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Δεν ήταν δυνατός ο έλεγχος διπλότυπου τιμολογίου.");
  }

  if ((data ?? []).length > 0) {
    throw new Error("Υπάρχει ήδη έσοδο με αυτόν τον αριθμό τιμολογίου.");
  }
}
