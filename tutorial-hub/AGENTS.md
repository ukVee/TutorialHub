# AGENTS.md (frontend)

## Scope
- Next.js 16 App Router static export; must stay fully static (no server actions/API routes).
- Prod basePath `/TutorialHub` set only when `NODE_ENV=production`; verify links/assets against basePath. `output: "export"`; build artifacts land in `out/`.

## Stack & Conventions
- Node 20+, npm 10. React 19, TypeScript `strict` (no `any`). Path alias `@/* -> ./`.
- Styling: Tailwind CSS 4 via `@tailwindcss/postcss`; globals in `app/globals.css`.
- 3D/graph: `three`, `three-forcegraph`, `@react-three/fiber`; keep them client-side.

## Layout
- Entry: `app/layout.tsx`, `app/page.tsx`.
- Features: `app/components/*`, `app/visualizer` (repo graph), `app/terminal`, `app/bash_scripts`.
- Shared logic: `app/lib/api.ts` (backend proxy + URL helpers), `app/lib/useRepoTree.ts` (repo tree fetch/toggle, 10s timeout), `app/lib/settings.ts` (localStorage-backed UX flags), `app/lib/types.ts` (all shared types).
- Static assets: `public/`; design notes: `Documentation/`.

## Backend Contract (do not bypass)
- Base URL: dev `http://localhost:4000`; prod `https://tutorial-hub-backend.vercel.app` (see `app/lib/api.ts`).
- Endpoints in use:
  - `GET /api/github/user`
  - `GET /api/github/gists`
  - `GET /api/github/repos/:repo/contents?path=...`
  - `GET /api/github/repos/:repo/file?filepath=...` (legacy full fetch)
  - `GET /api/github/repos/:repo/file/stream?filepath=...&start=...` (preferred streaming; tree/file viewer defaults to repo `i3-scripts`; visualizer targets repo `TutorialHub`).
- Never call GitHub directly from the browser; no tokens on the client.

## Commands
- `npm install`
- `npm run dev`
- `npm run build`  # static export → `out/`
- `npm run lint`
- `npm run deploy` # build + `gh-pages -d out`

## Constraints & Notes
- Keep static-export compatibility; avoid features needing a Node runtime.
- BasePath-sensitive: test with `npm run build` + `npx serve out`.
- Package `homepage` is `https://ukvee/TutorialHub/` (domain missing); leave untouched unless confirmed.
- Default repo assumptions: tree/file = `i3-scripts`; visualizer = `TutorialHub` for owner `ukVee`.

## Testing
- None present; any new tests must be deterministic/headless and wired with an explicit `npm run test` script.
