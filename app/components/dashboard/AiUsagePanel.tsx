"use client";

import { useMemo, useState } from "react";
import type { AiUsageSummary } from "@/lib/ai-usage";

type Provider = "all" | "groq" | "gemini";
type Period = "today" | "yesterday" | "week" | "month" | "all";
type Series = "totalTokens" | "inputTokens" | "outputTokens" | "requests";
type Point = AiUsageSummary["daily"][number];
type HourlyPoint = AiUsageSummary["hourlyToday"][number];
type ChartPoint = Point | HourlyPoint;
const EMPTY = { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
const SERIES: Array<{ key: Series; label: string; color: string }> = [
  { key: "totalTokens", label: "Total token", color: "#1f2937" },
  { key: "inputTokens", label: "Token masuk", color: "#0ea5e9" },
  { key: "outputTokens", label: "Token keluar", color: "#8b5cf6" },
  { key: "requests", label: "Permintaan", color: "#2563eb" },
];

function jakartaDate(offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" })
    .formatToParts(new Date(Date.now() + offset * 86_400_000));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function moveDate(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function selectPeriod(source: Point[], period: Period) {
  if (period === "all" && !source.length) return [];
  const config = { today: [1, 0], yesterday: [1, -1], week: [7, 0], month: [30, 0] } as const;
  const rows = new Map(source.map((row) => [row.date, row]));
  const end = period === "all" ? jakartaDate() : jakartaDate(config[period][1]);
  const start = period === "all" ? source[0].date : moveDate(end, -config[period][0] + 1);
  const length = Math.max(1, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1);
  return Array.from({ length }, (_, index) => {
    const date = moveDate(start, index);
    return rows.get(date) || { date, ...EMPTY };
  });
}

function summarize(daily: Point[]) {
  return daily.reduce((sum, row) => ({
    requests: sum.requests + row.requests,
    inputTokens: sum.inputTokens + row.inputTokens,
    outputTokens: sum.outputTokens + row.outputTokens,
    totalTokens: sum.totalTokens + row.totalTokens,
  }), { ...EMPTY });
}

function smoothPath(coordinates: Array<[number, number]>) {
  if (!coordinates.length) return "";
  if (coordinates.length === 1) return `M ${coordinates[0][0]} ${coordinates[0][1]}`;
  return coordinates.reduce((path, point, index) => {
    if (!index) return `M ${point[0]} ${point[1]}`;
    const previous = coordinates[index - 1];
    const next = coordinates[index + 1] || point;
    const previousPrevious = coordinates[index - 2] || previous;
    const control1: [number, number] = [previous[0] + (point[0] - previousPrevious[0]) / 6, previous[1] + (point[1] - previousPrevious[1]) / 6];
    const control2: [number, number] = [point[0] - (next[0] - previous[0]) / 6, point[1] - (next[1] - previous[1]) / 6];
    return `${path} C ${control1[0]} ${control1[1]}, ${control2[0]} ${control2[1]}, ${point[0]} ${point[1]}`;
  }, "");
}

function UsageChart({ daily, focus, setFocus, hourly = false }: { daily: ChartPoint[]; focus: Series | null; setFocus: (value: Series | null) => void; hourly?: boolean }) {
  const width = Math.max(600, hourly ? daily.length * 78 : 600), height = 230;
  const pad = { top: 17, right: 38, bottom: 30, left: 48 };
  const plotWidth = width - pad.left - pad.right, plotHeight = height - pad.top - pad.bottom;
  const maxTokens = Math.max(1, ...daily.flatMap((day) => [day.totalTokens, day.inputTokens, day.outputTokens]));
  const maxRequests = Math.max(1, ...daily.map((day) => day.requests));
  const x = (index: number) => pad.left + (daily.length <= 1 ? plotWidth / 2 : index * plotWidth / (daily.length - 1));
  const tokenY = (value: number) => pad.top + plotHeight - value / maxTokens * plotHeight;
  const requestY = (value: number) => pad.top + plotHeight - value / maxRequests * plotHeight;
  const coordinates = (key: Series): Array<[number, number]> => daily.map((day, index) => [x(index), key === "requests" ? requestY(day.requests) : tokenY(day[key])]);
  const path = (key: Series) => smoothPath(coordinates(key));
  const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
  const shortDate = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  const toggle = (key: Series) => setFocus(focus === key ? null : key);
  const totalCoordinates = coordinates("totalTokens");
  const area = totalCoordinates.length ? `M ${pad.left} ${pad.top + plotHeight} L ${totalCoordinates.map(([pointX, pointY]) => `${pointX} ${pointY}`).join(" L ")} L ${width - pad.right} ${pad.top + plotHeight} Z` : "";
  const label = (point: ChartPoint) => hourly && "hour" in point ? `${String(point.hour).padStart(2, "0")}.00` : shortDate(point.date);

  return <div className="min-w-0 w-full">
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Fokus garis grafik">
      {SERIES.map((series) => <button key={series.key} type="button" aria-pressed={focus === series.key} onClick={() => toggle(series.key)} className={`inline-flex min-h-7 items-center gap-1.5 border px-2 text-[11px] transition-all ${focus === series.key ? "border-gray-800 bg-gray-800 text-white" : "border-rule bg-white text-mute hover:border-gray-400 hover:text-ink"} ${focus && focus !== series.key ? "opacity-40" : "opacity-100"}`}>
        <span className="h-0.5 w-4" style={{ backgroundColor: series.color }} />{series.label}
      </button>)}
      {focus && <button type="button" onClick={() => setFocus(null)} className="min-h-7 px-1 text-[11px] text-mute underline underline-offset-4">Tampilkan semua</button>}
    </div>
    <div className="border border-rule bg-gray-50/50 p-2">
      {!daily.length ? <div className="flex min-h-44 items-center justify-center text-sm text-mute">Belum ada penggunaan pada periode ini.</div> : <div className="overflow-x-auto overscroll-x-contain pb-2"><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-auto max-w-none" role="img" aria-label="Grafik penggunaan AI interaktif">
        <title>Klik garis atau legenda untuk memfokuskan satu metrik</title>
        {[0, .25, .5, .75, 1].map((ratio) => { const y = pad.top + plotHeight * ratio; return <line key={ratio} x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e5e7eb" />; })}
        <text x={pad.left - 7} y={pad.top + 3} textAnchor="end" className="fill-gray-500 text-[10px]">{compact.format(maxTokens)}</text>
        <text x={pad.left - 7} y={pad.top + plotHeight + 3} textAnchor="end" className="fill-gray-500 text-[10px]">0</text>
        <text x={width - pad.right + 7} y={pad.top + 3} className="fill-blue-600 text-[10px]">{maxRequests}</text>
        {area && <path d={area} fill="#1f2937" opacity={focus && focus !== "totalTokens" ? .015 : .055} />}
        {SERIES.map((series) => { const line = path(series.key), selected = focus === series.key, muted = focus !== null && !selected; return <g key={series.key} className="cursor-pointer" onClick={() => toggle(series.key)}>
          <path d={line} fill="none" stroke={series.color} strokeWidth={selected ? 3.5 : series.key === "totalTokens" ? 2.5 : 2.2} opacity={muted ? .13 : 1} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="transition-opacity duration-200" />
          <path d={line} fill="none" stroke="transparent" strokeWidth="14" vectorEffect="non-scaling-stroke" />
        </g>; })}
        {daily.length <= 31 && SERIES.map((series) => daily.map((day, index) => {
          const value = day[series.key];
          if (focus && focus !== series.key) return null;
          return <circle key={`${series.key}-${day.date}-${"hour" in day ? day.hour : ""}`} cx={x(index)} cy={series.key === "requests" ? requestY(value) : tokenY(value)} r={focus === series.key ? 3.2 : 2.2} fill={series.color}><title>{`${label(day)} · ${series.label}: ${compact.format(value)}`}</title></circle>;
        }))}
        {hourly ? daily.map((point, index) => <text key={`label-${index}`} x={x(index)} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">{label(point)}</text>) : <><text x={pad.left} y={height - 6} className="fill-gray-500 text-[10px]">{shortDate(daily[0].date)}</text><text x={width - pad.right} y={height - 6} textAnchor="end" className="fill-gray-500 text-[10px]">{shortDate(daily[daily.length - 1].date)}</text></>}
      </svg></div>}
    </div>
  </div>;
}

export default function AiUsagePanel({ usage }: { usage: AiUsageSummary }) {
  const [provider, setProvider] = useState<Provider>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [focus, setFocus] = useState<Series | null>(null);
  const source = useMemo(() => provider === "all" ? usage.daily : usage.providerSummaries.find((item) => item.provider === provider)?.daily || [], [provider, usage]);
  const daily = useMemo(() => selectPeriod(source, period), [source, period]);
  const hourlyToday = useMemo(() => provider === "all" ? usage.hourlyToday : usage.providerSummaries.find((item) => item.provider === provider)?.hourlyToday || [], [provider, usage]);
  const chartPoints = period === "today" ? hourlyToday : daily;
  const selected = useMemo(() => summarize(daily), [daily]);
  const format = new Intl.NumberFormat("id-ID");
  const periods: Array<[Period, string]> = [["today", "Hari ini"], ["yesterday", "Kemarin"], ["week", "Seminggu"], ["month", "Sebulan"], ["all", "Semuanya"]];

  return <>
    <div className="flex flex-col gap-3 pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Pilih provider AI">
        {(["all", "groq", "gemini"] as const).map((item) => <button key={item} type="button" aria-pressed={provider === item} onClick={() => setProvider(item)} className={`min-h-8 px-3 text-xs font-medium capitalize transition-colors ${provider === item ? "bg-gray-800 text-white" : "bg-gray-100 text-mute hover:bg-gray-200 hover:text-ink"}`}>{item === "all" ? "Semua provider" : item}</button>)}
      </div>
      <div className="flex max-w-full gap-1 overflow-x-auto pb-1" role="group" aria-label="Pilih periode penggunaan">
        {periods.map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`shrink-0 min-h-8 border px-2.5 text-xs transition-colors ${period === value ? "border-gray-800 bg-gray-800 text-white" : "border-rule bg-white text-mute hover:border-gray-400 hover:text-ink"}`}>{label}</button>)}
      </div>
    </div>
    <div className="grid items-start gap-6 py-5 xl:grid-cols-[minmax(230px,0.72fr)_minmax(420px,1.28fr)]">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
        {([["Total token", selected.totalTokens], ["Token masuk", selected.inputTokens], ["Token keluar", selected.outputTokens], ["Permintaan", selected.requests]] as const).map(([label, value]) => <div key={label}><dt className="text-xs text-mute">{label}</dt><dd className="mt-1 font-display text-2xl tabular-nums">{format.format(value)}</dd></div>)}
      </dl>
      <UsageChart daily={chartPoints} focus={focus} setFocus={setFocus} hourly={period === "today"} />
    </div>
  </>;
}
