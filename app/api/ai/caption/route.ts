import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { env } from "@/lib/env";

const input = z.object({ imageUrl: z.string().url().max(3000) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu" },
      { status: 401 },
    );
  if (!env.groqApiKey || !env.groqModel)
    return NextResponse.json(
      { error: "GROQ_API_KEY dan GROQ_MODEL belum diisi di .env.local" },
      { status: 503 },
    );
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
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.groqModel,
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
  };
  const caption = data.choices?.[0]?.message?.content?.trim();
  if (!caption)
    return NextResponse.json(
      { error: "Caption kosong dari Groq" },
      { status: 502 },
    );
  return NextResponse.json({ caption });
}
