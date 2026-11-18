"use client";

import { useEffect, useState } from "react";
import { cookiePreferenceChange, cookiePreferenceName, getCookiePreference, openCookiePreferences } from "@/lib/cookie-preferences";

export function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(openCookiePreferences))}
      className="mt-4 text-left text-sm text-mute underline-offset-4 hover:text-ink hover:underline">
      Pengaturan cookie
    </button>
  );
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!getCookiePreference());
    const show = () => setOpen(true);
    window.addEventListener(openCookiePreferences, show);
    return () => window.removeEventListener(openCookiePreferences, show);
  }, []);

  function choose(preference: "accept" | "reject") {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${cookiePreferenceName}=${preference}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
    setOpen(false);
    window.dispatchEvent(new Event(cookiePreferenceChange));
  }

  if (!open) return null;

  return (
    <aside aria-labelledby="cookie-title"
      className="cookie-consent fixed inset-x-0 bottom-0 z-[105] border-t border-rule bg-paper shadow-[0_-12px_40px_-20px_rgba(15,23,42,0.36)]">
      <div className="wrap flex flex-col gap-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="grid size-11 shrink-0 place-items-center bg-gray-100 text-ink">
            <i className="bx bx-cookie text-2xl" aria-hidden="true" />
          </span>
          <div>
            <h2 id="cookie-title" className="font-display text-xl text-ink">Pilihan cookie kamu</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-mute">
              Penyimpanan browser membantu login dan mengingat reaksimu. Jika kamu setuju, kami juga menghitung kunjungan untuk statistik artikel.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
          <button type="button" onClick={() => choose("reject")} className="min-h-11 border border-gray-800 px-4 text-sm text-ink hover:bg-gray-100">Tolak opsional</button>
          <button type="button" onClick={() => choose("accept")} className="min-h-11 bg-gray-800 px-4 text-sm font-medium text-white hover:bg-gray-700">Terima semua</button>
        </div>
      </div>
    </aside>
  );
}
