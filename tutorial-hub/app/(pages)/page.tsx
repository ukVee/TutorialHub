"use client";

import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";

import { NeuralMesh, MockTerminal } from "../components";
import SettingsModal from "../components/modals/SettingsModal";
import { GitHubStats, GistGrid, GlitchOverlay, CompositeGlitchScene } from "../features/homepage";
import ApologyMessageModal from "../components/modals/ApologyMessageModal";
import { SplashGate } from "../features/splash";

import { defaultSettings, getSettings, saveSettings } from "../lib/settings";
import type { Mode, TerminalScriptLine, UserSettings } from "../lib/types";

const GLITCH_OFFSET_AFTER_SPLASH_MS = 2000;
// Glitch now has 4 stages; keep overall window in sync with slices.
const GLITCH_DURATION_MS = 1200;
const TERMINAL_DURATION_MS = 5000;
const HOME_TO_MESSAGE_DELAY_MS = 1000;
const APOLOGY_DURATION_MS = 7000;
const POST_SPLASH_TOTAL_MS = 4400; // matches SplashGate run + fade

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [showApology, setShowApology] = useState(false);
  const [mode, setMode] = useState<Mode>("HOME");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [allowGlitch, setAllowGlitch] = useState(true);
  const [showPostSplash, setShowPostSplash] = useState(false);
  const [terminalScript, setTerminalScript] = useState<TerminalScriptLine[]>([]);
  const [terminalScriptKey, setTerminalScriptKey] = useState(0);
  const timersRef = useRef<number[]>([]);
  const sequenceStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = getSettings();
    requestAnimationFrame(() => {
      setSettings(stored);
      setSettingsReady(true);
    });
  }, []);

  // Splash + glitch first visit only. Once seen, disable both for subsequent visits/navigations.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settingsReady) return;

    requestAnimationFrame(() => {
      if (!settings.displaySplash) {
        setShowSplash(false);
        setSplashDone(true);
      } else {
        setShowSplash(true);
        setSplashDone(false);
      }

      setAllowGlitch(settings.displayGlitch);
    });
  }, [settings.displayGlitch, settings.displaySplash, settingsReady]);

  // Clear any outstanding timers on unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Drive first-visit sequence once per visitor.
  useEffect(() => {
    console.log("[Home] sequence effect run", { splashDone, started: sequenceStartedRef.current, displayGlitch: settings.displayGlitch, settingsReady });
    if (!splashDone) return;
    if (!settingsReady) return;
    if (sequenceStartedRef.current) return;

    const shouldRunGlitch = settings.displayGlitch && allowGlitch;
    sequenceStartedRef.current = true;
    if (!shouldRunGlitch) return;

    console.log("[Home] starting sequence after splash");
    const updated = { ...settings, displayGlitch: false };
    saveSettings(updated);
    requestAnimationFrame(() => setSettings(updated));
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
  }, [allowGlitch, settings, settingsReady, splashDone]);

  const updateSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

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
      <button
        aria-label="Open settings"
        onClick={() => setSettingsOpen(true)}
        className="settings-trigger fixed right-5 top-5 z-[65] rounded-full border border-slate-800/80 bg-slate-950/80 p-3 text-slate-200 shadow-lg shadow-slate-950/60 backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-500 hover:text-white"
      >
        <span className="sr-only">Open settings</span>
        <span className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-6 rounded-full bg-current" />
          <span className="block h-0.5 w-6 rounded-full bg-current" />
          <span className="block h-0.5 w-6 rounded-full bg-current" />
        </span>
      </button>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
      />

      <CompositeGlitchScene
        active={mode === "GLITCH"}
        terminalScript={terminalScript}
        terminalScriptKey={terminalScriptKey}
      />
      <GlitchOverlay active={glitchActive} />
      <ApologyMessageModal show={showApology} />
      {showSplash ? (
        <SplashGate
          onComplete={() => {
            setSplashDone(true);
            window.localStorage.setItem("thub_seen_home", "1");
          }}
          debugLabel="SplashInitial"
        >
          <MainContent settings={settings} />
        </SplashGate>
      ) : (
        <MainContent settings={settings} />
      )}
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

function MainContent({ settings }: { settings: UserSettings }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 md:px-10 lg:px-12">
        <section className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tutorial Hub</p>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Your place for Arch specific tutorials and scripts
            </h1>
            <p className="text-base text-slate-200/90 leading-relaxed">
              Hii you can call me ukv, I love all things linux.  I really do.  If you happen to run Arch linux, I may have some goodies for you.
            </p>
          </div>
        </section>

        <section aria-labelledby="stats-and-settings" className="flex justify-center">
          <div className="space-y-3 w-full max-w-md">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">GitHub Pulse</p>
              <h2 id="stats-and-settings" className="text-2xl font-semibold text-white">
                Current Stats
              </h2>
            </div>
            <GitHubStats cacheEnabled={settings.cacheGithub} />
          </div>
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

      </div>
    </main>
  );
}
