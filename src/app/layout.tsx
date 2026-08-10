import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Quiet Operator — AI Intelligence Operating System",
  description:
    "Career intelligence, content operations, and decision-grade analysis, deliberated by the META SUPREME X Council.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-ink-border">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-display)] text-lg tracking-wide text-fog">
                The Quiet Operator
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-brass">
                Meta Supreme X
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-sm text-fog-dim sm:gap-6">
              <Link href="/dashboard" className="hover:text-fog">
                Dashboard
              </Link>
              <Link href="/council" className="hover:text-fog">
                Council
              </Link>
              <Link href="/audit" className="hover:text-fog">
                Job Security Audit
              </Link>
              <Link href="/content" className="hover:text-fog">
                Content
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-ink-border">
          <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-fog-dim">
            © {new Date().getFullYear()} The Quiet Operator. Intelligence, quietly compounded.
          </div>
        </footer>
      </body>
    </html>
  );
}
