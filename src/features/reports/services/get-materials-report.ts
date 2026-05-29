import { materialPaymentStatusLabels } from "../constants";
import type { MaterialsReportRow } from "../types";
import { getMaterials } from "@/src/features/materials/services/get-materials";
import { requireReportsAccess } from "./require-reports-access";

export async function getMaterialsReport({
  companyId,
  monthId,
  projectId,
}: {
  companyId: string;
  monthId: string;
  projectId?: string;
}): Promise<MaterialsReportRow[]> {
  await requireReportsAccess(companyId);
  const materials = await getMaterials(companyId, { monthId, projectId });

  return materials.map((material) => ({
    id: material.id,
    invoiceDate: material.invoice_date,
    projectId: material.project_id,
    projectLabel: `${material.projectCode} - ${material.projectName}`,
    supplierName: material.supplier_name,
    supplierVat: material.supplier_vat ?? "",
    invoiceNumber: material.invoice_number,
    description: material.description ?? "",
    netAmount: Number(material.net_amount ?? 0),
    vatAmount: Number(material.vat_amount ?? 0),
    totalAmount: Number(material.total_amount ?? 0),
    paymentStatus:
      materialPaymentStatusLabels[
        material.payment_status as keyof typeof materialPaymentStatusLabels
      ] ?? material.payment_status,
  }));
}
