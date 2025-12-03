# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router: `layout.tsx`, `page.tsx`, feature folders `components/` (UI), `visualizer/` (graph), `terminal/` (terminal UI); shared helpers in `app/lib/` (`types.ts`, `githubClient.ts`, `settings.ts`, `useRepoTree.ts`).
- `public/` holds static assets (icons, manifest).
- `Documentation/` stores design notes and wireframes.
- `next.config.ts` sets `output: "export"` and adds a production `basePath` of `/TutorialHub` for GitHub Pages.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start local dev server with fast refresh.
- `npm run build` — static export; outputs to `out/` using the production base path.
- `npm run start` — serve the built app (after `build`).
- `npm run lint` — run ESLint (Next.js config, Tailwind-aware).
- `npm run deploy` — build then publish `out/` to GitHub Pages via `gh-pages` (uses `predeploy` hook).

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` enabled; prefer typed props and avoid `any`.
- Components: React function components in PascalCase filenames; hooks start with `use*`; utilities in `app/lib/`.
- Styling: Tailwind CSS v4 via `app/globals.css`; keep class lists focused and drop unused utilities.
- Imports: use the `@/*` path alias (from `tsconfig.json`); prefer absolute imports over deep relative paths.
- Linting: follow ESLint rules in `eslint.config.mjs`; run `npm run lint` before pushes.

## Testing Guidelines
- No automated tests yet. When adding, provide an `npm run test` script and keep tests deterministic and isolated; colocate tests near the code they cover.

## Commit & Pull Request Guidelines
- History uses short sentence/imperative messages (no Conventional Commit prefixes). Keep summaries under ~72 characters, present tense, e.g., `Add visualizer edges hover state`.
- Before a PR: run `npm run lint` and `npm run build`; include screenshots for UI changes; link related issues; note deployment impact (basePath/export).

## Configuration & Security Notes
- Environment: use a recent Node.js LTS (tested with Node 20+). Store secrets in `.env.local`; never commit tokens.
- GitHub data components read `NEXT_PUBLIC_GITHUB_USERNAME` (defaults to `ukvee`); set it to point widgets at another profile.
- Production export relies on `basePath=/TutorialHub`; verify links/assets stay relative when testing `out/` locally (e.g., `npx serve out`).

## Important Concerns
- This application is a static site and must remain static for github pages deployment to work.