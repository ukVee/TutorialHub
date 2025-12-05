# Tutorial Hub (Client)

Front-end for showcasing tutorials, Arch Linux scripts, and GitHub activity. Built with Next.js 16 (App Router) and exported as a static site for GitHub Pages.

## Table of Contents
1. [Features](#features)
2. [Stack](#stack)
3. [Architecture & Routes](#architecture--routes)
4. [Backend Dependency](#backend-dependency)
5. [Prerequisites](#prerequisites)
6. [Local Development](#local-development)
7. [Build & Preview](#build--preview)
8. [Deploy](#deploy)
9. [Lint](#lint)
10. [Project Layout](#project-layout)
11. [Notes & Constraints](#notes--constraints)

## Features
- Landing sequence (splash, glitch overlay, scripted terminal) persisted in `localStorage` for first-visit only.
- GitHub widgets: public profile stats and recent gists via companion backend.
- Script browser for `i3-scripts`: recursive tree, on-demand streaming preview.
- 3D repo visualizer (`/visualizer`) using `three` + `three-forcegraph`.
- Interactive terminal with `help`, `spike`, `shake`, `ls`.

## Stack
- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS 4 (`@tailwindcss/postcss`)
- three.js + three-forcegraph
- GitHub API via backend proxy

## Architecture & Routes
- Static export (`output: "export"`). Prod `basePath` = `/TutorialHub` (GitHub Pages); disabled in dev.
- Routes:
  - `/` — landing (features/homepage), stats, gists, splash/glitch/terminal sequencing.
  - `/bash_scripts` — repo explorer (features/repo-explorer) with mock terminal host.
  - `/visualizer` — 3D repo map (features/visualizer).
- `/terminal` — standalone terminal (not shipped; kept as feature module only).
- Feature-scoped modules under `app/features/*`; reusable UI under `app/components` (e.g., `components/carousel`, `components/loading`, `components/terminal`).

## Backend Dependency
- Dev: `http://localhost:4000`
- Prod: `https://tutorial-hub-backend.vercel.app`

Endpoints used:
- `GET /api/github/user`
- `GET /api/github/gists`
- `GET /api/github/repos/:repo/contents?path=...`
- `GET /api/github/repos/:repo/file?filepath=...`
- `GET /api/github/repos/:repo/file/stream?filepath=...&start=...`

Configure base URL in `app/lib/api.ts`. Without backend, widgets show graceful errors but render.

## Prerequisites
- Node.js 20+, npm 10+
- Companion backend running at the URLs above

## Local Development
```bash
cd tutorial-hub
npm install
npm run dev   # http://localhost:3000
```

## Build & Preview
```bash
cd tutorial-hub
npm run build      # outputs ./out (static)
npx serve out      # preview static export
```

## Deploy
`npm run deploy` builds then publishes `./out` to `gh-pages` via `gh-pages`. Ensure git remote and push rights.

## Lint
```bash
npm run lint
```

## Project Layout
```
tutorial-hub/
  app/
    components/
      carousel/      # CarouselNav
      loading/       # RippleLoad
      terminal/      # MockTerminal, NeuralMesh
    features/
      homepage/      # landing/glitch/gists/stats components
      repo-explorer/ # bash scripts explorer container + layout
      visualizer/    # RepoGraph + scene
      terminal/      # terminal page container
      splash/        # SplashAnimationCanvas, SplashGate
    lib/             # api, nav, settings, types, useRepoTree
    bash_scripts/, visualizer/, terminal/, page.tsx
  public/
  Documentation/
  next.config.ts
  globals.css
```

## Notes & Constraints
- Static export: no server actions; all data fetched client-side from backend.
- First-visit UX flags stored in `localStorage` (`app/lib/settings`).
- GitHub rate limits surface as user-facing errors; they don’t block page render.
