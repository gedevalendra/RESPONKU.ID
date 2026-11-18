import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const db = await getMongoDb();
    if (!db) return NextResponse.json({ error: "Database belum tersedia" }, { status: 503 });
    const result = await db.collection("articles").updateOne(
      { slug: params.slug, status: "published" },
      { $inc: { shares: 1 } },
    );
    return new NextResponse(null, { status: result.matchedCount ? 204 : 404 });
  } catch {
    return NextResponse.json({ error: "Aktivitas berbagi gagal dicatat" }, { status: 503 });
  }
}
