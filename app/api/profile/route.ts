import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { getOAuthUserById, updateOAuthProfile } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseAuthServer } from "@/lib/supabase/server-auth";
import { publicProfile } from "@/lib/community";

const input = z.object({
  displayName: z.string().min(2).max(100),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username hanya boleh memakai huruf, angka, titik, garis bawah, atau strip",
    ),
  organization: z.string().max(150).default(""),
  avatarUrl: z.string().url().max(3000).optional(),
  backgroundUrl: z.string().url().max(3000).optional(),
  bio: z.string().trim().max(300).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu" },
      { status: 401 },
    );
  if (actor.provider) {
    const user = await getOAuthUserById(actor.id);
    const community = await publicProfile(actor.id);
    return NextResponse.json({
      profile: {
        ...actor,
        username: user?.username || "",
        organization: community?.organization || "",
        verified: community?.verified || false,
        avatarUrl: user?.avatarUrl || actor.avatarUrl,
        backgroundUrl: user?.backgroundUrl || actor.backgroundUrl,
        bio: user?.bio || "",
        provider: actor.provider,
        emailConfirmed: Boolean(actor.emailConfirmed),
      },
      canChangePassword: false,
      canChangeEmail: false,
    });
  }
  const authClient = getSupabaseAuthServer();
  const community = await publicProfile(actor.id);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const admin = getSupabaseAdmin();
  const { data } = admin
    ? await admin
        .from("profiles")
        .select("display_name,username,organization,avatar_url,background_url,bio")
        .eq("id", actor.id)
        .single()
    : { data: null };
  return NextResponse.json({
    profile: {
      ...actor,
      username: data?.username || "",
      organization: community?.organization || "",
      verified: community?.verified || false,
      avatarUrl: data?.avatar_url || "",
      backgroundUrl: data?.background_url || "",
      bio: data?.bio || "",
      provider: "supabase",
      emailConfirmed: actor.linkedOAuth || Boolean(user?.email_confirmed_at),
    },
    canChangePassword: !actor.linkedOAuth,
    canChangeEmail: !actor.linkedOAuth,
  });
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu" },
      { status: 401 },
    );
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data profil tidak valid" },
      { status: 422 },
    );
  if (actor.provider) {
    if (
      parsed.data.password ||
      (parsed.data.email && parsed.data.email !== actor.email)
    )
      return NextResponse.json(
        {
          error:
            "Email dan sandi akun OAuth dikelola melalui Google atau FunikIn.",
        },
        { status: 409 },
      );
    try {
      const user = await updateOAuthProfile(actor.id, {
        displayName: parsed.data.displayName,
        username: parsed.data.username,
        organization: parsed.data.organization,
        avatarUrl: parsed.data.avatarUrl,
        backgroundUrl: parsed.data.backgroundUrl,
        bio: parsed.data.bio,
      });
      return NextResponse.json({
        profile: {
          ...actor,
          displayName: user?.displayName || parsed.data.displayName,
          username: user?.username || parsed.data.username,
          organization: user?.organization || parsed.data.organization,
          avatarUrl: user?.avatarUrl || parsed.data.avatarUrl,
          backgroundUrl: user?.backgroundUrl || parsed.data.backgroundUrl,
          bio: user?.bio || "",
          emailConfirmed: Boolean(actor.emailConfirmed),
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Profil OAuth gagal disimpan. Pastikan MongoDB tersambung." },
        { status: 503 },
      );
    }
  }
  const admin = getSupabaseAdmin();
  if (!admin)
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi" },
      { status: 503 },
    );
  const { data: userData } = await getSupabaseAuthServer().auth.getUser();
  if (actor.linkedOAuth && (parsed.data.password || (parsed.data.email && parsed.data.email !== actor.email))) {
    return NextResponse.json({ error: "Masuk dengan sandi untuk mengubah email atau sandi." }, { status: 409 });
  }
  if (!actor.linkedOAuth && userData.user?.id !== actor.id)
    return NextResponse.json(
      { error: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  const { error } = await admin
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      username: parsed.data.username,
      organization: parsed.data.organization,
      avatar_url: parsed.data.avatarUrl || null,
      background_url: parsed.data.backgroundUrl || null,
      ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", actor.id);
  if (error)
    return NextResponse.json(
      { error: "Profil gagal disimpan" },
      { status: 503 },
    );
  const authPatch: { email?: string; password?: string } = {};
  if (parsed.data.email && parsed.data.email !== actor.email)
    authPatch.email = parsed.data.email;
  if (parsed.data.password) authPatch.password = parsed.data.password;
  if (Object.keys(authPatch).length > 0) {
    const result = await getSupabaseAuthServer().auth.updateUser(authPatch);
    if (result.error)
      return NextResponse.json(
        { error: result.error.message },
        { status: 422 },
      );
  }
  return NextResponse.json({
    profile: {
      ...actor,
      displayName: parsed.data.displayName,
      username: parsed.data.username,
      organization: parsed.data.organization,
      avatarUrl: parsed.data.avatarUrl,
      backgroundUrl: parsed.data.backgroundUrl,
      bio: parsed.data.bio,
      email: actor.email,
      emailConfirmed: actor.linkedOAuth || Boolean(userData.user?.email_confirmed_at),
    },
  });
}

export async function POST() {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu" },
      { status: 401 },
    );
  if (actor.provider || actor.linkedOAuth)
    return NextResponse.json(
      { error: "Konfirmasi email dikelola oleh provider OAuth." },
      { status: 409 },
    );
  const response = await getSupabaseAuthServer().auth.resend({
    type: "signup",
    email: actor.email,
  });
  if (response.error)
    return NextResponse.json(
      { error: response.error.message },
      { status: 422 },
    );
  return NextResponse.json({ message: "Email konfirmasi dikirim ulang." });
}
