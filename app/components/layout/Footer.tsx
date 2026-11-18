import BrandLogo from "@/app/components/layout/BrandLogo";
import Link from "next/link";
import { CookieSettingsButton } from "./CookieConsent";

const columns = [
  {
    title: "Jelajahi",
    links: [
      { label: "Artikel terbaru", href: "/artikel" },
      { label: "Tentang ResponKu", href: "/tentang" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Tulis artikel", href: "/buat-artikel-gratis" },
      { label: "FAQ & Bantuan", href: "/faq" },
      { label: "Dukungan", href: "/dukungan" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-gray-50/50">
      <div className="wrap py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1.4fr)_1fr_1fr] sm:gap-12">
        <div>
          <Link href="/" aria-label="ResponKu — Beranda" className="inline-block">
            <BrandLogo className="h-8" />
          </Link>
          <p className="mt-4 max-w-[28ch] text-sm leading-6 text-mute">
            Kabar hari ini, ditulis dengan jelas.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-mute transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        </div>
        <div className="mt-9 flex flex-col gap-3 border-t border-rule pt-5 text-sm text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ResponKu</p>
          <CookieSettingsButton className="m-0" />
        </div>
      </div>
    </footer>
  );
}
