import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { getArticleFromDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { recordAiUsage } from "@/lib/ai-usage";

function sourceFor(article: NonNullable<Awaited<ReturnType<typeof getArticleFromDatabase>>>) {
  const blocks = article.contentBlocks?.map((block) => block.type === "text" || block.type === "heading" || block.type === "quote" || block.type === "callout" ? block.text : "").join(" ") || "";
  return `${article.title}\n${article.dek}\n${article.content.join(" ")}\n${blocks}`.replace(/\s+/g, " ").slice(0, 18_000);
}

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  if (!env.groqApiKey || !env.groqModel) return NextResponse.json({ error: "Layanan ringkasan belum tersedia." }, { status: 503 });
  const article = await getArticleFromDatabase(params.slug);
  if (!article) return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.groqApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.groqModel, temperature: 0.2, max_tokens: 220, messages: [
      { role: "system", content: "Kamu editor berita Indonesia. Ringkas artikel hanya berdasarkan sumber yang diberikan. Tulis 3 poin inti yang faktual, singkat, netral, tanpa judul, tanpa pembukaan, dan tanpa menambah fakta." },
      { role: "user", content: sourceFor(article) },
    ] }),
  });
  if (!response.ok) return NextResponse.json({ error: "Ringkasan belum dapat dibuat." }, { status: 502 });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
  await recordAiUsage({ provider: "groq", model: env.groqModel, feature: "article_summary", inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens, totalTokens: data.usage?.total_tokens });
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) return NextResponse.json({ error: "Ringkasan kosong." }, { status: 502 });
  return NextResponse.json({ summary });
}
