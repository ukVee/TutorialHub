"use client";

import { useEffect, useState } from "react";
import type { GlitchOverlayProps } from "../../lib/types";

// Align with 4-stage glitch slices (~800-1000ms total).
const RUN_MIN = 900;
const RUN_MAX = 1100;

export default function GlitchOverlay({ active }: GlitchOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    requestAnimationFrame(() => {
      setRunId((prev) => prev + 1);
      setVisible(true);
    });

    const duration = RUN_MIN + Math.random() * (RUN_MAX - RUN_MIN);
    const timer = window.setTimeout(() => setVisible(false), duration);

    return () => window.clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="glitch-overlay" data-run={runId} aria-hidden>
      <div className="glitch-layer glitch-layer--r" />
      <div className="glitch-layer glitch-layer--g" />
      <div className="glitch-layer glitch-layer--b" />
      <div className="glitch-noise" />
    </div>
  );
}
