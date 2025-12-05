"use client";

import type { RepoContentEntry, RepoNode } from "./types";

const BASE = (process.env.NODE_ENV === "production"
  ? "https://tutorial-hub-backend.vercel.app"
  : "http://localhost:4000").replace(/\/+$/, "");

export const apiUrl = (path: string) => `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(apiUrl(path), {
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });

  if (res.ok) {
    return res.json() as Promise<T>;
  }

  let body: unknown = undefined;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  const message = typeof body === "string" ? body : JSON.stringify(body);
  throw new Error(`Request failed (${res.status})${message ? `: ${message}` : ""}`);
}

// GitHub content helpers (moved from githubClient.ts)
const DEFAULT_REPO = "i3-scripts";

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
  return `${apiUrl(`/api/github/repos/${encodedRepo}/contents`)}${query}`;
};

const fileUrl = (repo: string, path: string) => {
  const encodedRepo = encodeURIComponent(repo);
  const query = `?filepath=${encodeURIComponent(path)}`;
  return `${apiUrl(`/api/github/repos/${encodedRepo}/file`)}${query}`;
};

const fileStreamUrl = (repo: string, path: string, start?: number) => {
  const encodedRepo = encodeURIComponent(repo);
  const params = new URLSearchParams({ filepath: path });
  if (typeof start === "number" && start > 0) params.set("start", String(start));
  return `${apiUrl(`/api/github/repos/${encodedRepo}/file/stream`)}?${params.toString()}`;
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

export async function listRepoTree(
  repo: string = DEFAULT_REPO,
  options: { signal?: AbortSignal; concurrency?: number } = {},
): Promise<RepoNode[]> {
  const root: RepoNode = { name: "", path: "", type: "dir", children: [] };
  const queue: Array<{ node: RepoNode; path: string }> = [{ node: root, path: "" }];
  const inFlight = new Set<Promise<void>>();
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 8));

  const process = async (current: { node: RepoNode; path: string }) => {
    const { node, path } = current;
    const entries = await fetchDirectory(repo, path, options.signal);

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
  };

  const launch = () => {
    while (queue.length && inFlight.size < concurrency) {
      const next = queue.shift()!;
      const task = process(next).finally(() => inFlight.delete(task));
      inFlight.add(task);
    }
  };

  launch();
  while (inFlight.size) {
    await Promise.race(inFlight);
    launch();
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
  const res = await fetch(fileUrl(repo, path), {
    cache: "no-store",
    signal,
    headers: { Accept: "text/plain" },
  });

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Fetch file ${path} failed (${res.status})${message ? `: ${message}` : ""}`);
  }

  return res.text();
}

export type StreamProgress = {
  receivedBytes: number;
  etag?: string | null;
};

export async function streamFileContent(
  path: string,
  options: {
    repo?: string;
    start?: number;
    signal?: AbortSignal;
    onProgress?: (p: StreamProgress) => void;
    onChunk?: (text: string) => void;
    timeoutMs?: number;
  } = {},
): Promise<StreamProgress> {
  const repo = options?.repo ?? DEFAULT_REPO;
  const url = fileStreamUrl(repo, path, options?.start);
  const timeoutMs = options?.timeoutMs ?? 0;

  const debug = typeof process !== "undefined" && process.env.NEXT_PUBLIC_REPO_TREE_DEBUG === "1";
  if (debug) console.log("stream:start", { url, timeoutMs, start: options?.start ?? 0 });
  const res = await fetch(url, {
    cache: "no-store",
    signal: options.signal,
    headers: { Accept: "text/plain" },
  });

  if (!res.ok && res.status !== 206) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Stream file ${path} failed (${res.status})${message ? `: ${message}` : ""}`);
  }

  if (!res.body) throw new Error("Readable stream not available in response");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let received = options?.start ?? 0;
  const etag = res.headers.get("etag");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value?.length ?? 0;
    const text = decoder.decode(value, { stream: true });
    if (text) options?.onChunk?.(text);
    options?.onProgress?.({ receivedBytes: received, etag });
  }

  const tail = decoder.decode();
  if (tail) options?.onChunk?.(tail);

  return { receivedBytes: received, etag };
}
