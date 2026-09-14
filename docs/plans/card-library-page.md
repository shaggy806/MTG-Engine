# Public card-library page

Status: **implemented** — see `client/src/library/LibraryPage.tsx`, the path-based branch in
`client/src/main.tsx`, and the "Browse the card library" link in `LobbyScreen`
(`client/src/App.tsx`). This file is the design record kept for future reference, not living
documentation — see `CLAUDE.md` for current architecture.

Second of five long-term client/server features discussed together (see `basic-bots.md`): a
public card-library page, a deck builder, server-side deck save/share, an automatic replacer for
unimplemented cards on decklist import, and basic bots (shipped first). The deck builder
(`deck-builder.md`) followed; deck save/share and the card replacer are still unscoped.

## Key architectural finding

The engine already exposes everything a public gallery needs — `BUILTIN_CARDS`/`CardDefinition`,
exported from the `engine` package — because the **card lab** (`client/src/lab/`, its own Vite
entry on port 5174, `npm run lab -w client`) already builds a searchable list + detail pane from
exactly this data, for card authors. But the lab is a dev tool: never part of the production
build (`npm run build -w client` only emits the main `index.html`), and its detail pane has a
"Structure" tab (raw internal `CardDefinition`/ability JSON) and a "Sandbox" tab (a solo test
game) that are meaningless — or actively confusing — to a player. So this ships a separate,
trimmed sibling page rather than exposing the lab itself: same data and the same `CardTile`
rendering (via the lab's existing `defToVisible` adapter, reused as-is), stripped to just
search/filter/browse.

The other finding was about *routing*, not data: `client/src/main.tsx` always rendered `<App/>`,
which unconditionally calls `useNetworkGame()` — and that hook opens a WebSocket to the room
server the instant it mounts (`client/src/net/useNetworkGame.ts`'s `openSocket` effect), before
any UI decides whether a connection is even wanted. A page that's supposed to work with no room
server involved at all can't be a branch *inside* `App`'s render — it has to be chosen instead of
`App` at the point `main.tsx` picks a root component, so the hook (and its side-effecting
WebSocket) never runs for that route. No router library was added for this — a single
`window.location.pathname.startsWith('/library')` check in `main.tsx` is the only "routing"
needed for two routes, and it works in production for free: Caddy's existing
`try_files {path} /index.html` (`DEPLOYMENT.md`) already serves `index.html` for any path.

## 1. Client: `LibraryPage`

`client/src/library/LibraryPage.tsx` + `library.css` (new directory, sibling to `lab/`). Same
list/detail shape as `CardLab.tsx` — a search box (name/rules-text/subtype substring match), type
filter chips (creature/instant/sorcery/artifact/enchantment/planeswalker/land), a scrollable
name list, and a detail pane rendering the selected card as a real `CardTile` (via
`defToVisible`, imported from `../lab/defToVisible.ts` rather than duplicated) with a "full card
image" toggle (`resolveArtUrl`, same as the lab). Deep-linkable via `?card=Name`, same
`cardParam`/`setCardParam` convention the lab already uses, so a specific card can be linked to
directly. No "Structure"/"Sandbox" tabs, no internal JSON — v1 is browse-only.

`library.css` is its own file with an `.lib-*` class prefix rather than a re-export of
`lab.css` — the lab's classes are fine as internal dev-tool styling but aren't meant to ship in
the production bundle's shared CSS namespace. It borrows the same design tokens already global
via `index.css` (`--panel`, `--border`, `--muted`, `--accent`, `--card-w`) so it matches the rest
of the game's look without copying lab-specific rules.

## 2. Routing

`client/src/main.tsx` branches before choosing a root component:

```tsx
const page = window.location.pathname.startsWith('/library') ? <LibraryPage /> : <App />
```

`LobbyScreen` (`client/src/App.tsx`) gets a plain `<a href="/library">Browse the card
library</a>` next to the existing "Import a decklist" button — a real navigation (full page
load), not client-side state, since the branch above only runs once at load and a second route
doesn't justify adding a router dependency. A "← Back" link on `LibraryPage` returns to `/`.

## Non-goals for v1 (explicitly deferred)

- Color/mana-value filters — only name/text/subtype search + type filter, matching the lab.
- Pagination — the pool (280+ cards) is small enough for a plain scrollable list, same as the lab.
- "Known limitation" badges for cards with a simplified/partial implementation (e.g. a card whose
  file comment notes an unmodeled clause) — the data to drive this exists in card-file comments,
  not a structured field, so it would need new authoring conventions first.
- Any deck-builder interaction (add to deck, export, etc.) — that's the separate, still-unscoped
  deck-builder feature.
- Client-side routing beyond the one `pathname` check — no router library.
