import type { MaterialsByProjectTotal, MaterialWithRelations } from "../types";

export function getMaterialsByProject(
  materials: MaterialWithRelations[],
): MaterialsByProjectTotal[] {
  const totalAmount = materials.reduce(
    (sum, material) => sum + Number(material.total_amount),
    0,
  );
  const grouped = new Map<string, MaterialsByProjectTotal>();

  for (const material of materials) {
    const existing = grouped.get(material.project_id) ?? {
      projectId: material.project_id,
      projectCode: material.projectCode,
      projectName: material.projectName,
      totalAmount: 0,
      percentage: 0,
    };
    existing.totalAmount += Number(material.total_amount);
    grouped.set(material.project_id, existing);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}
