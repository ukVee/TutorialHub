"use client";

import type { RepoNode } from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/?$/, "");
const DEFAULT_REPO = "i3-scripts";

type RepoContentEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | string;
  size?: number;
  content?: string;
  encoding?: string;
};

const assertOk = async (res: Response, context: string) => {
  if (res.ok) return;
  let body: unknown = undefined;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  throw new Error(`${context} failed (${res.status})${body ? `: ${JSON.stringify(body)}` : ""}`);
};

const directoryUrl = (repo: string, path?: string) => {
  const encodedRepo = encodeURIComponent(repo);
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  return `${API_BASE}/api/github/repos/${encodedRepo}/contents${query}`;
};

async function fetchDirectory(repo: string, path = "", signal?: AbortSignal): Promise<RepoContentEntry[]> {
  const res = await fetch(directoryUrl(repo, path || undefined), {
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });
  await assertOk(res, `List contents ${path || "/"}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Expected directory listing for ${path || "/"}`);
  }
  return data as RepoContentEntry[];
}

async function fetchFile(repo: string, path: string, signal?: AbortSignal): Promise<RepoContentEntry> {
  const res = await fetch(directoryUrl(repo, path), {
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });
  await assertOk(res, `Fetch file ${path}`);
  const data = await res.json();
  if (Array.isArray(data)) {
    throw new Error(`Path ${path} resolved to a directory, expected file`);
  }
  return data as RepoContentEntry;
}

export async function listRepoTree(repo: string = DEFAULT_REPO): Promise<RepoNode[]> {
  const root: RepoNode = { name: "", path: "", type: "dir", children: [] };
  const queue: Array<{ node: RepoNode; path: string }> = [{ node: root, path: "" }];

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    const { node, path } = current;

    const entries = await fetchDirectory(repo, path);

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;

      if (entry.type === "dir") {
        const dirNode: RepoNode = {
          name: entry.name,
          path: entry.path,
          type: "dir",
          children: [],
        };
        node.children?.push(dirNode);
        queue.push({ node: dirNode, path: entry.path });
        continue;
      }

      if (entry.type === "file") {
        const fileNode: RepoNode = {
          name: entry.name,
          path: entry.path,
          type: "file",
          size: entry.size,
        };
        node.children?.push(fileNode);
      }
    }
  }

  const sortNodes = (nodes?: RepoNode[]) => {
    if (!nodes) return;
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    });
    nodes.forEach((child) => sortNodes(child.children));
  };

  sortNodes(root.children);
  return root.children || [];
}

export async function getFileContent(path: string, signal?: AbortSignal, repo: string = DEFAULT_REPO): Promise<string> {
  const entry = await fetchFile(repo, path, signal);

  if (!entry.content || entry.encoding !== "base64") {
    throw new Error(`File ${path} missing base64 content`);
  }

  const normalized = entry.content.replace(/\n/g, "");
  return typeof atob === "function" ? atob(normalized) : Buffer.from(normalized, "base64").toString("utf8");
}
