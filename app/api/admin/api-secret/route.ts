import { NextResponse } from "next/server";
import { getActor, isSuperAdmin } from "@/lib/authz";
import { createApiSecret, getApiSecrets, revokeApiSecret } from "@/lib/api-secret";
import { z } from "zod";

export async function GET() {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Khusus superadmin" }, { status: 403 });
  try {
    return NextResponse.json({ secrets: await getApiSecrets() });
  } catch {
    return NextResponse.json({ error: "Database belum tersambung" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Khusus superadmin" }, { status: 403 });
  try {
    const parsed = z.object({ name: z.string().trim().min(1, "Nama secret wajib diisi").max(80, "Nama secret maksimal 80 karakter") }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Nama secret tidak valid" }, { status: 400 });
    const result = await createApiSecret(parsed.data.name);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Secret ID gagal dibuat" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Khusus superadmin" }, { status: 403 });
  try {
    const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Secret ID tidak valid" }, { status: 400 });
    const revoked = await revokeApiSecret(parsed.data.id);
    return revoked ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Secret ID tidak ditemukan" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Secret ID gagal dicabut" }, { status: 503 });
  }
}
