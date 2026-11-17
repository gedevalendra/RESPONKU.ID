"use client";
import { useState } from "react";
import type { Profile } from "@/lib/types";
export default function AccountSettings({ actor }: { actor: Profile }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
      const data = await response.json();
      if (response.ok) window.location.assign("/auth/logout");
      else setMessage(data.error);
    } catch { setMessage("Penghapusan gagal. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5 bg-white p-6"><h1 className="text-2xl font-semibold">Pengaturan akun</h1><dl className="space-y-3 text-sm">{[["Nama", actor.displayName], ["Email", actor.email], ["Username", actor.username || "—"], ["Login", actor.provider || "Email dan sandi"], ["Peran", actor.role], ["ID akun", actor.id]].map(([label, value]) => <div key={label}><dt className="text-mute">{label}</dt><dd className="break-all">{value}</dd></div>)}</dl><button className="text-red-600" onClick={() => setOpen(!open)}>Hapus akun</button>{open && <div className="space-y-3 border-t pt-4"><p className="text-sm">Penghapusan akun bersifat permanen. Artikel yang sudah diterbitkan tetap menjadi arsip redaksi. Ketik nama akun “{actor.displayName}” untuk mengonfirmasi.</p><input className="w-full p-3" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nama akun" /><button className="bg-red-600 px-4 py-2 text-white disabled:opacity-50" disabled={busy || confirmation !== actor.displayName} onClick={() => void remove()}>{busy ? "Menghapus…" : "Hapus akun permanen"}</button><p role="status">{message}</p></div>}</section>;
}
