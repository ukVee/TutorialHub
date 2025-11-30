"use client";

import { useEffect, useState } from "react";
import { RepoFile, getFileContent, listRepoFiles } from "../../lib/githubClient";

type FileState = {
  loading: boolean;
  content?: string;
  error?: string;
};

export default function GitHubScripts() {
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const list = await listRepoFiles("");
        setFiles(list);
      } catch (err: any) {
        setError(err?.message || "Failed to load repository files.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async (path: string) => {
    const current = fileStates[path];

    // If already open, hide it.
    if (current?.content && !current.loading) {
      setFileStates((prev) => ({
        ...prev,
        [path]: { ...current, content: undefined },
      }));
      return;
    }

    if (current?.loading) return;

    setFileStates((prev) => ({
      ...prev,
      [path]: { loading: true },
    }));

    try {
      const content = await getFileContent(path);
      setFileStates((prev) => ({
        ...prev,
        [path]: { loading: false, content },
      }));
    } catch (err: any) {
      setFileStates((prev) => ({
        ...prev,
        [path]: { loading: false, error: err?.message || "Unable to fetch file." },
      }));
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-300">Loading repository files…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-200">{error}</p>;
  }

  if (!files.length) {
    return <p className="text-sm text-slate-400">No files found in i3-scripts.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {files.map((file) => {
        const state = fileStates[file.path];
        const isOpen = Boolean(state?.content);

        return (
          <div key={file.path} className="gist-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white leading-tight">{file.name}</h3>
                <p className="text-xs text-slate-400">{file.size} bytes</p>
              </div>
              <button
                onClick={() => handleToggle(file.path)}
                className="rounded-full border border-slate-700 px-3 py-1 text-[12px] text-slate-100 hover:border-slate-400 transition"
              >
                {state?.content ? "Hide" : state?.loading ? "Loading…" : "View"}
              </button>
            </div>

            {state?.error && <p className="mt-2 text-xs text-rose-200">{state.error}</p>}

            {state?.content && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-black/50 p-3 text-[12px] text-slate-100 whitespace-pre-wrap">
{state.content}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
