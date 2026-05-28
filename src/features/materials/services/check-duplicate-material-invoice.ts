import { createClient } from "@/src/integrations/supabase/server";

export async function checkDuplicateMaterialInvoice(input: {
  companyId: string;
  supplierName: string;
  supplierVat: string | null;
  invoiceNumber: string;
  excludeMaterialId?: string;
}): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select("id")
    .eq("company_id", input.companyId)
    .eq("invoice_number", input.invoiceNumber)
    .limit(1);

  if (input.supplierVat) {
    query = query.eq("supplier_vat", input.supplierVat);
  } else {
    query = query.eq("supplier_name", input.supplierName);
  }

  if (input.excludeMaterialId) {
    query = query.neq("id", input.excludeMaterialId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[materials:checkDuplicateMaterialInvoice] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Δεν ήταν δυνατός ο έλεγχος διπλότυπου τιμολογίου.");
  }

  if ((data ?? []).length > 0) {
    throw new Error("Υπάρχει ήδη τιμολόγιο με τον ίδιο προμηθευτή και αριθμό.");
  }
}
