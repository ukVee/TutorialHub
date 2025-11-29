import { NextResponse } from "next/server";
import { Octokit } from "octokit";
export const dynamic = 'force-static';
export const revalidate = false;

const GITHUB_USER = process.env.GITHUB_USERNAME || process.env.NEXT_PUBLIC_GITHUB_USERNAME || "ukvee";

export async function GET() {
  const octokit = new Octokit({
    // No authentication for now; add `auth: process.env.GITHUB_TOKEN` when ready.
    userAgent: "tutorial-hub/v0.4.0",
  });

  try {
    const { data } = await octokit.rest.users.getByUsername(
      { username: GITHUB_USER },
    );

    const payload = {
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
    };

    return NextResponse.json(payload, {
      status: 200,
      // cache for an hour to reduce rate limit pressure
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json(
      { error: "Unable to load GitHub profile", status },
      { status }
    );
  }
}
