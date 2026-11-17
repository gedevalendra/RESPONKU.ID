import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelated, formatDate } from "@/lib/data";
import CategoryBadge from "../../components/landing/CategoryBadge";
import ArticleCard from "../../components/landing/ArticleCard";
import Sidebar from "../../components/layout/Sidebar";
import ArticleEngagement from "../../components/article/ArticleEngagement";
import { getArticleFromDatabase } from "@/lib/db";
import ArticleBody from "@/app/components/article/ArticleBody";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "Artikel Tidak Ditemukan — WARTA." };
  return {
    title: `${article.title} — WARTA.`,
    description: article.dek,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticleFromDatabase(params.slug);
  if (!article) notFound();

  const related = await getRelated(article, 3);

  return (
    <article className="wrap py-8 sm:py-12">
      <Link href="/" className="eyebrow hover:text-ink">
        ← Kembali ke Beranda
      </Link>

      <div className="mt-6 max-w-3xl">
        {article.breaking && (
          <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest2 text-signal">
            <span
              className="h-1.5 w-1.5 rounded-full bg-signal"
              aria-hidden="true"
            />
            Breaking
          </span>
        )}
        <CategoryBadge category={article.category} />
        <h1 className="mt-3 font-display text-display-lg">{article.title}</h1>
        <p className="mt-4 text-lg text-mute">{article.dek}</p>
        <p className="mt-5 font-mono text-[11px] text-mute">
          Oleh {article.authorId ? <a href={`/akun/${article.authorId}`} className="hover:text-blue-500">{article.author}</a> : article.author} · {formatDate(article.date)} ·{" "}
          {article.readTime} menit baca
        </p>
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
