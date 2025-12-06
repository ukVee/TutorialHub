"use client";

import { useEffect } from "react";
import type { SettingsModalProps, SettingToggleProps } from "../../lib/types";

const SettingToggle = ({ label, description, checked, onChange }: SettingToggleProps) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-100">{label}</p>
      {description ? <p className="text-xs text-slate-400 leading-5">{description}</p> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? "bg-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.45)]" : "bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-slate-100 transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{label}</span>
    </button>
  </div>
);

export default function SettingsModal({ open, settings, onClose, onUpdate }: SettingsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <button aria-label="Close settings" className="absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Local settings"
        className="relative w-full max-w-md rounded-2xl border border-slate-800/90 bg-slate-950/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Settings</p>
            <h3 className="text-xl font-semibold text-slate-100">Local preferences</h3>
            <p className="text-sm text-slate-400">
              Stored in `localStorage` and applied on this device only.
            </p>
          </div>
          <button
            aria-label="Close settings panel"
            onClick={onClose}
            className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1 text-sm text-slate-300 transition hover:-translate-y-0.5 hover:border-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <SettingToggle
            label="Glitch intro"
            description="Play the glitch + terminal sequence again."
            checked={settings.displayGlitch}
            onChange={(next) => onUpdate({ displayGlitch: next })}
          />
          <SettingToggle
            label="Splash screen"
            description="Show the animated splash before loading the homepage."
            checked={settings.displaySplash}
            onChange={(next) => onUpdate({ displaySplash: next })}
          />
          <SettingToggle
            label="Cache Homepage"
            description="Can I cache my homepage on your device for quicker loading times?"
            checked={settings.cacheGithub}
            onChange={(next) => onUpdate({ cacheGithub: next })}
          />
        </div>
      </div>
    </div>
  );
}
