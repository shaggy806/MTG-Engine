# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MTG-Engine is intended to be a Magic: The Gathering rules engine (`engine/`) with a
React web client (`client/`). The repo is an **npm workspaces monorepo** (`workspaces:
["engine", "client"]` in the root `package.json`, in that order so `engine` builds first),
currently at an early scaffold stage:

- `engine/` — a TypeScript library package, ESM (`"type": "module"`), NodeNext resolution. Only a stub `src/index.ts` (exports `VERSION`) exists so far; the real rules engine is unwritten. Emits to `dist/` with declarations; `package.json` `exports`/`main`/`types` point there.
- `client/` — a working Vite + React 19 + TypeScript app (still the starter template UI in `src/App.tsx`). Declares `engine` as a dependency (`"engine": "*"`, resolved via the workspace symlink) but does not import it yet.

## Commands

Run from the repo root unless noted. Workspace scripts: `npm run <script> -w engine` / `-w client`.

**Whole repo** (root scripts fan out with `--workspaces --if-present`):
- `npm run build` — builds `engine` (tsc) then `client` (`tsc -b && vite build`)
- `npm test` — runs `engine` vitest once (`client` has no tests)
- `npm run lint` — oxlint on `client`
- `npm run typecheck` — `tsc --noEmit` on `engine`, `tsc -b` on `client`

**Engine** (`engine/`):
- `npm run test -w engine` — vitest, single pass (CI mode)
- `npm run test:watch -w engine` — vitest watch mode
- `npm run test -w engine -- path/to/file.test.ts` — run one test file
- `npm run test -w engine -- -t "name"` — run tests matching a name
- `npm run build -w engine` — `tsc` → `engine/dist/`
- `npm run typecheck -w engine` — `tsc --noEmit`

**Client** (`client/`):
- `npm run dev -w client` — Vite dev server with HMR
- `npm run build -w client` — type-check (`tsc -b`) then `vite build`
- `npm run lint -w client` — oxlint
- `npm run preview -w client` — serve the production build

## Toolchain notes

- **Module systems differ**: `engine` is ESM + NodeNext, so its own relative imports need explicit `.js` extensions (e.g. `import { x } from "./foo.js"` even though the file is `foo.ts`). `client` is ESM + bundler mode.
- **Client TS config** (`client/tsconfig.app.json`) is strict bundler-mode: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`/`noUnusedParameters`, `allowImportingTsExtensions` (so relative imports include the `.tsx`/`.ts` extension, e.g. `import App from './App.tsx'`). `noEmit` — Vite does the transform.
- **Engine tsconfig** excludes `src/**/*.test.ts` from the build (tests are not emitted to `dist/`); vitest type-checks tests itself.
- **Shared dev deps are hoisted to the root** `package.json` (`typescript`, `@types/node`). Don't re-add them to a workspace unless a version needs to diverge.
- **Lint** is oxlint, not ESLint. Config in `client/.oxlintrc.json` (`react`, `typescript`, `oxc` plugins; `react/rules-of-hooks` errors).
- Assets in `client/public/` are referenced by absolute path (e.g. `/icons.svg#github-icon`); assets imported in `src/` (e.g. `./assets/hero.png`) go through Vite.
