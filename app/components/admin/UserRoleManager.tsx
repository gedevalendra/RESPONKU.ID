"use client";
import { UsersContent } from "@/app/components/loading/AdminSkeletons";
import { Skeleton } from "@/app/components/loading/PageSkeleton";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  tier?: "free" | "pro";
  verified: boolean;
  organizationId: string;
};

export default function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [actorId, setActorId] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [deleting, setDeleting] = useState<User | null>(null);
  const [confirmation, setConfirmation] = useState("");

  async function load() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Gagal memuat pengguna");
    setUsers(data.users);
    setOrganizations(data.organizations);
    setActorId(data.actorId);
    setActorRole(data.actorRole);
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message)).finally(() => setInitialLoading(false));
  }, []);

  async function mutate(user: User, method: "PATCH" | "DELETE", body: object) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDeleting(null);
      setConfirmation("");
      await load();
      setMessage(method === "DELETE" ? "Akun berhasil dihapus." : "Pengguna berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Perubahan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = users.filter((user) => `${user.display_name} ${user.email}`.toLowerCase().includes(query.toLowerCase()));

  if (initialLoading) return <Skeleton><UsersContent /></Skeleton>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Daftar pengguna ({users.length})</h2>
        <input aria-label="Cari pengguna" className="w-full p-3 sm:w-80" placeholder="Cari nama atau email…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <PopupStatus message={message} />
      <div className="divide-y divide-rule bg-white">
        {filtered.map((user) => {
          const protectedUser = user.role === "superadmin" && actorRole !== "superadmin";
          const protectedRole = protectedUser || user.id === actorId || (user.role === "admin" && actorRole !== "superadmin");
          return (
            <div key={user.id} className="space-y-4 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <a href={`/akun/${user.id}`} className="font-medium hover:text-blue-500">{user.display_name} {user.verified && <i className="bx bxs-badge-check align-middle text-blue-500" role="img" aria-label="Terverifikasi" />}</a>
                  <span className={`ml-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${user.tier === "pro" || user.role === "admin" || user.role === "superadmin" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {user.tier === "pro" || user.role === "admin" || user.role === "superadmin" ? "AI Pro" : "AI Gratis"}
                  </span>
                  <p className="break-all text-sm text-mute">{user.email}</p>
                </div>
                <button disabled={busy || protectedRole} className="text-sm text-red-600 disabled:opacity-40" onClick={() => { setDeleting(user); setConfirmation(""); }}>Hapus akun</button>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void mutate(user, "PATCH", { displayName: new FormData(event.currentTarget).get("displayName") }); }}>
                  <input aria-label="Nama pengguna" name="displayName" defaultValue={user.display_name} required minLength={2} maxLength={100} disabled={busy || protectedUser} className="min-w-0 p-3 text-sm" />
                  <button disabled={busy || protectedUser} className="text-sm text-blue-500">Simpan nama</button>
                </form>
                <label className="grid gap-1 text-sm">Peran
                  <select disabled={busy || protectedRole} value={user.role} className="p-3 disabled:opacity-50" onChange={(event) => void mutate(user, "PATCH", { role: event.target.value })}>
                    <option value="reader">Pengguna</option>
                    <option value="author">Penulis</option>
                    <option value="admin">Admin</option>
                    {(actorRole === "superadmin" || user.role === "superadmin") && <option value="superadmin">Superadmin</option>}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">Status AI / Tier
                  <select disabled={busy || protectedUser} value={user.tier || "free"} className="p-3 disabled:opacity-50 font-medium" onChange={(event) => void mutate(user, "PATCH", { tier: event.target.value })}>
                    <option value="free">Akun Gratis (Key Sendiri di FunikIn)</option>
                    <option value="pro">Akun Pro (Key Server ResponKu)</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">Organisasi
                  <select disabled={busy || protectedUser} value={user.organizationId} className="max-w-full p-3 disabled:opacity-50" onChange={(event) => void mutate(user, "PATCH", { organizationId: event.target.value || null })}>
                    <option value="">Tanpa organisasi</option>
                    {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                  </select>
                </label>
                <button disabled={busy || protectedUser} className="px-3 py-3 text-sm text-blue-500 disabled:opacity-40" onClick={() => void mutate(user, "PATCH", { verified: !user.verified })}>
                  {user.verified ? "Cabut centang biru" : "Verifikasi akun"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="p-5 text-sm text-mute">Pengguna tidak ditemukan.</p>}
      </div>
      {deleting && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-5">
          <div className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain bg-white p-6">
            <h3 id="delete-account-title" className="text-lg font-semibold">Hapus akun {deleting.display_name}?</h3>
            <p className="text-sm text-mute">Penghapusan permanen. Artikel terbit tetap menjadi arsip redaksi. Ketik nama akun untuk mengonfirmasi.</p>
            <input autoFocus className="w-full p-3" aria-label="Nama akun untuk konfirmasi" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            <div className="flex gap-3">
              <button disabled={busy} onClick={() => setDeleting(null)} className="px-4 py-2">Batal</button>
              <button disabled={busy || confirmation !== deleting.display_name} onClick={() => void mutate(deleting, "DELETE", { confirmation })} className="bg-red-600 px-4 py-2 text-white disabled:opacity-50">{busy ? "Menghapus…" : "Hapus permanen"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
