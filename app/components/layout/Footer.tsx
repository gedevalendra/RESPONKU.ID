import BrandLogo from "@/app/components/layout/BrandLogo";
import Link from "next/link";
import { CookieSettingsButton } from "./CookieConsent";

const columns = [
  {
    title: "Redaksi",
    links: [
      { label: "Tentang Kami", href: "/tentang" },
      { label: "Pedoman Media Siber", href: "/pedoman" },
      { label: "Karier", href: "/karier" },
      { label: "Hubungi Redaksi", href: "/kontak" },
    ],
  },
  {
    title: "Layanan",
    links: [
      { label: "FAQ & Bantuan", href: "/faq" },
      { label: "Dukungan", href: "/dukungan" },
      { label: "Berlangganan", href: "/berlangganan" },
      { label: "Iklan", href: "/iklan" },
      { label: "Indeks Berita", href: "/indeks" },
      { label: "Koreksi", href: "/koreksi" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="rule-thick border-t border-rule">
      <div className="wrap grid grid-cols-2 gap-y-10 py-14 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <BrandLogo className="h-9" />
          <p className="mt-3 max-w-[22ch] text-sm text-mute">
            Kabar hari ini, ditulis dengan jelas.
          </p>
          <CookieSettingsButton />
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
