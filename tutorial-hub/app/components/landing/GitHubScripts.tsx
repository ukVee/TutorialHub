"use client";

import { RepoTreeView } from "./github/RepoTreeView";
import { useRepoTree } from "../../lib/useRepoTree";

export default function GitHubScripts() {
  const { tree, loading, error, fileStates, toggleFile } = useRepoTree();

  if (loading) {
    return <p className="text-sm text-slate-300">Loading repository files…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-200">{error}</p>;
  }

  if (!tree.length) {
    return <p className="text-sm text-slate-400">No files found in i3-scripts.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tree.map((node) => (
        <div key={node.path || node.name} className="gist-card">
          <RepoTreeView tree={[node]} fileStates={fileStates} onToggle={toggleFile} />
        </div>
      ))}
    </div>
  );
}
