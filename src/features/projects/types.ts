import type { Database } from "@/src/integrations/supabase/types";

export const projectStatuses = [
  "active",
  "in_progress",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type Project = Omit<
  Database["public"]["Tables"]["projects"]["Row"],
  "status"
> & {
  status: ProjectStatus;
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
