import type { ReactNode } from "react";
import type { GraphData } from "three-forcegraph";
import type ThreeForceGraphType from "three-forcegraph";

export type ApologyMessageProps = {
  show: boolean;
};

export type CompositeGlitchSceneProps = {
  active: boolean;
  terminalScript?: { at: number; line: string }[];
  terminalScriptKey?: string | number;
};

export type FileState = {
  loading: boolean;
  content?: string;
  error?: string;
  visible?: boolean;
};

export type RepoNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: RepoNode[];
};

export type RepoTree = RepoNode[];

export type ForceGraphInstance = ThreeForceGraphType<GraphNode, GraphLink>;

export type GameOfLifeCanvasProps = {
  runDurationMs?: number;
  className?: string;
};

export type Gist = {
  id: string;
  description: string;
  files: string[];
  created_at: string;
  url: string;
};

export type GitHubUserStats = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
};

export type GlitchOverlayProps = {
  active: boolean;
};

export type GraphLink = {
  source: string;
  target: string;
  type: "hierarchy" | "mesh";
};

export type GraphNode = {
  id: string;
  type: "root" | "directory" | "file";
  parent?: string;
  x?: number;
  y?: number;
  z?: number;
};

export type GraphPayload = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export type MeshNode = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  brightness: number;
  phase: number;
  velocityX: number;
  velocityY: number;
  spikeTimer: number;
};

export type MockTerminalProps = {
  className?: string;
  script?: { at: number; line: string }[];
  scriptKey?: string | number;
  greet?: boolean;
};

export type Mode = "HOME" | "GLITCH" | "TERMINAL";

export type NeuralMeshProps = {
  className?: string;
  /** Set to 120 to allow a higher frame rate; defaults to 60fps cap. */
  targetFps?: 60 | 120;
};

export type Particle = {
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

export type Phase = "toSeven" | "holdSeven" | "toWord" | "holdWord";

export type Point = { x: number; y: number };

export type RepoGraphProps = {
  data: GraphData<GraphNode, GraphLink> | null;
};

export type SplashGateProps = {
  children: ReactNode;
  onComplete?: () => void;
  debugLabel?: string;
};

export type UserSettings = {
  displaySplash: boolean;
  displayGlitch: boolean;
  theme: "dark" | "light";
};

export type CarouselPage = {
  path: string;
  label: string;
};
