"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GitHubStats from "./components/landing/GitHubStats";
import GistGrid from "./components/landing/GistGrid";
import ApologyMessage from "./components/landing/ApologyMessage";
import GlitchOverlay from "./components/landing/GlitchOverlay";
import CompositeGlitchScene from "./components/landing/CompositeGlitchScene";
import GitHubScripts from "./components/landing/GitHubScripts";
import { UserSettings, defaultSettings, getSettings, saveSettings } from "./lib/settings";
import SplashGate from "./components/splash/SplashGate";
import NeuralMesh from "./components/terminal/NeuralMesh";
import MockTerminal from "./components/terminal/MockTerminal";

type Mode = "HOME" | "GLITCH" | "TERMINAL";

const GLITCH_OFFSET_AFTER_SPLASH_MS = 2000;
// Glitch now has 4 stages; keep overall window in sync with slices.
const GLITCH_DURATION_MS = 1200;
const TERMINAL_DURATION_MS = 5000;
const HOME_TO_MESSAGE_DELAY_MS = 1000;
const APOLOGY_DURATION_MS = 7000;
const POST_SPLASH_TOTAL_MS = 4400; // matches SplashGate run + fade

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [glitchActive, setGlitchActive] = useState(false);
  const [showApology, setShowApology] = useState(false);
  const [mode, setMode] = useState<Mode>("HOME");
  const [splashDone, setSplashDone] = useState(false);
  const [sequenceStarted, setSequenceStarted] = useState(false);
  const [showPostSplash, setShowPostSplash] = useState(false);
  const [terminalScript, setTerminalScript] = useState<{ at: number; line: string }[]>([]);
  const [terminalScriptKey, setTerminalScriptKey] = useState(0);
  const timersRef = useRef<number[]>([]);

  const router = useRouter();

  // Load settings once.
  useEffect(() => {
    const stored = getSettings();
    console.log("[Home] settings loaded", stored);
    setSettings(stored);
  }, []);

  // Clear any outstanding timers on unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Drive first-visit sequence once per visitor.
  useEffect(() => {
    console.log("[Home] sequence effect run", { splashDone, sequenceStarted, displayGlitch: settings.displayGlitch });
    if (!splashDone) return;
    if (sequenceStarted) return;
    if (!settings.displayGlitch) return;

    console.log("[Home] starting sequence after splash");
    setSequenceStarted(true);
    const updated = { ...settings, displayGlitch: true };
    saveSettings(updated);
    setSettings(updated);
    console.log("[Home] displayGlitch toggled off for future visits");

    // Wait until 2s after splash finishes, then start glitch.
    const startGlitchTimer = window.setTimeout(() => {
      console.log("[Home] -> GLITCH mode");
      setMode("GLITCH");
      setGlitchActive(true);

      // Stop glitch overlay quickly, then show terminal.
      const stopGlitchTimer = window.setTimeout(() => {
        console.log("[Home] stop glitch overlay, show TERMINAL");
        setGlitchActive(false);
        setTerminalScript([
          { at: 0, line: "[System][Critical] Malfunction occured, Checking ukVDefender status" },
          { at: 400, line: "[ukVDefender] Status:" },
          { at: 900, line: "[ukVDefender] panic: true" },
          { at: 1400, line: '[ukVDefender] defensive_operations: "active"' },
          { at: 1900, line: '[ukVDefender] Check logs with "ukvd logs"' },
          { at: 2400, line: "[ukDefender] Unidentified user in space." },
          { at: 3000, line: "[System] Rebooting 3." },
          { at: 3800, line: "[System] Rebooting 2." },
          { at: 4600, line: "[System] Rebooting 1." },
        ]);
        setTerminalScriptKey((k) => k + 1);
        setMode("TERMINAL");
      }, GLITCH_DURATION_MS);
      timersRef.current.push(stopGlitchTimer);

      // Keep terminal up for 5 seconds.
      const endTerminalTimer = window.setTimeout(() => {
        console.log("[Home] hide TERMINAL, back to HOME and show post-splash");
        setMode("HOME");
        setShowPostSplash(true);
      }, GLITCH_DURATION_MS + TERMINAL_DURATION_MS);
      timersRef.current.push(endTerminalTimer);

      // Show apology 2 seconds after returning home, keep for 7 seconds.
      const apologyStart = window.setTimeout(() => {
        console.log("[Home] show apology");
        setShowApology(true);
      }, GLITCH_DURATION_MS + TERMINAL_DURATION_MS + POST_SPLASH_TOTAL_MS + HOME_TO_MESSAGE_DELAY_MS);
      timersRef.current.push(apologyStart);
      const apologyEnd = window.setTimeout(
        () => {
          console.log("[Home] hide apology");
          setShowApology(false);
        },
        GLITCH_DURATION_MS + TERMINAL_DURATION_MS + POST_SPLASH_TOTAL_MS + HOME_TO_MESSAGE_DELAY_MS + APOLOGY_DURATION_MS
      );
      timersRef.current.push(apologyEnd);
    }, GLITCH_OFFSET_AFTER_SPLASH_MS);

    timersRef.current.push(startGlitchTimer);
  }, [splashDone, sequenceStarted, settings.displayGlitch]);

  if (mode === "TERMINAL") {
    return (
      <div className="fixed inset-0 z-60 bg-[#05040b]">
        <NeuralMesh />
        <div className="relative z-10 flex h-full items-center justify-center p-6">
          <MockTerminal script={terminalScript} scriptKey={`run-${terminalScriptKey}`} greet={false} />
        </div>
      </div>
    );
  }

  return (
    <>
      <CompositeGlitchScene
        active={mode === "GLITCH"}
        terminalScript={terminalScript}
        terminalScriptKey={terminalScriptKey}
      />
      <GlitchOverlay active={glitchActive} />
      <ApologyMessage show={showApology} />
      <SplashGate onComplete={() => setSplashDone(true)} debugLabel="SplashInitial">
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 md:px-10 lg:px-12">
            <section className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tutorial Hub</p>
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  Gist Tutorials, my bash scripts that I use, and a live terminal playground.
                </h1>
                <p className="text-base text-slate-200/90 leading-relaxed">
                  Hii you can call me vee, I love all things linux.  I really do.  If you happen to run Arch linux, I may have some goodies for you below.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/40 transition hover:-translate-y-0.5 hover:bg-white"
                    onClick={() => router.push('/terminal')}
                  >
                    Open Terminal
                  </button>
                  <button
                    className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100/90 transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-white"
                    onClick={() => document.getElementById("gists")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Browse Gists
                  </button>
                </div>
              </div>
              <div className="panel ring-1 ring-slate-800/80 shadow-2xl shadow-slate-950/60 backdrop-blur">
                <p className="text-sm text-slate-300/90">
                  Local settings are stored on your device.
                  Current preference:
                </p>
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-100">
                  <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                  <span className="text-slate-200">
                    Glitch on first visit:&nbsp;
                    <strong>{settings.displayGlitch ? "Pending" : "Disabled"}</strong>
                  </span>
                </div>
              </div>
            </section>

            <section aria-labelledby="github-stats">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">GitHub Pulse</p>
                  <h2 id="github-stats" className="text-2xl font-semibold text-white">
                    Current Stats
                  </h2>
                </div>
              </div>
              <GitHubStats />
            </section>

            <section id="gists" aria-labelledby="gist-grid" className="pb-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Code drops</p>
                  <h2 id="gist-grid" className="text-2xl font-semibold text-white">
                    Latest gists
                  </h2>
                </div>
                <a
                  href="https://gist.github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-300 hover:text-white"
                >
                  View on GitHub →
                </a>
              </div>
              <div className="mt-4">
                <GistGrid />
              </div>
            </section>

            <section aria-labelledby="scripts-grid" className="pb-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Repo</p>
                  <h2 id="scripts-grid" className="text-2xl font-semibold text-white">
                    i3-scripts (GitHub)
                  </h2>
                </div>
              </div>
              <div className="mt-4">
                <GitHubScripts />
              </div>
            </section>
          </div>
        </main>
      </SplashGate>
      {showPostSplash && (
        <SplashGate
          key="post-splash"
          onComplete={() => {
            console.log("[Home] post splash complete");
            setShowPostSplash(false);
          }}
          debugLabel="SplashPost"
        >
          <></>
        </SplashGate>
      )}
    </>
  );
}
