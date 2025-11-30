"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NeuralMesh from "../terminal/NeuralMesh";
import MockTerminal from "../terminal/MockTerminal";

import type { CompositeGlitchSceneProps } from "../../lib/types";

const SLICE_INTERVAL_MS = 150;

export default function CompositeGlitchScene({ active, terminalScript, terminalScriptKey }: CompositeGlitchSceneProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<number[]>([]);

  const slices = useMemo(
    () => [
      // down-right slash, upper third
      { clip: "polygon(0 52%, 100% 32%, 100% 40%, 0 60%)" },
      // up-right slash, mid band
      { clip: "polygon(0 42%, 100% 62%, 100% 68%, 0 48%)" },
      // down-right slash, lower band
      { clip: "polygon(0 68%, 100% 48%, 100% 56%, 0 76%)" },
      // up-right slash, lower band
      { clip: "polygon(0 78%, 100% 98%, 100% 100%, 0 82%)" },
    ],
    []
  );

  useEffect(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    if (!active) {
      requestAnimationFrame(() => {
        setVisible(false);
        setVisibleCount(0);
      });
      return;
    }

    requestAnimationFrame(() => {
      setVisible(true);
      setVisibleCount(1);
    });

    for (let i = 1; i < slices.length; i += 1) {
      const t = window.setTimeout(() => setVisibleCount(i + 1), SLICE_INTERVAL_MS * i);
      timersRef.current.push(t);
    }

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [active, slices.length]);

  if (!visible) return null;

  return (
    <div className={`composite-glitch ${active ? "composite-glitch--show" : ""}`} aria-hidden>
      {slices.map((slice, idx) => (
        <div
          key={idx}
          className="glitch-slice-layer"
          style={{
            clipPath: slice.clip,
            WebkitClipPath: slice.clip,
            opacity: idx < visibleCount ? 1 : 0,
            zIndex: 70 + idx,
          }}
        >
          <div className="glitch-slice-content">
            <NeuralMesh />
            <div className="glitch-terminal">
              <MockTerminal script={terminalScript} scriptKey={terminalScriptKey} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
