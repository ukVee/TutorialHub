"use client";

import { useEffect, useState } from "react";
import MockTerminal from "../../components/terminal/MockTerminal";
import RippleLoad from "../../components/loading/RippleLoad";
import { useRepoTree } from "../../lib/useRepoTree";
import type { RepoExplorerState } from "../../lib/types";
import ExplorerLayout from "./ExplorerLayout";

export default function RepoExplorer() {
  const { tree, loading, error, fileStates, toggleFile } = useRepoTree();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [compact, setCompact] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && explorerOpen) setExplorerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explorerOpen]);

  // Responsive: collapse preview on narrow viewports.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 600px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => setCompact(e.matches);
    handle(mql);
    mql.addEventListener("change", handle as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener("change", handle as (e: MediaQueryListEvent) => void);
  }, []);

  const state: RepoExplorerState = {
    tree,
    loading,
    error,
    fileStates,
  };

  return (
    <div className="mini-shell relative">
      <MockTerminal
        className="w-full h-full"
        greet
        onOpenExplorer={() => setExplorerOpen(true)}
        fullSize
      />

      {explorerOpen && (
        <div className="explorer-overlay">
          <div className="explorer-panel">
            <div className="explorer-bar">
              <span className="explorer-title">file_explorer</span>
            </div>
            <div className="explorer-body">
              <ExplorerLayout
                state={state}
                compact={compact}
                onOpenFile={toggleFile}
                loadingFallback={
                  <div className="flex items-center justify-center py-8">
                    <RippleLoad className="w-full max-w-2xl h-40" ariaLabel="Loading repository files" />
                  </div>
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
