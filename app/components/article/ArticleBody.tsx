import type { ArticleBlock } from "@/lib/types";

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
            <p key={block.id} className={index === 0 ? "drop-cap" : undefined}>
              {block.text}
            </p>
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
              className="border-l-4 border-blue-500 pl-5 font-display text-2xl leading-snug text-gray-800"
            >
              “{block.text}”
              {block.attribution && (
                <cite className="mt-3 block font-mono text-xs not-italic text-mute">
                  — {block.attribution}
                </cite>
              )}
            </blockquote>
          );
        return <hr key={block.id} className="border-rule" />;
      })}
    </div>
  );
}
