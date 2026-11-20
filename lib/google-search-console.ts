
import "server-only";

import { importPKCS8, SignJWT } from "jose";

const tokenEndpoint = "https://oauth2.googleapis.com/token";

const inspectionEndpoint =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

const scope = "https://www.googleapis.com/auth/webmasters.readonly";

type SearchConsoleConfig = {
  clientEmail: string;
  privateKey: string;
  property: string;
};

type InspectionResponse = {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string;
      lastCrawlTime?: string;
    };
  };
};

let cachedAccessToken:
  | { value: string; expiresAt: number }
  | undefined;

// ==========================================
// GOOGLE SEARCH CONSOLE CONFIGURATION
// ==========================================

function config(): SearchConsoleConfig | undefined {
  const clientEmail =
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();

  const rawPrivateKey =
    process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;

  const privateKey = rawPrivateKey
    ?.replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  const property =
    process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim();

  if (!clientEmail || !privateKey || !property) {
    return undefined;
  }

  // Validate PKCS#8 private key format
  if (
    !privateKey.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.endsWith("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "Google Search Console: Private Key tidak valid. Pastikan menggunakan private_key dari file JSON Service Account Google Cloud."
    );
  }

  return {
    clientEmail,
    privateKey,
    property,
  };
}

// ==========================================
// CHECK CONFIGURATION
// ==========================================

export function isGoogleSearchConsoleConfigured() {
  return Boolean(config());
}

// ==========================================
// GET GOOGLE ACCESS TOKEN
// ==========================================

async function getAccessToken(settings: SearchConsoleConfig) {
  if (
    cachedAccessToken &&
    cachedAccessToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedAccessToken.value;
  }

  const pem = settings.privateKey
    .replace(/\\n/g, "\n")
    .trim();

  let privateKey;

  try {
    privateKey = await importPKCS8(pem, "RS256");
  } catch {
    throw new Error(
      "Google Search Console: Gagal membaca Private Key. Periksa format PKCS#8 dan isi GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY."
    );
  }

  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
    })
    .setIssuer(settings.clientEmail)
    .setAudience(tokenEndpoint)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type:
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Google token request failed (${response.status}): ${errorText}`
    );
  }

  const token = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!token.access_token) {
    throw new Error(
      "Google token response did not include an access token"
    );
  }

  cachedAccessToken = {
    value: token.access_token,
    expiresAt:
      Date.now() + (token.expires_in || 3600) * 1000,
  };

  return cachedAccessToken.value;
}

// ==========================================
// INSPECT GOOGLE INDEX STATUS
// ==========================================

export async function inspectGoogleUrls(urls: string[]) {
  const settings = config();

  if (!settings) {
    throw new Error(
      "Google Search Console is not configured. Periksa file .env."
    );
  }

  if (!urls.length) {
    return [];
  }

  const accessToken = await getAccessToken(settings);

  const results: Array<{
    url: string;
    indexed: boolean;
    lastCrawlTime?: string;
    inspectionResultLink?: string;
  }> = [];

  // Process maximum 5 URLs concurrently
  for (let index = 0; index < urls.length; index += 5) {
    const batch = await Promise.all(
      urls.slice(index, index + 5).map(async (url) => {
        const response = await fetch(inspectionEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inspectionUrl: url,
            siteUrl: settings.property,
            languageCode: "id-ID",
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            `Google URL Inspection failed (${response.status}): ${errorText}`
          );
        }

        const data =
          (await response.json()) as InspectionResponse;

        const status =
          data.inspectionResult?.indexStatusResult;

        return {
          url,
          indexed: status?.verdict === "PASS",
          lastCrawlTime: status?.lastCrawlTime,
          inspectionResultLink:
            data.inspectionResult?.inspectionResultLink,
        };
      })
    );

    results.push(...batch);
  }

  return results;
}
