import Link from "next/link";
import { categories } from "@/lib/content";

const categorySlug: Record<string, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};

const columns = [
  {
    title: "Kanal",
    links: categories.map((c) => ({
      label: c,
      href: `/kategori/${categorySlug[c]}`,
    })),
  },
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
      <div className="wrap grid grid-cols-2 gap-y-10 py-14 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <span className="font-display text-3xl">
            ResponKu<span className="text-mute">.</span>
          </span>
          <p className="mt-3 max-w-[22ch] text-sm text-mute">
            Kabar hari ini, ditulis dengan jelas.
          </p>
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
