"use client";

import { useActionState, useEffect, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { createCompanyOffice } from "../actions/create-company-office";
import { createCompanyVehicle } from "../actions/create-company-vehicle";
import { deactivateCompanyOffice } from "../actions/deactivate-company-office";
import { deactivateCompanyVehicle } from "../actions/deactivate-company-vehicle";
import { saveTaxExpenses } from "../actions/save-tax-expenses";
import {
  allocationMethodLabels,
  expenseAllocationMethods,
  expenseCategoryLabels,
  generalExpenseCategories,
  officeExpenseSubtypes,
  transportExpenseSubtypes,
  type ExpenseAllocationMethod,
  type ExpenseScope,
} from "../constants";
import type {
  CompanyOffice,
  CompanyVehicle,
  Expense,
  ExpenseActionState,
  ExpenseResourceActionState,
} from "../types";
import { initialExpenseActionState } from "../types";

type ExpenseFormAction = (
  previousState: ExpenseActionState,
  formData: FormData,
) => Promise<ExpenseActionState>;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

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

function getDefaultExpenseDate(monthId: string, monthlyPeriods: MonthlyPeriod[]) {
  const today = getTodayDateKey();
  const period = monthlyPeriods.find((monthlyPeriod) => monthlyPeriod.id === monthId);

  if (!period) return today;
  if (today.startsWith(`${period.month_key}-`)) return today;

  const firstDay = `${period.month_key}-01`;
  return firstDay > today ? today : firstDay;
}

function CategorySelector({
  category,
  onCategoryChange,
}: Readonly<{
  category: string;
  onCategoryChange: (value: string) => void;
}>) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      Κατηγορία
      <select
        name="category"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        required
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
        {generalExpenseCategories.map((categoryOption) => (
          <option key={categoryOption.value} value={categoryOption.value}>
            {expenseCategoryLabels[categoryOption.value]}
          </option>
        ))}
      </select>
    </label>
  );
}

function TaxExpenseBatchForm({
  category,
  monthlyPeriods,
  defaultMonthId,
  onCategoryChange,
  onSuccess,
}: Readonly<{
  category: string;
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthId: string;
  onCategoryChange: (value: string) => void;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    saveTaxExpenses,
    initialExpenseActionState,
  );
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [customTaxRows, setCustomTaxRows] = useState([{ id: "initial" }]);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  return (
    <div className="grid gap-4">
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

      <CategorySelector category={category} onCategoryChange={onCategoryChange} />

      <form action={formAction} className="grid gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
        <input type="hidden" name="monthId" value={monthId} />
        <div>
          <p className="text-sm font-medium text-indigo-700">Φόροι</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Καταχώρηση φόρων
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Η μέθοδος κατανομής είναι πάντα Ισόποσα σε ενεργά έργα.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Μήνας
            <select
              value={monthId}
              onChange={(event) => setMonthId(event.target.value)}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Επιλέξτε μήνα</option>
              {monthlyPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.month_key}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Ημερομηνία
            <input
              name="expenseDate"
              type="date"
              defaultValue={getDefaultExpenseDate(monthId, monthlyPeriods)}
              max={getTodayDateKey()}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Μέθοδος κατανομής
            <input
              value="Ισόποσα σε ενεργά έργα"
              disabled
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            ΦΠΑ
            <input name="vatAmount" type="number" min="0" step="0.01" placeholder="0,00" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            ΦΕΕ
            <input name="feeAmount" type="number" min="0" step="0.01" placeholder="0,00" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            ΦΜΥ
            <input name="fmyAmount" type="number" min="0" step="0.01" placeholder="0,00" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Άλλο
            <input name="otherAmount" type="number" min="0" step="0.01" placeholder="0,00" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-950">Πρόσθετοι φόροι</h4>
            <button
              type="button"
              onClick={() =>
                setCustomTaxRows((current) => [
                  ...current,
                  { id: crypto.randomUUID() },
                ])
              }
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900"
            >
              + Προσθήκη φόρου
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            {customTaxRows.map((row) => (
              <div key={row.id} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <input
                  name="customTaxName"
                  placeholder="Όνομα φόρου"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="customTaxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ποσό"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={customTaxRows.length === 1}
                  onClick={() =>
                    setCustomTaxRows((current) =>
                      current.filter((item) => item.id !== row.id),
                    )
                  }
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  Αφαίρεση
                </button>
              </div>
            ))}
          </div>
        </section>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Σημειώσεις
          <textarea name="notes" rows={2} className="rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Αποθήκευση..." : "Αποθήκευση φόρων"}
        </button>
      </form>
    </div>
  );
}

export function ExpenseForm({
  action,
  expense,
  monthlyPeriods,
  offices,
  vehicles,
  defaultMonthId,
  defaultScope,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: ExpenseFormAction;
  expense?: Expense;
  monthlyPeriods: MonthlyPeriod[];
  offices: CompanyOffice[];
  vehicles: CompanyVehicle[];
  defaultMonthId: string;
  defaultScope: ExpenseScope;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(action, initialExpenseActionState);
  const [allocationMethod, setAllocationMethod] = useState(
    expense?.allocation_method ?? "by_project_hours",
  );
  const [category, setCategory] = useState(expense?.category ?? "office");
  const [expenseSubtype, setExpenseSubtype] = useState(
    expense?.expense_subtype ??
      (expense?.category === "transport"
        ? transportExpenseSubtypes[0]?.value
        : officeExpenseSubtypes[0]?.value) ??
      "",
  );
  const [availableOffices, setAvailableOffices] = useState(offices);
  const [availableVehicles, setAvailableVehicles] = useState(vehicles);
  const [selectedOfficeId, setSelectedOfficeId] = useState(expense?.office_id ?? "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    expense?.vehicle_id ?? "",
  );
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [officeFields, setOfficeFields] = useState({
    name: "",
    address: "",
    notes: "",
  });
  const [vehicleFields, setVehicleFields] = useState({
    name: "",
    plateNumber: "",
    model: "",
    notes: "",
  });
  const [officeState, setOfficeState] =
    useState<ExpenseResourceActionState<CompanyOffice>>({ ok: false });
  const [vehicleState, setVehicleState] =
    useState<ExpenseResourceActionState<CompanyVehicle>>({ ok: false });
  const [isSavingOffice, setIsSavingOffice] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const isComingSoon = category === "accountant";
  const isOfficeExpense = category === "office";
  const isTransportExpense = category === "transport";

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  function handleCategoryChange(value: string) {
    setCategory(value);
    if (value === "office") {
      setExpenseSubtype(officeExpenseSubtypes[0]?.value ?? "");
      setSelectedVehicleId("");
    } else if (value === "transport") {
      setExpenseSubtype(transportExpenseSubtypes[0]?.value ?? "");
      setSelectedOfficeId("");
    } else {
      setExpenseSubtype("");
      setSelectedOfficeId("");
      setSelectedVehicleId("");
    }
  }

  if (category === "taxes" && !expense) {
    return (
      <TaxExpenseBatchForm
        category={category}
        monthlyPeriods={monthlyPeriods}
        defaultMonthId={defaultMonthId}
        onCategoryChange={handleCategoryChange}
        onSuccess={onSuccess}
      />
    );
  }

  async function handleCreateOffice() {
    setIsSavingOffice(true);
    const data = new FormData();
    data.set("name", officeFields.name);
    data.set("address", officeFields.address);
    data.set("notes", officeFields.notes);
    const result = await createCompanyOffice(data);
    setOfficeState(result);
    setIsSavingOffice(false);

    if (result.resource) {
      setAvailableOffices((current) =>
        [...current, result.resource as CompanyOffice].sort((left, right) =>
          left.name.localeCompare(right.name, "el"),
        ),
      );
      setSelectedOfficeId(result.resource.id);
      setOfficeFields({ name: "", address: "", notes: "" });
      setShowOfficeForm(false);
    }
  }

  async function handleCreateVehicle() {
    setIsSavingVehicle(true);
    const data = new FormData();
    data.set("name", vehicleFields.name);
    data.set("plateNumber", vehicleFields.plateNumber);
    data.set("model", vehicleFields.model);
    data.set("notes", vehicleFields.notes);
    const result = await createCompanyVehicle(data);
    setVehicleState(result);
    setIsSavingVehicle(false);

    if (result.resource) {
      setAvailableVehicles((current) =>
        [...current, result.resource as CompanyVehicle].sort((left, right) =>
          left.name.localeCompare(right.name, "el"),
        ),
      );
      setSelectedVehicleId(result.resource.id);
      setVehicleFields({ name: "", plateNumber: "", model: "", notes: "" });
      setShowVehicleForm(false);
    }
  }

  async function handleDeactivateOffice(officeId: string) {
    const result = await deactivateCompanyOffice(officeId);
    setOfficeState(result);
    if (result.ok) {
      setAvailableOffices((current) => current.filter((office) => office.id !== officeId));
      if (selectedOfficeId === officeId) setSelectedOfficeId("");
    }
  }

  async function handleDeactivateVehicle(vehicleId: string) {
    const result = await deactivateCompanyVehicle(vehicleId);
    setVehicleState(result);
    if (result.ok) {
      setAvailableVehicles((current) =>
        current.filter((vehicle) => vehicle.id !== vehicleId),
      );
      if (selectedVehicleId === vehicleId) setSelectedVehicleId("");
    }
  }

  return (
    <form action={formAction} className="grid gap-4">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
      <input type="hidden" name="scope" value={expense?.scope ?? defaultScope} />
      <input type="hidden" name="expenseSubtype" value={expenseSubtype} />
      <input type="hidden" name="officeId" value={selectedOfficeId} />
      <input type="hidden" name="vehicleId" value={selectedVehicleId} />
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
      {allocationMethod === "manual" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Η χειροκίνητη κατανομή θα υποστηριχθεί σε επόμενη έκδοση.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μήνας
          <select
            name="monthId"
            defaultValue={expense?.month_id ?? defaultMonthId}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Επιλέξτε μήνα</option>
            {monthlyPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.month_key}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ημερομηνία
          <input
            name="expenseDate"
            type="date"
            defaultValue={expense?.expense_date ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <CategorySelector category={category} onCategoryChange={handleCategoryChange} />

        {isOfficeExpense ? (
          <>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Επιλογή γραφείου
              <select
                value={selectedOfficeId}
                onChange={(event) => setSelectedOfficeId(event.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Επιλέξτε γραφείο</option>
                {availableOffices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Τύπος εξόδου
              <select
                value={expenseSubtype}
                onChange={(event) => setExpenseSubtype(event.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                {officeExpenseSubtypes.map((subtype) => (
                  <option key={subtype.value} value={subtype.value}>
                    {subtype.label}
                  </option>
                ))}
              </select>
              {expenseSubtype === "office_utilities" ? (
                <span className="text-xs text-slate-500">
                  ΔΕΗ, νερό, internet ή άλλα λειτουργικά έξοδα γραφείου.
                </span>
              ) : null}
            </label>
          </>
        ) : null}

        {isTransportExpense ? (
          <>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Επιλογή οχήματος
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Επιλέξτε όχημα</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                    {vehicle.plate_number ? ` - ${vehicle.plate_number}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Τύπος εξόδου
              <select
                value={expenseSubtype}
                onChange={(event) => setExpenseSubtype(event.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                {transportExpenseSubtypes.map((subtype) => (
                  <option key={subtype.value} value={subtype.value}>
                    {subtype.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ποσό
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={decimalValue(expense?.amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Μέθοδος Κατανομής
          <select
            name="allocationMethod"
            value={allocationMethod}
            onChange={(event) =>
              setAllocationMethod(event.target.value as ExpenseAllocationMethod)
            }
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            {expenseAllocationMethods.map((method) => (
              <option key={method} value={method}>
                {allocationMethodLabels[method]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isComingSoon ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Προσεχώς διαθέσιμο</h3>
          <p className="mt-2 text-sm text-slate-600">
            Η αναλυτική καταχώρηση για αυτή την κατηγορία θα προστεθεί σε επόμενο βήμα.
          </p>
        </div>
      ) : null}

      {isOfficeExpense ? (
        <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-blue-950">Γραφεία</h3>
              <p className="mt-1 text-xs text-blue-800">
                Τα αποθηκευμένα γραφεία παραμένουν διαθέσιμα και σε μελλοντικούς μήνες.
              </p>
            </div>
            <button type="button" onClick={() => setShowOfficeForm((value) => !value)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-900">
              + Προσθήκη νέου γραφείου
            </button>
          </div>
          {officeState.message ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {officeState.message}
            </p>
          ) : null}
          {showOfficeForm ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={officeFields.name} onChange={(event) => setOfficeFields((current) => ({ ...current, name: event.target.value }))} placeholder="Όνομα γραφείου" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input value={officeFields.address} onChange={(event) => setOfficeFields((current) => ({ ...current, address: event.target.value }))} placeholder="Διεύθυνση" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea value={officeFields.notes} onChange={(event) => setOfficeFields((current) => ({ ...current, notes: event.target.value }))} placeholder="Σημειώσεις" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
              <button type="button" disabled={isSavingOffice} onClick={() => void handleCreateOffice()} className="justify-self-start rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {isSavingOffice ? "Αποθήκευση..." : "Αποθήκευση γραφείου"}
              </button>
            </div>
          ) : null}
          {availableOffices.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableOffices.map((office) => (
                <span key={office.id} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700">
                  {office.name}
                  <button type="button" onClick={() => void handleDeactivateOffice(office.id)} className="font-semibold text-red-700">
                    Απενεργοποίηση
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {isTransportExpense ? (
        <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-blue-950">Οχήματα</h3>
              <p className="mt-1 text-xs text-blue-800">
                Τα αποθηκευμένα οχήματα παραμένουν διαθέσιμα και σε μελλοντικούς μήνες.
              </p>
            </div>
            <button type="button" onClick={() => setShowVehicleForm((value) => !value)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-900">
              + Προσθήκη νέου οχήματος
            </button>
          </div>
          {vehicleState.message ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {vehicleState.message}
            </p>
          ) : null}
          {showVehicleForm ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={vehicleFields.name} onChange={(event) => setVehicleFields((current) => ({ ...current, name: event.target.value }))} placeholder="Όνομα οχήματος" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input value={vehicleFields.plateNumber} onChange={(event) => setVehicleFields((current) => ({ ...current, plateNumber: event.target.value }))} placeholder="Πινακίδα" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input value={vehicleFields.model} onChange={(event) => setVehicleFields((current) => ({ ...current, model: event.target.value }))} placeholder="Μάρκα/Μοντέλο" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea value={vehicleFields.notes} onChange={(event) => setVehicleFields((current) => ({ ...current, notes: event.target.value }))} placeholder="Σημειώσεις" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
              <button type="button" disabled={isSavingVehicle} onClick={() => void handleCreateVehicle()} className="justify-self-start rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {isSavingVehicle ? "Αποθήκευση..." : "Αποθήκευση οχήματος"}
              </button>
            </div>
          ) : null}
          {availableVehicles.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableVehicles.map((vehicle) => (
                <span key={vehicle.id} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700">
                  {vehicle.name}
                  {vehicle.plate_number ? ` (${vehicle.plate_number})` : ""}
                  <button type="button" onClick={() => void handleDeactivateVehicle(vehicle.id)} className="font-semibold text-red-700">
                    Απενεργοποίηση
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Περιγραφή
        <textarea
          name="description"
          defaultValue={expense?.description ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={expense?.notes ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || isComingSoon}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
