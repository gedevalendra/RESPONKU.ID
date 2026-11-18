"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardFooter from "@/app/components/dashboard/DashboardFooter";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";

type DashboardShellProps = {
  role: "admin" | "superadmin";
  breadcrumb: string;
  title: string;
  children: React.ReactNode;
};

export default function DashboardShell({
  role,
  breadcrumb,
  title,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [sidebarOpen]);
  return (
    <div className="dashboard-shell min-h-screen bg-gray-50 text-ink">
      <DashboardSidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 lg:pl-64">
        <header className="border-b border-rule bg-paper">
          <div className="flex min-h-20 items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
            <p className="font-mono text-xs uppercase tracking-widest2 text-mute">
              <span>Workspace</span>
              <span className="px-2 text-rule">/</span>
              <span className="text-ink">{breadcrumb}</span>
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link
              href="/"
              className="shrink-0 font-mono text-xs uppercase tracking-widest2 text-mute transition-colors hover:text-accent"
            >
              Lihat situs ↗
            </Link>
            <button type="button" aria-label="Buka menu dashboard" aria-expanded={sidebarOpen} aria-controls="dashboard-sidebar" onClick={() => setSidebarOpen(true)} className="flex h-11 w-11 items-center justify-center text-ink hover:bg-gray-800/5 lg:hidden">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            </div>
          </div>
        </header>

        <main className="px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>

        <DashboardFooter role={role} />
      </div>
    </div>
  );
}
