"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiUsageSummary } from "@/lib/ai-usage";

/**
 * Data per pengguna bersifat opsional. Jika `lib/ai-usage.ts` mengisi `users`
 * pada tiap titik harian/per jam, panel menampilkannya di puncak garis,
 * tooltip, dan daftar "Pengguna teratas". Tanpa itu, panel tetap jalan.
 */
type UserUsage = { name: string; totalTokens: number; requests?: number };
type Provider = "all" | "groq" | "gemini";
type Period = "today" | "yesterday" | "week" | "month" | "all";
type Series = "totalTokens" | "inputTokens" | "outputTokens" | "requests";
type Point = AiUsageSummary["daily"][number] & { users?: UserUsage[] };
type HourlyPoint = AiUsageSummary["hourlyToday"][number] & { users?: UserUsage[] };
type ChartPoint = Point | HourlyPoint;
type Row = Record<Series, number>;
type Curves = Record<Series, number[]>;

const EMPTY: Row = { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
const KEYS: Series[] = ["totalTokens", "inputTokens", "outputTokens", "requests"];
const SERIES: Array<{ key: Series; label: string; color: string }> = [
  { key: "totalTokens", label: "Total token", color: "#1f2937" },
  { key: "inputTokens", label: "Token masuk", color: "#0ea5e9" },
  { key: "outputTokens", label: "Token keluar", color: "#8b5cf6" },
  { key: "requests", label: "Permintaan", color: "#f59e0b" },
];

const W = 720;
const H = 270;
const PAD = { top: 44, right: 46, bottom: 30, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const BASE_Y = PAD.top + PLOT_H;
const SAMPLES = 160; // kerapatan titik agar kurva terlihat benar-benar halus

const NUMBER = new Intl.NumberFormat("id-ID");
const COMPACT = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

/* ---------- Waktu (Asia/Jakarta) ---------- */

function jakartaParts(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23", timeZone: "Asia/Jakarta",
  }).formatToParts(new Date(timestamp));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, hour: Number(value.hour), minute: value.minute };
}

function moveDate(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function selectPeriod(source: Point[], period: Period, today: string): Point[] {
  if (period === "all" && !source.length) return [];
  const sorted = [...source].sort((a, b) => a.date.localeCompare(b.date));
  const config = { today: [1, 0], yesterday: [1, -1], week: [7, 0], month: [30, 0] } as const;
  const rows = new Map(sorted.map((row) => [row.date, row]));
  const end = period === "all" ? today : moveDate(today, config[period][1]);
  const start = period === "all" ? sorted[0].date : moveDate(end, -config[period][0] + 1);
  const length = Math.max(1, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1);
  return Array.from({ length }, (_, index) => {
    const date = moveDate(start, index);
    return rows.get(date) || ({ date, ...EMPTY } as Point);
  });
}

/** Jam diisi apa adanya sesuai kapan dipakai: 00.00 sampai jam sekarang, jam tanpa pemakaian bernilai 0. */
function fillHours(source: HourlyPoint[], today: string, currentHour: number): HourlyPoint[] {
  const byHour = new Map(source.map((point) => [point.hour, point]));
  return Array.from({ length: Math.max(1, currentHour + 1) }, (_, hour) =>
    byHour.get(hour) || ({ date: today, hour, ...EMPTY } as HourlyPoint));
}

function summarize(points: Point[]): Row {
  return points.reduce((sum, row) => ({
    requests: sum.requests + row.requests,
    inputTokens: sum.inputTokens + row.inputTokens,
    outputTokens: sum.outputTokens + row.outputTokens,
    totalTokens: sum.totalTokens + row.totalTokens,
  }), { ...EMPTY });
}

/* ---------- Kurva halus ---------- */

/**
 * Interpolasi kubik monoton (Fritsch–Carlson): garis melengkung mulus melewati
 * setiap titik data, tanpa sudut patah dan tanpa melampaui nilai aslinya.
 */
function monotoneSampler(values: number[]) {
  const n = values.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => values[0];
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) delta.push(values[i + 1] - values[i]);
  const slope: number[] = new Array(n);
  slope[0] = delta[0];
  slope[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i++) slope[i] = delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) { slope[i] = 0; slope[i + 1] = 0; continue; }
    const a = slope[i] / delta[i];
    const b = slope[i + 1] / delta[i];
    const sum = a * a + b * b;
    if (sum > 9) {
      const tau = 3 / Math.sqrt(sum);
      slope[i] = tau * a * delta[i];
      slope[i + 1] = tau * b * delta[i];
    }
  }
  return (t: number) => {
    const position = Math.min(n - 1, Math.max(0, t * (n - 1)));
    const i = Math.min(n - 2, Math.floor(position));
    const f = position - i;
    const f2 = f * f;
    const f3 = f2 * f;
    return (2 * f3 - 3 * f2 + 1) * values[i] + (f3 - 2 * f2 + f) * slope[i] + (-2 * f3 + 3 * f2) * values[i + 1] + (f3 - f2) * slope[i + 1];
  };
}

function sampleCurves(rows: Row[]): Curves {
  const curves = {} as Curves;
  for (const key of KEYS) {
    const sampler = monotoneSampler(rows.map((row) => row[key]));
    curves[key] = Array.from({ length: SAMPLES }, (_, index) => rows.length ? Math.max(0, sampler(index / (SAMPLES - 1))) : 0);
  }
  return curves;
}

function scaleOf(rows: Row[]) {
  return {
    tokens: Math.max(1, ...rows.flatMap((row) => [row.totalTokens, row.inputTokens, row.outputTokens])),
    requests: Math.max(1, ...rows.map((row) => row.requests)),
  };
}

/* ---------- Animasi ---------- */

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Saat data berganti, kurva lama bergeser halus ke kurva baru. Karena kurva
 * dibandingkan pada titik yang rapat (bukan per data), perubahan jumlah hari
 * atau jam tetap terlihat mengalir, bukan loncat.
 */
function useTweenedCurves(rows: Row[], duration = 950) {
  const signature = rows.map((row) => KEYS.map((key) => row[key]).join("|")).join(",");
  const targetCurves = useMemo(() => sampleCurves(rows), [rows]);
  const targetScale = useMemo(() => scaleOf(rows), [rows]);
  const [state, setState] = useState({ curves: targetCurves, scale: targetScale });
  const [animating, setAnimating] = useState(false);
  const current = useRef(state);
  const lastSignature = useRef(signature);
  const targetRef = useRef({ curves: targetCurves, scale: targetScale });
  targetRef.current = { curves: targetCurves, scale: targetScale };

  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    const next = targetRef.current;
    const from = current.current;
    if (prefersReducedMotion()) {
      current.current = next;
      setState(next);
      setAnimating(false);
      return;
    }
    const start = performance.now();
    let frameId = 0;
    setAnimating(true);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      if (t >= 1) {
        current.current = next;
        setState(next);
        setAnimating(false);
        return;
      }
      const e = easeInOutCubic(t);
      const curves = {} as Curves;
      for (const key of KEYS) curves[key] = from.curves[key].map((value, index) => value + (next.curves[key][index] - value) * e);
      const frame = {
        curves,
        scale: {
          tokens: from.scale.tokens + (next.scale.tokens - from.scale.tokens) * e,
          requests: from.scale.requests + (next.scale.requests - from.scale.requests) * e,
        },
      };
      current.current = frame;
      setState(frame);
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [signature, duration]);

  return { ...state, animating };
}

function useCountUp(value: number, duration = 650) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    if (current.current === value) return;
    if (prefersReducedMotion()) { current.current = value; setShown(value); return; }
    const begin = current.current;
    const start = performance.now();
    let frameId = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = t >= 1 ? value : begin + (value - begin) * easeOutCubic(t);
      current.current = next;
      setShown(next);
      if (t < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);
  return Math.round(shown);
}

function Stat({ label, value }: { label: string; value: number }) {
  const shown = useCountUp(value);
  return (
    <div>
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums">{NUMBER.format(shown)}</dd>
    </div>
  );
}

/* ---------- Grafik ---------- */

const shortDate = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const longDate = (value: string) => new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}.00`;
const pointLabel = (point: ChartPoint, short: boolean) => "hour" in point ? hourLabel(point.hour) : short ? shortDate(point.date) : longDate(point.date);
const topUsers = (point: ChartPoint | undefined, limit = 3) => [...(point?.users || [])].sort((a, b) => b.totalTokens - a.totalTokens).slice(0, limit);

function labelIndexes(count: number) {
  if (count <= 1) return [0];
  const step = Math.max(1, Math.ceil(count / 7));
  const indexes: number[] = [];
  for (let index = 0; index < count; index += step) indexes.push(index);
  const last = count - 1;
  if (indexes[indexes.length - 1] !== last && last - indexes[indexes.length - 1] >= Math.ceil(step / 2)) indexes.push(last);
  return indexes;
}

function UsageChart({ points, focus, setFocus }: { points: ChartPoint[]; focus: Series | null; setFocus: (value: Series | null) => void }) {
  const targetRows = useMemo<Row[]>(() => points.map((point) => ({
    totalTokens: point.totalTokens, inputTokens: point.inputTokens, outputTokens: point.outputTokens, requests: point.requests,
  })), [points]);
  const { curves, scale, animating } = useTweenedCurves(targetRows);
  const [hover, setHover] = useState<number | null>(null);
  const ready = !animating;

  const yFor = (key: Series, value: number) => BASE_Y - (value / (key === "requests" ? scale.requests : scale.tokens)) * PLOT_H;
  const pointX = (index: number, total = points.length) => PAD.left + (total <= 1 ? PLOT_W / 2 : (index * PLOT_W) / (total - 1));
  const pathFor = (key: Series) => curves[key]
    .map((value, index) => `${index ? "L" : "M"}${(PAD.left + (index * PLOT_W) / (SAMPLES - 1)).toFixed(1)} ${yFor(key, value).toFixed(1)}`)
    .join(" ");

  const peakIndex = useMemo(() => {
    let best = -1;
    let bestValue = 0;
    points.forEach((point, index) => { if (point.totalTokens > bestValue) { bestValue = point.totalTokens; best = index; } });
    return best;
  }, [points]);
  const peakPoint = peakIndex >= 0 ? points[peakIndex] : undefined;
  const peakUser = topUsers(peakPoint, 1)[0];
  const peakX = peakIndex >= 0 ? pointX(peakIndex) : 0;
  const peakY = peakPoint ? yFor("totalTokens", peakPoint.totalTokens) : 0;

  const toggle = (key: Series) => setFocus(focus === key ? null : key);
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ready || !points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * W;
    const fraction = Math.min(1, Math.max(0, (viewX - PAD.left) / PLOT_W));
    setHover(points.length <= 1 ? 0 : Math.round(fraction * (points.length - 1)));
  };

  const hoverPoint = hover !== null && ready ? points[hover] : undefined;
  const hoverX = hoverPoint ? pointX(hover as number) : 0;
  const labels = labelIndexes(points.length);
  const peakChipTransform = peakX < W * 0.3 ? "translateX(-6px)" : peakX > W * 0.7 ? "translateX(calc(-100% + 6px))" : "translateX(-50%)";

  return (
    <div className="min-w-0 w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Fokus garis grafik">
        {SERIES.map((series) => (
          <button
            key={series.key}
            type="button"
            aria-pressed={focus === series.key}
            onClick={() => toggle(series.key)}
            className={`inline-flex min-h-8 items-center gap-1.5 border px-2.5 text-[11px] transition-all ${focus === series.key ? "border-gray-800 bg-gray-800 text-white" : "border-rule bg-white text-mute hover:border-gray-400 hover:text-ink"} ${focus && focus !== series.key ? "opacity-40" : "opacity-100"}`}
          >
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: series.color }} />{series.label}
          </button>
        ))}
        {focus && <button type="button" onClick={() => setFocus(null)} className="min-h-8 px-1 text-[11px] text-mute underline underline-offset-4">Tampilkan semua</button>}
      </div>
      <p className="mb-2 text-[11px] text-mute">Sumbu kiri untuk token, sumbu kanan (kuning) untuk jumlah permintaan.</p>

      <div className="border border-rule bg-white p-2">
        {!points.length ? (
          <div className="flex min-h-44 items-center justify-center text-sm text-mute">Belum ada penggunaan pada periode ini.</div>
        ) : (
          <div className="relative touch-pan-y select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Grafik penggunaan AI interaktif">
              <title>Arahkan kursor ke grafik untuk melihat rincian, klik legenda untuk memfokuskan satu metrik</title>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = PAD.top + PLOT_H * ratio;
                return <line key={ratio} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#eef0f3" />;
              })}
              <text x={PAD.left - 8} y={PAD.top + 3} textAnchor="end" className="fill-gray-500 text-[10px]">{COMPACT.format(scale.tokens)}</text>
              <text x={PAD.left - 8} y={PAD.top + PLOT_H / 2 + 3} textAnchor="end" className="fill-gray-500 text-[10px]">{COMPACT.format(scale.tokens / 2)}</text>
              <text x={PAD.left - 8} y={BASE_Y + 3} textAnchor="end" className="fill-gray-500 text-[10px]">0</text>
              <text x={W - PAD.right + 8} y={PAD.top + 3} className="text-[10px]" fill="#d97706">{Math.round(scale.requests)}</text>
              <text x={W - PAD.right + 8} y={BASE_Y + 3} className="text-[10px]" fill="#d97706">0</text>

              {/* Hanya garis berwarna, mulus dan solid. Total token digambar paling atas. */}
              {[...SERIES].reverse().map((series) => {
                const selected = focus === series.key;
                const muted = focus !== null && !selected;
                const d = pathFor(series.key);
                return (
                  <g key={series.key} className="cursor-pointer" onClick={() => toggle(series.key)}>
                    <path
                      d={d}
                      fill="none"
                      stroke={series.color}
                      strokeWidth={selected ? 3.5 : series.key === "totalTokens" ? 3 : 2.5}
                      opacity={muted ? 0.12 : 1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="geometricPrecision"
                      style={{ transition: "opacity .25s ease, stroke-width .2s ease" }}
                    />
                    <path d={d} fill="none" stroke="transparent" strokeWidth="14" vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}

              {/* Garis bantu dan titik hanya muncul saat hover */}
              {hoverPoint && (
                <g pointerEvents="none">
                  <line x1={hoverX} x2={hoverX} y1={PAD.top} y2={BASE_Y} stroke="#cbd5e1" />
                  {SERIES.map((series) => (focus && focus !== series.key) ? null : (
                    <circle key={series.key} cx={hoverX} cy={yFor(series.key, hoverPoint[series.key])} r="4.5" fill="#fff" stroke={series.color} strokeWidth="2.5" />
                  ))}
                </g>
              )}

              {/* Penanda puncak */}
              {ready && peakPoint && hover === null && (
                <circle cx={peakX} cy={peakY} r="5" fill="#fff" stroke="#1f2937" strokeWidth="2.5" pointerEvents="none" />
              )}

              {labels.map((index) => (
                <text
                  key={index}
                  x={pointX(index)}
                  y={H - 8}
                  textAnchor={points.length > 1 && index === 0 ? "start" : points.length > 1 && index === points.length - 1 ? "end" : "middle"}
                  className="fill-gray-500 text-[10px]"
                  style={{ opacity: animating ? 0.25 : 1, transition: "opacity .35s ease" }}
                >
                  {pointLabel(points[index], true)}
                </text>
              ))}
            </svg>

            {/* Kartu tepat di atas puncak garis */}
            {ready && peakPoint && hover === null && (
              <div
                className="pointer-events-none absolute top-0 z-10 hidden w-max max-w-[13rem] border border-rule bg-white px-2.5 py-1.5 text-[11px] shadow-sm sm:block"
                style={{ left: `${(peakX / W) * 100}%`, transform: peakChipTransform }}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest2 text-mute">Puncak · {pointLabel(peakPoint, true)}</p>
                <p className="mt-0.5 truncate font-semibold tabular-nums text-ink">
                  {NUMBER.format(peakPoint.totalTokens)} token{peakUser && <span className="font-normal text-mute"> · {peakUser.name}</span>}
                </p>
              </div>
            )}

            {/* Tooltip hover */}
            {hoverPoint && (
              <div
                className="pointer-events-none absolute top-6 z-20 w-max min-w-[11rem] border border-rule bg-white px-3 py-2 text-xs shadow-sm"
                style={{
                  left: `${(hoverX / W) * 100}%`,
                  transform: hoverX > W * 0.6 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                }}
              >
                <p className="font-semibold text-ink">{pointLabel(hoverPoint, false)}</p>
                <ul className="mt-1.5 grid gap-1">
                  {SERIES.map((series) => (
                    <li key={series.key} className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 text-mute"><span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: series.color }} />{series.label}</span>
                      <span className="tabular-nums text-ink">{NUMBER.format(hoverPoint[series.key])}</span>
                    </li>
                  ))}
                </ul>
                {topUsers(hoverPoint).length > 0 && (
                  <div className="mt-2 border-t border-rule pt-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest2 text-mute">Pengguna teratas</p>
                    <ul className="mt-1 grid gap-0.5">
                      {topUsers(hoverPoint).map((user) => (
                        <li key={user.name} className="flex items-center justify-between gap-4">
                          <span className="max-w-[8rem] truncate text-mute">{user.name}</span>
                          <span className="tabular-nums text-ink">{NUMBER.format(user.totalTokens)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Panel ---------- */

export default function AiUsagePanel({ usage, live = true, refreshMs = 15_000 }: { usage: AiUsageSummary; live?: boolean; refreshMs?: number }) {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [focus, setFocus] = useState<Series | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  /* Realtime: segarkan data server secara berkala dan saat tab kembali aktif */
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      setClock(Date.now());
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(tick, refreshMs);
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [live, refreshMs, router]);
  useEffect(() => { setUpdatedAt(Date.now()); }, [usage]);

  const now = jakartaParts(clock);
  const source = useMemo(() => provider === "all" ? usage.daily : usage.providerSummaries.find((item) => item.provider === provider)?.daily || [], [provider, usage]);
  const daily = useMemo(() => selectPeriod(source as Point[], period, now.date), [source, period, now.date]);
  const hourlySource = useMemo(() => (provider === "all" ? usage.hourlyToday : usage.providerSummaries.find((item) => item.provider === provider)?.hourlyToday || []) as HourlyPoint[], [provider, usage]);
  const hourly = useMemo(() => fillHours(hourlySource, now.date, now.hour), [hourlySource, now.date, now.hour]);
  const chartPoints: ChartPoint[] = period === "today" ? hourly : daily;
  const selected = useMemo(() => summarize(daily), [daily]);

  const userTotals = useMemo(() => {
    const totals = new Map<string, number>();
    chartPoints.forEach((point) => point.users?.forEach((user) => totals.set(user.name, (totals.get(user.name) || 0) + user.totalTokens)));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [chartPoints]);
  const topUserTokens = userTotals[0]?.[1] || 1;

  const periods: Array<[Period, string]> = [["today", "Hari ini"], ["yesterday", "Kemarin"], ["week", "Seminggu"], ["month", "Sebulan"], ["all", "Semuanya"]];
  const updated = updatedAt ? jakartaParts(updatedAt) : null;
  const updatedLabel = updated ? `${String(updated.hour).padStart(2, "0")}.${updated.minute}` : "";

  return <>
    <div className="flex flex-col gap-3 pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Pilih provider AI">
        {(["all", "groq", "gemini"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={provider === item} onClick={() => setProvider(item)} className={`min-h-9 px-3 text-xs font-medium capitalize transition-colors ${provider === item ? "bg-gray-800 text-white" : "bg-gray-100 text-mute hover:bg-gray-200 hover:text-ink"}`}>
            {item === "all" ? "Semua provider" : item}
          </button>
        ))}
        {live && (
          <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-mute" role="status">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-green-500 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            Live{updatedLabel && <span suppressHydrationWarning> · diperbarui {updatedLabel} WIB</span>}
          </span>
        )}
      </div>
      <div className="flex max-w-full gap-1 overflow-x-auto pb-1" role="group" aria-label="Pilih periode penggunaan">
        {periods.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`min-h-9 shrink-0 border px-3 text-xs transition-colors ${period === value ? "border-gray-800 bg-gray-800 text-white" : "border-rule bg-white text-mute hover:border-gray-400 hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
    </div>

    <div className="grid items-start gap-6 py-5 xl:grid-cols-[minmax(230px,0.72fr)_minmax(420px,1.28fr)]">
      <div className="grid gap-6">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
          <Stat label="Total token" value={selected.totalTokens} />
          <Stat label="Token masuk" value={selected.inputTokens} />
          <Stat label="Token keluar" value={selected.outputTokens} />
          <Stat label="Permintaan" value={selected.requests} />
        </dl>

        {userTotals.length > 0 && (
          <section aria-labelledby="top-users-title" className="border-t border-rule pt-4">
            <h3 id="top-users-title" className="font-mono text-[11px] uppercase tracking-widest2 text-mute">Pengguna teratas</h3>
            <ol className="mt-3 grid gap-3">
              {userTotals.map(([name, tokens], index) => (
                <li key={name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, "0")}</span>
                      <span className="truncate font-medium text-ink">{name}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-mute">{NUMBER.format(tokens)}</span>
                  </div>
                  <div className="mt-1.5 h-1 bg-gray-100" aria-hidden="true">
                    <div className="h-full bg-gray-800 transition-[width] duration-700 ease-out" style={{ width: `${Math.max(3, (tokens / topUserTokens) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <UsageChart points={chartPoints} focus={focus} setFocus={setFocus} />
    </div>
  </>;
}