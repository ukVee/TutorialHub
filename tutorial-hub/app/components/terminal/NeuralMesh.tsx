"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MeshNode, NeuralMeshProps } from "../../lib/types";

const GRID_SPACING = 120;
const MAX_FORCE_DISTANCE = 250;
const DAMPING = 0.9;
const SPRING_STRENGTH = 0.0028;
const RESET_INTERVAL_MIN = 60000;
const RESET_INTERVAL_MAX = 120000;
const SPIKE_INTERVAL_MIN = 3000;
const SPIKE_INTERVAL_MAX = 12000;
const SPIKE_DECAY = 0.0011;
const SHAKE_DURATION = 10000; // ms
const SHAKE_INTENSITY = 0.35;
const BACKGROUND = "#04030a";

export default function NeuralMesh({ className = "", targetFps = 60 }: NeuralMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const nodesRef = useRef<MeshNode[]>([]);
  const gridRef = useRef<{ cols: number; rows: number; spacing: number }>({
    cols: 0,
    rows: 0,
    spacing: GRID_SPACING,
  });
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const frameRef = useRef<number | null>(null);
  const lastRenderRef = useRef<number>(0);
  const nextSpikeRef = useRef<number>(0);
  const nextResetRef = useRef<number>(0);
  const resetWindowRef = useRef<{ active: boolean; startedAt: number; duration: number }>({
    active: false,
    startedAt: 0,
    duration: 1400,
  });
  const shakeWindowRef = useRef<{ active: boolean; until: number }>({ active: false, until: 0 });
  const resizeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const updateTimers = (now: number) => {
      nextSpikeRef.current = now + randomRange(SPIKE_INTERVAL_MIN, SPIKE_INTERVAL_MAX);
      nextResetRef.current = now + randomRange(RESET_INTERVAL_MIN, RESET_INTERVAL_MAX);
    };

    const setup = () => {
      resizeCanvas();
      updateTimers(performance.now());
      frameRef.current = requestAnimationFrame(step);
    };

    const resizeCanvas = () => {
      if (!canvasRef.current || !ctxRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildGrid(rect.width, rect.height);
    };

    const debouncedResize = () => {
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = window.setTimeout(resizeCanvas, 120);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    setup();
    window.addEventListener("resize", debouncedResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFps]);

  const rebuildGrid = (width: number, height: number) => {
    const spacing = GRID_SPACING;
    const cols = Math.max(2, Math.ceil(width / spacing));
    const rows = Math.max(2, Math.ceil(height / spacing));
    gridRef.current = { cols, rows, spacing };

    const nodes: MeshNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c / (cols - 1 || 1)) * width;
        const y = (r / (rows - 1 || 1)) * height;
        nodes.push({
          baseX: x,
          baseY: y,
          x,
          y,
          brightness: 0.45,
          phase: Math.random() * Math.PI * 2,
          velocityX: 0,
          velocityY: 0,
          spikeTimer: 0,
        });
      }
    }
    nodesRef.current = nodes;
  };

  const spikeRandomNode = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes.length) return;
    const pickIndex = () => Math.floor(Math.random() * nodes.length);

    // First spike always fires.
    triggerSpike(pickIndex(), 4.2);

    // Chain reactions: 50% chance for the first follow-up, then 25% for each further link.
    let chainProb = 0.5;
    while (Math.random() < chainProb) {
      triggerSpike(pickIndex(), 3.4);
      chainProb = 0.25;
    }
  }, []);

  const shakeAllNodes = useCallback((now: number) => {
    const nodes = nodesRef.current;
    if (!nodes.length) return;
    nodes.forEach((n) => {
      n.velocityX += (Math.random() - 0.5) * 2;
      n.velocityY += (Math.random() - 0.5) * 2;
    });
    shakeWindowRef.current = { active: true, until: now + SHAKE_DURATION };
  }, []);

  useEffect(() => {
    const handleSpike = () => spikeRandomNode();
    const handleShake = () => shakeAllNodes(performance.now());

    window.addEventListener("terminal-spike", handleSpike);
    window.addEventListener("terminal-shake", handleShake);

    return () => {
      window.removeEventListener("terminal-spike", handleSpike);
      window.removeEventListener("terminal-shake", handleShake);
    };
  }, [shakeAllNodes, spikeRandomNode]);

  const triggerSpike = (index: number, impulseScale = 1) => {
    const { cols } = gridRef.current;
    const nodes = nodesRef.current;
    if (!nodes.length) return;

    const mark = (idx: number) => {
      const node = nodes[idx];
      if (!node) return;
      node.spikeTimer = 1;
      node.velocityX += randomRange(-0.6, 0.6) * impulseScale;
      node.velocityY += randomRange(-0.6, 0.6) * impulseScale;
    };

    mark(index);
    const row = Math.floor(index / cols);
    const col = index % cols;
    const neighbors = [
      index - 1,
      index + 1,
      index - cols,
      index + cols,
      (row - 1) * cols + (col - 1),
      (row - 1) * cols + (col + 1),
      (row + 1) * cols + (col - 1),
      (row + 1) * cols + (col + 1),
    ];
    neighbors.forEach((n, i) => {
      if (n >= 0 && n < nodes.length) {
        const falloff = i < 4 ? 0.7 : 0.5;
        mark(n);
        nodes[n].velocityX *= falloff;
        nodes[n].velocityY *= falloff;
      }
    });

    const origin = nodes[index];
    if (origin) {
      for (let i = 0; i < nodes.length; i++) {
        if (i === index) continue;
        const node = nodes[i];
        const dx = node.x - origin.x;
        const dy = node.y - origin.y;
        const dist = Math.hypot(dx, dy) || 1;
        const influence = Math.max(0, 1 - dist / 220);
        if (influence <= 0) continue;
        const push = 0.4 * impulseScale * influence;
        node.velocityX += (dx / dist) * push;
        node.velocityY += (dy / dist) * push;
      }
    }
  };

  const beginReset = (now: number) => {
    resetWindowRef.current = { active: true, startedAt: now, duration: 1400 };
  };

  const step = (timestamp: number) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const interval = 1000 / (targetFps || 60);
    if (timestamp - lastRenderRef.current < interval) {
      frameRef.current = requestAnimationFrame(step);
      return;
    }
    const delta = Math.min(timestamp - lastRenderRef.current, 1000);
    lastRenderRef.current = timestamp;

    const nodes = nodesRef.current;
    if (!nodes.length) {
      frameRef.current = requestAnimationFrame(step);
      return;
    }

    if (timestamp >= nextSpikeRef.current) {
      triggerSpike(Math.floor(Math.random() * nodes.length));
      nextSpikeRef.current = timestamp + randomRange(SPIKE_INTERVAL_MIN, SPIKE_INTERVAL_MAX);
    }

    if (timestamp >= nextResetRef.current) {
      beginReset(timestamp);
      nextResetRef.current = timestamp + randomRange(RESET_INTERVAL_MIN, RESET_INTERVAL_MAX);
    }

    const reset = resetWindowRef.current;
    const resetT =
      reset.active && reset.duration > 0
        ? Math.min((timestamp - reset.startedAt) / reset.duration, 1)
        : 0;
    if (reset.active && resetT >= 1) {
      resetWindowRef.current.active = false;
    }

    updateNodes(nodes, delta, resetT, timestamp);
    drawScene(ctx, nodes, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

    frameRef.current = requestAnimationFrame(step);
  };

  const updateNodes = (nodes: MeshNode[], deltaMs: number, resetT: number, timeMs: number) => {
    const dt = deltaMs / 16.666;
    const mouse = mouseRef.current;
    const { cols } = gridRef.current;
    const shaking = shakeWindowRef.current;
    const shakeActive = shaking.active && timeMs < shaking.until;
    if (shakeActive === false && shaking.active) {
      shakeWindowRef.current.active = false;
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Spring back to base (stronger during reset).
      const spring = SPRING_STRENGTH * (resetT > 0 ? 1.8 : 1);
      const ax = (node.baseX - node.x) * spring;
      const ay = (node.baseY - node.y) * spring;

      // Cursor gravity.
      let fx = 0;
      let fy = 0;
      if (mouse.active) {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_FORCE_DISTANCE && dist > 0.001) {
          const pull = (1 - dist / MAX_FORCE_DISTANCE) * 0.06;
          fx += (dx / dist) * pull;
          fy += (dy / dist) * pull;
        }
      }

      if (shakeActive) {
        fx += (Math.random() - 0.5) * SHAKE_INTENSITY;
        fy += (Math.random() - 0.5) * SHAKE_INTENSITY;
      }

      node.velocityX = (node.velocityX + ax + fx) * DAMPING;
      node.velocityY = (node.velocityY + ay + fy) * DAMPING;

      node.x += node.velocityX * dt;
      node.y += node.velocityY * dt;

      // Breathing brightness baseline.
      const breathe = 0.08 * Math.sin(timestampSeed(cols, i) + timeMs * 0.0015);
      node.brightness = 0.5 + breathe;

      if (node.spikeTimer > 0) {
        node.spikeTimer = Math.max(0, node.spikeTimer - SPIKE_DECAY * deltaMs);
      }
    }
  };

  const drawScene = (
    ctx: CanvasRenderingContext2D,
    nodes: MeshNode[],
    width: number,
    height: number
  ) => {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    const { cols, rows } = gridRef.current;
    const lineHue = 278;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const node = nodes[idx];
        if (!node) continue;

        // Connect to right and bottom neighbors to avoid duplicate lines.
        const rightIdx = r * cols + (c + 1);
        const downIdx = (r + 1) * cols + c;

        if (rightIdx < nodes.length) {
          const neighbor = nodes[rightIdx];
          const alpha = Math.min(
            0.35,
            (node.brightness + neighbor.brightness) * 0.15 +
              (node.spikeTimer + neighbor.spikeTimer) * 0.25
          );
          ctx.strokeStyle = `hsla(${lineHue}, 70%, 60%, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(neighbor.x, neighbor.y);
          ctx.stroke();
        }

        if (downIdx < nodes.length) {
          const neighbor = nodes[downIdx];
          const alpha = Math.min(
            0.35,
            (node.brightness + neighbor.brightness) * 0.15 +
              (node.spikeTimer + neighbor.spikeTimer) * 0.25
          );
          ctx.strokeStyle = `hsla(${lineHue}, 70%, 60%, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(neighbor.x, neighbor.y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes.
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const spikeBoost = node.spikeTimer * 0.9;
      const radius = 2.2 + spikeBoost * 1.4;
      const luminance = Math.min(1, node.brightness + spikeBoost);
      ctx.beginPath();
      ctx.fillStyle = `hsla(280, 90%, ${45 + luminance * 35}%, ${0.65 + luminance * 0.3})`;
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full absolute inset-0 pointer-events-none ${className}`}
    />
  );
}

const timestampSeed = (cols: number, index: number) => {
  const row = Math.floor(index / (cols || 1));
  const col = index % (cols || 1);
  return (row * 17 + col * 13) * 0.35;
};

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
