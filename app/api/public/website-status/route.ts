import { NextResponse } from "next/server";
import { getWebsiteStatus } from "@/lib/website-status";

export async function GET() {
  return NextResponse.json({ status: await getWebsiteStatus() }, { headers: { "Cache-Control": "no-store" } });
}
