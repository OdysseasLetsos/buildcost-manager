import { redirect } from "next/navigation";
import { AppShell } from "@/src/shared/components/app-shell";
import { getCurrentUser, logout } from "@/src/core/auth";
import { getCurrentCompany } from "@/src/core/tenants";

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

  return (
    <AppShell
      userEmail={user.email}
      companyName={currentCompany.company.name}
      logoutAction={logout}
    >
      {children}
    </AppShell>
  );
}
