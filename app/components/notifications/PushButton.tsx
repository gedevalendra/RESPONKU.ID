"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

import { useCallback, useEffect, useRef, useState } from "react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export default function PushButton() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const autoRequested = useRef(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        if ("Notification" in window) setPermission(Notification.permission);
        if (!("serviceWorker" in navigator) || !("Notification" in window) ||
          Notification.permission !== "granted") {
          setActive(false);
          return;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setActive(Boolean(subscription));
      } catch {
        setActive(false);
      }
    }
    void checkSubscription();
  }, []);

  const enable = useCallback(async (automatic = false) => {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
        throw new Error("Browser ini belum mendukung web push.");
      const nextPermission = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        if (automatic) return;
        throw new Error("Izin notifikasi belum diberikan.");
      }
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
      if (!response.ok) {
        await subscription.unsubscribe().catch(() => false);
        throw new Error((await response.json()).error || "Push gagal diaktifkan.");
      }
      setMessage("Notifikasi perangkat aktif.");
      setActive(true);
    } catch (error) {
      if (!automatic || Notification.permission === "granted") {
        setMessage(error instanceof Error ? error.message : "Push gagal diaktifkan.");
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (active !== false || autoRequested.current || !window.isSecureContext ||
      !("PushManager" in window) || !("Notification" in window) ||
      Notification.permission !== "default") return;
    autoRequested.current = true;
    void enable(true);
  }, [active, enable]);

  if (active === null) return null;
  if (active) return <PopupStatus message={message} />;

  return (
    <section className="border-b border-rule py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-display text-lg">Notifikasi browser</h2>
        <p className="mt-1 text-sm text-mute">
          {permission === "denied"
            ? "Izin diblokir. Ubah izin Notifikasi di pengaturan situs browser, lalu muat ulang halaman."
            : "Terima pemberitahuan di perangkat ini."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void enable()}
        disabled={busy || permission === "denied"}
        className="inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        <i className="bx bx-bell text-base" aria-hidden="true" />
        {busy ? "Mengaktifkan…" : "Aktifkan"}
      </button>
      </div>
      {message && <PopupStatus message={message} />}
    </section>
  );
}
