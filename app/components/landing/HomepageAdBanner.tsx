import type { HomepageAd } from "@/lib/homepage-ad";

function youtubeEmbedUrl(value: string) {
  const playerParams = (id: string) => new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    rel: "0",
    modestbranding: "1",
  }).toString();
  const embed = (id: string) => ({
    url: `https://www.youtube.com/embed/${encodeURIComponent(id)}?${playerParams(id)}`,
    poster: `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`,
  });
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return embed(id);
    }
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed\/|shorts\/)([^/]+)/)?.[1];
      if (id) return embed(id);
    }
  } catch {
    return null;
  }
  return null;
}

export default function HomepageAdBanner({ ad, fitRow = false, compact = false, variant = "horizontal", fillAvailableHeight = false, fillColumnHeight = false, sidebarCompact = false }: { ad: HomepageAd; fitRow?: boolean; compact?: boolean; variant?: "horizontal" | "sidebar"; fillAvailableHeight?: boolean; fillColumnHeight?: boolean; sidebarCompact?: boolean }) {
  const youtubeEmbed = ad.mediaType === "video" ? youtubeEmbedUrl(ad.videoUrl) : null;
  const sidebar = variant === "sidebar";
  const fillClass = fitRow
    ? "md:absolute md:inset-0 md:flex md:flex-col"
    : fillAvailableHeight ? "lg:absolute lg:inset-0 lg:flex lg:flex-col" : "";
  const mediaFillClass = fitRow
    ? "md:aspect-auto md:max-h-none md:min-h-0 md:flex-1"
    : fillAvailableHeight ? "lg:aspect-auto lg:max-h-none lg:min-h-0 lg:flex-1" : "";
  const mediaClass = sidebar ? (sidebarCompact ? "aspect-video w-full md:min-h-0 md:flex-1 md:aspect-auto" : "aspect-video min-h-0 w-full lg:aspect-auto lg:flex-1") : `${compact ? "aspect-[6/1] max-h-28" : "aspect-[3/1]"} ${mediaFillClass}`;
  return (
    <div className={`min-w-0 border border-rule bg-paper ${sidebar ? `flex flex-col ${sidebarCompact ? "overflow-hidden md:h-80 md:max-h-80" : "lg:aspect-[1/2]"} ${fillColumnHeight ? "lg:aspect-auto lg:min-h-0 lg:flex-1" : ""}` : ""} ${fillClass}`}>
      <span className="block shrink-0 px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">Iklan</span>
      <a href={ad.destination} target="_blank" rel="sponsored noopener noreferrer" className={`block focus-visible:outline-2 focus-visible:outline-offset-2 ${sidebar ? "flex min-h-0 flex-1 flex-col" : ""} ${fitRow ? "md:flex md:min-h-0 md:flex-1 md:flex-col" : ""} ${fillAvailableHeight ? "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col" : ""}`}>
        {ad.mediaType === "video" ? (
          youtubeEmbed ? (
            <span className={`relative block w-full overflow-hidden bg-black ${mediaClass}`}>
              <iframe src={youtubeEmbed.url} title={ad.title} loading="lazy" tabIndex={-1} allow="autoplay; encrypted-media" className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-black" />
              <span aria-hidden="true" className="youtube-start-cover pointer-events-none absolute inset-0 bg-black bg-cover bg-center" style={{ backgroundImage: `url(${youtubeEmbed.poster})` }} />
            </span>
          ) : (
            <video src={ad.videoUrl} autoPlay muted loop playsInline preload="metadata" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} className={`w-full bg-black object-contain ${mediaClass}`} />
          )
        ) : (
          <img src={ad.imageUrl} alt={ad.title} loading="lazy" className={`w-full bg-gray-50 ${sidebar ? `${mediaClass} object-cover` : `object-contain ${compact ? "aspect-[6/1] max-h-28" : "aspect-[3/1]"} ${mediaFillClass}`}`} />
        )}
        <span className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-sm font-medium">
          <span className="line-clamp-1 wrap-break-word">{ad.title}</span>
          <i className="bx bx-link-external shrink-0" aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}
