import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export const dynamic = "force-static";
export const revalidate = 3600; // cache for an hour; safe for static export

type GraphNode = {
  id: string;
  type: "root" | "directory" | "file";
  parent?: string;
};

type GraphLink = {
  source: string;
  target: string;
  type: "hierarchy" | "mesh";
};

type GraphPayload = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const OWNER = "ukVee";
const REPO = "TutorialHub";
const USER_AGENT = "tutorial-hub/visualizer";

export async function GET() {
  const octokit = new Octokit({
    userAgent: USER_AGENT,
    // Add `auth: process.env.GITHUB_TOKEN` to increase rate limits when available.
  });

  try {
    const { data: repo } = await octokit.rest.repos.get({ owner: OWNER, repo: REPO });
    const defaultBranch = repo.default_branch || "main";

    const { data: tree } = await octokit.rest.git.getTree({
      owner: OWNER,
      repo: REPO,
      tree_sha: defaultBranch,
      recursive: "1",
    });

    if (!tree.tree) {
      return NextResponse.json({ error: "No repository tree found" }, { status: 500 });
    }

    const graph = buildGraph(tree.tree.map((entry) => ({
      path: entry.path || "",
      type: entry.type as "blob" | "tree" | undefined,
    })));

    return NextResponse.json(graph, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=900",
      },
    });
  } catch (error: unknown) {
    const status = typeof error === "object" && error && "status" in error ? (error as { status?: number }).status || 500 : 500;
    return NextResponse.json(
      { error: "Unable to load repository structure", status },
      { status },
    );
  }
}

function buildGraph(entries: Array<{ path: string; type?: "blob" | "tree" }>): GraphPayload {
  const rootId = `${OWNER}/${REPO}`;
  const nodes: GraphNode[] = [{ id: rootId, type: "root" }];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>([[rootId, nodes[0]]]);
  const dirToFiles = new Map<string, string[]>();

  const addNode = (id: string, type: GraphNode["type"], parent?: string) => {
    if (nodeMap.has(id)) return;
    const node: GraphNode = parent ? { id, type, parent } : { id, type };
    nodeMap.set(id, node);
    nodes.push(node);
    if (parent) {
      links.push({ source: parent, target: id, type: "hierarchy" });
    }
  };

  const ensureDirChain = (fullPath: string) => {
    if (!fullPath) return rootId;
    const segments = fullPath.split("/").filter(Boolean);
    let currentParent = rootId;
    segments.forEach((_, idx) => {
      const id = segments.slice(0, idx + 1).join("/");
      addNode(id, "directory", idx === 0 ? rootId : segments.slice(0, idx).join("/"));
      currentParent = id;
    });
    return currentParent;
  };

  for (const entry of entries) {
    const cleanedPath = entry.path.replace(/^\//, "");
    if (!cleanedPath) continue;

    const parentPath = cleanedPath.includes("/")
      ? cleanedPath.slice(0, cleanedPath.lastIndexOf("/"))
      : "";

    const parentId = ensureDirChain(parentPath);

    if (entry.type === "tree") {
      addNode(cleanedPath, "directory", parentId || rootId);
      continue;
    }

    if (entry.type === "blob") {
      addNode(cleanedPath, "file", parentId || rootId);
      if (!dirToFiles.has(parentId)) dirToFiles.set(parentId, []);
      dirToFiles.get(parentId)!.push(cleanedPath);
    }
  }

  // Build mesh links between sibling files within the same directory
  const meshSeen = new Set<string>();
  dirToFiles.forEach((files) => {
    for (let i = 0; i < files.length; i += 1) {
      for (let j = i + 1; j < files.length; j += 1) {
        const [a, b] = [files[i], files[j]];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (meshSeen.has(key)) continue;
        meshSeen.add(key);
        links.push({ source: a, target: b, type: "mesh" });
      }
    }
  });

  return { nodes, links };
}
