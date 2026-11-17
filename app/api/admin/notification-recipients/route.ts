import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { searchNotificationRecipients } from "@/lib/db";

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const query = new URL(request.url).searchParams.get("q") || "";
  return NextResponse.json({ users: await searchNotificationRecipients(query) });
}
