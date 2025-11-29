"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type MockTerminalProps = {
  className?: string;
};

const IDLE_MIN = 20000;
const IDLE_MAX = 40000;
const MAX_HISTORY = 200;

export default function MockTerminal({ className = "" }: MockTerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "[system] booting tutorial hub interface...",
    "[system] mesh sync online",
  ]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);

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
      help: () => {
        return `
Available commands:
  spike   – Trigger a random node spike
  shake   – Vibrate all nodes
  help    – Show this help menu`;
      },
    }),
    []
  );

  useEffect(() => {
    focusInput();
    scheduleIdleLog();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [history]);

  const focusInput = () => {
    containerRef.current?.focus();
  };

  const scrollToBottom = () => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const scheduleIdleLog = () => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    const delay = randomRange(IDLE_MIN, IDLE_MAX);
    idleTimerRef.current = window.setTimeout(() => {
      const generator = idleGenerators[Math.floor(Math.random() * idleGenerators.length)];
      appendHistory(generator());
      scheduleIdleLog();
    }, delay);
  };

  const appendHistory = (line: string) => {
    setHistory((prev) => {
      const next = [...prev, line].slice(-MAX_HISTORY);
      return next;
    });
  };

  const executeCommand = (command: string) => {
    const handler = commands[command];
    if (!handler) {
      appendHistory(`[error] unknown command: ${command}`);
      return;
    }

    const output = handler();
    if (output) appendHistory(output);
  };

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
      className={`w-full max-w-2xl rounded-xl border border-[#2a1f44] bg-[#0a0a0d]/95 shadow-[0_0_25px_rgba(120,70,255,0.35)] backdrop-blur-md px-4 py-3 text-sm text-[#d1c5ff] outline-none focus:outline-none relative ${className}`}
      style={{
        boxShadow:
          "0 0 25px rgba(120,70,255,0.35), inset 0 0 24px rgba(80,40,160,0.18), 0 0 4px rgba(190,120,255,0.45)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
        <CanvasGlow />
      </div>
      <div className="relative flex items-center gap-2 mb-2 text-xs uppercase tracking-[0.24em] text-[#9f8bff]">
        <div className="h-2 w-2 rounded-full bg-[#7c5bff] shadow-[0_0_8px_rgba(124,91,255,0.8)]" />
        Tutorial Hub Terminal
      </div>
      <div
        ref={logRef}
        className="relative h-64 overflow-y-auto rounded-lg bg-black/30 px-3 py-2 font-mono text-[13px] leading-relaxed shadow-inner border border-[#1c1434]"
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
