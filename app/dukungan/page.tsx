import type { Metadata } from "next";
import QRCode from "qrcode";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dukungan — ResponKu",
  description: "Dukung ResponKu melalui Saweria.",
};
function getSaweriaUrl(value?: string) {
  value = value?.trim();
  if (!value) return null;
  // assume the value is a URL and validate it
  try {
    const url = new URL(value);
    if (url.origin === "https://saweria.co" && !url.username && !url.password && url.pathname !== "/") {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

const leaderboardEntries = z.array(z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})).max(100);

function getPublicLeaderboard() {
  try {
    const entries = leaderboardEntries.parse(JSON.parse(process.env.SAWERIA_PUBLIC_LEADERBOARD || "[]"));
    return entries.sort((a, b) => b.amount - a.amount).slice(0, 10);
  } catch {
    return [];
  }
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function SupportPage() {
  const saweriaUrl = getSaweriaUrl(process.env.SAWERIA_URL);
  const qrDataUrl = saweriaUrl ? await QRCode.toDataURL(saweriaUrl.href, { width: 256, margin: 4 }) : null;

  const entries = getPublicLeaderboard();
  const widget = getSaweriaUrl(process.env.SAWERIA_LEADERBOARD_WIDGET_URL);
  const canOpenWidget = widget?.pathname === "/widgets/leaderboard" &&
    Boolean(widget.searchParams.get("streamKey")) &&
    isStaff((await getActor().catch(() => null))?.role);

  return (
    <div className="wrap py-10 sm:py-14">
      <section className="mx-auto max-w-2xl border border-rule bg-paper p-6 sm:p-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">Dukung ResponKu</h1>
        <p className="mt-3 text-sm leading-6 text-mute">
          Dukunganmu membantu ResponKu terus menerbitkan artikel dan menyediakan ruang bagi penulis baru.
        </p>
        {qrDataUrl && (
          <figure className="mt-6 flex flex-col items-center gap-3 border border-rule bg-white px-4 py-5">
            <figcaption className="text-sm font-medium text-ink">Pindai QR untuk membuka Saweria</figcaption>
            <img
              src={qrDataUrl}
              alt="Kode QR dukungan Saweria"
              width={256}
              height={256}
              className="aspect-square h-auto w-full max-w-64"
            />
          </figure>
        )}
        {saweriaUrl ? (
          <a
            href={saweriaUrl.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Dukung lewat Saweria
            <i className="bx bx-link-external text-lg" aria-hidden="true" />
          </a>
        ) : (
          <p className="mt-6 border-t border-rule pt-4 text-sm text-mute">
            Tautan dukungan Saweria belum tersedia.
          </p>
        )}
      </section>
      <section aria-labelledby="support-leaderboard" className="mx-auto mt-5 max-w-2xl border border-rule bg-paper p-6 sm:p-9">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="support-leaderboard" className="font-display text-2xl">Papan Dukungan</h2>
          {canOpenWidget && widget && (
            <a href={widget.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="text-sm text-blue-600 underline underline-offset-4">
              Buka leaderboard Saweria
            </a>
          )}
        </div>
        {entries.length > 0 ? (
          <ol className="mt-4 divide-y divide-rule border-t border-rule">
            {entries.map((entry, index) => (
              <li key={index} className="flex items-center gap-3 py-3 text-sm">
                <span className="w-6 shrink-0 text-mute tabular-nums">{index + 1}</span>
                <span className="min-w-0 flex-1 wrap-break-word">{entry.name}</span>
                <span className="shrink-0 font-medium tabular-nums">{rupiah.format(entry.amount)}</span>
              </li>
            ))}
          </ol>
        ) : <p className="mt-3 text-sm text-mute">Belum ada daftar dukungan yang dipublikasikan.</p>}
      </section>
    </div>
  );
}
