import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { publicProfile } from "@/lib/community";
import { listArticlesFromDatabase } from "@/lib/db";
import { getActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { semua?: string };
}) {
  const profile = await publicProfile(params.id);
  if (!profile) notFound();
  if (profile.username && params.id !== profile.username)
    redirect(`/akun/${encodeURIComponent(profile.username)}`);

  const [articles, actor] = await Promise.all([
    listArticlesFromDatabase({ authorId: profile.id, status: "published" }),
    getActor(),
  ]);
  const showAll = searchParams.semua === "1";
  const visibleArticles = showAll ? articles : articles.slice(0, 3);
  const views = articles.reduce((total, article) => total + article.views, 0);
  const profileUrl = `/akun/${encodeURIComponent(profile.username || profile.id)}`;

  return (
    <div className="wrap space-y-10 py-8 sm:py-12">
      <section className="w-full overflow-hidden rounded-b-xl bg-white shadow-sm">
        <div
          className="relative h-28 bg-blue-50 bg-cover bg-center sm:h-36"
          style={profile.backgroundUrl ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined}
        />
        <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-end gap-3">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xl text-blue-500 shadow-sm">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : <i className="bx bxs-user text-3xl" aria-hidden="true" />}
              </div>
              <div className="min-w-0 pb-1 pt-10">
                <h1 className="break-words text-xl font-semibold leading-tight text-ink">
                  {profile.displayName}{" "}
                  {profile.verified && <i className="bx bxs-badge-check align-middle text-blue-500" role="img" aria-label="Terverifikasi" />}
                </h1>
                {profile.username && <p className="mt-1 truncate text-sm text-mute">@{profile.username}</p>}
              </div>
            </div>
            {actor?.id === profile.id && (
              <Link href="/akun" className="bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">Kelola profil</Link>
            )}
          </div>
          {profile.organization && (
            <span className="mt-4 inline-flex items-center gap-2 px-2 py-1 text-sm text-mute outline outline-1 outline-gray-200">
              <i className="bx bx-buildings" aria-hidden="true" />
              {profile.organization}
              <i className="bx bxs-badge-check text-gray-800" role="img" aria-label="Organisasi terverifikasi" />
            </span>
          )}
          {profile.bio && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-mute">{profile.bio}</p>}
        </div>
        <div className="grid grid-cols-2 border-t border-rule">
          {[["Artikel terbit", articles.length], ["Total views", views]].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2 px-5 py-3 sm:px-6">
              <p className="text-xs text-mute">{label}</p>
              <p className="text-base font-semibold tabular-nums text-ink">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="riwayat" className="pt-6">
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <h2 className="font-display text-display-md">Riwayat Publish</h2>
          <span className="eyebrow">{articles.length} artikel</span>
        </div>
        <div className="divide-y divide-rule">
          {visibleArticles.map((article) => (
            <article key={article.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <p className="eyebrow">Terbit · {article.category}</p>
                <h3 className="mt-1 font-display text-xl">
                  <Link href={`/artikel/${article.slug}`} className="hover:text-blue-500">{article.title}</Link>
                </h3>
                <p className="mt-1 text-sm text-mute">{article.dek}</p>
              </div>
              <Link href={`/artikel/${article.slug}`} className="text-sm text-blue-500">Baca artikel</Link>
            </article>
          ))}
          {!articles.length && <p className="py-6 text-sm text-mute">Belum ada artikel yang diterbitkan.</p>}
        </div>
        {articles.length > 3 && (
          <Link href={showAll ? profileUrl : `${profileUrl}?semua=1#riwayat`} className="mt-4 block py-3 text-center text-sm font-medium text-blue-500 hover:bg-gray-800/5">
            {showAll ? "Tampilkan lebih sedikit" : "Lihat lebih banyak"}
          </Link>
        )}
      </section>
    </div>
  );
}
