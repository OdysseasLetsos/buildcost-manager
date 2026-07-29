"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { createCompanyOffice } from "../actions/create-company-office";
import { createCompanyVehicle } from "../actions/create-company-vehicle";
import { saveOfficeExpenses } from "../actions/save-office-expenses";
import { saveVehicleExpenses } from "../actions/save-vehicle-expenses";
import { expenseSubtypeLabels, type ExpenseScope } from "../constants";
import type {
  CompanyOffice,
  CompanyVehicle,
  ExpenseResourceActionState,
  ExpenseWithRelations,
} from "../types";
import { initialExpenseActionState } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDefaultExpenseDate(month?: MonthlyPeriod) {
  const today = getTodayDateKey();
  if (!month) return today;

  if (today.startsWith(`${month.month_key}-`)) return today;

  const firstDay = `${month.month_key}-01`;
  return firstDay > today ? today : firstDay;
}

function ExistingResourceExpenses({
  expenses,
  onEditExpense,
}: Readonly<{
  expenses: ExpenseWithRelations[];
  onEditExpense: (expense: ExpenseWithRelations) => void;
}>) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Δεν υπάρχουν αποθηκευμένα έξοδα για αυτόν τον μήνα.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
        >
          <div>
            <span className="font-semibold text-slate-800">
              {expense.expense_subtype
                ? expenseSubtypeLabels[expense.expense_subtype] ?? expense.expense_subtype
                : "Έξοδο"}
            </span>
            <span className="ml-2 text-slate-500">{expense.expense_date}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-950">
              {currencyFormatter.format(expense.amount)}
            </span>
            <button
              type="button"
              onClick={() => onEditExpense(expense)}
              className="rounded-md px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Επεξεργασία
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OfficeExpenseCard({
  office,
  monthId,
  defaultDate,
  maxDate,
  existingExpenses,
  canManage,
  onEditExpense,
}: Readonly<{
  office: CompanyOffice;
  monthId: string;
  defaultDate: string;
  maxDate: string;
  existingExpenses: ExpenseWithRelations[];
  canManage: boolean;
  onEditExpense: (expense: ExpenseWithRelations) => void;
}>) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    saveOfficeExpenses,
    initialExpenseActionState,
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <article className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-950">{office.name}</h4>
          {office.address ? (
            <p className="mt-1 text-sm text-slate-600">{office.address}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-800">
          Γραφείο
        </span>
      </div>

      {canManage ? (
        <form action={formAction} className="mt-4 grid gap-3">
          <input type="hidden" name="monthId" value={monthId} />
          <input type="hidden" name="officeId" value={office.id} />
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Ημερομηνία
            <input
              name="expenseDate"
              type="date"
              defaultValue={defaultDate}
              max={maxDate}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Ενοίκιο
              <input
                name="rentAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Έξοδα γραφείου
              <input
                name="officeUtilitiesAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Άλλο
              <input
                name="otherAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Σημειώσεις
            <textarea
              name="notes"
              rows={2}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          {state.message ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                state.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="justify-self-start rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Αποθήκευση..." : "Αποθήκευση εξόδων γραφείου"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Ο μήνας είναι κλειδωμένος ή δεν επιτρέπονται αλλαγές.
        </p>
      )}

      <div className="mt-4">
        <h5 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Αποθηκευμένα έξοδα μήνα
        </h5>
        <ExistingResourceExpenses
          expenses={existingExpenses}
          onEditExpense={onEditExpense}
        />
      </div>
    </article>
  );
}

function VehicleExpenseCard({
  vehicle,
  monthId,
  defaultDate,
  maxDate,
  existingExpenses,
  canManage,
  onEditExpense,
}: Readonly<{
  vehicle: CompanyVehicle;
  monthId: string;
  defaultDate: string;
  maxDate: string;
  existingExpenses: ExpenseWithRelations[];
  canManage: boolean;
  onEditExpense: (expense: ExpenseWithRelations) => void;
}>) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    saveVehicleExpenses,
    initialExpenseActionState,
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <article className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-950">{vehicle.name}</h4>
          <p className="mt-1 text-sm text-slate-600">
            {[vehicle.plate_number, vehicle.model].filter(Boolean).join(" · ") || "Χωρίς πινακίδα"}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-800">
          Μεταφορικά
        </span>
      </div>

      {canManage ? (
        <form action={formAction} className="mt-4 grid gap-3">
          <input type="hidden" name="monthId" value={monthId} />
          <input type="hidden" name="vehicleId" value={vehicle.id} />
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Ημερομηνία
            <input
              name="expenseDate"
              type="date"
              defaultValue={defaultDate}
              max={maxDate}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Έξοδα συντήρησης
              <input
                name="maintenanceAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Άλλο
              <input
                name="otherAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Σημειώσεις
            <textarea
              name="notes"
              rows={2}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          {state.message ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                state.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="justify-self-start rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Αποθήκευση..." : "Αποθήκευση εξόδων οχήματος"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Ο μήνας είναι κλειδωμένος ή δεν επιτρέπονται αλλαγές.
        </p>
      )}

      <div className="mt-4">
        <h5 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Αποθηκευμένα έξοδα μήνα
        </h5>
        <ExistingResourceExpenses
          expenses={existingExpenses}
          onEditExpense={onEditExpense}
        />
      </div>
    </article>
  );
}

function AddResourcePanel({
  resourceType,
  onResourceCreated,
}: Readonly<{
  resourceType: "office" | "vehicle";
  onResourceCreated: (resource: CompanyOffice | CompanyVehicle) => void;
}>) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<ExpenseResourceActionState<CompanyOffice | CompanyVehicle>>({
    ok: false,
  });
  const [fields, setFields] = useState({
    name: "",
    address: "",
    plateNumber: "",
    model: "",
    notes: "",
  });
  const isOffice = resourceType === "office";

  async function handleSave() {
    setIsPending(true);
    const data = new FormData();
    data.set("name", fields.name);
    data.set("notes", fields.notes);

    if (isOffice) {
      data.set("address", fields.address);
    } else {
      data.set("plateNumber", fields.plateNumber);
      data.set("model", fields.model);
    }

    const result = isOffice
      ? await createCompanyOffice(data)
      : await createCompanyVehicle(data);

    setState(result);
    setIsPending(false);

    if (result.resource) {
      onResourceCreated(result.resource);
      setFields({ name: "", address: "", plateNumber: "", model: "", notes: "" });
      setShowForm(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-950">
            {isOffice ? "Γραφεία" : "Οχήματα"}
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            {isOffice
              ? "Προσθέστε νέο γραφείο για να εμφανίζεται σε όλους τους μήνες."
              : "Προσθέστε νέο όχημα για να εμφανίζεται σε όλους τους μήνες."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900"
        >
          {isOffice ? "+ Προσθήκη νέου γραφείου" : "+ Προσθήκη νέου οχήματος"}
        </button>
      </div>

      {showForm ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={fields.name}
            onChange={(event) =>
              setFields((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={isOffice ? "Όνομα γραφείου" : "Όνομα οχήματος"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {isOffice ? (
            <input
              value={fields.address}
              onChange={(event) =>
                setFields((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Διεύθυνση"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <>
              <input
                value={fields.plateNumber}
                onChange={(event) =>
                  setFields((current) => ({
                    ...current,
                    plateNumber: event.target.value,
                  }))
                }
                placeholder="Πινακίδα"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={fields.model}
                onChange={(event) =>
                  setFields((current) => ({ ...current, model: event.target.value }))
                }
                placeholder="Μάρκα/Μοντέλο"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </>
          )}
          <textarea
            value={fields.notes}
            onChange={(event) =>
              setFields((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Σημειώσεις"
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => void handleSave()}
            className="justify-self-start rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Αποθήκευση..." : isOffice ? "Αποθήκευση γραφείου" : "Αποθήκευση οχήματος"}
          </button>
        </div>
      ) : null}

      {state.message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}

export function GeneralExpenseResourceCards({
  category,
  scope,
  month,
  offices,
  vehicles,
  expenses,
  canManage,
  onEditExpense,
}: Readonly<{
  category: string;
  scope: ExpenseScope;
  month?: MonthlyPeriod;
  offices: CompanyOffice[];
  vehicles: CompanyVehicle[];
  expenses: ExpenseWithRelations[];
  canManage: boolean;
  onEditExpense: (expense: ExpenseWithRelations) => void;
}>) {
  const [availableOffices, setAvailableOffices] = useState(offices);
  const [availableVehicles, setAvailableVehicles] = useState(vehicles);
  const defaultDate = useMemo(() => getDefaultExpenseDate(month), [month]);
  const today = useMemo(() => getTodayDateKey(), []);

  if (scope !== "general" || (category !== "office" && category !== "transport")) {
    return null;
  }

  if (!month) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Επιλέξτε μήνα για να καταχωρήσετε έξοδα.
      </section>
    );
  }

  const resourceExpenses = expenses.filter(
    (expense) => expense.month_id === month.id && expense.category === category,
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-700">Γενικά έξοδα</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">
          {category === "office" ? "Γραφείο" : "Μεταφορικά"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Συμπληρώστε ποσά για τον επιλεγμένο μήνα. Κάθε συμπληρωμένο ποσό
          αποθηκεύεται ως ξεχωριστή εγγραφή εξόδου.
        </p>
      </div>

      {category === "office" ? (
        <>
          <AddResourcePanel
            resourceType="office"
            onResourceCreated={(resource) =>
              setAvailableOffices((current) =>
                [...current, resource as CompanyOffice].sort((left, right) =>
                  left.name.localeCompare(right.name, "el"),
                ),
              )
            }
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {availableOffices.map((office) => (
              <OfficeExpenseCard
                key={office.id}
                office={office}
                monthId={month.id}
                defaultDate={defaultDate}
                maxDate={today}
                canManage={canManage}
                existingExpenses={resourceExpenses.filter(
                  (expense) => expense.office_id === office.id,
                )}
                onEditExpense={onEditExpense}
              />
            ))}
          </div>
          {availableOffices.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Δεν υπάρχουν αποθηκευμένα γραφεία ακόμα.
            </p>
          ) : null}
        </>
      ) : null}

      {category === "transport" ? (
        <>
          <AddResourcePanel
            resourceType="vehicle"
            onResourceCreated={(resource) =>
              setAvailableVehicles((current) =>
                [...current, resource as CompanyVehicle].sort((left, right) =>
                  left.name.localeCompare(right.name, "el"),
                ),
              )
            }
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {availableVehicles.map((vehicle) => (
              <VehicleExpenseCard
                key={vehicle.id}
                vehicle={vehicle}
                monthId={month.id}
                defaultDate={defaultDate}
                maxDate={today}
                canManage={canManage}
                existingExpenses={resourceExpenses.filter(
                  (expense) => expense.vehicle_id === vehicle.id,
                )}
                onEditExpense={onEditExpense}
              />
            ))}
          </div>
          {availableVehicles.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Δεν υπάρχουν αποθηκευμένα οχήματα ακόμα.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
