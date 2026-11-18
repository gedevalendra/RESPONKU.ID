"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

export default function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function markRead() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Notifikasi belum bisa ditandai sudah dibaca.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" disabled={busy} onClick={() => void markRead()}
        className="mt-3 text-sm text-mute underline underline-offset-4 disabled:opacity-50">
        Tandai dibaca
      </button>
      <PopupStatus message={error} />
    </>
  );
}
