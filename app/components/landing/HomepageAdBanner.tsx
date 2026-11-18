import type { HomepageAd } from "@/lib/homepage-ad";

export default function HomepageAdBanner({ ad, fitRow = false }: { ad: HomepageAd; fitRow?: boolean }) {
  return (
    <div className={`min-w-0 border border-rule bg-paper ${fitRow ? "md:absolute md:inset-0 md:flex md:flex-col" : ""}`}>
      <span className="block shrink-0 px-3 py-2 font-mono text-xs uppercase tracking-wide text-mute">Iklan</span>
      <a href={ad.destination} target="_blank" rel="sponsored noopener noreferrer" className={`block focus-visible:outline-2 focus-visible:outline-offset-2 ${fitRow ? "md:flex md:min-h-0 md:flex-1 md:flex-col" : ""}`}>
        <img src={ad.imageUrl} alt={ad.title} loading="lazy" className={`aspect-[3/1] w-full bg-gray-50 object-contain ${fitRow ? "md:aspect-auto md:min-h-0 md:flex-1" : ""}`} />
        <span className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-sm font-medium">
          <span className="line-clamp-1 wrap-break-word">{ad.title}</span>
          <i className="bx bx-link-external shrink-0" aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}
