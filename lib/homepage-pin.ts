import "server-only";
import { getMongoDb } from "@/lib/mongodb";

const pinKey = "homepage_article_pin";

async function settings() {
  const db = await getMongoDb();
  return db?.collection<{ _id: string; articleId: string }>("site_settings");
}

export async function getPinnedArticleId() {
  return (await (await settings())?.findOne({ _id: pinKey }))?.articleId ?? null;
}

export async function setHomepagePin(articleId: string, pinned: boolean) {
  const collection = await settings();
  if (!collection) throw new Error("Database belum tersambung");
  if (pinned) {
    await collection.updateOne({ _id: pinKey }, { $set: { articleId } }, { upsert: true });
  } else {
    await collection.deleteOne({ _id: pinKey, articleId });
  }
}
