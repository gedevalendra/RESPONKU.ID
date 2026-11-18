"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

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
    <div className="mt-4 rounded-2xl border border-rule bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">Notifikasi browser</h2>
        <p className="mt-1 text-sm text-mute">Terima pemberitahuan di perangkat ini.</p>
      </div>
      <button
        type="button"
        onClick={() => void enable()}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        <i className="bx bx-bell text-base" aria-hidden="true" />
        {busy ? "Mengaktifkan…" : "Aktifkan"}
      </button>
      </div>
      {message && <PopupStatus message={message} />}
    </div>
  );
}
