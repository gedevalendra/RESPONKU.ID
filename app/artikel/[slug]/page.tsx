import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { articleImageUrl, articleUrl, publicationDate, siteOrganization, siteOrigin } from "@/lib/seo";
import { getRelated, formatDate } from "@/lib/data";
import ArticleCard from "../../components/landing/ArticleCard";
import Sidebar from "../../components/layout/Sidebar";
import ArticleEngagement from "../../components/article/ArticleEngagement";
import { getArticleFromDatabase, getReactionSummary, listComments } from "@/lib/db";
import ArticleBody from "@/app/components/article/ArticleBody";
import ShareArticleButton from "@/app/components/article/ShareArticleButton";
import ArticleViewCounter from "@/app/components/article/ArticleViewCounter";
import { publicProfile } from "@/lib/community";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const getPublicArticle = cache(getArticleFromDatabase);

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getPublicArticle(params.slug);
  if (!article) return { title: "Artikel Tidak Ditemukan — ResponKu", robots: { index: false } };
  const url = articleUrl(article.slug);
  const shareImage = new URL(`/api/articles/${encodeURIComponent(article.slug)}/share-image`, siteOrigin).href;
  return {
    title: `${article.title} — ResponKu`,
    description: article.dek,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "ResponKu",
      locale: "id_ID",
      title: article.title,
      description: article.dek,
      publishedTime: publicationDate(article)?.toISOString(),
      images: [{ url: shareImage, width: 1200, height: 1200, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek,
      images: [shareImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getPublicArticle(params.slug);
  if (!article) notFound();

  const related = await getRelated(article, 3);
  const profileDb = getSupabaseAdmin();
  type AuthorProfile = {
    id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
    role: string;
    bio: string | null;
  };
  const profileFields = "id,display_name,username,avatar_url,role,bio";
  let authorProfile: AuthorProfile | null = null;
  if (profileDb && article.authorEmail) {
    const result = await profileDb
      .from("profiles")
      .select(profileFields)
      .eq("email", article.authorEmail)
      .limit(1)
      .maybeSingle();
    authorProfile = result.data as AuthorProfile | null;
  }
  if (profileDb && !authorProfile && article.authorId && /^[0-9a-f-]{36}$/i.test(article.authorId)) {
    const result = await profileDb
      .from("profiles")
      .select(profileFields)
      .eq("id", article.authorId)
      .maybeSingle();
    authorProfile = result.data as AuthorProfile | null;
  }
  if (profileDb && !authorProfile) {
    const result = await profileDb
      .from("profiles")
      .select(profileFields)
      .eq("display_name", article.author)
      .limit(1)
      .maybeSingle();
    authorProfile = result.data as AuthorProfile | null;
  }
  const profileLookupId = article.authorId || authorProfile?.id;
  const linkedProfile = profileLookupId
    ? await publicProfile(profileLookupId).catch(() => null)
    : null;
  const authorRole = authorProfile?.role || linkedProfile?.role || "";
  const roleLabel = authorRole === "superadmin" ? "Superadmin" : authorRole === "admin" ? "Redaksi" : "Penulis";
  const authorVerified = Boolean(linkedProfile?.verified);
  const isUserArticle = ["reader", "author", "user"].includes(authorRole);
  const authorAvatar = authorProfile?.avatar_url || linkedProfile?.avatarUrl;
  const authorProfileHref = article.authorId || authorProfile?.id;
  const [reactionSummary, articleComments] = await Promise.all([
    getReactionSummary(article.slug).catch(() => ({ like: 0, insightful: 0, celebrate: 0 })),
    listComments(article.slug).catch(() => []),
  ]);

  const url = articleUrl(article.slug);
  const image = articleImageUrl(article.thumbnailUrl);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: url,
    headline: article.title,
    description: article.dek,
    image: image ? [image] : undefined,
    datePublished: publicationDate(article)?.toISOString(),
    author: {
      "@type": "Person",
      name: article.author,
      url: authorProfileHref ? `${siteOrigin}/akun/${encodeURIComponent(authorProfileHref)}` : undefined,
    },
    publisher: siteOrganization,
    articleSection: article.category,
    inLanguage: "id",
  };
  return (
    <article className="wrap py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Link href="/" className="eyebrow hover:text-ink">
        <i className="bx bx-arrow-back mr-1" aria-hidden="true" /> Kembali ke Beranda
      </Link>

      <div className="mt-6 max-w-5xl">
        {article.breaking && (
          <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest2 text-signal">
            <span
              className="h-1.5 w-1.5 rounded-full bg-signal"
              aria-hidden="true"
            />
            Breaking
          </span>
        )}
        <h1 className="mt-3 max-w-5xl font-display text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 max-w-4xl text-lg text-mute">{article.dek}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="group relative flex w-fit flex-wrap items-center gap-x-2.5 gap-y-2">
          <a href={authorProfileHref ? `/akun/${authorProfileHref}` : "#"} className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-blue-50 font-display text-sm text-blue-600">
              {authorAvatar ? <img src={authorAvatar} alt="" className="h-full w-full object-cover" /> : <i className="bx bxs-user text-lg" aria-hidden="true" />}
            </span>
            <strong className="text-sm font-semibold leading-none text-ink">{article.author}</strong>
            {authorVerified && <i className="bx bxs-badge-check -ml-1 text-lg leading-none text-blue-500" title="Akun terverifikasi" aria-label="Akun terverifikasi" />}
          </a>
          <span aria-hidden="true" className="text-xs text-mute">·</span>
          <span className="text-xs leading-none text-mute">{formatDate(article.date)}</span>
          <span aria-hidden="true" className="text-xs text-mute">·</span>
          <span className="text-xs leading-none text-mute">{article.readTime} menit baca</span>
          <ArticleViewCounter articleSlug={article.slug} initialViews={article.views} />
          <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-72 translate-y-2 rounded-xl border border-rule bg-white p-4 opacity-0 shadow-xl transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50 text-blue-600">{authorAvatar ? <img src={authorAvatar} alt="" className="h-full w-full object-cover" /> : <i className="bx bxs-user text-2xl" aria-hidden="true" />}</span><div className="min-w-0"><p className="flex items-center gap-1 text-base font-semibold">{article.author} {authorVerified && <i className="bx bxs-badge-check text-lg text-blue-500" title="Akun terverifikasi" aria-label="Akun terverifikasi" />}</p><p className="mt-0.5 truncate text-xs text-mute">{roleLabel}{authorProfile?.username ? ` · @${authorProfile.username}` : ""}</p></div></div>
            {authorProfile?.bio && <p className="mt-3 text-sm leading-relaxed text-mute">{authorProfile.bio}</p>}
            {authorProfileHref && <a href={`/akun/${authorProfileHref}`} className="mt-3 inline-flex items-center text-sm font-medium text-blue-500">Lihat profil <i className="bx bx-right-arrow-alt ml-1 text-base" aria-hidden="true" /></a>}
          </div>
        </div>
          <ShareArticleButton
            title={article.title}
            slug={article.slug}
            dek={article.dek}
            author={article.author}
            publishedLabel={formatDate(article.date)}
            imageUrl={image}
            likeCount={reactionSummary.like}
            commentCount={articleComments.length}
          />
        </div>
        {isUserArticle && (
          <aside className="mt-6 flex max-w-4xl items-start gap-3 border border-rule bg-gray-50 p-4 text-sm leading-6 text-mute" role="note">
            <i className="bx bx-info-circle mt-0.5 shrink-0 text-xl text-ink" aria-hidden="true" />
            <p>
              Berita ini diterbitkan oleh <strong className="font-semibold text-ink">{article.author}</strong>. Isi dan segala pertanggungjawaban atas artikel ini berada pada <strong className="font-semibold text-ink">{article.author}</strong>.
            </p>
          </aside>
        )}
      </div>

      {article.thumbnailUrl ? (
        <img
          src={article.thumbnailUrl}
          alt={`Thumbnail: ${article.title}`}
          className="mt-8 aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
        />
      ) : (
        <div
          className="photo-tone mt-8 aspect-[16/9] w-full sm:aspect-[21/9]"
          aria-hidden="true"
        />
      )}

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-5 text-base leading-relaxed sm:text-lg">
            <ArticleBody
              content={article.content}
              contentBlocks={article.contentBlocks}
            />
          </div>

          <ArticleEngagement articleSlug={article.slug} />

          {related.length > 0 && (
            <div className="mt-16 border-t border-rule pt-8">
              <h2 className="border-b border-ink pb-3 font-display text-display-md">
                Berita Terkait
              </h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 pt-8 sm:grid-cols-3">
                {related.map((item) => (
                  <ArticleCard key={item.id} article={item} variant="stacked" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <Sidebar />
        </div>
      </div>
    </article>
  );
}
