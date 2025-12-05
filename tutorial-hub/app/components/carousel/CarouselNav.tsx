"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SwipeHandlers } from "../../lib/types";
import { NAV_PAGES } from "../../lib/nav";

const SWIPE_THRESHOLD = 48; // px

export function CarouselNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeIdx = useMemo(() => {
    const found = NAV_PAGES.findIndex((p) => p.path === pathname);
    return found === -1 ? 1 : found; // default to Home
  }, [pathname]);

  const move = (delta: number) => {
    const next = (activeIdx + delta + NAV_PAGES.length) % NAV_PAGES.length;
    router.push(NAV_PAGES[next].path);
  };

  useSwipeNavigation({ onSwipeLeft: () => move(1), onSwipeRight: () => move(-1) });

  const displayDots = [
    NAV_PAGES[(activeIdx - 1 + NAV_PAGES.length) % NAV_PAGES.length],
    NAV_PAGES[activeIdx],
    NAV_PAGES[(activeIdx + 1) % NAV_PAGES.length],
  ];

  const displayNames = displayDots; // same ordering: prev, current, next

  const rhombusClip = "[clip-path:polygon(0_20%,100%_20%,92%_100%,8%_100%)]";

  return (
    <>
      <div className="pointer-events-auto fixed left-0 right-0 top-2 z-50 flex justify-center">
        <div className={`relative inline-flex overflow-hidden rounded-md bg-slate-900/80 px-9 py-2 ring-1 ring-slate-800/70 shadow-lg backdrop-blur ${rhombusClip}`} style={{ minWidth: "440px", maxWidth: "660px", width: "84vw" }}>
          <div className="flex w-full items-center gap-6">
            {displayNames.map((page, idx) => {
              const isActive = idx === 1;
              const justify = idx === 0 ? "justify-start" : idx === 1 ? "justify-center" : "justify-end";
              return (
                <div key={`${page.path}-wrapper`} className={`flex flex-1 ${justify} ${idx === 0 ? "pl-4" : idx === 2 ? "pr-4" : ""}`}>
                  <button
                    key={`${page.path}-label`}
                    onClick={() => move(idx === 0 ? -1 : idx === 1 ? 0 : 1)}
                    className={`whitespace-nowrap rounded px-3 uppercase tracking-[0.16em] text-xs transition ${
                      isActive
                        ? "text-slate-50"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    aria-label={`Go to ${page.label}`}
                  >
                    {isActive ? `| ${page.label} |` : page.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-auto fixed left-0 right-0 bottom-6 z-50 flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-700/70 bg-transparent px-4 py-2 ring-1 ring-slate-800/60 backdrop-blur">
          <button
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-100 transition hover:border-slate-400"
            onClick={() => move(-1)}
          >
            <span aria-hidden className="text-lg">‹</span>
          </button>
          {displayDots.map((page, idx) => {
            const isActive = idx === 1;
            const size = isActive ? "h-3 w-3" : "h-2.5 w-2.5";
            return (
              <button
                key={`${page.path}-${idx}`}
                aria-label={`Go to ${page.label}`}
                className={`rounded-full transition ${isActive ? "bg-slate-100 shadow-[0_0_12px_rgba(255,255,255,0.6)]" : "border border-slate-400/60 bg-transparent"} ${size}`}
                onClick={() => move(idx === 0 ? -1 : idx === 1 ? 0 : 1)}
              />
            );
          })}
          <button
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-100 transition hover:border-slate-400"
            onClick={() => move(1)}
          >
            <span aria-hidden className="text-lg">›</span>
          </button>
        </div>
      </div>
    </>
  );
}

function useSwipeNavigation(handlers: SwipeHandlers) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      locked.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (locked.current || startX.current == null || startY.current == null) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      if (Math.abs(dy) > Math.abs(dx)) return; // ignore vertical scroll
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      locked.current = true;
      if (dx < 0) handlers.onSwipeLeft();
      else handlers.onSwipeRight();
    };

    const onEnd = () => {
      startX.current = null;
      startY.current = null;
      locked.current = false;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [handlers]);
}
