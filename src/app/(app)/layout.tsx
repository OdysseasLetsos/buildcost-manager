import { redirect } from "next/navigation";
import { AppShell } from "@/src/shared/components/app-shell";
import { getCurrentUser, logout } from "@/src/core/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={user.email} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
