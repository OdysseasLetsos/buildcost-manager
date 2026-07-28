"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import { createSupplier } from "../actions/create-supplier";
import { updateSupplierContact } from "../actions/update-supplier-contact";
import type {
  Material,
  MaterialActionState,
  Supplier,
  SupplierActionState,
} from "../types";
import { initialMaterialActionState } from "../types";

type MaterialFormAction = (
  previousState: MaterialActionState,
  formData: FormData,
) => Promise<MaterialActionState>;

const DEFAULT_VAT_RATE = 0.24;

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function supplierDisplayName(supplier: Supplier): string {
  return `${supplier.name} - ${supplier.tax_id}`;
}

function parseAmount(value: string): number {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function formatAmount(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function calculateVatFromNet(value: string): string {
  return value.trim() ? formatAmount(parseAmount(value) * DEFAULT_VAT_RATE) : "";
}

function getMonthBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    min: `${monthKey}-01`,
    max: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function MaterialForm({
  action,
  material,
  monthlyPeriods,
  projects,
  suppliers,
  canCreateSuppliers,
  defaultMonthId,
  submitLabel,
  onSuccess,
}: Readonly<{
  action: MaterialFormAction;
  material?: Material;
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  suppliers: Supplier[];
  canCreateSuppliers: boolean;
  defaultMonthId: string;
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialMaterialActionState,
  );
  const initialSupplier =
    suppliers.find((supplier) => supplier.id === material?.supplier_id) ??
    suppliers.find(
      (supplier) =>
        material?.supplier_vat &&
        supplier.tax_id.trim() === material.supplier_vat.trim(),
    ) ??
    null;
  const [availableSuppliers, setAvailableSuppliers] = useState(suppliers);
  const [selectedMonthId, setSelectedMonthId] = useState(
    material?.month_id ?? defaultMonthId,
  );
  const selectedMonth = monthlyPeriods.find(
    (period) => period.id === selectedMonthId,
  );
  const selectedMonthBounds = selectedMonth
    ? getMonthBounds(selectedMonth.month_key)
    : null;
  const [invoiceDate, setInvoiceDate] = useState(
    material?.invoice_date ?? selectedMonthBounds?.min ?? "",
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    initialSupplier?.id ?? "",
  );
  const [supplierName, setSupplierName] = useState(
    initialSupplier?.name ?? material?.supplier_name ?? "",
  );
  const [supplierVat, setSupplierVat] = useState(
    initialSupplier?.tax_id ?? material?.supplier_vat ?? "",
  );
  const [supplierAddress, setSupplierAddress] = useState(
    initialSupplier?.address ?? "",
  );
  const [supplierPhone, setSupplierPhone] = useState(initialSupplier?.phone ?? "");
  const [supplierEmail, setSupplierEmail] = useState(initialSupplier?.email ?? "");
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplierFields, setNewSupplierFields] = useState({
    name: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [supplierState, setSupplierState] = useState<SupplierActionState>({
    ok: false,
  });
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isUpdatingSupplier, setIsUpdatingSupplier] = useState(false);
  const [netAmount, setNetAmount] = useState(decimalValue(material?.net_amount));
  const [vatAmount, setVatAmount] = useState(decimalValue(material?.vat_amount));
  const [isVatManuallyOverridden, setIsVatManuallyOverridden] = useState(() => {
    if (!material) return false;

    return (
      Math.abs(
        Number(material.vat_amount) -
          Number(formatAmount(Number(material.net_amount) * DEFAULT_VAT_RATE)),
      ) > 0.01
    );
  });
  const totalAmount = formatAmount(parseAmount(netAmount) + parseAmount(vatAmount));
  const selectedSupplier = useMemo(
    () =>
      availableSuppliers.find((supplier) => supplier.id === selectedSupplierId) ??
      null,
    [availableSuppliers, selectedSupplierId],
  );
  const supplierDetailsChanged = Boolean(
    selectedSupplier &&
      (supplierAddress.trim() !== (selectedSupplier.address ?? "") ||
        supplierPhone.trim() !== (selectedSupplier.phone ?? "") ||
        supplierEmail.trim() !== (selectedSupplier.email ?? "")),
  );

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [onSuccess, state.ok]);

  function selectSupplier(supplier: Supplier | null) {
    setSelectedSupplierId(supplier?.id ?? "");
    setSupplierName(supplier?.name ?? "");
    setSupplierVat(supplier?.tax_id ?? "");
    setSupplierAddress(supplier?.address ?? "");
    setSupplierPhone(supplier?.phone ?? "");
    setSupplierEmail(supplier?.email ?? "");
  }

  async function handleSaveSupplier(formData: FormData) {
    setIsSavingSupplier(true);
    const result = await createSupplier(formData);
    setSupplierState(result);
    setIsSavingSupplier(false);

    const supplier = result.supplier ?? result.existingSupplier;
    if (supplier) {
      setAvailableSuppliers((current) =>
        current.some((item) => item.id === supplier.id)
          ? current
          : [...current, supplier].sort((left, right) =>
              left.name.localeCompare(right.name, "el"),
            ),
      );
      selectSupplier(supplier);
      setNewSupplierFields({
        name: "",
        taxId: "",
        address: "",
        phone: "",
        email: "",
        notes: "",
      });
      setShowNewSupplierForm(false);
    }
  }

  async function handleUpdateSupplierContact() {
    if (!selectedSupplierId) return;

    setIsUpdatingSupplier(true);
    const data = new FormData();
    data.set("id", selectedSupplierId);
    data.set("address", supplierAddress);
    data.set("phone", supplierPhone);
    data.set("email", supplierEmail);
    const result = await updateSupplierContact(data);
    setSupplierState(result);
    setIsUpdatingSupplier(false);

    if (result.supplier) {
      const updatedSupplier = result.supplier;
      setAvailableSuppliers((current) =>
        current
          .map((supplier) =>
            supplier.id === updatedSupplier.id ? updatedSupplier : supplier,
          )
          .sort((left, right) => left.name.localeCompare(right.name, "el")),
      );
      selectSupplier(updatedSupplier);
    }
  }

  function handleMonthChange(monthId: string) {
    setSelectedMonthId(monthId);
    const period = monthlyPeriods.find((item) => item.id === monthId);

    if (!period) return;

    const bounds = getMonthBounds(period.month_key);
    setInvoiceDate((currentDate) =>
      currentDate >= bounds.min && currentDate <= bounds.max
        ? currentDate
        : bounds.min,
    );
  }

  function handleNetAmountChange(value: string) {
    setNetAmount(value);

    if (!isVatManuallyOverridden) {
      setVatAmount(calculateVatFromNet(value));
    }
  }

  function handleVatAmountChange(value: string) {
    setVatAmount(value);
    setIsVatManuallyOverridden(true);
  }

  function resetAutomaticVat() {
    setIsVatManuallyOverridden(false);
    setVatAmount(calculateVatFromNet(netAmount));
  }

  return (
    <form action={formAction} className="grid gap-4">
      {material ? <input type="hidden" name="id" value={material.id} /> : null}
      <input type="hidden" name="supplierId" value={selectedSupplierId} />
      <input type="hidden" name="supplierName" value={supplierName} />
      <input type="hidden" name="supplierVat" value={supplierVat} />

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
            name="monthId"
            value={selectedMonthId}
            onChange={(event) => handleMonthChange(event.target.value)}
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
          Ημερομηνία Τιμολογίου
          <input
            name="invoiceDate"
            type="date"
            value={invoiceDate}
            onChange={(event) => setInvoiceDate(event.target.value)}
            min={selectedMonthBounds?.min}
            max={selectedMonthBounds?.max}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Έργο
          <select
            name="projectId"
            defaultValue={material?.project_id ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Επιλέξτε έργο</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-950">Προμηθευτής</h3>
            <p className="mt-1 text-xs text-blue-800">
              Επιλέξτε υπάρχοντα προμηθευτή ή προσθέστε νέο χωρίς να φύγετε από
              το τιμολόγιο.
            </p>
          </div>
          {canCreateSuppliers ? (
            <button
              type="button"
              onClick={() => {
                setSupplierState({ ok: false });
                setShowNewSupplierForm((value) => !value);
              }}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-900 transition hover:bg-blue-50"
            >
              + Προσθήκη νέου προμηθευτή
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Επιλογή προμηθευτή
            <select
              value={selectedSupplierId}
              onChange={(event) => {
                const supplier =
                  availableSuppliers.find((item) => item.id === event.target.value) ??
                  null;
                selectSupplier(supplier);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Επιλέξτε προμηθευτή</option>
              {availableSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplierDisplayName(supplier)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Επωνυμία Προμηθευτή
            <input
              value={supplierName}
              onChange={(event) => {
                setSelectedSupplierId("");
                setSupplierName(event.target.value);
              }}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            ΑΦΜ
            <input
              value={supplierVat}
              onChange={(event) => {
                setSelectedSupplierId("");
                setSupplierVat(event.target.value);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Διεύθυνση
            <input
              value={supplierAddress ?? ""}
              onChange={(event) => setSupplierAddress(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Τηλέφωνο
            <input
              value={supplierPhone ?? ""}
              onChange={(event) => setSupplierPhone(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              value={supplierEmail ?? ""}
              onChange={(event) => setSupplierEmail(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
        </div>

        {supplierDetailsChanged && canCreateSuppliers ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>
              Έχετε αλλάξει στοιχεία επικοινωνίας του επιλεγμένου προμηθευτή.
              Η αλλαγή δεν αποθηκεύεται αυτόματα στο μητρώο προμηθευτών.
            </p>
            <button
              type="button"
              disabled={isUpdatingSupplier}
              onClick={() => void handleUpdateSupplierContact()}
              className="mt-3 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isUpdatingSupplier
                ? "Ενημέρωση..."
                : "Ενημέρωση στοιχείων προμηθευτή"}
            </button>
          </div>
        ) : null}

        {showNewSupplierForm ? (
          <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4">
            {supplierState.message ? (
              <p
                className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                  supplierState.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {supplierState.message}
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Επωνυμία Προμηθευτή *
                <input
                  value={newSupplierFields.name}
                  onChange={(event) =>
                    setNewSupplierFields((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                {supplierState.fieldErrors?.name ? (
                  <span className="text-xs text-red-700">
                    {supplierState.fieldErrors.name}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                ΑΦΜ *
                <input
                  value={newSupplierFields.taxId}
                  onChange={(event) =>
                    setNewSupplierFields((current) => ({
                      ...current,
                      taxId: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                {supplierState.fieldErrors?.taxId ? (
                  <span className="text-xs text-red-700">
                    {supplierState.fieldErrors.taxId}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Διεύθυνση
                <input
                  value={newSupplierFields.address}
                  onChange={(event) =>
                    setNewSupplierFields((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Τηλέφωνο
                <input
                  value={newSupplierFields.phone}
                  onChange={(event) =>
                    setNewSupplierFields((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  value={newSupplierFields.email}
                  onChange={(event) =>
                    setNewSupplierFields((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Σημειώσεις
                <textarea
                  value={newSupplierFields.notes}
                  onChange={(event) =>
                    setNewSupplierFields((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={2}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSavingSupplier}
                onClick={() => {
                  const data = new FormData();
                  data.set("name", newSupplierFields.name.trim());
                  data.set("taxId", newSupplierFields.taxId.trim());
                  data.set("address", newSupplierFields.address);
                  data.set("phone", newSupplierFields.phone);
                  data.set("email", newSupplierFields.email);
                  data.set("notes", newSupplierFields.notes);
                  void handleSaveSupplier(data);
                }}
                className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingSupplier
                  ? "Αποθήκευση..."
                  : "Αποθήκευση προμηθευτή"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewSupplierForm(false);
                  setSupplierState({ ok: false });
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Ακύρωση
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Αριθμός Τιμολογίου
          <input
            name="invoiceNumber"
            defaultValue={material?.invoice_number ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Καθαρή Αξία
          <input
            name="netAmount"
            type="number"
            min="0"
            step="0.01"
            value={netAmount}
            onChange={(event) => handleNetAmountChange(event.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>ΦΠΑ</span>
            <span className="text-xs font-medium text-blue-700">
              {isVatManuallyOverridden
                ? "Χειροκίνητη τιμή ΦΠΑ"
                : "Αυτόματος υπολογισμός ΦΠΑ 24%"}
            </span>
          </span>
          <input
            name="vatAmount"
            type="number"
            min="0"
            step="0.01"
            value={vatAmount}
            onChange={(event) => handleVatAmountChange(event.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          {isVatManuallyOverridden ? (
            <button
              type="button"
              onClick={resetAutomaticVat}
              className="self-start text-xs font-semibold text-blue-800 underline-offset-4 hover:underline"
            >
              Επαναφορά αυτόματου ΦΠΑ
            </button>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Σύνολο
          <input
            name="totalAmount"
            type="number"
            min="0"
            step="0.01"
            value={totalAmount}
            readOnly
            required
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση Πληρωμής
          <select
            name="paymentStatus"
            defaultValue={material?.payment_status ?? "pending"}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="pending">Εκκρεμεί</option>
            <option value="paid">Πληρωμένο</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Περιγραφή
        <textarea
          name="description"
          defaultValue={material?.description ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={material?.notes ?? ""}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
