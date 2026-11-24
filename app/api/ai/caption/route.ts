import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { recordAiUsage } from "@/lib/ai-usage";
import { resolveAiKeyForActor } from "@/lib/funikin-ai";

const input = z.object({ imageUrl: z.string().url().max(3000) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu" },
      { status: 401 },
    );
  let credentials;
  try {
    credentials = await resolveAiKeyForActor(actor, "groq");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memverifikasi API key AI" },
      { status: 403 },
    );
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "URL foto tidak valid" },
      { status: 422 },
    );
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: credentials.model,
        temperature: 0.3,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah editor foto berita berbahasa Indonesia. Buat caption foto yang faktual, singkat, netral, dan jangan mengarang nama, tempat, tanggal, atau fakta yang tidak terlihat. Hanya kembalikan caption tanpa tanda kutip.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Buat caption berita untuk foto ini dalam satu kalimat.",
              },
              { type: "image_url", image_url: { url: parsed.data.imageUrl } },
            ],
          },
        ],
      }),
    },
  );
  if (!response.ok)
    return NextResponse.json(
      { error: "Groq gagal membuat caption. Periksa model dan API key." },
      { status: 502 },
    );
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  await recordAiUsage({ provider: "groq", model: credentials.model, feature: "image_caption", inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens, totalTokens: data.usage?.total_tokens });
  const caption = data.choices?.[0]?.message?.content?.trim();
  if (!caption)
    return NextResponse.json(
      { error: "Caption kosong dari Groq" },
      { status: 502 },
    );
  return NextResponse.json({ caption });
}
