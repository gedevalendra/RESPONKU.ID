"use client";

import { PopupStatus } from "@/app/components/layout/ActionFeedback";
import { useEffect, useState } from "react";

type ApiSecret = { id: string; name: string; createdAt: string };

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ApiSecretManager() {
  const [secrets, setSecrets] = useState<ApiSecret[]>([]);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/api-secret", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Gagal memuat Secret ID");
    setSecrets(data.secrets);
  }

  useEffect(() => { void load().catch((error) => setMessage(error.message)).finally(() => setLoading(false)); }, []);

  async function generate(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setSecret("");
    try {
      const response = await fetch("/api/admin/api-secret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Secret ID gagal dibuat");
      setSecret(data.secret); setName(""); await load();
      setMessage(`Secret ID “${data.name}” berhasil dibuat. Salin sekarang karena tidak akan ditampilkan lagi.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Secret ID gagal dibuat."); }
    finally { setBusy(false); }
  }

  async function revoke(item: ApiSecret) {
    if (!window.confirm(`Cabut Secret ID “${item.name}”? Integrasi yang memakainya akan langsung berhenti.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/api-secret", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Secret ID gagal dicabut");
      await load(); setMessage(`Secret ID “${item.name}” berhasil dicabut.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Secret ID gagal dicabut."); }
    finally { setBusy(false); }
  }

  async function copy() {
    await navigator.clipboard.writeText(secret);
    setMessage("Secret ID disalin ke clipboard.");
  }

  if (loading) return <section className="space-y-4"><div className="h-8 w-48 animate-pulse bg-gray-200" /><div className="h-40 animate-pulse bg-gray-200" /></section>;

  return (
    <section className="max-w-3xl space-y-6">
      <div className="space-y-2"><p className="text-sm text-mute">Buat beberapa kredensial server-to-server untuk integrasi API seperti login FunikIn.</p><p className="text-sm text-mute">Nama membantu membedakan penggunaan secret. Nilai secret hanya ditampilkan satu kali dan disimpan dalam bentuk hash.</p></div>
      <PopupStatus message={message} />
      <form onSubmit={generate} className="space-y-4 border border-rule bg-white p-6"><div><h2 className="text-xl font-semibold">Generate Secret ID</h2><p className="mt-1 text-sm text-mute">Contoh nama: FunikIn Production atau Mobile App.</p></div><div className="flex flex-col gap-3 sm:flex-row"><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} placeholder="Nama secret" aria-label="Nama secret" className="min-w-0 flex-1 p-3" /><button type="submit" disabled={busy} className="bg-ink px-4 py-3 text-sm text-white disabled:opacity-50">{busy ? "Membuat…" : "Generate"}</button></div></form>
      {secret && <div className="space-y-3 border border-amber-300 bg-amber-50 p-4"><p className="text-sm font-semibold">Salin Secret ID ini sekarang</p><code className="block break-all text-sm">{secret}</code><button type="button" onClick={() => void copy()} className="text-sm text-blue-600">Salin Secret ID</button></div>}
      <div className="space-y-3"><h2 className="text-xl font-semibold">Secret ID aktif ({secrets.length})</h2><div className="divide-y divide-rule bg-white">{secrets.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-medium">{item.name}</p><p className="text-sm text-mute">Dibuat {formatDate(item.createdAt)}</p><p className="text-xs text-mute"><code>Authorization: Bearer &lt;secret-id&gt;</code></p></div><button type="button" disabled={busy} onClick={() => void revoke(item)} className="text-sm text-red-600 disabled:opacity-40">Cabut secret</button></div>)}{secrets.length === 0 && <p className="p-5 text-sm text-mute">Belum ada Secret ID.</p>}</div></div>
    </section>
  );
}
