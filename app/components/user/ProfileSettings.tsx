"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { convertToWebp } from "@/app/components/article/ArticleComposer";

type ProfileForm = Profile & {
  username: string;
  organization: string;
  avatarUrl: string;
  backgroundUrl: string;
  emailConfirmed: boolean;
};

function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_.-]/g, "");
}

function ImageUpload({ kind, busy, onUpload }: {
  kind: "avatar" | "background";
  busy: boolean;
  onUpload: (file: File | undefined, kind: "avatar" | "background") => Promise<void>;
}) {
  return (
    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/25 text-white transition-colors hover:bg-black/40 focus-within:ring-2 focus-within:ring-inset focus-within:ring-white">
      <span className="grid size-11 place-items-center rounded-full bg-gray-800/80 text-2xl">
        <i className={`bx ${busy ? "bx-loader-alt motion-safe:animate-spin" : "bx-camera"}`} aria-hidden="true" />
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={kind === "avatar" ? "Ganti foto profil" : "Ganti background profil"}
        disabled={busy}
        className="sr-only"
        onChange={(event) => {
          void onUpload(event.target.files?.[0], kind);
          event.target.value = "";
        }}
      />
    </label>
  );
}

export default function ProfileSettings({
  initial,
  articleStats,
}: {
  initial: Profile;
  articleStats: { published: number; pending: number; rejected: number; views: number };
}) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>({
    ...initial,
    username: "",
    organization: "",
    avatarUrl: "",
    backgroundUrl: "",
    emailConfirmed: false,
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (response.ok)
        setProfile((current) => ({ ...current, ...data.profile }));
      else setMessage(data.error || "Profil gagal dimuat.");
    });
  }, []);
  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }
  async function uploadImage(file: File | undefined, kind: "avatar" | "background") {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append(
        "file",
        new File([blob], `${kind}.webp`, { type: "image/webp" }),
      );
      form.append("kind", kind);
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Foto profil gagal diupload");
      update(kind === "avatar" ? "avatarUrl" : "backgroundUrl", data.url);
      setMessage(kind === "avatar" ? "Foto profil siap disimpan." : "Background profil siap disimpan.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gambar gagal diupload.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!(await confirmAction("Simpan perubahan?", "Simpan"))) return;
    setMessage("");
    if (password && password !== confirmPassword) {
      setMessage("Konfirmasi sandi tidak sama.");
      return;
    }
    setBusy(true);
    const profilePayload = {
      displayName: profile.displayName,
      username: profile.username,
      organization: profile.organization,
      avatarUrl: profile.avatarUrl || undefined,
      backgroundUrl: profile.backgroundUrl || undefined,
      bio: profile.bio || "",
      ...(profile.provider === "supabase" || !profile.provider
        ? {
            email: profile.email,
            password: password || undefined,
          }
        : {}),
    };
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profilePayload),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error || "Profil gagal disimpan.");
      return;
    }
    setProfile((current) => ({ ...current, ...data.profile }));
    setPassword("");
    setConfirmPassword("");
    setMessage("Profil berhasil diperbarui.");
  }
  async function resendConfirmation() {
    setMessage("");
    const response = await fetch("/api/profile", { method: "POST" });
    const data = await response.json();
    setMessage(
      response.ok ? data.message : data.error || "Email gagal dikirim.",
    );
  }
  return (
    <section className="w-full overflow-hidden rounded-b-xl bg-white shadow-sm">
      <div className="relative h-28 bg-blue-50 bg-cover bg-center sm:h-36" style={profile.backgroundUrl ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined}>
        {editing && <ImageUpload kind="background" busy={uploading} onUpload={uploadImage} />}
      </div>
      <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xl text-blue-500 shadow-sm">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" /> : <i className="bx bxs-user text-3xl" aria-hidden="true" />}
              {editing && <ImageUpload kind="avatar" busy={uploading} onUpload={uploadImage} />}
            </div>
            <div className="min-w-0 pb-1 pt-10">
              <h2 className="break-words text-xl font-semibold leading-tight text-ink">{profile.displayName} {profile.verified && <i className="bx bxs-badge-check align-middle text-blue-500" role="img" aria-label="Terverifikasi" />}</h2>
              <p className="mt-1 truncate text-sm text-mute">{profile.username ? `@${profile.username}` : profile.email}</p>
            </div>
          </div>
        </div>
        {profile.organization && <span className="mt-4 inline-flex items-center gap-2 px-2 py-1 text-sm text-mute outline outline-1 outline-gray-200"><i className="bx bx-buildings" aria-hidden="true" />{profile.organization}<i className="bx bxs-badge-check text-gray-800" role="img" aria-label="Organisasi terverifikasi" /></span>}
        {profile.bio && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-mute">{profile.bio}</p>}
      </div>
      <div className="grid grid-cols-2 border-t border-rule sm:grid-cols-4">
        {[
          ["Artikel terbit", articleStats.published],
          ["Menunggu review", articleStats.pending],
          ["Ditolak", articleStats.rejected],
          ["Total views", articleStats.views],
        ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-2 px-5 py-3 sm:px-6"><p className="text-xs text-mute">{label}</p><p className="text-base font-semibold tabular-nums text-ink">{value}</p></div>)}
      </div>
      <div className="border-t border-rule px-6 py-3 text-center sm:px-8">
        <button type="button" onClick={() => setEditing((value) => !value)} aria-expanded={editing} className="w-full py-2 text-sm font-medium text-ink transition-colors hover:bg-gray-800/5">{editing ? "Tutup edit" : "Edit profil"}</button>
      </div>
      {editing && <form onSubmit={save} className="grid gap-5 p-6 sm:p-8">
        <label className="grid gap-2 text-sm">
          <span className="eyebrow">Bio</span>
          <textarea value={profile.bio || ""} onChange={(event) => update("bio", event.target.value)} maxLength={300} rows={3} placeholder="Ceritakan sedikit tentang diri kamu…" className="px-3 py-3" />
          <span className="text-xs text-mute">{(profile.bio || "").length}/300 karakter</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="eyebrow">Nama lengkap</span>
            <input
              required
              value={profile.displayName}
              onChange={(event) => update("displayName", event.target.value)}
              className="px-3 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="eyebrow">Username</span>
            <input
              required
              minLength={3}
              maxLength={50}
              pattern="[a-z0-9_.-]+"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={profile.username}
              onChange={(event) => update("username", normalizeUsername(event.target.value))}
              placeholder="nama_pengguna"
              className="px-3 py-3"
            />
            <span className="text-xs text-mute">Huruf kecil tanpa spasi.</span>
          </label>
        </div>
        <label className="grid gap-2 text-sm">
          <span className="eyebrow">
            Organisasi{" "}
            <span className="normal-case tracking-normal text-gray-400">
              (opsional)
            </span>
          </span>
          <input
            value={profile.organization}
            readOnly
            placeholder="Ajukan organisasi melalui Pengaturan akun"
            className="px-3 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="eyebrow">Email</span>
          <input
            type="email"
            required
            disabled={
              !profile.provider || profile.provider === "supabase"
                ? false
                : true
            }
            value={profile.email}
            onChange={(event) => update("email", event.target.value)}
            className="px-3 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {profile.provider !== "google" && profile.provider !== "funikin" && (
            <span className="font-mono text-xs text-mute">
              {profile.emailConfirmed
                ? "Email sudah terkonfirmasi."
                : "Email belum terkonfirmasi."}{" "}
              {!profile.emailConfirmed && (
                <button
                  type="button"
                  onClick={() => void resendConfirmation()}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Kirim ulang
                </button>
              )}
            </span>
          )}
          {(profile.provider === "google" ||
            profile.provider === "funikin") && (
            <span className="font-mono text-xs text-mute">
              Email dikelola oleh{" "}
              {profile.provider === "google" ? "Google" : "FunikIn"}.
            </span>
          )}
        </label>
        {(profile.provider === "supabase" || !profile.provider) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="eyebrow">Sandi baru</span>
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                className="px-3 py-3"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="eyebrow">Konfirmasi sandi</span>
              <input
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi sandi baru"
                className="px-3 py-3"
              />
            </label>
          </div>
        )}
        {profile.provider === "google" || profile.provider === "funikin" ? (
          <p className="bg-blue-50 p-4 font-mono text-xs text-gray-600">
            Akun OAuth aktif. Untuk mengganti email atau sandi, gunakan
            pengaturan akun{" "}
            {profile.provider === "google" ? "Google" : "FunikIn"}.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-4">
          <button
            disabled={busy || uploading}
            className="bg-blue-500 px-5 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {busy ? "Menyimpan..." : "Simpan profil"}
          </button>
          {message && (
            <PopupStatus message={message} />
          )}
        </div>
      </form>}
    </section>
  );
}
