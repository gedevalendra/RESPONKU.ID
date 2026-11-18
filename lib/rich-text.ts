const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "S", "BR", "P", "DIV", "OL", "UL", "LI", "A", "FONT"]);

export function sanitizeRichText(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toUpperCase();
      if (!allowedTags.has(tag)) return "";
      if (full.startsWith("</")) return `</${tag.toLowerCase()}>`;
      if (tag === "BR") return "<br>";
      const style = rawAttrs.match(/style\s*=\s*["']([^"']*)["']/i)?.[1] || "";
      const safeStyle = style
        .split(";")
        .map((rule) => rule.trim())
        .filter((rule) => /^(text-align\s*:\s*(left|center|right|justify)|color\s*:\s*#[0-9a-f]{3,8})$/i.test(rule))
        .join(";");
      const color = rawAttrs.match(/color\s*=\s*["'](#[0-9a-f]{3,8})["']/i)?.[1];
      const href = rawAttrs.match(/href\s*=\s*["'](https?:\/\/[^"']+)["']/i)?.[1];
      const attributes = [safeStyle && `style="${safeStyle}"`, color && `color="${color}"`, href && `href="${href}" target="_blank" rel="noopener noreferrer"`].filter(Boolean).join(" ");
      return `<${tag.toLowerCase()}${attributes ? ` ${attributes}` : ""}>`;
    });
}

export function stripRichText(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}
