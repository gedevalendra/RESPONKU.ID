import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { formatArticleFromFreeform } from "@/lib/article-formatting";
import { extractDocumentText } from "@/lib/document-text";

export const runtime = "nodejs";

async function readSource(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("Pilih dokumen yang ingin diformat.");
    return extractDocumentText(file);
  }

  const parsed = z.object({ source: z.string().trim().min(20).max(50000) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new Error("Naskah harus berisi 20 sampai 50.000 karakter.");
  return { fileName: "", source: parsed.data.source };
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  let document: Awaited<ReturnType<typeof readSource>>;
  try {
    document = await readSource(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dokumen tidak dapat dibaca" },
      { status: 422 },
    );
  }
  try {
    const formatted = await formatArticleFromFreeform(document.source);
    return NextResponse.json({ ...formatted, sourceFileName: document.fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Format artikel gagal";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
