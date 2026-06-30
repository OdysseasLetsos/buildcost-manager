"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertEmployeeIka } from "@/src/features/ika/actions/upsert-employee-ika";
import { IkaAllocationPreview } from "@/src/features/ika/components/IkaAllocationPreview";
import { IkaForm } from "@/src/features/ika/components/IkaForm";
import { IkaTable } from "@/src/features/ika/components/IkaTable";
import { getIkaSummary } from "@/src/features/ika/services/get-ika-summary";
import type {
  EmployeeIkaWithRelations,
  IkaAllocationPreview as IkaAllocationPreviewData,
} from "@/src/features/ika/types";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { createEmployeeBenefit } from "../actions/create-employee-benefit";
import { createEmployeePayment } from "../actions/create-employee-payment";
import { updateEmployeeBenefit } from "../actions/update-employee-benefit";
import { updateEmployeePayment } from "../actions/update-employee-payment";
import { getPaymentsSummary } from "../services/get-payments-summary";
import { isWritablePaymentMonth } from "../services/payment-month-rules";
import type {
  EmployeeBenefitWithRelations,
  EmployeePaymentWithRelations,
  PaymentAllocationPreview as PaymentAllocationPreviewData,
} from "../types";
import { BenefitForm } from "./BenefitForm";
import { BenefitsTable } from "./BenefitsTable";
import { PaymentAllocationPreview } from "./PaymentAllocationPreview";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentForm } from "./PaymentForm";
import { PaymentsSummaryCards } from "./PaymentsSummaryCards";
import { PaymentsTable } from "./PaymentsTable";

type Tab = "payments" | "ika" | "benefits" | "allocation";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

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

function filterBenefits(
  benefits: EmployeeBenefitWithRelations[],
  filters: { monthKey: string; employeeId: string },
) {
  return benefits.filter(
    (benefit) =>
      (!filters.monthKey || benefit.month_key === filters.monthKey) &&
      (!filters.employeeId || benefit.employee_id === filters.employeeId),
  );
}

function getMissingIkaEmployees({
  employees,
  payments,
  ikaRows,
  selectedMonthId,
}: {
  employees: Employee[];
  payments: EmployeePaymentWithRelations[];
  ikaRows: EmployeeIkaWithRelations[];
  selectedMonthId: string;
}) {
  if (!selectedMonthId) return [];

  const relevantIds = new Set<string>();
  for (const employee of employees) {
    if (employee.active) relevantIds.add(employee.id);
  }
  for (const payment of payments) {
    if (payment.month_id === selectedMonthId) relevantIds.add(payment.employee_id);
  }
  for (const ika of ikaRows) {
    if (ika.month_id === selectedMonthId) relevantIds.add(ika.employee_id);
  }

  const ikaEmployeeIds = new Set(
    ikaRows
      .filter((ika) => ika.month_id === selectedMonthId)
      .map((ika) => ika.employee_id),
  );

  return employees.filter(
    (employee) => relevantIds.has(employee.id) && !ikaEmployeeIds.has(employee.id),
  );
}

export function PaymentsPageClient({
  payments,
  ikaRows,
  benefits,
  monthlyPeriods,
  employees,
  defaultMonthId,
  todayDate,
  canManage,
  paymentsFeatureAvailable,
  ikaFeatureAvailable,
  paymentAllocationPreview,
  ikaAllocationPreview,
}: Readonly<{
  payments: EmployeePaymentWithRelations[];
  ikaRows: EmployeeIkaWithRelations[];
  benefits: EmployeeBenefitWithRelations[];
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  defaultMonthId: string;
  todayDate: string;
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
  const [showBenefitForm, setShowBenefitForm] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<EmployeePaymentWithRelations | null>(null);
  const [editingIka, setEditingIka] = useState<EmployeeIkaWithRelations | null>(null);
  const [editingBenefit, setEditingBenefit] =
    useState<EmployeeBenefitWithRelations | null>(null);

  const effectiveMonthId = monthId || defaultMonthId;
  const selectedMonth = monthlyPeriods.find((period) => period.id === effectiveMonthId);
  const selectedMonthKey = selectedMonth?.month_key ?? "";
  const selectedMonthLocked =
    selectedMonth?.status === "locked" || selectedMonth?.is_locked === true;
  const writableMonthlyPeriods = monthlyPeriods.filter((period) =>
    isWritablePaymentMonth(period),
  );
  const selectedMonthWritable = selectedMonth
    ? isWritablePaymentMonth(selectedMonth)
    : false;
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
  const filteredBenefits = useMemo(
    () => filterBenefits(benefits, { monthKey: selectedMonthKey, employeeId }),
    [benefits, employeeId, selectedMonthKey],
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
  const missingIkaEmployees = useMemo(
    () =>
      getMissingIkaEmployees({
        employees,
        payments,
        ikaRows,
        selectedMonthId: effectiveMonthId,
      }),
    [effectiveMonthId, employees, ikaRows, payments],
  );
  const benefitsTotal = filteredBenefits.reduce(
    (sum, benefit) => sum + Number(benefit.amount),
    0,
  );
  const canMutate = canManage && selectedMonthWritable;

  function handleSuccess() {
    setShowPaymentForm(false);
    setShowIkaForm(false);
    setShowBenefitForm(false);
    setEditingPayment(null);
    setEditingIka(null);
    setEditingBenefit(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Πληρωμές
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Παρακολούθηση πληρωμών εργαζομένων, ΙΚΑ, επιδομάτων και δυναμική
            κατανομή ανά έργο.
          </p>
        </div>
      </section>

      {selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      {selectedMonth && selectedMonth.month_key > todayDate.slice(0, 7) ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Δεν μπορείτε να καταχωρήσετε εγγραφή σε μελλοντικό μήνα.
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
          ["benefits", "Επιδόματα & Δώρα"],
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
                monthlyPeriods={writableMonthlyPeriods}
                employees={employees}
                defaultMonthId={monthId || defaultMonthId}
                todayDate={todayDate}
                submitLabel={
                  editingPayment ? "Αποθήκευση Αλλαγών" : "Δημιουργία Πληρωμής"
                }
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
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                ΙΚΑ Εργαζομένων
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Εκκρεμείς καταχωρήσεις ΙΚΑ: {missingIkaEmployees.length}
              </p>
            </div>
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

          {missingIkaEmployees.length ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">
                Πρέπει να καταχωρηθεί ΙΚΑ για όλους τους εργαζόμενους του μήνα.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {missingIkaEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-lg border border-amber-200 bg-white px-3 py-2"
                  >
                    <p className="font-medium text-slate-950">{employee.full_name}</p>
                    <p className="text-xs text-amber-900">
                      Λείπει καταχώρηση ΙΚΑ για αυτόν τον εργαζόμενο.
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {(showIkaForm || editingIka) && canMutate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <IkaForm
                action={upsertEmployeeIka}
                ika={editingIka ?? undefined}
                monthlyPeriods={writableMonthlyPeriods}
                employees={employees}
                defaultMonthId={monthId || defaultMonthId}
                submitLabel={
                  editingIka ? "Αποθήκευση Αλλαγών" : "Αποθήκευση ΙΚΑ"
                }
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

      {activeTab === "benefits" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                Επιδόματα & Δώρα
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Σύνολο επιδομάτων & δώρων: {currencyFormatter.format(benefitsTotal)}
              </p>
            </div>
            {canMutate && paymentsFeatureAvailable ? (
              <button
                type="button"
                onClick={() => setShowBenefitForm((value) => !value)}
                className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Νέα Εγγραφή
              </button>
            ) : null}
          </div>

          {(showBenefitForm || editingBenefit) && canMutate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <BenefitForm
                action={
                  editingBenefit ? updateEmployeeBenefit : createEmployeeBenefit
                }
                benefit={editingBenefit ?? undefined}
                monthlyPeriods={writableMonthlyPeriods}
                employees={employees}
                defaultMonthId={monthId || defaultMonthId}
                todayDate={todayDate}
                submitLabel={
                  editingBenefit ? "Αποθήκευση Αλλαγών" : "Αποθήκευση Εγγραφής"
                }
                onSuccess={handleSuccess}
              />
            </section>
          ) : null}

          <BenefitsTable
            benefits={filteredBenefits}
            canManage={canMutate && paymentsFeatureAvailable}
            onEditBenefit={setEditingBenefit}
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
