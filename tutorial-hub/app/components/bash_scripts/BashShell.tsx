"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type BashShellProps = {
  onOpenExplorer: () => void;
  explorerOpen: boolean;
  onCloseExplorer: () => void;
  explorerSlot: ReactNode;
};

const MAX_HISTORY = 200;

export default function BashShell({ onOpenExplorer, explorerOpen, onCloseExplorer, explorerSlot }: BashShellProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const appendHistory = useCallback((line: string) => {
    setHistory((prev) => [...prev, line].slice(-MAX_HISTORY));
  }, []);

  const focusInput = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history]);

  const runCommand = useCallback((command: string) => {
    const normalized = command.trim();
    if (!normalized) return;

    if (normalized === "clear") {
      setHistory([]);
      return;
    }

    if (normalized === "fileexplorer") {
      onOpenExplorer();
      return;
    }

    appendHistory(`${normalized}: command not found`);
  }, [appendHistory, onOpenExplorer]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (explorerOpen) {
      if (e.key === "Escape") onCloseExplorer();
      return;
    }
    if (e.key === "Backspace") {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (e.key === "Enter") {
      appendHistory(`$ ${input}`);
      runCommand(input);
      setInput("");
      return;
    }
    if (e.key.length === 1 && !e.altKey && !e.metaKey && !e.ctrlKey) {
      setInput((prev) => (prev + e.key).slice(0, 256));
    }
  };

  return (
    <div
      tabIndex={0}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="shell-screen"
    >
      <div className="shell-overlay" aria-hidden="true" />
      <div ref={logRef} className="shell-log" aria-live="polite">
        {!explorerOpen && (
          <>
            {history.map((line, idx) => (
              <div key={idx} className="shell-line">{line}</div>
            ))}
            <div className="shell-prompt">
              <span className="shell-caret">$</span>
              <span className="shell-input">{input}</span>
              <span className="shell-cursor" aria-hidden />
            </div>
          </>
        )}

        {explorerOpen && (
          <div className="explorer-panel">
            <div className="explorer-bar">
              <span className="explorer-title">fileexplorer</span>
              <button className="explorer-close" onClick={onCloseExplorer} aria-label="Close file explorer">
                ✕
              </button>
            </div>
            <div className="explorer-body">{explorerSlot}</div>
          </div>
        )}
      </div>
    </div>
  );
}
