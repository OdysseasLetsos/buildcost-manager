import type { ProjectSummaryReport } from "@/src/features/project-summary/types";
import type { ReportType } from "./constants";

export type ReportActionState = {
  ok: boolean;
  message?: string;
  fileName?: string;
  mimeType?: string;
  base64?: string;
};

export const initialReportActionState: ReportActionState = {
  ok: false,
};

export type ReportFilters = {
  monthId: string;
  projectId?: string;
  employeeId?: string;
  reportType: ReportType;
};

export type EmployeeWorkReportRow = {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  totalOvertimeHours: number;
  employeeExpenses: number;
  payments: number;
  ika: number;
  projectLabels: string[];
};

export type MaterialsReportRow = {
  id: string;
  invoiceDate: string;
  projectId: string;
  projectLabel: string;
  supplierName: string;
  supplierVat: string;
  invoiceNumber: string;
  description: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: string;
};

export type ExpensesReportRow = {
  id: string;
  expenseDate: string;
  scope: string;
  category: string;
  description: string;
  amount: number;
  allocationMethod: string;
};

export type RevenuesReportRow = {
  id: string;
  revenueDate: string;
  projectId: string;
  projectLabel: string;
  clientName: string;
  invoiceNumber: string;
  revenueType: string;
  invoicedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  status: string;
};

export type ReportsByMonth = Record<
  string,
  {
    monthlyProjectSummary: ProjectSummaryReport;
    employeeWork: EmployeeWorkReportRow[];
    materials: MaterialsReportRow[];
    expenses: ExpensesReportRow[];
    revenues: RevenuesReportRow[];
  }
>;

export type ExportColumn<T> = {
  label: string;
  value: (row: T) => string | number | null | undefined;
};
