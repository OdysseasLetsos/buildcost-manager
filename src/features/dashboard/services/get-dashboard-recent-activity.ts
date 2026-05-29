import { createClient } from "@/src/integrations/supabase/server";
import type { DashboardRecentActivity } from "../types";

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

export async function getDashboardRecentActivity(
  companyId: string,
  monthId: string | null,
  includeFinancial: boolean,
): Promise<DashboardRecentActivity[]> {
  if (!monthId) return [];

  const supabase = await createClient();
  const [workResult, projectsResult] = await Promise.all([
    supabase
      .from("daily_work_entries")
      .select("id, work_date, project_id, hours, overtime_hours, expense_amount, work_description, created_at")
      .eq("company_id", companyId)
      .eq("month_id", monthId)
      .order("work_date", { ascending: false })
      .limit(8),
    supabase.from("projects").select("id, code, name").eq("company_id", companyId),
  ]);

  if (workResult.error || projectsResult.error) {
    console.error("[dashboard:getDashboardRecentActivity] Supabase error", {
      workError: workResult.error?.message,
      projectsError: projectsResult.error?.message,
    });
    throw new Error("Unable to load dashboard recent activity.");
  }

  const projectMap = new Map(
    (projectsResult.data ?? []).map((project) => [
      project.id,
      `${project.code} - ${project.name}`,
    ]),
  );
  const activities: DashboardRecentActivity[] = (workResult.data ?? []).map((entry) => ({
    id: `work-${entry.id}`,
    date: entry.work_date,
    type: "daily_work",
    typeLabel: "Εργασία",
    category: "Ημερήσια Εργασία",
    description: entry.work_description || `${toNumber(entry.hours) + toNumber(entry.overtime_hours)} ώρες`,
    projectLabel: projectMap.get(entry.project_id),
    amount: toNumber(entry.expense_amount),
  }));

  if (!includeFinancial) {
    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }

  const [revenuesResult, materialsResult, expensesResult, paymentsResult, ikaResult] =
    await Promise.all([
      supabase
        .from("revenues")
        .select("id, revenue_date, project_id, client_name, invoice_number, received_amount, invoiced_amount")
        .eq("company_id", companyId)
        .eq("month_id", monthId)
        .order("revenue_date", { ascending: false })
        .limit(6),
      supabase
        .from("materials")
        .select("id, invoice_date, project_id, supplier_name, invoice_number, total_amount")
        .eq("company_id", companyId)
        .eq("month_id", monthId)
        .order("invoice_date", { ascending: false })
        .limit(6),
      supabase
        .from("expenses")
        .select("id, expense_date, category, description, amount")
        .eq("company_id", companyId)
        .eq("month_id", monthId)
        .order("expense_date", { ascending: false })
        .limit(6),
      supabase
        .from("employee_payments")
        .select("id, payment_date, amount, payment_method")
        .eq("company_id", companyId)
        .eq("month_id", monthId)
        .order("payment_date", { ascending: false })
        .limit(6),
      supabase
        .from("employee_ika")
        .select("id, ika_amount, created_at")
        .eq("company_id", companyId)
        .eq("month_id", monthId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const firstError =
    revenuesResult.error ??
    materialsResult.error ??
    expensesResult.error ??
    paymentsResult.error ??
    ikaResult.error;

  if (firstError) {
    console.error("[dashboard:getDashboardRecentActivity:financial] Supabase error", {
      message: firstError.message,
      code: firstError.code,
      details: firstError.details,
      hint: firstError.hint,
    });
    throw new Error("Unable to load financial recent activity.");
  }

  activities.push(
    ...(revenuesResult.data ?? []).map((row) => ({
      id: `revenue-${row.id}`,
      date: row.revenue_date,
      type: "revenue" as const,
      typeLabel: "Έσοδο",
      category: "Έσοδα",
      description: row.invoice_number
        ? `${row.client_name} - ${row.invoice_number}`
        : row.client_name,
      projectLabel: projectMap.get(row.project_id),
      amount: toNumber(row.received_amount || row.invoiced_amount),
    })),
    ...(materialsResult.data ?? []).map((row) => ({
      id: `material-${row.id}`,
      date: row.invoice_date,
      type: "material" as const,
      typeLabel: "Υλικό",
      category: "Υλικά",
      description: `${row.supplier_name} - ${row.invoice_number}`,
      projectLabel: projectMap.get(row.project_id),
      amount: toNumber(row.total_amount),
    })),
    ...(expensesResult.data ?? []).map((row) => ({
      id: `expense-${row.id}`,
      date: row.expense_date,
      type: "expense" as const,
      typeLabel: "Έξοδο",
      category: "Έξοδα",
      description: row.description || row.category,
      amount: toNumber(row.amount),
    })),
    ...(paymentsResult.data ?? []).map((row) => ({
      id: `payment-${row.id}`,
      date: row.payment_date,
      type: "payment" as const,
      typeLabel: "Πληρωμή",
      category: "Πληρωμές",
      description: row.payment_method,
      amount: toNumber(row.amount),
    })),
    ...(ikaResult.data ?? []).map((row) => ({
      id: `ika-${row.id}`,
      date: row.created_at,
      type: "ika" as const,
      typeLabel: "ΙΚΑ",
      category: "ΙΚΑ",
      description: "Καταχώρηση ΙΚΑ",
      amount: toNumber(row.ika_amount),
    })),
  );

  return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
}
