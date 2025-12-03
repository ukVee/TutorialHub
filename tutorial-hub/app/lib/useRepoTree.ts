"use client";

import { useCallback, useEffect, useState } from "react";
import { getFileContent, listRepoTree } from "./githubClient";
import type { FileState, RepoTree } from "./types";

const FILE_FETCH_TIMEOUT_MS = 10_000;

export function useRepoTree() {
  const [tree, setTree] = useState<RepoTree>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const list = await listRepoTree();
        setTree(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load repository files.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchWithTimeout = useCallback(async (path: string) => {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), FILE_FETCH_TIMEOUT_MS) : null;

    try {
      return await getFileContent(path, controller?.signal);
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  }, []);

  const toggleFile = useCallback(async (path: string) => {
    let action: "fetch" | "hide" | "show" | "noop" = "noop";

    setFileStates((prev) => {
      const current = prev[path];

      if (current?.loading) {
        action = "noop";
        return prev;
      }

      if (current?.visible) {
        action = "hide";
        return { ...prev, [path]: { ...current, visible: false, loading: false } };
      }

      if (current?.content) {
        action = "show";
        return { ...prev, [path]: { ...current, visible: true, error: undefined, loading: false } };
      }

      action = "fetch";
      return { ...prev, [path]: { loading: true, error: undefined, content: undefined, visible: true } };
    });

    if (action !== "fetch") return;

    try {
      const content = await fetchWithTimeout(path);
      setFileStates((prev) => ({
        ...prev,
        [path]: { ...prev[path], loading: false, content, visible: true, error: undefined },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error && err.name === "AbortError"
        ? "Request timed out while fetching file (10s). Please try again."
        : err instanceof Error
          ? err.message
          : "Unable to fetch file.";
      setFileStates((prev) => ({
        ...prev,
        [path]: { ...prev[path], loading: false, error: message, visible: true },
      }));
    }
  }, [fetchWithTimeout]);

  return { tree, loading, error, fileStates, toggleFile };
}
