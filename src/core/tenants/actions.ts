"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { createClient } from "@/src/integrations/supabase/server";

function buildSlug(name: string): string {
  const baseSlug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${baseSlug || "company"}-${randomUUID().slice(0, 8)}`;
}

function redirectWithError(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/onboarding/company?${params.toString()}`);
}

export async function createCompany(formData: FormData): Promise<void> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirectWithError("Συμπληρώστε το όνομα της εταιρείας.");
  }

  const supabase = await createClient();
  const { data: companyId, error } = await supabase.rpc(
    "create_company_for_current_user",
    {
      company_name: name,
      company_slug: buildSlug(name),
    },
  );

  if (error || !companyId) {
    redirectWithError("Δεν ήταν δυνατή η δημιουργία της εταιρείας.");
  }

  await writeAuditLog({
    companyId,
    action: "company.created",
    entityType: "company",
    entityId: companyId,
    metadata: { name },
  });

  redirect("/dashboard");
}
