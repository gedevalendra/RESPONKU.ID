"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LogoutButton({ label = "Keluar" }: { label?: string }) {
  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/auth/logout";
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="inline-flex w-full items-center gap-2.5 bg-red-600/10 px-3 py-2.5 text-left font-mono text-xs uppercase tracking-widest2 text-red-700 transition-colors hover:bg-red-600/20"
    >
      <i className="bx bx-log-out text-base" aria-hidden="true" />
      {label}
    </button>
  );
}
