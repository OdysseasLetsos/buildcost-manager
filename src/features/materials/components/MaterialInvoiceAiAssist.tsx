"use client";

import { useMemo, useState } from "react";
import {
  approveInvoiceReview,
  rejectInvoiceReview,
  saveInvoiceReviewCorrections,
} from "@/src/features/ai-invoices/actions/review-invoice";
import { runInvoiceExtraction } from "@/src/features/ai-invoices/actions/run-invoice-extraction";
import { uploadInvoiceDocument } from "@/src/features/ai-invoices/actions/upload-invoice-document";
import type {
  ExtractedInvoicePayload,
  InvoiceDocumentListItem,
} from "@/src/features/ai-invoices/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import type { Supplier } from "../types";

const supportedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const maxFileSizeBytes = 10 * 1024 * 1024;
const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const targetTypeLabels: Record<string, string> = {
  material: "Υλικό",
  expense: "Έξοδο",
  revenue: "Έσοδο",
  unknown: "Άγνωστο",
};

const reviewStatusLabels: Record<string, string> = {
  pending_review: "Προς έλεγχο",
  corrected: "Διορθωμένο",
  approved: "Εγκρίθηκε",
  rejected: "Απορρίφθηκε",
};

type ReviewDraft = {
  targetType: "material" | "expense" | "revenue";
  monthId: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  supplierVat: string;
  invoiceNumber: string;
  invoiceDate: string;
  netAmount: string;
  vatAmount: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: "pending" | "partial" | "paid";
  description: string;
  notes: string;
  expenseCategory: string;
  expenseSubtype: string;
  allocationMethod:
    | "by_project_hours"
    | "by_project_revenue"
    | "equal_per_active_project"
    | "manual";
  clientName: string;
  revenueType: "invoice" | "advance" | "payment" | "credit";
  paymentMethod: "bank" | "cash" | "other";
  status: "pending" | "partial" | "paid" | "cancelled";
  rejectionReason: string;
};

type MaterialInvoiceAiAssistProps = {
  roleAllowed: boolean;
  featureAvailable: boolean;
  selectedMonthKey: string;
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  suppliers: Supplier[];
  reviewItems: InvoiceDocumentListItem[];
  onApplyExtraction: (payload: ExtractedInvoicePayload) => void;
};

function formatAmount(value: number | null | undefined): string {
  return value == null ? "-" : currencyFormatter.format(value);
}

function decimalValue(value: number | null | undefined): string {
  return value == null ? "0" : String(value);
}

function lineItemDescription(extracted: InvoiceDocumentListItem["extractedInvoice"]) {
  if (!extracted || !Array.isArray(extracted.line_items)) return "";

  return extracted.line_items
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        "description" in item &&
        typeof item.description === "string"
      ) {
        return item.description;
      }

      return null;
    })
    .filter((item): item is string => Boolean(item))
    .join("\n");
}

function getDefaultMonthId(
  monthlyPeriods: MonthlyPeriod[],
  selectedMonthKey: string,
  invoiceDate?: string | null,
): string {
  const invoiceMonthKey = invoiceDate?.slice(0, 7);
  return (
    monthlyPeriods.find((period) => period.month_key === invoiceMonthKey)?.id ??
    monthlyPeriods.find((period) => period.month_key === selectedMonthKey)?.id ??
    monthlyPeriods[0]?.id ??
    ""
  );
}

function buildDraft(
  document: InvoiceDocumentListItem,
  monthlyPeriods: MonthlyPeriod[],
  projects: Project[],
  suppliers: Supplier[],
  selectedMonthKey: string,
): ReviewDraft {
  const extracted = document.extractedInvoice;
  const supplierVat = extracted?.supplier_vat?.trim() ?? "";
  const matchedSupplier =
    suppliers.find((supplier) => supplier.tax_id.trim() === supplierVat) ?? null;
  const targetType =
    extracted?.target_type_suggestion === "expense" ||
    extracted?.target_type_suggestion === "revenue"
      ? extracted.target_type_suggestion
      : "material";
  const projectId =
    projects.some((project) => project.id === extracted?.project_suggestion_id)
      ? extracted?.project_suggestion_id ?? ""
      : "";
  const extractedDescription =
    lineItemDescription(extracted) || extracted?.category_suggestion || "";

  return {
    targetType,
    monthId: getDefaultMonthId(
      monthlyPeriods,
      selectedMonthKey,
      extracted?.invoice_date,
    ),
    projectId,
    supplierId: matchedSupplier?.id ?? "",
    supplierName: extracted?.supplier_name ?? matchedSupplier?.name ?? "",
    supplierVat,
    invoiceNumber: extracted?.invoice_number ?? "",
    invoiceDate: extracted?.invoice_date ?? "",
    netAmount: decimalValue(extracted?.net_amount),
    vatAmount: decimalValue(extracted?.vat_amount),
    totalAmount: decimalValue(extracted?.total_amount),
    paidAmount: "0",
    paymentStatus: "pending",
    description: extractedDescription,
    notes: extractedDescription,
    expenseCategory: "other",
    expenseSubtype: "",
    allocationMethod: "by_project_hours",
    clientName:
      projects.find((project) => project.id === projectId)?.client_name ??
      extracted?.supplier_name ??
      "",
    revenueType: "invoice",
    paymentMethod: "bank",
    status: "pending",
    rejectionReason: "",
  };
}

function appendDraftFormData(
  data: FormData,
  reviewId: string,
  draft: ReviewDraft,
) {
  data.set("reviewId", reviewId);
  data.set("targetType", draft.targetType);
  data.set("monthId", draft.monthId);
  data.set("projectId", draft.projectId);
  data.set("supplierId", draft.supplierId);
  data.set("supplierName", draft.supplierName);
  data.set("supplierVat", draft.supplierVat);
  data.set("invoiceNumber", draft.invoiceNumber);
  data.set("invoiceDate", draft.invoiceDate);
  data.set("netAmount", draft.netAmount);
  data.set("vatAmount", draft.vatAmount);
  data.set("totalAmount", draft.totalAmount);
  data.set("paidAmount", draft.paidAmount);
  data.set("paymentStatus", draft.paymentStatus);
  data.set("description", draft.description);
  data.set("notes", draft.notes);
  data.set("expenseCategory", draft.expenseCategory);
  data.set("expenseSubtype", draft.expenseSubtype);
  data.set("allocationMethod", draft.allocationMethod);
  data.set("clientName", draft.clientName);
  data.set("revenueType", draft.revenueType);
  data.set("paymentMethod", draft.paymentMethod);
  data.set("status", draft.status);
}

function inputClassName() {
  return "rounded-lg border border-slate-300 px-3 py-2";
}

export function MaterialInvoiceAiAssist({
  roleAllowed,
  featureAvailable,
  selectedMonthKey,
  monthlyPeriods,
  projects,
  suppliers,
  reviewItems,
  onApplyExtraction,
}: Readonly<MaterialInvoiceAiAssistProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">(
    "info",
  );
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openedReviewId, setOpenedReviewId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [isSavingCorrections, setIsSavingCorrections] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const pendingReviewItems = useMemo(
    () =>
      reviewItems.filter((item) =>
        ["pending_review", "corrected"].includes(
          item.reviewQueueItem?.status ?? "",
        ),
      ),
    [reviewItems],
  );
  const openedReview =
    pendingReviewItems.find(
      (item) => item.reviewQueueItem?.id === openedReviewId,
    ) ?? null;
  const openedReviewWarnings = Array.isArray(openedReview?.extractedInvoice?.warnings)
    ? openedReview.extractedInvoice.warnings.filter(
        (warning): warning is string => typeof warning === "string",
      )
    : [];
  const selectedProject = projects.find(
    (project) => project.id === draft?.projectId,
  );
  const supplierVat = draft?.supplierVat.trim();
  const matchedSupplierByVat = supplierVat
    ? suppliers.some((supplier) => supplier.tax_id.trim() === supplierVat)
    : true;

  if (!roleAllowed) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
        Δεν έχετε δικαίωμα πρόσβασης στα AI Τιμολόγια.
      </section>
    );
  }

  if (!featureAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        Η λειτουργία AI Τιμολογίων δεν είναι ενεργή στο πλάνο της εταιρείας.
      </section>
    );
  }

  function validateFile(nextFile: File): string | null {
    if (!supportedMimeTypes.includes(nextFile.type)) {
      return "Ο τύπος αρχείου δεν υποστηρίζεται.";
    }

    if (nextFile.size > maxFileSizeBytes) {
      return "Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10MB.";
    }

    return null;
  }

  async function handleUpload() {
    if (!file) {
      setMessage("Ανεβάστε πρώτα ένα τιμολόγιο.");
      setMessageTone("error");
      return;
    }

    const validationMessage = validateFile(file);
    if (validationMessage) {
      setMessage(validationMessage);
      setMessageTone("error");
      return;
    }

    setIsUploading(true);
    setMessage("Ανέβασμα τιμολογίου...");
    setMessageTone("info");
    setWarnings([]);

    const formData = new FormData();
    formData.set("invoiceFile", file);
    formData.set("selectedMonthKey", selectedMonthKey);

    const result = await uploadInvoiceDocument(undefined, formData);
    setIsUploading(false);

    if (!result.ok || !result.documentId) {
      setDocumentId(null);
      setMessage(result.message ?? "Δεν ήταν δυνατή η αποθήκευση του αρχείου.");
      setMessageTone("error");
      return;
    }

    setDocumentId(result.documentId);
    setMessage("Το τιμολόγιο ανέβηκε επιτυχώς.");
    setMessageTone("success");
  }

  async function handleAnalyze() {
    if (!documentId) {
      setMessage("Ανεβάστε πρώτα ένα τιμολόγιο.");
      setMessageTone("error");
      return;
    }

    setIsAnalyzing(true);
    setMessage("Γίνεται AI ανάλυση...");
    setMessageTone("info");

    const result = await runInvoiceExtraction(documentId);
    setIsAnalyzing(false);

    if (!result.ok || !result.extractedInvoice) {
      setMessage("Δεν ήταν δυνατή η AI ανάλυση του τιμολογίου.");
      setMessageTone("error");
      return;
    }

    onApplyExtraction(result.extractedInvoice);
    const extractedSupplierVat = result.extractedInvoice.supplier_vat?.trim();
    const matchedSupplier = extractedSupplierVat
      ? suppliers.some((supplier) => supplier.tax_id.trim() === extractedSupplierVat)
      : true;
    setWarnings(
      [
        "Mock ανάλυση",
        ...result.extractedInvoice.warnings,
        matchedSupplier
          ? null
          : "Δεν βρέθηκε αποθηκευμένος προμηθευτής με αυτό το ΑΦΜ. Προσθέστε ή επιλέξτε προμηθευτή πριν την αποθήκευση.",
      ].filter((item): item is string => Boolean(item)),
    );
    setMessage(
      "Η φόρμα προσυμπληρώθηκε από την AI ανάλυση. Τα στοιχεία είναι προσυμπληρωμένα και μπορείτε να τα διορθώσετε πριν την αποθήκευση.",
    );
    setMessageTone("success");
  }

  function openReview(document: InvoiceDocumentListItem) {
    setOpenedReviewId(document.reviewQueueItem?.id ?? null);
    setDraft(
      buildDraft(document, monthlyPeriods, projects, suppliers, selectedMonthKey),
    );
    setMessage(null);
    setWarnings([]);
  }

  async function handleSaveCorrections() {
    if (!openedReviewId || !draft) return;

    setIsSavingCorrections(true);
    const formData = new FormData();
    appendDraftFormData(formData, openedReviewId, draft);
    const result = await saveInvoiceReviewCorrections(formData);
    setIsSavingCorrections(false);
    setMessage(result.message ?? "Οι διορθώσεις αποθηκεύτηκαν.");
    setMessageTone(result.ok ? "success" : "error");
  }

  async function handleApprove() {
    if (!openedReviewId || !draft) return;

    setIsApproving(true);
    setMessage("Γίνεται έγκριση τιμολογίου...");
    setMessageTone("info");
    const formData = new FormData();
    appendDraftFormData(formData, openedReviewId, draft);
    const result = await approveInvoiceReview(formData);
    setIsApproving(false);
    setMessage(result.message ?? "Το τιμολόγιο εγκρίθηκε και καταχωρήθηκε.");
    setMessageTone(result.ok ? "success" : "error");

    if (result.ok) {
      setOpenedReviewId(null);
      setDraft(null);
    }
  }

  async function handleReject() {
    if (!openedReviewId || !draft) return;

    setIsRejecting(true);
    setMessage("Γίνεται απόρριψη τιμολογίου...");
    setMessageTone("info");
    const formData = new FormData();
    formData.set("reviewId", openedReviewId);
    formData.set("rejectionReason", draft.rejectionReason);
    const result = await rejectInvoiceReview(formData);
    setIsRejecting(false);
    setMessage(result.message ?? "Το τιμολόγιο απορρίφθηκε.");
    setMessageTone(result.ok ? "success" : "error");

    if (result.ok) {
      setOpenedReviewId(null);
      setDraft(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-950">
            Upload τιμολογίου
          </h3>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Ανέβασε αρχείο τιμολογίου για αυτόματη προσυμπλήρωση της φόρμας.
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            PDF, JPG, PNG ή WEBP έως 10MB
          </p>
        </div>
        <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
          Mock ανάλυση
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setFile(nextFile);
            setDocumentId(null);
            setWarnings([]);
            setMessage(null);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        <button
          type="button"
          disabled={isUploading || !file}
          onClick={() => void handleUpload()}
          className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Ανέβασμα τιμολογίου..." : "Upload"}
        </button>
        <button
          type="button"
          disabled={isAnalyzing || !documentId}
          onClick={() => void handleAnalyze()}
          className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          title={!documentId ? "Ανεβάστε πρώτα ένα τιμολόγιο." : undefined}
        >
          {isAnalyzing ? "Γίνεται AI ανάλυση..." : "AI Ανάλυση"}
        </button>
      </div>

      {!documentId ? (
        <p className="text-xs font-medium text-slate-500">
          Ανεβάστε πρώτα ένα τιμολόγιο.
        </p>
      ) : null}

      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : messageTone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-white text-blue-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Προς Έλεγχο</h3>
            <p className="text-xs text-slate-500">
              Η τελική καταχώρηση γίνεται μόνο μετά από Έγκριση.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {pendingReviewItems.length}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {pendingReviewItems.map((document) => (
            <div
              key={document.id}
              className="grid gap-3 rounded-xl border border-slate-200 p-3 text-sm lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">
                  {document.original_file_name}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(document.created_at).toLocaleDateString("el-GR")}
                </p>
              </div>
              <div className="text-slate-700">
                <p>
                  <span className="font-medium">Προμηθευτής:</span>{" "}
                  {document.extractedInvoice?.supplier_name ?? "-"}
                </p>
                <p>
                  <span className="font-medium">ΑΦΜ:</span>{" "}
                  {document.extractedInvoice?.supplier_vat ?? "-"}
                </p>
              </div>
              <div className="text-slate-700">
                <p>
                  <span className="font-medium">Αριθμός τιμολογίου:</span>{" "}
                  {document.extractedInvoice?.invoice_number ?? "-"}
                </p>
                <p>
                  <span className="font-medium">Σύνολο:</span>{" "}
                  {formatAmount(document.extractedInvoice?.total_amount)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                  {targetTypeLabels[
                    document.extractedInvoice?.target_type_suggestion ?? "unknown"
                  ] ?? "-"}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {reviewStatusLabels[document.reviewQueueItem?.status ?? ""] ??
                    "Κατάσταση"}
                </span>
                <button
                  type="button"
                  onClick={() => openReview(document)}
                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-900 transition hover:bg-blue-50"
                >
                  Άνοιγμα ελέγχου
                </button>
              </div>
            </div>
          ))}
          {pendingReviewItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Δεν υπάρχουν τιμολόγια προς έλεγχο.
            </p>
          ) : null}
        </div>
      </section>

      {openedReview && draft ? (
        <section className="rounded-2xl border border-blue-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Διόρθωση στοιχείων
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Ελέγξτε τα στοιχεία πριν από την τελική έγκριση.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpenedReviewId(null);
                setDraft(null);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Κλείσιμο
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Τύπος καταχώρησης
              <select
                value={draft.targetType}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          targetType: event.target.value as ReviewDraft["targetType"],
                        }
                      : current,
                  )
                }
                className={inputClassName()}
              >
                <option value="material">Υλικό</option>
                <option value="expense">Έξοδο</option>
                <option value="revenue">Έσοδο</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Μήνας
              <select
                value={draft.monthId}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, monthId: event.target.value } : current,
                  )
                }
                className={inputClassName()}
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
                type="date"
                value={draft.invoiceDate}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, invoiceDate: event.target.value }
                      : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Έργο
              <select
                value={draft.projectId}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          projectId: event.target.value,
                          clientName:
                            projects.find(
                              (project) => project.id === event.target.value,
                            )?.client_name ?? current.clientName,
                        }
                      : current,
                  )
                }
                className={inputClassName()}
              >
                <option value="">Επιλέξτε έργο</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
              {selectedProject?.client_name ? (
                <span className="text-xs text-slate-500">
                  Πελάτης έργου: {selectedProject.client_name}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Προμηθευτής
              <select
                value={draft.supplierId}
                onChange={(event) => {
                  const supplier =
                    suppliers.find((item) => item.id === event.target.value) ?? null;
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          supplierId: supplier?.id ?? "",
                          supplierName: supplier?.name ?? current.supplierName,
                          supplierVat: supplier?.tax_id ?? current.supplierVat,
                        }
                      : current,
                  );
                }}
                className={inputClassName()}
              >
                <option value="">Επιλέξτε προμηθευτή</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.tax_id}
                  </option>
                ))}
              </select>
              {draft.targetType === "material" && !matchedSupplierByVat ? (
                <span className="text-xs font-medium text-amber-700">
                  Δεν βρέθηκε αποθηκευμένος προμηθευτής με αυτό το ΑΦΜ. Προσθέστε
                  ή επιλέξτε προμηθευτή πριν την έγκριση.
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Προμηθευτής / Πελάτης
              <input
                value={
                  draft.targetType === "revenue"
                    ? draft.clientName
                    : draft.supplierName
                }
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? draft.targetType === "revenue"
                        ? { ...current, clientName: event.target.value }
                        : { ...current, supplierName: event.target.value }
                      : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              ΑΦΜ
              <input
                value={draft.supplierVat}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, supplierVat: event.target.value }
                      : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Αριθμός τιμολογίου
              <input
                value={draft.invoiceNumber}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, invoiceNumber: event.target.value }
                      : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Καθαρή αξία
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.netAmount}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, netAmount: event.target.value } : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              ΦΠΑ
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.vatAmount}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, vatAmount: event.target.value } : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Σύνολο
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.totalAmount}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, totalAmount: event.target.value }
                      : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Πληρωμένο / Εισπραχθέν ποσό
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.paidAmount}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, paidAmount: event.target.value }
                      : current,
                  )
                }
                className={inputClassName()}
              />
            </label>
            {draft.targetType === "expense" ? (
              <>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Κατηγορία εξόδου
                  <select
                    value={draft.expenseCategory}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, expenseCategory: event.target.value }
                          : current,
                      )
                    }
                    className={inputClassName()}
                  >
                    <option value="other">Άλλο</option>
                    <option value="accountant">Λογιστής</option>
                    <option value="taxes">Φόροι</option>
                  </select>
                </label>
                {draft.expenseCategory === "taxes" ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    Τύπος φόρου
                    <select
                      value={draft.expenseSubtype}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, expenseSubtype: event.target.value }
                            : current,
                        )
                      }
                      className={inputClassName()}
                    >
                      <option value="">Επιλέξτε φόρο</option>
                      <option value="vat">ΦΠΑ</option>
                      <option value="fee">ΦΕΕ</option>
                      <option value="fmy">ΦΜΥ</option>
                      <option value="other">Άλλο</option>
                    </select>
                  </label>
                ) : null}
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Μέθοδος κατανομής
                  <select
                    value={draft.allocationMethod}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              allocationMethod: event.target
                                .value as ReviewDraft["allocationMethod"],
                            }
                          : current,
                      )
                    }
                    className={inputClassName()}
                  >
                    <option value="by_project_hours">Με βάση ώρες έργου</option>
                    <option value="by_project_revenue">Με βάση έσοδα έργου</option>
                    <option value="equal_per_active_project">
                      Ισόποσα σε ενεργά έργα
                    </option>
                    <option value="manual">Χειροκίνητα</option>
                  </select>
                </label>
              </>
            ) : null}
            {draft.targetType === "revenue" ? (
              <>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Τύπος εσόδου
                  <select
                    value={draft.revenueType}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              revenueType: event.target
                                .value as ReviewDraft["revenueType"],
                            }
                          : current,
                      )
                    }
                    className={inputClassName()}
                  >
                    <option value="invoice">Τιμολόγιο</option>
                    <option value="advance">Προκαταβολή</option>
                    <option value="payment">Εξόφληση</option>
                    <option value="credit">Πιστωτικό</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Τρόπος είσπραξης
                  <select
                    value={draft.paymentMethod}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              paymentMethod: event.target
                                .value as ReviewDraft["paymentMethod"],
                            }
                          : current,
                      )
                    }
                    className={inputClassName()}
                  >
                    <option value="bank">Τράπεζα</option>
                    <option value="cash">Μετρητά</option>
                    <option value="other">Άλλο</option>
                  </select>
                </label>
              </>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Περιγραφή
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, description: event.target.value }
                      : current,
                  )
                }
                rows={3}
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Σημειώσεις
              <textarea
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, notes: event.target.value } : current,
                  )
                }
                rows={3}
                className={inputClassName()}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Λόγος απόρριψης
              <textarea
                value={draft.rejectionReason}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, rejectionReason: event.target.value }
                      : current,
                  )
                }
                rows={2}
                className={inputClassName()}
              />
            </label>
          </div>

          {openedReviewWarnings.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {openedReviewWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSavingCorrections}
              onClick={() => void handleSaveCorrections()}
              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:opacity-60"
            >
              {isSavingCorrections
                ? "Αποθήκευση διορθώσεων..."
                : "Αποθήκευση διορθώσεων"}
            </button>
            <button
              type="button"
              disabled={isApproving}
              onClick={() => void handleApprove()}
              className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
            >
              {isApproving ? "Γίνεται έγκριση τιμολογίου..." : "Έγκριση"}
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={() => void handleReject()}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {isRejecting ? "Γίνεται απόρριψη τιμολογίου..." : "Απόρριψη"}
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
