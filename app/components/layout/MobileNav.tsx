"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
}: {
  authenticated?: boolean;
  articleCategories?: string[];
}) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
            width: "calc((100% - 1rem) / 4)",
            transform: `translateX(${pillIndex * 100}%)`,
          }}
        />
        {items.map((item, index) => {
          const highlighted = pillIndex === index;
          return (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              className={`relative z-10 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] leading-tight font-medium transition-colors ${highlighted ? "text-paper" : "text-ink"}`}
            >
              <Icon name={item.icon} />
              <span className={highlighted ? "block" : "hidden sm:block"}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
