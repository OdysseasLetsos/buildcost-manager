"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertEmployeeIka } from "@/src/features/ika/actions/upsert-employee-ika";
import { IkaAllocationPreview } from "@/src/features/ika/components/IkaAllocationPreview";
import { IkaForm } from "@/src/features/ika/components/IkaForm";
import { IkaTable } from "@/src/features/ika/components/IkaTable";
import type { EmployeeIkaWithRelations, IkaAllocationPreview as IkaAllocationPreviewData } from "@/src/features/ika/types";
import { getIkaSummary } from "@/src/features/ika/services/get-ika-summary";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { createEmployeePayment } from "../actions/create-employee-payment";
import { updateEmployeePayment } from "../actions/update-employee-payment";
import { getPaymentsSummary } from "../services/get-payments-summary";
import type {
  EmployeePaymentWithRelations,
  PaymentAllocationPreview as PaymentAllocationPreviewData,
} from "../types";
import { PaymentAllocationPreview } from "./PaymentAllocationPreview";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentForm } from "./PaymentForm";
import { PaymentsSummaryCards } from "./PaymentsSummaryCards";
import { PaymentsTable } from "./PaymentsTable";

type Tab = "payments" | "ika" | "allocation";

function filterPayments(
  payments: EmployeePaymentWithRelations[],
  filters: { monthId: string; employeeId: string; paymentMethod: string },
) {
  return payments.filter(
    (payment) =>
      (!filters.monthId || payment.month_id === filters.monthId) &&
      (!filters.employeeId || payment.employee_id === filters.employeeId) &&
      (!filters.paymentMethod || payment.payment_method === filters.paymentMethod),
  );
}

function filterIka(
  ikaRows: EmployeeIkaWithRelations[],
  filters: { monthId: string; employeeId: string },
) {
  return ikaRows.filter(
    (ika) =>
      (!filters.monthId || ika.month_id === filters.monthId) &&
      (!filters.employeeId || ika.employee_id === filters.employeeId),
  );
}

export function PaymentsPageClient({
  payments,
  ikaRows,
  monthlyPeriods,
  employees,
  defaultMonthId,
  canManage,
  paymentsFeatureAvailable,
  ikaFeatureAvailable,
  paymentAllocationPreview,
  ikaAllocationPreview,
}: Readonly<{
  payments: EmployeePaymentWithRelations[];
  ikaRows: EmployeeIkaWithRelations[];
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  defaultMonthId: string;
  canManage: boolean;
  paymentsFeatureAvailable: boolean;
  ikaFeatureAvailable: boolean;
  paymentAllocationPreview: Record<string, PaymentAllocationPreviewData>;
  ikaAllocationPreview: Record<string, IkaAllocationPreviewData>;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [employeeId, setEmployeeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showIkaForm, setShowIkaForm] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<EmployeePaymentWithRelations | null>(null);
  const [editingIka, setEditingIka] = useState<EmployeeIkaWithRelations | null>(null);

  const effectiveMonthId = monthId || defaultMonthId;
  const selectedMonth = monthlyPeriods.find((period) => period.id === effectiveMonthId);
  const selectedMonthLocked =
    selectedMonth?.status === "locked" || selectedMonth?.is_locked === true;
  const openMonthlyPeriods = monthlyPeriods.filter(
    (period) => period.status === "open" && !period.is_locked,
  );
  const filteredPayments = useMemo(
    () =>
      filterPayments(payments, {
        monthId: effectiveMonthId,
        employeeId,
        paymentMethod,
      }),
    [effectiveMonthId, employeeId, paymentMethod, payments],
  );
  const filteredIkaRows = useMemo(
    () => filterIka(ikaRows, { monthId: effectiveMonthId, employeeId }),
    [effectiveMonthId, employeeId, ikaRows],
  );
  const paymentsSummary = useMemo(
    () => getPaymentsSummary(filteredPayments),
    [filteredPayments],
  );
  const ikaSummary = useMemo(() => getIkaSummary(filteredIkaRows), [filteredIkaRows]);
  const selectedPaymentAllocationPreview = paymentAllocationPreview[
    effectiveMonthId
  ] ?? { projectTotals: [], warnings: [] };
  const selectedIkaAllocationPreview = ikaAllocationPreview[effectiveMonthId] ?? {
    projectTotals: [],
    warnings: [],
  };
  const canMutate = canManage && !selectedMonthLocked;

  function handleSuccess() {
    setShowPaymentForm(false);
    setShowIkaForm(false);
    setEditingPayment(null);
    setEditingIka(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Πληρωμές & ΙΚΑ
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Παρακολούθηση πληρωμών εργαζομένων, ΙΚΑ και δυναμική κατανομή ανά έργο.
          </p>
        </div>
      </section>

      {selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      {!paymentsFeatureAvailable || !ikaFeatureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Πληρωμές & ΙΚΑ.
        </section>
      ) : null}

      <PaymentsSummaryCards paymentsSummary={paymentsSummary} ikaSummary={ikaSummary} />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          ["payments", "Πληρωμές"],
          ["ika", "ΙΚΑ"],
          ["allocation", "Κατανομή"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value as Tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === value
                ? "bg-blue-950 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <PaymentFilters
        monthId={monthId}
        employeeId={employeeId}
        paymentMethod={paymentMethod}
        monthlyPeriods={monthlyPeriods}
        employees={employees}
        onMonthChange={setMonthId}
        onEmployeeChange={setEmployeeId}
        onPaymentMethodChange={setPaymentMethod}
      />

      {activeTab === "payments" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-950">
              Πληρωμές Εργαζομένων
            </h3>
            {canMutate && paymentsFeatureAvailable ? (
              <button
                type="button"
                onClick={() => setShowPaymentForm((value) => !value)}
                className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Νέα Πληρωμή
              </button>
            ) : null}
          </div>

          {(showPaymentForm || editingPayment) && canMutate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <PaymentForm
                action={editingPayment ? updateEmployeePayment : createEmployeePayment}
                payment={editingPayment ?? undefined}
                monthlyPeriods={openMonthlyPeriods}
                employees={employees}
                defaultMonthId={monthId || defaultMonthId}
                submitLabel={editingPayment ? "Αποθήκευση Αλλαγών" : "Δημιουργία Πληρωμής"}
                onSuccess={handleSuccess}
              />
            </section>
          ) : null}

          <PaymentsTable
            payments={filteredPayments}
            canManage={canMutate && paymentsFeatureAvailable}
            onEditPayment={setEditingPayment}
          />
        </div>
      ) : null}

      {activeTab === "ika" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-950">
              ΙΚΑ Εργαζομένων
            </h3>
            {canMutate && ikaFeatureAvailable ? (
              <button
                type="button"
                onClick={() => setShowIkaForm((value) => !value)}
                className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Νέο ΙΚΑ
              </button>
            ) : null}
          </div>

          {(showIkaForm || editingIka) && canMutate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <IkaForm
                action={upsertEmployeeIka}
                ika={editingIka ?? undefined}
                monthlyPeriods={openMonthlyPeriods}
                employees={employees}
                defaultMonthId={monthId || defaultMonthId}
                submitLabel={editingIka ? "Αποθήκευση Αλλαγών" : "Αποθήκευση ΙΚΑ"}
                onSuccess={handleSuccess}
              />
            </section>
          ) : null}

          <IkaTable
            ikaRows={filteredIkaRows}
            canManage={canMutate && ikaFeatureAvailable}
            onEditIka={setEditingIka}
          />
        </div>
      ) : null}

      {activeTab === "allocation" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <PaymentAllocationPreview preview={selectedPaymentAllocationPreview} />
          <IkaAllocationPreview preview={selectedIkaAllocationPreview} />
        </div>
      ) : null}
    </div>
  );
}
