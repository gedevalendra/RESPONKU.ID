export const siteOrigin = new URL(process.env.SITE_URL || "https://www.responku.id").origin;

export const siteIconPath = "/image/search-logo.png";

export const siteOrganization = {
  "@type": "Organization",
  "@id": `${siteOrigin}/#organization`,
  name: "ResponKu",
  url: `${siteOrigin}/`,
  logo: {
    "@type": "ImageObject",
    url: new URL(siteIconPath, siteOrigin).href,
    width: 144,
    height: 144,
  },
};

export const websiteCover = {
  url: new URL("/image/web_cover.png", siteOrigin).href,
  width: 2602,
  height: 990,
  alt: "ResponKu",
};

export function articleUrl(slug: string) {
  return new URL(`/artikel/${encodeURIComponent(slug)}`, siteOrigin).href;
}

export function publicationDate(article: { publishedAt?: string; date: string }) {
  for (const value of [article.publishedAt, article.date]) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }
}

export function articleImageUrl(value: string) {
  if (!value) return;
  try {
    const url = new URL(value, siteOrigin);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return undefined;
  }
}
