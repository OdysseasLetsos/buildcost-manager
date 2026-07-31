import { redirect } from "next/navigation";
import {
  AppShell,
  type NavigationItem,
  type NavigationIconName,
} from "@/src/shared/components/app-shell";
import { getCurrentUser, logout } from "@/src/core/auth";
import { canUseFeature, type FeatureCode } from "@/src/core/entitlements";
import { createClient } from "@/src/integrations/supabase/server";
import { getCurrentCompany } from "@/src/core/tenants";

type RoleCode = "owner" | "admin" | "office" | "foreman" | "viewer" | string;

type AppNavigationItem = NavigationItem & {
  allowedRoles: readonly RoleCode[];
  featureCode?: FeatureCode;
  anyFeatureCode?: readonly FeatureCode[];
};

const appNavigationItems: AppNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    allowedRoles: ["owner", "admin", "office", "foreman", "viewer"],
  },
  {
    href: "/projects",
    label: "Έργα",
    icon: "projects",
    allowedRoles: ["owner", "admin", "foreman", "viewer"],
    featureCode: "projects",
  },
  {
    href: "/employees",
    label: "Εργαζόμενοι",
    icon: "employees",
    allowedRoles: ["owner", "admin", "office", "foreman", "viewer"],
    featureCode: "employees",
  },
  {
    href: "/months",
    label: "Μήνες",
    icon: "months",
    allowedRoles: ["owner", "admin"],
    featureCode: "monthly_periods",
  },
  {
    href: "/daily-work",
    label: "Ημερήσια Εργασία",
    icon: "dailyWork",
    allowedRoles: ["owner", "admin", "foreman"],
    featureCode: "daily_work",
  },
  {
    href: "/payments",
    label: "Πληρωμές & ΙΚΑ",
    icon: "payments",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "payments",
  },
  {
    href: "/expenses",
    label: "Έξοδα",
    icon: "expenses",
    allowedRoles: ["owner", "admin", "office", "foreman"],
    anyFeatureCode: ["expenses", "materials"],
  },
  {
    href: "/revenues",
    label: "Έσοδα",
    icon: "revenues",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "revenues",
  },
  {
    href: "/project-summary",
    label: "Σύνοψη Έργου",
    icon: "summary",
    allowedRoles: ["owner", "admin", "office"],
    featureCode: "project_summary",
  },
  {
    href: "/reports",
    label: "Αναφορές",
    icon: "reports",
    allowedRoles: ["owner", "admin", "office", "viewer"],
    anyFeatureCode: ["reports_pdf", "reports_excel"],
  },
  {
    href: "/settings/members",
    label: "Ρυθμίσεις",
    icon: "settings",
    allowedRoles: ["owner", "admin"],
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
  companyId: string,
  roleCode: RoleCode,
  item: AppNavigationItem,
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
    return canUseFeature(companyId, item.featureCode);
  }

  if (item.anyFeatureCode) {
    const checks = await Promise.all(
      item.anyFeatureCode.map((featureCode) => canUseFeature(companyId, featureCode)),
    );

    return checks.some(Boolean);
  }

  return true;
}

async function getVisibleNavigationItems(
  companyId: string,
  roleCode: RoleCode,
): Promise<NavigationItem[]> {
  const visibility = await Promise.all(
    appNavigationItems.map(async (item) => ({
      item,
      visible: await canShowNavigationItem(companyId, roleCode, item),
    })),
  );

  return visibility
    .filter(({ visible }) => visible)
    .map(({ item }) => ({
      href: item.href,
      label: item.label,
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

  const currentCompany = await getCurrentCompany();

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
