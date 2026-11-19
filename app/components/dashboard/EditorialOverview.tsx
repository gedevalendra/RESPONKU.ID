import Link from "next/link";
import { getMongoDb } from "@/lib/mongodb";
import type { Article } from "@/lib/types";
import { getAiUsageSummary } from "@/lib/ai-usage";
import AiUsagePanel from "@/app/components/dashboard/AiUsagePanel";

type Overview = {
  totals: { _id: string; count: number; views: number }[];
  queue: Pick<Article, "id" | "title" | "author">[];
  popular: Pick<Article, "id" | "title" | "slug" | "views">[];
};

export default async function EditorialOverview({ role }: { role: "admin" | "superadmin" }) {
  const base = `/${role}`;
  const db = await getMongoDb();
  const [data, aiUsage] = await Promise.all([db?.collection("articles").aggregate<Overview>([
    { $facet: {
      totals: [{ $group: { _id: "$status", count: { $sum: 1 }, views: { $sum: "$views" } } }],
      queue: [{ $match: { status: "pending" } }, { $sort: { submittedAt: 1, _id: 1 } }, { $limit: 5 }, { $project: { id: 1, title: 1, author: 1 } }],
      popular: [{ $match: { status: "published" } }, { $sort: { views: -1, _id: 1 } }, { $limit: 5 }, { $project: { id: 1, title: 1, slug: 1, views: 1 } }],
    } },
  ]).next().catch(() => null), getAiUsageSummary(null)]);
  const published = data?.totals.find((row) => row._id === "published");
  const format = new Intl.NumberFormat("id-ID");
  const stats = [
    ["Artikel terbit", published?.count ?? 0, "bx-news"],
    ["Menunggu review", data?.totals.find((row) => row._id === "pending")?.count ?? 0, "bx-time-five"],
    ["Draf", data?.totals.find((row) => row._id === "draft")?.count ?? 0, "bx-edit"],
    ["Tayangan artikel terbit", published?.views ?? 0, "bx-show"],
  ] as const;
  const shortcuts = [
    ["Approval artikel", `${base}/artikel`, "bx-check-square"],
    ["Moderasi komentar", `${base}/komentar`, "bx-message-square-detail"],
    role === "admin" ? ["Kelola artikel terbit", "/admin/artikel/terbit", "bx-news"] : ["Manajemen pengguna", "/superadmin/pengguna", "bx-group"],
    ["Kirim notifikasi", "/admin/notifikasi", "bx-bell"],
  ];

  return (
    <div className="space-y-6">
      {!data && <p role="status" className="border border-rule bg-paper p-3 text-sm text-mute">Ringkasan artikel belum dapat dimuat.</p>}
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(([label, value, icon]) => (
          <div key={label} className="border border-rule bg-paper p-4 sm:p-5">
            <dt className="flex items-center gap-2 text-sm text-mute"><i className={`bx ${icon} text-lg`} aria-hidden="true" />{label}</dt>
            <dd className="mt-2 font-display text-3xl tabular-nums">{data ? format.format(value) : "—"}</dd>
          </div>
        ))}
      </dl>
      <section className="border border-rule bg-paper p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
            <div>
              <p className="eyebrow">Pemakaian AI</p>
              <h2 className="mt-1 font-display text-xl">Riwayat penggunaan token</h2>
            </div>
            <i className="bx bx-chip text-2xl text-mute" aria-hidden="true" />
          </div>
          {aiUsage ? (
            <AiUsagePanel usage={aiUsage} />
          ) : <p className="py-5 text-sm text-mute">Statistik AI belum dapat dimuat.</p>}
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="min-w-0 border border-rule bg-paper p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
            <h2 className="font-display text-xl">Antrean editorial</h2>
            <Link href={`${base}/artikel`} className="text-sm underline underline-offset-4">Buka approval</Link>
          </div>
          {data && (data.queue.length ? <ul className="divide-y divide-rule">
            {data.queue.map((item) => <li key={item.id} className="py-3">
              <p className="break-words text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-mute">{item.author}</p>
            </li>)}
          </ul> : <p className="py-4 text-sm text-mute">Tidak ada naskah menunggu review.</p>)}
        </section>
        <section className="min-w-0 border border-rule bg-paper p-4 sm:p-5">
          <h2 className="border-b border-rule pb-3 font-display text-xl">Paling banyak ditayangkan</h2>
          {data && (data.popular.length ? <ol className="divide-y divide-rule">
            {data.popular.map((item) => <li key={item.id} className="flex items-baseline justify-between gap-3 py-3">
              <Link href={`/artikel/${encodeURIComponent(item.slug)}`} className="min-w-0 break-words text-sm font-medium hover:underline">{item.title}</Link>
              <span className="shrink-0 text-xs text-mute">{format.format(item.views ?? 0)} tayangan</span>
            </li>)}
          </ol> : <p className="py-4 text-sm text-mute">Belum ada artikel terbit.</p>)}
        </section>
      </div>
      <section>
        <h2 className="mb-3 font-display text-xl">Akses cepat</h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map(([label, href, icon]) => (
            <Link key={href} href={href} className="flex min-h-12 items-center gap-2 border border-rule bg-paper px-3 py-2 text-sm font-medium hover:bg-gray-100">
              <i className={`bx ${icon} text-lg`} aria-hidden="true" />{label}
              <i className="bx bx-right-arrow-alt ml-auto text-lg" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
