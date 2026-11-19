import "server-only";
import { getMongoDb } from "@/lib/mongodb";

const pinKey = "homepage_article_pin";
type HomepagePin = { _id: string; articleIds?: string[]; articleId?: string };

async function settings() {
  const db = await getMongoDb();
  return db?.collection<HomepagePin>("site_settings");
}

export async function getPinnedArticleIds() {
  const pin = await (await settings())?.findOne({ _id: pinKey });
  const ids = pin?.articleIds?.length ? pin.articleIds : pin?.articleId ? [pin.articleId] : [];
  return [...new Set(ids)];
}

export async function setHomepagePin(articleId: string, pinned: boolean) {
  const collection = await settings();
  if (!collection) throw new Error("Database belum tersambung");
  const pin = await collection.findOne({ _id: pinKey });
  const currentIds = pin?.articleIds?.length ? pin.articleIds : pin?.articleId ? [pin.articleId] : [];
  const articleIds = pinned
    ? currentIds.includes(articleId) ? currentIds : [...currentIds, articleId]
    : currentIds.filter((id) => id !== articleId);
  await collection.updateOne(
    { _id: pinKey },
    { $set: { articleIds }, $unset: { articleId: "" } },
    { upsert: true },
  );
  return articleIds;
}
