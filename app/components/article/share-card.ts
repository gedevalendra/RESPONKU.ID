export type ShareCardData = {
  title: string;
  author: string;
  views: number;
  likes: number | null;
  shares: number;
};

export function drawShareCard(data: ShareCardData, story: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = story ? 1920 : 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gambar tidak dapat dibuat");

  const gradient = ctx.createLinearGradient(0, 0, 1080, canvas.height);
  gradient.addColorStop(0, "#182338");
  gradient.addColorStop(1, "#294d84");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const top = story ? 330 : 140;
  ctx.fillStyle = "#93c5fd";
  ctx.font = "600 34px sans-serif";
  ctx.fillText("RESPONKU.ID", 90, top);
  ctx.fillRect(90, top + 34, 100, 5);

  ctx.font = "bold 66px Georgia, serif";
  ctx.fillStyle = "#ffffff";
  const lines: string[] = [];
  let line = "";
  for (const word of data.title.trim().split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > 900) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const maxLines = story ? 11 : 9;
  lines.slice(0, maxLines).forEach((text, index) => {
    ctx.fillText(index === maxLines - 1 && lines.length > maxLines ? `${text}…` : text, 90, top + 155 + index * 79, 900);
  });

  const bottom = canvas.height - (story ? 350 : 240);
  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#dbeafe";
  ctx.fillText(`Penerbit · ${data.author}`, 90, bottom, 900);
  ctx.fillRect(90, bottom + 36, 900, 2);
  const format = new Intl.NumberFormat("id-ID");
  const stats = [
    ["Suka", data.likes],
    ["Bagikan", data.shares],
    ["Tayangan", data.views],
  ] as const;
  stats.forEach(([label, value], index) => {
    const x = 90 + index * 315;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(value === null ? "—" : format.format(value), x, bottom + 104, 280);
    ctx.fillStyle = "#bfdbfe";
    ctx.font = "28px sans-serif";
    ctx.fillText(label, x, bottom + 150);
  });
  return canvas;
}
