"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavigationItem = {
  href: string;
  label: string;
};

export function AppShell({
  children,
  userEmail,
  companyName,
  navigationItems,
  logoutAction,
}: Readonly<{
  children: React.ReactNode;
  userEmail?: string;
  companyName?: string;
  navigationItems: NavigationItem[];
  logoutAction: () => Promise<void>;
}>) {
  const pathname = usePathname();

  function isActiveNavigationItem(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-gradient-to-b from-blue-950 via-slate-950 to-slate-900 px-4 py-5 text-white shadow-2xl shadow-slate-950/20 lg:flex">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-sm shadow-slate-950/20 transition hover:bg-white/15"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black tracking-tight text-blue-950 shadow-sm">
            BC
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-wide">
              BuildCost Manager
            </span>
            <span className="mt-0.5 block text-xs font-medium text-blue-100">
              Διαχείριση Κόστους
            </span>
          </span>
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Πλοήγηση
          </p>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1.5" aria-label="Κύρια πλοήγηση">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActiveNavigationItem(item.href) ? "page" : undefined}
              className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActiveNavigationItem(item.href)
                  ? "bg-white text-blue-950 shadow-lg shadow-slate-950/20"
                  : "text-blue-50/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  isActiveNavigationItem(item.href)
                    ? "bg-blue-700"
                    : "bg-transparent group-hover:bg-blue-200"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-xs font-semibold text-blue-100">
            {companyName ?? "BuildCost Manager"}
          </p>
          <p className="mt-1 truncate text-xs text-blue-100/70">
            {userEmail ?? "Χρήστης"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur md:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Πίνακας εργασίας
                </p>
                <h1 className="mt-1 text-lg font-semibold text-slate-950">
                  {companyName ?? "BuildCost Manager"}
                </h1>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden max-w-64 truncate rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm md:inline">
                  {userEmail ?? "Χρήστης"}
                </span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Αποσύνδεση
                  </button>
                </form>
              </div>
            </div>

            <nav
              className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
              aria-label="Κύρια πλοήγηση"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActiveNavigationItem(item.href) ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActiveNavigationItem(item.href)
                      ? "bg-blue-950 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
