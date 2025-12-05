"use client";

import { useEffect, useState } from "react";
import RepoGraph from "./RepoGraph";
import { listRepoTree } from "../../lib/api";
import type { GraphEntry, GraphLink, GraphNode, GraphPayload, RepoNode } from "../../lib/types";

const OWNER = "ukVee";
const REPO = "TutorialHub";

export default function VisualizerScene() {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadGraph = async () => {
      try {
        const tree = await listRepoTree(REPO);
        const entries = flattenTree(tree);
        const built = buildGraph(entries);
        if (!cancelled) setGraph(built);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unable to load repository graph";
        setError(message);
      }
    };

    loadGraph();
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

function flattenTree(nodes: RepoNode[], acc: GraphEntry[] = []): GraphEntry[] {
  for (const node of nodes) {
    if (!node.path) {
      if (node.children) flattenTree(node.children, acc);
      continue;
    }

    if (node.type === "dir") {
      acc.push({ path: node.path, type: "tree" });
      if (node.children) flattenTree(node.children, acc);
      continue;
    }

    if (node.type === "file") {
      acc.push({ path: node.path, type: "blob" });
    }
  }
  return acc;
}

function buildGraph(entries: Array<{ path: string; type?: "blob" | "tree" }>): GraphPayload {
  const rootId = `${OWNER}/${REPO}`;
  const nodes: GraphNode[] = [{ id: rootId, type: "root" }];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>([[rootId, nodes[0]]]);
  const dirToFiles = new Map<string, string[]>();

  const addNode = (id: string, type: GraphNode["type"], parent?: string) => {
    if (nodeMap.has(id)) return;
    const node: GraphNode = parent ? { id, type, parent } : { id, type };
    nodeMap.set(id, node);
    nodes.push(node);
    if (parent) {
      links.push({ source: parent, target: id, type: "hierarchy" });
    }
  };

  const ensureDirChain = (fullPath: string) => {
    if (!fullPath) return rootId;
    const segments = fullPath.split("/").filter(Boolean);
    let currentParent = rootId;
    segments.forEach((_, idx) => {
      const id = segments.slice(0, idx + 1).join("/");
      addNode(id, "directory", idx === 0 ? rootId : segments.slice(0, idx).join("/"));
      currentParent = id;
    });
    return currentParent;
  };

  for (const entry of entries) {
    const cleanedPath = entry.path.replace(/^\//, "");
    if (!cleanedPath) continue;

    const parentPath = cleanedPath.includes("/")
      ? cleanedPath.slice(0, cleanedPath.lastIndexOf("/"))
      : "";

    const parentId = ensureDirChain(parentPath);

    if (entry.type === "tree") {
      addNode(cleanedPath, "directory", parentId || rootId);
      continue;
    }

    if (entry.type === "blob") {
      addNode(cleanedPath, "file", parentId || rootId);
      if (!dirToFiles.has(parentId)) dirToFiles.set(parentId, []);
      dirToFiles.get(parentId)!.push(cleanedPath);
    }
  }

  const meshSeen = new Set<string>();
  dirToFiles.forEach((files) => {
    for (let i = 0; i < files.length; i += 1) {
      for (let j = i + 1; j < files.length; j += 1) {
        const [a, b] = [files[i], files[j]];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (meshSeen.has(key)) continue;
        meshSeen.add(key);
        links.push({ source: a, target: b, type: "mesh" });
      }
    }
  });

  return { nodes, links };
}
