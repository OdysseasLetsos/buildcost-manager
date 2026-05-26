"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { createClient } from "@/src/integrations/supabase/server";
import type { Database } from "@/src/integrations/supabase/types";
import {
  getDefaultRouteForRole,
  invalidInvitationMessage,
  normalizeInvitationToken,
} from "./invitations";

const allowedInviteRoles = ["admin", "office", "foreman", "viewer"] as const;

type InviteRole = (typeof allowedInviteRoles)[number];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type CompanyMember = Database["public"]["Tables"]["company_members"]["Row"];
type CurrentCompanyForAction = {
  company: Company;
  membership: CompanyMember;
};

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

function redirectCreateCompanyWithError(message: string): never {
  const params = new URLSearchParams({ mode: "create", error: message });
  redirect(`/onboarding/company?${params.toString()}`);
}

function redirectMembersWithError(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/settings/members?${params.toString()}`);
}

function logSupabaseError(context: string, error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null): void {
  console.error(`[${context}] Supabase error`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
}

function isInviteRole(role: string): role is InviteRole {
  return allowedInviteRoles.includes(role as InviteRole);
}

function createInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

function redirectAcceptInviteWithError(token: string, message: string): never {
  const params = new URLSearchParams({ error: message });

  if (token) {
    params.set("token", token);
  }

  redirect(`/accept-invite?${params.toString()}`);
}

async function requireCurrentCompanyForMemberManagement() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("company_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding/company");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", membership.company_id)
    .single();

  if (!company) {
    redirect("/onboarding/company");
  }

  const { data: role } = await supabase
    .from("roles")
    .select("code")
    .eq("id", membership.role_id)
    .single();

  if (!role || !["owner", "admin"].includes(role.code)) {
    redirectMembersWithError("Δεν έχετε δικαίωμα διαχείρισης μελών.");
  }

  const currentCompany: CurrentCompanyForAction = { company, membership };

  return currentCompany;
}

export async function createCompany(formData: FormData): Promise<void> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirectCreateCompanyWithError("Συμπληρώστε το όνομα της εταιρείας.");
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
    logSupabaseError("tenants:createCompany", error);
    redirectCreateCompanyWithError("Δεν ήταν δυνατή η δημιουργία της εταιρείας.");
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

export async function createInvitation(formData: FormData): Promise<void> {
  const user = await requireUser();
  const currentCompany = await requireCurrentCompanyForMemberManagement();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();

  if (!email) {
    redirectMembersWithError("Συμπληρώστε email πρόσκλησης.");
  }

  if (!isInviteRole(role)) {
    redirectMembersWithError("Ο ρόλος πρόσκλησης δεν επιτρέπεται.");
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_company_invitation", {
    target_company_id: currentCompany.company.id,
    invite_email: email,
    invite_role: role,
    invite_token: token,
    invite_expires_at: expiresAt,
  });

  if (error) {
    console.error("[members:create-invitation] Supabase error", error);
    redirectMembersWithError("Δεν ήταν δυνατή η δημιουργία πρόσκλησης.");
  }

  await writeAuditLog({
    companyId: currentCompany.company.id,
    action: "invitation.created",
    entityType: "company_invitation",
    metadata: { email, role, invitedBy: user.id },
  });

  const params = new URLSearchParams({
    invite: `/accept-invite?token=${token}`,
  });
  redirect(`/settings/members?${params.toString()}`);
}

export async function openInvitation(formData: FormData): Promise<void> {
  const token = normalizeInvitationToken(formData.get("token"));

  if (!token) {
    redirectAcceptInviteWithError("", "Ο σύνδεσμος πρόσκλησης δεν είναι έγκυρος.");
  }

  redirect(`/accept-invite?token=${encodeURIComponent(token)}`);
}

export async function acceptInvitation(formData: FormData): Promise<void> {
  const user = await requireUser();

  const token = normalizeInvitationToken(formData.get("token"));

  if (!token) {
    redirectAcceptInviteWithError("", "Ο σύνδεσμος πρόσκλησης δεν είναι έγκυρος.");
  }

  const supabase = await createClient();
  const { data: companyId, error } = await supabase.rpc(
    "accept_company_invitation",
    {
      invite_token: token,
    },
  );

  if (error || !companyId) {
    console.error("[members:accept-invitation] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      normalizedTokenLength: token.length,
    });

    redirectAcceptInviteWithError(token, invalidInvitationMessage);
  }

  await writeAuditLog({
    companyId,
    action: "invitation.accepted",
    entityType: "company_invitation",
    metadata: {},
  });

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role_id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    console.error("[members:accept-invitation:membership] Supabase error", {
      message: membershipError.message,
      code: membershipError.code,
      details: membershipError.details,
      hint: membershipError.hint,
    });
  }

  const { data: role, error: roleError } = membership?.role_id
    ? await supabase
        .from("roles")
        .select("code")
        .eq("id", membership.role_id)
        .maybeSingle()
    : { data: null, error: null };

  if (roleError) {
    console.error("[members:accept-invitation:role] Supabase error", {
      message: roleError.message,
      code: roleError.code,
      details: roleError.details,
      hint: roleError.hint,
    });
  }

  redirect(getDefaultRouteForRole(role?.code));
}

export async function updateMemberRole(formData: FormData): Promise<void> {
  const currentCompany = await requireCurrentCompanyForMemberManagement();
  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();

  if (!membershipId || !isInviteRole(role)) {
    redirectMembersWithError("Δεν ήταν δυνατή η αλλαγή ρόλου.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_company_member_role", {
    target_membership_id: membershipId,
    next_role: role,
  });

  if (error) {
    console.error("[members:update-role] Supabase error", error);
    redirectMembersWithError("Δεν ήταν δυνατή η αλλαγή ρόλου.");
  }

  await writeAuditLog({
    companyId: currentCompany.company.id,
    action: "member.role_changed",
    entityType: "company_member",
    entityId: membershipId,
    metadata: { role },
  });

  redirect("/settings/members");
}

export async function disableMember(formData: FormData): Promise<void> {
  const currentCompany = await requireCurrentCompanyForMemberManagement();
  const membershipId = String(formData.get("membershipId") ?? "").trim();

  if (!membershipId) {
    redirectMembersWithError("Δεν ήταν δυνατή η απενεργοποίηση μέλους.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("disable_company_member", {
    target_membership_id: membershipId,
  });

  if (error) {
    console.error("[members:disable] Supabase error", error);
    redirectMembersWithError("Δεν ήταν δυνατή η απενεργοποίηση μέλους.");
  }

  await writeAuditLog({
    companyId: currentCompany.company.id,
    action: "member.disabled",
    entityType: "company_member",
    entityId: membershipId,
    metadata: {},
  });

  redirect("/settings/members");
}
