import "server-only";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { commentNeedsReview } from "@/lib/comment-moderation";
import type {
  Article,
  ArticleBlock,
  Comment,
  Notification,
  ReactionSummary,
  Profile,
} from "@/lib/types";
import { roleForEmail } from "@/lib/roles";
import {
  defaultAboutPage,
  normalizeAboutPage,
  type AboutPage,
} from "@/lib/about";

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

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : undefined,
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  };
}

export async function listNotifications(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("id,user_id,title,body,href,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data || []).map(mapNotification);
}

export async function listTickerHeadlines() {
  const db = await getMongoDb();
  if (!db) return [];
  const manual = await db.collection("site_settings").findOne<{
    value?: string[];
    updatedAt?: string;
  }>({ key: "ticker_manual" });
  const manualHeadlines = (manual?.value || []).map((item) => item.trim()).filter(Boolean);
  if (manualHeadlines.length) return manualHeadlines;
  const cached = await db.collection("site_settings").findOne<{
    value?: string[];
    generatedAt?: string;
  }>({ key: "ticker_headlines" });
  if (
    cached?.value?.length &&
    cached.generatedAt &&
    Date.now() - new Date(cached.generatedAt).getTime() < 10 * 60 * 1000
  )
    return cached.value;
  const articles = await db
    .collection<Article>("articles")
    .find({ status: "published" }, { projection: { title: 1, views: 1, date: 1 } })
    .sort({ views: -1, date: -1 })
    .limit(8)
    .toArray();
  const titles = articles.map((article) => article.title).filter(Boolean);
  if (!titles.length) return [];
  let headlines = titles;
  if (env.groqApiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.groqModel,
          temperature: 0.25,
          max_tokens: 180,
          messages: [
            {
              role: "system",
              content:
                "Buat 4 ticker berita bahasa Indonesia dari daftar judul. Satu ticker satu kalimat singkat, netral, tanpa nomor, tanpa klaim baru.",
            },
            { role: "user", content: titles.join("\n") },
          ],
        }),
      });
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const generated = data.choices?.[0]?.message?.content
        ?.split("\n")
        .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 4);
      if (generated?.length) headlines = generated;
    } catch {
      headlines = titles;
    }
  }
  await db.collection("site_settings").updateOne(
    { key: "ticker_headlines" },
    {
      $set: { value: headlines, generatedAt: new Date().toISOString() },
    },
    { upsert: true },
  );
  return headlines;
}

export async function getManualTickerHeadlines() {
  const db = await getMongoDb();
  if (!db) return [];
  const setting = await db.collection("site_settings").findOne<{ value?: string[] }>(
    { key: "ticker_manual" },
  );
  return (setting?.value || []).map((item) => item.trim()).filter(Boolean);
}

export async function saveManualTickerHeadlines(headlines: string[]) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum dikonfigurasi");
  const value = headlines.map((item) => item.trim()).filter(Boolean).slice(0, 12);
  await db.collection("site_settings").updateOne(
    { key: "ticker_manual" },
    { $set: { value, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
  return value;
}

export async function markNotificationRead(id: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      href: input.href || null,
    })
    .select("id,user_id,title,body,href,read_at,created_at")
    .single();
  if (error) throw error;
  return mapNotification(data);
}

export async function searchNotificationRecipients(query = "") {
  const supabase = getSupabaseAdmin();
  const normalized = query.trim();
  const profiles = supabase
    ? await supabase
        .from("profiles")
        .select("id,email,display_name,username,avatar_url")
        .or(normalized ? `display_name.ilike.%${normalized}%,email.ilike.%${normalized}%,username.ilike.%${normalized}%` : "id.not.is.null")
        .order("display_name")
        .limit(3)
    : { data: [] };
  const oauthMatches = (await listOAuthUsers()).filter((user) => {
    if (!normalized) return true;
    return `${user.displayName} ${user.email} ${user.username || ""}`.toLowerCase().includes(normalized.toLowerCase());
  }).slice(0, 3).map((user) => ({ id: user.id, email: user.email, displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl }));
  const merged = [
    ...(profiles.data || []).map((profile) => ({ id: String(profile.id), email: String(profile.email), displayName: String(profile.display_name), username: profile.username ? String(profile.username) : undefined, avatarUrl: profile.avatar_url ? String(profile.avatar_url) : undefined })),
    ...oauthMatches,
  ];
  return merged.filter((user, index, all) => all.findIndex((item) => item.id === user.id) === index).slice(0, 3);
}

export async function listNotificationRecipientIds() {
  const supabase = getSupabaseAdmin();
  const profileIds = supabase ? (await supabase.from("profiles").select("id")).data?.map((row) => String(row.id)) || [] : [];
  const oauthIds = (await listOAuthUsers()).map((user) => String(user.id));
  return [...new Set([...profileIds, ...oauthIds])];
}

export async function savePushSubscription(
  userId: string,
  subscription: Record<string, unknown>,
) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum dikonfigurasi");
  await db.collection("push_subscriptions").updateOne(
    { userId, endpoint: subscription.endpoint },
    {
      $set: {
        userId,
        endpoint: subscription.endpoint,
        subscription,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true },
  );
}

export async function removePushSubscription(
  userId: string,
  endpoint: string,
) {
  const db = await getMongoDb();
  if (!db) return;
  await db.collection("push_subscriptions").deleteOne({ userId, endpoint });
}

export async function listPushSubscriptions(userId: string) {
  const db = await getMongoDb();
  if (!db) return [];
  return db
    .collection<{ subscription: Record<string, unknown> }>("push_subscriptions")
    .find({ userId })
    .toArray();
}

export async function listComments(articleSlug: string): Promise<Comment[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("article_slug", articleSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(mapComment);
}

export async function createComment(input: {
  articleSlug: string;
  displayName: string;
  body: string;
}): Promise<Comment> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { data, error } = await supabase
    .from("comments")
    .insert({
      article_slug: input.articleSlug,
      display_name: input.displayName,
      body: input.body,
      status: (await commentNeedsReview(input.body)) ? "pending" : "published",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapComment(data);
}

export async function getReactionSummary(
  articleSlug: string,
): Promise<ReactionSummary> {
  const empty = { like: 0, insightful: 0, celebrate: 0 };
  const supabase = getSupabaseAdmin();
  if (!supabase) return empty;
  const { data, error } = await supabase
    .from("article_reactions")
    .select("reaction")
    .eq("article_slug", articleSlug);
  if (error) throw error;
  return (data || []).reduce((result, row) => {
    if (row.reaction in result)
      result[row.reaction as keyof ReactionSummary] += 1;
    return result;
  }, empty);
}

export async function addReaction(
  articleSlug: string,
  reaction: keyof ReactionSummary,
  visitorId: string,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  const { error } = await supabase
    .from("article_reactions")
    .upsert(
      { article_slug: articleSlug, reaction, visitor_id: visitorId },
      { onConflict: "article_slug,visitor_id" },
    );
  if (error) throw error;
  return getReactionSummary(articleSlug);
}

export async function getArticleFromDatabase(
  slug: string,
): Promise<Article | undefined> {
  const db = await getMongoDb();
  if (!db) return undefined;
  return (
    (await db
      .collection<Article>("articles")
      .findOne({ slug, status: "published" })) ?? undefined
  );
}

export async function listArticlesFromDatabase(
  filter: Record<string, unknown> = {},
): Promise<Article[]> {
  const db = await getMongoDb();
  if (!db) return [];
  return db
    .collection<Article>("articles")
    .find(filter)
    .sort({ date: -1 })
    .toArray();
}

export async function listArticleCategories(): Promise<string[]> {
  const db = await getMongoDb();
  if (!db) return [];
  const values = await db
    .collection<Article>("articles")
    .distinct("category", { status: "published" });
  return values
    .map(String)
    .filter((value) => value.trim().length > 0)
    .sort((a, b) => a.localeCompare(b, "id"));
}

export async function getAboutPage(): Promise<AboutPage> {
  const db = await getMongoDb();
  if (!db) return defaultAboutPage;
  const page = (await db
    .collection("site_pages")
    .findOne({ siteKey: "about" })) as AboutPage | null;
  return normalizeAboutPage(page);
}

export async function saveAboutPage(page: AboutPage): Promise<AboutPage> {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const value = {
    ...normalizeAboutPage(page),
    updatedAt: new Date().toISOString(),
  };
  await db
    .collection("site_pages")
    .replaceOne(
      { siteKey: "about" },
      { siteKey: "about", ...value },
      { upsert: true },
    );
  return value;
}

export async function recordArticleView(
  slug: string,
  metadata: { ipHash?: string; userAgent?: string },
) {
  const db = await getMongoDb();
  if (!db) return;
  await Promise.all([
    db
      .collection("articles")
      .updateOne(
        { slug },
        { $inc: { views: 1 }, $set: { updatedAt: new Date() } },
      ),
    db
      .collection("article_events")
      .insertOne({
        articleSlug: slug,
        type: "view",
        ...metadata,
        createdAt: new Date(),
      }),
  ]);
}

export function isObjectId(value: string) {
  return ObjectId.isValid(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 110);
}

export type ArticleInput = Pick<
  Article,
  | "title"
  | "dek"
  | "thumbnailUrl"
  | "category"
  | "author"
  | "readTime"
  | "content"
  | "featured"
  | "breaking"
> & { contentBlocks?: ArticleBlock[] };

export async function upsertOAuthUser(input: {
  provider: string;
  providerUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}): Promise<Profile> {
  const db = await getMongoDb();
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI belum diisi di .env.local");
  if (!db)
    throw new Error(
      "MongoDB Atlas tidak dapat tersambung. Periksa Network Access, DNS, username, dan password MongoDB.",
    );
  const existing = await db
    .collection("oauth_users")
    .findOne<{
      id: string;
      role: string;
    }>({ provider: input.provider, providerUserId: input.providerUserId });
  const id = existing?.id || new ObjectId().toHexString();
  const role =
    roleForEmail(input.email) === "superadmin"
      ? "superadmin"
      : existing?.role || "reader";
  await db
    .collection("oauth_users")
    .updateOne(
      { provider: input.provider, providerUserId: input.providerUserId },
      {
        $set: { id, ...input, role, updatedAt: new Date().toISOString() },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );
  return {
    id,
    email: input.email,
    displayName: input.displayName,
    role: role as Profile["role"],
  };
}

export async function getOAuthUserById(id: string) {
  const db = await getMongoDb();
  if (!db) return null;
  return db
    .collection<{
      id: string;
      email: string;
      displayName: string;
      role: string;
      username?: string;
      organization?: string;
      avatarUrl?: string;
      backgroundUrl?: string;
      bio?: string;
    }>("oauth_users")
    .findOne({ id });
}

export async function updateOAuthProfile(
  id: string,
  patch: {
    displayName: string;
    username: string;
    organization: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    bio?: string;
  },
) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const result = await db
    .collection("oauth_users")
    .updateOne(
      { id },
      { $set: { ...patch, updatedAt: new Date().toISOString() } },
    );
  if (!result.matchedCount) throw new Error("Profil OAuth tidak ditemukan");
  return db.collection("oauth_users").findOne({ id });
}

export async function updateOAuthAvatar(id: string, avatarUrl: string) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const result = await db.collection("oauth_users").updateOne(
    { id },
    { $set: { avatarUrl, updatedAt: new Date().toISOString() } },
  );
  if (!result.matchedCount) throw new Error("Profil OAuth tidak ditemukan");
}

export async function updateOAuthBackground(id: string, backgroundUrl: string) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const result = await db.collection("oauth_users").updateOne(
    { id },
    { $set: { backgroundUrl, updatedAt: new Date().toISOString() } },
  );
  if (!result.matchedCount) throw new Error("Profil OAuth tidak ditemukan");
}

export async function listOAuthUsers() {
  const db = await getMongoDb();
  if (!db) return [];
  return db
    .collection("oauth_users")
    .find(
      {},
      {
        projection: {
          id: 1,
          email: 1,
          displayName: 1,
          username: 1,
          role: 1,
          provider: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateOAuthUserRole(id: string, role: Profile["role"]) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum tersambung");
  const result = await db
    .collection("oauth_users")
    .updateOne({ id }, { $set: { role, updatedAt: new Date().toISOString() } });
  if (!result.matchedCount) throw new Error("User OAuth tidak ditemukan");
}

export async function createArticle(
  input: ArticleInput,
  actor: Profile,
  status: Article["status"] = "pending",
) {
  const db = await getMongoDb();
  if (!db) throw new Error("MongoDB belum dikonfigurasi");
  const now = new Date();
  const slug = `${slugify(input.title)}-${now.getTime().toString(36)}`;
  const article: Article = {
    ...input,
    id: new ObjectId().toHexString(),
    slug,
    date: now.toISOString(),
    views: 0,
    status,
    authorId: actor.id,
    authorEmail: actor.email,
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await db.collection<Article>("articles").insertOne(article);
  return article;
}

export async function updateArticle(
  id: string,
  patch: Partial<Article>,
  actor: Profile,
) {
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
