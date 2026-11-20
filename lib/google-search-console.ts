import "server-only";

import { importPKCS8, SignJWT } from "jose";

const tokenEndpoint = "https://oauth2.googleapis.com/token";
const inspectionEndpoint = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
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

let cachedAccessToken: { value: string; expiresAt: number } | undefined;

function config(): SearchConsoleConfig | undefined {
  const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim();
  if (!clientEmail || !privateKey || !property) return undefined;
  return { clientEmail, privateKey, property };
}

export function isGoogleSearchConsoleConfigured() {
  return Boolean(config());
}

async function getAccessToken(settings: SearchConsoleConfig) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const privateKey = await importPKCS8(settings.privateKey, "RS256");
  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(settings.clientEmail)
    .setAudience(tokenEndpoint)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token request failed (${response.status})`);

  const token = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!token.access_token) throw new Error("Google token response did not include an access token");
  cachedAccessToken = {
    value: token.access_token,
    expiresAt: Date.now() + (token.expires_in || 3600) * 1000,
  };
  return cachedAccessToken.value;
}

export async function inspectGoogleUrls(urls: string[]) {
  const settings = config();
  if (!settings) throw new Error("Google Search Console is not configured");
  const accessToken = await getAccessToken(settings);
  const results: Array<{ url: string; indexed: boolean; lastCrawlTime?: string; inspectionResultLink?: string }> = [];

  for (let index = 0; index < urls.length; index += 5) {
    const batch = await Promise.all(urls.slice(index, index + 5).map(async (url) => {
      const response = await fetch(inspectionEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: settings.property, languageCode: "id-ID" }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Google URL Inspection failed (${response.status})`);

      const data = (await response.json()) as InspectionResponse;
      const status = data.inspectionResult?.indexStatusResult;
      return {
        url,
        indexed: status?.verdict === "PASS",
        lastCrawlTime: status?.lastCrawlTime,
        inspectionResultLink: data.inspectionResult?.inspectionResultLink,
      };
    }));
    results.push(...batch);
  }

  return results;
}