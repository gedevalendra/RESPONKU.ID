import "server-only";
import { env } from "@/lib/env";
import type { Profile } from "@/lib/types";
import { communityDb } from "@/lib/community";

export type AiProviderKind = "groq" | "gemini" | "openai" | "anthropic" | "openrouter";

export interface ResolvedAiCredentials {
  isPro: boolean;
  apiKey: string;
  provider: AiProviderKind;
  model: string;
}

export interface FormattingAiProvider {
  kind: "groq" | "gemini";
  label: string;
  apiKey: string;
  sourceLimit: number;
}

/**
 * Cek apakah user memiliki status Akun Pro
 * - Admin dan SuperAdmin otomatis memiliki akses Pro
 * - User dengan flag tier === "pro" atau isPro === true di DB
 */
export async function isProUser(actor: Profile): Promise<boolean> {
  if (actor.role === "admin" || actor.role === "superadmin" || actor.tier === "pro") {
    return true;
  }

  try {
    const db = await communityDb();
    if (db) {
      // Cek di account_roles
      const roleDoc = await db.collection("account_roles").findOne<{ tier?: string; isPro?: boolean }>({
        userId: actor.id,
      });
      if (roleDoc?.tier === "pro" || roleDoc?.isPro === true) {
        return true;
      }

      // Cek di oauth_users
      const oauthDoc = await db.collection("oauth_users").findOne<{ tier?: string; isPro?: boolean }>({
        $or: [
          { id: actor.id },
          { accountId: actor.id },
          { email: actor.email.toLowerCase() },
          ...(actor.emailConfirmed ? [{ verifiedEmail: actor.email.toLowerCase() }] : []),
        ],
      });
      if (oauthDoc?.tier === "pro" || oauthDoc?.isPro === true) {
        return true;
      }
    }
  } catch (error) {
    console.error("Gagal memeriksa status Pro user:", error);
  }

  return false;
}

export interface FunikinAuthLink {
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}

export interface FunikinAiKeyStatus {
  linked: boolean;
  providers: string[];
  needsRelogin?: boolean;
  authUrl: string;
}

/**
 * Ambil data tautan FunikIn (UUID auth.users + OAuth access/refresh token) milik akun ResponKu
 */
export async function getFunikinAuthLink(actor: Profile): Promise<FunikinAuthLink | null> {
  try {
    const db = await communityDb();
    if (!db) return null;

    const funikinDoc = await db.collection("oauth_users").findOne<{
      providerUserId?: string;
      funikinAccessToken?: string;
      funikinRefreshToken?: string;
      funikinTokenExpiresAt?: string;
    }>(
      {
        provider: "funikin",
        $or: [
          { id: actor.id },
          { accountId: actor.id },
          { email: actor.email.toLowerCase() },
          ...(actor.emailConfirmed ? [{ verifiedEmail: actor.email.toLowerCase() }] : []),
        ],
      },
      { sort: { updatedAt: -1 } },
    );

    if (funikinDoc?.providerUserId) {
      return {
        providerUserId: String(funikinDoc.providerUserId).trim(),
        accessToken: funikinDoc.funikinAccessToken?.trim() || undefined,
        refreshToken: funikinDoc.funikinRefreshToken?.trim() || undefined,
        tokenExpiresAt: funikinDoc.funikinTokenExpiresAt || undefined,
      };
    }
  } catch (error) {
    console.error("Gagal mendapatkan FunikIn auth link:", error);
  }

  return null;
}

/**
 * Ambil ID User FunikIn (UUID auth.users) yang terhubung dengan akun ResponKu
 */
export async function getFunikinUserId(actor: Profile): Promise<string | null> {
  const link = await getFunikinAuthLink(actor);
  return link?.providerUserId || null;
}

async function refreshFunikinAccessToken(
  funikinUserId: string,
  refreshToken: string,
): Promise<string | null> {
  const clientId = process.env.FUNIKIN_CLIENT_ID?.trim();
  const clientSecret = process.env.FUNIKIN_CLIENT_SECRET?.trim();
  const issuer = (process.env.FUNIKIN_ISSUER || `${env.funikinSupabaseUrl}/auth/v1`).replace(/\/$/, "");

  const tokenEndpoints = [
    `${issuer}/oauth/token`,
    `${issuer}/token?grant_type=refresh_token`,
  ];

  for (const tokenUrl of tokenEndpoints) {
    try {
      const isOAuthToken = tokenUrl.includes("/oauth/token");
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      let body: string | URLSearchParams;

      if (isOAuthToken && clientId && clientSecret) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
        body = new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        });
      } else {
        headers["Content-Type"] = "application/json";
        if (env.funikinSupabaseAnonKey) {
          headers["apikey"] = env.funikinSupabaseAnonKey;
        }
        body = JSON.stringify({ refresh_token: refreshToken });
      }

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
      });
      if (!res.ok) continue;

      const data = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!data.access_token) continue;

      const nextExpiresAt = data.expires_in
        ? new Date(Date.now() + Math.max(60, data.expires_in - 60) * 1000).toISOString()
        : undefined;

      const db = await communityDb();
      if (db) {
        await db.collection("oauth_users").updateMany(
          { provider: "funikin", providerUserId: funikinUserId },
          {
            $set: {
              funikinAccessToken: data.access_token,
              ...(data.refresh_token ? { funikinRefreshToken: data.refresh_token } : {}),
              ...(nextExpiresAt ? { funikinTokenExpiresAt: nextExpiresAt } : {}),
              updatedAt: new Date().toISOString(),
            },
          },
        );
      }

      return data.access_token;
    } catch {
      // Try next endpoint
    }
  }

  return null;
}

function parseUserAiKeyRows(
  rows: Array<{ provider?: string; api_key_encrypted?: string }>,
): Record<string, string> {
  const keys: Record<string, string> = {};
  for (const row of rows) {
    if (row.provider && row.api_key_encrypted) {
      const providerKey = row.provider.toLowerCase().trim();
      if (!keys[providerKey]) {
        keys[providerKey] = row.api_key_encrypted.trim();
      }
    }
  }
  return keys;
}

/**
 * Ambil daftar API Key aktif milik user dari database Supabase FunikIn.
 * Prioritas 1: Memakai OAuth access_token milik user + FUNIKIN_SUPABASE_ANON_KEY (via RLS Supabase, tanpa perlu service_role key).
 * Prioritas 2: Fallback memakai FUNIKIN_SUPABASE_SECRET_KEY jika valid di server.
 */
export async function fetchUserAiKeysFromFunikin(
  funikinUserId: string,
  authLink?: FunikinAuthLink | null,
): Promise<Record<string, string>> {
  const supabaseUrl = env.funikinSupabaseUrl;
  const anonKey = env.funikinSupabaseAnonKey;
  const secretKey = env.funikinSupabaseSecretKey;

  if (!supabaseUrl) {
    throw new Error("Konfigurasi FUNIKIN_SUPABASE_URL belum lengkap di server ResponKu.");
  }

  const endpoint = `${supabaseUrl}/rest/v1/user_ai_keys?user_id=eq.${encodeURIComponent(
    funikinUserId,
  )}&is_active=eq.true&select=provider,api_key_encrypted&order=created_at.desc`;

  let lastErrorDetail = "";

  // ===== TIER 1: User OAuth Access Token + Valid FunikIn Anon Key (RLS auth.uid() = user_id) =====
  if (anonKey && (authLink?.accessToken || authLink?.refreshToken)) {
    let activeToken = authLink.accessToken;
    const isExpired =
      authLink.tokenExpiresAt && new Date(authLink.tokenExpiresAt).getTime() <= Date.now();

    if ((!activeToken || isExpired) && authLink.refreshToken) {
      const refreshed = await refreshFunikinAccessToken(funikinUserId, authLink.refreshToken);
      if (refreshed) activeToken = refreshed;
    }

    if (activeToken) {
      let res = await fetch(endpoint, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${activeToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (res.status === 401 && authLink.refreshToken) {
        const refreshed = await refreshFunikinAccessToken(funikinUserId, authLink.refreshToken);
        if (refreshed) {
          res = await fetch(endpoint, {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${refreshed}`,
              Accept: "application/json",
            },
            cache: "no-store",
          });
        }
      }

      if (res.ok) {
        const rows = (await res.json()) as Array<{ provider?: string; api_key_encrypted?: string }>;
        return parseUserAiKeyRows(rows);
      }

      lastErrorDetail = await res.text().catch(() => `HTTP ${res.status}`);
    }
  }

  // ===== TIER 2: Fallback Server Secret / Service Role Key =====
  if (secretKey) {
    const isOpaqueSecret = secretKey.startsWith("sb_secret_");
    const headers: Record<string, string> = {
      apikey: secretKey,
      Accept: "application/json",
    };
    // Supabase opaque sb_secret_ keys MUST NOT be passed in Authorization: Bearer to PostgREST
    if (!isOpaqueSecret) {
      headers.Authorization = `Bearer ${secretKey}`;
    }

    const res = await fetch(endpoint, {
      headers,
      cache: "no-store",
    });

    if (res.ok) {
      const rows = (await res.json()) as Array<{ provider?: string; api_key_encrypted?: string }>;
      return parseUserAiKeyRows(rows);
    }

    lastErrorDetail = await res.text().catch(() => `HTTP ${res.status}`);
  }

  if (!authLink?.accessToken && !authLink?.refreshToken) {
    throw new Error(
      "Sesi akun FunikIn Anda perlu disinkronkan ulang agar ResponKu dapat membaca API Key dari auth.funikin.com. Silakan masuk ulang menggunakan tombol Masuk dengan FunikIn.",
    );
  }

  throw new Error(
    `Gagal memuat API key dari FunikIn (${lastErrorDetail || "akses ditolak"}). Silakan masuk ulang menggunakan FunikIn agar izin API Key diperbarui.`,
  );
}

/**
 * Ambil ringkasan status deteksi API Key FunikIn untuk ditampilkan di halaman Akun ResponKu.
 */
export async function getFunikinAiKeyStatus(actor: Profile): Promise<FunikinAiKeyStatus> {
  const authUrl = `${env.funikinAuthUrl.replace(/\/$/, "")}/dashboard/ai-keys`;
  const authLink = await getFunikinAuthLink(actor);
  if (!authLink) {
    return { linked: false, providers: [], authUrl };
  }

  try {
    const keys = await fetchUserAiKeysFromFunikin(authLink.providerUserId, authLink);
    return {
      linked: true,
      providers: Object.keys(keys),
      needsRelogin: false,
      authUrl,
    };
  } catch {
    return {
      linked: true,
      providers: [],
      needsRelogin: !authLink.accessToken,
      authUrl,
    };
  }
}

/**
 * Resolve API Key dan Model untuk aktor yang sedang mengakses fitur AI:
 * - Jika Akun Pro: Gunakan server key ResponKu
 * - Jika Akun Gratis: Wajib mengambil API key milik user sendiri dari FunikIn
 */
export async function resolveAiKeyForActor(
  actor: Profile,
  requiredProvider: "groq" | "gemini" | "any",
): Promise<ResolvedAiCredentials> {
  const isPro = await isProUser(actor);

  if (isPro) {
    if (requiredProvider === "gemini") {
      if (!env.geminiApiKeys[0]) throw new Error("GEMINI_API_KEY belum dikonfigurasi di server.");
      return {
        isPro: true,
        apiKey: env.geminiApiKeys[0],
        provider: "gemini",
        model: env.geminiModel,
      };
    }

    // Default untuk Groq atau any
    if (!env.groqApiKey || !env.groqModel) {
      if (requiredProvider === "any" && env.geminiApiKeys[0]) {
        return {
          isPro: true,
          apiKey: env.geminiApiKeys[0],
          provider: "gemini",
          model: env.geminiModel,
        };
      }
      throw new Error("GROQ_API_KEY dan GROQ_MODEL belum dikonfigurasi di server.");
    }

    return {
      isPro: true,
      apiKey: env.groqApiKey,
      provider: "groq",
      model: env.groqModel,
    };
  }

  // Akun Gratis: Wajib menggunakan API key dari auth.funikin.com
  const authLink = await getFunikinAuthLink(actor);
  if (!authLink) {
    throw new Error(
      "Akun gratis wajib menghubungkan akun FunikIn untuk menggunakan fitur AI. Silakan masuk atau hubungkan akun Anda dengan FunikIn di menu Akun, lalu atur API key Anda di auth.funikin.com (atau upgrade ke Akun Pro).",
    );
  }

  const userKeys = await fetchUserAiKeysFromFunikin(authLink.providerUserId, authLink);

  if (requiredProvider === "groq") {
    const userGroqKey = userKeys["groq"];
    if (!userGroqKey) {
      throw new Error(
        "Akun gratis wajib memasukkan API Key Groq sendiri di auth.funikin.com untuk menggunakan fitur AI ini. Silakan kunjungi https://auth.funikin.com menu AI Key Management untuk menambahkan API key Anda (atau upgrade ke Akun Pro).",
      );
    }
    return {
      isPro: false,
      apiKey: userGroqKey,
      provider: "groq",
      model: env.groqModel || "llama-3.3-70b-versatile",
    };
  }

  if (requiredProvider === "gemini") {
    const userGeminiKey = userKeys["gemini"];
    if (!userGeminiKey) {
      throw new Error(
        "Akun gratis wajib memasukkan API Key Google Gemini sendiri di auth.funikin.com untuk menggunakan fitur ini. Silakan kunjungi https://auth.funikin.com menu AI Key Management untuk menambahkan API key Anda (atau upgrade ke Akun Pro).",
      );
    }
    return {
      isPro: false,
      apiKey: userGeminiKey,
      provider: "gemini",
      model: env.geminiModel || "gemini-1.5-flash",
    };
  }

  // Any provider (pilih Groq atau Gemini yang tersedia pada user)
  if (userKeys["groq"]) {
    return {
      isPro: false,
      apiKey: userKeys["groq"],
      provider: "groq",
      model: env.groqModel || "llama-3.3-70b-versatile",
    };
  }

  if (userKeys["gemini"]) {
    return {
      isPro: false,
      apiKey: userKeys["gemini"],
      provider: "gemini",
      model: env.geminiModel || "gemini-1.5-flash",
    };
  }

  throw new Error(
    "Akun gratis wajib mengatur API Key AI (Groq atau Google Gemini) sendiri di auth.funikin.com untuk menggunakan fitur ini. Buka https://auth.funikin.com menu AI Key Management untuk menambahkan API key Anda (atau upgrade ke Akun Pro).",
  );
}

/**
 * Menyusun daftar provider untuk fitur formatting artikel:
 * - Pro: Menggunakan semua server key yang tersedia (Groq + Gemini multi-key)
 * - Gratis: Menggunakan API key milik user sendiri dari FunikIn
 */
export async function resolveFormattingProviders(actor?: Profile | null): Promise<FormattingAiProvider[]> {
  const MAX_CHUNK_CHARACTERS = 13_000;

  if (!actor) {
    // Tanpa login atau fallback umum
    const providers: FormattingAiProvider[] = [];
    if (env.groqApiKey && env.groqModel) {
      providers.push({ kind: "groq", label: "Groq", apiKey: env.groqApiKey, sourceLimit: MAX_CHUNK_CHARACTERS });
    }
    env.geminiApiKeys.forEach((apiKey, index) => {
      providers.push({ kind: "gemini", label: `Gemini ${index + 1}`, apiKey, sourceLimit: 26_000 });
    });
    return providers;
  }

  const isPro = await isProUser(actor);

  if (isPro) {
    const providers: FormattingAiProvider[] = [];
    if (env.groqApiKey && env.groqModel) {
      providers.push({
        kind: "groq",
        label: "Groq (ResponKu Pro)",
        apiKey: env.groqApiKey,
        sourceLimit: MAX_CHUNK_CHARACTERS,
      });
    }
    env.geminiApiKeys.forEach((apiKey, index) => {
      providers.push({
        kind: "gemini",
        label: `Gemini ${index + 1} (ResponKu Pro)`,
        apiKey,
        sourceLimit: 26_000,
      });
    });
    if (providers.length === 0) {
      throw new Error("Layanan AI format artikel server ResponKu belum dikonfigurasi.");
    }
    return providers;
  }

  // Akun Gratis:
  const authLink = await getFunikinAuthLink(actor);
  if (!authLink) {
    throw new Error(
      "Akun gratis wajib menghubungkan akun FunikIn untuk format naskah dengan AI. Silakan hubungkan akun FunikIn Anda dan atur API key di auth.funikin.com (atau upgrade ke Akun Pro).",
    );
  }

  const userKeys = await fetchUserAiKeysFromFunikin(authLink.providerUserId, authLink);
  const providers: FormattingAiProvider[] = [];

  if (userKeys["groq"]) {
    providers.push({
      kind: "groq",
      label: "Groq (Kunci Akun FunikIn)",
      apiKey: userKeys["groq"],
      sourceLimit: MAX_CHUNK_CHARACTERS,
    });
  }

  if (userKeys["gemini"]) {
    providers.push({
      kind: "gemini",
      label: "Google Gemini (Kunci Akun FunikIn)",
      apiKey: userKeys["gemini"],
      sourceLimit: 26_000,
    });
  }

  if (providers.length === 0) {
    throw new Error(
      "Akun gratis wajib memasukkan API Key Groq atau Google Gemini sendiri di auth.funikin.com untuk memformat naskah secara otomatis. Kunjungi https://auth.funikin.com menu AI Key Management untuk memasukkan API key Anda (atau upgrade ke Akun Pro).",
    );
  }

  return providers;
}
