"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export default function ScrollingName({ name, className = "", swipeable = false }: { name: string; className?: string; swipeable?: boolean }) {
  const nameViewport = useRef<HTMLSpanElement>(null);
  const nameText = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [manualOffset, setManualOffset] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (manualOffset !== null && nameViewport.current) {
      nameViewport.current.scrollLeft = manualOffset;
    }
  }, [manualOffset]);

  useEffect(() => {
    const viewport = nameViewport.current;
    const label = nameText.current;
    if (!viewport || !label) return;

    function measure() {
      if (viewport && label) {
        setOverflow(Math.max(0, label.offsetWidth - viewport.clientWidth));
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(label);
    return () => observer.disconnect();
  }, [name]);

  const canSwipe = swipeable && overflow > 0;

  return (
    <span
      ref={nameViewport}
      title={name}
      className={`min-w-0 whitespace-nowrap ${canSwipe ? "overflow-x-auto mask-[linear-gradient(to_right,transparent,black_8px,black_calc(100%_-_8px),transparent)]" : "overflow-hidden"} ${className}`}
      onPointerDown={(event) => {
        if (!canSwipe || event.pointerType !== "touch" || manualOffset !== null || !nameText.current) return;
        setManualOffset(event.currentTarget.getBoundingClientRect().left - nameText.current.getBoundingClientRect().left);
      }}
    >
      <span
        ref={nameText}
        className={overflow > 0 && manualOffset === null ? "inline-block motion-safe:animate-[account-name-scroll_10s_ease-in-out_infinite]" : "inline-block"}
        style={{ "--account-name-offset": `-${overflow}px` } as CSSProperties}
      >
        {name}
      </span>
    </span>
  );
}
