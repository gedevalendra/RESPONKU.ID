import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOAuthUserById } from "@/lib/db";
import { googleAccountsCookie, storedGoogleSessions } from "@/lib/oauth";
import { publicProfile } from "@/lib/community";

const input = z.object({ id: z.string().min(1).max(200) });
const cookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 };

export async function GET() {
  const sessions = await storedGoogleSessions();
  const accounts = await Promise.all(sessions.map(async (session) => {
    const [user, profile] = await Promise.all([getOAuthUserById(session.id), publicProfile(session.id).catch(() => null)]);
    return user ? { id: user.id, displayName: profile?.displayName || user.displayName, email: user.email, avatarUrl: profile?.avatarUrl || user.avatarUrl || "" } : null;
  }));
  return NextResponse.json({ accounts: accounts.filter(Boolean) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Akun tidak valid" }, { status: 422 });
  const sessions = await storedGoogleSessions();
  const selected = sessions.find((session) => session.id === parsed.data.id);
  if (!selected) return NextResponse.json({ error: "Akun tidak tersedia di perangkat ini" }, { status: 404 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("responku_oauth_session", selected.token, cookie);
  return response;
}

export async function DELETE(request: NextRequest) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Akun tidak valid" }, { status: 422 });
  const sessions = await storedGoogleSessions();
  const next = sessions.filter((session) => session.id !== parsed.data.id);
  if (next.length === sessions.length) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  const response = NextResponse.json({ ok: true });
  if (next.length) response.cookies.set(googleAccountsCookie, JSON.stringify(next.map((session) => session.token)), cookie);
  else response.cookies.delete(googleAccountsCookie);
  const current = request.cookies.get("responku_oauth_session")?.value;
  if (current === sessions.find((session) => session.id === parsed.data.id)?.token) {
    if (next[0]) response.cookies.set("responku_oauth_session", next[0].token, cookie);
    else response.cookies.delete("responku_oauth_session");
  }
  return response;
}
