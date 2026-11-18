"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";
import { useEffect, useRef, useState } from "react";
type ButtonAlignment = "left" | "center" | "right";
type Popup = {
  enabled: boolean; title: string; text: string; image: string; version: string;
  buttonLabel?: string; buttonAlignment?: ButtonAlignment;
};

const buttonAlignmentClasses: Record<ButtonAlignment, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
export default function WelcomePopup({ admin = false }: { admin?: boolean }) {
  const [popup, setPopup] = useState<Popup>({ enabled: false, title: "", text: "", image: "", version: "" });
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { void fetch("/api/popup").then((response) => response.json()).then(({ popup: value }) => {
    if (!value) return;
    setPopup(value);
    if (!admin && value.enabled && localStorage.getItem("responku-popup") !== value.version && !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/superadmin")) dialog.current?.showModal();
  }).catch(() => {}); }, [admin]);
  function close() { localStorage.setItem("responku-popup", popup.version); dialog.current?.close(); }
  if (admin) return <form className="max-w-2xl space-y-4 bg-white p-6" onSubmit={async (event) => { event.preventDefault(); if (!(await confirmAction("Simpan perubahan popup?", "Simpan"))) return; const response = await fetch("/api/popup", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(popup) }); setMessage(response.ok ? "Popup disimpan" : "Gagal menyimpan popup"); }}><label className="flex gap-2"><input type="checkbox" checked={popup.enabled} onChange={(event) => setPopup({ ...popup, enabled: event.target.checked })} />Tampilkan popup</label><input className="w-full p-3" placeholder="Judul" value={popup.title} onChange={(event) => setPopup({ ...popup, title: event.target.value })} /><textarea className="w-full p-3" rows={6} placeholder="Informasi" value={popup.text} onChange={(event) => setPopup({ ...popup, text: event.target.value })} /><label className="block text-sm">Gambar opsional<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const { convertToWebp } = await import("@/app/components/article/ArticleComposer"); try { const blob = await convertToWebp(file); const form = new FormData(); form.append("file", new File([blob], "popup.webp", { type: "image/webp" })); const response = await fetch("/api/uploads/image", { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPopup({ ...popup, image: data.url }); } catch { setMessage("Upload gambar gagal"); } }} /></label>{popup.image && <><img src={popup.image} alt="Preview popup" className="max-h-48 object-contain" /><button type="button" onClick={() => setPopup({ ...popup, image: "" })}>Hapus gambar</button></>}<div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Teks tombol
        <input className="w-full p-3" maxLength={50} value={popup.buttonLabel ?? "Mengerti"} onChange={(event) => setPopup({ ...popup, buttonLabel: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">Posisi tombol
        <select className="w-full border border-rule p-3" value={popup.buttonAlignment ?? "left"} onChange={(event) => setPopup({ ...popup, buttonAlignment: event.target.value as ButtonAlignment })}>
          <option value="left">Kiri</option>
          <option value="center">Tengah</option>
          <option value="right">Kanan</option>
        </select>
      </label>
    </div><button className="bg-blue-500 px-4 py-2 text-white">Simpan</button><PopupStatus message={message} /></form>;
  return (
    <dialog ref={dialog} onCancel={close} aria-labelledby="welcome-popup-title"
      className="action-popup fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 backdrop:bg-black/40">
      <div className="flex items-start justify-between gap-3">
        <h2 id="welcome-popup-title" className="min-w-0 break-words text-xl font-semibold">{popup.title}</h2>
        <button type="button" onClick={close} aria-label="Tutup"
          className="grid size-10 shrink-0 place-items-center rounded-full border-0 outline-none hover:bg-gray-100 focus-visible:bg-gray-200">
          <i className="bx bx-x text-2xl" aria-hidden="true" />
        </button>
      </div>
      {popup.image && <img src={popup.image} alt="Informasi ResponKu" className="my-4 max-h-72 w-full object-contain" />}
      <p className="my-4 whitespace-pre-wrap text-sm leading-6">{popup.text}</p>
      <div className={`flex ${buttonAlignmentClasses[popup.buttonAlignment ?? "left"]}`}>
        <button type="button" className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600" onClick={close}>
          {popup.buttonLabel?.trim() || "Mengerti"}
        </button>
      </div>
    </dialog>
  );
}
