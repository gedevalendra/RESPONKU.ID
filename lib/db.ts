import "server-only";
import { linkedAccountIds } from "@/lib/account-identity";
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
  const profile = row.profiles as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    articleSlug: String(row.article_slug),
    parentId: row.parent_id ? String(row.parent_id) : null,
    avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : null,
    displayName: String(row.display_name),
    body: String(row.body),
    createdAt: String(row.created_at),
    status: (row.status as Comment["status"]) || "published",
    likes: Number(row.likes || 0),
    dislikes: Number(row.dislikes || 0),
    viewerReaction: (row.viewer_reaction as Comment["viewerReaction"]) || null,
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

export async function countUnreadNotifications(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;
  const { count, error } = await supabase.from("notifications")
    .select("id", { count: "exact", head: true })
    .in("user_id", await linkedAccountIds(userId)).is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function listNotifications(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("id,user_id,title,body,href,read_at,created_at")
    .in("user_id", await linkedAccountIds(userId))
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
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .in("user_id", await linkedAccountIds(userId));
  if (error) throw error;
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
    if (user.accountId) return false;
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
  const oauthIds = (await listOAuthUsers()).filter((user) => !user.accountId).map((user) => String(user.id));
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

export async function listComments(articleSlug: string, visitorId?: string): Promise<Comment[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let result = await supabase
    .from("comments")
    .select("*, profiles:author_id(avatar_url)")
    .eq("article_slug", articleSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);
  if (result.error) {
    result = await supabase
      .from("comments")
      .select("*")
      .eq("article_slug", articleSlug)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
  }
  if (result.error) throw result.error;
  const data = result.data || [];
  const oauthIds = [...new Set(data.map((row) => row.oauth_author_id).filter(Boolean))];
  const mongo = oauthIds.length ? await getMongoDb() : null;
  const oauthProfiles = mongo
    ? await mongo.collection("oauth_users").find({ id: { $in: oauthIds } })
        .project({ id: 1, avatarUrl: 1 }).toArray()
    : [];
  const oauthAvatars = new Map(oauthProfiles.map((profile) => [profile.id, profile.avatarUrl]));
  const authorIds = [...new Set(data
    .map((row) => row.author_id ? String(row.author_id) : "")
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
  const displayNames = [...new Set(data
    .map((row) => String(row.display_name || ""))
    .filter(Boolean))];
  const [profilesByIdResult, profilesByNameResult] = await Promise.all([
    authorIds.length
      ? supabase.from("profiles").select("id,display_name,avatar_url").in("id", authorIds)
      : Promise.resolve({ data: [] }),
    displayNames.length
      ? supabase.from("profiles").select("id,display_name,avatar_url").in("display_name", displayNames)
      : Promise.resolve({ data: [] }),
  ]);
  const profilesById = new Map(
    (profilesByIdResult.data || []).map((profile) => [String(profile.id), profile]),
  );
  const profilesByName = new Map(
    (profilesByNameResult.data || []).map((profile) => [String(profile.display_name), profile]),
  );
  const ids = (data || []).map((row) => row.id);
  const reactionResult = ids.length
    ? await supabase
        .from("comment_reactions")
        .select("comment_id,reaction")
        .in("comment_id", ids)
    : { data: [] };
  const reactions = reactionResult.data || [];
  const viewerResult = visitorId && ids.length
    ? await supabase.from("comment_reactions").select("comment_id,reaction")
        .in("comment_id", ids).eq("visitor_id", visitorId)
    : { data: [] };
  const viewerReactions = new Map((viewerResult.data || []).map((row) => [row.comment_id, row.reaction]));
  const counts = new Map<string, { like: number; dislike: number }>();
  (reactions || []).forEach((reaction) => { const current = counts.get(String(reaction.comment_id)) || { like: 0, dislike: 0 }; current[reaction.reaction as "like" | "dislike"] += 1; counts.set(String(reaction.comment_id), current); });
  return data.map((row) => {
    const count = counts.get(String(row.id)) || { like: 0, dislike: 0 };
    const joinedProfile = row.profiles as Record<string, unknown> | null;
    const profile = joinedProfile
      || profilesById.get(String(row.author_id || ""))
      || profilesByName.get(String(row.display_name || ""));
    return {
      ...mapComment({ ...row, profiles: profile }),
      ...(oauthAvatars.get(row.oauth_author_id)
        ? { avatarUrl: oauthAvatars.get(row.oauth_author_id) }
        : {}),
      likes: count.like,
      dislikes: count.dislike,
      viewerReaction: viewerReactions.get(row.id) ?? null,
    };
  });
}

export async function createComment(input: {
  articleSlug: string;
  displayName: string;
  body: string;
  parentId?: string;
  authorId?: string;
  oauthAuthorId?: string;
}): Promise<Comment> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  let result = await supabase
    .from("comments")
    .insert({
      article_slug: input.articleSlug,
      parent_id: input.parentId || null,
      author_id: input.authorId || null,
      ...(input.oauthAuthorId ? { oauth_author_id: input.oauthAuthorId } : {}),
      display_name: input.displayName,
      body: input.body,
      status: (await commentNeedsReview(input.body)) ? "pending" : "published",
    })
    .select("*")
    .single();
  if (result.error && ["PGRST204", "42703", "23503"].includes(result.error.code)
    && (input.authorId || input.oauthAuthorId)) {
    result = await supabase
      .from("comments")
      .insert({
        article_slug: input.articleSlug,
        parent_id: input.parentId || null,
        display_name: input.displayName,
        body: input.body,
        status: (await commentNeedsReview(input.body)) ? "pending" : "published",
      })
      .select("*")
      .single();
  }
  if (result.error) throw result.error;
  return mapComment(result.data);
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
  const authorId = filter.authorId;
  const query = typeof authorId === "string"
    ? { ...filter, authorId: { $in: await linkedAccountIds(authorId) } }
    : filter;
  return db
    .collection<Article>("articles")
    .find(query)
    .sort({ date: -1 })
    .toArray();
}

export async function listPublishedArticleIndex() {
  const db = await getMongoDb();
  if (!db) return [];
  return db.collection<Article>("articles")
    .find({ status: "published", slug: { $type: "string", $ne: "" } })
    .project<Pick<Article, "slug" | "title" | "publishedAt" | "date">>({
      _id: 0, slug: 1, title: 1, publishedAt: 1, date: 1,
    })
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

export async function countRecentArticleViews(since: Date) {
  const db = await getMongoDb();
  if (!db) return new Map<string, number>();
  const counts = await db.collection("article_events").aggregate<{ _id: string; count: number }>([
    { $match: { type: "view", createdAt: { $gte: since } } },
    { $group: { _id: "$articleSlug", count: { $sum: 1 } } },
  ]).toArray();
  return new Map(counts.map(({ _id, count }) => [_id, count]));
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
  verifiedEmail?: string;
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

  const role =
    input.verifiedEmail && roleForEmail(input.verifiedEmail) === "superadmin"
      ? "superadmin"
      : existing?.role || "reader";
  const stored = await db
    .collection("oauth_users")
    .findOneAndUpdate(
      { provider: input.provider, providerUserId: input.providerUserId },
      {
        $set: {
          email: input.email,
          role,
          updatedAt: new Date().toISOString(),
          ...(input.verifiedEmail ? { verifiedEmail: input.verifiedEmail } : {}),
        },
        $setOnInsert: {
          id: new ObjectId().toHexString(),
          provider: input.provider,
          providerUserId: input.providerUserId,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          createdAt: new Date().toISOString(),
        },
        ...(!input.verifiedEmail ? { $unset: { verifiedEmail: "", accountId: "" } } : {}),
      },
      { upsert: true, returnDocument: "after" },
    );
  if (!stored) throw new Error("Profil OAuth gagal disimpan");
  return {
    id: String(stored.id),
    email: input.email,
    displayName: String(stored.displayName),
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
      verifiedEmail?: string;
      accountId?: string;
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
          verifiedEmail: 1,
          accountId: 1,
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
    ...(status === "published" ? { publishedAt: now.toISOString() } : {}),
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
  const now = new Date().toISOString();
  const update = {
    ...patch,
    ...(patch.status === "published" && existing.status !== "published" ? { publishedAt: now } : {}),
    ...(patch.status && patch.status !== "published" && existing.status === "published" ? { takenDownAt: now } : {}),
    updatedAt: now,
  };
  await db.collection<Article>("articles").updateOne({ id }, { $set: update });
  return { ...existing, ...update };
}

export async function deleteArticle(id: string) {
  const db = await getMongoDb();
  if (!db || !isObjectId(id)) throw new Error("Artikel tidak valid");
  await db.collection<Article>("articles").deleteOne({ id });
}
