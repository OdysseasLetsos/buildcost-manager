import type { Metadata } from "next";
import { LanguageProvider } from "@/src/shared/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildCost Manager",
  description: "Project costing for construction companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className="h-full antialiased">
      <body className="min-h-full">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
