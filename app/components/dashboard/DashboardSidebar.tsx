"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/components/auth/LogoutButton";

export default function DashboardSidebar({ role, open = false, onClose }: {
  role: "admin" | "superadmin";
  open?: boolean;
  onClose?: () => void;
}) {
  const base = role === "superadmin" ? "/superadmin" : "/admin";
  const pathname = usePathname();
  const groups = [
    { label: "Editorial", items: [[`${base}/artikel`, "Approval artikel"]] },
    { label: "Pengguna & organisasi", items: [[`${base}/pengguna`, "Daftar pengguna"], [`${base}/organisasi`, "Organisasi & verifikasi"]] },
    { label: "Konten & informasi", items: [["/admin/tentang", "Halaman Tentang"], [`${base}/ticker`, "Ticker berita"], [`${base}/popup`, "Popup informasi"]] },
    { label: "Komunikasi", items: [[role === "superadmin" ? "/admin/notifikasi" : `${base}/notifikasi`, "Kirim notifikasi"]] },
  ];
  const linkStyle = "block px-4 py-3 font-mono text-xs uppercase tracking-widest2 transition-colors hover:bg-gray-800/5 hover:text-ink";

  return (
    <>
      {open && <button type="button" aria-label="Tutup menu dashboard" onClick={onClose} className="fixed inset-0 z-[110] bg-black/40 lg:hidden" />}
      <aside id="dashboard-sidebar" aria-label="Menu dashboard" className={`fixed inset-y-0 left-0 z-[120] flex w-72 max-w-[85vw] flex-col border-r border-rule bg-paper transition-transform duration-200 lg:z-30 lg:w-64 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between gap-3 px-6 py-7">
          <Link href={base} onClick={onClose} className="font-display text-4xl tracking-tight text-ink">ResponKu.</Link>
          <button type="button" onClick={onClose} aria-label="Tutup sidebar" className="p-2 text-xl lg:hidden">✕</button>
        </div>
        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-5" aria-label="Navigasi dashboard">
          <Link href={base} onClick={onClose} aria-current={pathname === base ? "page" : undefined} className={`${linkStyle} ${pathname === base ? "bg-gray-800/5 text-ink" : "text-mute"}`}>Ringkasan</Link>
          {groups.map((group) => (
            <details
              key={group.label}
              open={group.items.some(([href]) => pathname === href)}
              onMouseEnter={(event) => {
                if (window.matchMedia("(hover: hover)").matches)
                  event.currentTarget.open = true;
              }}
              onMouseLeave={(event) => {
                if (
                  window.matchMedia("(hover: hover)").matches &&
                  !event.currentTarget.contains(document.activeElement)
                ) event.currentTarget.open = group.items.some(([href]) => pathname === href);
              }}
              className="group border-b border-rule pb-2"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-mute hover:text-ink [&::-webkit-details-marker]:hidden">
                {group.label}<span className="transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
              </summary>
              <div className="ml-3 border-l border-rule">
                {group.items.map(([href, label]) => <Link key={href} href={href} onClick={onClose} aria-current={pathname === href ? "page" : undefined} className={`${linkStyle} ${pathname === href ? "bg-gray-800/5 text-ink" : "text-mute"}`}>{label}</Link>)}
              </div>
            </details>
          ))}
        </nav>
        <div className="shrink-0 border-t border-rule px-3 py-3 text-mute">
          <Link href="/" onClick={onClose} className={linkStyle}>Lihat website</Link>
          <Link href="/akun" onClick={onClose} className={linkStyle}>Profil saya</Link>
          <div className="px-4 py-3"><LogoutButton /></div>
        </div>
      </aside>
    </>
  );
}
