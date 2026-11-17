"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/types";

type User = { id: string; email: string; display_name: string; role: UserRole; source?: "supabase" | "oauth" };

export default function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([]); const [message, setMessage] = useState("");
  async function load() { const r = await fetch("/api/admin/users"); const d = await r.json(); if (r.ok) setUsers(d.users); else setMessage(d.error); }
  useEffect(() => { void load(); }, []);
  async function changeRole(id: string, role: UserRole, source: "supabase" | "oauth" = "supabase") { const r = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, source }) }); if (r.ok) await load(); else setMessage((await r.json()).error); }
  return <section className="mt-14"><div className="flex items-baseline justify-between border-b border-ink pb-3"><h2 className="font-display text-display-md">Manajemen akses</h2><span className="eyebrow">superadmin</span></div>{message && <p className="mt-3 font-mono text-xs text-signal">{message}</p>}<div className="divide-y divide-rule">{users.map((user) => <div key={`${user.source}-${user.id}`} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-display text-lg">{user.display_name}</p><p className="font-mono text-[11px] text-mute">{user.email} · {user.source || "supabase"}</p></div><select value={user.role} onChange={(e) => void changeRole(user.id, e.target.value as UserRole, user.source || "supabase")} className="border border-ink bg-paper px-3 py-2 font-mono text-xs"><option value="reader">reader</option><option value="author">author</option><option value="admin">admin</option><option value="superadmin">superadmin</option></select></div>)}</div></section>;
}
