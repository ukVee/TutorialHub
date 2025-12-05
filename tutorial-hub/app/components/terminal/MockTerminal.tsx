"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { MockTerminalProps } from "../../lib/types";

const IDLE_MIN = 20000;
const IDLE_MAX = 40000;
const MAX_HISTORY = 200;

export default function MockTerminal({
  className = "",
  script = [],
  scriptKey,
  greet = false,
  onOpenExplorer,
  fullSize = false,
}: MockTerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "[system] booting tutorial hub interface...",
    "[system] mesh sync online",
    ...(greet ? ["[message] Welcome valued user, type 'help' to get started."] : []),
  ]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const scriptTimersRef = useRef<number[]>([]);

  const idleGenerators = useMemo(
    () => [
      () => "[log] inference spike detected",
      () => "[log] idle cycle sync: complete",
      () => `[log] vector drift <${randomFloat(0.01, 0.99).toFixed(3)}>`,
      () => "[log] listening...",
      () => `[log] mesh temperature nominal`,
      () => `[log] heartbeat ${Math.floor(performance.now()).toString(16)}`,
    ],
    []
  );

  const commands = useMemo<Record<string, () => string | void>>(
    () => ({
      spike: () => {
        window.dispatchEvent(new CustomEvent("terminal-spike"));
        return "Spiking a random node...";
      },
      shake: () => {
        window.dispatchEvent(new CustomEvent("terminal-shake"));
        return "Shaking all nodes...";
      },
      ls: () => "file_explorer.exe",
      file_explorer: () => {
        onOpenExplorer?.();
        return "Opening file explorer...";
      },
      fileexplorer: () => {
        onOpenExplorer?.();
        return "Opening file explorer...";
      },
      help: () => {
        return `
Available commands:
  spike   – Trigger a random node spike
  shake   – Vibrate all nodes
  ls      – List binaries
  file_explorer – Open the file explorer
  help    – Show this help menu`;
      },
    }),
    [onOpenExplorer]
  );

  const appendHistory = useCallback((line: string) => {
    setHistory((prev) => {
      const next = [...prev, line].slice(-MAX_HISTORY);
      return next;
    });
  }, []);

  const focusInput = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const scheduleIdleLog = useCallback(function scheduleIdleLogInner() {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    const delay = randomRange(IDLE_MIN, IDLE_MAX);
    idleTimerRef.current = window.setTimeout(() => {
      const generator = idleGenerators[Math.floor(Math.random() * idleGenerators.length)];
      appendHistory(generator());
      scheduleIdleLogInner();
    }, delay);
  }, [appendHistory, idleGenerators]);

  const executeCommand = useCallback(
    (command: string) => {
      const handler = commands[command];
      if (!handler) {
        appendHistory(`[error] unknown command: ${command}`);
        return;
      }

      const output = handler();
      if (output) appendHistory(output);
    },
    [appendHistory, commands]
  );

  useEffect(() => {
    focusInput();
    scheduleIdleLog();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      scriptTimersRef.current.forEach((t) => window.clearTimeout(t));
      scriptTimersRef.current = [];
    };
  }, [focusInput, scheduleIdleLog]);

  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [history, scrollToBottom]);

  // Run scripted lines (used by glitch/terminal sequence)
  useEffect(() => {
    scriptTimersRef.current.forEach((t) => window.clearTimeout(t));
    scriptTimersRef.current = [];
    if (!script?.length) return;

    script.forEach(({ at, line }) => {
      const timer = window.setTimeout(() => appendHistory(line), Math.max(0, at));
      scriptTimersRef.current.push(timer);
    });

    return () => {
      scriptTimersRef.current.forEach((t) => window.clearTimeout(t));
      scriptTimersRef.current = [];
    };
  }, [appendHistory, script, scriptKey]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.key === "Backspace") {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (e.key === "Enter") {
      appendHistory(`> ${input || ""}`);
      const command = input.trim().toLowerCase();
      if (command) {
        executeCommand(command);
      }
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
      className={`w-full ${fullSize ? "h-full min-h-[520px] max-w-none" : "max-w-2xl"} rounded-xl border border-[#2a1f44] bg-[#0a0a0d]/95 shadow-[0_0_25px_rgba(120,70,255,0.35)] backdrop-blur-md px-4 py-3 text-sm text-[#d1c5ff] outline-none focus:outline-none relative flex flex-col gap-3 ${className}`}
      style={{
        boxShadow:
          "0 0 25px rgba(120,70,255,0.35), inset 0 0 24px rgba(80,40,160,0.18), 0 0 4px rgba(190,120,255,0.45)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
        <CanvasGlow />
      </div>
      <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#9f8bff]">
        <div className="h-2 w-2 rounded-full bg-[#7c5bff] shadow-[0_0_8px_rgba(124,91,255,0.8)]" />
        Tutorial Hub Terminal
      </div>
      <div
        ref={logRef}
        className={`relative overflow-y-auto rounded-lg bg-black/30 px-3 py-2 font-mono text-[13px] leading-relaxed shadow-inner border border-[#1c1434] ${
          fullSize ? "flex-1 min-h-[360px]" : "h-64"
        }`}
      >
        {history.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
        <div className="flex">
          <span className="text-[#7c5bff] mr-2">&gt;</span>
          <span>{input}</span>
          <CaretCanvas />
        </div>
      </div>
    </div>
  );
}

function CanvasGlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const draw = () => {
      const ctx2d = ctx;
      const { width, height } = canvas;
      ctx2d.clearRect(0, 0, width, height);
      const gradient = ctx2d.createRadialGradient(
        width * 0.5,
        height * 0.4,
        10,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(140,100,255,0.12)");
      gradient.addColorStop(1, "rgba(20,10,40,0)");
      ctx2d.fillStyle = gradient;
      ctx2d.fillRect(0, 0, width, height);
      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function CaretCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastToggleRef = useRef<number>(0);
  const visibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 10;
    canvas.height = 16;

    const draw = (ts: number) => {
      if (ts - lastToggleRef.current > 550) {
        visibleRef.current = !visibleRef.current;
        lastToggleRef.current = ts;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (visibleRef.current) {
        ctx.fillStyle = "#b48cff";
        ctx.shadowColor = "rgba(180,140,255,0.8)";
        ctx.shadowBlur = 6;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 0;
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="ml-1 mt-[2px]" />;
}

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomFloat = (min: number, max: number) => randomRange(min, max);
