"use client";

import { useEffect, useState } from "react";

type Stats = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
};

const GH_USER = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "ukvee";

export default function GitHubStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`https://api.github.com/users/${GH_USER}`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = (await res.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError("GitHub is shy right now (rate limit or offline).");
        console.error(err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
