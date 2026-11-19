import type { ArticleBlock } from "@/lib/types";
import { sanitizeRichText } from "@/lib/rich-text";

export default function ArticleBody({
  content,
  contentBlocks,
}: {
  content: string[];
  contentBlocks?: ArticleBlock[];
}) {
  if (!contentBlocks?.length)
    return (
      <div className="flex flex-col gap-5 text-base leading-relaxed sm:text-lg">
        {content.map((paragraph, index) => (
          <p key={index} className={index === 0 ? "drop-cap" : undefined}>
            {paragraph}
          </p>
        ))}
      </div>
    );
  return (
    <div className="flex flex-col gap-7 text-base leading-relaxed sm:text-lg">
      {contentBlocks.map((block, index) => {
        if (block.type === "text")
          return (
            block.html ? (
              <div key={block.id} className={`rich-text ${index === 0 ? "drop-cap" : ""}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.html) }} />
            ) : (
              <p key={block.id} className={`whitespace-pre-wrap ${index === 0 ? "drop-cap" : ""}`}>{block.text}</p>
            )
          );
        if (block.type === "heading")
          return (
            <h2
              key={block.id}
              className="pt-3 font-display text-2xl sm:text-3xl"
            >
              {block.text}
            </h2>
          );
        if (block.type === "image")
          return (
            <figure key={block.id} className="space-y-2">
              {block.url ? (
                <img
                  src={block.url}
                  alt={block.alt}
                  className="h-auto max-h-[620px] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gray-100 font-mono text-xs text-mute">
                  Foto belum diupload
                </div>
              )}
              {block.caption && (
                <figcaption className="font-mono text-xs text-mute">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        if (block.type === "quote")
          return (
            <blockquote
              key={block.id}
              className="border-l-4 border-gray-800 pl-5 font-display text-2xl leading-snug text-gray-800"
            >
              “{block.text}”
              {block.attribution && (
                <cite className="mt-3 block font-mono text-xs not-italic text-mute">
                  — {block.attribution}
                </cite>
              )}
            </blockquote>
          );
        if (block.type === "link")
          return (
            <a key={block.id} href={block.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 border border-rule px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:border-gray-800 hover:bg-gray-50">
              <span className="underline decoration-gray-300 underline-offset-4 group-hover:decoration-gray-800">{block.text}</span>
              <i className="bx bx-link-external shrink-0 text-xl" aria-hidden="true" />
            </a>
          );
        if (block.type === "button")
          return (
            <div key={block.id}>
              <a href={block.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
                {block.text}
              </a>
            </div>
          );
        if (block.type === "callout")
          return (
            <aside key={block.id} className="border-l-4 border-gray-800 bg-gray-100 px-5 py-4 text-gray-800">
              {block.title && <p className="mb-1 font-semibold">{block.title}</p>}
              <p className="whitespace-pre-wrap text-base">{block.text}</p>
            </aside>
          );
        return <hr key={block.id} className="border-rule" />;
      })}
    </div>
  );
}
