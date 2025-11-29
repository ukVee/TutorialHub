import { NextResponse } from "next/server";
import { Octokit } from "octokit";
export const dynamic = 'force-static';
export const revalidate = false;
const GITHUB_USER = "ukVee";

export async function GET() {
  const octokit = new Octokit({
    // No authentication for now; add `auth: process.env.GITHUB_TOKEN` when ready.
    userAgent: "tutorial-hub/v0.4.0",
  });

  try {
    const { data } = await octokit.rest.gists.listForUser(
      { username: GITHUB_USER, per_page: 50 },
    );

    const simplified = data.map((gist) => ({
      id: gist.id,
      description: gist.description || "Untitled gist",
      files: Object.keys(gist.files || {}),
      created_at: gist.created_at,
      url: gist.html_url,
    }));

    return NextResponse.json(simplified, {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json(
      { error: "Unable to load gists", status },
      { status }
    );
  }
}

/*
  Full GitHub Gist fields (not all returned above):
  id, node_id, html_url, git_pull_url, git_push_url, url, forks_url, commits_url, comments_url,
  comments, truncated, created_at, updated_at, description, public, owner, files (with filename,
  type, language, raw_url, size), forks, history.
*/
