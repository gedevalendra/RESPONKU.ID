import { redirect } from "next/navigation";
import UserDashboard from "@/app/components/user/UserDashboard";
import ProfileSettings from "@/app/components/user/ProfileSettings";
import LogoutButton from "@/app/components/auth/LogoutButton";
import { getActor } from "@/lib/authz";
import ReadingActivityMenu from "@/app/components/user/ReadingActivityMenu";
import GoogleIndexMenu from "@/app/components/user/GoogleIndexMenu";
import { listArticleReadingHistory, listArticlesFromDatabase, listUserComments, listUserLikedArticles } from "@/lib/db";
import { publicProfile } from "@/lib/community";
import { getFunikinAiKeyStatus } from "@/lib/funikin-ai";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/akun");
  const [articles, readingHistory, likedArticles, userComments, profile, funikinAiStatus] = await Promise.all([
    listArticlesFromDatabase({ authorId: actor.id }),
    listArticleReadingHistory(actor.id),
    listUserLikedArticles(actor.id),
    listUserComments(actor.id),
    publicProfile(actor.id).catch(() => null),
    getFunikinAiKeyStatus(actor).catch(() => null),
  ]);
  const profileActor = { ...actor, avatarUrl: profile?.avatarUrl || actor.avatarUrl, backgroundUrl: profile?.backgroundUrl || actor.backgroundUrl, bio: profile?.bio || actor.bio, username: profile?.username || actor.username };
  const articleStats = {
    published: articles.filter((article) => article.status === "published").length,
    pending: articles.filter((article) => article.status === "pending").length,
    rejected: articles.filter((article) => article.status === "rejected").length,
    views: articles.reduce((total, article) => total + article.views, 0),
  };
  return (
    <div className="wrap py-8 sm:py-12">
      <div className="space-y-4">
        <ProfileSettings initial={profileActor} articleStats={articleStats} funikinAiStatus={funikinAiStatus} />
        <ReadingActivityMenu
          readingHistory={readingHistory.map((item) => ({ ...item, updatedAt: new Date(item.updatedAt).toISOString() }))}
          likedArticles={likedArticles}
          userComments={userComments}
        />
        <GoogleIndexMenu />
        <UserDashboard />
        <section aria-labelledby="account-menu-title" className="border-t border-rule pt-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="eyebrow">Pusat akun</p></div>
            <span className="hidden text-xs text-mute sm:block">Pilih menu untuk melanjutkan</span>
          </div>
          <nav aria-label="Menu akun" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["/akun/pengaturan", "Pengaturan", "Akun & organisasi", "bx-cog"],
              ["mailto:admin@responku.id?subject=Laporan%20masalah", "Laporkan masalah", "Beri tahu kami", "bx-error-circle"],
              ["/dukungan", "Dukungan", "Bantu ResponKu berkembang", "bx-heart"],
              ["/faq", "FAQ", "Jawaban cepat", "bx-help-circle"],
            ].map(([href, label, description, icon]) => (
              <a key={href} href={href} className="group flex min-h-20 items-center gap-3 border border-rule bg-paper p-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-800 "><i className={`bx ${icon} text-xl`} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">{label}</span><span className="mt-0.5 block truncate text-xs text-mute">{description}</span></span>
                <i className="bx bx-chevron-right text-xl text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
              </a>
            ))}
          </nav>
          {/* <div className="mt-4 border-t border-rule pt-4 text-center"><LogoutButton label="Keluar dari akun" /></div> */}
        </section>
      </div>
    </div>
  );
}
