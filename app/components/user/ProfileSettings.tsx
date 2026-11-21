"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { convertToWebp } from "@/app/components/article/ArticleComposer";

type ProfileForm = Profile & {
  username: string;
  organization: string;
  avatarUrl: string;
  backgroundUrl: string;
  emailConfirmed: boolean;
};

const profileCacheLifetime = 5 * 60 * 1000;
const DISMISS_DISTANCE = 120; // px
const DISMISS_VELOCITY = 0.6; // px/ms

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
      <span className="grid size-10 place-items-center rounded-full bg-gray-800/80 text-xl">
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
  const [closing, setClosing] = useState(false);
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
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, velocity: 0, dy: 0 });

  useEffect(() => {
    const cacheKey = `responku:profile:${initial.id}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null") as { expiresAt?: number; profile?: Partial<ProfileForm> } | null;
      if (cached?.profile && Number(cached.expiresAt) > Date.now()) {
        setProfile((current) => ({ ...current, ...cached.profile }));
        return;
      }
    } catch { /* Cache invalid akan diganti data baru. */ }
    fetch("/api/profile", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        setProfile((current) => ({ ...current, ...data.profile }));
        sessionStorage.setItem(cacheKey, JSON.stringify({ profile: data.profile, expiresAt: Date.now() + profileCacheLifetime }));
      } else setMessage(data.error || "Profil gagal dimuat.");
    });
  }, [initial.id]);

  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  /* ---------- Bottom sheet ---------- */
  const open = () => {
    const el = dialog.current;
    if (!el) return;
    el.style.setProperty("--drag", "0px");
    setClosing(false);
    el.showModal();
    document.body.style.overflow = "hidden";
  };
  const finish = () => {
    const el = dialog.current;
    if (el?.open) el.close();
    el?.style.setProperty("--drag", "0px");
    setClosing(false);
    document.body.style.overflow = "";
  };
  const close = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    setClosing(true);
  };
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const d = drag.current;
    d.active = true; d.startY = event.clientY; d.lastY = event.clientY; d.lastT = event.timeStamp; d.velocity = 0; d.dy = 0;
    dialog.current?.style.removeProperty("transition");
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const raw = event.clientY - d.startY;
    d.dy = raw > 0 ? raw : raw * 0.15;
    const dt = event.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (event.clientY - d.lastY) / dt;
    d.lastY = event.clientY; d.lastT = event.timeStamp;
    dialog.current?.style.setProperty("--drag", `${d.dy}px`);
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.dy > DISMISS_DISTANCE || d.velocity > DISMISS_VELOCITY) { close(); return; }
    const el = dialog.current;
    if (!el) return;
    el.style.transition = "transform .35s var(--sheet-ease)";
    el.style.setProperty("--drag", "0px");
    window.setTimeout(() => el.style.removeProperty("transition"), 360);
  };

  /* ---------- Logika profil (tidak diubah) ---------- */
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
    sessionStorage.setItem(`responku:profile:${initial.id}`, JSON.stringify({ profile: data.profile, expiresAt: Date.now() + profileCacheLifetime }));
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

  const isOAuth = profile.provider === "google" || profile.provider === "funikin";
  const providerName = profile.provider === "google" ? "Google" : "FunikIn";
  const field = "grid gap-1.5 text-sm";
  const label = "text-xs font-medium text-gray-700";

  return (
    <>
      <section className="w-full overflow-hidden rounded-b-xl bg-white shadow-sm">
        <div className="h-28 bg-blue-50 bg-cover bg-center sm:h-36" style={profile.backgroundUrl ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined} />
        <div className="px-6 pb-6 sm:px-8">
          {/* Avatar naik menimpa banner; tombol Edit profil sepenuhnya di bawah banner */}
          <div className="flex items-start justify-between gap-4">
            <div className="-mt-10 grid size-20 shrink-0 place-items-center overflow-hidden shadow-lg rounded-full bg-blue-50 text-blue-500 ring-4 ring-white">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} className=" size-full object-cover" /> : <i className="bx bxs-user text-3xl" aria-hidden="true" />}
            </div>
            <button type="button" onClick={open} aria-haspopup="dialog" className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-rule bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-gray-50 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <i className="bx bx-edit-alt" aria-hidden="true" />Edit profil
            </button>
          </div>
          <div className="mt-2 min-w-0">
            <h2 className="break-words text-xl font-semibold leading-tight text-ink">{profile.displayName} {profile.verified && <i className="bx bxs-badge-check align-middle text-blue-500" role="img" aria-label="Terverifikasi" />}</h2>
            <p className="mt-1 truncate text-sm text-mute">{profile.username ? `@${profile.username}` : profile.email}</p>
          </div>
          {profile.organization && <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-sm text-mute ring-1 ring-inset ring-gray-200"><i className="bx bx-buildings" aria-hidden="true" />{profile.organization}<i className="bx bxs-badge-check text-gray-800" role="img" aria-label="Organisasi terverifikasi" /></span>}
          {profile.bio && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-mute">{profile.bio}</p>}
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
          {[
            ["Artikel terbit", articleStats.published],
            ["Menunggu review", articleStats.pending],
            ["Ditolak", articleStats.rejected],
            ["Total views", articleStats.views],
          ].map(([name, value]) => (
            <div key={name} className="bg-white px-5 py-4 sm:px-6">
              <p className="text-lg font-semibold tabular-nums text-ink">{value}</p>
              <p className="mt-0.5 text-xs text-mute">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <dialog
        ref={dialog}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={() => { document.body.style.overflow = ""; }}
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
        onAnimationEnd={(event) => { if (event.target === event.currentTarget && closing) finish(); }}
        aria-labelledby="profile-edit-title"
        className={`${closing ? "activity-sheet-closing" : "activity-sheet"} fixed inset-x-0 bottom-0 top-auto m-0 mx-auto h-[90dvh] max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border-0 bg-paper p-0 text-inherit shadow-[0_-12px_48px_rgba(0,0,0,.18)] backdrop:bg-black/45 backdrop:backdrop-blur-[2px]`}
      >
        <div className="flex h-full flex-col">
          <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="shrink-0 cursor-grab touch-none select-none border-b border-rule active:cursor-grabbing">
            <div className="flex justify-center pb-1 pt-3" aria-hidden="true"><span className="h-1.5 w-10 rounded-full bg-gray-300" /></div>
            <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-2 sm:px-8">
              <div className="flex items-center gap-3">
                <div>
                  <h2 id="profile-edit-title" className="font-display text-xl leading-6">Edit profil</h2>
                  <p className="text-xs text-mute">Perubahan disimpan setelah Anda konfirmasi.</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Tutup" className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-gray-100 active:scale-90"><i className="bx bx-x text-2xl" aria-hidden="true" /></button>
            </header>
          </div>

          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5 sm:px-8">
              <div className="grid gap-5">
                {/* Foto: background + avatar */}
                <div className="sheet-item" style={{ "--i": 0 } as React.CSSProperties}>
                  <div className="relative h-28 overflow-hidden rounded-2xl bg-blue-50 bg-cover bg-center" style={profile.backgroundUrl ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined}>
                    <ImageUpload kind="background" busy={uploading} onUpload={uploadImage} />
                  </div>
                  <div className="relative -mt-9 ml-4 grid size-[72px] place-items-center overflow-hidden rounded-full bg-blue-50 text-blue-500 shadow-sm ring-4 ring-paper">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} className="size-full object-cover" /> : <i className="bx bxs-user text-2xl" aria-hidden="true" />}
                    <ImageUpload kind="avatar" busy={uploading} onUpload={uploadImage} />
                  </div>
                </div>

                <label className={`${field} sheet-item`} style={{ "--i": 1 } as React.CSSProperties}>
                  <span className={label}>Bio</span>
                  <textarea value={profile.bio || ""} onChange={(event) => update("bio", event.target.value)} maxLength={300} rows={3} placeholder="Ceritakan sedikit tentang diri kamu…" className="px-3 py-3" />
                  <span className="text-right text-xs tabular-nums text-mute">{(profile.bio || "").length}/300</span>
                </label>

                <div className="sheet-item grid gap-4 sm:grid-cols-2" style={{ "--i": 2 } as React.CSSProperties}>
                  <label className={field}>
                    <span className={label}>Nama lengkap</span>
                    <input required value={profile.displayName} onChange={(event) => update("displayName", event.target.value)} className="px-3 py-3" />
                  </label>
                  <label className={field}>
                    <span className={label}>Username</span>
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

                <label className={`${field} sheet-item`} style={{ "--i": 3 } as React.CSSProperties}>
                  <span className={label}>Organisasi <span className="font-normal text-gray-400">(opsional)</span></span>
                  <input value={profile.organization} readOnly placeholder="Ajukan organisasi melalui Pengaturan akun" className="px-3 py-3" />
                </label>

                <label className={`${field} sheet-item`} style={{ "--i": 4 } as React.CSSProperties}>
                  <span className={label}>Email</span>
                  <input
                    type="email"
                    required
                    disabled={!(!profile.provider || profile.provider === "supabase")}
                    value={profile.email}
                    onChange={(event) => update("email", event.target.value)}
                    className="px-3 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {!isOAuth && (
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-mute">
                      <i className={`bx ${profile.emailConfirmed ? "bx-check-circle text-green-600" : "bx-info-circle text-amber-600"}`} aria-hidden="true" />
                      {profile.emailConfirmed ? "Email sudah terkonfirmasi." : "Email belum terkonfirmasi."}
                      {!profile.emailConfirmed && (
                        <button type="button" onClick={() => void resendConfirmation()} className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700">Kirim ulang</button>
                      )}
                    </span>
                  )}
                  {isOAuth && <span className="text-xs text-mute">Email dikelola oleh {providerName}.</span>}
                </label>

                {(profile.provider === "supabase" || !profile.provider) && (
                  <div className="sheet-item grid gap-4 sm:grid-cols-2" style={{ "--i": 5 } as React.CSSProperties}>
                    <label className={field}>
                      <span className={label}>Sandi baru</span>
                      <input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" className="px-3 py-3" />
                    </label>
                    <label className={field}>
                      <span className={label}>Konfirmasi sandi</span>
                      <input type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi sandi baru" className="px-3 py-3" />
                    </label>
                  </div>
                )}

                {isOAuth && (
                  <p className="flex gap-2 rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-gray-600">
                    <i className="bx bx-info-circle mt-0.5 text-base text-blue-600" aria-hidden="true" />
                    <span>Akun OAuth aktif. Untuk mengganti email atau sandi, gunakan pengaturan akun {providerName}.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Footer tetap terlihat saat form di-scroll */}
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-rule bg-paper px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
              <button disabled={busy || uploading} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50">
                {busy ? "Menyimpan..." : "Simpan profil"}
              </button>
              <button type="button" onClick={close} className="rounded-full px-4 py-2.5 text-sm font-medium text-mute transition hover:bg-gray-100">Batal</button>
              {message && <PopupStatus message={message} />}
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}