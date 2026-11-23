"use client";

import BrandLogo from "@/app/components/layout/BrandLogo";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import LogoutButton from "@/app/components/auth/LogoutButton";

type Role = "admin" | "superadmin";
type Item = { href: string; label: string };
type Group = { label: string; items: Item[] };

/* Didefinisikan di luar komponen supaya tidak dibuat ulang di setiap render. */
function buildGroups(role: Role): Group[] {
  const base = role === "superadmin" ? "/superadmin" : "/admin";
  return [
    {
      label: "Editorial",
      items: [
        { href: `${base}/artikel`, label: "Approval artikel" },
        { href: "/admin/riwayat-penerbitan", label: "Riwayat penerbitan" },
        { href: "/admin/artikel/terbit", label: "Artikel terbit" },
        { href: `${base}/komentar`, label: "Moderasi komentar" },
      ],
    },
    {
      label: "Pengguna & organisasi",
      items: [
        { href: `${base}/pengguna`, label: "Daftar pengguna" },
        { href: `${base}/organisasi`, label: "Organisasi & verifikasi" },
        ...(role === "superadmin" ? [{ href: "/superadmin/api/secret", label: "Secret ID API" }, { href: "/superadmin/status-website", label: "Status website" }] : []),
      ],
    },
    {
      label: "Konten & informasi",
      items: [
        { href: "/admin/tentang", label: "Halaman Tentang" },
        { href: `${base}/ticker`, label: "Ticker berita" },
        { href: `${base}/popup`, label: "Popup informasi" },
        { href: "/admin/iklan", label: "Iklan" },
      ],
    },
    {
      label: "Komunikasi",
      items: [
        { href: role === "superadmin" ? "/admin/notifikasi" : `${base}/notifikasi`, label: "Kirim notifikasi" },
        { href: `${base}/faq`, label: "Pertanyaan pengguna" },
      ],
    },
  ];
}

/** Menu aktif = href terpanjang yang cocok, jadi halaman turunan (mis. /admin/artikel/123) tetap menyorot menunya. */
function findActive(pathname: string, groups: Group[]) {
  let best = "";
  for (const group of groups)
    for (const { href } of group.items)
      if ((pathname === href || pathname.startsWith(`${href}/`)) && href.length > best.length) best = href;
  return best;
}

const linkClass = (active: boolean, nested: boolean) =>
  [
    "relative block px-4 py-3 font-mono text-xs uppercase tracking-widest2 transition-colors",
    "hover:bg-gray-800/5 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600",
    active
      ? `bg-gray-800/5 text-ink before:absolute before:inset-y-0 before:w-0.5 before:bg-blue-500 ${nested ? "before:-left-px" : "before:left-0"}`
      : "text-mute",
  ].join(" ");

export default function DashboardSidebar({ role, open = false, onClose }: {
  role: Role;
  open?: boolean;
  onClose?: () => void;
}) {
  const base = role === "superadmin" ? "/superadmin" : "/admin";
  const pathname = usePathname();
  const uid = useId();
  const groups = useMemo(() => buildGroups(role), [role]);
  const activeHref = useMemo(() => findActive(pathname, groups), [pathname, groups]);
  const activeGroup = groups.find((group) => group.items.some((item) => item.href === activeHref))?.label;

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeGroup ? [activeGroup] : []));
  const toggle = (label: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  const navRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const mounted = useRef(false);

  /* Grup yang berisi halaman aktif otomatis terbuka saat pindah halaman. */
  useEffect(() => {
    if (activeGroup) setExpanded((current) => (current.has(activeGroup) ? current : new Set(current).add(activeGroup)));
  }, [activeGroup]);

  /* Tutup drawer mobile setiap kali rute berubah (mis. lewat tombol back). */
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    onCloseRef.current?.();
  }, [pathname]);

  /* Drawer mobile: Escape menutup, scroll halaman dikunci, fokus pindah ke tombol tutup. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current?.(); };
    document.addEventListener("keydown", onKey);
    const isDrawer = !window.matchMedia("(min-width: 1024px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (isDrawer) {
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* Menu aktif selalu terlihat walau daftar panjang. */
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [activeHref, open]);

  return (
    <>
      <button
        type="button"
        aria-label="Tutup menu dashboard"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-[110] bg-black/40 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        id="dashboard-sidebar"
        aria-label="Menu dashboard"
        className={`fixed inset-y-0 left-0 z-[120] flex w-72 max-w-[85vw] flex-col border-r border-rule bg-paper transition-[transform,visibility] duration-200 motion-reduce:transition-none lg:visible lg:z-30 lg:w-64 lg:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-full"}`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-7">
          <Link href={base} onClick={onClose} className="inline-flex items-center"><BrandLogo className="h-10" /></Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup sidebar"
            className="grid size-10 place-items-center text-2xl transition-colors hover:bg-gray-800/5 focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden"
          >
            <i className="bx bx-x" aria-hidden="true" />
          </button>
        </div>

        <nav ref={navRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-5" aria-label="Navigasi dashboard">
          <Link
            href={base}
            onClick={onClose}
            aria-current={pathname === base ? "page" : undefined}
            className={linkClass(pathname === base, false)}
          >
            Ringkasan
          </Link>

          {groups.map((group, index) => {
            const isOpen = expanded.has(group.label);
            const panelId = `${uid}-group-${index}`;
            return (
              <div key={group.label} className="border-b border-rule pb-2">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(group.label)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-mono text-xs uppercase tracking-widest2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${group.label === activeGroup ? "text-ink" : "text-mute"}`}
                >
                  {group.label}
                  <i className={`bx bx-chevron-down text-base transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {/* Tinggi dianimasikan lewat grid-rows; invisible menjaga link tertutup tidak bisa difokuskan. */}
                <div
                  id={panelId}
                  className={`grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none ${isOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-3 border-l border-rule">
                      {group.items.map((item) => {
                        const active = item.href === activeHref;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            aria-current={active ? "page" : undefined}
                            className={linkClass(active, true)}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-rule px-3 py-3 text-mute">
          <Link href="/" onClick={onClose} className={linkClass(false, false)}>Lihat website</Link>
          <Link href="/akun" onClick={onClose} className={linkClass(false, false)}>Profil saya</Link>
          <div className="px-4 py-3"><LogoutButton /></div>
        </div>
      </aside>
    </>
  );
}