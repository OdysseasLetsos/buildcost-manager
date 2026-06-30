import type { MaterialInput } from "../validators";
import { getSupplierById } from "./get-suppliers";

export async function resolveMaterialSupplier(
  companyId: string,
  input: MaterialInput,
): Promise<MaterialInput> {
  if (!input.supplierId) {
    return input;
  }

  const supplier = await getSupplierById(companyId, input.supplierId);

  if (!supplier || !supplier.active) {
    throw new Error("Ο προμηθευτής δεν βρέθηκε.");
  }

  return {
    ...input,
    supplierName: supplier.name,
    supplierVat: supplier.tax_id,
  };
}
