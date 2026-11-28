import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getOAuthUserById, upsertOAuthUser } from "@/lib/db";
import type { Profile, UserRole } from "@/lib/types";
import { connectOAuthProfiles, findVerifiedPasswordProfile } from "@/lib/account-identity";
import { getMongoDb } from "@/lib/mongodb";
import {
  sanitizeRedirectPath,
  getBaseAppUrl,
  getFunikinDiscoveryDoc,
  getFunikinJwks,
  buildTokenEndpointRequest,
  verifyFunikinIdToken,
  determineVerifiedEmail,
  _resetOidcCache,
  type OidcDiscoveryDoc,
} from "./oidc-core";

export {
  sanitizeRedirectPath,
  getBaseAppUrl,
  getFunikinDiscoveryDoc,
  getFunikinJwks,
  _resetOidcCache,
  type OidcDiscoveryDoc,
};

export type OAuthProvider = "google" | "funikin";
export const googleAccountsCookie = "responku_google_accounts";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const oauthTransientCookie = {
  ...cookieBase,
  maxAge: 600, // 10 menit
};

export function redirectUri(provider: OAuthProvider): string {
  return `${getBaseAppUrl()}/auth/${provider}/callback`;
}

export function getFunikinDiscovery(): Promise<OidcDiscoveryDoc> {
  return getFunikinDiscoveryDoc(process.env.FUNIKIN_ISSUER);
}

function secret() {
  const value =
    process.env.OAUTH_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("OAUTH_SESSION_SECRET atau AUTH_SECRET belum diisi");
  return new TextEncoder().encode(value);
}

async function tokenUserId(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return String(payload.userId || payload.sub || "");
  } catch {
    return "";
  }
}

export async function storedGoogleSessions() {
  const raw = cookies().get(googleAccountsCookie)?.value;
  if (!raw) return [] as Array<{ id: string; token: string }>;
  try {
    const tokens = JSON.parse(raw) as unknown;
    if (!Array.isArray(tokens)) return [];
    const sessions = await Promise.all(
      tokens
        .slice(0, 2)
        .filter((value): value is string => typeof value === "string")
        .map(async (token) => ({ id: await tokenUserId(token), token })),
    );
    return sessions.filter((session) => session.id);
  } catch {
    return [];
  }
}

function verifier() {
  return randomBytes(32).toString("base64url");
}

function challenge(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export async function beginOAuth(provider: OAuthProvider, request: Request) {
  const state = randomBytes(24).toString("hex");
  const codeVerifier = verifier();
  const requestUrl = new URL(request.url);
  const nextTarget = sanitizeRedirectPath(
    requestUrl.searchParams.get("next") || requestUrl.searchParams.get("callbackUrl"),
  );

  let authorizationUrl: string;
  let clientId: string;
  let scopes: string;
  let nonce: string | undefined;

  if (provider === "funikin") {
    const discovery = await getFunikinDiscovery();
    const currentClientId = process.env.FUNIKIN_CLIENT_ID?.trim();
    if (!currentClientId || !process.env.FUNIKIN_CLIENT_SECRET) {
      throw new Error("FUNIKIN_CLIENT_ID atau FUNIKIN_CLIENT_SECRET belum dikonfigurasi");
    }
    clientId = currentClientId;
    authorizationUrl = discovery.authorization_endpoint;
    scopes = process.env.FUNIKIN_SCOPES || "openid email profile";
    nonce = randomBytes(24).toString("hex");
  } else {
    clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    authorizationUrl =
      process.env.GOOGLE_AUTHORIZATION_URL ||
      "https://accounts.google.com/o/oauth2/v2/auth";
    scopes = process.env.GOOGLE_SCOPES || "openid email profile";
    if (!clientId || !clientSecret) {
      throw new Error("google OAuth belum dikonfigurasi");
    }
  }

  const url = new URL(authorizationUrl);
  if (provider === "google" && requestUrl.searchParams.get("add") === "1") {
    if ((await storedGoogleSessions()).length >= 2) {
      throw new Error(
        "Maksimal dua akun Google tersimpan. Hapus salah satu akun terlebih dahulu.",
      );
    }
    url.searchParams.set("prompt", "select_account");
  }

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge(codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  if (nonce) {
    url.searchParams.set("nonce", nonce);
  }

  const response = NextResponse.redirect(url);
  response.cookies.set("responku_oauth_state", `${provider}:${state}`, oauthTransientCookie);
  response.cookies.set("responku_oauth_verifier", codeVerifier, oauthTransientCookie);
  if (nonce) {
    response.cookies.set("responku_oauth_nonce", nonce, oauthTransientCookie);
  }
  if (nextTarget && nextTarget !== "/") {
    response.cookies.set("responku_oauth_next", nextTarget, oauthTransientCookie);
  }
  return response;
}

export type OAuthUserInfo = {
  sub?: string;
  id?: string;
  email?: string;
  email_verified?: boolean;
  hd?: string;
  name?: string;
  given_name?: string;
  picture?: string;
};

async function completeOAuthLogin(
  provider: OAuthProvider,
  user: OAuthUserInfo,
  nextPath?: string | null,
  funikinTokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  },
) {
  const providerUserId = String(user.sub || user.id || "").trim();
  if (!providerUserId || !user.email) {
    throw new Error("Profil OAuth tidak lengkap");
  }

  const email = user.email.trim().toLowerCase();
  // Syarat 3: Tautkan otomatis hanya jika email_verified === true (boolean ketat)
  const verifiedEmail = determineVerifiedEmail(provider, user);

  const tokenExpiresAt =
    funikinTokens?.accessToken && funikinTokens?.expiresIn
      ? new Date(Date.now() + Math.max(60, funikinTokens.expiresIn - 60) * 1000).toISOString()
      : undefined;

  const oauthProfile = {
    provider,
    providerUserId,
    email,
    verifiedEmail,
    displayName: user.name || user.given_name || email.split("@")[0],
    avatarUrl: user.picture,
    ...(provider === "funikin" && funikinTokens?.accessToken
      ? {
        funikinAccessToken: funikinTokens.accessToken,
        funikinRefreshToken: funikinTokens.refreshToken,
        funikinTokenExpiresAt: tokenExpiresAt,
      }
      : {}),
  };

  const actor = await upsertOAuthUser(oauthProfile);

  // Tautkan otomatis hanya jika email_verified === true
  // DAN akun lokal target juga sudah terverifikasi emailnya
  if (verifiedEmail) {
    const password = await findVerifiedPasswordProfile(verifiedEmail);
    const db = await getMongoDb();
    const firstOAuth = password
      ? null
      : await db
        ?.collection("oauth_users")
        .findOne({ verifiedEmail }, { sort: { createdAt: 1, id: 1 } });

    if (password || firstOAuth) {
      const accountId = password?.id || firstOAuth?.id || actor.id;
      await connectOAuthProfiles(verifiedEmail, accountId);
    }
  }

  const jwt = await new SignJWT({
    email: actor.email,
    name: actor.displayName,
    role: actor.role,
    provider,
    userId: actor.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(actor.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const targetUrl = new URL(sanitizeRedirectPath(nextPath), getBaseAppUrl());
  const response = NextResponse.redirect(targetUrl);

  response.cookies.set("responku_oauth_session", jwt, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });

  if (provider === "google") {
    const sessions = await storedGoogleSessions();
    const next = [
      jwt,
      ...sessions.filter((session) => session.id !== actor.id).map((s) => s.token),
    ].slice(0, 2);
    response.cookies.set(googleAccountsCookie, JSON.stringify(next), {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Syarat 6: Hapus semua cookie transient OAuth setelah callback
  response.cookies.delete("responku_oauth_state");
  response.cookies.delete("responku_oauth_verifier");
  response.cookies.delete("responku_oauth_nonce");
  response.cookies.delete("responku_oauth_next");

  return response;
}

export async function finishOAuth(
  provider: OAuthProvider,
  request: Request,
  code: string,
  state: string,
) {
  const cookieStore = cookies();
  const savedState = cookieStore.get("responku_oauth_state")?.value;
  const codeVerifier = cookieStore.get("responku_oauth_verifier")?.value;
  const savedNonce = cookieStore.get("responku_oauth_nonce")?.value;
  const savedNext = cookieStore.get("responku_oauth_next")?.value;

  if (!savedState || savedState !== `${provider}:${state}` || !codeVerifier) {
    throw new Error("OAuth state tidak valid atau sudah kedaluwarsa");
  }

  let user: OAuthUserInfo;
  let funikinTokens:
    | { accessToken?: string; refreshToken?: string; expiresIn?: number }
    | undefined;

  if (provider === "funikin") {
    const discovery = await getFunikinDiscovery();
    const clientId = process.env.FUNIKIN_CLIENT_ID?.trim();
    const clientSecret = process.env.FUNIKIN_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new Error("FunikIn OAuth belum dikonfigurasi lengkap");
    }

    if (!savedNonce) {
      throw new Error("OIDC nonce tidak ditemukan di sesi");
    }

    // Bangun request token sesuai token_endpoint_auth_methods_supported
    const { headers: tokenHeaders, body: tokenBody } = buildTokenEndpointRequest({
      discovery,
      clientId,
      clientSecret,
      code,
      codeVerifier,
      redirectUri: redirectUri(provider),
    });

    const tokenResponse = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: tokenHeaders,
      body: tokenBody,
      cache: "no-store",
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
      error?: string;
      error_description?: string;
      msg?: string;
      message?: string;
    };

    if (!tokenResponse.ok || !tokenData.id_token) {
      throw new Error(
        tokenData.error_description ||
        tokenData.msg ||
        tokenData.message ||
        tokenData.error ||
        "Token ID FunikIn gagal diterima",
      );
    }

    if (tokenData.access_token) {
      funikinTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      };
    }

    const jwks = getFunikinJwks(discovery.jwks_uri);
    // Verifikasi id_token dengan penguncian algoritma ke RS256/ES256 (tolak none dan HS*)
    const payload = await verifyFunikinIdToken({
      idToken: tokenData.id_token,
      jwks,
      discovery,
      clientId,
      expectedNonce: savedNonce,
    });

    const sub = String(payload.sub || "").trim();
    let email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    let emailVerified = payload.email_verified === true;
    let name = typeof payload.name === "string" ? payload.name : undefined;
    let picture = typeof payload.picture === "string" ? payload.picture : undefined;

    // Jika klaim profil belum lengkap dan userinfo tersedia, ambil data profil tambahan
    if ((!email || !name) && discovery.userinfo_endpoint && tokenData.access_token) {
      try {
        const userinfoRes = await fetch(discovery.userinfo_endpoint, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });
        if (userinfoRes.ok) {
          const userinfo = (await userinfoRes.json()) as OAuthUserInfo;
          if (!email && userinfo.email) {
            email = userinfo.email.trim().toLowerCase();
          }
          if (emailVerified === false && userinfo.email_verified === true) {
            emailVerified = true;
          }
          if (!name) {
            name = userinfo.name || userinfo.given_name;
          }
          if (!picture) {
            picture = userinfo.picture;
          }
        }
      } catch {
        // Fallback ke profil id_token
      }
    }

    if (!email) {
      throw new Error("Email tidak ditemukan pada profil FunikIn");
    }

    user = {
      sub,
      email,
      email_verified: emailVerified,
      name,
      picture,
    };
  } else {
    // Alur Google OAuth
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const tokenUrl =
      process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
    const userinfoUrl =
      process.env.GOOGLE_USERINFO_URL ||
      "https://openidconnect.googleapis.com/v1/userinfo";

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth belum dikonfigurasi lengkap");
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(provider),
      }),
      cache: "no-store",
    });

    const token = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !token.access_token) {
      throw new Error(
        token.error_description || token.error || "Token OAuth gagal diterima",
      );
    }

    const userResponse = await fetch(userinfoUrl, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    user = (await userResponse.json()) as OAuthUserInfo;
    if (!userResponse.ok) {
      throw new Error("Profil OAuth Google tidak lengkap");
    }
  }

  return completeOAuthLogin(provider, user, savedNext, funikinTokens);
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
    const savedProfile = await getOAuthUserById(userId);
    if (!savedProfile || savedProfile.email.toLowerCase() !== email.toLowerCase()) {
      return null;
    }
    if (savedProfile.verifiedEmail && savedProfile.accountId) {
      const password = await findVerifiedPasswordProfile(savedProfile.verifiedEmail);
      if (password?.id === savedProfile.accountId) {
        return {
          id: password.id,
          email: password.email,
          displayName: password.display_name,
          role: password.role as UserRole,
          emailConfirmed: true,
          linkedOAuth: true,
          provider:
            payload.provider === "google" || payload.provider === "funikin"
              ? payload.provider
              : undefined,
        };
      }
    }
    const canonical = savedProfile.accountId
      ? await getOAuthUserById(savedProfile.accountId)
      : null;
    const profile =
      canonical && canonical.verifiedEmail === savedProfile.verifiedEmail
        ? canonical
        : savedProfile;
    return {
      id: profile.id,
      email: profile.email || email,
      displayName: profile.displayName || String(payload.name || "Pembaca"),
      role: (profile.role || payload.role || "reader") as UserRole,
      username: profile.username,
      organization: profile.organization,
      avatarUrl: profile.avatarUrl,
      backgroundUrl: profile.backgroundUrl,
      provider:
        payload.provider === "google" || payload.provider === "funikin"
          ? payload.provider
          : undefined,
      emailConfirmed: Boolean(savedProfile.verifiedEmail),
    };
  } catch {
    return null;
  }
}
