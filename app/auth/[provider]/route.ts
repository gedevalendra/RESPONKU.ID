import { NextResponse } from "next/server";
import { beginOAuth, type OAuthProvider } from "@/lib/oauth";

export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  if (params.provider !== "google" && params.provider !== "funikin")
    return NextResponse.json(
      { error: "Provider tidak didukung" },
      { status: 404 },
    );
  try {
    return await beginOAuth(params.provider as OAuthProvider, request);
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/masuk?error=${encodeURIComponent(error instanceof Error ? error.message : "OAuth belum dikonfigurasi")}`,
        request.url,
      ),
    );
  }
}
