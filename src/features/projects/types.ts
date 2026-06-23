import type { Database } from "@/src/integrations/supabase/types";

export const projectStatuses = [
  "offer",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type StoredProjectStatus =
  | "active"
  | "in_progress"
  | "completed"
  | "archived";
export type Project = Omit<
  Database["public"]["Tables"]["projects"]["Row"],
  "status"
> & {
  status: StoredProjectStatus;
};
export type ManagedProject = Omit<Project, "status"> & {
  status: ProjectStatus;
};

export const projectQuoteStatuses = [
  "draft",
  "sent",
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
  "revised",
] as const;

export type ProjectQuoteStatus = (typeof projectQuoteStatuses)[number];
export type ProjectQuoteType = "initial" | "supplemental";
export type ProjectQuote = Omit<
  Database["public"]["Tables"]["project_quotes"]["Row"],
  "quote_type" | "status"
> & {
  quote_type: ProjectQuoteType;
  status: ProjectQuoteStatus;
};

export type ProjectQuoteActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  quote?: ProjectQuote;
};

export const initialProjectQuoteActionState: ProjectQuoteActionState = {
  ok: false,
};

export type ProjectFilters = {
  search?: string;
  status?: ProjectStatus | "all";
};

export type ProjectActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialProjectActionState: ProjectActionState = {
  ok: false,
};

export function toProjectStatus(status: string): ProjectStatus {
  if (status === "active") return "offer";
  if (status === "archived") return "cancelled";
  if (projectStatuses.includes(status as ProjectStatus)) {
    return status as ProjectStatus;
  }

  return "offer";
}

export function toStoredProjectStatus(
  status: ProjectStatus,
): StoredProjectStatus {
  if (status === "offer") return "active";
  if (status === "cancelled") return "archived";
  return status;
}

export function isAllowedProjectStatusTransition(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): boolean {
  if (currentStatus === nextStatus) return true;

  const allowedTransitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
    offer: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return allowedTransitions[currentStatus].includes(nextStatus);
}
