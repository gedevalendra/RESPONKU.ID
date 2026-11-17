"use client";

import { useState } from "react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export default function PushButton() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error("Browser ini belum mendukung web push.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Izin notifikasi belum diberikan.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const keyResponse = await fetch("/api/push/subscribe");
      const { publicKey } = await keyResponse.json();
      if (!publicKey) throw new Error("VAPID public key belum diisi di .env.local.");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Push gagal diaktifkan.");
      setMessage("Notifikasi perangkat aktif.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Push gagal diaktifkan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-rule pt-5">
      <button
        type="button"
        onClick={() => void enable()}
        disabled={busy}
        className="bg-blue-500 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {busy ? "Mengaktifkan..." : "Aktifkan web push"}
      </button>
      {message && <span className="font-mono text-xs text-mute">{message}</span>}
    </div>
  );
}
