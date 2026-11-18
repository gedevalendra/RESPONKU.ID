"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";
import { useState } from "react";
import type { Profile } from "@/lib/types";
export default function AccountSettings({ actor, linkedProviders = [] }: { actor: Profile; linkedProviders?: string[] }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
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
  const login = actor.provider === "google" ? "Google" : actor.provider === "funikin" ? "FunikIn" : "Email dan sandi";
  const details = [
    ["Nama", actor.displayName],
    ["Email", actor.email],
    ["Username", actor.username ? `@${actor.username}` : "—"],
    ["Metode masuk", login],
    ["Peran", actor.role],
    ["ID akun", actor.id],
  ];

  return (
    <section aria-labelledby="account-information" className="min-w-0 border border-rule bg-paper">
      <h2 id="account-information" className="border-b border-rule px-5 py-4 font-display text-xl sm:px-6">Informasi akun</h2>
      <dl className="divide-y divide-rule px-5 text-sm sm:px-6">
        {details.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
            <dt className="text-mute">{label}</dt>
            <dd className="wrap-break-word font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-rule px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold">Akun terhubung</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {linkedProviders.length > 0 ? linkedProviders.map((provider) => (
            <span key={provider} className="inline-flex items-center gap-2 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <i className={`bx ${provider === "google" ? "bxl-google" : "bx-link"}`} aria-hidden="true" />
              {provider === "google" ? "Google" : provider === "funikin" ? "FunikIn" : provider}
              <span className="text-xs text-blue-600">Terhubung</span>
            </span>
          )) : <span className="text-sm text-mute">Belum ada akun OAuth yang terhubung.</span>}
        </div>
        <p className="mt-3 text-xs text-mute">Akun Google akan otomatis terhubung ke FunikIn jika emailnya sudah diverifikasi dan sama.</p>
      </div>
      <div className="border-t border-rule px-5 py-4 sm:px-6">
        <button type="button" aria-expanded={open} className="inline-flex min-h-10 items-center gap-2 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100"
          onClick={() => setOpen(!open)}>
          <i className="bx bx-trash" aria-hidden="true" /> Hapus akun
        </button>
        {open && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-mute">Penghapusan akun bersifat permanen. Artikel yang sudah terbit tetap menjadi arsip redaksi.</p>
            <label className="grid gap-2 text-sm">
              Ketik “{actor.displayName}” untuk mengonfirmasi.
              <input className="w-full p-3" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className="border border-rule px-3 py-2 text-sm" onClick={() => { setOpen(false); setConfirmation(""); }}>Batal</button>
              <button type="button" className="bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={busy || confirmation !== actor.displayName} onClick={() => void remove()}>
                {busy ? "Menghapus…" : "Hapus permanen"}
              </button>
            </div>
          </div>
        )}
      </div>
      <PopupStatus message={message} />
    </section>
  );
}
