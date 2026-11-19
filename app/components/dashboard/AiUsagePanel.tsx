"use client";

import { useMemo, useState } from "react";
import type { AiUsageSummary } from "@/lib/ai-usage";

type ProviderFilter = "all" | "groq" | "gemini";
type UsageSeries = Pick<AiUsageSummary, "requests" | "inputTokens" | "outputTokens" | "totalTokens" | "daily">;

function UsageChart({ daily }: { daily: UsageSeries["daily"] }) {
  const width = 480;
  const height = 165;
  const padding = { top: 12, right: 28, bottom: 25, left: 38 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxTokens = Math.max(1, ...daily.map((day) => day.totalTokens));
  const maxRequests = Math.max(1, ...daily.map((day) => day.requests));
  const x = (index: number) => padding.left + (daily.length <= 1 ? 0 : index * plotWidth / (daily.length - 1));
  const tokenY = (value: number) => padding.top + plotHeight - value / maxTokens * plotHeight;
  const requestY = (value: number) => padding.top + plotHeight - value / maxRequests * plotHeight;
  const points = (key: "totalTokens" | "inputTokens" | "outputTokens") => daily.map((day, index) => `${x(index)},${tokenY(day[key])}`).join(" ");
  const requestPoints = daily.map((day, index) => `${x(index)},${requestY(day.requests)}`).join(" ");
  const shortDate = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

  return (
    <div className="w-full max-w-[440px] justify-self-end">
      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-mute">
        {[["Total", "bg-gray-800"], ["Masuk", "bg-sky-500"], ["Keluar", "bg-gray-400"], ["Request", "bg-blue-500"]].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1"><span className={`size-1.5 ${color}`} />{label}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Grafik penggunaan AI harian selama 30 hari">
        <title>Penggunaan token dan permintaan AI per hari</title>
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + plotHeight * ratio;
          return <line key={ratio} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        <text x={padding.left - 6} y={padding.top + 3} textAnchor="end" className="fill-gray-500 text-[9px]">{compact.format(maxTokens)}</text>
        <text x={padding.left - 6} y={padding.top + plotHeight + 3} textAnchor="end" className="fill-gray-500 text-[9px]">0</text>
        <text x={width - padding.right + 6} y={padding.top + 3} className="fill-blue-500 text-[9px]">{maxRequests}</text>
        <polyline points={points("totalTokens")} fill="none" stroke="#1f2937" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={points("inputTokens")} fill="none" stroke="#0ea5e9" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
        <polyline points={points("outputTokens")} fill="none" stroke="#9ca3af" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
        <polyline points={requestPoints} fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        {daily.length > 0 && <>
          <text x={padding.left} y={height - 5} className="fill-gray-500 text-[9px]">{shortDate(daily[0].date)}</text>
          <text x={width - padding.right} y={height - 5} textAnchor="end" className="fill-gray-500 text-[9px]">{shortDate(daily[daily.length - 1].date)}</text>
        </>}
      </svg>
    </div>
  );
}

export default function AiUsagePanel({ usage }: { usage: AiUsageSummary }) {
  const [provider, setProvider] = useState<ProviderFilter>("all");
  const selected = useMemo<UsageSeries>(() => {
    if (provider === "all") return usage;
    return usage.providerSummaries.find((item) => item.provider === provider) || {
      requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, daily: usage.daily.map((day) => ({ ...day, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 })),
    };
  }, [provider, usage]);
  const format = new Intl.NumberFormat("id-ID");

  return (
    <>
      <div className="flex flex-wrap gap-1.5 pt-4" role="group" aria-label="Pilih provider AI">
        {(["all", "groq", "gemini"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={provider === item}
            onClick={() => setProvider(item)}
            className={`min-h-8 px-3 text-xs font-medium capitalize transition-colors ${provider === item ? "bg-gray-800 text-white" : "bg-gray-100 text-mute hover:bg-gray-200 hover:text-ink"}`}
          >
            {item === "all" ? "Semua" : item}
          </button>
        ))}
      </div>
      <div className="grid items-center gap-5 py-4 lg:grid-cols-[minmax(240px,1fr)_minmax(280px,440px)]">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
          {([[
            "Total token", selected.totalTokens,
          ], ["Token masuk", selected.inputTokens], ["Token keluar", selected.outputTokens], ["Permintaan", selected.requests]] as const).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-mute">{label}</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums">{format.format(value)}</dd>
            </div>
          ))}
        </dl>
        <UsageChart daily={selected.daily} />
      </div>
    </>
  );
}
