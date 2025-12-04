"use client";

import { useState } from "react";
import type { RepoTreeViewProps, FolderProps, FileProps } from "../../lib/types";

export function RepoTreeView({ tree, fileStates, onToggle }: RepoTreeViewProps) {
  return (
    <div className="space-y-2 text-slate-100">
      {tree.map((node) =>
        node.type === "dir" ? (
          <Folder key={node.path || node.name} node={node} depth={0} fileStates={fileStates} onToggle={onToggle} />
        ) : (
          <FileRow key={node.path} node={node} depth={0} state={fileStates[node.path]} onToggle={onToggle} />
        )
      )}
    </div>
  );
}

function Folder({ node, depth, fileStates, onToggle }: FolderProps) {
  const [open, setOpen] = useState(depth === 0);
  const childCount = node.children?.length ?? 0;
  const indent = depth ? depth * 12 : 0;

  return (
    <div className="space-y-1" style={{ marginLeft: indent }}>
      <div className="flex items-center justify-between gap-2 pr-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-100/90 ring-1 ring-slate-800/70 hover:ring-slate-500/80 transition"
        >
          <span className="text-[11px] text-slate-400">{open ? "▾" : "▸"}</span>
          <span className="font-semibold text-white">{node.name || "root"}</span>
          <span className="text-[11px] text-slate-400">{childCount} items</span>
        </button>
      </div>

      {open && childCount > 0 && (
        <div className="space-y-1">
          {node.children?.map((child) =>
            child.type === "dir" ? (
              <Folder
                key={child.path}
                node={child}
                depth={depth + 1}
                fileStates={fileStates}
                onToggle={onToggle}
              />
            ) : (
              <FileRow
                key={child.path}
                node={child}
                depth={depth + 1}
                state={fileStates[child.path]}
                onToggle={onToggle}
              />
            )
          )}
        </div>
      )}

      {open && childCount === 0 && (
        <p className="text-sm text-slate-400" style={{ marginLeft: (depth + 1) * 12 }}>
          Empty folder
        </p>
      )}
    </div>
  );
}

function FileRow({ node, depth, state, onToggle }: FileProps) {
  const indent = depth ? depth * 12 : 0;
  const label = state?.loading ? "Loading…" : state?.visible ? "Hide" : "View";

  return (
    <div className="file-row" style={{ marginLeft: indent }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{node.name}</h3>
          <p className="text-[11px] text-slate-400">{node.size ?? 0} bytes</p>
        </div>
        <button
          onClick={() => onToggle(node.path)}
          className="file-row__btn"
        >
          {label}
        </button>
      </div>

      {state?.visible && state?.error && <p className="mt-2 text-xs text-rose-200">{state.error}</p>}

      {state?.visible && state.content && (
        <pre className="file-row__preview">
{state.content}
        </pre>
      )}
    </div>
  );
}
