"use client";

import type { UserSettings } from "./types";

export const defaultSettings: UserSettings = {
  displaySplash: true,
  displayGlitch: true,
  theme: "dark",
};

const STORAGE_KEY = "tutorial-hub-settings";

// Safe parse helper to avoid crashes on corrupted data.
const parseSettings = (raw: string | null): UserSettings | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return null;
  }
};

export function getSettings(): UserSettings {
  if (typeof window === "undefined") return defaultSettings;

  try {
    const parsed = parseSettings(window.localStorage.getItem(STORAGE_KEY));
    if (!parsed) {
      saveSettings(defaultSettings);
      return defaultSettings;
    }
    return parsed;
  } catch {
    // fall back to defaults if storage is unavailable or corrupted
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage write failures to avoid breaking UX.
  }
}
