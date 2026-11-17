import { redirect } from "next/navigation";
import UserDashboard from "@/app/components/user/UserDashboard";
import ProfileSettings from "@/app/components/user/ProfileSettings";
import LogoutButton from "@/app/components/auth/LogoutButton";
import { getActor } from "@/lib/authz";
import { listArticlesFromDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/akun");
  const articles = await listArticlesFromDatabase({ authorId: actor.id });
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
        <UserDashboard />
        <nav aria-label="Menu akun" className="divide-y divide-rule border-y border-rule text-center">
          {[
            ["/akun/pengaturan", "Pengaturan akun & organisasi"],
            [`/akun/${encodeURIComponent(actor.username || actor.id)}`, "Lihat profil publik"],
            ["/akun/artikel", "Kelola artikel"],
            ["mailto:admin@responku.id?subject=Laporan%20masalah", "Laporkan masalah"],
            ["/tentang#dukungan", "Dukungan"],
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
