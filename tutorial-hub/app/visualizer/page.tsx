"use client";

import { useEffect, useState } from "react";
import RepoGraph, { type GraphLink, type GraphNode } from "@/components/RepoGraph";

type GraphPayload = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export default function VisualizerPage() {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const basePath = process.env.NODE_ENV === "production" ? "/TutorialHub" : "";
        const response = await fetch(`${basePath}/api/github/repo`, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const payload: GraphPayload = await response.json();
        if (!cancelled) setGraph(payload);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unable to load repository graph";
          setError(message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-slate-100">
      <RepoGraph data={graph} />
      {error && (
        <div className="absolute bottom-4 right-4 rounded-md border border-rose-500/60 bg-rose-900/40 px-4 py-3 text-sm text-rose-100 shadow-lg backdrop-blur">
          <div className="font-semibold uppercase tracking-[0.18em] text-rose-200">Graph Error</div>
          <p className="text-rose-100/80">{error}</p>
        </div>
      )}
      {!graph && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.3em] text-teal-200/60">
          Loading repository map…
        </div>
      )}
    </div>
  );
}
