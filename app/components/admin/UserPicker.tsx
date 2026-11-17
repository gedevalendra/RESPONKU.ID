"use client";

import { useEffect, useId, useState } from "react";

type User = { id: string; displayName: string; email: string; username?: string };

export default function UserPicker({ name, required = false }: { name: string; required?: boolean }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || selected) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/notification-recipients?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setUsers(data.users || []);
      } catch {
        if (!controller.signal.aborted) setError("Pengguna gagal dimuat.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query, open, selected]);

  return (
    <div className="relative min-w-0">
      <input type="hidden" name={name} value={selected?.id || ""} />
      <div className="flex gap-2">
        <input
          aria-label="Cari dan pilih pengguna"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          required={required}
          value={selected ? `${selected.displayName} · ${selected.email}` : query}
          onFocus={() => setOpen(true)}
          onBlur={(event) => { if (!event.currentTarget.parentElement?.parentElement?.contains(event.relatedTarget)) setOpen(false); }}
          onChange={(event) => { setSelected(null); setQuery(event.target.value); setUsers([]); setOpen(true); event.target.setCustomValidity(required ? "Pilih pengguna dari hasil pencarian." : ""); }}
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
          placeholder="Cari nama, email, atau username…"
          className="w-full min-w-0 p-3"
        />
        {selected && <button type="button" onClick={() => { setSelected(null); setQuery(""); setOpen(true); }} className="px-2 text-sm text-mute">Ganti</button>}
      </div>
      {open && !selected && (
        <div id={`${id}-results`} className="absolute inset-x-0 top-full z-20 max-h-64 overflow-y-auto bg-white py-1 shadow-lg">
          {loading ? <p className="p-3 text-sm text-mute">Mencari…</p> : error ? <p role="alert" className="p-3 text-sm text-mute">{error}</p> : users.length ? users.map((user) => (
            <button type="button" key={user.id} onMouseDown={(event) => event.preventDefault()} onClick={(event) => {
              setSelected(user); setOpen(false);
              event.currentTarget.closest("div.relative")?.querySelector<HTMLInputElement>('input[aria-label]')?.setCustomValidity("");
            }} className="block w-full px-4 py-3 text-left hover:bg-gray-800/5 focus:bg-gray-800/5">
              <span className="block text-sm font-medium">{user.displayName}</span>
              <span className="block break-all text-xs text-mute">{user.email}{user.username ? ` · @${user.username}` : ""}</span>
            </button>
          )) : <p className="p-3 text-sm text-mute">Tidak ada pengguna ditemukan.</p>}
        </div>
      )}
    </div>
  );
}
