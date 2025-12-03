"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import type { Gist } from "../../lib/types";

type GitHubGist = {
  id: string;
  description: string | null;
  files: Record<string, unknown>;
  created_at: string;
  html_url: string;
};

export default function GistGrid() {
  const [gists, setGists] = useState<Gist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiGet<GitHubGist[]>("/api/github/gists");
        const simplified = data.map((gist) => ({
          id: gist.id,
          description: gist.description || "Untitled gist",
          files: Object.keys(gist.files || {}),
          created_at: gist.created_at,
          url: gist.html_url,
        }));
        if (!cancelled) setGists(simplified);
      } catch (err) {
        if (!cancelled) setError("Could not fetch gists right now (rate limit or offline).");
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-rose-200">{error}</p>;
  }

  if (loading) {
    return <p className="text-sm text-slate-300">Loading gists…</p>;
  }

  if (!gists.length) {
    return <p className="text-sm text-slate-400">No public gists to show just yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gists.map((gist) => (
        <a
          key={gist.id}
          href={gist.url}
          target="_blank"
          rel="noreferrer"
          className="gist-card"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-white leading-tight">
              {gist.description || "Untitled gist"}
            </h3>
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 ring-1 ring-slate-800">
              {gist.files.length} file{gist.files.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-slate-300/90 mt-2">
            {new Date(gist.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {gist.files.map((file) => (
              <span key={file} className="gist-pill">
                {file}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
