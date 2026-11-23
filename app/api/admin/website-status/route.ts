import { NextResponse } from "next/server";
import { getActor, isSuperAdmin } from "@/lib/authz";
import { getWebsiteStatus, setWebsiteStatus, websiteStatusSchema } from "@/lib/website-status";

export async function GET() {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  return NextResponse.json({ status: await getWebsiteStatus() });
}

export async function PUT(request: Request) {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = websiteStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Status website tidak valid" }, { status: 422 });
  try {
    await setWebsiteStatus(parsed.data);
    return NextResponse.json({ status: parsed.data });
  } catch {
    return NextResponse.json({ error: "Status website gagal disimpan" }, { status: 503 });
  }
}
