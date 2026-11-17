import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { removePushSubscription, savePushSubscription } from "@/lib/db";
import { env } from "@/lib/env";

const subscription = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function GET() {
  return NextResponse.json({ publicKey: env.vapidPublicKey || null });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = subscription.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Subscription tidak valid" }, { status: 422 });
  try {
    await savePushSubscription(actor.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Subscription gagal disimpan" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (endpoint) await removePushSubscription(actor.id, endpoint);
  return NextResponse.json({ ok: true });
}
