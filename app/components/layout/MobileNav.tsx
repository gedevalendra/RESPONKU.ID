"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import LogoutButton from "@/app/components/auth/LogoutButton";

function Icon({ name }: { name: "home" | "search" | "bell" | "user" }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "home")
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </svg>
    );
  if (name === "search")
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  if (name === "bell")
    return (
      <svg {...common}>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
    </svg>
  );
}

export default function MobileNav({
  authenticated = false,
  articleCategories = [],
  role,
}: {
  authenticated?: boolean;
  articleCategories?: string[];
  role?: string;
}) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const previousOverflow = useRef<string | null>(null);
  async function animateMenu(open: boolean) {
    if (!panel.current || !backdrop.current) return;
    const transform = getComputedStyle(panel.current).transform;
    const opacity = getComputedStyle(backdrop.current).opacity;
    animations.current.forEach((animation) => animation.cancel());
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : open ? 320 : 240;
    animations.current = [
      panel.current.animate([
        { transform },
        { transform: open ? "translate3d(0,0,0)" : "translate3d(0,100%,0)" },
      ], { duration, easing: open ? "cubic-bezier(0.2, 0, 0, 1)" : "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }),
      backdrop.current.animate([{ opacity }, { opacity: open ? 1 : 0 }], { duration, fill: "forwards" }),
    ];
    try {
      await Promise.all(animations.current.map((animation) => animation.finished));
      if (!open) {
        dialog.current?.close();
        if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    } catch { /* An interrupted animation continues from its current position. */ }
  }
  function closeMenu() {
    setMenuOpen(false);
    void animateMenu(false);
  }
  function openMenu() {
    if (previousOverflow.current === null) previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.current?.open) {
      animations.current.forEach((animation) => animation.cancel());
      if (panel.current) panel.current.scrollTop = 0;
      dialog.current?.showModal();
      if (dialog.current) dialog.current.scrollTop = 0;
    }
    dialog.current?.focus({ preventScroll: true });
    setMenuOpen(true);
    void animateMenu(true);
  }
  useEffect(() => {
    setMenuOpen(false);
    dialog.current?.close();
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
    previousOverflow.current = null;
  }, [pathname]);
  const exploreItems = [
    ["/artikel", "Semua artikel", "bx-news"],
    ["/artikel?sort=popular", "Terpopuler", "bx-trending-up"],
    ["/tentang", "Tentang ResponKu", "bx-info-circle"],
    ["/faq", "FAQ & bantuan", "bx-help-circle"],
  ];
  const accountItems = [
    [authenticated ? "/akun/artikel" : "/masuk?next=/akun/artikel", "Buat artikel", "bx-edit"],
    ...(authenticated ? [["/akun#riwayat", "Riwayat publish", "bx-history"], ["/akun/pengaturan", "Pengaturan akun", "bx-cog"]] : []),
  ];
  const managementItems = role === "admin" || role === "superadmin"
    ? [[role === "superadmin" ? "/superadmin" : "/admin", "Panel admin", "bx-grid-alt"]]
    : [];
  const items = [
    { href: "/", label: "Beranda", icon: "home" as const },
    { href: "/cari", label: "Cari", icon: "search" as const },
    {
      href: authenticated ? "/notifikasi" : "/masuk?next=/notifikasi",
      label: "Notifikasi",
      icon: "bell" as const,
    },
    {
      href: authenticated ? "/akun" : "/masuk?next=/akun",
      label: "Profil",
      icon: "user" as const,
    },
  ];
  const activeIndex = items.findIndex((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href.split("?")[0]),
  );
  const pillIndex = hoveredIndex ?? (activeIndex >= 0 ? activeIndex : 0);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 backdrop-blur lg:hidden"
      aria-label="Navigasi utama mobile"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="relative mx-auto flex w-full max-w-xl items-center justify-around rounded-t-4xl bg-paper px-2 py-2 shadow-sm">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 top-2 rounded-full bg-ink transition-transform duration-300 ease-out"
          style={{
            left: "0.5rem",
            width: "calc((100% - 1rem) / 5)",
            transform: `translateX(${(pillIndex >= 2 ? pillIndex + 1 : pillIndex) * 100}%)`,
          }}
        />
        {items.map((item, index) => {
          const highlighted = pillIndex === index;
          return (
            <Fragment key={item.label}>
            {index === 2 && <div className="relative z-10 flex min-w-0 flex-1 justify-center self-stretch">
              <button type="button" aria-label="Buka menu lainnya" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={openMenu} className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg ring-4 ring-white transition-transform hover:-translate-y-1">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="6" height="6" rx="1" />
                  <rect x="15" y="3" width="6" height="6" rx="1" />
                  <rect x="3" y="15" width="6" height="6" rx="1" />
                  <path d="M18 14v8M14 18h8" />
                </svg>
              </button>
            </div>}
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              className={`relative z-10 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] leading-tight font-medium transition-colors ${highlighted ? "text-paper" : "text-ink"}`}
            >
              <Icon name={item.icon} />
            </Link>
            </Fragment>
          );
        })}
      </div>
      <dialog ref={dialog} tabIndex={-1} autoFocus aria-labelledby="mobile-more-title" onCancel={(event) => { event.preventDefault(); closeMenu(); }} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }} className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 outline-none backdrop:bg-transparent">
        <div ref={backdrop} aria-hidden="true" onClick={closeMenu} className="absolute inset-0 bg-black/40 opacity-0" />
        <section ref={panel} aria-labelledby="mobile-more-title" style={{ transform: "translate3d(0,100%,0)" }} className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[80dvh] max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl will-change-transform">
          <div className="shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            <MenuGroup title="Jelajahi" items={exploreItems} onNavigate={closeMenu} />
            <MenuGroup title="Akun & tulisan" items={accountItems} onNavigate={closeMenu} />
            {managementItems.length > 0 && (
              <MenuGroup title="Pengelolaan" items={managementItems} onNavigate={closeMenu} />
            )}

            {articleCategories.length > 0 && (
              <div className="border-t border-gray-200 py-4">
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-mute">Kategori artikel</h3>
                <div className="flex flex-wrap gap-2">
                  {articleCategories.map((category) => (
                    <Link key={category} href={`/kategori/${encodeURIComponent(category.toLowerCase())}`} onClick={closeMenu} className="bg-gray-800/5 px-3 py-2 text-sm transition-colors hover:bg-gray-800/10">
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-center">
            <button type="button" onClick={closeMenu} className="w-full py-2 font-mono text-xs uppercase tracking-widest text-gray-600 transition-colors hover:bg-gray-800/5 hover:text-gray-800">
              Keluar
            </button>
          </div>
        </section>
      </dialog>
    </nav>
  );
}

function MenuGroup({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: string[][];
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-gray-200 py-4 first:border-t-0 first:pt-1">
      <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-mute">{title}</h3>
      <div className="grid grid-cols-2 gap-1">
        {items.map(([href, label, icon]) => (
          <Link key={href} href={href} onClick={onNavigate} className="flex min-h-14 items-center gap-3 px-3 py-3 text-sm transition-colors hover:bg-gray-800/5">
            <i className={`bx ${icon} text-xl text-gray-800`} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
