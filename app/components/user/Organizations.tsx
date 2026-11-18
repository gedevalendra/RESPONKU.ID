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
    const response = await fetch(`/api/community?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Organisasi gagal dimuat.");
    setOrganizations(data.organizations || []); setMembers(data.members || []);
  }
  useEffect(() => { void load().catch((error) => setMessage(error.message)).finally(() => setInitialLoading(false)); }, [query]);
  async function action(data: Record<string, unknown>) {
    const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    setMessage(response.ok ? "Perubahan berhasil disimpan." : result.error);
    await load();
  }
  if (initialLoading) return <Skeleton><OrganizationsContent /></Skeleton>;

  return <section className="space-y-5 bg-white p-6">
    <h2 className="text-xl font-semibold">Organisasi</h2>
    <p className="text-sm text-mute">Keanggotaan ditampilkan setelah disetujui oleh pengelola organisasi.</p>
    <input className="w-full p-3" placeholder="Cari organisasi…" value={query} onChange={(event) => setQuery(event.target.value)} />
    <div className="divide-y divide-rule">
      {organizations.slice(0, admin ? 100 : 3).map((org) => (
        <div key={org.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {org.photoUrl && <img src={org.photoUrl} alt={org.name} className="h-14 w-14 shrink-0 object-cover" />}
            <div className="min-w-0">
              <p className="font-medium">{org.name} {org.verified ? <i className="bx bxs-badge-check align-middle text-gray-800" role="img" aria-label="Organisasi terverifikasi" /> : "· Menunggu verifikasi"}</p>
              {org.description && <p className="mt-1 text-sm text-mute">{org.description}</p>}
              {org.website && /^https?:\/\//i.test(org.website) && <a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-sm text-blue-500">{org.website}</a>}
            </div>
          </div>
          <button className="text-sm text-blue-500" onClick={() => void action(admin ? { action: "reviewOrganization", id: org.id, approved: !org.verified } : { action: "join", id: org.id })}>
            {admin ? org.verified ? "Cabut verifikasi" : "Verifikasi" : "Ajukan bergabung"}
          </button>
        </div>
      ))}
    </div>
    <form className="grid max-w-2xl gap-4 border-t border-rule pt-5" onSubmit={createOrganization}>
      <h3 className="font-semibold">{admin ? "Buat organisasi" : "Ajukan organisasi"}</h3>
      <label className="grid gap-2 text-sm">Foto organisasi
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading || saving} onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
      </label>
      {photoUrl && <img src={photoUrl} alt="Preview foto organisasi" className="h-20 w-20 object-cover" />}
      <label className="grid gap-2 text-sm">Nama organisasi<input name="name" required minLength={2} maxLength={150} className="p-3" /></label>
      <label className="grid gap-2 text-sm">Deskripsi singkat<textarea name="description" maxLength={500} rows={3} className="p-3" /></label>
      <label className="grid gap-2 text-sm">Website organisasi<input name="website" type="url" placeholder="https://organisasi.id" className="p-3" /></label>
      {admin && <div className="grid gap-2 text-sm"><span>Pemilik organisasi (opsional)</span><UserPicker name="ownerId" /><p className="text-xs text-mute">Jika tidak dipilih, akun Anda menjadi pemilik organisasi.</p></div>}
      <button disabled={uploading || saving} className="justify-self-start bg-blue-500 px-4 py-2 text-white disabled:opacity-50">{uploading ? "Mengunggah foto…" : saving ? "Menyimpan…" : admin ? "Buat organisasi" : "Ajukan organisasi"}</button>
    </form>
    <div className="space-y-3">{members.map((member) => <div key={`${member.userId}-${member.organizationId}`} className="flex flex-wrap gap-3 text-sm"><span>{member.displayName} · {member.status}</span>{member.status === "pending" && <><button className="text-blue-500" onClick={() => void action({ action: "reviewMember", id: member.organizationId, userId: member.userId, approved: true })}>Setujui anggota</button><button onClick={() => void action({ action: "reviewMember", id: member.organizationId, userId: member.userId, approved: false })}>Tolak</button></>}</div>)}</div>
    {admin && <form className="grid max-w-2xl gap-4 border-t pt-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void action({ action: "badge", userId: form.get("userId"), approved: form.get("verified") === "on" }); }}><h3 className="font-semibold">Verifikasi akun</h3><UserPicker name="userId" required /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verified" />Berikan centang biru</label><button className="justify-self-start bg-blue-500 px-4 py-2 text-white">Simpan verifikasi akun</button></form>}
    <PopupStatus message={message} />
    {admin && <form className="grid max-w-2xl gap-4 border-t pt-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void action({ action: "reviewOrganization", id: form.get("id"), ownerId: form.get("ownerId"), approved: true }); }}><h3 className="font-semibold">Tetapkan admin organisasi</h3><label className="grid gap-2 text-sm">Organisasi<select name="id" required className="p-3"><option value="">Pilih organisasi</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label><div className="grid gap-2 text-sm"><span>Pemilik / admin baru</span><UserPicker name="ownerId" required /></div><button className="justify-self-start bg-blue-500 px-4 py-2 text-white">Tetapkan admin organisasi</button></form>}
  </section>;
}
