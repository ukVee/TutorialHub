"use client";

import { Octokit } from "octokit";

const octokit = new Octokit({
  userAgent: "tutorial-hub/v0.4.0",
});

const OWNER = "ukvee";
const REPO = "i3-scripts";

export type RepoFile = {
  name: string;
  path: string;
  size: number;
  url: string;
  type: "file" | "dir" | string;
};

export async function listRepoFiles(path = ""): Promise<RepoFile[]> {
  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
  });

  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item.type === "file")
    .map((item) => ({
      name: item.name,
      path: item.path,
      size: item.size ?? 0,
      url: item.url,
      type: item.type,
    }));
}

export async function getFileContent(path: string): Promise<string> {
  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
  });

  if (!("content" in data) || typeof data.content !== "string") {
    throw new Error("Content missing");
  }

  const decoded =
    typeof atob === "function"
      ? atob(data.content.replace(/\n/g, ""))
      : Buffer.from(data.content, "base64").toString("utf8");

  return decoded;
}
