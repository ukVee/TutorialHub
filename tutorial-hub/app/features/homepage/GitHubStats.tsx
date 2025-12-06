"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import type { GitHubStatsProps, GitHubUserStats } from "../../lib/types";

const CACHE_KEY = "thub_cache_github_user";
type CachedPayload = { data: GitHubUserStats; cachedAt: number };

const readCache = (): CachedPayload | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed?.data || typeof parsed.cachedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (payload: CachedPayload) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore storage errors */
  }
};

export default function GitHubStats({ cacheEnabled }: GitHubStatsProps) {
  const [stats, setStats] = useState<GitHubUserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Serve cached data immediately if allowed.
      if (cacheEnabled) {
        const cached = readCache();
        if (cached) {
          setStats(cached.data);
        }
      }

      try {
        const data = await apiGet<GitHubUserStats>("/api/github/user");
        if (cancelled) return;

        setStats(data);
        setError(null);

        if (cacheEnabled) {
          writeCache({ data, cachedAt: Date.now() });
        }
      } catch (err) {
        if (!cancelled) {
          setError("GitHub is shy right now (rate limit or offline).");
          // fall back to stale cache if available
          if (cacheEnabled) {
            const cached = readCache();
            if (cached) setStats((prev) => prev ?? cached.data);
          }
        }
        console.error(err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cacheEnabled]);

  if (error) {
    return (
      <div className="panel">
        <p className="text-sm text-rose-200">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="panel animate-pulse">
        <p className="text-sm text-slate-300">Loading GitHub stats…</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="flex items-center gap-4">
        <img
          src={stats.avatar_url}
          alt={stats.login}
          className="h-14 w-14 rounded-full border border-slate-700 object-cover"
        />
        <div>
          <div className="text-lg font-semibold text-white leading-tight">{stats.name || stats.login}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{stats.login}</div>
        </div>
      </div>
      {stats.bio && <p className="mt-3 text-sm text-slate-200/80">{stats.bio}</p>}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Repos" value={stats.public_repos} />
        <Stat label="Followers" value={stats.followers} />
        <Stat label="Following" value={stats.following} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-900/60 p-3 ring-1 ring-slate-800 shadow-inner shadow-slate-900/40">
      <div className="text-base font-semibold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
    </div>
  );
}
