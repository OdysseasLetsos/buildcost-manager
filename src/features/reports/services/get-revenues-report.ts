import {
  revenueStatusLabels,
  revenueTypeLabels,
} from "@/src/features/revenues/constants";
import { getRevenues } from "@/src/features/revenues/services/get-revenues";
import type { RevenuesReportRow } from "../types";
import { requireReportsAccess } from "./require-reports-access";

export async function getRevenuesReport({
  companyId,
  monthId,
  projectId,
}: {
  companyId: string;
  monthId: string;
  projectId?: string;
}): Promise<RevenuesReportRow[]> {
  await requireReportsAccess(companyId);
  const revenues = await getRevenues(companyId, { monthId, projectId });

  return revenues.map((revenue) => ({
    id: revenue.id,
    revenueDate: revenue.revenue_date,
    projectId: revenue.project_id,
    projectLabel: `${revenue.projectCode} - ${revenue.projectName}`,
    clientName: revenue.client_name,
    invoiceNumber: revenue.invoice_number ?? "",
    revenueType: revenueTypeLabels[revenue.revenue_type] ?? revenue.revenue_type,
    invoicedAmount: Number(revenue.invoiced_amount ?? 0),
    receivedAmount: Number(revenue.received_amount ?? 0),
    remainingAmount: Number(revenue.remaining_amount ?? 0),
    status: revenueStatusLabels[revenue.status] ?? revenue.status,
  }));
}
