# Tutorial Hub

Front-end for showcasing my tutorials, Arch Linux scripts, and GitHub activity. Built with Next.js 16 (App Router) and exported as a static site for GitHub Pages.

## Features
- Landing sequence with splash, glitch overlay, and a scripted mock terminal that only runs on a first visit (state persisted in `localStorage`).
- GitHub widgets: public profile stats and recent gists, fetched via the companion backend.
- Script browser for the `i3-scripts` repo: recursive tree view with on-demand file fetch and inline viewer.
- 3D repository visualizer (`/visualizer`) using `three` + `three-forcegraph`, mapping this repo’s directory graph.
- Interactive web terminal (`/terminal`) with idle logs and commands: `help`, `spike`, `shake` (emits mesh animations).

## Stack
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4 (via `@tailwindcss/postcss`)
- three.js + three-forcegraph for visualization
- Octokit-powered GitHub API calls proxied through a small backend

## System & Routing
- Static export (`next.config.ts` sets `output: "export"`).
- Prod `basePath` is `/TutorialHub` for GitHub Pages; disabled in `next dev`.
- Key routes:
  - `/` — landing + stats, gists, script browser
  - `/terminal` — standalone terminal experience
  - `/visualizer` — 3D repo map

## Backend Dependency
The frontend expects a companion API:
- Dev: `http://localhost:4000`
- Prod: `https://tutorial-hub-backend.vercel.app`

Endpoints used:
- `GET /api/github/user` — GitHub profile stats
- `GET /api/github/gists` — latest gists
- `GET /api/github/repos/:repo/contents?path=...` — directory listings and base64 file content (defaults to `i3-scripts`)

Update `app/lib/api.ts` if you host the backend elsewhere. Without the backend, the widgets show fallback error states but the site still renders.

## Prerequisites
- Node.js 20+ (Next 16 requirement) and npm 10+
- git
- Backend service running at the URLs above for data widgets

## Local Development
```bash
cd tutorial-hub
npm install
npm run dev   # serves at http://localhost:3000
```

## Build & Preview (static export)
```bash
cd tutorial-hub
npm run build           # outputs to ./out
npx serve out           # preview the static build
```

## Deploy to GitHub Pages
`npm run deploy` runs `next build` then publishes `./out` to the `gh-pages` branch via `gh-pages`. Ensure your git remote is set and you have push rights.

## Lint
```bash
cd tutorial-hub
npm run lint
```

## Project Layout
```
tutorial-hub/
  app/                # Routes, UI components, and feature modules
  public/             # Favicons and static assets
  Documentation/      # Wireframes and design notes
  next.config.ts      # Static export + basePath for Pages
  globals.css         # Tailwind layer and custom styles
```

## Notes & Constraints
- Static export means no server actions; all data is fetched client-side via the backend.
- Local visit state (splash/glitch) is stored in `localStorage` (`app/lib/settings`).
- If GitHub rate limits the backend, widgets will show friendly error messages but won’t block page render.
