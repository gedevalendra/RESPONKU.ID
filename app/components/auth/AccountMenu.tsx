"use client";

import Link from "next/link";
import LogoutButton from "./LogoutButton";
import type { Profile } from "@/lib/types";

export default function AccountMenu({ actor }: { actor: Profile }) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        className="flex max-w-40 items-center gap-2 font-mono text-xs uppercase tracking-widest2 text-mute transition-colors hover:text-blue-500 group-hover:text-blue-500"
      >
        <span className="max-w-32 truncate">{actor.displayName}</span>
        <i className="bx bx-chevron-down text-base" aria-hidden="true" />
      </button>
      <div className="invisible absolute right-0 top-full z-50 w-60 translate-y-2 bg-white p-2 opacity-0 shadow-xl ring-1 ring-gray-100 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <p className="border-b border-gray-100 px-3 pb-2 pt-2 font-mono text-[10px] normal-case tracking-normal text-gray-500">
          {actor.email}
        </p>
        <nav className="flex flex-col py-1 font-mono text-xs uppercase tracking-widest2">
          <Link
            href="/akun"
            className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <i className="bx bx-user text-base" aria-hidden="true" /> Profile Kamu
          </Link>
          <Link
            href="/akun#riwayat"
            className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <i className="bx bx-history text-base" aria-hidden="true" /> Riwayat Publish
          </Link>
          <Link
            href="/notifikasi"
            className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <i className="bx bx-bell text-base" aria-hidden="true" /> Notifikasi
          </Link>
          <Link
            href="/akun/artikel"
            className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <i className="bx bx-edit text-base" aria-hidden="true" /> Buat Artikel
          </Link>
          {actor.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              <i className="bx bx-grid-alt text-base" aria-hidden="true" /> Dashboard Admin
            </Link>
          )}
          {actor.role === "superadmin" && (
            <Link
              href="/superadmin"
              className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              <i className="bx bx-shield text-base" aria-hidden="true" /> Dashboard Superadmin
            </Link>
          )}
        </nav>
        <div className="border-t border-gray-100 px-3 py-2.5">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
