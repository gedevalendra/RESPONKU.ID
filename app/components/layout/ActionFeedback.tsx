"use client";

import { useEffect, useRef, useState } from "react";

export function PopupStatus({ message }: { message: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;
    const timer = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  return visible && message ? (
    <div role="status" className="action-popup fixed inset-x-4 top-4 z-[200] mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-rule bg-white p-4 text-sm text-ink shadow-xl">
      <i className="bx bx-info-circle text-xl" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button type="button" aria-label="Tutup notifikasi" onClick={() => setVisible(false)}>
        <i className="bx bx-x text-xl" aria-hidden="true" />
      </button>
    </div>
  ) : null;
}

type Confirmation = {
  title: string;
  action: string;
  resolve: (confirmed: boolean) => void;
};

export function confirmAction(title: string, action: string) {
  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(new CustomEvent<Confirmation>("responku:confirm", {
      detail: { title, action, resolve },
    }));
  });
}

export default function ActionConfirmation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<Confirmation | null>(null);
  const [request, setRequest] = useState<Confirmation | null>(null);

  useEffect(() => {
    function open(event: Event) {
      const next = (event as CustomEvent<Confirmation>).detail;
      if (!dialog.current || pending.current) {
        next.resolve(false);
        return;
      }
      pending.current = next;
      setRequest(next);
      dialog.current.returnValue = "";
      dialog.current.showModal();
    }
    window.addEventListener("responku:confirm", open);
    return () => window.removeEventListener("responku:confirm", open);
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="action-confirmation-title"
      onClose={() => {
        pending.current?.resolve(dialog.current?.returnValue === "confirm");
        pending.current = null;
        setRequest(null);
      }}
      className="action-popup fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40">
      <h2 id="action-confirmation-title" className="text-lg font-semibold">{request?.title}</h2>
      <form method="dialog" className="mt-5 flex justify-end gap-2">
        <button autoFocus value="cancel" className="min-h-11 rounded-lg border border-rule px-4 text-sm">Batal</button>
        <button value="confirm" className="min-h-11 rounded-lg bg-ink px-4 text-sm text-paper">{request?.action}</button>
      </form>
    </dialog>
  );
}
