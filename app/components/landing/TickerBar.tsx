export default function TickerBar({ headlines }: { headlines: string[] }) {
  const items = headlines.length > 0 ? headlines : ["ResponKu — berita terbaru dan suara publik"];
  // duplicate once so the marquee loops seamlessly at -50%
  const loop = [...items, ...items];

  return (
    <div className="hairline-y border-ink bg-ink text-paper">
      <div className="wrap flex items-stretch">
        <span className="eyebrow shrink-0 border-r border-paper/25 py-2.5 pr-4 text-paper/70">
          Terkini
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker items-center py-2.5 motion-reduce:animate-none">
            {loop.map((headline, i) => (
              <span
                key={i}
                className="flex items-center whitespace-nowrap font-mono text-xs"
              >
                <span className="mx-4 text-paper/40">·</span>
                {headline}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
