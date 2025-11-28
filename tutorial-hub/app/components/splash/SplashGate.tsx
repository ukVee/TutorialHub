"use client";

import { useEffect, useRef, useState } from "react";
import GameOfLifeCanvas from "./GameOfLifeCanvas";

type SplashGateProps = {
  children: React.ReactNode;
};

const RUN_DURATION_MS = 4000;
const FADE_DURATION_MS = 400;

export default function SplashGate({ children }: SplashGateProps) {
  const [isSplashVisible, setIsSplashVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let alreadySeen = false;

    try {
      alreadySeen = sessionStorage.getItem("splashSeen") === "1";
    } catch {
      alreadySeen = false;
    }

    //if (alreadySeen) return;

    try {
      sessionStorage.setItem("splashSeen", "1");
    } catch {
      // Continue without storage if access fails.
    }
    setIsSplashVisible(true);

    // Trigger fade then remove after the animation completes.
    const fadeTimer = window.setTimeout(() => setIsFading(true), RUN_DURATION_MS);
    const endTimer = window.setTimeout(
      () => setIsSplashVisible(false),
      RUN_DURATION_MS + FADE_DURATION_MS
    );

    timersRef.current.push(fadeTimer, endTimer);

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

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
