import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { communityDb } from "@/lib/community";

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export async function getApiSecrets() {
  const db = await communityDb();
  const credentials = await db.collection("api_credentials").find({}).sort({ createdAt: -1 }).toArray();
  return credentials.map((credential) => ({ id: String(credential.id || credential.key || ""), name: String(credential.name || "Secret ID lama"), createdAt: String(credential.createdAt || "") }));
}

export async function createApiSecret(name: string) {
  const secret = `rsp_live_${randomBytes(32).toString("base64url")}`;
  const now = new Date().toISOString();
  const id = randomBytes(16).toString("hex");
  const db = await communityDb();
  await db.collection("api_credentials").insertOne({ id, name, secretHash: hashSecret(secret), createdAt: now });
  return { id, name, secret, createdAt: now };
}

export async function revokeApiSecret(id: string) {
  const db = await communityDb();
  return (await db.collection("api_credentials").deleteOne({ $or: [{ id }, { key: id }] })).deletedCount > 0;
}

export async function verifyApiSecret(secret: string) {
  if (!secret) return false;
  const db = await communityDb();
  const provided = Buffer.from(hashSecret(secret), "hex");
  const credentials = await db.collection("api_credentials").find<{ secretHash?: string }>({}).toArray();
  return credentials.some((credential) => {
    if (!credential.secretHash) return false;
    const stored = Buffer.from(credential.secretHash, "hex");
    return provided.length === stored.length && timingSafeEqual(provided, stored);
  });
}

export function apiSecretFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return request.headers.get("x-api-secret-id")?.trim() || "";
}
