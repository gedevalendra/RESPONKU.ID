"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";

type GoogleAccount = { id: string; displayName: string; email: string; avatarUrl: string };

export default function MobileProfileMenu({ actor }: { actor: Profile }) {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => { if (actor.provider === "google") void fetch("/api/auth/google-accounts", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => setAccounts(data?.accounts || [])); }, [actor.provider]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [open]);
  const switchAccount = async (id: string) => { await fetch("/api/auth/google-accounts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); window.location.assign("/"); };
  const removeAccount = async (id: string) => { await fetch("/api/auth/google-accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); setAccounts((items) => items.filter((item) => item.id !== id)); };
  const otherAccount = accounts.find((account) => account.id !== actor.id);
  const switchableAccounts = accounts.filter((account) => account.id !== actor.id);
  return <div ref={menu} className="relative lg:hidden">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-rule bg-gray-50 text-ink"><span className="sr-only">Menu profil</span>{actor.avatarUrl ? <img src={actor.avatarUrl} alt="" className="size-full object-cover" /> : <i className="bx bx-user text-xl" aria-hidden="true" />}</button>
    {otherAccount && <button type="button" onClick={() => void switchAccount(otherAccount.id)} aria-label={`Ganti ke akun ${otherAccount.displayName}`} className="group absolute -bottom-1 -right-1 z-10 grid size-5 place-items-center overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-sm"><span className="absolute inset-0 transition-all duration-200 group-hover:scale-75 group-hover:opacity-0">{otherAccount.avatarUrl ? <img src={otherAccount.avatarUrl} alt="" className="size-full object-cover" /> : <i className="bx bx-user text-[10px]" />}</span><i className="bx bx-transfer-alt scale-50 text-[11px] opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" aria-hidden="true" /></button>}
    {open && <div role="menu" className="absolute right-0 top-full z-100 mt-2 w-72 overflow-hidden rounded-xl border border-rule bg-white p-2 shadow-xl">
      <Link href="/akun" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50"><span className="grid size-9 place-items-center overflow-hidden rounded-full bg-blue-50">{actor.avatarUrl ? <img src={actor.avatarUrl} alt="" className="size-full object-cover" /> : <i className="bx bx-user" />}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{actor.displayName}</span><span className="block truncate text-xs text-mute">{actor.email}</span></span></Link>
      {actor.provider === "google" && <div className="border-t border-rule px-1 py-2">{switchableAccounts.map((account) => <div key={account.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50"><button type="button" onClick={() => void switchAccount(account.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50">{account.avatarUrl ? <img src={account.avatarUrl} alt="" className="size-full object-cover" /> : <i className="bx bx-user" />}</span><span className="truncate text-xs">{account.displayName}</span></button><button type="button" onClick={() => void removeAccount(account.id)} aria-label={`Hapus ${account.displayName}`} className="grid size-7 place-items-center text-mute hover:text-red-600"><i className="bx bx-x text-lg" /></button></div>)}{accounts.length < 2 && <a href="/auth/google?add=1" className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-gray-800 hover:bg-gray-100"><i className="bx bx-plus-circle text-base" />Tambahkan akun Google</a>}</div>}
      <a href="/auth/logout" className="flex items-center gap-2 border-t border-rule px-3 py-3 text-sm text-red-700 hover:bg-red-50"><i className="bx bx-log-out text-lg" />Keluar</a>
    </div>}
  </div>;
}
