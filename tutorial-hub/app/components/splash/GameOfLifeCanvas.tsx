"use client";

import { useEffect, useRef } from "react";

type GameOfLifeCanvasProps = {
  runDurationMs?: number;
  className?: string;
};

type Point = { x: number; y: number };

type Phase = "toSeven" | "holdSeven" | "toWord" | "holdWord";

type Particle = {
  id: number;
  x: number;
  y: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  size: number;
  delay: number;
};

const DEFAULT_RUN = 4000;
const MIN_PARTICLES = 800;
const MAX_PARTICLES = 2000;

export default function GameOfLifeCanvas({
  runDurationMs = DEFAULT_RUN,
  className = "",
}: GameOfLifeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const phaseRef = useRef<{ current: Phase; startedAt: number; duration: number }>({
    current: "toSeven",
    startedAt: 0,
    duration: 0,
  });

  const particlesRef = useRef<Particle[]>([]);
  const sevenTargetsRef = useRef<Point[]>([]);
  const wordTargetsRef = useRef<Point[]>([]);
  const viewportRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const durationsRef = useRef<{
    toSeven: number;
    holdSeven: number;
    toWord: number;
    holdWord: number;
    total: number;
  }>({
    toSeven: 0,
    holdSeven: 0,
    toWord: 0,
    holdWord: 0,
    total: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      viewportRef.current = { width, height };
      rebuildScene(); // recompute particles/targets to match new viewport
    };

    const computeDurations = () => {
      // User-requested holds.
      const holdSeven = 500;
      const holdWord = 1500;

      // Remaining time budget for motion.
      const remaining = Math.max(runDurationMs - holdSeven - holdWord, 500);
      let toSeven = Math.max(700, remaining * 0.55);
      let toWord = Math.max(600, remaining - toSeven);

      const total = toSeven + holdSeven + toWord + holdWord;
      if (total > runDurationMs) {
        const motionScale = (runDurationMs - holdSeven - holdWord) / (toSeven + toWord);
        toSeven *= motionScale;
        toWord *= motionScale;
      }

      durationsRef.current = {
        toSeven,
        holdSeven,
        toWord,
        holdWord,
        total: toSeven + holdSeven + toWord + holdWord,
      };
    };

    const rebuildScene = () => {
      const { width, height } = viewportRef.current;
      if (!width || !height) return;

      computeDurations();
      const particleCount = clamp(
        Math.floor((width * height) / 1500),
        MIN_PARTICLES,
        MAX_PARTICLES
      );

      particlesRef.current = createParticles(particleCount, width, height);
      sevenTargetsRef.current = normalizeTargetCount(
        generateSevenPath(width, height),
        particleCount
      );
      wordTargetsRef.current = normalizeTargetCount(
        rasterizeTextToPoints("TutorialHub", width, height),
        particleCount
      );

      assignParticlesToTargets(particlesRef.current, sevenTargetsRef.current, {
        resetSources: true,
      });

      startRef.current = null;
      phaseRef.current = {
        current: "toSeven",
        startedAt: 0,
        duration: durationsRef.current.toSeven,
      };
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const step = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
        phaseRef.current.startedAt = timestamp;
      }

      const elapsed = timestamp - (startRef.current ?? timestamp);
      const { toSeven, holdSeven, toWord, holdWord, total } = durationsRef.current;

      // Decide which phase we are in based on timeline.
      let nextPhase: Phase = phaseRef.current.current;
      if (elapsed < toSeven) {
        nextPhase = "toSeven";
      } else if (elapsed < toSeven + holdSeven) {
        nextPhase = "holdSeven";
      } else if (elapsed < toSeven + holdSeven + toWord) {
        nextPhase = "toWord";
      } else if (elapsed < total) {
        nextPhase = "holdWord";
      } else {
        nextPhase = "holdWord";
      }

      if (nextPhase !== phaseRef.current.current) {
        phaseRef.current = {
          current: nextPhase,
          startedAt: timestamp,
          duration:
            nextPhase === "toSeven"
              ? toSeven
              : nextPhase === "holdSeven"
              ? holdSeven
              : nextPhase === "toWord"
              ? toWord
              : holdWord,
        };

        if (nextPhase === "toWord") {
          assignParticlesToTargets(particlesRef.current, wordTargetsRef.current, {
            resetSources: true,
          });
        }
      }

      drawFrame(timestamp);

      if (elapsed < runDurationMs) {
        animationRef.current = window.requestAnimationFrame(step);
      }
    };

    animationRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [runDurationMs]);

  const drawFrame = (timestamp: number) => {
    const ctx = ctxRef.current;
    const particles = particlesRef.current;
    const { width, height } = viewportRef.current;
    if (!ctx || !width || !height) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const phase = phaseRef.current;
    const phaseProgress = clamp(
      (timestamp - phase.startedAt) / (phase.duration || 1),
      0,
      1
    );

    const hueBase = 278;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const t = applyDelay(phaseProgress, p.delay);
      const eased = easeInOutCubic(t);

      const isHold = phase.current === "holdSeven" || phase.current === "holdWord";

      if (isHold) {
        // Keep particles at target with subtle shimmer.
        const wobble =
          Math.sin((timestamp * 0.004 + p.id * 13) * 0.8) * 0.6 +
          Math.cos((timestamp * 0.002 + p.id * 7) * 0.6) * 0.4;
        p.x = p.targetX + wobble;
        p.y = p.targetY + wobble * 0.5;
      } else {
        p.x = lerp(p.sourceX, p.targetX, eased);
        p.y = lerp(p.sourceY, p.targetY, eased);
      }

      const brightness = 60 + eased * 35;
      const alpha = 0.7 + eased * 0.3;
      ctx.fillStyle = `hsla(${hueBase - p.delay * 40}, 95%, ${brightness}%, ${alpha})`;
      const size = p.size * (isHold ? 1.05 : 1);
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
  };

  return <canvas ref={canvasRef} className={`gol-canvas ${className}`} />;
}

// --- Particle + target helpers ------------------------------------------------

function createParticles(count: number, width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  const cornerSpread = Math.max(40, Math.min(width, height) * 0.12);

  for (let i = 0; i < count; i++) {
    const fromTopRight = i % 2 === 0;
    const baseX = fromTopRight ? width - cornerSpread : 0;
    const baseY = fromTopRight ? 0 : height - cornerSpread;
    const x = baseX + randomRange(-cornerSpread * 0.4, cornerSpread);
    const y = baseY + randomRange(-cornerSpread * 0.4, cornerSpread);
    const size = randomRange(1.2, 2.6);

    particles.push({
      id: i,
      x,
      y,
      sourceX: x,
      sourceY: y,
      targetX: width / 2,
      targetY: height / 2,
      size,
      delay: Math.random() * 0.35,
    });
  }

  return particles;
}

function assignParticlesToTargets(
  particles: Particle[],
  targets: Point[],
  options: { resetSources?: boolean } = {}
) {
  if (!targets.length) return;

  const pool = [...targets];
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const closestIndex = findNearestIndex(p, pool);
    const chosen = closestIndex >= 0 ? pool.splice(closestIndex, 1)[0] : targets[i % targets.length];

    if (options.resetSources) {
      p.sourceX = p.x;
      p.sourceY = p.y;
    }
    p.targetX = chosen.x + randomRange(-0.6, 0.6);
    p.targetY = chosen.y + randomRange(-0.6, 0.6);
  }
}

function findNearestIndex(particle: Point, targets: Point[]): number {
  let minIdx = -1;
  let minDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const dx = t.x - particle.x;
    const dy = t.y - particle.y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
    if (minDist === 0) break;
  }

  return minIdx;
}

function generateSevenPath(width: number, height: number): Point[] {
  const barWidth = width * 0.64;
  const offsetX = (width - barWidth) / 2;
  const topY = height * 0.26;
  const stroke = Math.max(10, Math.min(width, height) * 0.018);
  const spacing = Math.max(4, stroke * 0.55);
  const points: Point[] = [];

  // Top horizontal bar.
  for (let x = 0; x <= barWidth; x += spacing) {
    for (let y = -stroke / 2; y <= stroke / 2; y += spacing) {
      points.push({ x: offsetX + x, y: topY + y });
    }
  }

  // Diagonal stroke heading down to the left (proper "7" orientation).
  const diagStart: Point = { x: offsetX + barWidth * 0.92, y: topY + stroke * 0.5 };
  const diagEnd: Point = { x: offsetX + barWidth * 0.12, y: topY + height * 0.46 };
  const dx = diagEnd.x - diagStart.x;
  const dy = diagEnd.y - diagStart.y;
  const length = Math.hypot(dx, dy) || 1;
  const steps = Math.max(1, Math.floor(length / spacing));

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const baseX = diagStart.x + dx * t;
    const baseY = diagStart.y + dy * t;

    for (let w = -stroke / 2; w <= stroke / 2; w += spacing * 0.8) {
      const nx = -dy / length;
      const ny = dx / length;
      points.push({ x: baseX + nx * w, y: baseY + ny * w });
    }
  }

  return points;
}

function rasterizeTextToPoints(text: string, canvasWidth: number, canvasHeight: number): Point[] {
  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d");
  if (!ctx) return [];

  ctx.font = "bold 80px sans-serif";
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(
    (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 80 * 0.3)
  );

  const margin = 16;
  offscreen.width = textWidth + margin * 2;
  offscreen.height = textHeight + margin * 2;

  ctx.font = "bold 80px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.fillText(text, margin, margin);

  const data = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;

  const points: Point[] = [];
  const stride = 3; // pixel sampling stride to control density

  for (let y = 0; y < offscreen.height; y += stride) {
    for (let x = 0; x < offscreen.width; x += stride) {
      const idx = (y * offscreen.width + x) * 4 + 3;
      if (data[idx] > 128) {
        points.push({ x, y });
      }
    }
  }

  // Scale points to fit canvas nicely.
  const desiredWidth = canvasWidth * 0.7;
  const desiredHeight = canvasHeight * 0.32;
  const scale = Math.min(desiredWidth / offscreen.width, desiredHeight / offscreen.height);

  const offsetX = (canvasWidth - offscreen.width * scale) / 2;
  const offsetY = canvasHeight * 0.33;

  return points.map((p) => ({
    x: offsetX + p.x * scale,
    y: offsetY + p.y * scale,
  }));
}

function normalizeTargetCount(points: Point[], desired: number): Point[] {
  if (!points.length) return [];
  if (points.length === desired) return [...points];

  if (points.length > desired) {
    const step = points.length / desired;
    return Array.from({ length: desired }, (_, i) => points[Math.floor(i * step)]);
  }

  const extended = [...points];
  let idx = 0;
  while (extended.length < desired) {
    extended.push(points[idx % points.length]);
    idx++;
  }
  return extended;
}

// --- Math helpers ------------------------------------------------------------

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const applyDelay = (progress: number, delay: number) =>
  clamp((progress - delay) / (1 - delay || 1), 0, 1);

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
