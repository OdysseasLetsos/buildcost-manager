import { redirect } from "next/navigation";
import {
  AppShell,
  type NavigationIconName,
  type NavigationItem,
} from "@/src/shared/components/app-shell";
import type { TranslationKey } from "@/src/shared/i18n";
import { getCurrentUser, logout } from "@/src/core/auth";
import type { FeatureCode } from "@/src/core/entitlements";
import { createClient } from "@/src/integrations/supabase/server";
import { getCurrentCompanyForUser } from "@/src/core/tenants";

type RoleCode = "owner" | "admin" | "office" | "foreman" | "viewer" | string;

type AppNavigationItem = NavigationItem & {
  allowedRoles: readonly RoleCode[];
  featureCode?: FeatureCode;
  anyFeatureCode?: readonly FeatureCode[];
  labelKey: TranslationKey;
};

const appNavigationItems: AppNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    labelKey: "nav.dashboard",
    icon: "dashboard",
    allowedRoles: ["owner", "admin", "office", "foreman", "viewer"],
  },
  {
    href: "/projects",
    label: "Έργα",
    labelKey: "nav.projects",
    icon: "projects",
    allowedRoles: ["owner", "admin", "foreman", "viewer"],
    featureCode: "projects",
  },
  {
    href: "/employees",
    label: "Εργαζόμενοι",
    labelKey: "nav.employees",
    icon: "employees",
    allowedRoles: ["owner", "admin", "office", "foreman", "viewer"],
    featureCode: "employees",
  },
  {
    href: "/months",
    label: "Μήνες",
    labelKey: "nav.months",
    icon: "months",
    allowedRoles: ["owner", "admin"],
    featureCode: "monthly_periods",
  },
  {
    href: "/daily-work",
    label: "Ημερήσια Εργασία",
    labelKey: "nav.dailyWork",
    icon: "dailyWork",
    allowedRoles: ["owner", "admin", "foreman"],
    featureCode: "daily_work",
  },
  {
    href: "/payments",
    label: "Πληρωμές & ΙΚΑ",
    labelKey: "nav.payments",
    icon: "payments",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "payments",
  },
  {
    href: "/materials",
    label: "Υλικά",
    labelKey: "nav.materials",
    icon: "materials",
    allowedRoles: ["owner", "admin", "office", "foreman"],
    featureCode: "materials",
  },
  {
    href: "/expenses",
    label: "Έξοδα",
    labelKey: "nav.expenses",
    icon: "expenses",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "expenses",
  },
  {
    href: "/revenues",
    label: "Έσοδα",
    labelKey: "nav.revenues",
    icon: "revenues",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "revenues",
  },
  {
    href: "/project-summary",
    label: "Σύνοψη Έργου",
    labelKey: "nav.projectSummary",
    icon: "summary",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "project_summary",
  },
  {
    href: "/ai-invoices",
    label: "AI Τιμολόγια",
    labelKey: "nav.aiInvoices",
    icon: "aiInvoices",
    allowedRoles: ["owner", "admin"],
    featureCode: "ai_invoice_import",
  },
  {
    href: "/reports",
    label: "Αναφορές",
    labelKey: "nav.reports",
    icon: "reports",
    allowedRoles: ["owner", "admin", "office", "viewer"],
    anyFeatureCode: ["reports_pdf", "reports_excel"],
  },
  {
    href: "/settings",
    label: "Ρυθμίσεις",
    labelKey: "nav.settings",
    icon: "settings",
    allowedRoles: ["owner", "admin", "office", "foreman", "viewer"],
  },
];

function hasFullNavigationAccess(roleCode: RoleCode): boolean {
  return roleCode === "owner" || roleCode === "admin";
}

async function getMembershipRole(roleId: string): Promise<RoleCode> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("code")
    .eq("id", roleId)
    .single();

  return data?.code ?? "viewer";
}

async function canShowNavigationItem(
  roleCode: RoleCode,
  item: AppNavigationItem,
  enabledFeatureCodes: ReadonlySet<FeatureCode>,
): Promise<boolean> {
  if (!item.allowedRoles.includes(roleCode)) {
    return false;
  }

  // Sidebar visibility is UX-only. Owner/admin should see every normal module
  // even in development databases with incomplete plan/feature seed data;
  // backend reads and mutations must still enforce requireRole()/requireFeature().
  if (hasFullNavigationAccess(roleCode)) {
    return true;
  }

  if (item.featureCode) {
    return enabledFeatureCodes.has(item.featureCode);
  }

  if (item.anyFeatureCode) {
    return item.anyFeatureCode.some((featureCode) =>
      enabledFeatureCodes.has(featureCode),
    );
  }

  return true;
}

async function getEnabledNavigationFeatureCodes(
  companyId: string,
): Promise<ReadonlySet<FeatureCode>> {
  const featureCodes = Array.from(
    new Set(
      appNavigationItems.flatMap((item) => [
        ...(item.featureCode ? [item.featureCode] : []),
        ...(item.anyFeatureCode ?? []),
      ]),
    ),
  );

  if (featureCodes.length === 0) {
    return new Set();
  }

  const supabase = await createClient();
  const { data: features, error: featuresError } = await supabase
    .from("features")
    .select("id, code")
    .in("code", featureCodes);

  if (featuresError || !features?.length) {
    console.warn("[layout:navigation-features] Unable to load features", {
      message: featuresError?.message,
      code: featuresError?.code,
    });

    return new Set();
  }

  const featureIdByCode = new Map(
    features.map((feature) => [feature.code as FeatureCode, feature.id]),
  );
  const featureCodeById = new Map(
    features.map((feature) => [feature.id, feature.code as FeatureCode]),
  );
  const featureIds = Array.from(featureCodeById.keys());

  const { data: overrides, error: overridesError } = await supabase
    .from("company_feature_overrides")
    .select("feature_id, enabled")
    .eq("company_id", companyId)
    .in("feature_id", featureIds);

  if (overridesError) {
    console.warn("[layout:navigation-features] Unable to load overrides", {
      message: overridesError.message,
      code: overridesError.code,
    });
  }

  const overrideByFeatureId = new Map(
    (overrides ?? []).map((override) => [override.feature_id, override.enabled]),
  );
  const enabled = new Set<FeatureCode>();
  const featureIdsWithoutOverrides = featureIds.filter(
    (featureId) => !overrideByFeatureId.has(featureId),
  );

  for (const [featureId, isEnabled] of overrideByFeatureId) {
    const featureCode = featureCodeById.get(featureId);

    if (featureCode && isEnabled) {
      enabled.add(featureCode);
    }
  }

  if (featureIdsWithoutOverrides.length === 0) {
    return enabled;
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("plan_id")
    .eq("id", companyId)
    .single();

  if (companyError || !company?.plan_id) {
    console.warn("[layout:navigation-features] Company has no active plan", {
      companyId,
      message: companyError?.message,
      code: companyError?.code,
    });

    return enabled;
  }

  const { data: planFeatures, error: planFeaturesError } = await supabase
    .from("plan_features")
    .select("feature_id")
    .eq("plan_id", company.plan_id)
    .in("feature_id", featureIdsWithoutOverrides);

  if (planFeaturesError) {
    console.warn("[layout:navigation-features] Unable to load plan features", {
      message: planFeaturesError.message,
      code: planFeaturesError.code,
    });

    return enabled;
  }

  for (const planFeature of planFeatures ?? []) {
    const featureCode = featureCodeById.get(planFeature.feature_id);

    if (featureCode && featureIdByCode.has(featureCode)) {
      enabled.add(featureCode);
    }
  }

  return enabled;
}

async function getVisibleNavigationItems(
  companyId: string,
  roleCode: RoleCode,
): Promise<NavigationItem[]> {
  const enabledFeatureCodes = hasFullNavigationAccess(roleCode)
    ? new Set<FeatureCode>()
    : await getEnabledNavigationFeatureCodes(companyId);
  const visibility = await Promise.all(
    appNavigationItems.map(async (item) => ({
      item,
      visible: await canShowNavigationItem(roleCode, item, enabledFeatureCodes),
    })),
  );

  return visibility
    .filter(({ visible }) => visible)
    .map(({ item }) => ({
      href: item.href,
      label: item.label,
      labelKey: item.labelKey,
      icon: item.icon as NavigationIconName,
    }));
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentCompany = await getCurrentCompanyForUser(user.id);

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const roleCode = await getMembershipRole(currentCompany.membership.role_id);
  // UI visibility only: server actions and data access must still enforce requireRole()/requireFeature().
  const navigationItems = await getVisibleNavigationItems(
    currentCompany.company.id,
    roleCode,
  );

  return (
    <AppShell
      userEmail={user.email}
      companyName={currentCompany.company.name}
      navigationItems={navigationItems}
      logoutAction={logout}
    >
      {children}
    </AppShell>
  );
}
