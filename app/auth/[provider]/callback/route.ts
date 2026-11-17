import { NextResponse } from "next/server";
import { finishOAuth, type OAuthProvider } from "@/lib/oauth";

export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  if (params.provider !== "google" && params.provider !== "funikin")
    return NextResponse.json(
      { error: "Provider tidak didukung" },
      { status: 404 },
    );
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state)
    return NextResponse.redirect(
      new URL("/masuk?error=OAuth%20dibatalkan", request.url),
    );
  try {
    return await finishOAuth(
      params.provider as OAuthProvider,
      request,
      code,
      state,
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/masuk?error=${encodeURIComponent(error instanceof Error ? error.message : "OAuth gagal")}`,
        request.url,
      ),
    );
  }
}
