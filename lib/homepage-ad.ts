import "server-only";
import { z } from "zod";
import { getMongoDb } from "@/lib/mongodb";

const httpsUrl = z.string().trim().max(2048).url().refine((value) => value.startsWith("https://"));
export const homepageAdSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().max(100),
  mediaType: z.enum(["image", "video"]).default("image"),
  imageUrl: z.union([z.literal(""), httpsUrl]),
  videoUrl: z.union([z.literal(""), httpsUrl]).default(""),
  destination: z.union([z.literal(""), httpsUrl]),
}).refine(({ enabled, title, mediaType, imageUrl, videoUrl, destination }) => {
  if (!enabled) return true;
  return Boolean(title && destination && (mediaType === "image" ? imageUrl : videoUrl));
});

export type HomepageAd = z.infer<typeof homepageAdSchema>;

export const homepageAdSlotSchema = z.enum(["hot", "gallery"]);
export type HomepageAdSlot = z.infer<typeof homepageAdSlotSchema>;

const settingIds: Record<HomepageAdSlot, string> = {
  hot: "homepage_hot_articles_ad",
  gallery: "homepage_article_gallery_ad",
};
const emptyAd: HomepageAd = { enabled: false, title: "", mediaType: "image", imageUrl: "", videoUrl: "", destination: "" };

async function adSettings() {
  const db = await getMongoDb();
  if (!db) throw new Error("Database belum tersambung.");
  return db.collection<{ _id: string; value: HomepageAd }>("site_settings");
}

export async function getHomepageAd(slot: HomepageAdSlot = "hot"): Promise<HomepageAd> {
  const setting = await (await adSettings()).findOne({ _id: settingIds[slot] });
  return homepageAdSchema.safeParse(setting?.value).data ?? emptyAd;
}

export async function saveHomepageAd(value: HomepageAd, slot: HomepageAdSlot = "hot") {
  await (await adSettings()).updateOne({ _id: settingIds[slot] }, { $set: { value } }, { upsert: true });
}
