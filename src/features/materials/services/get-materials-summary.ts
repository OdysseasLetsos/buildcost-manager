import type { MaterialsSummary, MaterialWithRelations } from "../types";

export function getMaterialsSummary(
  materials: MaterialWithRelations[],
): MaterialsSummary {
  const supplierTotals = new Map<string, number>();

  for (const material of materials) {
    supplierTotals.set(
      material.supplier_name,
      (supplierTotals.get(material.supplier_name) ?? 0) + Number(material.total_amount),
    );
  }

  const topSupplier =
    Array.from(supplierTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalAmount: materials.reduce(
      (sum, material) => sum + Number(material.total_amount),
      0,
    ),
    invoiceCount: materials.length,
    paidAmount: materials
      .filter((material) => material.payment_status === "paid")
      .reduce((sum, material) => sum + Number(material.total_amount), 0),
    pendingAmount: materials
      .filter((material) => material.payment_status === "pending")
      .reduce((sum, material) => sum + Number(material.total_amount), 0),
    topSupplier,
  };
}
