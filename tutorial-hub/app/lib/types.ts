import type { ReactNode } from "react";
import type { GraphData } from "three-forcegraph";
import type ThreeForceGraphType from "three-forcegraph";

export type ApologyMessageProps = {
  show: boolean;
};

export type TerminalScriptLine = { at: number; line: string };

export type CompositeGlitchSceneProps = {
  active: boolean;
  terminalScript?: TerminalScriptLine[];
  terminalScriptKey?: string | number;
};

export type FileState = {
  loading: boolean;
  content?: string;
  error?: string;
  visible?: boolean;
  /** Tracks the in-flight request for this file to ignore stale updates. */
  requestId?: string;
};

export type RepoNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: RepoNode[];
};

export type RepoTree = RepoNode[];

export type RepoContentEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | string;
  size?: number;
  content?: string;
  encoding?: string;
};

export type ForceGraphInstance = ThreeForceGraphType<GraphNode, GraphLink>;

export type SplashAnimationCanvasProps = {
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

export type GitHubGist = {
  id: string;
  description: string | null;
  files: Record<string, unknown>;
  created_at: string;
  html_url: string;
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

export type GraphEntry = { path: string; type: "blob" | "tree" };

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
  script?: TerminalScriptLine[];
  scriptKey?: string | number;
  greet?: boolean;
  onOpenExplorer?: () => void;
  fullSize?: boolean;
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

export type RippleTheme = {
  live?: string;
  trail?: string;
};

export type RippleLoadProps = {
  className?: string;
  speedMs?: number;
  theme?: RippleTheme;
  ariaLabel?: string;
};

export type CarouselPage = {
  path: string;
  label: string;
};

export type SwipeHandlers = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export type RepoExplorerState = {
  tree: RepoTree;
  fileStates: Record<string, FileState>;
  loading: boolean;
  error: string | null;
};

export type ExplorerCallbacks = {
  onToggleFile: (path: string) => Promise<void> | void;
};
