import "server-only";
import { getMongoDb } from "@/lib/mongodb";

export type AiUsageInput = {
  provider: "groq" | "gemini";
  model: string;
  feature: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

function token(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

export async function recordAiUsage(input: AiUsageInput) {
  try {
    const db = await getMongoDb();
    if (!db) return;
    const inputTokens = token(input.inputTokens);
    const outputTokens = token(input.outputTokens);
    const totalTokens = token(input.totalTokens) || inputTokens + outputTokens;
    await db.collection("ai_usage").insertOne({
      provider: input.provider,
      model: input.model,
      feature: input.feature,
      inputTokens,
      outputTokens,
      totalTokens,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn("Statistik token AI gagal disimpan.", error instanceof Error ? error.message : error);
  }
}

export type AiUsageSummary = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  providers: Array<{ provider: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
  daily: Array<{ date: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
  hourlyToday: Array<{ date: string; hour: number; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
  providerSummaries: Array<{
    provider: "groq" | "gemini";
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    daily: Array<{ date: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    hourlyToday: Array<{ date: string; hour: number; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
  }>;
};

export async function getAiUsageSummary(days: number | null = 30): Promise<AiUsageSummary | null> {
  const db = await getMongoDb();
  if (!db) return null;
  const today = new Date();
  const jakartaParts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" })
    .formatToParts(today);
  const jakartaDate = Object.fromEntries(jakartaParts.map((part) => [part.type, part.value]));
  const todayKey = `${jakartaDate.year}-${jakartaDate.month}-${jakartaDate.day}`;
  const todayStart = new Date(`${todayKey}T00:00:00+07:00`);
  const since = days === null ? null : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - days + 1));
  const result = await db.collection("ai_usage").aggregate<{
    totals: Array<{ requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    providers: Array<{ provider: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    daily: Array<{ date: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    providerDaily: Array<{ provider: string; date: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    hourlyToday: Array<{ date: string; hour: number; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
    providerHourlyToday: Array<{ provider: string; date: string; hour: number; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
  }>([
    ...(since ? [{ $match: { createdAt: { $gte: since } } }] : []),
    { $facet: {
      totals: [{ $group: {
        _id: null,
        requests: { $sum: 1 },
        inputTokens: { $sum: "$inputTokens" },
        outputTokens: { $sum: "$outputTokens" },
        totalTokens: { $sum: "$totalTokens" },
      } }],
      providers: [
        { $group: { _id: "$provider", requests: { $sum: 1 }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, totalTokens: { $sum: "$totalTokens" } } },
        { $sort: { totalTokens: -1 } },
        { $project: { _id: 0, provider: "$_id", requests: 1, inputTokens: 1, outputTokens: 1, totalTokens: 1 } },
      ],
      daily: [
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Jakarta" } },
          requests: { $sum: 1 },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          totalTokens: { $sum: "$totalTokens" },
        } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", requests: 1, inputTokens: 1, outputTokens: 1, totalTokens: 1 } },
      ],
      providerDaily: [
        { $group: {
          _id: { provider: "$provider", date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Jakarta" } } },
          requests: { $sum: 1 },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          totalTokens: { $sum: "$totalTokens" },
        } },
        { $sort: { "_id.date": 1 } },
        { $project: { _id: 0, provider: "$_id.provider", date: "$_id.date", requests: 1, inputTokens: 1, outputTokens: 1, totalTokens: 1 } },
      ],
      hourlyToday: [
        { $match: { createdAt: { $gte: todayStart } } },
        { $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Jakarta" } },
            hour: {
              $multiply: [
                { $floor: { $divide: [{ $toInt: { $dateToString: { format: "%H", date: "$createdAt", timezone: "Asia/Jakarta" } } }, 2] } },
                2,
              ],
            },
          },
          requests: { $sum: 1 }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, totalTokens: { $sum: "$totalTokens" },
        } },
        { $sort: { "_id.hour": 1 } },
        { $project: { _id: 0, date: "$_id.date", hour: "$_id.hour", requests: 1, inputTokens: 1, outputTokens: 1, totalTokens: 1 } },
      ],
      providerHourlyToday: [
        { $match: { createdAt: { $gte: todayStart } } },
        { $group: {
          _id: {
            provider: "$provider",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Jakarta" } },
            hour: {
              $multiply: [
                { $floor: { $divide: [{ $toInt: { $dateToString: { format: "%H", date: "$createdAt", timezone: "Asia/Jakarta" } } }, 2] } },
                2,
              ],
            },
          },
          requests: { $sum: 1 }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, totalTokens: { $sum: "$totalTokens" },
        } },
        { $sort: { "_id.hour": 1 } },
        { $project: { _id: 0, provider: "$_id.provider", date: "$_id.date", hour: "$_id.hour", requests: 1, inputTokens: 1, outputTokens: 1, totalTokens: 1 } },
      ],
    } },
  ]).next().catch(() => null);
  if (!result) return null;
  const totals = result.totals[0] || { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const fillDaily = (source: typeof result.daily) => {
    if (days === null) return source;
    const rows = new Map(source.map((row) => [row.date, row]));
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(since!);
      date.setUTCDate(since!.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return rows.get(key) || { date: key, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    });
  };
  const daily = fillDaily(result.daily);
  const fillHourlyToday = (source: typeof result.hourlyToday) => {
    const rows = new Map(source.map((row) => [row.hour, row]));
    return Array.from({ length: 12 }, (_, index) => {
      const hour = index * 2;
      return rows.get(hour) || { date: todayKey, hour, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    });
  };
  const hourlyToday = fillHourlyToday(result.hourlyToday);
  const providerSummaries = (["groq", "gemini"] as const).map((provider) => {
    const providerTotal = result.providers.find((row) => row.provider === provider);
    return {
      provider,
      requests: providerTotal?.requests || 0,
      inputTokens: providerTotal?.inputTokens || 0,
      outputTokens: providerTotal?.outputTokens || 0,
      totalTokens: providerTotal?.totalTokens || 0,
      daily: fillDaily(result.providerDaily.filter((row) => row.provider === provider)),
      hourlyToday: fillHourlyToday(result.providerHourlyToday.filter((row) => row.provider === provider)),
    };
  });
  return { ...totals, providers: result.providers, daily, hourlyToday, providerSummaries };
}
