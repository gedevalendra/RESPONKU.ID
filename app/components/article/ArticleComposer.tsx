"use client";

import BrandLogo from "@/app/components/layout/BrandLogo";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Article, ArticleBlock, Category } from "@/lib/types";
import ArticleBody from "./ArticleBody";
import RichTextEditor from "./RichTextEditor";

type ArticleDraft = {
  title: string;
  dek: string;
  location: string;
  thumbnailUrl: string;
  category: Category;
  author: string;
  readTime: number;
  blocks: ArticleBlock[];
};
type Props = {
  article?: Article | null;
  authorName: string;
  onSaved: (message: string) => void;
  onCancel?: () => void;
};
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const BLOCK_META: Record<ArticleBlock["type"], { icon: string; label: string }> = {
  text: { icon: "bx-text", label: "Teks" },
  heading: { icon: "bx-heading", label: "Judul bagian" },
  image: { icon: "bx-image", label: "Foto" },
  quote: { icon: "bx-quote-alt-left", label: "Kutipan" },
  link: { icon: "bx-link", label: "Tautan" },
  button: { icon: "bx-pointer", label: "Tombol" },
  callout: { icon: "bx-info-circle", label: "Sorotan" },
  divider: { icon: "bx-minus", label: "Pemisah" },
};
const ADDABLE: ArticleBlock["type"][] = ["text", "heading", "image", "quote", "link", "button", "callout", "divider"];

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function legacyBlocks(article?: Article | null): ArticleBlock[] {
  if (article?.contentBlocks?.length) return article.contentBlocks;
  if (article?.content?.length)
    return article.content.map((text, index) => ({
      id: `legacy-${index}`,
      type: "text",
      text,
    }));
  return [{ id: id(), type: "text", text: "" }];
}
function separateLocation(blocks: ArticleBlock[]) {
  const first = blocks[0];
  if (!first || first.type !== "text") return { location: "", blocks };
  const match = first.text.match(/^([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ\s.'’()/-]{1,40})\s-\s+([\s\S]*)$/);
  if (!match) return { location: "", blocks };
  return {
    location: match[1].trim(),
    blocks: blocks.map((block, index) => index === 0 ? { ...block, text: match[2] } : block),
  };
}
function initial(article: Article | null | undefined, authorName: string): ArticleDraft {
  const separated = separateLocation(legacyBlocks(article));
  return {
    title: article?.title || "",
    dek: article?.dek || "",
    location: separated.location,
    thumbnailUrl: article?.thumbnailUrl || "",
    category: article?.category || "Ekonomi",
    author: authorName,
    readTime: article?.readTime || 5,
    blocks: separated.blocks,
  };
}

function applyLocation(blocks: ArticleBlock[], location: string) {
  const label = location.trim().toLocaleUpperCase("id-ID");
  if (!label) return blocks;
  const escapedLabel = label.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
  return blocks.map((block, index) => index === 0 && block.type === "text"
    ? { ...block, text: `${label} - ${block.text.replace(/^\s+/, "")}`, html: block.html ? `${escapedLabel} - ${block.html}` : undefined }
    : block);
}

/* ---------- Hasil format AI -> blok editor ---------- */

type RawBlock = Record<string, unknown>;
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi;
const BLOCK_LABELS: Partial<Record<ArticleBlock["type"], string>> = {
  link: "tautan", button: "tombol", callout: "sorotan", image: "foto",
  quote: "kutipan", heading: "judul bagian", divider: "pemisah",
};

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);

/** Hanya menerima URL https yang valid (http otomatis dinaikkan ke https, "www.x.com" dilengkapi). */
function toHttpsUrl(value: unknown): string {
  const raw = asString(value);
  if (!raw) return "";
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate.replace(/^http:\/\//i, "https://"));
    return url.protocol === "https:" && url.hostname.includes(".") ? url.toString() : "";
  } catch {
    return "";
  }
}
const hostLabel = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** Ubah URL di dalam paragraf menjadi tautan yang bisa diklik. Mengembalikan undefined jika tidak ada URL. */
function autolink(text: string): string | undefined {
  let html = "";
  let last = 0;
  let found = false;
  for (const match of text.matchAll(URL_PATTERN)) {
    const trailing = match[0].match(/[.,;:!?)\]]+$/)?.[0] || "";
    const raw = trailing ? match[0].slice(0, -trailing.length) : match[0];
    const href = toHttpsUrl(raw);
    if (!href) continue;
    const start = match.index ?? 0;
    html += `${escapeHtml(text.slice(last, start))}<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(raw)}</a>`;
    last = start + raw.length;
    found = true;
  }
  if (!found) return undefined;
  return `${html}${escapeHtml(text.slice(last))}`.replace(/\n/g, "<br>");
}

/**
 * Mengubah keluaran AI menjadi blok editor untuk semua jenis bagian:
 * teks, judul, foto, kutipan, tautan, tombol, sorotan, dan pemisah.
 * Bagian yang tidak valid (mis. tautan tanpa URL https) diturunkan menjadi teks agar tidak menggagalkan pengiriman.
 */
function normalizeBlocks(raw: unknown): ArticleBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: ArticleBlock[] = [];
  const push = (block: Record<string, unknown>) => { blocks.push({ id: id(), ...block } as ArticleBlock); };

  for (const item of raw as RawBlock[]) {
    if (!item || typeof item !== "object") continue;
    const type = asString(item.type).toLowerCase();
    const text = asString(item.text);
    const title = asString(item.title);
    const url = toHttpsUrl(item.url ?? item.href ?? item.link);

    switch (type) {
      case "divider":
        push({ type: "divider" });
        break;
      case "heading":
        if (text) push({ type: "heading", text });
        break;
      case "quote":
        if (text) push({ type: "quote", text, attribution: asString(item.attribution ?? item.source) });
        break;
      case "link":
      case "button":
        if (url) push({ type, text: text || title || hostLabel(url), url });
        else if (text) push({ type: "text", text });
        break;
      case "callout":
        if (text || title) push({ type: "callout", title: text ? title : "", text: text || title });
        break;
      case "image":
        if (url) push({ type: "image", url, alt: asString(item.alt) || asString(item.caption), caption: asString(item.caption) });
        break;
      default: {
        if (!text) break;
        const bareUrl = !/\s/.test(text) ? toHttpsUrl(text) : "";
        if (bareUrl) push({ type: "link", text: hostLabel(bareUrl), url: bareUrl });
        else {
          const html = autolink(text);
          push({ type: "text", text, ...(html ? { html } : {}) });
        }
      }
    }
  }
  return blocks;
}

function describeBlocks(blocks: ArticleBlock[]) {
  const counts = new Map<string, number>();
  blocks.forEach((block) => {
    const label = BLOCK_LABELS[block.type];
    if (label) counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts, ([label, count]) => `${count} ${label}`).join(", ");
}

export async function convertToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung konversi foto");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.86, 0.74, 0.62, 0.5, 0.38]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob && blob.size <= MAX_IMAGE_BYTES) return blob;
  }
  throw new Error("Foto masih lebih besar dari 2 MB setelah dikonversi");
}

/* ---------- Potongan UI kecil ---------- */

function SectionHeader({
  step,
  title,
  hint,
  badge,
}: {
  step: number;
  title: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center bg-gray-800 font-mono text-xs text-white">
        {String(step).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <h3 className="flex flex-wrap items-center gap-2 font-display text-xl leading-8">
          {title}
          {badge && (
            <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-mute">
              {badge}
            </span>
          )}
        </h3>
        {hint && <p className="mt-0.5 text-sm leading-6 text-mute">{hint}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-gray-800">
        {label}
        {hint && <span className="ml-1 font-normal text-mute">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export default function ArticleComposer({
  article,
  authorName,
  onSaved,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState<ArticleDraft>(() =>
    initial(article, authorName),
  );
  const [busy, setBusy] = useState(false);
  const [submission, setSubmission] = useState<Pick<Article, "status" | "slug"> | null>(null);
  const progressPanel = useRef<HTMLElement>(null);
  const showProgress = busy || submission !== null;
  useEffect(() => {
    if (showProgress) progressPanel.current?.scrollIntoView({ block: "start" });
  }, [showProgress]);
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [error, setError] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [freeformSource, setFreeformSource] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [formatBusy, setFormatBusy] = useState(false);
  const [formatProgress, setFormatProgress] = useState(0);
  const [formatMessage, setFormatMessage] = useState("");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const formRef = useRef<HTMLFormElement>(null);
  const [bottomInset, setBottomInset] = useState(0);

  /* Di layar kecil, ukur elemen fixed di dasar layar (navbar mobile) agar bar kirim berada tepat di atasnya. */
  useEffect(() => {
    const measure = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) { setBottomInset(0); return; }
      const stack = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight - 2);
      for (const element of stack) {
        if (formRef.current?.contains(element)) continue;
        let node: Element | null = element;
        while (node && node !== document.body) {
          if (getComputedStyle(node).position === "fixed") {
            const rect = node.getBoundingClientRect();
            if (rect.height > 0 && rect.height < window.innerHeight / 2 && rect.bottom >= window.innerHeight - 4) {
              setBottomInset(Math.round(window.innerHeight - rect.top));
              return;
            }
            break;
          }
          node = node.parentElement;
        }
      }
      setBottomInset(0);
    };
    measure();
    const timer = window.setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);
  const [analysisMessage, setAnalysisMessage] = useState("Kategori dan durasi baca ditentukan otomatis dari isi artikel.");
  const blockElements = useRef(new Map<string, HTMLDivElement>());
  const previousBlockPositions = useRef(new Map<string, DOMRect>());
  const outputBlocks = useMemo(() => applyLocation(draft.blocks, draft.location), [draft.blocks, draft.location]);
  const analysisText = outputBlocks.map((block) => "text" in block ? block.text : block.type === "image" ? block.caption || "" : "").join("\n");
  useEffect(() => {
    if (analysisText.trim().length < 80) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAnalysisMessage("Menganalisis kategori dan durasi baca…");
      try {
        const response = await fetch("/api/ai/article-analysis", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draft.title, dek: draft.dek, content: [analysisText.slice(0, 20000)] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) {
          setDraft((current) => ({ ...current, category: data.category, readTime: data.readTime }));
          setAnalysisMessage("Kategori dan durasi baca diperbarui otomatis.");
        }
      } catch (error) {
        if (!controller.signal.aborted) setAnalysisMessage(error instanceof Error ? error.message : "Analisis belum tersedia.");
      }
    }, 2500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [analysisText, draft.title, draft.dek]);
  useEffect(() => {
    setDraft(initial(article, authorName));
  }, [article, authorName]);
  useEffect(() => {
    if (!formatBusy) return;
    const timer = window.setInterval(() => {
      setFormatProgress((current) => {
        if (current >= 92) return current;
        const increment = current < 35 ? 7 : current < 70 ? 4 : 2;
        return Math.min(92, current + increment);
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [formatBusy]);
  useLayoutEffect(() => {
    if (previousBlockPositions.current.size === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    blockElements.current.forEach((element, blockId) => {
      const previous = previousBlockPositions.current.get(blockId);
      if (!previous) return;
      const current = element.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (reduceMotion || (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1)) return;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 0.88 },
          { transform: "translate(0, 0)", opacity: 1 },
        ],
        { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    });
    previousBlockPositions.current.clear();
  }, [draft.blocks]);
  const textContent = useMemo(
    () =>
      outputBlocks
        .filter(
          (block): block is Extract<ArticleBlock, { type: "text" }> =>
            block.type === "text",
        )
        .map((block) => block.text.trim())
        .filter(Boolean),
    [outputBlocks],
  );

  /* Kelengkapan: hanya tampilan, aturan validasi sebenarnya tetap di submit() */
  const checklist = useMemo(() => {
    const hasContent = draft.blocks.some(
      (block) => !(block.type === "divider" || ("text" in block && !block.text.trim())),
    );
    return [
      { label: "Judul", done: draft.title.trim().length >= 5 },
      { label: "Ringkasan", done: draft.dek.trim().length >= 10 },
      { label: "Thumbnail", done: Boolean(draft.thumbnailUrl) },
      { label: "Isi artikel", done: hasContent },
    ];
  }, [draft.title, draft.dek, draft.thumbnailUrl, draft.blocks]);
  const doneCount = checklist.filter((item) => item.done).length;

  function update<K extends keyof ArticleDraft>(
    key: K,
    value: ArticleDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateBlock(blockId: string, patch: Partial<ArticleBlock>) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? ({ ...block, ...patch } as ArticleBlock) : block,
      ),
    }));
  }
  async function formatFreeformArticle() {
    if ((!sourceFile && freeformSource.trim().length < 20) || formatBusy) {
      setFormatMessage("Tempel naskah minimal 20 karakter atau pilih dokumen terlebih dahulu.");
      return;
    }
    setFormatBusy(true);
    setFormatProgress(8);
    setFormatMessage("");
    try {
      const requestBody = sourceFile ? new FormData() : null;
      if (requestBody && sourceFile) requestBody.append("file", sourceFile);
      const response = await fetch("/api/ai/format-article", sourceFile ? {
        method: "POST",
        body: requestBody,
      } : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: freeformSource }),
      });
      setFormatProgress(94);
      const data = await response.json().catch(() => ({ error: "Server tidak mengirim respons yang dapat dibaca." }));
      if (!response.ok) throw new Error(data.error || "Format artikel gagal.");
      const formattedBlocks = normalizeBlocks(data.blocks);
      setDraft((current) => ({
        ...current,
        ...(data.title ? { title: data.title } : {}),
        ...(data.dek ? { dek: data.dek } : {}),
        ...(data.location ? { location: data.location } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.readTime ? { readTime: data.readTime } : {}),
        ...(formattedBlocks.length ? { blocks: formattedBlocks } : {}),
      }));
      setFormatProgress(100);
      const detected = describeBlocks(formattedBlocks);
      setFormatMessage(`${data.sourceFileName ? `${data.sourceFileName} berhasil dibaca. ` : ""}Struktur artikel sudah diisi AI${detected ? ` (terdeteksi ${detected})` : ""}. Periksa hasilnya sebelum dikirim.`);
    } catch (formatError) {
      setFormatMessage(formatError instanceof Error ? formatError.message : "Format artikel gagal.");
    } finally {
      setFormatBusy(false);
    }
  }
  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini tidak mendukung lokasi.");
      return;
    }
    setLocationBusy(true);
    setLocationMessage("Meminta izin lokasi…");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
        "accept-language": "id",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
      if (!response.ok) throw new Error("Lokasi tidak dapat diterjemahkan.");
      const data = await response.json() as { address?: Record<string, string> };
      const location = data.address?.state || data.address?.province || data.address?.city || data.address?.town;
      if (!location) throw new Error("Provinsi atau kota tidak ditemukan.");
      const label = location.toUpperCase();
      update("location", label);
      setLocationMessage(`Awalan lokasi ditambahkan: ${label}.`);
    } catch (locationError) {
      const code = locationError instanceof GeolocationPositionError ? locationError.code : 0;
      setLocationMessage(code === 1 ? "Izin lokasi ditolak. Izinkan lokasi untuk memakai awalan otomatis." : "Lokasi belum dapat digunakan. Coba lagi.");
    } finally {
      setLocationBusy(false);
    }
  }
  function add(type: ArticleBlock["type"]) {
    const next: ArticleBlock =
      type === "image"
        ? { id: id(), type, url: "", alt: "", caption: "" }
        : type === "divider"
          ? { id: id(), type }
          : type === "link" || type === "button"
            ? { id: id(), type, text: "", url: "" }
          : type === "callout"
            ? { id: id(), type, title: "", text: "" }
          : type === "quote"
            ? { id: id(), type, text: "", attribution: "" }
            : { id: id(), type, text: "" };
    setDraft((current) => ({ ...current, blocks: [...current.blocks, next] }));
  }
  function remove(blockId: string) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  }
  function move(blockId: string, direction: -1 | 1) {
    previousBlockPositions.current = new Map(
      Array.from(blockElements.current, ([id, element]) => [id, element.getBoundingClientRect()]),
    );
    setDraft((current) => {
      const index = current.blocks.findIndex((block) => block.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.blocks.length)
        return current;
      const blocks = [...current.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks };
    });
  }
  async function uploadImage(blockId: string, file?: File) {
    if (!file) return;
    setError("");
    setImageBusy(blockId);
    try {
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append(
        "file",
        new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
          type: "image/webp",
        }),
      );
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Foto gagal diupload");
      updateBlock(blockId, {
        url: data.url,
        alt: file.name.replace(/\.[^.]+$/, ""),
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Foto gagal diupload",
      );
    } finally {
      setImageBusy(null);
    }
  }
  async function uploadThumbnail(file?: File) {
    if (!file) return;
    setError("");
    setThumbnailBusy(true);
    try {
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append(
        "file",
        new File([blob], "thumbnail.webp", { type: "image/webp" }),
      );
      form.append("kind", "thumbnail");
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Thumbnail gagal diupload");
      update("thumbnailUrl", data.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Thumbnail gagal diupload",
      );
    } finally {
      setThumbnailBusy(false);
    }
  }
  async function generateCaption(
    block: Extract<ArticleBlock, { type: "image" }>,
  ) {
    if (!block.url) {
      setError("Upload foto terlebih dahulu untuk membuat caption AI.");
      return;
    }
    setError("");
    setImageBusy(block.id);
    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: block.url }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Caption AI gagal dibuat");
      updateBlock(block.id, { caption: data.caption });
    } catch (captionError) {
      setError(
        captionError instanceof Error
          ? captionError.message
          : "Caption AI gagal dibuat",
      );
    } finally {
      setImageBusy(null);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (
      draft.blocks.length === 0 ||
      draft.blocks.every(
        (block) =>
          block.type === "divider" || ("text" in block && !block.text.trim()),
      )
    ) {
      setError("Tambahkan minimal satu blok isi artikel.");
      return;
    }
    if (!draft.thumbnailUrl) {
      setError("Upload thumbnail utama terlebih dahulu.");
      return;
    }
    if (
      draft.blocks.some((block) => block.type === "image" && !block.url.trim())
    ) {
      setError("Lengkapi URL atau upload foto pada setiap blok foto.");
      return;
    }
    if (draft.blocks.some((block) => (block.type === "link" || block.type === "button") && !/^https:\/\//i.test(block.url))) {
      setError("Setiap tautan dan tombol harus memakai URL lengkap yang diawali https://.");
      return;
    }
    if (!(await confirmAction("Kirim artikel untuk diperiksa?", "Kirim"))) return;
    setBusy(true);
    const payload = {
      title: draft.title,
      dek: draft.dek,
      thumbnailUrl: draft.thumbnailUrl,
      category: draft.category,
      author: draft.author,
      readTime: Number(draft.readTime),
      contentBlocks: outputBlocks,
      content: textContent,
    };
    try {
    const response = await fetch(
      article ? `/api/user/articles/${article.id}` : "/api/user/articles",
      {
        method: article ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Artikel gagal disimpan.");
      return;
    }
    setSubmission({ status: data.article.status, slug: data.article.slug });
    } catch {
      setError("Status kiriman tidak dapat dikonfirmasi. Periksa Kiriman saya sebelum mencoba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (showProgress) {
    const published = submission?.status === "published";
    const rejected = submission?.status === "rejected";
    const headline = busy ? "Artikel sedang dikirim…" : published ? "Artikel diterbitkan" : rejected ? "Artikel tidak disetujui" : "Artikel dikirim untuk ditinjau";
    return (
      <section ref={progressPanel} className="action-popup scroll-mt-40 border border-rule bg-white px-5 py-14 sm:py-20">
        <div role="status" className="mx-auto grid max-w-md justify-items-center gap-4 text-center">
          <div className="grid size-16 place-items-center bg-gray-100 text-3xl text-gray-800" aria-hidden="true">
            <i className={`bx ${busy ? "bx-loader-alt motion-safe:animate-spin" : published ? "bx-check" : rejected ? "bx-info-circle" : "bx-paper-plane"}`} />
          </div>
          <h2 className="font-display text-3xl">{headline}</h2>
          <p className="text-sm leading-6 text-mute">
            {busy ? "Artikel sedang diproses. Hasilnya akan tampil di sini."
              : published ? <>Artikelmu sudah bisa dibaca di <BrandLogo />.</>
              : rejected ? "Lihat riwayat pengajuan untuk memeriksa status artikel."
              : "Pantau hasil review di Kiriman saya."}
          </p>
        </div>
        {!busy && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" className="min-h-11 border border-rule px-4 text-sm font-medium hover:bg-gray-100" onClick={() => {
              setDraft(initial(null, authorName));
              setSubmission(null);
              onSaved(headline);
            }}>Kembali ke kiriman</button>
            {published && submission?.slug && (
              <Link className="inline-flex min-h-11 items-center bg-gray-800 px-4 text-sm font-medium text-white hover:bg-gray-700" href={`/artikel/${encodeURIComponent(submission.slug)}`}>
                Lihat artikel
              </Link>
            )}
          </div>
        )}
      </section>
    );
  }

  const formatLabel = formatProgress < 25 ? "Membaca dan menyiapkan dokumen…"
    : formatProgress < 55 ? "Mengirim naskah ke model AI…"
      : formatProgress < 82 ? "AI sedang menyusun struktur artikel…"
        : "Memeriksa dan menyiapkan hasil…";

  return (
    <div className="grid gap-5">
      {/* Tab editor / preview untuk layar kecil */}
      <div role="tablist" aria-label="Tampilan editor" className="grid grid-cols-2 border border-rule bg-white lg:hidden">
        {(["editor", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className={`flex min-h-8 items-center justify-center gap-2 text-sm font-medium transition-colors ${mobileTab === tab ? "bg-gray-800 text-white" : "hover:bg-gray-100"}`}
          >
            <i className={`bx ${tab === "editor" ? "bx-edit-alt" : "bx-show"} text-lg`} aria-hidden="true" />
            {tab === "editor" ? "Editor" : "Pratinjau"}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] 2xl:gap-6">
        <form
          ref={formRef}
          onSubmit={submit}
          className={`min-w-0 border border-rule bg-white ${mobileTab === "preview" ? "hidden lg:block" : ""}`}
        >
          {/* Kepala + kelengkapan */}
          <div className="border-b border-rule p-5 sm:p-6 xl:p-7">
            <p className="eyebrow">{article ? "Edit kiriman" : "Editor artikel"}</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl">Susun berita kamu</h2>
            <p className="mt-2 max-w-[56ch] text-sm leading-6 text-mute">
              Isi bagian di bawah dari atas ke bawah. Pratinjau artikel diperbarui langsung.
            </p>
            <div className="mt-5" role="status" aria-live="polite">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-800">Kelengkapan</span>
                <span className="font-mono tabular-nums text-mute">{doneCount}/{checklist.length}</span>
              </div>
              <div className="mt-2 h-1 bg-gray-200" aria-hidden="true">
                <div
                  className="h-full bg-blue-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${(doneCount / checklist.length) * 100}%` }}
                />
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {checklist.map((item) => (
                  <li
                    key={item.label}
                    className={`inline-flex items-center gap-1 border px-2 py-1 text-xs ${item.done ? "border-gray-800 bg-gray-800 text-white" : "border-rule text-mute"}`}
                  >
                    <i className={`bx ${item.done ? "bx-check" : "bx-circle"} text-sm`} aria-hidden="true" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-8 p-5 sm:p-6 xl:p-7">
            {/* 1. Bahan dengan AI */}
            <section className="grid gap-4" aria-labelledby="sec-ai">
              <SectionHeader
                step={1}
                title="Format bebas dengan AI"
                badge="Opsional"
                hint="Tempel naskah apa pun. AI memisahkan judul, dek, lokasi, teks, heading, dan kutipan."
              />
              <div className="grid gap-3 border border-rule bg-gray-50 p-4">
                <textarea
                  value={freeformSource}
                  onChange={(event) => { setFreeformSource(event.target.value); setSourceFile(null); }}
                  placeholder="Tempel naskah artikel di sini..."
                  aria-label="Naskah mentah"
                  className="min-h-32 w-full px-3 py-3 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-rule bg-white px-3 text-sm font-medium transition-colors hover:bg-gray-100">
                    <i className="bx bx-upload text-lg" aria-hidden="true" /> Unggah dokumen
                    <input type="file" className="sr-only" onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setSourceFile(file);
                      if (file) {
                        setFreeformSource("");
                        setFormatMessage(`${file.name} siap diproses (${(file.size / 1024 / 1024).toFixed(2)} MB).`);
                      }
                      event.target.value = "";
                    }} />
                  </label>
                  <button
                    type="button"
                    onClick={() => void formatFreeformArticle()}
                    disabled={formatBusy}
                    className="inline-flex h-10 items-center gap-2 bg-gray-800 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                  >
                    <i className={`bx ${formatBusy ? "bx-loader-alt motion-safe:animate-spin" : "bx-sparkles"} text-lg`} aria-hidden="true" />
                    {formatBusy ? "Memformat…" : "Format dengan AI"}
                  </button>
                  {sourceFile && !formatBusy && (
                    <button
                      type="button"
                      onClick={() => { setSourceFile(null); setFormatMessage(""); }}
                      className="inline-flex h-10 max-w-full items-center gap-2 border border-rule bg-white px-3 text-xs text-mute hover:bg-gray-100"
                      title="Hapus dokumen"
                    >
                      <i className="bx bx-file" aria-hidden="true" />
                      <span className="truncate">{sourceFile.name}</span>
                      <i className="bx bx-x text-base" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {formatBusy && (
                  <div role="status" aria-live="polite" className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                      <span>{formatLabel}</span>
                      <span className="font-mono tabular-nums">{formatProgress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden bg-gray-200" aria-hidden="true">
                      <div
                        className="h-full bg-blue-500 transition-[width] duration-500 ease-out"
                        style={{ width: `${formatProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {!formatBusy && formatMessage && (
                  <p role="status" className="flex items-start gap-2 text-xs leading-5 text-mute">
                    <i className="bx bx-info-circle mt-0.5 text-base" aria-hidden="true" /> {formatMessage}
                  </p>
                )}
              </div>
            </section>

            {/* 2. Informasi utama */}
            <section className="grid gap-4 border-t border-rule pt-8" aria-labelledby="sec-info">
              <SectionHeader
                step={2}
                title="Informasi utama"
                hint="Judul, ringkasan, dan foto yang tampil paling awal di artikel."
              />
              <div className="grid gap-4">
                <Field label="Judul artikel" hint="· minimal 5 karakter">
                  <input
                    required
                    minLength={5}
                    value={draft.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="Contoh: Harga cabai turun di pasar tradisional"
                    className="w-full px-3 py-3 text-sm"
                  />
                </Field>
                <Field label="Ringkasan (dek)" hint="· satu atau dua kalimat pembuka">
                  <textarea
                    required
                    minLength={10}
                    value={draft.dek}
                    onChange={(event) => update("dek", event.target.value)}
                    placeholder="Gambaran singkat isi berita"
                    className="min-h-24 w-full px-3 py-3 text-sm"
                  />
                </Field>

                <div className="grid gap-2">
                  <span className="text-xs font-medium text-gray-800">
                    Thumbnail utama
                    <span className="ml-1 font-normal text-mute">· wajib, maksimal 2 MB</span>
                  </span>
                  <label className="flex cursor-pointer items-center gap-4 border border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                    <span className="grid size-11 shrink-0 place-items-center bg-gray-800 text-2xl text-white">
                      <i className={`bx ${thumbnailBusy ? "bx-loader-alt motion-safe:animate-spin" : "bx-image-add"}`} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {thumbnailBusy ? "Mengolah thumbnail…" : draft.thumbnailUrl ? "Ganti thumbnail" : "Pilih foto thumbnail"}
                      <span className="mt-0.5 block text-xs font-normal text-mute">
                        PNG, JPG, atau WebP. Otomatis dikonversi ke WebP.
                      </span>
                    </span>
                    <input
                      type="file"
                      required={!draft.thumbnailUrl}
                      accept="image/png,image/jpeg,image/webp"
                      disabled={thumbnailBusy}
                      onChange={(event) => {
                        void uploadThumbnail(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                      className="sr-only"
                    />
                  </label>
                  {draft.thumbnailUrl && (
                    <img
                      src={draft.thumbnailUrl}
                      alt="Preview thumbnail utama"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                </div>

                <Field label="Penulis">
                  <input
                    required
                    value={draft.author}
                    readOnly
                    aria-readonly="true"
                    className="w-full cursor-not-allowed px-3 py-3 text-sm text-mute"
                  />
                </Field>
                <p role="status" className="flex items-start gap-2 text-xs leading-5 text-mute">
                  <i className="bx bx-bot mt-0.5 text-base" aria-hidden="true" /> {analysisMessage}
                </p>
              </div>
            </section>

            {/* 3. Isi artikel */}
            <section className="grid gap-4 border-t border-rule pt-8" aria-labelledby="sec-body">
              <SectionHeader
                step={3}
                title="Isi artikel"
                hint="Susun bagian sesuai alur cerita. Gunakan panah untuk mengubah urutan."
              />
              <div className="space-y-3">
                {draft.blocks.map((block, index) => {
                  const meta = BLOCK_META[block.type];
                  return (
                    <div
                      key={block.id}
                      ref={(element) => {
                        if (element) blockElements.current.set(block.id, element);
                        else blockElements.current.delete(block.id);
                      }}
                      className="border border-rule bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-rule bg-white px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-800">
                          <span className="grid size-7 shrink-0 place-items-center bg-gray-100 text-base">
                            <i className={`bx ${meta.icon}`} aria-hidden="true" />
                          </span>
                          <span className="truncate">{meta.label}</span>
                          <span className="font-mono text-xs font-normal text-mute">#{index + 1}</span>
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            title="Pindahkan bagian ke atas"
                            aria-label="Pindahkan bagian ke atas"
                            onClick={() => move(block.id, -1)}
                            disabled={index === 0}
                            className="grid size-9 place-items-center bg-gray-100 text-lg text-gray-800 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <i className="bx bx-up-arrow-alt" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title="Pindahkan bagian ke bawah"
                            aria-label="Pindahkan bagian ke bawah"
                            onClick={() => move(block.id, 1)}
                            disabled={index === draft.blocks.length - 1}
                            className="grid size-9 place-items-center bg-gray-100 text-lg text-gray-800 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <i className="bx bx-down-arrow-alt" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title="Hapus bagian"
                            aria-label="Hapus bagian"
                            onClick={() => remove(block.id)}
                            className="grid size-9 place-items-center bg-gray-800 text-lg text-white transition-colors hover:bg-gray-700"
                          >
                            <i className="bx bx-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        {block.type === "text" && (
                          <div className="grid gap-3">
                            {index === 0 && (
                              <div className="grid gap-2 border border-rule bg-white p-3">
                                <Field label="Lokasi pembuka" hint="· tampil sebagai awalan berita">
                                  <input
                                    value={draft.location}
                                    onChange={(event) => update("location", event.target.value)}
                                    placeholder="Contoh: LAMPUNG"
                                    className="w-full px-3 py-2.5 text-sm"
                                  />
                                </Field>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void useCurrentLocation()}
                                    disabled={locationBusy}
                                    className="inline-flex h-9 items-center gap-1.5 border border-rule bg-white px-3 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    <i className="bx bx-current-location text-base" aria-hidden="true" />
                                    {locationBusy ? "Mencari lokasi…" : "Gunakan lokasi saya"}
                                  </button>
                                  {locationMessage && <span role="status" className="text-xs text-mute">{locationMessage}</span>}
                                </div>
                              </div>
                            )}
                            <RichTextEditor
                              value={{ text: block.text, html: block.html }}
                              onChange={(value) => updateBlock(block.id, value)}
                            />
                          </div>
                        )}
                        {block.type === "heading" && (
                          <input
                            value={block.text}
                            onChange={(event) =>
                              updateBlock(block.id, { text: event.target.value })
                            }
                            placeholder="Judul bagian"
                            aria-label="Judul bagian"
                            className="w-full px-3 py-3 text-sm"
                          />
                        )}
                        {block.type === "image" && (
                          <div className="grid gap-3">
                            <label className="flex cursor-pointer items-center gap-4 border border-dashed border-gray-300 bg-white p-3 transition-colors hover:bg-gray-100">
                              <span className="grid size-11 shrink-0 place-items-center bg-gray-800 text-2xl text-white">
                                <i className={`bx ${imageBusy === block.id ? "bx-loader-alt motion-safe:animate-spin" : "bx-image-add"}`} aria-hidden="true" />
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {imageBusy === block.id ? "Mengolah foto…" : block.url ? "Ganti foto" : "Unggah foto"}
                                <span className="mt-0.5 block text-xs font-normal text-mute">Otomatis WebP · maksimal 2 MB</span>
                              </span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="sr-only"
                                disabled={imageBusy === block.id}
                                onChange={(event) => {
                                  void uploadImage(block.id, event.target.files?.[0]);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                            {block.url && (
                              <img
                                src={block.url}
                                alt={block.alt}
                                className="max-h-56 w-full object-cover"
                              />
                            )}
                            <Field label="URL foto" hint="· atau unggah di atas">
                              <input
                                value={block.url}
                                onChange={(event) =>
                                  updateBlock(block.id, { url: event.target.value })
                                }
                                placeholder="https://..."
                                className="w-full px-3 py-3 text-sm"
                              />
                            </Field>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="Deskripsi foto (alt text)">
                                <input
                                  value={block.alt}
                                  onChange={(event) =>
                                    updateBlock(block.id, { alt: event.target.value })
                                  }
                                  placeholder="Apa yang terlihat di foto"
                                  className="w-full px-3 py-3 text-sm"
                                />
                              </Field>
                              <Field label="Caption" hint="· opsional">
                                <input
                                  value={block.caption || ""}
                                  onChange={(event) =>
                                    updateBlock(block.id, { caption: event.target.value })
                                  }
                                  placeholder="Keterangan di bawah foto"
                                  className="w-full px-3 py-3 text-sm"
                                />
                              </Field>
                            </div>
                            <button
                              type="button"
                              disabled={imageBusy === block.id || !block.url}
                              onClick={() => void generateCaption(block)}
                              className="inline-flex h-9 w-fit items-center gap-1.5 bg-gray-800 px-3 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                            >
                              <i className="bx bx-sparkles text-base" aria-hidden="true" />
                              {imageBusy === block.id
                                ? "Membuat caption…"
                                : "Buat caption dengan AI"}
                            </button>
                          </div>
                        )}
                        {block.type === "quote" && (
                          <div className="grid gap-3">
                            <textarea
                              value={block.text}
                              onChange={(event) =>
                                updateBlock(block.id, { text: event.target.value })
                              }
                              placeholder="Tulis kutipan..."
                              aria-label="Kutipan"
                              className="min-h-24 w-full px-3 py-3 text-sm"
                            />
                            <input
                              value={block.attribution || ""}
                              onChange={(event) =>
                                updateBlock(block.id, { attribution: event.target.value })
                              }
                              placeholder="Sumber kutipan (opsional)"
                              aria-label="Sumber kutipan"
                              className="w-full px-3 py-3 text-sm"
                            />
                          </div>
                        )}
                        {(block.type === "link" || block.type === "button") && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label={block.type === "button" ? "Teks tombol" : "Judul tautan"}>
                              <input
                                required
                                value={block.text}
                                onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                                placeholder={block.type === "button" ? "Contoh: Baca selengkapnya" : "Contoh: Sumber resmi"}
                                className="w-full px-3 py-3 text-sm"
                              />
                            </Field>
                            <Field label="URL" hint="· harus diawali https://">
                              <input
                                required
                                type="url"
                                pattern="https://.*"
                                value={block.url}
                                onChange={(event) => updateBlock(block.id, { url: event.target.value })}
                                placeholder="https://contoh.com"
                                className="w-full px-3 py-3 text-sm"
                              />
                            </Field>
                          </div>
                        )}
                        {block.type === "callout" && (
                          <div className="grid gap-3">
                            <input
                              value={block.title || ""}
                              onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                              placeholder="Judul sorotan (opsional)"
                              aria-label="Judul sorotan"
                              className="w-full px-3 py-3 text-sm"
                            />
                            <textarea
                              required
                              value={block.text}
                              onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                              placeholder="Isi informasi penting..."
                              aria-label="Isi sorotan"
                              className="min-h-24 w-full px-3 py-3 text-sm"
                            />
                          </div>
                        )}
                        {block.type === "divider" && (
                          <p className="text-sm text-mute">Garis pemisah antarbagian.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Palet tambah bagian */}
              <div className="grid gap-2">
                <span className="text-xs font-medium text-gray-800">Tambah bagian</span>
                <div className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
                  {ADDABLE.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => add(type)}
                      className="flex min-h-11 items-center gap-2 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-800 hover:text-white"
                    >
                      <i className={`bx ${BLOCK_META[type].icon} text-lg`} aria-hidden="true" />
                      {BLOCK_META[type].label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <PopupStatus message={error} />

          {/* Bar aksi yang selalu terlihat */}
          <div
            className={`sticky bottom-[var(--composer-bottom,0px)] z-10 flex items-center justify-between gap-2 border-t border-rule bg-white/95 px-4 pt-2.5 shadow-[0_-8px_16px_-12px_rgba(0,0,0,.25)] backdrop-blur sm:gap-3 sm:px-6 sm:shadow-none lg:bottom-0 xl:px-7 ${bottomInset === 0 ? "pb-[max(0.625rem,env(safe-area-inset-bottom))]" : "pb-2.5"}`}
            style={{ "--composer-bottom": `${bottomInset}px` } as React.CSSProperties}
          >
            <p className="min-w-0 text-xs text-mute" role="status">
              <span className="sm:hidden">{doneCount}/{checklist.length} lengkap</span>
              <span className="hidden sm:inline">
                {doneCount === checklist.length
                  ? "Semua bagian wajib sudah terisi."
                  : `${checklist.length - doneCount} bagian wajib belum lengkap.`}
              </span>
            </p>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {article && onCancel && (
                <button
                  type="button"
                  onClick={async () => {
                    if (await confirmAction("Batalkan pengeditan artikel?", "Batalkan edit")) onCancel();
                  }}
                  className="min-h-11 border border-rule px-4 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                >
                  Batal edit
                </button>
              )}
              <button
                disabled={busy}
                className="inline-flex min-h-8 items-center gap-2 bg-gray-800 px-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                <i className="bx bx-paper-plane text-lg" aria-hidden="true" />
                {busy
                  ? "Mengirim..."
                  : article
                    ? "Ajukan ulang"
                    : "Kirim untuk review"}
              </button>
            </div>
          </div>
        </form>

        <aside
          className={`min-w-0 border border-rule bg-white lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:min-h-[calc(100vh-7rem)] lg:overflow-y-auto ${mobileTab === "editor" ? "hidden lg:block" : ""}`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-white/95 px-5 py-3 backdrop-blur sm:px-7">
            <span className="eyebrow">Live preview</span>
            <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-gray-800">Draft</span>
          </div>
          <article className="p-5 sm:p-7 xl:p-8">
            <p className="eyebrow">{draft.category}</p>
            <h1 className="mt-3 font-display text-3xl leading-tight text-gray-800 sm:text-4xl xl:text-5xl">
              {draft.title || "Judul artikel kamu"}
            </h1>
            <p className="mt-5 max-w-[56ch] text-lg leading-8 text-mute">
              {draft.dek || "Ringkasan artikel akan tampil di sini."}
            </p>
            <p className="mt-5 font-mono text-[11px] text-mute">
              Oleh {draft.author || "Nama penulis"} · {draft.readTime} menit baca
            </p>
            {draft.thumbnailUrl && (
              <img
                src={draft.thumbnailUrl}
                alt="Thumbnail utama artikel"
                className="mt-8 aspect-[16/9] w-full object-cover"
              />
            )}
            <div className="mt-8">
              <ArticleBody content={textContent} contentBlocks={outputBlocks} />
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}