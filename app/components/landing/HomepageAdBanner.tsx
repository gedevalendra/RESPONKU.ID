import type { HomepageAd } from "@/lib/homepage-ad";

function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1).split("/")[0]}?autoplay=1&mute=1&playsinline=1`;
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed\/|shorts\/)([^/]+)/)?.[1];
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function HomepageAdBanner({ ad, fitRow = false, compact = false }: { ad: HomepageAd; fitRow?: boolean; compact?: boolean }) {
  const embedUrl = ad.mediaType === "video" ? youtubeEmbedUrl(ad.videoUrl) : null;
  return (
    <div className={`min-w-0 border border-rule bg-paper ${fitRow ? "md:absolute md:inset-0 md:flex md:flex-col" : ""}`}>
      <span className="block shrink-0 px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">Iklan</span>
      <a href={ad.destination} target="_blank" rel="sponsored noopener noreferrer" className={`block focus-visible:outline-2 focus-visible:outline-offset-2 ${fitRow ? "md:flex md:min-h-0 md:flex-1 md:flex-col" : ""}`}>
        {ad.mediaType === "video" ? (
          embedUrl ? (
            <iframe src={embedUrl} title={ad.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className={`w-full border-0 bg-black ${compact ? "aspect-[6/1] max-h-28" : "aspect-[3/1]"} ${fitRow ? "md:aspect-auto md:min-h-0 md:flex-1" : ""}`} />
          ) : (
            <video src={ad.videoUrl} autoPlay muted loop playsInline preload="metadata" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} className={`w-full bg-black object-contain ${compact ? "aspect-[6/1] max-h-28" : "aspect-[3/1]"} ${fitRow ? "md:aspect-auto md:min-h-0 md:flex-1" : ""}`} />
          )
        ) : (
          <img src={ad.imageUrl} alt={ad.title} loading="lazy" className={`w-full bg-gray-50 object-contain ${compact ? "aspect-[6/1] max-h-28" : "aspect-[3/1]"} ${fitRow ? "md:aspect-auto md:min-h-0 md:flex-1" : ""}`} />
        )}
        <span className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-sm font-medium">
          <span className="line-clamp-1 wrap-break-word">{ad.title}</span>
          <i className="bx bx-link-external shrink-0" aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}
