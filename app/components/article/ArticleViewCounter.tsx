"use client";

import { useEffect, useState } from "react";

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
    let cancelled = false;

    const refreshViews = () => {
      if (document.visibilityState !== "visible") return;
      void fetch(`/api/articles/${encodeURIComponent(articleSlug)}/view`, { cache: "no-store", credentials: "same-origin" })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (!cancelled && Number.isFinite(data?.views)) setViews(data.views);
        })
        .catch(() => null);
    };

    function recordView() {
      if (recorded) return;
      recorded = true;
      void fetch(`/api/articles/${encodeURIComponent(articleSlug)}/view`, {
        method: "POST",
        credentials: "same-origin",
      })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (!cancelled && data?.recorded && Number.isFinite(data.views)) setViews(data.views);
        })
        .catch(() => {
          recorded = false;
        });
    }

    recordView();
    refreshViews();
    document.addEventListener("visibilitychange", refreshViews);
    const refreshInterval = window.setInterval(refreshViews, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshViews);
    };
  }, [articleSlug]);

  useEffect(() => setViews(initialViews), [initialViews]);

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-mute">
      <i className="bx bx-show text-base" aria-hidden="true" />
      {new Intl.NumberFormat("id-ID").format(views)} tayangan
    </span>
  );
}
