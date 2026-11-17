import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertOAuthUser } from "@/lib/db";
import type { Profile, UserRole } from "@/lib/types";
import { roleForEmail } from "@/lib/roles";

export type OAuthProvider = "google" | "funikin";

const cookieBase = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

function config(provider: OAuthProvider) {
  const prefix = provider === "google" ? "GOOGLE" : "FUNIKIN";
  const authorizationUrl = process.env[`${prefix}_AUTHORIZATION_URL`] || (provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "");
  const tokenUrl = process.env[`${prefix}_TOKEN_URL`] || (provider === "google" ? "https://oauth2.googleapis.com/token" : "");
  const userinfoUrl = process.env[`${prefix}_USERINFO_URL`] || (provider === "google" ? "https://openidconnect.googleapis.com/v1/userinfo" : "");
  return { clientId: process.env[`${prefix}_CLIENT_ID`], clientSecret: process.env[`${prefix}_CLIENT_SECRET`], authorizationUrl, tokenUrl, userinfoUrl, scopes: process.env[`${prefix}_SCOPES`] || (provider === "google" ? "openid email profile" : "openid email profile") };
}

function baseUrl(request: Request) { return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin; }
function redirectUri(provider: OAuthProvider, request: Request) { return `${baseUrl(request)}/auth/${provider}/callback`; }
function secret() { const value = process.env.OAUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY; if (!value) throw new Error("OAUTH_SESSION_SECRET belum diisi"); return new TextEncoder().encode(value); }
function verifier() { return randomBytes(32).toString("base64url"); }
function challenge(value: string) { return createHash("sha256").update(value).digest("base64url"); }

export function beginOAuth(provider: OAuthProvider, request: Request) {
  const current = config(provider);
  if (!current.clientId || !current.clientSecret || !current.authorizationUrl) throw new Error(`${provider} OAuth belum dikonfigurasi`);
  const state = randomBytes(24).toString("hex");
  const codeVerifier = verifier();
  const url = new URL(current.authorizationUrl);
  url.searchParams.set("client_id", current.clientId);
  url.searchParams.set("redirect_uri", redirectUri(provider, request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", current.scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge(codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  const response = NextResponse.redirect(url);
  response.cookies.set("responku_oauth_state", `${provider}:${state}`, { ...cookieBase, maxAge: 600 });
  response.cookies.set("responku_oauth_verifier", codeVerifier, { ...cookieBase, maxAge: 600 });
  return response;
}

export async function finishOAuth(provider: OAuthProvider, request: Request, code: string, state: string) {
  const cookieStore = cookies();
  const savedState = cookieStore.get("responku_oauth_state")?.value;
  const codeVerifier = cookieStore.get("responku_oauth_verifier")?.value;
  if (savedState !== `${provider}:${state}` || !codeVerifier) throw new Error("OAuth state tidak valid atau sudah kedaluwarsa");
  const current = config(provider);
  if (!current.clientId || !current.clientSecret || !current.tokenUrl || !current.userinfoUrl) throw new Error(`${provider} OAuth belum dikonfigurasi lengkap`);
  const tokenResponse = await fetch(current.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams({ client_id: current.clientId, client_secret: current.clientSecret, code, code_verifier: codeVerifier, grant_type: "authorization_code", redirect_uri: redirectUri(provider, request) }) });
  const token = await tokenResponse.json() as { access_token?: string; id_token?: string; error?: string };
  if (!tokenResponse.ok || !token.access_token) throw new Error(token.error || "Token OAuth gagal diterima");
  const userResponse = await fetch(current.userinfoUrl, { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" } });
  const user = await userResponse.json() as { sub?: string; id?: string; email?: string; name?: string; given_name?: string; picture?: string };
  if (!userResponse.ok || !(user.sub || user.id) || !user.email) throw new Error("Profil OAuth tidak lengkap");
  const oauthProfile = { provider, providerUserId: user.sub || user.id!, email: user.email, displayName: user.name || user.given_name || user.email.split("@")[0], avatarUrl: user.picture };
  let actor: Profile;
  try {
    actor = await upsertOAuthUser(oauthProfile);
  } catch (error) {
    // OAuth authentication must not be lost when the profile database is temporarily unavailable.
    // The profile is retried/synchronized on the next login or profile operation.
    console.error("OAuth profile sync failed:", error instanceof Error ? error.message : error);
    actor = { id: `${provider}:${oauthProfile.providerUserId}`, email: oauthProfile.email, displayName: oauthProfile.displayName, role: roleForEmail(oauthProfile.email) };
  }
  const jwt = await new SignJWT({ email: actor.email, name: actor.displayName, role: actor.role, provider, userId: actor.id }).setProtectedHeader({ alg: "HS256" }).setSubject(actor.id).setIssuedAt().setExpirationTime("30d").sign(secret());
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("responku_oauth_session", jwt, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.delete("responku_oauth_state"); response.cookies.delete("responku_oauth_verifier");
  return response;
}

export async function getOAuthActor(): Promise<Profile | null> {
  const token = cookies().get("responku_oauth_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = String(payload.userId || payload.sub || "");
    if (!userId) return null;
    const email = String(payload.email || "");
    if (!email) return null;
    return { id: userId, email, displayName: String(payload.name || "Pembaca"), role: String(payload.role || "reader") as UserRole, provider: payload.provider === "google" || payload.provider === "funikin" ? payload.provider : undefined, emailConfirmed: true };
  } catch { return null; }
}
