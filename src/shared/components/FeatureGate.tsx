import type { ReactNode } from "react";
import { canUseFeature, type FeatureCode } from "@/src/core/entitlements";
import { getCurrentCompany } from "@/src/core/tenants";
import { UpgradeRequired } from "./UpgradeRequired";

type FeatureGateProps = {
  featureCode: FeatureCode;
  children: ReactNode;
  fallback?: ReactNode;
};

// UX helper only: backend mutations, queries, and server actions must still call requireFeature().
export async function FeatureGate({
  featureCode,
  children,
  fallback,
}: FeatureGateProps) {
  const deniedContent = fallback ?? <UpgradeRequired />;

  try {
    const currentCompany = await getCurrentCompany();

    if (!currentCompany) {
      return deniedContent;
    }

    const allowed = await canUseFeature(currentCompany.company.id, featureCode);

    if (!allowed) {
      return deniedContent;
    }

    return children;
  } catch {
    return deniedContent;
  }
}
