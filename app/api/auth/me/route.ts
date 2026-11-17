import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";

export async function GET() {
  const actor = await getActor();
  return NextResponse.json({ authenticated: Boolean(actor), user: actor });
}
