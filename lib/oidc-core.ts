import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

export interface OidcDiscoveryDoc {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
  id_token_signing_alg_values_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
}

let cachedDiscovery: { doc: OidcDiscoveryDoc; expiresAt: number; issuer: string } | null = null;
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJwksUri: string | null = null;

export function _resetOidcCache() {
  cachedDiscovery = null;
  cachedJwks = null;
  cachedJwksUri = null;
}

export function sanitizeRedirectPath(path?: string | null): string {
  if (!path) return "/";
  const trimmed = path.trim();
  // Cegah protocol-relative URLs (//evil.com), backslash evasion (/\evil.com or \evil.com)
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\")
  ) {
    return "/";
  }
  try {
    const dummyOrigin = "http://localhost";
    const resolved = new URL(trimmed, dummyOrigin);
    if (resolved.origin !== dummyOrigin) return "/";
    if (resolved.protocol !== "http:") return "/";
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/";
  }
}

export function getBaseAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getFunikinDiscoveryDoc(
  issuerInput?: string,
  isProduction: boolean = process.env.NODE_ENV === "production",
): Promise<OidcDiscoveryDoc> {
  const issuer = issuerInput?.trim().replace(/\/$/, "");
  if (!issuer) {
    throw new Error("FUNIKIN_ISSUER belum dikonfigurasi");
  }

  // Wajib HTTPS di production dan tolak localhost/http
  if (isProduction) {
    if (!issuer.startsWith("https://") || issuer.includes("localhost") || issuer.includes("127.0.0.1")) {
      throw new Error("FUNIKIN_ISSUER wajib menggunakan HTTPS di production dan tidak boleh localhost");
    }
  }

  const now = Date.now();
  if (cachedDiscovery && cachedDiscovery.issuer === issuer && cachedDiscovery.expiresAt > now) {
    return Promise.resolve(cachedDiscovery.doc);
  }

  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  return fetch(discoveryUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) {
      // Jangan cache respons error!
      throw new Error(`Gagal mengambil OIDC discovery dari ${discoveryUrl}: HTTP ${response.status}`);
    }

    const doc = (await response.json()) as OidcDiscoveryDoc;

    // Pastikan field issuer == FUNIKIN_ISSUER
    if (!doc.issuer || doc.issuer.trim().replace(/\/$/, "") !== issuer) {
      throw new Error(`Issuer pada discovery (${doc.issuer}) tidak cocok dengan FUNIKIN_ISSUER (${issuer})`);
    }

    if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.jwks_uri) {
      throw new Error("OIDC discovery tidak memiliki authorization_endpoint, token_endpoint, atau jwks_uri");
    }

    // Cache valid discovery selama 1 jam
    cachedDiscovery = { doc, expiresAt: now + 60 * 60 * 1000, issuer };
    return doc;
  });
}

export function getFunikinJwks(jwksUri: string) {
  if (cachedJwks && cachedJwksUri === jwksUri) {
    return cachedJwks;
  }
  const jwks = createRemoteJWKSet(new URL(jwksUri));
  cachedJwks = jwks;
  cachedJwksUri = jwksUri;
  return jwks;
}

export function buildTokenEndpointRequest(params: {
  discovery: OidcDiscoveryDoc;
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const { discovery, clientId, clientSecret, code, codeVerifier, redirectUri } = params;
  const authMethods = discovery.token_endpoint_auth_methods_supported || [
    "client_secret_basic",
    "client_secret_post",
  ];
  // RFC 6749 & OpenID Connect: client_secret_basic adalah metode standar default untuk confidential clients
  const preferBasic = authMethods.includes("client_secret_basic");

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  if (preferBasic) {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${creds}`;
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }

  return { headers, body };
}

export async function verifyFunikinIdToken(params: {
  idToken: string;
  jwks: ReturnType<typeof createRemoteJWKSet>;
  discovery: OidcDiscoveryDoc;
  clientId: string;
  expectedNonce: string;
}): Promise<JWTPayload> {
  const { idToken, jwks, discovery, clientId, expectedNonce } = params;

  // Syarat 1: Kunci algoritma ke asymmetric saja (RS256/ES256 dsb), tolak none dan HS*
  const allowedAsymmetric = [
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
    "PS256",
    "PS384",
    "PS512",
  ];
  let allowedAlgs = (
    discovery.id_token_signing_alg_values_supported || ["RS256"]
  ).filter((alg) => allowedAsymmetric.includes(alg));
  if (allowedAlgs.length === 0) {
    allowedAlgs = ["RS256", "ES256"];
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: discovery.issuer,
    audience: clientId,
    algorithms: allowedAlgs,
  });

  // Validasi nonce
  if (!payload.nonce || payload.nonce !== expectedNonce) {
    throw new Error("Nonce OIDC tidak cocok atau telah dimanipulasi");
  }

  // Identitas pengguna murni dari claim sub
  const sub = String(payload.sub || "").trim();
  if (!sub) {
    throw new Error("Klaim sub tidak ditemukan pada id_token FunikIn");
  }

  return payload;
}

export function determineVerifiedEmail(
  provider: "google" | "funikin",
  user: { email?: string; email_verified?: boolean; hd?: string },
): string | undefined {
  if (!user.email) return undefined;
  const email = user.email.trim().toLowerCase();
  // Syarat 3: Tautkan otomatis hanya jika email_verified === true (boolean ketat)
  const isVerified =
    user.email_verified === true &&
    (provider === "funikin" || email.endsWith("@gmail.com") || Boolean(user.hd));
  return isVerified ? email : undefined;
}
