"use client";

import { useEffect, useState } from "react";
import { cookiePreferenceChange, getCookiePreference } from "@/lib/cookie-preferences";

export default function ArticleViewCounter({
  articleSlug,
  initialViews,
}: {
  articleSlug: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    let recorded = false;

    function recordView() {
      if (recorded || getCookiePreference() !== "accept") return;
      recorded = true;
      void fetch(`/api/articles/${encodeURIComponent(articleSlug)}/view`, {
        method: "POST",
        credentials: "same-origin",
      })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (data?.recorded) setViews((current) => current + 1);
        })
        .catch(() => {
          recorded = false;
        });
    }

    recordView();
    window.addEventListener(cookiePreferenceChange, recordView);
    return () => window.removeEventListener(cookiePreferenceChange, recordView);
  }, [articleSlug]);

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-mute">
      <i className="bx bx-show text-base" aria-hidden="true" />
      {new Intl.NumberFormat("id-ID").format(views)} tayangan
    </span>
  );
}
