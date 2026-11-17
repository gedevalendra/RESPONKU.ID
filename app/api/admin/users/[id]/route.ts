import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isSuperAdmin } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { updateOAuthUserRole } from "@/lib/db";

const schema = z.object({ role: z.enum(["reader", "author", "admin", "superadmin"]), displayName: z.string().min(2).max(100).optional(), source: z.enum(["supabase", "oauth"]).default("supabase") });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Khusus superadmin" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Role tidak valid" }, { status: 422 });
  if (parsed.data.source === "oauth") {
    try { await updateOAuthUserRole(params.id, parsed.data.role); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "User OAuth tidak ditemukan" }, { status: 404 }); }
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const { source: _source, ...profilePatch } = parsed.data;
  const { error } = await supabase.from("profiles").update(profilePatch).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Role gagal diubah" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
