"use client";

const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/+$/, "");

export const apiUrl = (path: string) => `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(apiUrl(path), {
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });

  if (res.ok) {
    return res.json() as Promise<T>;
  }

  let body: unknown = undefined;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  const message = typeof body === "string" ? body : JSON.stringify(body);
  throw new Error(`Request failed (${res.status})${message ? `: ${message}` : ""}`);
}
