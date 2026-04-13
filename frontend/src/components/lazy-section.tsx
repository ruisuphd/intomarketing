"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function SectionPlaceholder({ minHeight }: { minHeight: string }) {
  return (
    <div
      className="animate-pulse space-y-4 rounded-apple border border-apple-border bg-apple-card/50 p-6"
      style={{ minHeight }}
    >
      <div className="h-5 w-40 rounded bg-apple-border" />
      <div className="h-3 w-full max-w-md rounded bg-apple-border" />
      <div className="h-32 rounded-lg bg-apple-bg" />
    </div>
  );
}

/**
 * Mounts children only when the block nears the viewport to cut initial API burst.
 */
export default function LazySection({
  children,
  minHeight = "280px",
  rootMargin = "240px 0px 240px 0px",
  anchorId,
}: {
  children: ReactNode;
  minHeight?: string;
  rootMargin?: string;
  /** Keeps in-page nav / hash targets valid before the section mounts. */
  anchorId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} id={anchorId} className="scroll-mt-28">
      {visible ? children : <SectionPlaceholder minHeight={minHeight} />}
    </div>
  );
}
