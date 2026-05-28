import { createClient } from "@/src/integrations/supabase/server";
import { EntitlementError } from "@/src/core/errors";
import { requireCompanyMember } from "@/src/core/tenants";
import type { FeatureCode } from "./types";

export async function canUseFeature(
  companyId: string,
  featureCode: FeatureCode,
): Promise<boolean> {
  await requireCompanyMember(companyId);

  const supabase = await createClient();
  const { data: feature, error: featureError } = await supabase
    .from("features")
    .select("id")
    .eq("code", featureCode)
    .maybeSingle();

  if (featureError || !feature) {
    return false;
  }

  const { data: override, error: overrideError } = await supabase
    .from("company_feature_overrides")
    .select("enabled")
    .eq("company_id", companyId)
    .eq("feature_id", feature.id)
    .maybeSingle();

  if (overrideError) {
    return false;
  }

  if (override) {
    return override.enabled;
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("plan_id")
    .eq("id", companyId)
    .single();

  if (companyError || !company?.plan_id) {
    console.warn("[entitlements:canUseFeature] Company has no active plan", {
      companyId,
      featureCode,
      message: companyError?.message,
      code: companyError?.code,
    });

    return false;
  }

  const { data: planFeature, error: planFeatureError } = await supabase
    .from("plan_features")
    .select("id")
    .eq("plan_id", company.plan_id)
    .eq("feature_id", feature.id)
    .maybeSingle();

  if (planFeatureError) {
    return false;
  }

  return Boolean(planFeature);
}

export async function requireFeature(
  companyId: string,
  featureCode: FeatureCode,
): Promise<true> {
  const allowed = await canUseFeature(companyId, featureCode);

  if (!allowed) {
    throw new EntitlementError(
      `Feature "${featureCode}" is not enabled for this company.`,
    );
  }

  return true;
}

export type { FeatureCode } from "./types";
