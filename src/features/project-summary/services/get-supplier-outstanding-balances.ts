import { createClient } from "@/src/integrations/supabase/server";
import type {
  SupplierOutstandingBalance,
  SupplierOutstandingBalancesReport,
  SupplierOutstandingInvoice,
} from "../types";

type MaterialSupplierBalanceRow = {
  id: string;
  supplier_id: string | null;
  supplier_name: string;
  supplier_vat: string | null;
  project_id: string;
  invoice_date: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
};

type SupplierRow = {
  id: string;
  name: string;
  tax_id: string;
};

type ProjectRow = {
  id: string;
  code: string;
  name: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

export function emptySupplierOutstandingBalances(): SupplierOutstandingBalancesReport {
  return {
    totalOutstandingAmount: 0,
    suppliers: [],
  };
}

export function mergeSupplierOutstandingBalances(
  reports: SupplierOutstandingBalancesReport[],
): SupplierOutstandingBalancesReport {
  const suppliersByKey = new Map<string, SupplierOutstandingBalance>();

  for (const report of reports) {
    for (const supplier of report.suppliers) {
      const key = supplier.supplierId ?? `legacy:${supplier.supplierName}:${supplier.supplierTaxId ?? ""}`;
      const existing = suppliersByKey.get(key);

      if (!existing) {
        suppliersByKey.set(key, {
          ...supplier,
          invoices: [...supplier.invoices],
        });
        continue;
      }

      existing.invoices.push(...supplier.invoices);
      existing.totalOutstandingAmount = roundMoney(
        existing.totalOutstandingAmount + supplier.totalOutstandingAmount,
      );
      existing.pendingInvoiceCount = existing.invoices.length;
    }
  }

  const suppliers = Array.from(suppliersByKey.values()).map((supplier) => ({
    ...supplier,
    invoices: supplier.invoices.sort((left, right) =>
      left.invoiceDate.localeCompare(right.invoiceDate),
    ),
  }));

  return {
    totalOutstandingAmount: roundMoney(
      suppliers.reduce(
        (sum, supplier) => sum + supplier.totalOutstandingAmount,
        0,
      ),
    ),
    suppliers: suppliers.sort(
      (left, right) => right.totalOutstandingAmount - left.totalOutstandingAmount,
    ),
  };
}

export async function getSupplierOutstandingBalancesForProjectSummary({
  companyId,
  monthId,
}: {
  companyId: string;
  monthId: string;
}): Promise<SupplierOutstandingBalancesReport> {
  if (!monthId) return emptySupplierOutstandingBalances();

  const supabase = await createClient();
  const materialsResult = await supabase
    .from("materials")
    .select(
      "id, supplier_id, supplier_name, supplier_vat, project_id, invoice_date, invoice_number, total_amount, paid_amount, payment_status",
    )
    .eq("company_id", companyId)
    .eq("month_id", monthId);

  if (materialsResult.error) {
    console.error("[project-summary:supplier-balances:materials] Supabase error", {
      message: materialsResult.error.message,
      code: materialsResult.error.code,
      details: materialsResult.error.details,
      hint: materialsResult.error.hint,
    });
    throw new Error("Unable to load supplier balances.");
  }

  const materials = ((materialsResult.data ?? []) as MaterialSupplierBalanceRow[])
    .map((material) => {
      const totalAmount = Number(material.total_amount);
      const paidAmount = Number(material.paid_amount);
      return {
        ...material,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remainingAmount: roundMoney(Math.max(totalAmount - paidAmount, 0)),
      };
    })
    .filter((material) => material.remainingAmount > 0);

  if (materials.length === 0) {
    return emptySupplierOutstandingBalances();
  }

  const supplierIds = [
    ...new Set(
      materials
        .map((material) => material.supplier_id)
        .filter((supplierId): supplierId is string => Boolean(supplierId)),
    ),
  ];
  const projectIds = [...new Set(materials.map((material) => material.project_id))];

  const [suppliersResult, projectsResult] = await Promise.all([
    supplierIds.length
      ? supabase
          .from("suppliers")
          .select("id, name, tax_id")
          .eq("company_id", companyId)
          .in("id", supplierIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase
          .from("projects")
          .select("id, code, name")
          .eq("company_id", companyId)
          .in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = suppliersResult.error ?? projectsResult.error;

  if (firstError) {
    console.error("[project-summary:supplier-balances:relations] Supabase error", {
      message: firstError.message,
      code: firstError.code,
      details: firstError.details,
      hint: firstError.hint,
    });
    throw new Error("Unable to load supplier balance relations.");
  }

  const suppliersById = new Map(
    ((suppliersResult.data ?? []) as SupplierRow[]).map((supplier) => [
      supplier.id,
      supplier,
    ]),
  );
  const projectsById = new Map(
    ((projectsResult.data ?? []) as ProjectRow[]).map((project) => [
      project.id,
      project,
    ]),
  );
  const grouped = new Map<string, SupplierOutstandingBalance>();

  for (const material of materials) {
    const supplier = material.supplier_id
      ? suppliersById.get(material.supplier_id)
      : null;
    const project = projectsById.get(material.project_id);
    const supplierId = material.supplier_id ?? null;
    const supplierName = supplier?.name ?? material.supplier_name;
    const supplierTaxId = supplier?.tax_id ?? material.supplier_vat;
    const key = supplierId ?? `legacy:${supplierName}:${supplierTaxId ?? ""}`;
    const invoice: SupplierOutstandingInvoice = {
      invoiceId: material.id,
      invoiceNumber: material.invoice_number,
      projectId: material.project_id,
      projectName: project
        ? `${project.code} - ${project.name}`
        : material.project_id,
      invoiceDate: material.invoice_date,
      totalAmount: material.total_amount,
      paidAmount: material.paid_amount,
      remainingAmount: material.remainingAmount,
      pendingPercentage:
        material.total_amount > 0
          ? roundPercentage((material.remainingAmount / material.total_amount) * 100)
          : 0,
      paymentStatus: material.payment_status,
    };
    const existing = grouped.get(key) ?? {
      supplierId,
      supplierName,
      supplierTaxId,
      totalOutstandingAmount: 0,
      pendingInvoiceCount: 0,
      invoices: [],
    };

    existing.invoices.push(invoice);
    existing.totalOutstandingAmount = roundMoney(
      existing.totalOutstandingAmount + invoice.remainingAmount,
    );
    existing.pendingInvoiceCount = existing.invoices.length;
    grouped.set(key, existing);
  }

  return mergeSupplierOutstandingBalances([
    {
      totalOutstandingAmount: 0,
      suppliers: Array.from(grouped.values()),
    },
  ]);
}
