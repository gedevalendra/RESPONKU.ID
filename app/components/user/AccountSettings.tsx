"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";
import { useState } from "react";
import type { Profile } from "@/lib/types";

export default function AccountSettings({ actor, linkedProviders = [] }: { actor: Profile; linkedProviders?: string[] }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function remove() {
    if (!(await confirmAction("Hapus akun secara permanen?", "Hapus akun"))) return;
    setBusy(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
      const data = await response.json();
      if (response.ok) window.location.assign("/auth/logout");
      else setMessage(data.error);
    } catch { setMessage("Penghapusan gagal. Coba lagi."); }
    finally { setBusy(false); }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(String(actor.id));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("ID akun tidak dapat disalin. Salin secara manual.");
    }
  }

  const login = actor.provider === "google" ? "Google" : actor.provider === "funikin" ? "FunikIn" : "Email dan sandi";
  const details = [
    ["Nama", actor.displayName],
    ["Email", actor.email],
    ["Username", actor.username ? `@${actor.username}` : "—"],
    ["Metode masuk", login],
    ["Peran", actor.role],
  ];
  const initialLetter = (actor.displayName || actor.email || "?").trim().charAt(0).toUpperCase();
  const mismatch = confirmation.length > 0 && confirmation !== actor.displayName;

  return (
    <section aria-labelledby="account-information" className="min-w-0 border border-rule bg-white">
      {/* Kepala */}
      <header className="flex items-center gap-4 border-b border-rule bg-gray-50 p-5 sm:p-6">
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center bg-gray-800 font-display text-2xl text-white">
          {initialLetter}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">Akun</p>
          <h2 id="account-information" className="mt-1 truncate font-display text-2xl leading-tight sm:text-3xl">
            Informasi akun
          </h2>
          <p className="mt-1 truncate text-sm text-mute">{actor.email}</p>
        </div>
      </header>

      {/* Detail */}
      <div className="p-5 sm:p-6">
        <dl className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0 bg-white p-4">
              <dt className="font-mono text-[11px] uppercase tracking-widest2 text-mute">{label}</dt>
              <dd className="mt-1.5 wrap-break-word text-sm font-medium text-ink">{value}</dd>
            </div>
          ))}
          <div className="min-w-0 bg-white p-4 sm:col-span-2">
            <dt className="font-mono text-[11px] uppercase tracking-widest2 text-mute">ID akun</dt>
            <dd className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
              <span className="min-w-0 wrap-break-word font-mono text-xs text-ink">{actor.id}</span>
              <button
                type="button"
                onClick={() => void copyId()}
                className="inline-flex h-9 items-center gap-1.5 border border-rule px-3 text-xs font-medium transition-colors hover:bg-gray-100"
              >
                <i className={`bx ${copied ? "bx-check" : "bx-copy"} text-base`} aria-hidden="true" />
                {copied ? "Tersalin" : "Salin"}
              </button>
            </dd>
          </div>
        </dl>
      </div>

      {/* Akun terhubung */}
      <div className="border-t border-rule p-5 sm:p-6">
        <h3 className="font-display text-xl">Akun terhubung</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {linkedProviders.length > 0 ? linkedProviders.map((provider) => (
            <span key={provider} className="inline-flex min-h-10 items-center gap-2 border border-blue-100 bg-blue-50 px-3 text-sm text-blue-800">
              <i className={`bx ${provider === "google" ? "bxl-google" : "bx-link"} text-lg`} aria-hidden="true" />
              {provider === "google" ? "Google" : provider === "funikin" ? "FunikIn" : provider}
              <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                <i className="bx bx-check-circle" aria-hidden="true" /> Terhubung
              </span>
            </span>
          )) : <span className="text-sm text-mute">Belum ada akun OAuth yang terhubung.</span>}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-mute">
          <i className="bx bx-info-circle mt-0.5 text-base" aria-hidden="true" />
          Akun Google akan otomatis terhubung ke FunikIn jika emailnya sudah diverifikasi dan sama.
        </p>
      </div>

      {/* Zona berbahaya */}
      <div className="border-t border-rule p-5 sm:p-6">
        <div className="border-l-4 border-red-700 bg-red-50/50 p-5">
          <p className="eyebrow text-red-700">Zona berbahaya</p>
          <h3 className="mt-1 font-display text-xl">Hapus akun</h3>
          <p className="mt-2 max-w-[56ch] text-sm leading-6 text-mute">
            Penghapusan akun bersifat permanen. Artikel yang sudah terbit tetap menjadi arsip redaksi.
          </p>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="delete-account-panel"
            className="mt-4 inline-flex min-h-11 items-center gap-2 border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            onClick={() => setOpen(!open)}
          >
            <i className="bx bx-trash text-lg" aria-hidden="true" /> {open ? "Tutup" : "Hapus akun"}
          </button>
          {open && (
            <div id="delete-account-panel" className="mt-5 grid gap-4 border-t border-red-200 pt-5">
              <label className="grid gap-2 text-sm">
                <span>
                  Ketik <strong className="font-semibold text-ink">“{actor.displayName}”</strong> untuk mengonfirmasi.
                </span>
                <input
                  className="w-full p-3"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  aria-invalid={mismatch}
                  autoComplete="off"
                />
                {mismatch && <span className="text-xs text-red-700">Nama belum sama persis.</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-11 border border-rule bg-white px-4 text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => { setOpen(false); setConfirmation(""); }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="min-h-11 bg-red-700 px-4 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-50"
                  disabled={busy || confirmation !== actor.displayName}
                  onClick={() => void remove()}
                >
                  {busy ? "Menghapus…" : "Hapus permanen"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PopupStatus message={message} />
    </section>
  );
}