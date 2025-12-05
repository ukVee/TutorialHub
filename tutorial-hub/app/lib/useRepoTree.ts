"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listRepoTree, streamFileContent } from "./api";
import type { FileState, RepoTree } from "./types";

const DEBUG = typeof process !== "undefined" && process.env.NEXT_PUBLIC_REPO_TREE_DEBUG === "1";
const debug = (...args: unknown[]) => {
  if (DEBUG) console.log(...args);
};

export function useRepoTree() {
  const [tree, setTree] = useState<RepoTree>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({});
  const progressRef = useRef<Record<string, { received: number; etag?: string | null }>>({});
  const reqCounterRef = useRef(0);

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

  const toggleFile = useCallback(async (path: string) => {
    debug("file:toggle", { path });
    reqCounterRef.current += 1;
    const requestId = `req-${Date.now()}-${reqCounterRef.current}`;
    let closing = false;

    setFileStates((prev) => {
      const current = prev[path];
      debug("file:setState", { path, current });

      if (current?.visible) {
        closing = true;
        delete progressRef.current[path];
        const cleared = { ...current };
        delete (cleared as Partial<FileState> & { requestId?: string }).requestId;
        return { ...prev, [path]: { ...cleared, visible: false, loading: false } };
      }

      // Reset progress for fresh fetch
      delete progressRef.current[path];

      // Hide any other visible files so only one is active at a time.
      const nextState: Record<string, FileState> = { ...prev };
      Object.entries(prev).forEach(([otherPath, state]) => {
        if (otherPath !== path && state?.visible) {
          nextState[otherPath] = { ...state, visible: false, loading: false };
        }
      });

      return {
        ...nextState,
        [path]: {
          loading: true,
          error: undefined,
          content: current?.content,
          visible: true,
          requestId,
        },
      };
    });

    if (closing) return;
    debug("file:proceed", { path, requestId });

    try {
      let content = "";
      const startOffset = progressRef.current[path]?.received ?? 0;
      debug("file:fetch", { path, startOffset, requestId });
      await streamFileContent(path, {
        start: startOffset,
        timeoutMs: 0,
        onChunk: (chunk) => {
          content += chunk;
          setFileStates((prev) => {
            const current = prev[path];
            if (current?.requestId !== requestId) return prev;
            return {
              ...prev,
              [path]: { ...current, loading: false, content, visible: true, error: undefined },
            };
          });
        },
        onProgress: ({ receivedBytes, etag }) => {
          progressRef.current[path] = { received: receivedBytes, etag };
          debug("file:progress", { path, receivedBytes, etag, requestId });
        },
      });

      delete progressRef.current[path];
      debug("file:done", { path, bytes: content.length, requestId });
      setFileStates((prev) => {
        const current = prev[path];
        if (current?.requestId !== requestId) return prev;
        return {
          ...prev,
          [path]: { ...current, loading: false, content, visible: true, error: undefined },
        };
      });
    } catch (err: unknown) {
      const progress = progressRef.current[path];
      const isAbort = err instanceof Error && err.name === "AbortError";
      const cause = err instanceof Error ? (err as Error & { cause?: unknown }).cause : undefined;
      const reasonValue =
        typeof cause === "string"
          ? cause
          : typeof (err as { reason?: unknown } | null)?.reason === "string"
            ? (err as { reason?: string }).reason
            : typeof err === "string"
              ? err
              : undefined;
      const reason = reasonValue;
      const aborted = isAbort || reason === "user-toggle-close";

      // Silent aborts (e.g., user closed the file) should not surface an error.
      const message = aborted
        ? progress && progress.received > 0
          ? "Stream interrupted, tap to resume."
          : undefined
        : err instanceof Error
          ? err.message
          : "Unable to fetch file.";

      if (!aborted || message) {
        console.error("file:error", {
          path,
          err,
          name: err instanceof Error ? err.name : undefined,
          message: err instanceof Error ? err.message : undefined,
          reason,
        });
      }
      setFileStates((prev) => {
        const current = prev[path];
        if (current?.requestId !== requestId) return prev;
        return {
          ...prev,
          [path]: {
            ...current,
            loading: false,
            error: message,
            visible: message ? true : current.visible,
          },
        };
      });

      // Keep offset for potential resume unless it was a hard failure with zero progress.
      if (!progress || progress.received === 0) {
        delete progressRef.current[path];
      }
    }
  }, []);

  return { tree, loading, error, fileStates, toggleFile };
}
