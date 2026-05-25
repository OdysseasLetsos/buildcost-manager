import { createClient } from "@/src/integrations/supabase/server";
import { getCurrentUser } from "@/src/core/auth";
import type { Json } from "@/src/integrations/supabase/types";

export type WriteAuditLogInput = {
  companyId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
  strict?: boolean;
};

export type WriteAuditLogResult = {
  success: boolean;
  error: Error | null;
};

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Audit logging failed.");
}

export async function writeAuditLog(
  input: WriteAuditLogInput,
): Promise<WriteAuditLogResult> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { error } = await supabase.from("audit_logs").insert({
    company_id: input.companyId,
    actor_id: user?.id ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    const auditError = toError(error);

    if (input.strict) {
      throw auditError;
    }

    return { success: false, error: auditError };
  }

  return { success: true, error: null };
}
