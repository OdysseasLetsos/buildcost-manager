import Link from "next/link";

type NavigationItem = {
  href: string;
  label: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Έργα" },
  { href: "/months", label: "Μήνες" },
  { href: "/daily-work", label: "Ημερήσια Εργασία" },
  { href: "/payments", label: "Πληρωμές" },
  { href: "/ika", label: "ΙΚΑ" },
  { href: "/materials", label: "Υλικά" },
  { href: "/expenses", label: "Έξοδα" },
  { href: "/revenues", label: "Έσοδα" },
  { href: "/project-summary", label: "Σύνοψη Έργου" },
  { href: "/ai-invoices", label: "AI Τιμολόγια" },
  { href: "/reports", label: "Αναφορές" },
];

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-72 shrink-0 flex-col bg-blue-950 px-5 py-6 text-white">
        <Link href="/dashboard" className="rounded-lg px-3 py-2">
          <span className="block text-lg font-semibold">BuildCost Manager</span>
          <span className="mt-1 block text-sm text-blue-100">Διαχείριση Κόστους</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Κύρια πλοήγηση">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-blue-50 transition hover:bg-blue-900 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <p className="text-sm font-medium text-slate-500">Πίνακας εργασίας</p>
            <h1 className="text-lg font-semibold text-slate-950">
              BuildCost Manager
            </h1>
          </div>
          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
            Χωρίς σύνδεση
          </div>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
