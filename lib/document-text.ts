import "server-only";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_CHARACTERS = 50_000;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "jsonl", "csv", "tsv", "xml", "html", "htm",
  "yaml", "yml", "log", "ini", "conf", "tex", "sql", "js", "jsx", "ts", "tsx",
  "css", "scss", "py", "java", "c", "cpp", "h", "sh",
]);

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() || "";
}

function normalizeText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function decodeText(buffer: Buffer) {
  const text = buffer.toString("utf8");
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const nullCount = (text.match(/\u0000/g) || []).length;
  if (replacementCount > Math.max(8, text.length * 0.01) || nullCount > Math.max(4, text.length * 0.01)) {
    throw new Error("File ini merupakan data biner yang belum dapat diubah menjadi teks.");
  }
  return text;
}

function stripMarkup(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function extractRtf(value: string) {
  return value
    .replace(/\\par[d]?\b/g, "\n")
    .replace(/\\'[0-9a-fA-F]{2}/g, (match) => String.fromCharCode(Number.parseInt(match.slice(2), 16)))
    .replace(/\\[a-zA-Z]+-?\d* ?/g, "")
    .replace(/[{}]/g, "");
}

export type ExtractedDocument = {
  fileName: string;
  source: string;
};

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  if (!file.name || file.size === 0) throw new Error("File kosong atau tidak memiliki nama.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Ukuran dokumen maksimal 10 MB.");

  const extension = extensionOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  let source = "";

  if (extension === "pdf" || file.type === "application/pdf") {
    // Entry point pdf-parse menjalankan kode debug `!module.parent` yang dapat
    // keliru aktif setelah dibundel Next.js dan mencoba membaca PDF test paket.
    // Impor parser internal agar hanya logika parsing yang dijalankan.
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const result = await pdfParse(buffer);
    source = result.text;
  } else if (
    extension === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    source = result.value;
  } else if (extension === "rtf" || file.type === "application/rtf") {
    source = extractRtf(decodeText(buffer));
  } else if (extension === "html" || extension === "htm" || file.type === "text/html") {
    source = stripMarkup(decodeText(buffer));
  } else if (TEXT_EXTENSIONS.has(extension) || file.type.startsWith("text/") || !extension) {
    source = decodeText(buffer);
  } else if (extension === "doc") {
    throw new Error("Format Word lama .doc belum didukung. Simpan dokumen sebagai .docx lalu unggah kembali.");
  } else {
    // Ekstensi tidak dikenal tetap dicoba jika isinya memang teks biasa.
    source = decodeText(buffer);
  }

  source = normalizeText(source).slice(0, MAX_EXTRACTED_CHARACTERS);
  if (source.length < 20) {
    throw new Error("Teks dokumen tidak terbaca atau terlalu pendek. PDF hasil scan perlu diubah dengan OCR terlebih dahulu.");
  }

  return { fileName: file.name, source };
}
