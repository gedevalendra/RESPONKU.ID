import Link from "next/link";

export default function SectionHeading({
  title,
  href,
  index,
}: {
  title: string;
  href?: string;
  /** Two-digit-style order label, e.g. "01". Only pass this when order is real (section sequence). */
  index?: string;
}) {
  return (
    <div className="flex items-end justify-between border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 font-display text-display-md">
        {index && <span className="font-mono text-sm text-mute">{index}</span>}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="eyebrow shrink-0 hover:text-ink transition-colors"
        >
          Semua {title} →
        </Link>
      )}
    </div>
  );
}
