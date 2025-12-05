"use client";

import { useEffect, useRef } from "react";
import type { RippleLoadProps, RippleTheme } from "../../../lib/types";

// Default palette tuned to the existing neon-purple slate theme.
const DEFAULT_THEME: Required<RippleTheme> = {
  live: "#b48cff",
  trail: "rgba(124,91,255,0.45)",
};

export default function RippleLoad({
  className = "",
  speedMs = 50, // fast ripple
  theme = DEFAULT_THEME,
  ariaLabel = "Loading",
}: RippleLoadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastStepRef = useRef<number>(0);
  const speedMsClamped = Math.max(16, Math.min(speedMs, 120)); // guard extremes

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Ring = { r: number; alpha: number };
    let rings: Ring[] = [];
    let maxR = 0;
    let cx = 0;
    let cy = 0;
    let stroke = 2;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = rect.width / 2;
      cy = rect.height / 2;
      maxR = Math.hypot(rect.width, rect.height) / 1.1;
      stroke = Math.max(1.5, Math.min(3.5, rect.width / 220));
      initRings();
    };

    const initRings = () => {
      rings = [{ r: 0, alpha: 1 }];
    };

    const step = (ts: number) => {
      if (!canvas) return;
      if (ts - lastStepRef.current >= speedMsClamped) {
        lastStepRef.current = ts;
        update();
        render();
      }
      rafRef.current = requestAnimationFrame(step);
    };

    const update = () => {
      const speed = Math.max(3, maxR / 120); // expand quickly
      const fade = 0.06;
      rings = rings
        .map((ring) => ({ r: ring.r + speed, alpha: ring.alpha - fade }))
        .filter((ring) => ring.alpha > 0 && ring.r < maxR * 1.2);

      const last = rings[rings.length - 1];
      if (!last || last.r > Math.max(22, maxR * 0.05)) {
        rings.push({ r: 0, alpha: 1 });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(0.5, 0.5);
      rings.forEach((ring, idx) => {
        const alpha = Math.max(0, Math.min(1, ring.alpha));
        const color =
          idx === rings.length - 1
            ? theme.live || DEFAULT_THEME.live
            : theme.trail || DEFAULT_THEME.trail;
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = stroke;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [speedMsClamped, theme.live, theme.trail]);

  return (
    <div className={`relative w-full h-full ${className || ""}`} aria-label={ariaLabel} role="img">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ background: "transparent" }} />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
