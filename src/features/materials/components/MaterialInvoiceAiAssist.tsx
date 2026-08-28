"use client";

import { useState } from "react";
import { runInvoiceExtraction } from "@/src/features/ai-invoices/actions/run-invoice-extraction";
import { uploadInvoiceDocument } from "@/src/features/ai-invoices/actions/upload-invoice-document";
import type { ExtractedInvoicePayload } from "@/src/features/ai-invoices/types";
import type { Supplier } from "../types";

const supportedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const maxFileSizeBytes = 10 * 1024 * 1024;

type MaterialInvoiceAiAssistProps = {
  roleAllowed: boolean;
  featureAvailable: boolean;
  selectedMonthKey: string;
  suppliers: Supplier[];
  onApplyExtraction: (payload: ExtractedInvoicePayload) => void;
};

export function MaterialInvoiceAiAssist({
  roleAllowed,
  featureAvailable,
  selectedMonthKey,
  suppliers,
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
    const supplierVat = result.extractedInvoice.supplier_vat?.trim();
    const matchedSupplier = supplierVat
      ? suppliers.some((supplier) => supplier.tax_id.trim() === supplierVat)
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

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
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
        <p className="mt-2 text-xs font-medium text-slate-500">
          Ανεβάστε πρώτα ένα τιμολόγιο.
        </p>
      ) : null}

      {message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
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
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
