import type { Supplier } from "@/src/features/materials/types";
import type { Project } from "@/src/features/projects/types";
import { normalizeVat } from "@/src/shared/utils/normalize-vat";
import type { ExtractedInvoice } from "../types";

type SuggestionExtract = Pick<
  ExtractedInvoice,
  | "supplier_name"
  | "supplier_vat"
  | "project_suggestion_id"
  | "category_suggestion"
  | "line_items"
  | "raw_extraction"
>;

export type SupplierSuggestion =
  | {
      type: "matched_by_vat" | "possible_name_match";
      supplierId: string;
      supplierName: string;
      supplierVat: string;
      confidence: number;
      message: string;
    }
  | {
      type: "not_found";
      supplierId: null;
      supplierName: string | null;
      supplierVat: string | null;
      confidence: 0;
      message: string;
    };

export type ProjectSuggestion =
  | {
      type: "matched_by_id" | "matched_by_code" | "matched_by_name" | "possible_match";
      projectId: string;
      projectName: string;
      projectCode: string;
      projectStatus: string;
      confidence: number;
      message: string;
    }
  | {
      type: "not_found";
      projectId: null;
      projectName: null;
      projectCode: null;
      projectStatus: null;
      confidence: 0;
      message: string;
    };

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function getExtractionSearchText(extracted: SuggestionExtract | null): string {
  if (!extracted) return "";

  return normalizeText(
    [
      extracted.category_suggestion,
      stringifyUnknown(extracted.line_items),
      stringifyUnknown(extracted.raw_extraction),
    ].join(" "),
  );
}

export function findSupplierSuggestionForExtractedInvoice(
  extracted: SuggestionExtract | null,
  suppliers: Supplier[],
): SupplierSuggestion {
  const extractedVat = normalizeVat(extracted?.supplier_vat);
  const extractedName = normalizeText(extracted?.supplier_name);

  if (extractedVat) {
    const supplier = suppliers.find(
      (item) => normalizeVat(item.tax_id) === extractedVat,
    );

    if (supplier) {
      return {
        type: "matched_by_vat",
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierVat: supplier.tax_id,
        confidence: 1,
        message: "Βρέθηκε υπάρχων προμηθευτής",
      };
    }
  }

  if (extractedName) {
    const supplier =
      suppliers.find((item) => normalizeText(item.name) === extractedName) ??
      suppliers.find((item) => {
        const supplierName = normalizeText(item.name);
        return (
          supplierName.includes(extractedName) ||
          extractedName.includes(supplierName)
        );
      });

    if (supplier) {
      return {
        type: "possible_name_match",
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierVat: supplier.tax_id,
        confidence: 0.6,
        message: "Βρέθηκε υπάρχων προμηθευτής",
      };
    }
  }

  return {
    type: "not_found",
    supplierId: null,
    supplierName: extracted?.supplier_name ?? null,
    supplierVat: extracted?.supplier_vat ?? null,
    confidence: 0,
    message: "Δεν βρέθηκε υπάρχων προμηθευτής με αυτό το ΑΦΜ.",
  };
}

export function findProjectSuggestionForExtractedInvoice(
  extracted: SuggestionExtract | null,
  projects: Project[],
  selectedProjectId?: string | null,
): ProjectSuggestion {
  const selectedProject = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId)
    : null;
  const suggestedProject = extracted?.project_suggestion_id
    ? projects.find((project) => project.id === extracted.project_suggestion_id)
    : null;
  const codeMatchedProject = findProjectByCode(extracted, projects);
  const nameMatchedProject = findProjectByName(extracted, projects);
  const possibleProject = findPossibleProject(extracted, projects);
  const project =
    suggestedProject ??
    selectedProject ??
    codeMatchedProject ??
    nameMatchedProject ??
    possibleProject;

  if (!project) {
    return {
      type: "not_found",
      projectId: null,
      projectName: null,
      projectCode: null,
      projectStatus: null,
      confidence: 0,
      message: "Επιλέξτε έργο χειροκίνητα",
    };
  }

  const type = suggestedProject
    ? "matched_by_id"
    : selectedProject
      ? "matched_by_id"
      : codeMatchedProject
        ? "matched_by_code"
        : nameMatchedProject
          ? "matched_by_name"
          : "possible_match";

  return {
    type,
    projectId: project.id,
    projectName: project.name,
    projectCode: project.code,
    projectStatus: project.status,
    confidence: type === "possible_match" ? 0.55 : 0.9,
    message: "Πιθανό έργο",
  };
}

function findProjectByCode(
  extracted: SuggestionExtract | null,
  projects: Project[],
): Project | null {
  const searchText = getExtractionSearchText(extracted);
  if (!searchText) return null;

  return (
    projects.find((project) => {
      const code = normalizeText(project.code);
      return Boolean(code) && searchText.split(" ").includes(code);
    }) ?? null
  );
}

function findProjectByName(
  extracted: SuggestionExtract | null,
  projects: Project[],
): Project | null {
  const searchText = getExtractionSearchText(extracted);
  if (!searchText) return null;

  return (
    projects.find((project) => {
      const name = normalizeText(project.name);
      return Boolean(name) && searchText.includes(name);
    }) ?? null
  );
}

function findPossibleProject(
  extracted: SuggestionExtract | null,
  projects: Project[],
): Project | null {
  const searchText = getExtractionSearchText(extracted);
  if (!searchText) return null;

  return (
    projects.find((project) => {
      const nameWords = normalizeText(project.name)
        .split(" ")
        .filter((word) => word.length >= 4);
      return nameWords.some((word) => searchText.includes(word));
    }) ?? null
  );
}
