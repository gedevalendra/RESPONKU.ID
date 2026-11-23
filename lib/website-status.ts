import "server-only";
import { communityDb } from "@/lib/community";
import { z } from "zod";

export const websiteStatusSchema = z.object({
  status: z.enum(["online", "takedown", "maintenance", "busy"]),
  message: z.string().max(500).optional(),
});

export type WebsiteStatus = z.infer<typeof websiteStatusSchema>;

const SETTINGS_KEY = "website_status";

export async function getWebsiteStatus(): Promise<WebsiteStatus> {
  try {
    const db = await communityDb();
    const setting = await db.collection("site_settings").findOne({ key: SETTINGS_KEY });
    return websiteStatusSchema.parse(setting?.value ?? { status: "online", message: "" });
  } catch (error) {
    return { status: "online", message: "" };
  }
}

export async function setWebsiteStatus(status: WebsiteStatus) {
  const db = await communityDb();
  await db.collection("site_settings").updateOne(
    { key: SETTINGS_KEY },
    { $set: { value: status, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}
