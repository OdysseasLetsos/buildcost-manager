"use client";

import { Fragment, useActionState, useState } from "react";
import { deleteMaterial } from "../actions/delete-material";
import type { MaterialWithRelations } from "../types";
import { initialMaterialActionState } from "../types";
import { MaterialPaymentStatusBadge } from "./MaterialPaymentStatusBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeleteMaterialButton({ materialId }: Readonly<{ materialId: string }>) {
  const [, formAction, isPending] = useActionState(deleteMaterial, initialMaterialActionState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Θέλετε σίγουρα να διαγράψετε αυτό το τιμολόγιο υλικών;")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={materialId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        Διαγραφή
      </button>
    </form>
  );
}

function DetailItem({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value?.trim() ? value : "-"}</dd>
    </div>
  );
}

export function MaterialsTable({
  materials,
  canManage,
  lockedMonthIds = [],
  onEditMaterial,
}: Readonly<{
  materials: MaterialWithRelations[];
  canManage: boolean;
  lockedMonthIds?: string[];
  onEditMaterial: (material: MaterialWithRelations) => void;
}>) {
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const lockedMonthSet = new Set(lockedMonthIds);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-28 whitespace-nowrap px-3 py-3">Ημερομηνία</th>
              <th className="w-44 px-3 py-3">Έργο</th>
              <th className="w-40 px-3 py-3">Προμηθευτής</th>
              <th className="w-32 whitespace-nowrap px-3 py-3">Τιμολόγιο</th>
              <th className="w-28 whitespace-nowrap px-3 py-3 text-right">Καθαρή Αξία</th>
              <th className="w-24 whitespace-nowrap px-3 py-3 text-right">ΦΠΑ</th>
              <th className="w-28 whitespace-nowrap px-3 py-3 text-right">Σύνολο</th>
              <th className="w-28 whitespace-nowrap px-3 py-3">Κατάσταση</th>
              <th className="sticky right-0 z-10 w-44 whitespace-nowrap bg-slate-50 px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                Ενέργειες
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((material) => {
              const isExpanded = expandedMaterialId === material.id;
              const isLocked = lockedMonthSet.has(material.month_id);
              const canManageRow = canManage && !isLocked;

              return (
                <Fragment key={material.id}>
                  <tr className="align-top">
                    <td className="whitespace-nowrap px-3 py-3">{material.invoice_date}</td>
                    <td className="px-3 py-3 font-medium text-slate-950">
                      <div className="truncate" title={`${material.projectCode} - ${material.projectName}`}>
                        {material.projectCode} - {material.projectName}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="truncate" title={material.supplier_name}>
                        {material.supplier_name}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="truncate" title={material.invoice_number}>
                        {material.invoice_number}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {currencyFormatter.format(material.net_amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {currencyFormatter.format(material.vat_amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
                      {currencyFormatter.format(material.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <MaterialPaymentStatusBadge status={material.payment_status} />
                    </td>
                    <td className="sticky right-0 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedMaterialId(isExpanded ? null : material.id)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {isExpanded ? "Κλείσιμο" : "Λεπτομέρειες"}
                        </button>
                        {canManageRow ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditMaterial(material)}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Επεξ.
                            </button>
                            <DeleteMaterialButton materialId={material.id} />
                          </>
                        ) : isLocked && canManage ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                            Κλειδωμένος
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr>
                      <td colSpan={9} className="bg-slate-50 px-4 py-4">
                        <dl className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
                          <DetailItem label="Περιγραφή" value={material.description} />
                          <DetailItem label="Σημειώσεις" value={material.notes} />
                          <DetailItem label="ΑΦΜ Προμηθευτή" value={material.supplier_vat} />
                          <DetailItem label="Δημιουργήθηκε" value={material.created_at} />
                          <DetailItem label="Ενημερώθηκε" value={material.updated_at} />
                        </dl>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {materials.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Δεν υπάρχουν τιμολόγια υλικών για τα επιλεγμένα φίλτρα.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
