# client/ — the React web client

Vite + React 19 + TypeScript, ESM + bundler mode (relative imports include `.ts`/`.tsx`). A
**networked** client: each device is one seat on a `server` room over WebSocket. It never owns
a `Game` or runs a controller loop.

**Full per-file detail: `docs/architecture/client.md`.** Read a file's entry before changing
that file. The board-overhaul record is `BOARD_REDESIGN_PLAN.md`.

## Rules that aren't obvious from any one file

- **Import the engine as `engine/client`, never `engine`.** The barrel pulls in every card
  module. Card definitions come only through `cards/cardData.ts`: a single card's shard by name,
  or the whole pool (`loadCardPool`/`cardPool()`) for the library and deck builder, which are
  lazy chunks. The game page holds no card definitions: everything it plays comes in the
  server's views.
- **Three pages branch on path in `main.tsx`**: `/library`, `/deck-builder`, and everything else
  → `App` (the game). The network-free pages never open the WebSocket.
- **Draw from `usePlayback`'s `shown` view, never `game.view`.** They differ while an animation
  runs. Frames play one at a time (`game/usePlayback.ts`), and `Table` remounts per frame shown,
  so state that must survive a frame lives in `GameScreen`.
- **`setState` updaters must stay pure.** Measure layout that changes what's drawn in a
  `useLayoutEffect` or a callback ref, never a plain `useEffect`.
- **Art URLs go through `ui/art.ts`'s `resolveArtUrl`** (host-checked against
  `ALLOWED_ART_HOSTS`), and into CSS through `cssUrl()`, always.

## Standing UI rules

- **No fixed px.** Sizing is `clamp()`/`vw`/`vh`, derived from `--card-w` for anything
  card-sized.
- **`--card-w` is width-derived; cap it against height where height is the real constraint**
  (`--card-w-max` is the ceiling; quadrants are `container-type: size`, which also makes them
  the containing block for `position: fixed`, so popovers portal to `<body>`).
- **What a decision picks from the board is picked on the board**, never from a row of name
  buttons. Every decision but the mulligan asks in the bottom-right `.decision-banner`.
- **Mana symbols always go through `<Symbols text={…} />`.**
- **Equal columns need `minmax(0, 1fr)`, not `1fr`.**
- **A child that names its own width inside a padded box will escape that padding.** Let the
  box own the width.
- **Verify every UI change live in the browser, in both a 2-player and a 3–4 player room, and at
  a short (~768px tall) viewport.** The Playwright smoke suite (`npm run test:e2e -w client`)
  only catches a page that no longer loads, not a layout that got worse.

The full text of each rule, with the bug that prompted it, is in `docs/architecture/client.md`.

## Commands

(From the repo root with `-w client`.) `dev` (needs a room server on `ws://<host>:4000`: use the
`dev-up` skill), `build`, `lint` (oxlint), `test` (vitest unit tests, `src/**/*.test.ts`), `test:e2e` (build `engine`, `protocol` and `server`
first).
