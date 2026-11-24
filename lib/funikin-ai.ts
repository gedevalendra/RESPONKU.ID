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

/**
 * Ambil ID User FunikIn (UUID auth.users) yang terhubung dengan akun ResponKu
 */
export async function getFunikinUserId(actor: Profile): Promise<string | null> {
  try {
    const db = await communityDb();
    if (!db) return null;

    const funikinDoc = await db.collection("oauth_users").findOne<{ providerUserId?: string }>({
      provider: "funikin",
      $or: [
        { id: actor.id },
        { accountId: actor.id },
        { email: actor.email.toLowerCase() },
        ...(actor.emailConfirmed ? [{ verifiedEmail: actor.email.toLowerCase() }] : []),
      ],
    });

    if (funikinDoc?.providerUserId) {
      return String(funikinDoc.providerUserId).trim();
    }
  } catch (error) {
    console.error("Gagal mendapatkan FunikIn user ID:", error);
  }

  return null;
}

/**
 * Ambil daftar API Key aktif milik user dari database Supabase FunikIn
 */
export async function fetchUserAiKeysFromFunikin(funikinUserId: string): Promise<Record<string, string>> {
  const supabaseUrl = env.funikinSupabaseUrl;
  const secretKey = env.funikinSupabaseSecretKey;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Konfigurasi koneksi FunikIn Supabase belum lengkap di server ResponKu.");
  }

  const endpoint = `${supabaseUrl}/rest/v1/user_ai_keys?user_id=eq.${encodeURIComponent(
    funikinUserId,
  )}&is_active=eq.true&select=provider,api_key_encrypted`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gagal memuat API key dari FunikIn (HTTP ${res.status}): ${detail}`);
  }

  const rows = (await res.json()) as Array<{ provider: string; api_key_encrypted: string }>;
  const keys: Record<string, string> = {};

  for (const row of rows) {
    if (row.provider && row.api_key_encrypted) {
      keys[row.provider.toLowerCase().trim()] = row.api_key_encrypted.trim();
    }
  }

  return keys;
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
  const funikinUserId = await getFunikinUserId(actor);
  if (!funikinUserId) {
    throw new Error(
      "Akun gratis wajib menghubungkan akun FunikIn untuk menggunakan fitur AI. Silakan masuk atau hubungkan akun Anda dengan FunikIn di menu Akun, lalu atur API key Anda di auth.funikin.com (atau upgrade ke Akun Pro).",
    );
  }

  const userKeys = await fetchUserAiKeysFromFunikin(funikinUserId);

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
  const funikinUserId = await getFunikinUserId(actor);
  if (!funikinUserId) {
    throw new Error(
      "Akun gratis wajib menghubungkan akun FunikIn untuk format naskah dengan AI. Silakan hubungkan akun FunikIn Anda dan atur API key di auth.funikin.com (atau upgrade ke Akun Pro).",
    );
  }

  const userKeys = await fetchUserAiKeysFromFunikin(funikinUserId);
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
