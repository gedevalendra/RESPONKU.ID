"use client";
import { OrganizationsContent } from "@/app/components/loading/AdminSkeletons";
import { Skeleton } from "@/app/components/loading/PageSkeleton";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";
import { useEffect, useState } from "react";
import UserPicker from "@/app/components/admin/UserPicker";

type Org = { id: string; name: string; verified: boolean; ownerId: string; photoUrl?: string; description?: string; website?: string };
type Member = { userId: string; organizationId: string; displayName: string; status: string };
export default function Organizations({ admin = false }: { admin?: boolean }) {
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Pick<Member, "organizationId" | "status">[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [managedIds, setManagedIds] = useState<string[]>([]);
  const [actionBusy, setActionBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const { convertToWebp } = await import("@/app/components/article/ArticleComposer");
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append("file", new File([blob], "organization.webp", { type: "image/webp" }));
      const response = await fetch("/api/uploads/image", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPhotoUrl(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Foto gagal diunggah");
    } finally { setUploading(false); }
  }

  async function createOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: form.get("name"), ownerId: form.get("ownerId") || undefined, photoUrl: photoUrl || undefined, description: form.get("description"), website: form.get("website") || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      formElement.reset();
      setPhotoUrl("");
      setMessage(admin ? "Organisasi berhasil dibuat dan langsung terverifikasi." : "Organisasi diajukan untuk diverifikasi.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Organisasi gagal dibuat"); }
    finally { setSaving(false); }
  }
  async function load() {
    const response = await fetch("/api/community", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Organisasi gagal dimuat.");
    setOrganizations(data.organizations || []);
    setMembers(data.members || []);
    setMemberships(data.memberships || []);
    setOwnedIds(data.ownedOrganizationIds || []);
    setManagedIds(data.managedOrganizationIds || []);
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message)).finally(() => setInitialLoading(false));
  }, []);

  async function action(data: Record<string, unknown>) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      setMessage(data.action === "join" ? "Status pengajuan bergabung diperbarui." : "Perubahan berhasil disimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Perubahan gagal disimpan.");
    } finally {
      setActionBusy(false);
    }
  }

  function membershipLabel(org: Org) {
    if (ownedIds.includes(org.id)) return org.verified ? "Pengelola" : "Menunggu verifikasi";
    const matches = memberships.filter((member) => member.organizationId === org.id);
    if (matches.some((member) => member.status === "approved")) return "Anggota";
    if (matches.some((member) => member.status === "pending")) return "Menunggu persetujuan";
    return "";
  }

  const visible = organizations.filter((org) => org.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, admin ? 100 : 3);
  const pendingRequests = members.filter((member) => member.status === "pending" && managedIds.includes(member.organizationId));
  if (initialLoading) return <Skeleton><OrganizationsContent /></Skeleton>;

  return <section className="min-w-0 border border-rule bg-paper">
    <header className="border-b border-rule px-5 py-4 sm:px-6">
      <h2 className="font-display text-xl">Organisasi</h2>
    </header>
    <div className="space-y-4 p-5 sm:p-6">
      <input type="search" aria-label="Cari organisasi" className="w-full p-3 text-sm" placeholder="Cari organisasi…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="divide-y divide-rule">
        {visible.map((org) => {
          const status = membershipLabel(org);
          return (
            <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center border border-rule bg-gray-50">
                  {org.photoUrl ? <img src={org.photoUrl} alt="" className="size-full object-contain" /> : <i className="bx bx-buildings text-xl text-mute" aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <p className="wrap-break-word font-medium">{org.name} {org.verified && <i className="bx bxs-badge-check align-middle text-ink" role="img" aria-label="Organisasi terverifikasi" />}</p>
                  {org.description && org.description !== org.name && <p className="mt-1 wrap-break-word text-sm text-mute">{org.description}</p>}
                  {org.website && /^https?:\/\//i.test(org.website) && <a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-blue-600 hover:underline">{org.website}</a>}
                </div>
              </div>
              {!admin && status ? (
                <span className="bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-ink">{status}</span>
              ) : (admin || org.verified) && (
                <button type="button" disabled={actionBusy} className="border border-rule px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => void action(admin ? { action: "reviewOrganization", id: org.id, approved: !org.verified } : { action: "join", id: org.id })}>
                  {admin ? org.verified ? "Cabut verifikasi" : "Verifikasi" : "Ajukan bergabung"}
                </button>
              )}
            </div>
          );
        })}
        {visible.length === 0 && <p className="py-4 text-sm text-mute">Tidak ada organisasi yang cocok.</p>}
      </div>
    </div>
    <details open={admin || undefined} className="border-t border-rule px-5 py-4 sm:px-6">
      <summary className="cursor-pointer text-sm font-semibold">{admin ? "Buat organisasi" : "Ajukan organisasi baru"}</summary>
      <form className="mt-4 grid gap-4" onSubmit={createOrganization}>
        <label className="grid gap-2 text-sm">Foto organisasi
          <input className="min-w-0 w-full p-2 file:mr-2 file:bg-gray-200 file:px-2 file:py-1" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading || saving} onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
        </label>
        {photoUrl && <img src={photoUrl} alt="Pratinjau foto organisasi" className="size-16 object-contain" />}
        <label className="grid gap-2 text-sm">Nama organisasi<input name="name" required minLength={2} maxLength={150} className="w-full p-3" /></label>
        <label className="grid gap-2 text-sm">Deskripsi singkat<textarea name="description" maxLength={500} rows={3} className="w-full p-3" /></label>
        <label className="grid gap-2 text-sm">Website organisasi<input name="website" type="url" placeholder="https://organisasi.id" className="w-full p-3" /></label>
      {admin && <div className="grid gap-2 text-sm"><span>Pemilik organisasi (opsional)</span><UserPicker name="ownerId" /><p className="text-xs text-mute">Jika tidak dipilih, akun Anda menjadi pemilik organisasi.</p></div>}
      <button disabled={uploading || saving} className="justify-self-start bg-blue-500 px-4 py-2 text-white disabled:opacity-50">{uploading ? "Mengunggah foto…" : saving ? "Menyimpan…" : admin ? "Buat organisasi" : "Ajukan organisasi"}</button>
      </form>
    </details>
    {pendingRequests.length > 0 && (
      <div className="border-t border-rule px-5 py-4 sm:px-6">
        <h3 className="mb-2 text-sm font-semibold">Pengajuan anggota</h3>
        <div className="divide-y divide-rule">
          {pendingRequests.map((member) => (
            <div key={`${member.userId}-${member.organizationId}`} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="mr-auto">{member.displayName} <span className="text-mute">· {organizations.find((org) => org.id === member.organizationId)?.name}</span></span>
              <button type="button" disabled={actionBusy} className="text-blue-600" onClick={() => void action({ action: "reviewMember", id: member.organizationId, userId: member.userId, approved: true })}>Setujui</button>
              <button type="button" disabled={actionBusy} className="text-red-700" onClick={() => void action({ action: "reviewMember", id: member.organizationId, userId: member.userId, approved: false })}>Tolak</button>
            </div>
          ))}
        </div>
      </div>
    )}
    {admin && <form className="grid max-w-2xl gap-4 border-t border-rule p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void action({ action: "badge", userId: form.get("userId"), approved: form.get("verified") === "on" }); }}><h3 className="font-semibold">Verifikasi akun</h3><UserPicker name="userId" required /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verified" />Berikan centang biru</label><button className="justify-self-start bg-blue-500 px-4 py-2 text-white">Simpan verifikasi akun</button></form>}
    <PopupStatus message={message} />
    {admin && <form className="grid max-w-2xl gap-4 border-t border-rule p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void action({ action: "reviewOrganization", id: form.get("id"), ownerId: form.get("ownerId"), approved: true }); }}><h3 className="font-semibold">Tetapkan admin organisasi</h3><label className="grid gap-2 text-sm">Organisasi<select name="id" required className="p-3"><option value="">Pilih organisasi</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label><div className="grid gap-2 text-sm"><span>Pemilik / admin baru</span><UserPicker name="ownerId" required /></div><button className="justify-self-start bg-blue-500 px-4 py-2 text-white">Tetapkan admin organisasi</button></form>}
  </section>;
}
