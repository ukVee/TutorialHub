"use client";

import { useEffect, useState } from "react";
import { MockTerminal } from "../index";
import { useRepoTree } from "../../lib/useRepoTree";
import type { RepoNode, FileState } from "../../lib/types";
import RippleLoad from "../shared/loading/RippleLoad";

export default function GitHubScripts() {
  const { tree, loading, error, fileStates, toggleFile } = useRepoTree();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && explorerOpen) setExplorerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explorerOpen]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 600px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => setCompact(e.matches);
    handle(mql);
    mql.addEventListener("change", handle as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener("change", handle as (e: MediaQueryListEvent) => void);
  }, []);

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
                <FileExplorerContent
                  loading={loading}
                  error={error}
                tree={tree}
                fileStates={fileStates}
                onOpenFile={toggleFile}
                compact={compact}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileExplorerContent({
  loading,
  error,
  tree,
  fileStates,
  onOpenFile,
  compact = false,
}: {
  loading: boolean;
  error: string | null;
  tree: RepoNode[];
  fileStates: Record<string, FileState>;
  onOpenFile: (path: string) => Promise<void> | void;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RippleLoad className="w-full max-w-2xl h-40" ariaLabel="Loading repository files" />
      </div>
    );
  }
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
      compact={compact}
    />
  );
}

type ExplorerLayoutProps = {
  root: RepoNode;
  fileStates: Record<string, FileState>;
  onOpenFile: (path: string) => Promise<void> | void;
  compact?: boolean;
};

function ExplorerLayout({ root, fileStates, onOpenFile, compact = false }: ExplorerLayoutProps) {
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
    <div className={`explorer-layout ${compact ? "explorer-layout--compact" : ""}`}>
      <div className={`explorer-tree ${compact ? "explorer-tree--compact" : ""}`} aria-label="Repository tree">
        <TreeNode
          node={root}
          expanded={expanded}
          onToggle={toggleFolder}
          onFile={handleFile}
          onToggleFile={handleToggleFile}
          depth={0}
          selected={selected}
          fileStates={fileStates}
          compact={compact}
        />
      </div>
      {!compact && (
        <div className={`explorer-preview ${hasPreview ? "explorer-preview--visible" : ""}`} aria-label="File preview">
          {!hasPreview && <p className="text-sm text-slate-400">Select a file to preview.</p>}
          {hasPreview && (
            <div className="preview-card">
              <div className="preview-title">{selected}</div>
              {state?.loading && (
                <div className="flex items-center justify-center py-6 h-[240px]">
                  <RippleLoad className="rounded-md w-full h-full" />
                </div>
              )}
              {state?.error && (
                <p className="text-sm text-rose-200 py-3">{state.error}</p>
              )}
              {state?.content && <ContentBlock content={state.content} />}
            </div>
          )}
        </div>
      )}
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
  compact?: boolean;
};

function TreeNode({ node, expanded, onToggle, onFile, onToggleFile, depth, selected, fileStates, compact = false }: TreeNodeProps) {
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
                compact={compact}
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
    <div>
      <div
        role="button"
        tabIndex={0}
        className={`tree-row tree-row--file ${isSelected ? "tree-row--active" : ""}`}
        style={{ paddingLeft: 14 + indent }}
        onClick={() => {
          onFile(node.path);
          if (compact) onToggleFile(node.path);
        }}
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
      {compact && state?.visible && (
        <div className="tree-inline-preview">
          {state.loading && (
            <div className="preview-body preview-body--inline flex items-center justify-center py-4">
              <RippleLoad className="w-full h-[160px]" />
            </div>
          )}
          {state.error && <p className="text-sm text-rose-200">{state.error}</p>}
          {state.content && <ContentBlock content={state.content} inline />}
        </div>
      )}
    </div>
  );
}

function ContentBlock({ content, inline = false }: { content: string; inline?: boolean }) {
  const lines = content.split(/\r?\n/);
  return (
    <pre className={`preview-body ${inline ? "preview-body--inline" : ""}`}>
      {lines.map((line, idx) => (
        <div key={idx} className="preview-line">
          <span className="preview-line__num">{idx + 1}</span>
          <span className="preview-line__text">{line || "\u00a0"}</span>
        </div>
      ))}
    </pre>
  );
}
