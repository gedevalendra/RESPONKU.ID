import { NextResponse } from "next/server";
import { z } from "zod";
import { createComment, listComments } from "@/lib/db";

const schema = z.object({
  articleSlug: z.string().min(1).max(180),
  displayName: z.string().trim().min(2).max(60),
  body: z.string().trim().min(3).max(2000),
});

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("articleSlug");
  if (!slug)
    return NextResponse.json(
      { error: "articleSlug wajib diisi" },
      { status: 400 },
    );
  try {
    return NextResponse.json({ comments: await listComments(slug) });
  } catch {
    return NextResponse.json(
      { error: "Komentar belum dapat dimuat" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Nama dan komentar tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 422 },
    );
  try {
    return NextResponse.json(
      { comment: await createComment(parsed.data) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Komentar gagal disimpan. Isi env Supabase terlebih dahulu." },
      { status: 503 },
    );
  }
}
