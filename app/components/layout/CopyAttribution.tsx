"use client";

import { useEffect } from "react";

function isEditable(node: Node | null) {
  const element = node instanceof Element ? node : node?.parentElement;
  return Boolean(
    element?.closest("input, textarea, select") ||
    (element instanceof HTMLElement && element.isContentEditable),
  );
}

export default function CopyAttribution() {
  useEffect(() => {
    function addAttribution(event: ClipboardEvent) {
      const clipboard = event.clipboardData;
      const selection = window.getSelection();
      if (event.defaultPrevented || !clipboard || !selection || selection.isCollapsed) return;
      if (
        isEditable(document.activeElement) ||
        isEditable(selection.anchorNode) ||
        isEditable(selection.focusNode)
      ) return;

      const text = selection.toString();
      if (!text.trim()) return;

      const source = new URL(window.location.pathname, window.location.origin).href;
      clipboard.setData("text/plain", `${text}\n\nSumber: ResponKu — ${source}`);
      event.preventDefault();
    }

    document.addEventListener("copy", addAttribution);
    return () => document.removeEventListener("copy", addAttribution);
  }, []);

  return null;
}
