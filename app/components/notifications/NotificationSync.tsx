"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NotificationSync({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const lastCount = useRef(unreadCount);

  useEffect(() => {
    lastCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    let pending: AbortController | null = null;
    async function sync() {
      if (document.hidden || pending) return;
      const controller = new AbortController();
      pending = controller;
      try {
        const response = await fetch("/api/notifications?summary=1", { cache: "no-store", signal: controller.signal });
        if (!response.ok || controller.signal.aborted) return;
        const data = await response.json();
        if (!controller.signal.aborted && typeof data.unreadCount === "number" && data.unreadCount !== lastCount.current) {
          lastCount.current = data.unreadCount;
          router.refresh();
        }
      } catch {
        // Try again on the next interval when the connection returns.
      } finally {
        pending = null;
      }
    }
    const timer = window.setInterval(() => void sync(), 4000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      pending?.abort();
    };
  }, [router]);

  return null;
}
