"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GlitchSlice from "./GlitchSlice";

type Props = {
  active: boolean;
};

const SLICE_INTERVAL_MS = 180; // time between slice reveals
const TOTAL_SLICES = 4;

export default function CompositeGlitchScene({ active }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<number[]>([]);

  const slices = useMemo(
    () => [
      {
        clipPath: "polygon(0 60%, 100% 40%, 100% 44%, 0 64%)",
        label: "glitch 1",
      },
      {
        clipPath: "polygon(0 68%, 100% 48%, 100% 52%, 0 72%)",
        label: "glitch 2",
      },
      {
        clipPath: "polygon(0 76%, 100% 56%, 100% 60%, 0 80%)",
        label: "glitch 3",
      },
      {
        clipPath: "polygon(0 84%, 100% 64%, 100% 68%, 0 88%)",
        label: "glitch 4",
      },
    ],
    []
  );

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    if (!active) {
      setVisible(false);
      setVisibleCount(0);
      return;
    }

    setVisible(true);
    setVisibleCount(1);

    for (let i = 1; i < TOTAL_SLICES; i += 1) {
      const t = window.setTimeout(() => setVisibleCount(i + 1), SLICE_INTERVAL_MS * i);
      timersRef.current.push(t);
    }

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [active]);

  if (!visible) return null;

  return (
    <div className={`composite-glitch ${active ? "composite-glitch--show" : ""}`} aria-hidden>
      {slices.slice(0, visibleCount).map((slice, idx) => (
        <GlitchSlice
          key={slice.label}
          clipPath={slice.clipPath}
          zIndex={60 + idx}
          label={slice.label}
        />
      ))}
    </div>
  );
}
