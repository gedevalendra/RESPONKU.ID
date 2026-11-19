"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

type RichTextValue = { text: string; html?: string };

const tools = [
  ["bold", "bx-bold", "Tebal"],
  ["italic", "bx-italic", "Miring"],
  ["underline", "bx-underline", "Garis bawah"],
  ["strikeThrough", "bx-strikethrough", "Coret"],
  ["justifyLeft", "bx-align-left", "Rata kiri"],
  ["justifyCenter", "bx-align-middle", "Rata tengah"],
  ["justifyRight", "bx-align-right", "Rata kanan"],
  ["insertUnorderedList", "bx-list-ul", "Daftar bullet"],
  ["insertOrderedList", "bx-list-ol", "Daftar bernomor"],
  ["createLink", "bx-link", "Tautan"],
] as const;

export default function RichTextEditor({ value, onChange }: { value: RichTextValue; onChange: (value: RichTextValue) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const linkSelection = useRef<Range | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!editor.current || initialized.current) return;
    editor.current.innerHTML = value.html || value.text.replace(/\n/g, "<br>");
    initialized.current = true;
  }, [value.html, value.text]);

  function run(command: string, commandValue?: string) {
    editor.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, commandValue);
    emit();
  }

  function emit() {
    const current = editor.current;
    if (!current) return;
    onChange({ html: current.innerHTML, text: current.innerText });
  }

  function preventFocusLoss(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
  }

  function openLinkDialog() {
    const selection = window.getSelection();
    linkSelection.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    setLinkUrl("");
    setLinkDialogOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!/^https:\/\//i.test(url)) return;
    editor.current?.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    if (linkSelection.current) selection?.addRange(linkSelection.current);
    run("createLink", url);
    setLinkDialogOpen(false);
  }

  return (
    <div className="overflow-hidden border border-rule bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-rule bg-gray-50 p-2">
        {tools.map(([command, icon, label]) => (
          <button
            key={command}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={preventFocusLoss}
            onClick={() => command === "createLink" ? openLinkDialog() : run(command)}
            className="grid size-8 place-items-center text-lg text-gray-600 hover:bg-gray-200 hover:text-gray-800"
          >
            <i className={`bx ${icon}`} aria-hidden="true" />
          </button>
        ))}
        <label title="Warna teks" className="grid size-8 cursor-pointer place-items-center text-lg text-gray-600 hover:bg-gray-200 hover:text-gray-800">
          <i className="bx bx-palette" aria-hidden="true" />
          <input
            type="color"
            aria-label="Warna teks"
            defaultValue="#1f2937"
            onMouseDown={preventFocusLoss}
            onChange={(event) => run("foreColor", event.target.value)}
            className="sr-only"
          />
        </label>
        <button type="button" title="Hapus format" aria-label="Hapus format" onMouseDown={preventFocusLoss} onClick={() => run("removeFormat")} className="grid size-8 place-items-center text-lg text-gray-600 hover:bg-gray-200 hover:text-gray-800">
          <i className="bx bx-eraser" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        onInput={emit}
        className="min-h-36 w-full whitespace-pre-wrap px-3 py-3 text-sm outline-none"
        data-placeholder="Tulis paragraf berita..."
      />
      {linkDialogOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLinkDialogOpen(false); }}>
          <form onSubmit={(event) => { event.preventDefault(); applyLink(); }} role="dialog" aria-modal="true" aria-labelledby="rich-link-title" className="w-full max-w-md bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="rich-link-title" className="font-display text-xl">Tambahkan tautan</h2>
              <button type="button" aria-label="Tutup" onClick={() => setLinkDialogOpen(false)} className="grid size-9 place-items-center text-xl text-mute hover:bg-gray-100">
                <i className="bx bx-x" aria-hidden="true" />
              </button>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              URL tautan
              <input autoFocus type="url" required pattern="https://.*" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://contoh.com" className="w-full px-3 py-2.5" />
            </label>
            <p className="mt-2 text-xs text-mute">Gunakan alamat yang diawali https://.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setLinkDialogOpen(false)} className="px-4 py-2 text-sm text-mute hover:bg-gray-100">Batal</button>
              <button type="submit" className="bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700">Terapkan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
