import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("responku_oauth_session");
  response.cookies.delete("responku_oauth_state");
  response.cookies.delete("responku_oauth_verifier");
  return response;
}
