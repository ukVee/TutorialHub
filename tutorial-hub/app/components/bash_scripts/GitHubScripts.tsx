"use client";

import { useState } from "react";
import BashShell from "./BashShell";
import { useRepoTree } from "../../lib/useRepoTree";
import type { RepoNode, FileState } from "../../lib/types";

export default function GitHubScripts() {
  const { tree, loading, error, fileStates, toggleFile } = useRepoTree();
  const [explorerOpen, setExplorerOpen] = useState(true);

  return (
    <div className="mini-shell">
      <BashShell
        onOpenExplorer={() => setExplorerOpen(true)}
        explorerOpen={explorerOpen}
        onCloseExplorer={() => setExplorerOpen(false)}
        explorerSlot={
          <FileExplorerContent
            loading={loading}
            error={error}
            tree={tree}
            fileStates={fileStates}
            onOpenFile={toggleFile}
          />
        }
      />
    </div>
  );
}

function FileExplorerContent({
  loading,
  error,
  tree,
  fileStates,
  onOpenFile,
}: {
  loading: boolean;
  error: string | null;
  tree: RepoNode[];
  fileStates: Record<string, FileState>;
  onOpenFile: (path: string) => Promise<void> | void;
}) {
  if (loading) return <p className="text-sm text-slate-200">Loading repository files…</p>;
  if (error) return <p className="text-sm text-rose-200">{error}</p>;

  if (!tree.length) return <p className="text-sm text-slate-200">No repository data.</p>;

  const virtualRoot: RepoNode = {
    name: "i3-scripts",
    path: "i3-scripts",
    type: "dir",
    children: tree,
  };

  return (
    <ExplorerLayout
      root={virtualRoot}
      fileStates={fileStates}
      onOpenFile={onOpenFile}
    />
  );
}

type ExplorerLayoutProps = {
  root: RepoNode;
  fileStates: Record<string, FileState>;
  onOpenFile: (path: string) => Promise<void> | void;
};

function ExplorerLayout({ root, fileStates, onOpenFile }: ExplorerLayoutProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root.path]));
  const [selected, setSelected] = useState<string | null>(null);

  const toggleFolder = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFile = (path: string) => {
    setSelected(path);
  };

  const handleToggleFile = (path: string) => {
    const current = fileStates[path];
    if (current?.visible) {
      if (selected === path) setSelected(null);
    } else {
      setSelected(path);
    }
    onOpenFile(path);
  };

  const state = selected ? fileStates[selected] : undefined;
  const hasPreview = Boolean(selected && state?.visible);

  return (
    <div className="explorer-layout">
      <div className="explorer-tree" aria-label="Repository tree">
        <TreeNode
          node={root}
          expanded={expanded}
          onToggle={toggleFolder}
          onFile={handleFile}
          onToggleFile={handleToggleFile}
          depth={0}
          selected={selected}
          fileStates={fileStates}
        />
      </div>
      <div className={`explorer-preview ${hasPreview ? "explorer-preview--visible" : ""}`} aria-label="File preview">
        {!hasPreview && <p className="text-sm text-slate-400">Select a file to preview.</p>}
        {hasPreview && state?.loading && <p className="text-sm text-slate-200">Loading…</p>}
        {hasPreview && state?.error && <p className="text-sm text-rose-200">{state.error}</p>}
        {hasPreview && state?.content && (
          <div className="preview-card">
            <div className="preview-title">{selected}</div>
            <pre className="preview-body">{state.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

type TreeNodeProps = {
  node: RepoNode;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onFile: (path: string) => void;
  onToggleFile: (path: string) => void;
  depth: number;
  selected: string | null;
  fileStates: Record<string, FileState>;
};

function TreeNode({ node, expanded, onToggle, onFile, onToggleFile, depth, selected, fileStates }: TreeNodeProps) {
  const indent = depth * 16;

  if (node.type === "dir") {
    const isOpen = expanded.has(node.path);
    const children = node.children || [];
    const isRoot = depth === 0;
    const sortedChildren = [...children].sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    });

    return (
      <div className="tree-branch">
        <button className="tree-row" style={{ paddingLeft: 14 + indent }} onClick={() => onToggle(node.path)}>
          <span className="tree-chevron" aria-hidden>{isOpen ? "▾" : "▸"}</span>
          <span className="tree-icon__glyph" aria-hidden>{isOpen ? "📂" : "📁"}</span>
          <span className="tree-label">{isRoot ? `${node.name || "root"}` : node.name}</span>
        </button>
        {isOpen && (
          <div className="tree-children">
            {sortedChildren.map((child) => (
              <TreeNode
                key={child.path}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onFile={onFile}
              onToggleFile={onToggleFile}
              depth={depth + 1}
              selected={selected}
              fileStates={fileStates}
            />
          ))}
          {children.length === 0 && <p className="tree-empty">(empty)</p>}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selected === node.path;
  const state = fileStates[node.path];
  const label = state?.visible ? "Hide" : state?.loading ? "Loading…" : "Show";
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFile(node.path);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`tree-row tree-row--file ${isSelected ? "tree-row--active" : ""}`}
      style={{ paddingLeft: 14 + indent }}
      onClick={() => onFile(node.path)}
      onKeyDown={onKey}
    >
      <span className="tree-chevron" aria-hidden>•</span>
      <span className="tree-icon__glyph" aria-hidden>📄</span>
      <span className="tree-label flex-1">{node.name}</span>
      <span className="tree-row__actions">
        <button
          type="button"
          className="tree-row__btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFile(node.path);
          }}
        >
          {label}
        </button>
      </span>
    </div>
  );
}
