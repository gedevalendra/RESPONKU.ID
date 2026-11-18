import PublicationHistoryTable from "@/app/components/admin/PublicationHistoryTable";
import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";
import { listArticlesFromDatabase } from "@/lib/db";
import { categories } from "@/lib/content";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("id-ID");
const monthKey = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta",
});
const monthLabel = new Intl.DateTimeFormat("id-ID", {
  month: "short", year: "numeric", timeZone: "Asia/Jakarta",
});

export default async function PublicationHistory({ searchParams }: { searchParams: { q?: string } }) {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/riwayat-penerbitan");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");

  const history = await listArticlesFromDatabase({
    $or: [{ status: "published" }, { publishedAt: { $type: "string" } }, { takenDownAt: { $type: "string" } }],
  });
  const published = history.filter((article) => article.status === "published");
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const rows = history
    .filter((article) => `${article.title} ${article.author}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Date.parse(b.publishedAt ?? b.date) - Date.parse(a.publishedAt ?? a.date));
  const categoryCounts = categories.map((category) => ({
    label: category,
    count: published.filter((article) => article.category === category).length,
  }));
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 15)),
  );
  const monthlyCounts = months.map((month) => ({
    label: monthLabel.format(month),
    count: history.filter((article) => {
      if (!article.publishedAt) return false;
      const date = new Date(article.publishedAt);
      return Number.isFinite(date.getTime()) && monthKey.format(date) === monthKey.format(month);
    }).length,
  }));

  return (
    <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"}
      breadcrumb="Riwayat penerbitan" title="Riwayat penerbitan"
    >
      <dl className="grid gap-3 sm:grid-cols-3">
        {([
          ["Sedang terbit", published.length],
          ["Sudah ditarik", history.filter((article) => article.status !== "published").length],
          ["Total tayangan", history.reduce((total, article) => total + (article.views ?? 0), 0)],
        ] as const).map(([label, value]) => (
          <div key={label} className="border border-rule bg-paper p-4">
            <dt className="text-sm text-mute">{label}</dt>
            <dd className="mt-2 font-display text-3xl">{number.format(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <BarChart title="Penerbitan per bulan" bars={monthlyCounts} note="Enam bulan terakhir. Menggunakan tanggal terbit yang tercatat." />
        <BarChart title="Artikel terbit per kategori" bars={categoryCounts} />
      </div>
      <section className="mt-6 border border-rule bg-paper p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Daftar penerbitan</h2>
          <form className="flex max-w-full gap-2" role="search">
            <input name="q" type="search" defaultValue={query} aria-label="Cari judul atau penulis" placeholder="Judul atau penulis" className="min-w-0 px-3 py-2 text-sm" />
            <button className="bg-ink px-3 text-sm text-paper">Cari</button>
          </form>
        </div>
        {rows.length ? (
          <PublicationHistoryTable canDelete={actor.role === "admin"} rows={rows.map(
            ({ id, slug, title, author, category, publishedAt, date, status, views }) =>
              ({ id, slug, title, author, category, publishedAt, date, status, views }),
          )} />
        ) : <p className="mt-4 text-sm text-mute">Tidak ada artikel yang cocok.</p>}
      </section>
    </DashboardShell>
  );
}

function BarChart({ title, bars, note }: { title: string; bars: { label: string; count: number }[]; note?: string }) {
  const maximum = Math.max(1, ...bars.map((bar) => bar.count));
  return (
    <section className="border border-rule bg-paper p-4 sm:p-5">
      <h2 className="font-display text-xl">{title}</h2>
      {note && <p className="mt-1 text-xs text-mute">{note}</p>}
      <ul className="mt-4 grid gap-3">
        {bars.map(({ label, count }) => (
          <li key={label} className="grid grid-cols-[6rem_1fr_auto] items-center gap-2 text-xs">
            <span>{label}</span>
            <span aria-hidden="true" className="h-2 bg-gray-100"><span className="block h-full bg-ink" style={{ width: `${count / maximum * 100}%` }} /></span>
            <span className="min-w-5 text-right tabular-nums">{number.format(count)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
