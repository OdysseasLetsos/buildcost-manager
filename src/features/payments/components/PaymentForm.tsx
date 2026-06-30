"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { getSuggestedEmployeePaymentWithCarryover } from "../services/get-suggested-employee-payment";
import type {
  EmployeePayment,
  PaymentActionState,
  SuggestedEmployeePaymentWithCarryover,
} from "../types";
import { initialPaymentActionState } from "../types";

type PaymentFormAction = (
  previousState: PaymentActionState,
  formData: FormData,
) => Promise<PaymentActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function money(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function numberValue(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function suggestedAmountValue(value: number): string {
  return value > 0 ? value.toFixed(2) : "";
}

function defaultPaymentDateForMonth(
  period: MonthlyPeriod | undefined,
  todayDate: string,
): string {
  if (!period) {
    return todayDate;
  }

  if (period.month_key < todayDate.slice(0, 7)) {
    return period.ends_on;
  }

  return todayDate;
}

function SuggestedPaymentBox({
  suggestion,
  isLoading,
  onUseSuggestedAmount,
}: {
  suggestion: SuggestedEmployeePaymentWithCarryover | null;
  isLoading: boolean;
  onUseSuggestedAmount: () => void;
}) {
  const [showPreviousBreakdown, setShowPreviousBreakdown] = useState(false);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Υπολογισμός προτεινόμενης πληρωμής...
      </section>
    );
  }

  if (!suggestion) return null;

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-950">
            Προτεινόμενη Πληρωμή
          </h3>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Η πρόταση βασίζεται στις ημερήσιες καταχωρήσεις, στις αμοιβές του
            εργαζομένου και στα ανεξόφλητα υπόλοιπα προηγούμενων μηνών. Δεν
            δημιουργείται καμία πληρωμή μέχρι να αποθηκεύσετε τη φόρμα.
          </p>
        </div>
        <button
          className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50"
          disabled={suggestion.total_suggested_payment_amount <= 0}
          onClick={onUseSuggestedAmount}
          type="button"
        >
          Χρήση Προτεινόμενου Ποσού
        </button>
      </div>

      {!suggestion.has_work_entries ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Δεν υπάρχουν ημερήσιες καταχωρήσεις για τον εργαζόμενο σε αυτόν τον μήνα.
        </p>
      ) : null}

      {!suggestion.has_rates ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Δεν έχουν οριστεί ημερομίσθιο, ωρομίσθιο ή ποσό υπερωρίας για τον
          εργαζόμενο.
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-blue-700">
            Προτεινόμενο ποσό μήνα
          </dt>
          <dd className="text-sm font-semibold text-blue-950">
            {money(suggestion.selected_month_suggested_amount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-blue-700">
            Υπόλοιπο προηγούμενων μηνών
          </dt>
          <dd className="text-sm font-semibold text-blue-950">
            {money(suggestion.previous_months_remaining_amount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-blue-700">
            Σύνολο προτεινόμενης πληρωμής
          </dt>
          <dd className="text-sm font-semibold text-blue-950">
            {money(suggestion.total_suggested_payment_amount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-blue-700">Ώρες</dt>
          <dd className="text-sm font-semibold text-blue-950">
            {numberValue(suggestion.regular_hours)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-blue-700">Υπερωρίες</dt>
          <dd className="text-sm font-semibold text-blue-950">
            {numberValue(suggestion.overtime_hours)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-blue-700">
            Έξοδα εργαζομένου
          </dt>
          <dd className="text-sm font-semibold text-blue-950">
            {money(suggestion.employee_expenses)}
          </dd>
        </div>
      </dl>

      {suggestion.previous_month_breakdown.length ? (
        <div className="mt-4 rounded-lg border border-blue-100 bg-white/70 p-3">
          <button
            type="button"
            onClick={() => setShowPreviousBreakdown((value) => !value)}
            className="text-xs font-semibold text-blue-900 underline-offset-4 hover:underline"
          >
            Ανάλυση υπολοίπου προηγούμενων μηνών
          </button>

          {showPreviousBreakdown ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-blue-700">
                  <tr>
                    <th className="whitespace-nowrap px-2 py-1 font-semibold">
                      Μήνας
                    </th>
                    <th className="whitespace-nowrap px-2 py-1 font-semibold">
                      Προτεινόμενο
                    </th>
                    <th className="whitespace-nowrap px-2 py-1 font-semibold">
                      Πληρώθηκε
                    </th>
                    <th className="whitespace-nowrap px-2 py-1 font-semibold">
                      Υπόλοιπο
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 text-blue-950">
                  {suggestion.previous_month_breakdown.map((row) => (
                    <tr key={row.monthKey}>
                      <td className="whitespace-nowrap px-2 py-1">{row.monthKey}</td>
                      <td className="whitespace-nowrap px-2 py-1">
                        {money(row.suggestedAmount)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1">
                        {money(row.paidAmount)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 font-semibold">
                        {money(row.remainingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function PaymentForm({
  action,
  payment,
  monthlyPeriods,
  employees,
  defaultMonthId,
  todayDate,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: PaymentFormAction;
  payment?: EmployeePayment;
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  defaultMonthId: string;
  todayDate: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialPaymentActionState,
  );
  const [monthId, setMonthId] = useState(payment?.month_id ?? defaultMonthId);
  const selectedMonth = useMemo(
    () => monthlyPeriods.find((period) => period.id === monthId),
    [monthId, monthlyPeriods],
  );
  const [paymentDate, setPaymentDate] = useState(
    payment?.payment_date ?? defaultPaymentDateForMonth(selectedMonth, todayDate),
  );
  const [employeeId, setEmployeeId] = useState(payment?.employee_id ?? "");
  const [amount, setAmount] = useState(decimalValue(payment?.amount));
  const [suggestion, setSuggestion] =
    useState<SuggestedEmployeePaymentWithCarryover | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const amountTouchedRef = useRef(Boolean(payment));
  const dateMin = selectedMonth?.starts_on ?? undefined;
  const dateMax =
    selectedMonth && selectedMonth.ends_on < todayDate
      ? selectedMonth.ends_on
      : todayDate;

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  useEffect(() => {
    let active = true;

    void Promise.resolve()
      .then(async () => {
        if (!monthId || !employeeId) {
          return null;
        }

        if (active) setIsSuggestionLoading(true);
        return getSuggestedEmployeePaymentWithCarryover({ monthId, employeeId });
      })
      .then((result) => {
        if (!active) return;
        setSuggestion(result);
        if (result && !amountTouchedRef.current) {
          setAmount(suggestedAmountValue(result.total_suggested_payment_amount));
        }
      })
      .catch((error: unknown) => {
        console.error("[payments:PaymentForm] Suggested payment error", {
          message: error instanceof Error ? error.message : String(error),
        });
        if (active) setSuggestion(null);
      })
      .finally(() => {
        if (active) setIsSuggestionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [employeeId, monthId]);

  function resetSuggestedAmountForSelectionChange() {
    amountTouchedRef.current = false;
  }

  function useSuggestedAmount() {
    if (!suggestion) return;
    amountTouchedRef.current = true;
    setAmount(suggestedAmountValue(suggestion.total_suggested_payment_amount));
  }

  return (
    <form action={formAction} className="grid gap-4">
      {payment ? <input name="id" type="hidden" value={payment.id} /> : null}

      {state.message ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            name="monthId"
            onChange={(event) => {
              const nextMonthId = event.target.value;
              const nextMonth = monthlyPeriods.find(
                (period) => period.id === nextMonthId,
              );
              resetSuggestedAmountForSelectionChange();
              setMonthId(nextMonthId);
              setPaymentDate(defaultPaymentDateForMonth(nextMonth, todayDate));
            }}
            required
            value={monthId}
          >
            <option value="">Επιλέξτε μήνα</option>
            {monthlyPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.month_key}
                {period.month_key < todayDate.slice(0, 7)
                  ? " - ξεκλείδωτος για διορθώσεις"
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            max={dateMax}
            min={dateMin}
            name="paymentDate"
            onChange={(event) => setPaymentDate(event.target.value)}
            required
            type="date"
            value={paymentDate}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Εργαζόμενος
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            name="employeeId"
            onChange={(event) => {
              resetSuggestedAmountForSelectionChange();
              setEmployeeId(event.target.value);
            }}
            required
            value={employeeId}
          >
            <option value="">Επιλέξτε εργαζόμενο</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ποσό
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            min="0.01"
            name="amount"
            onChange={(event) => {
              amountTouchedRef.current = true;
              setAmount(event.target.value);
            }}
            required
            step="0.01"
            type="number"
            value={amount}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τρόπος Πληρωμής
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            defaultValue={payment?.payment_method ?? "bank"}
            name="paymentMethod"
            required
          >
            <option value="cash">Μετρητά</option>
            <option value="bank">Τράπεζα</option>
            <option value="other">Άλλο</option>
          </select>
        </label>
      </div>

      <SuggestedPaymentBox
        isLoading={isSuggestionLoading}
        onUseSuggestedAmount={useSuggestedAmount}
        suggestion={suggestion}
      />

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          defaultValue={payment?.notes ?? ""}
          name="notes"
          rows={3}
        />
      </label>

      <button
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
