import { NextResponse } from "next/server";
import { getActor, isSuperAdmin } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listOAuthUsers } from "@/lib/db";

export async function GET() {
  const actor = await getActor();
  if (!actor || !isSuperAdmin(actor.role)) return NextResponse.json({ error: "Khusus superadmin" }, { status: 403 });
  const supabase = getSupabaseAdmin();
  let profiles: Array<Record<string, unknown>> = [];
  if (supabase) {
    const { data, error } = await supabase.from("profiles").select("id,email,display_name,role,created_at").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "User gagal dimuat" }, { status: 503 });
    profiles = data || [];
  }
  const oauthUsers = await listOAuthUsers();
  return NextResponse.json({ users: [...profiles.map((user) => ({ ...user, source: "supabase" })), ...oauthUsers.map((user) => ({ id: user.id, email: user.email, display_name: user.displayName, role: user.role, created_at: user.createdAt, source: "oauth" }))] });
}
