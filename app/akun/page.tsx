import { redirect } from "next/navigation";
import UserDashboard from "@/app/components/user/UserDashboard";
import ProfileSettings from "@/app/components/user/ProfileSettings";
import LogoutButton from "@/app/components/auth/LogoutButton";
import { getActor } from "@/lib/authz";
import Link from "next/link";
import { listArticleReadingHistory, listArticlesFromDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/akun");
  const [articles, readingHistory] = await Promise.all([listArticlesFromDatabase({ authorId: actor.id }), listArticleReadingHistory(actor.id)]);
  const unfinishedReading = readingHistory.filter((item) => item.progress < 0.96);
  const articleStats = {
    published: articles.filter((article) => article.status === "published").length,
    pending: articles.filter((article) => article.status === "pending").length,
    rejected: articles.filter((article) => article.status === "rejected").length,
    views: articles.reduce((total, article) => total + article.views, 0),
  };
  return (
    <div className="wrap py-8 sm:py-12">
      <div className="space-y-10">
        <ProfileSettings initial={actor} articleStats={articleStats} />
        <section className="grid gap-5 lg:grid-cols-2">
          <ReadingList title="Lanjutkan membaca" items={unfinishedReading} empty="Belum ada bacaan yang belum selesai." />
          <ReadingList title="Semua bacaan" items={readingHistory} empty="Belum ada riwayat bacaan." />
        </section>
        <UserDashboard />
        <nav aria-label="Menu akun" className="divide-y divide-rule border-y border-rule text-center">
          {[
            ["/akun/pengaturan", "Pengaturan akun & organisasi"],
            [`/akun/${encodeURIComponent(actor.username || actor.id)}`, "Lihat profil publik"],
            ["/akun/artikel", "Kelola artikel"],
            ["mailto:admin@responku.id?subject=Laporan%20masalah", "Laporkan masalah"],
            ["/dukungan", "Dukungan"],
            ["/faq", "FAQ"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="block px-6 py-4 text-sm text-mute transition-colors hover:bg-gray-800/5 hover:text-ink">
              {label}
            </a>
          ))}
          <div className="px-6 py-4 transition-colors hover:bg-gray-800/5"><LogoutButton /></div>
        </nav>
      </div>
    </div>
  );
}

function ReadingList({ title, items, empty }: { title: string; items: Awaited<ReturnType<typeof listArticleReadingHistory>>; empty: string }) {
  return <section className="min-w-0 rounded-t-xl border border-rule bg-paper p-5 shadow-sm">
    <h2 className="border-b border-rule pb-3 font-display text-xl">{title}</h2>
    {items.length ? <ul className="divide-y divide-rule">{items.slice(0, 5).map((item) => <li key={item.article.slug} className="py-3"><Link href={`/artikel/${encodeURIComponent(item.article.slug)}`} className="group flex gap-3"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium group-hover:underline">{item.article.title}</p><p className="mt-1 text-xs text-mute">{Math.floor(item.progress * 100)}% dibaca{item.anchorText ? ` · “${item.anchorText.slice(0, 54)}…”` : ""}</p></div>{item.article.thumbnailUrl && <img src={item.article.thumbnailUrl} alt="" className="size-12 shrink-0 object-cover" />}</Link></li>)}</ul> : <p className="py-5 text-sm text-mute">{empty}</p>}
  </section>;
}
