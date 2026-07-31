export type ProjectSummaryStatus = "healthy" | "low_margin" | "loss" | "no_revenue";

export type ProjectSummaryWarning = {
  type: "payments" | "ika" | "expenses";
  message: string;
  entityName?: string;
  amount?: number;
};

export type WorkUnitRow = {
  employee_id: string;
  project_id: string;
  hours: number;
  overtime_hours: number;
  expense_amount: number;
};

export type EmployeeAmountRow = {
  employee_id: string;
  amount: number;
};

export type IkaAmountRow = {
  employee_id: string;
  ika_amount: number;
};

export type MaterialCostRow = {
  project_id: string;
  total_amount: number;
};

export type SubcontractorContractCostRow = {
  project_id: string;
  contract_amount: number;
};

export type ExpenseAllocationRow = {
  id: string;
  amount: number;
  allocation_method: string;
  description: string | null;
};

export type RevenueSummaryRow = {
  project_id: string;
  revenue_type: string;
  invoiced_amount: number;
  received_amount: number;
  remaining_amount: number;
  status: string;
};

export type ProjectSummaryCostBreakdown = {
  employeeExpenses: number;
  allocatedPayments: number;
  allocatedIka: number;
  materialsCost: number;
  subcontractorContracts: number;
  allocatedExpenses: number;
};

export type ProjectSummaryQuoteTotals = {
  initialBudget: number;
  approvedQuotesTotal: number;
  pendingQuotesTotal: number;
  draftQuotesTotal: number;
  rejectedQuotesTotal: number;
};

export type ProjectSummaryRow = {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectSummaryStatus;
  hours: number;
  overtimeHours: number;
  workUnits: number;
  invoicedRevenue: number;
  receivedRevenue: number;
  remainingRevenue: number;
  totalCost: number;
  profit: number;
  margin: number | null;
  costs: ProjectSummaryCostBreakdown;
  quoteTotals: ProjectSummaryQuoteTotals;
};

export type ProjectSummaryTotals = {
  invoicedRevenue: number;
  receivedRevenue: number;
  remainingRevenue: number;
  totalCost: number;
  profit: number;
  margin: number | null;
  costs: ProjectSummaryCostBreakdown;
};

export type SupplierOutstandingInvoice = {
  invoiceId: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  pendingPercentage: number;
  paymentStatus: string;
};

export type SupplierOutstandingBalance = {
  supplierId: string | null;
  supplierName: string;
  supplierTaxId: string | null;
  totalOutstandingAmount: number;
  pendingInvoiceCount: number;
  invoices: SupplierOutstandingInvoice[];
};

export type SupplierOutstandingBalancesReport = {
  totalOutstandingAmount: number;
  suppliers: SupplierOutstandingBalance[];
};

export type ClientOutstandingRevenue = {
  revenueId: string;
  projectId: string;
  projectName: string;
  revenueDate: string;
  invoiceNumber: string | null;
  paymentMethod: string;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  pendingPercentage: number;
  status: string;
};

export type ClientOutstandingBalance = {
  clientName: string;
  totalOutstandingAmount: number;
  pendingRevenueCount: number;
  revenues: ClientOutstandingRevenue[];
};

export type ClientOutstandingBalancesReport = {
  totalOutstandingAmount: number;
  clients: ClientOutstandingBalance[];
};

export type ProjectSummaryReport = {
  monthId: string;
  projects: ProjectSummaryRow[];
  totals: ProjectSummaryTotals;
  warnings: ProjectSummaryWarning[];
  supplierOutstandingBalances: SupplierOutstandingBalancesReport;
  clientOutstandingBalances: ClientOutstandingBalancesReport;
};
