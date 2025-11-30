"use client";

import { useEffect, useRef, useState } from "react";
import GameOfLifeCanvas from "./GameOfLifeCanvas";

import type { SplashGateProps } from "../../lib/types";

const RUN_DURATION_MS = 4000;
const FADE_DURATION_MS = 400;

export default function SplashGate({ children, onComplete, debugLabel = "SplashGate" }: SplashGateProps) {
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => setIsSplashVisible(true));
    console.log(`[${debugLabel}] splash visible`);

    // Trigger fade then remove after the animation completes.
    const fadeTimer = window.setTimeout(() => {
      console.log(`[${debugLabel}] splash fade start`);
      setIsFading(true);
    }, RUN_DURATION_MS);
    const endTimer = window.setTimeout(() => {
      setIsSplashVisible(false);
      console.log(`[${debugLabel}] splash done -> onComplete`);
      onComplete?.();
    }, RUN_DURATION_MS + FADE_DURATION_MS);

    timersRef.current.push(fadeTimer, endTimer);

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [debugLabel, onComplete]);

  return (
    <>
      {isSplashVisible && (
        <div
          className={`splash-overlay ${isFading ? "splash-overlay--fade pointer-events-none" : ""}`}
          aria-hidden
        >
          <GameOfLifeCanvas runDurationMs={RUN_DURATION_MS} />
        </div>
      )}
      {children}
    </>
  );
}
