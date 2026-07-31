import { createClient } from "@/src/integrations/supabase/server";
import type {
  ClientOutstandingBalance,
  ClientOutstandingBalancesReport,
  ClientOutstandingRevenue,
} from "../types";

type RevenueRow = {
  id: string;
  project_id: string;
  revenue_date: string;
  client_name: string;
  invoice_number: string | null;
  payment_method?: string | null;
  invoiced_amount: number;
  received_amount: number;
  remaining_amount: number;
  status: string;
};

type ProjectRow = {
  id: string;
  code: string;
  name: string;
};

export function emptyClientOutstandingBalances(): ClientOutstandingBalancesReport {
  return {
    totalOutstandingAmount: 0,
    clients: [],
  };
}

function pendingPercentage(totalAmount: number, remainingAmount: number): number {
  if (totalAmount <= 0) return 0;
  return (remainingAmount / totalAmount) * 100;
}

function groupClientOutstandingRevenues(
  revenues: ClientOutstandingRevenue[],
  clientNamesByRevenueId: Map<string, string>,
): ClientOutstandingBalancesReport {
  const clientsByName = new Map<string, ClientOutstandingBalance>();

  for (const revenue of revenues) {
    const clientName = clientNamesByRevenueId.get(revenue.revenueId) ?? "-";
    const existing = clientsByName.get(clientName) ?? {
      clientName,
      totalOutstandingAmount: 0,
      pendingRevenueCount: 0,
      revenues: [],
    };

    existing.totalOutstandingAmount += revenue.remainingAmount;
    existing.pendingRevenueCount += 1;
    existing.revenues.push(revenue);
    clientsByName.set(clientName, existing);
  }

  const clients = Array.from(clientsByName.values()).sort(
    (left, right) => right.totalOutstandingAmount - left.totalOutstandingAmount,
  );

  return {
    totalOutstandingAmount: clients.reduce(
      (sum, client) => sum + client.totalOutstandingAmount,
      0,
    ),
    clients,
  };
}

export async function getClientOutstandingBalancesForProjectSummary({
  companyId,
  monthId,
}: {
  companyId: string;
  monthId: string;
}): Promise<ClientOutstandingBalancesReport> {
  if (!monthId) return emptyClientOutstandingBalances();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revenues")
    .select(
      "id, project_id, revenue_date, client_name, invoice_number, payment_method, invoiced_amount, received_amount, remaining_amount, status",
    )
    .eq("company_id", companyId)
    .eq("month_id", monthId)
    .neq("status", "cancelled")
    .gt("remaining_amount", 0)
    .order("client_name", { ascending: true })
    .order("revenue_date", { ascending: false });

  if (error) {
    console.error("[project-summary:getClientOutstandingBalances] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load client outstanding balances.");
  }

  const revenueRows = (data ?? []) as RevenueRow[];
  const projectIds = [...new Set(revenueRows.map((revenue) => revenue.project_id))];
  const projectsResult = projectIds.length
    ? await supabase.from("projects").select("id, code, name").in("id", projectIds)
    : { data: [], error: null };

  if (projectsResult.error) {
    console.error("[project-summary:getClientOutstandingBalances:projects] Supabase error", {
      message: projectsResult.error.message,
      code: projectsResult.error.code,
      details: projectsResult.error.details,
      hint: projectsResult.error.hint,
    });
    throw new Error("Unable to load client outstanding project relations.");
  }

  const projectMap = new Map(
    ((projectsResult.data ?? []) as ProjectRow[]).map((project) => [project.id, project]),
  );
  const clientNamesByRevenueId = new Map<string, string>();

  const revenues = revenueRows.map<ClientOutstandingRevenue>((revenue) => {
    const project = projectMap.get(revenue.project_id);
    clientNamesByRevenueId.set(revenue.id, revenue.client_name || "-");
    return {
      revenueId: revenue.id,
      projectId: revenue.project_id,
      projectName: project ? `${project.code} - ${project.name}` : "-",
      revenueDate: revenue.revenue_date,
      invoiceNumber: revenue.invoice_number,
      paymentMethod: revenue.payment_method ?? "bank",
      totalAmount: Number(revenue.invoiced_amount),
      receivedAmount: Number(revenue.received_amount),
      remainingAmount: Number(revenue.remaining_amount),
      pendingPercentage: pendingPercentage(
        Number(revenue.invoiced_amount),
        Number(revenue.remaining_amount),
      ),
      status: revenue.status,
    };
  });

  return groupClientOutstandingRevenues(revenues, clientNamesByRevenueId);
}

export function mergeClientOutstandingBalances(
  reports: ClientOutstandingBalancesReport[],
): ClientOutstandingBalancesReport {
  const clientNamesByRevenueId = new Map<string, string>();
  const revenues = reports.flatMap((report) =>
    report.clients.flatMap((client) => {
      for (const revenue of client.revenues) {
        clientNamesByRevenueId.set(revenue.revenueId, client.clientName);
      }

      return client.revenues;
    }),
  );

  return groupClientOutstandingRevenues(revenues, clientNamesByRevenueId);
}
