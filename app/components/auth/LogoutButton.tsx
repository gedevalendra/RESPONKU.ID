"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LogoutButton() {
  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/auth/logout";
  }

  return <button type="button" onClick={() => void logout()} className="font-mono text-xs uppercase tracking-widest2 text-gray-500 transition-colors hover:text-blue-500">Keluar</button>;
}
