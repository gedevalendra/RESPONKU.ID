import "server-only";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Article, ArticleBlock, Comment, ReactionSummary, Profile } from "@/lib/types";
import { roleForEmail } from "@/lib/roles";
import { defaultAboutPage, normalizeAboutPage, type AboutPage } from "@/lib/about";

function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: String(row.id),
    articleSlug: String(row.article_slug),
    displayName: String(row.display_name),
    body: String(row.body),
    createdAt: String(row.created_at),
    status: (row.status as Comment["status"]) || "published",
  };
}

export async function listComments(articleSlug: string): Promise<Comment[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("comments").select("*").eq("article_slug", articleSlug).eq("status", "published").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map(mapComment);
}

export async function createComment(input: { articleSlug: string; displayName: string; body: string }): Promise<Comment> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { data, error } = await supabase.from("comments").insert({
    article_slug: input.articleSlug,
    display_name: input.displayName,
    body: input.body,
    status: env.commentsRequireModeration ? "pending" : "published",
  }).select("*").single();
  if (error) throw error;
  return mapComment(data);
}

export async function getReactionSummary(articleSlug: string): Promise<ReactionSummary> {
  const empty = { like: 0, insightful: 0, celebrate: 0 };
  const supabase = getSupabaseAdmin();
  if (!supabase) return empty;
  const { data, error } = await supabase.from("article_reactions").select("reaction").eq("article_slug", articleSlug);
  if (error) throw error;
  return (data || []).reduce((result, row) => {
    if (row.reaction in result) result[row.reaction as keyof ReactionSummary] += 1;
    return result;
  }, empty);
}

export async function addReaction(articleSlug: string, reaction: keyof ReactionSummary, visitorId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { error } = await supabase.from("article_reactions").upsert({ article_slug: articleSlug, reaction, visitor_id: visitorId }, { onConflict: "article_slug,visitor_id" });
  if (error) throw error;
  return getReactionSummary(articleSlug);
}

export async function getArticleFromDatabase(slug: string): Promise<Article | undefined> {
  const db = await getMongoDb();
  if (!db) return undefined;
  return (await db.collection<Article>("articles").findOne({ slug, status: "published" })) ?? undefined;
}

export async function listArticlesFromDatabase(filter: Record<string, unknown> = {}): Promise<Article[]> {
  const db = await getMongoDb();
  if (!db) return [];
  return db.collection<Article>("articles").find(filter).sort({ date: -1 }).toArray();
}

export async function listArticleCategories(): Promise<string[]> {
  const db = await getMongoDb();
  if (!db) return [];
  const values = await db.collection<Article>("articles").distinct("category", { status: "published" });
  return values.map(String).filter((value) => value.trim().length > 0).sort((a, b) => a.localeCompare(b, "id"));
}

export async function getAboutPage(): Promise<AboutPage> {
  const db = await getMongoDb();
  if (!db) return defaultAboutPage;
  const page = await db.collection("site_pages").findOne({ siteKey: "about" }) as AboutPage | null;
  return normalizeAboutPage(page);
}

export async function saveAboutPage(page: AboutPage): Promise<AboutPage> {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const value = { ...normalizeAboutPage(page), updatedAt: new Date().toISOString() };
  await db.collection("site_pages").replaceOne({ siteKey: "about" }, { siteKey: "about", ...value }, { upsert: true });
  return value;
}

export async function recordArticleView(slug: string, metadata: { ipHash?: string; userAgent?: string }) {
  const db = await getMongoDb();
  if (!db) return;
  await Promise.all([
    db.collection("articles").updateOne({ slug }, { $inc: { views: 1 }, $set: { updatedAt: new Date() } }),
    db.collection("article_events").insertOne({ articleSlug: slug, type: "view", ...metadata, createdAt: new Date() }),
  ]);
}

export function isObjectId(value: string) { return ObjectId.isValid(value); }

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 110);
}

export type ArticleInput = Pick<Article, "title" | "dek" | "category" | "author" | "readTime" | "content" | "featured" | "breaking"> & { contentBlocks?: ArticleBlock[] };

export async function upsertOAuthUser(input: { provider: string; providerUserId: string; email: string; displayName: string; avatarUrl?: string }): Promise<Profile> {
  const db = await getMongoDb();
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diisi di .env.local");
  if (!db) throw new Error("MongoDB Atlas tidak dapat tersambung. Periksa Network Access, DNS, username, dan password MongoDB.");
  const existing = await db.collection("oauth_users").findOne<{ id: string; role: string }>({ provider: input.provider, providerUserId: input.providerUserId });
  const id = existing?.id || new ObjectId().toHexString();
  const role = roleForEmail(input.email) === "superadmin" ? "superadmin" : (existing?.role || "reader");
  await db.collection("oauth_users").updateOne({ provider: input.provider, providerUserId: input.providerUserId }, { $set: { id, ...input, role, updatedAt: new Date().toISOString() }, $setOnInsert: { createdAt: new Date().toISOString() } }, { upsert: true });
  return { id, email: input.email, displayName: input.displayName, role: role as Profile["role"] };
}

export async function getOAuthUserById(id: string) {
  const db = await getMongoDb();
  if (!db) return null;
  return db.collection<{ id: string; email: string; displayName: string; role: string; username?: string; organization?: string; avatarUrl?: string }>("oauth_users").findOne({ id });
}

export async function updateOAuthProfile(id: string, patch: { displayName: string; username: string; organization: string; avatarUrl?: string }) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const result = await db.collection("oauth_users").updateOne({ id }, { $set: { ...patch, updatedAt: new Date().toISOString() } });
  if (!result.matchedCount) throw new Error("Profil OAuth tidak ditemukan");
  return db.collection("oauth_users").findOne({ id });
}

export async function listOAuthUsers() {
  const db = await getMongoDb();
  if (!db) return [];
  return db.collection("oauth_users").find({}, { projection: { id: 1, email: 1, displayName: 1, role: 1, provider: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();
}

export async function updateOAuthUserRole(id: string, role: Profile["role"]) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const result = await db.collection("oauth_users").updateOne({ id }, { $set: { role, updatedAt: new Date().toISOString() } });
  if (!result.matchedCount) throw new Error("User OAuth tidak ditemukan");
}

export async function createArticle(input: ArticleInput, actor: Profile, status: Article["status"] = "pending") {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum dikonfigurasi");
  const now = new Date();
  const slug = `${slugify(input.title)}-${now.getTime().toString(36)}`;
  const article: Article = { ...input, id: new ObjectId().toHexString(), slug, date: now.toISOString(), views: 0, status, authorId: actor.id, authorEmail: actor.email, submittedAt: now.toISOString(), updatedAt: now.toISOString() };
  await db.collection<Article>("articles").insertOne(article);
  return article;
}

export async function updateArticle(id: string, patch: Partial<Article>, actor: Profile) {
  const db = await getMongoDb();
  if (!db || !isObjectId(id)) throw new Error("Artikel tidak valid");
  const existing = await db.collection<Article>("articles").findOne({ id });
  if (!existing) throw new Error("Artikel tidak ditemukan");
  const update = { ...patch, updatedAt: new Date().toISOString() };
  await db.collection<Article>("articles").updateOne({ id }, { $set: update });
  return { ...existing, ...update };
}

export async function deleteArticle(id: string) {
  const db = await getMongoDb();
  if (!db || !isObjectId(id)) throw new Error("Artikel tidak valid");
  await db.collection<Article>("articles").deleteOne({ id });
}
