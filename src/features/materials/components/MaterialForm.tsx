"use client";

import { useActionState, useEffect, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import { createSupplier } from "../actions/create-supplier";
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

function decimalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function supplierDisplayName(supplier: Supplier): string {
  return `${supplier.name} - ${supplier.tax_id}`;
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
  const [supplierState, setSupplierState] = useState<SupplierActionState>({
    ok: false,
  });
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

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
      setShowNewSupplierForm(false);
    }
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
            defaultValue={material?.month_id ?? defaultMonthId}
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
            defaultValue={material?.invoice_date ?? ""}
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
              readOnly
              className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-slate-600"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Τηλέφωνο
            <input
              value={supplierPhone ?? ""}
              readOnly
              className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-slate-600"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              value={supplierEmail ?? ""}
              readOnly
              className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-slate-600"
            />
          </label>
        </div>

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
                  name="newSupplierName"
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
                  name="newSupplierTaxId"
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
                  name="newSupplierAddress"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Τηλέφωνο
                <input
                  name="newSupplierPhone"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  name="newSupplierEmail"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Σημειώσεις
                <textarea
                  name="newSupplierNotes"
                  rows={2}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSavingSupplier}
                onClick={(event) => {
                  const section = event.currentTarget.closest("div");
                  const root = section?.parentElement;
                  const data = new FormData();
                  data.set(
                    "name",
                    (
                      root?.querySelector<HTMLInputElement>(
                        'input[name="newSupplierName"]',
                      )?.value ?? ""
                    ).trim(),
                  );
                  data.set(
                    "taxId",
                    (
                      root?.querySelector<HTMLInputElement>(
                        'input[name="newSupplierTaxId"]',
                      )?.value ?? ""
                    ).trim(),
                  );
                  data.set(
                    "address",
                    root?.querySelector<HTMLInputElement>(
                      'input[name="newSupplierAddress"]',
                    )?.value ?? "",
                  );
                  data.set(
                    "phone",
                    root?.querySelector<HTMLInputElement>(
                      'input[name="newSupplierPhone"]',
                    )?.value ?? "",
                  );
                  data.set(
                    "email",
                    root?.querySelector<HTMLInputElement>(
                      'input[name="newSupplierEmail"]',
                    )?.value ?? "",
                  );
                  data.set(
                    "notes",
                    root?.querySelector<HTMLTextAreaElement>(
                      'textarea[name="newSupplierNotes"]',
                    )?.value ?? "",
                  );
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
            defaultValue={decimalValue(material?.net_amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          ΦΠΑ
          <input
            name="vatAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={decimalValue(material?.vat_amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Σύνολο
          <input
            name="totalAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={decimalValue(material?.total_amount)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
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
