"use client";
import { PopupAdminContent } from "@/app/components/loading/AdminSkeletons";
import { Skeleton } from "@/app/components/loading/PageSkeleton";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";
import { useEffect, useRef, useState } from "react";
type ButtonAlignment = "left" | "center" | "right";
type Popup = {
  enabled: boolean; title: string; text: string; image: string; version: string;
  buttonLabel?: string; buttonAlignment?: ButtonAlignment;
  buttonWidth?: number | "full";
  buttonHeight?: number;
  buttonRadius?: number;
  buttonColor?: string;
  buttonTextColor?: string;
};

const buttonAlignmentClasses: Record<ButtonAlignment, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
const emptyPopup: Popup = { enabled: false, title: "", text: "", image: "", version: "" };

const fieldClass = "min-w-0 w-full border border-rule bg-gray-50 px-3 py-2.5 text-sm";
const labelClass = "grid min-w-0 gap-2 text-sm font-medium";

function PopupContent({ popup, onClose }: { popup: Popup; onClose?: () => void }) {
  const width = popup.buttonWidth === "full" ? "100%" : Number.isFinite(popup.buttonWidth) ? popup.buttonWidth : undefined;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 id={onClose ? "welcome-popup-title" : undefined} className="min-w-0 break-words text-xl font-semibold">
          {popup.title || (onClose ? "Informasi ResponKu" : "Judul popup")}
        </h2>
        <button type="button" onClick={onClose} disabled={!onClose} aria-label="Tutup"
          className="grid size-10 shrink-0 place-items-center rounded-full border-0 outline-none enabled:hover:bg-gray-100 focus-visible:bg-gray-200">
          <i className="bx bx-x text-2xl" aria-hidden="true" />
        </button>
      </div>
      {popup.image && <img src={popup.image} alt="Informasi ResponKu" className="my-4 max-h-72 w-full object-contain" />}
      <p className="my-4 whitespace-pre-wrap break-words text-sm leading-6">{popup.text || (onClose ? "" : "Isi informasi popup")}</p>
      <div className={`flex ${buttonAlignmentClasses[popup.buttonAlignment ?? "left"]}`}>
        <button
          type="button"
          onClick={onClose}
          disabled={!onClose}
          className="max-w-full min-w-0 break-words px-4 py-2 leading-snug enabled:hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            width,
            minHeight: popup.buttonHeight ?? 40,
            borderRadius: popup.buttonRadius ?? 8,
            backgroundColor: popup.buttonColor ?? "#2b7fff",
            color: popup.buttonTextColor ?? "#ffffff",
          }}
        >
          {popup.buttonLabel?.trim() || "Mengerti"}
        </button>
      </div>
    </>
  );
}

export default function WelcomePopup({ admin = false }: { admin?: boolean }) {
  const [popup, setPopup] = useState<Popup>(emptyPopup);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/popup", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (controller.signal.aborted) return;
        setPopup({ ...emptyPopup, ...data.popup, image: data.popup?.image ?? "" });
        setLoaded(true);
      } catch (error) {
        if (admin && !controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Pengaturan popup gagal dimuat.");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [admin]);

  useEffect(() => {
    if (admin || !popup.enabled || /^\/(admin|superadmin)(\/|$)/.test(location.pathname)) return;
    if (localStorage.getItem("responku-popup") !== popup.version && !dialog.current?.open) {
      dialog.current?.showModal();
    }
  }, [admin, popup.enabled, popup.version]);

  function close() {
    dialog.current?.close();
    localStorage.setItem("responku-popup", popup.version);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || busy || uploading) return;
    setBusy(true);
    setMessage("");
    try {
      if (!(await confirmAction("Simpan perubahan popup?", "Simpan"))) return;
      const response = await fetch("/api/popup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(popup),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Popup gagal disimpan.");
      setPopup(data.popup);
      setMessage("Popup disimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Popup gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setMessage("");
    try {
      const { convertToWebp } = await import("@/app/components/article/ArticleComposer");
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append("file", new File([blob], "popup.webp", { type: "image/webp" }));
      const response = await fetch("/api/uploads/image", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gambar gagal diunggah.");
      setPopup((current) => ({ ...current, image: data.url }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gambar gagal diunggah.");
    } finally {
      setUploading(false);
    }
  }

  function update<K extends keyof Popup>(key: K, value: Popup[K]) {
    setPopup((current) => ({ ...current, [key]: value }));
  }

  if (admin && !loaded) return message
    ? <p role="alert" className="text-sm text-mute">{message}</p>
    : <Skeleton><PopupAdminContent /></Skeleton>;

  if (admin) {
    const widthMode = popup.buttonWidth === "full" ? "full" : popup.buttonWidth === undefined ? "auto" : "custom";
    return (
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <form className="min-w-0 border border-rule bg-paper" onSubmit={save}>
          <fieldset disabled={!loaded || busy} className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-4 sm:px-6">
              <h2 className="font-display text-xl">Isi popup</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-accent" checked={popup.enabled} onChange={(event) => update("enabled", event.target.checked)} />
                Tampilkan popup
              </label>
            </div>
            <div className="grid gap-4 p-5 sm:p-6">
              <label className={labelClass}>Judul
                <input className={fieldClass} maxLength={150} value={popup.title} onChange={(event) => update("title", event.target.value)} />
              </label>
              <label className={labelClass}>Informasi
                <textarea className={fieldClass} rows={4} maxLength={5000} value={popup.text} onChange={(event) => update("text", event.target.value)} />
              </label>
              <label className={labelClass}>Gambar opsional
                <input className={`${fieldClass} file:mr-3 file:bg-gray-200 file:px-2 file:py-1`} type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = "";
                }} />
              </label>
              {popup.image && <button type="button" className="justify-self-start text-sm text-red-700 underline" disabled={uploading} onClick={() => update("image", "")}>Hapus gambar</button>}
            </div>
            <div className="border-y border-rule p-5 sm:p-6">
              <h2 className="mb-4 font-display text-xl">Tampilan tombol</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>Teks tombol
                  <input className={fieldClass} maxLength={50} value={popup.buttonLabel ?? "Mengerti"} onChange={(event) => update("buttonLabel", event.target.value)} />
                </label>
                <label className={labelClass}>Posisi tombol
                  <select className={fieldClass} value={popup.buttonAlignment ?? "left"} onChange={(event) => update("buttonAlignment", event.target.value as ButtonAlignment)}>
                    <option value="left">Kiri</option>
                    <option value="center">Tengah</option>
                    <option value="right">Kanan</option>
                  </select>
                </label>
                <label className={labelClass}>Lebar tombol
                  <select className={fieldClass} value={widthMode} onChange={(event) => update("buttonWidth", event.target.value === "full" ? "full" : event.target.value === "custom" ? 160 : undefined)}>
                    <option value="auto">Sesuai teks</option>
                    <option value="full">Lebar penuh</option>
                    <option value="custom">Ukuran manual</option>
                  </select>
                </label>
                {widthMode === "custom" && (
                  <label className={labelClass}>Lebar manual (px)
                    <input className={fieldClass} type="number" required min={48} max={400} value={Number.isNaN(popup.buttonWidth) ? "" : popup.buttonWidth} onChange={(event) => update("buttonWidth", event.target.valueAsNumber)} />
                  </label>
                )}
                <label className={labelClass}>Tinggi minimum (px)
                  <input className={fieldClass} type="number" min={40} max={88} placeholder="40" value={popup.buttonHeight ?? ""} onChange={(event) => update("buttonHeight", event.target.value ? event.target.valueAsNumber : undefined)} />
                </label>
                <label className={labelClass}>Radius sudut (px)
                  <input className={fieldClass} type="number" min={0} max={48} placeholder="8" value={popup.buttonRadius ?? ""} onChange={(event) => update("buttonRadius", event.target.value ? event.target.valueAsNumber : undefined)} />
                </label>
                <label className={labelClass}>Warna tombol
                  <input className="h-11 w-full cursor-pointer border border-rule bg-gray-50 p-1" type="color" value={popup.buttonColor ?? "#2b7fff"} onChange={(event) => update("buttonColor", event.target.value)} />
                </label>
                <label className={labelClass}>Warna teks
                  <input className="h-11 w-full cursor-pointer border border-rule bg-gray-50 p-1" type="color" value={popup.buttonTextColor ?? "#ffffff"} onChange={(event) => update("buttonTextColor", event.target.value)} />
                </label>
              </div>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <button type="submit" disabled={uploading} className="bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {busy ? "Menyimpan…" : uploading ? "Mengunggah gambar…" : "Simpan"}
              </button>
            </div>
          </fieldset>
          <PopupStatus message={message} />
        </form>
        {loaded && (
          <aside className="min-w-0 border border-rule bg-paper">
            <h2 className="border-b border-rule px-5 py-4 font-display text-xl">Pratinjau popup</h2>
            <div className="bg-gray-100 p-4">
              <div className="mx-auto max-w-md rounded-xl bg-paper p-5 shadow-sm">
                <PopupContent popup={popup} />
              </div>
            </div>
          </aside>
        )}
      </div>
    );
  }

  return (
    <dialog ref={dialog} onCancel={close} aria-labelledby="welcome-popup-title"
      className="action-popup fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 backdrop:bg-black/40">
      <PopupContent popup={popup} onClose={close} />
    </dialog>
  );
}
