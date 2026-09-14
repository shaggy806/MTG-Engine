# Board redesign — porting plan

Tracks porting the board-overhaul mockup (iterated live as a Claude Artifact,
URL: https://claude.ai/code/artifact/5dddb3da-97e6-4773-8b2c-40bf1811d2a3 —
read it with the `artifact` tool for the exact visual reference) into the real
client at `client/src/`. Read this file first if resuming this work in a new
session — it records what's done, what's left, and the design decisions the
mockup conversation settled on, so they don't need to be re-derived.

**Working style**: each phase below is implemented, `npm run typecheck -w
client` + `npm run lint -w client` clean, and checked live in the browser
before being considered done and committed. One commit per phase (or smaller),
matching this repo's usual git history — not one giant diff. `scratch.mjs` +
`npm run dev -w client` (client dev server proxies `ws://localhost:4000`) is
the fastest way to eyeball a change; see CLAUDE.md's Commands section.

**Status: Phases 1-6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, and 18 done and committed.** Phase 5 turned out to
already be built before this plan started. Phase 7's
priority-action-bar half landed early (inside phase 3); its mana-available-
indicator half is explicitly **descoped by the user** (too much
engine/protocol work for something that's the player's own job to track —
see the note appended to Phase 7). Non-land token stacking (part of phase
4) is implemented but not live-verified — see that phase's note on why
(`debugSpawn` can't exercise it). **Phase 8 exists because the user found
phases 1-6, while individually correct, still looked "very distant" from
the mockup** — the gap turned out to be visual design system (colors/
typography/decorative styling), never ported, not structure/behavior. A
full client rebuild was considered and rejected in favor of Phase 8's
targeted, CSS-mostly approach — see Phase 8's own intro for why.

## Why this redesign

Original ask: the board UI was cluttered, pixel-based sizing didn't scale
across monitors, there was no way to see all 4 players' boards at once, and
the hand took up too much permanent screen space. The mockup iterated through
many rounds of feedback — the details below are the *settled* decisions, not
first drafts; don't second-guess them without re-reading the mockup's own
comment history in this conversation if something seems arbitrary.

## Phases

### Phase 1 — Responsive card sizing — DONE
- Added `--card-w: clamp(96px, 9vw, 150px)` to `client/src/index.css`'s
  `:root` (previously `.card-tile` hardcoded `--card-w: 138px`, and
  `.card-slot-empty`/`.card-back`/`.board-row-cards` each hardcoded `190px`
  separately instead of deriving from the same token).
- `.card-tile`/`.card-slot-empty`/`.card-back` min-height is now
  `calc(var(--card-w) * 1.4)` (the card aspect ratio), not a separate magic
  number that could drift out of sync with the width.
- `.card-back-count` (the library-pile number badge) is now
  `clamp(32px, 3.2vw, 48px)` instead of a fixed 44px circle.
- Verified: typecheck/lint clean, checked live via `scratch.mjs` + client dev
  server — hand/battlefield/command-zone tiles all render at a sensible,
  consistent, viewport-scaled size.

### Phase 2 — Top chrome consolidation — DONE
Collapse `.topbar` + `.seat-banner` + `.highroll-banner` + `.pinned-top` (in
`App.tsx`'s `GameScreen`/`Table`) into one slim strip (`clamp(30px,3.6vh,40px)`
tall in the mockup), matching the mockup's `.topstrip`: room code, whose-turn,
a compact phase-pip row, menu buttons (History/Leave), all in one row. This
replaces `PhaseTrack.tsx`'s current taller block-and-pip-list rendering (see
`.phase-track`/`.phase-steps` in App.css) with the slim inline version.
Current opponent-PlayerPanel-in-pinned-top behavior (2-player layout only)
needs a new home — the mockup folds per-player life/mana into each quadrant's
own header instead (see Phase 4/5), so once quadrant headers exist this
strip no longer needs to carry opponent info at all, 2-player included.

**Done as:** a new `.top-strip` in `GameScreen` (App.tsx) replaces
`.topbar`+`.seat-banner` and folds in `<TurnBanner>`+`<PhaseTrack>` (both
moved up from `Table`'s two `.pinned-top` blocks). `PhaseTrack.tsx` was
trimmed to just the step-pip row (the "Turn N — Player" text it used to also
render is now part of `TurnBanner`, already inline in the strip).
`TurnBanner`'s CSS switched from a centered block to an inline flex span.
Quadrant mode's `.pinned-top` wrapper is gone entirely (it held nothing else);
2-player mode's still exists, now holding only the opponent `PlayerPanel`
(kept as future work per this phase's note above — not moved into a
quadrant-style per-board header yet, since 2-player doesn't have quadrant
cells to put one in). Verified live via `scratch.mjs`.

### Phase 3 — Hand tray: peek + asymmetric hover — DONE
Replace `.hand-strip` (currently always-visible, full-size, "never
clipped/scrolled" by design comment) with the mockup's collapsed-peek tray:
- A small height sliver always visible at the bottom edge (not fully hidden,
  not full-size) with full card detail already rendered (not a separate
  compact format — CardTile already renders full detail, so this is styling
  only, no CardTile changes needed).
- Asymmetric hover zones (JS-driven, not pure CSS `:hover` — see mockup's
  `handTriggerEl`/`handZoneEl` split): a small trigger band near the bottom
  edge pops it up, a much larger sustain band (the whole hand-zone) has to be
  left before it drops back down. Mockup constants: trigger
  `clamp(50px,7vh,70px)`, sustain zone `clamp(240px,36vh,340px)`.
- Card row itself stays width-capped to a middle band (`min(50vw,760px)` in
  the mockup) — the *hitbox* is wider than the visible row on purpose (extra
  margin), decoupled via two different elements, not one.
- Respect `prefers-reduced-motion` on the reveal transition.
- Mulligan/keep decision UI currently lives in `.hand-strip` too — needs to
  stay reachable; simplest is probably keeping the always-visible peek show
  it plainly (mulligan is rare/blocking, unlike normal hand browsing).

**Done as:** the peek/collapse behavior (`renderHandStrip` in App.tsx, new
`.hand-strip.peekable`/`.hand-trigger`/`.hand-strip-inner` CSS) is scoped to
`mode === 'priority'` only — every other mode (discard, put-on-bottom,
mulligan, targeting, etc.) keeps `.hand-strip` in its old always-visible,
in-flow form untouched, since those are forced decisions where hover-to-
reveal would actively hurt. A `handRaised` React state (not the mockup's
vanilla `classList`) drives the two-zone hitbox: `.hand-trigger` (small,
bottom-edge) `onMouseEnter` raises it, the whole `.hand-strip`'s
`onMouseLeave` lowers it; `:focus-within` is the keyboard fallback. Verified
live: peeks to just the hand title, raises fully on hover, drops again on
mouseleave.

Same phase also pulled priority mode's Pass/Pass Turn/Auto-pass/Skip-mana
controls out of the hand-strip's inline `{controls}` into a new fixed
bottom-right `.priority-actions` bar (this is Phase 7's "priority actions
reposition" item — done early since it was needed to make the hand-strip
peek cleanly: those controls used to render inline in `.hand-strip` for
priority mode specifically).

**Known limitation, documented not fixed:** switching between priority mode
and a forced-decision mode mid-game moves the hand-strip between fixed
(peekable) and in-flow positioning, which reflows the board area's height.
Accepted tradeoff — the alternative (always-fixed, always-peekable, even
during forced decisions) risks hiding UI the player needs to see immediately,
which is worse.

### Phase 4 — Compact battlefield tiles — DONE
Cards on the battlefield become small (image + tabular P/T badge + tiny
keyword-icon stack), not full detail — hover (or focus, for keyboard/touch)
to see the full card via a popover. This is the mockup's core "declutter"
idea and the largest single phase:
- A new compact tile rendering path. `CardTile.tsx` already has a `compact`
  prop, but it currently means "shrunk full-detail tile" (used for
  Auras/Equipment nested under their host and for non-top Stack entries) —
  check what that CSS (`.card-tile.compact` in App.css, ~line 958) actually
  looks like before deciding whether to extend it or add a genuinely new
  variant. The mockup's compact tile is NOT a shrunk version of the full
  card — it's a different, minimal layout (art with a P/T badge overlaid
  bottom-right and small keyword-icon dots top-left, no name/type/text
  visible at all).
- A hover/focus popover reusing the *full* CardTile render (art, cost via
  `Symbols`, type line, text, P/T) — positioned near the cursor, matching the
  mockup's `.popover`. Needs real cursor-following positioning + edge
  clamping (see mockup JS `showPop`), and a keyboard-focus fallback so
  touch/keyboard users can still reach full text.
- Land row above/below creatures row depending on which half of the screen a
  quadrant is in — top quadrants: lands (outer edge) above creatures (toward
  center); bottom quadrants (you + bottom opponent): creatures above lands.
  (`client/src/game/board.ts`'s `computeBoardEntries` decides bucketing;
  `App.tsx`'s rendering decides row order — check both.)
- **Non-land stacking**: `board.ts`'s `computeBoardEntries` currently only
  stacks identical *lands* (same name + same tapped state + no
  counters/attachments). The mockup showed identical token creatures
  (e.g. `Sproutling Token ×3`) stacking the same way. Extending this to
  non-land permanents is a real scoped feature, not just cosmetic — decide
  the matching predicate carefully (tokens only? same P/T + no
  counters/attachments + same tapped state, like lands?) and keep it a pure
  display grouping, not touching the engine's own `GameObject.stackCount`
  token-compaction (`engine/src/game.ts` — a completely different mechanism
  for resource-safety, not display; don't conflate the two).

**Done as:** a new `MiniTile.tsx` (art + tabular P/T/loyalty badge, tiny
keyword-icon dots, no name/cost/type/text) reuses `CardTile.tsx` unmodified
as the hover/focus popover content (`.mini-tile-popover`, pure CSS
`:hover`/`:focus-within` reveal -- no JS cursor-tracking, so it is anchored to
the tile itself, not the mouse; opens downward, a documented limitation for
tiles with little room below). `tileFor` in App.tsx got a `mini?: boolean`
option; both battlefield call sites (permanents + nested attachments) pass
it, the library-reveal call site does not (that one should stay full detail).
`artMisses` moved from `CardTile.tsx` to `art.ts` so both components share
one failed-art-URL cache instead of tracking it twice. A new `--mini-w`
token (`clamp(50px, 4.6vw, 78px)`, separate from `--card-w`) sizes it;
`.board-row-cards`'s min-height now derives from `--mini-w` too. Land row
ordering and the command-zone/library rail (Phase 5) were already correct
before this phase (see Phase 5 note below) and needed no changes.

Non-land stacking landed in `board.ts`'s `computeBoardEntries`: the
stacking key now also includes power/toughness/summoningSick, and the gate
is `bucket === 'land' ? obj.power === null : obj.isToken` -- tokens only,
real (nontoken) permanents sharing a name never fold into a stack. **Not
live-verified** -- `debugSpawn` (what `scratch.mjs` uses) always creates a
real card object (`isToken: false`), even for a card literally named
"Beast Token", so it cannot exercise this path; confirmed correct by
inspection instead (`isToken: true` is set at the real minting site,
`Game`'s private `mintTokenBatch`, engine/src/game.ts ~line 6301). A future
session verifying this live needs a card whose own effect actually creates
tokens, cast/triggered in a real game (dispatched through the room, not
`debugSpawn`) -- e.g. spawn a cheap token-making card to hand and cast it.

Verified live (2-player, both the top opponent row and the bottom own-board
row, via `scratch.mjs`): art renders, P/T badge, summoning-sickness flag,
land stacking (`x4`), the flying keyword icon, and the hover popover
(showing full name/cost-with-real-mana-pips/type/"Flying"/rules text/P-T)
all work. Also fixed mid-phase: MiniTile's aspect-ratio was originally 5:7
(matching a full card), which is wrong once there is no title/type/text
frame around the art to justify a portrait shape -- the `art_crop` images it
actually draws are landscape, so it is 4:3 now (and the tapped-rotation
scale factor, 0.66 for CardTile's 5:7 box, is 0.7 for this one -- different
box, different scale-to-avoid-overflow math).

### Phase 5 — Command zone / library rail — ALREADY DONE, verify only
Checked `App.tsx`'s `renderSideZone` (~line 1386) and `.board-with-sidezone`/
`.side-zone*` in App.css (~line 345, ~472): this already exists in
essentially the mockup's shape — a right-of-board column, commander tile (or
`.card-slot-empty` dashed placeholder) above a library section (face-down
`.card-back` + `.card-back-count`, or the revealed top card if public). Land
row ordering (Phase 4's other concern) is also already correct: `renderBoard`
already puts lands above permanents for opponents and permanents above lands
for your own board (`isOpp ? [landRow, permanentRow] : [permanentRow,
landRow]`). **No new work needed here** beyond whatever visual polish falls
out of Phase 1's sizing token and Phase 4's compact tiles — just re-check it
still looks right once those land.

### Phase 6 — Stack redesign — DONE
The real `Stack.tsx`/`.stack-overlay` already does a lot of what the mockup
wants (floating overlay, top card enlarged, `position: fixed; top: 50%;
right: 16px; transform: translateY(-50%)`, mounts only when non-empty) — this
phase is refinement, not a rewrite:
- **Pin the top card's screen position independent of stack size.** Current
  CSS centers via `top:50%; transform:translateY(-50%)` on the *whole*
  `.stack-overlay` box, which grows with more cards — same bug the mockup
  hit and fixed. Anchor from a fixed top-right point instead (mockup:
  `position:fixed; top:clamp(96px,50vh,calc(100vh-230px)); right:...`, cards
  positioned via `top`/`right` off that anchor, top card at `top:0;right:0`).
- Cards below the top currently render via `CardTile compact={index>0}`
  (the *shrunk-full-detail* compact mode) — the mockup wants the *same*
  full-detail card, just progressively scaled/dimmed/rotated by depth
  (`scale`/`opacity` floors, rotation only from depth 2 on, second-from-top
  stays upright). Don't reuse `compact` for this; it's a different visual
  treatment (see Phase 4 note on what `compact` currently means).
- Real CSS transition on `top`/`right`/`transform`/`opacity` (not just
  `transform 0.1s` on hover-lift, which is all that exists today) so a
  cast/resolve animates the shift instead of jumping.
- Stagger saturates past a depth cap (mockup: depth 7) so a big stack doesn't
  sprawl off-screen; scale/opacity already have floors, offset should too.
- Rotation pivot must be `transform-origin: top left` (the corner meant to
  stay exposed) — pivoting on the wrong corner was a real bug in the mockup
  that swallowed the exposed sliver of deeper cards; don't reintroduce it.

**Done as:** `Stack.tsx` rewritten to compute each entry's `top`/`right`/
`transform`/`opacity`/`z-index` inline per depth (same formulas as the
mockup: `STAGGER_X`/`STAGGER_Y`=20/15, `ROT_STEP`=3, scale/opacity floors at
0.6/0.55, offset saturates past depth 7, second-from-top stays upright,
`transform-origin: top left`). `.stack-overlay` is now a fixed top-right
anchor (`top: clamp(96px,50vh,calc(100vh-230px))`); `.stack-pile`'s children
are `position: absolute`, so the pile itself needs no explicit size. Each
`.stack-entry` is keyed by object id (not array index), which is what makes
the animation work with zero JS animation code: React reuses the same DOM
node across a re-render when only its depth (and therefore its inline
style) changes, and the new `.stack-entry` CSS transition on
`top`/`right`/`transform`/`opacity` (respecting `prefers-reduced-motion`)
interpolates automatically. Verified live: cast a spell, watched it land at
the pinned top-right position with the accent border.

**Deliberate simplification vs. the pre-existing app:** dropped the old
solid backdrop plate (`background: rgba(8,9,12,.82)` + blur) behind the
whole stack, and the old "top card enlarged 1.45x" treatment — the mockup's
extensively-iterated design uses each card's own shadow/border for
separation (no shared plate, since a plate would need the same pinning
treatment to avoid resizing under the top card) and keeps the top card at
normal full-tile size (matching every other full-detail CardTile in the
app, rather than a one-off larger size).

**Cleanup that fell out of this phase:** `CardTile`'s `compact` prop is now
*fully* dead (its only two callers were the battlefield's attachments,
switched to `MiniTile` in Phase 4, and `Stack.tsx`'s non-top entries,
replaced by the scale-via-transform approach above) — removed the prop,
its CSS class, and `.card-tile.compact { zoom: 0.6 }` entirely rather than
leave unused code around.

### Phase 7 — Priority actions + mana-available indicator — HALF DONE
- ~~Priority action buttons move to a fixed bottom-right corner.~~ **Done in
  Phase 3** (needed then to let the hand-strip peek cleanly) — see `.priority-
  actions` in App.css and the `mode === 'priority'` branch in `Table`'s
  return. Still open: this doesn't yet swap in mulligan-specific actions
  during that phase (mulligan still renders inline via `controls` in the
  normal `.hand-strip` flow, per its own branch in the big mode if/else
  chain) — decide whether that's worth unifying into the same fixed corner
  or is fine left as-is (mulligan is a one-time, attention-demanding
  decision, arguably fine inline).
- Each quadrant header gets a compact "mana available" indicator — colored
  WUBRG pips with a count badge for untapped sources of that color — using
  the *real* mana symbol SVGs (`client/src/ui/Symbols.tsx` /
  `mana.ts` / `symbols.ts`, sliced WotC artwork, not the mockup's plain
  colored-circle-with-a-letter placeholders). This is the one piece of the
  mockup that used a fake asset system on purpose (artifacts can't load
  arbitrary local SVGs); porting it means routing through `<Symbols>`
  properly instead of copying the mockup's CSS pips verbatim.

  **Blocked on an engine/protocol gap, checked and confirmed before
  attempting this — not started.** "Untapped sources by color" is
  `Game.manaSources(player)` (engine/src/game.ts ~line 4654), which is
  **private** and never exposed via `view.ts`'s `PlayerView`/
  `PublicPlayerInfo`, nor the wire protocol (`server/src/protocol.ts` /
  `client/src/net/protocol.ts`, hand-mirrored between the two per CLAUDE.md).
  `PlayerPanel.tsx`'s existing `info.manaPool` is a *different* thing
  (currently floating/added mana, which empties between steps under normal
  rules) — not "what could I tap for." A client-side heuristic (e.g.
  inferring color from a land's subtype) would be *wrong* for nonbasics,
  dual lands, mana rocks, and dorks, which this project's own standing
  rules-accuracy bar (CLAUDE.md, and this repo's "Rules accuracy is
  mandatory" feedback) rules out — a visibly-wrong mana indicator is worse
  than no indicator. Doing this properly is a real, separate feature:
  1. Engine: expose a per-player untapped-mana-by-color summary through
     `view.ts` (a new `PlayerView`/`PublicPlayerInfo` field, computed from
     the same `manaSources` logic `payMana` already uses — reuse it, don't
     reimplement it).
  2. Protocol: add that field to both `server/src/protocol.ts` and
     `client/src/net/protocol.ts` (kept in sync by hand, not shared code).
  3. Client: render it in each quadrant header via `<Symbols>`.
  Steps 1-2 are the real work and are outside this plan's client-only scope
  — flagging for a follow-up session rather than attempting a shortcut.
  **Descoped by the user (see Phase 8's note) — do not build this.** An
  "available mana" indicator is a lot of engine/protocol work for something
  that's the player's own responsibility to track; skip it. A *floating*
  mana display (what's already been added to the pool, not what's
  available) is a much smaller, already-real thing — see Phase 8.

### Phase 8 — Visual reskin — DONE

**Why this phase exists**: after phases 1-6, the user reported the live
client still looks "very distant" from the mockup despite every
structural/behavioral piece (grid layout, compact tiles, collapsible hand,
pinned stack, command rail, button placement) working correctly when
checked individually. Comparing the live app side-by-side against the
mockup artifact confirmed the actual gap: phases 1-6 ported *layout and
behavior* but never touched the *visual design system* — the client is
still wearing its original skin (muted panel greys, dashed orange/purple
per-seat borders, system-ui font, blue accent) instead of the mockup's
felt-table/gold/Cinzel-and-JetBrains-Mono look. **This phase is a
considered alternative to a full ground-up client rebuild**, which was
raised and rejected: the real complexity/risk in this codebase is `Table`'s
~15-branch decision-routing logic (mulligan, targeting, attackers,
blockers, sacrifice, scry, choose-x, choose-modes, assign-combat-damage,
…), which a rebuild would have to touch for no benefit, with no automated
tests to catch a regression. This phase is deliberately CSS-only except
where noted, to get the visual fidelity fix without going near that logic.

**Testing note — do this differently from phases 1-6**: don't use
`scratch.mjs`. Run the real server (`npm run build -w server` once if
needed, then `npm run start -w server`) + `npm run dev -w client`, and
create a room through the actual lobby UI with the player-count picker set
to **4** (`LobbyScreen`'s `players` state, `game.createRoom(undefined,
players)`). `server/src/decks.ts`'s `SEATS` are real ~60-card "good stuff"
piles with commanders already populated — far more realistic than a custom
scratch deck for checking the quadrant grid, command-zone rail, and compact
tiles all at once. Test **both** 2-player and a 4-player room before
considering any step done, per this file's standing rule (layouts diverge).

Confirmed root causes below (checked in the code before writing this, not
guessed) — a future session can trust these without re-deriving them:

1. **Design tokens.** Port the mockup's palette into `index.css`'s `:root`
   (felt background, gold accent, a more refined per-seat palette than the
   current one) plus the Cinzel + JetBrains Mono pairing via a Google Fonts
   `<link>` (or `@import`) in `index.css`. This is the foundation every
   other step in this phase visually depends on — do it first.

2. **Top strip restyle.** Re-style `.top-strip`/`.ts-*`/`.phase-steps` (all
   in App.css, added in Phase 2) using the new tokens to match the mockup's
   spacing/typography/color treatment. Pure CSS, no JSX changes.

3. **Quadrant unification** (solves the user's #3 *and* #5 together — they
   are the same underlying change). Currently each quadrant is *several*
   separately-boxed pieces: `.board` has its own `border:1px dashed`, the
   player panel above it and `.side-zone` next to it are styled
   independently, and `.table` scrolls the whole page (`overflow-y: auto`)
   if content overflows. Restructure to: one bordered, rounded-rect frame
   per quadrant (`.quadrant-cell` becomes that frame, or a new wrapping
   element if cleaner), a `border-bottom` divider between the player-panel
   header and the body instead of the header having its own box, a
   `border-left` divider between the permanents area and the
   command-zone/library rail instead of `.side-zone` having its own box,
   and — this is the part that actually removes page-level scrolling —
   only the quadrant's *body* (permanents area) scrolls internally
   (`overflow-y: auto` moved from `.table` down to each quadrant's body),
   so all 4 quadrant frames stay fully visible at all times and only an
   individual quadrant's *contents* scroll if it has too many permanents.
   Likely needs a small JSX wrapper change in `Table` (App.tsx) to group
   the player-panel + board-with-sidezone under one element with a
   head/body split — not an interaction-logic change, just markup nesting.
   Check current nesting in `Table`'s quadrant-grid branch before writing
   the new structure, rather than assuming it from this description.

4. **Hand redesign** (small JSX change, in `App.tsx`'s
   `renderHandAndControls`/hand-card rendering). Two fixes, done together:
   - Drop `.hand`'s own `background`/`border`/`border-radius` (the "border
     around the whole hand" the user flagged) — the mockup has no group
     container, just floating cards.
   - `.hand-cards` is currently a plain `flex-wrap` row with no per-card
     offset. Give each card a computed `rotate`/lift `translate`, the same
     symmetric-fan formula validated extensively in the mockup: for N
     cards, card `i`'s offset from center is `i - (N-1)/2`, rotation =
     `offset * STEP_DEG`, lift = `abs(offset) * STEP_Y` (see the mockup's
     final JS for exact constants, or re-derive — the shape matters more
     than exact degrees). This needs to still look right in the collapsed
     peek state from Phase 3 (`.hand-strip.peekable`) — check that the
     fan's rotation doesn't make the peeked sliver look broken/clipped
     oddly; may need to reduce the peek's rotation angle or accept a
     slightly different peek treatment than the mockup's flat-row peek.

5. **Priority buttons — strip the container.** `.priority-actions` wraps
   its buttons in `.controls`, which carries its own `background`/`border`/
   `padding` (meant for its *other* use as an inline decision-UI panel
   elsewhere in the hand-strip flow) — remove `background`/`border` from
   `.priority-actions .controls` specifically (already scoped by that
   selector, added in Phase 3) so the buttons float individually. Each
   button already gets its own box from the global `button` base style in
   `index.css` — that's correct and matches the mockup, only the *wrapping*
   panel needs to go.

6. **Popover opacity fix.** `index.css` has a global `button:disabled {
   opacity: 0.4 }`. `CardTile` renders as `<button disabled>` when it has
   no `onClick` (true for the popover's `CardTile` instance in
   `MiniTile.tsx`, since it's read-only), so it inherits that 40%-dim look
   even though `.mini-tile-popover` itself is `opacity: 1`. The existing,
   already-proven fix for this exact issue is one line — see
   `.stack-entry .card-tile:disabled { opacity: 1; }` and
   `.zone-viewer-cards .card-tile:disabled { opacity: 1; }` in App.css for
   the pattern (each comments "only override the generic dimmed-disabled-
   button look"); add the matching
   `.mini-tile-popover .card-tile:disabled { opacity: 1; }`.

7. **Tapped-state redesign** (small JSX change, in both `CardTile.tsx` and
   `MiniTile.tsx`). Currently `.card-tile.tapped`/`.mini-tile.tapped` do a
   full `transform: rotate(90deg) scale(...)`. Replace with an MTG
   Arena-style treatment: a partial rotation (not 90°), a dimming overlay
   (reduced opacity or a dark semi-transparent scrim), and a translucent
   tap-icon overlay on top. For the icon, **reuse the existing tap symbol
   asset** — `manaSymbolUrl('T')` from `client/src/ui/mana.ts` already
   resolves to `public/mana/T.svg` (the same sliced-WotC-artwork system
   `<Symbols>` uses for `{T}` in rules text) — don't add a new icon system
   for this; render that SVG as an absolutely-positioned overlay `<img>`
   at reduced opacity. A small enough rotation angle likely doesn't need
   the current scale-down compensation at all (re-derive whether it's
   still needed once the angle is decided, using the same overflow math
   Phase 4's `.mini-tile.tapped` comment worked through: rotating by angle
   θ needs `scale <= min(box-width, box-height) / max(rotated bounding
   box dimensions)` to stay inside the reserved flex space, and a small θ
   makes that constraint much looser than 90° did).

**Done as:** items 1-7 landed together as one commit (the tokens step is a
prerequisite for everything visual after it, so splitting them apart would
have left intermediate commits looking broken). A few things worked out
differently from how this section predicted, all confirmed live rather than
assumed:

- **Item 1**: kept the existing token *names* (`--bg`/`--panel`/`--border`/
  `--muted`/`--accent`/etc.) and only changed their *values* to the felt/gold
  palette, plus added `--border-soft`, `--muted-dim`, `--accent-dim`, and
  `--gold` as new tokens — every existing rule written against the old names
  picked up the new look for free instead of needing a rename pass across
  App.css. `color-scheme` changed from `light dark` to `dark` (this app
  commits to one dark felt look, not a light/dark toggle).
- **Item 3**: the seat-colored `.side-zone.seat-*`/`.board.seat-*` rules
  (pre-existing, for identity coloring) still cascade onto the new
  `.quadrant-body .side-zone` divider — same specificity, later in the file
  wins — so each quadrant's command-rail divider ends up tinted in that
  seat's color rather than a flat neutral `--border-soft`. Kept deliberately
  (confirmed live, looks intentional, matches the app's existing per-seat
  identity convention) rather than fighting the cascade for a plainer line.
  `.board.opp`'s own `background` needed one extra specificity bump
  (`.quadrant-body .board.opp`, not just `.quadrant-body .board`) to
  actually win over the pre-existing `.board.opp` rule — verified via
  computed styles in a live 4-player room, not assumed from reading the CSS.
- **Item 4**: the fan is suppressed (flat `--r`/`--y: 0`) specifically while
  `mode === 'priority' && !handRaised` (the collapsed peek) — every other
  mode, including every forced-decision mode, fans normally. Confirmed live
  that this avoids the "broken/clipped" look this section worried about.
- **Item 7**: re-derived the rotation/scale relationship properly rather
  than trusting "a small θ makes that constraint much looser than 90° did"
  above — it doesn't. A rotated box's own bounding box grows fastest around
  45°, not monotonically with angle, so 20° needs *about the same* (if
  anything marginally more) scale-down as a full 90° turn for both the 5:7
  card box and the 4:3 mini box (~0.70-0.72 either way). 20° was kept purely
  for legibility, not because it saves anything on the scale math (see the
  comments on `.card-tile.tapped`/`.mini-tile.tapped` in App.css for the
  worked numbers). Layering the scrim/badges/tap-icon correctly needed
  explicit `z-index`s (1/2/3) rather than relying on paint order, because
  `MiniTile`'s `.mt-art` (unlike `CardTile`'s `.ct-art`) is itself
  `position: absolute` and would otherwise paint over a z-index:auto scrim.
- Verified live per this phase's own testing note: a real 4-player room
  (quadrant frames, command rail, tapped lands, hand fan, raised/collapsed
  peek) and a real 2-player room (classic layout's `.board`/`.side-zone`
  keep their own boxed style unaffected, since the quadrant overrides are
  scoped under `.quadrant-body`) — both via the real server + lobby UI, not
  `scratch.mjs`, casting real spells and tapping real lands for mana rather
  than `debugSpawn`.

**Explicitly out of scope for this phase** (per the user, item 6 of their
list): no "available mana" indicator — see the note appended to Phase 7
above. A *floating*-mana upgrade (`PlayerPanel.tsx`'s existing `.pp-mana`,
currently plain text like `2{W}` via `manaString()`) to use real
`<Symbols>` pips instead was raised as an optional nice-to-have, not
requested — ask before doing it, don't fold it into this phase silently.

### Phase 9 — Hand fixes + mulligan popup — DONE

User feedback after living with Phase 8's hand fan for a while, unrelated to
any specific earlier phase's own predictions:

1. **Unplayable-card dimming removed.** `CardTile` renders as `<button
   disabled>` when a card isn't currently playable (`clickable` false), which
   picked up `index.css`'s generic `button:disabled { opacity: 0.4 }` —
   correct for the board/stack/zone-viewer (those uses of `:disabled` really
   do mean "not relevant"), wrong for the hand, where it just means "can't
   afford this right now" and made half your hand look like it had gone
   missing. Fixed the same way the stack/zone-viewer/mini-tile-popover
   already override this for their own read-only cases: `.hand-card
   .card-tile:disabled { opacity: 1; }` in App.css.
2. **Fixed card silhouette.** `.card-tile` only sets `min-height` (a floor),
   so a card with a lot of rules text (e.g. Craterhoof Behemoth) rendered
   visibly taller than a vanilla Forest — fine elsewhere (a stack/
   zone-viewer tile growing to fit is harmless), wrong in the hand, where it
   broke the fan's silhouette. `.hand-card .card-tile { height: calc(
   var(--card-w) * 1.4); }` makes hand cards a real fixed box; the existing
   `overflow: hidden` on `.card-tile` clips whatever text doesn't fit,
   exactly like the mockup's `.hc-text { overflow:hidden }`.
3. **No second row, overlap instead of shrinking.** `.hand-cards` was
   `flex-wrap: wrap`, so more than ~7-8 cards (depending on viewport)
   wrapped to a second line. Changed to `flex-wrap: nowrap` and ported the
   mockup's core idea: cards never shrink below their normal `--card-w`
   size — once N cards no longer fit the row at that width, they overlap
   (a shrinking, eventually negative, `margin-left`) instead, capped at
   `-cw*0.82` so a huge hand never fully hides a card. Differs from the
   mockup's implementation in one way: rather than duplicating `--card-w`'s
   `clamp(96px,9vw,150px)` bounds as a second hardcoded formula in JS (which
   the mockup does and would need to be kept in sync by hand), the real port
   measures an actual rendered `.hand-card .card-tile`'s width via a
   `ResizeObserver` on the hand row (`App.tsx`'s `handRowRef`/
   `handCardGap` state) — single source of truth, stays correct if
   `--card-w` ever changes. Applies uniformly to every mode that renders the
   hand (priority, discard, put-on-bottom, mulligan), not just priority.
4. **Mulligan moved to a centered popup**, out of the inline `.controls`
   banner every other forced decision still uses. It's the one decision
   that blocks the whole table (every player still deciding, in parallel —
   see `state.ts`'s `awaiting: {kind:"mulligan"}`), so per the user it
   deserves an attention-grabbing placement rather than sharing space with
   the hand strip. New `.mulligan-modal`/`.mulligan-modal-actions` in
   App.css (`position: fixed; top/left: 50%; translate: -50% -50%`, gold
   border, felt-panel background, matching the app's existing popup idiom
   like `.overlay-box`/`.zone-viewer-box` but without a full-screen backdrop
   — the hand keeps rendering normally in the in-flow hand-strip underneath
   so the player can still see what they'd be keeping while deciding).
   `App.tsx`'s big `controls` if/else chain lost its `mode === 'mulligan'`
   branch entirely (moved into a new standalone `renderMulliganModal()`,
   rendered once at the top level next to `.priority-actions`) rather than
   computing the same content twice.

Verified live via `scratch.mjs` (not the real server — a small enough,
config-only change that the usual scratch workflow was the faster path,
unlike Phase 8's note about needing the real lobby/decks): a 19-card hand
(opening 7 Forests + 12 debug-spawned cards including two long-text real
cards, Craterhoof Behemoth and Blasphemous Act, with only 2 untapped lands
so several cards were genuinely unaffordable) rendered as a single
non-wrapping overlapping row, every `.card-tile` measured `150×210`
(`offsetWidth`/`offsetHeight`, unaffected by the fan's `rotate`) regardless
of card text length or disabled state, and every tile's computed `opacity`
was `1` including the four disabled/unaffordable ones. Separately, with
`mulligans: true` in `Game.create`, the Keep/Mulligan popup appeared
centered on screen (not as a bottom banner) through a full
keep→mulligan→keep cycle, and the subsequent put-on-bottom step (a
different forced-decision mode, untouched by this phase) still rendered
inline as before.

### Phase 10 — 2-player/quadrant parity, real arch, mulligan-popup hand — DONE

More user feedback on Phase 9's own work, all landed together:

1. **2-player layout now uses the same quadrant-cell frame as 3-4 player.**
   `Table` (App.tsx) used to branch on `opponents.length >= 2`: 3-4 players
   got the bordered `.quadrant-cell` treatment (Phase 8), but 2 players got
   a separate, older layout -- `.pinned-top`/`.pinned-bottom` banner strips
   plus unboxed `.opponent-block`/`.player-area-with-sidezone` -- that never
   picked up Phase 8's one-frame-per-seat redesign, so it looked visibly
   behind. Replaced with a single code path for every player count: a
   `quadrantCells` array (`[opponent, you]` for 2 players, the existing
   `[oppA, oppB, you, oppC]` for 3-4) rendered through the exact same
   `.quadrant-cell`/`.quadrant-head`/`.quadrant-body` markup. `.quadrant-grid`
   gained a `.two-player` modifier (`grid-template-columns: 1fr;
   grid-template-rows: 1fr 1fr`, opponent on top, you on the bottom) instead
   of the 2x2 grid -- same frame component, just a 1-column arrangement,
   matching how the mockup's own `.layout-2p` reused `.quad` rather than a
   different layout. `.pinned-top`/`.pinned-bottom`/`.player-area-with-
   sidezone`/`.player-area` are gone from App.css (fully dead once the old
   branch was removed).
2. **The hand fan is a real arch now, and always on.** Two bugs in Phase 9's
   port of the mockup's fan, both in App.css's `.hand-cards .hand-card`:
   - `translate: 0 calc(-1 * var(--y))` had the sign flipped from the
     mockup's `translate: 0 var(--y)` -- our port raised outer cards *up*
     (higher than center), the opposite of a real card fan (center card
     peeking highest, outer cards angling down and away). Removed the
     negation so it matches the mockup: positive `--y` (larger for cards
     further from center) now moves them *down* relative to the center
     card, which is what actually reads as an arch.
   - The fan was suppressed (flat, `--r`/`--y` both unset) specifically
     during the collapsed peek (`mode === 'priority' && !handRaised`) --
     a deliberate Phase 8 decision at the time ("avoids a broken/clipped
     look"), but the user now wants the arch visible even in the peeked
     sliver, not just once raised. Removed the `fanned` conditional
     entirely in App.tsx -- `--r`/`--y` are set unconditionally now, in
     every mode including the collapsed peek and the mulligan popup.
3. **Mulligan popup now includes the hand itself**, not just the prompt and
   buttons. Extracted the hand's render (title + `.hand-cards` row, unified
   with #2 above) into a new `renderHand()` in App.tsx, shared between
   `renderHandAndControls` (every mode except mulligan) and
   `renderMulliganModal` (mulligan only) -- the same hand only renders in
   one place per mode, never twice. `.mulligan-modal` widened to `min(90vw,
   1100px)` (roughly the old peekable hand-strip's own width budget) with
   `max-height: 90vh; overflow-y: auto` so a fanned 7-card hand fits
   comfortably without forcing heavy overlap.

Verified live via `scratch.mjs`: with `mulligans: true`, the popup showed
"Keep your opening hand?", the 7-card hand fanned in a clear arch (center
card highest, outer cards rotated and drooping down on both sides -- a
screenshot zoom confirmed the shape directly) and Keep/Mulligan buttons,
centered on screen; clicking Mulligan cycled to "Mulligan #1 taken -- keep
this hand?" with a fresh hand, and the later put-on-bottom step (untouched
by this phase) still rendered inline as before. After keeping, the
collapsed peek at the bottom edge showed the fan's rotation in the sliver
itself (not flat), and hovering to raise it showed the same arch as the
modal. Separately, a 2-player room's board rendered through the same
bordered `.quadrant-cell` frame as a 3-4 player room (verified: header
divider, command/library rail divider, per-seat active-turn/self styling
all present) instead of the old unboxed layout, with real battlefield
permanents (mini tiles, P/T badges, land/creature row ordering) unaffected.

### Phase 11 — Hand card matches the mockup's own layout — DONE

User ask: shift each individual hand card closer to the mockup's own
`.hand-card`/`.hc-*` layout (art first, cost pips floating on the art
itself, name below instead of a title bar above), but with real mana-symbol
SVGs (`<Symbols>`) in place of the mockup's placeholder colored circles.

**Done as:** `CardTile.tsx` gained a `layout?: 'title' | 'art-first'` prop
(default `'title'`, unchanged everywhere else) rather than a new component,
since every other piece -- art loading/caching, the keyword line, counters,
P/T/loyalty badges, the tapped-state scrim -- is identical between the two,
just reordered. `'art-first'`: no `.ct-title` bar; `.ct-cost` (the same
`<Symbols>`-rendered pips, unchanged) renders inside `.ct-art` instead, in a
new absolutely-positioned `.ct-cost-overlay` (top-right, a translucent dark
chip so the pips read against any art); the name renders below the art in a
new `.ct-name-row` instead of above it. `.card-tile.art-first .ct-art` gets
`flex: 0 0 46%; height: auto` (was a fixed `86px`) to match the mockup's own
proportion, matching the mockup's `flex:0 0 46%` (fine since the hand card's
overall height is already fixed per Phase 9). App.tsx's hand `CardTile` call
passes `layout="art-first"`; every other `CardTile` call site (board
popover, stack, zone-viewer) is untouched.

**Bug found and fixed during verification, not present before this phase**:
`.ct-art img { width:100%; height:100% }` was written back when `.ct-art`
only ever held one `<img>` (the card's own art) -- once the cost overlay's
pip `<img>` also nests inside `.ct-art`, that rule matched it too and blew
the mana-symbol SVG up to the size of the whole art box (a giant "1" circle
swallowing the card). Fixed by scoping the rule to `.ct-art > img` (direct
child only) instead of the descendant combinator -- the overlay's `<img>` is
nested two levels deeper (`.ct-art > .ct-cost-overlay > .ct-cost > img`), so
it stops matching without touching the pip's own sizing at all.

Verified live via `scratch.mjs`: a hand mixing Forests, Urza's Incubator,
and Grizzly Bears showed art filling the top of each card, real mana-pip
SVGs (generic `{2}`/`{1}{G}`) overlaid top-right on the art in a dark chip,
the name/type below, and the P/T badge bottom-right for Grizzly Bears --
confirmed via a cropped screenshot before *and* after the `.ct-art > img`
fix (the "before" shot is what caught the bug).

### Phase 12 — Stack targeting/hover, hand-art edge bug, mini-tile size — DONE

Three more user-reported gaps, unrelated to each other, landed together:

1. **Stack entries are now legal-target-clickable and hover-readable.**
   `Stack.tsx` didn't wire any of `tileFor`'s targeting logic (`highlight`/
   `selected`/`onClick`) -- a spell on the stack could only be targeted via
   the existing text-button fallback in the inline `controls` panel ("Cast
   Counterspell: choose spell — Cyclonic Rift (on the stack)"), never by
   clicking the card itself. The *engine* side already fully supported this
   (a `TargetSpec` of `"spell"`/`"creature-spell"`/`"noncreature-spell"`/
   `"instant-or-sorcery-spell"` resolves to ordinary `{kind:"object"}`
   `TargetRef`s regardless of zone) -- this was a client wiring gap, not a
   missing architecture piece. Fixed by moving `<Stack>`'s render call from
   `GameScreen` (a sibling of `Table`, with no access to its targeting
   state) into `Table`'s own return, next to `renderMulliganModal()`, and
   giving `Stack` new `targetSlot`/`pickedIds`/`onTargetClick` props sourced
   from the exact same `targetSlot`/`pickedObjKeys`/`clickPermanent` `Table`
   already computes for battlefield permanents -- `CardTile`'s existing
   `highlight`/`selected`/`onClick` props do the rest, no new targeting
   logic needed.
   Also: a buried stack card (small/dimmed/rotated by depth) couldn't
   actually be *read* without resolving everything in front of it first.
   Fixed by switching `Stack.tsx`'s per-depth `top`/`right`/`transform`/
   `opacity`/`z-index` from direct inline styles to CSS custom properties
   (`--st-y`/`--st-x`/`--st-rot`/`--st-scale`/`--st-opacity`/`--st-z`) that
   `.stack-entry` reads via `var()` -- the same indirection the hand fan
   already uses (see `HAND_FAN_STEP_DEG`'s comment) specifically so a
   `:hover`/`:focus-within` CSS rule can cancel them with a plain rule
   instead of fighting an inline style, which always wins over a stylesheet
   rule short of `!important`. `.stack-entry:hover,:focus-within { transform:
   none; opacity: 1; z-index: 999; }` pops the hovered/focused card to full
   size in place (position unchanged) without needing any JS.
2. **Hand-card art now genuinely fills to the card's edges.** Root cause:
   `.zone-viewer-card > button, .hand-card > button { padding: 2px 8px }`
   was written for the small secondary action buttons (Suspend/Foretell/
   Cycle/multi-face plays/cast-from-zone) that sit *alongside* `CardTile` as
   siblings under `.hand-card`/`.zone-viewer-card` -- but `CardTile` itself
   renders as a `<button>` and is *also* a direct child there, so the bare
   `button` selector matched it too, and (being an element+class selector,
   marginally more specific than `.card-tile`'s own class-only `padding: 0`)
   won, insetting the whole tile by that padding on all four sides. Mostly
   invisible in the old title-first layout (the title bar's own background
   partially masked it); glaring in Phase 11's art-first layout, where nothing
   sat between the card's edge and the art. Fixed with `:not(.card-tile)` on
   both selectors. This was a pre-existing bug, not something Phase 11
   introduced -- Phase 11 just made it visible.
3. **Board permanent tiles (MiniTile) sized up to match the mockup.**
   `--mini-w` was `clamp(50px, 4.6vw, 78px)`; the mockup's own `.mini` is
   `clamp(46px, 5.4vw, 80px)` -- floor/ceiling were already close, but our
   4.6vw scaled noticeably slower than the mockup's 5.4vw at ordinary
   desktop widths, reading smaller than the reference at anything short of
   the ceiling. Changed to match the mockup exactly.

Verified live via `scratch.mjs`: a real Counterspell cast (from hand, with 2
untapped Islands) against two debug-spawned stack spells showed both as
`highlight clickable` `CardTile`s; clicking one directly (bypassing the
text-button fallback entirely) dispatched the target and resolved correctly
(confirmed via the resulting graveyard count). Hovering a buried 5-deep
stack entry showed `transform: none; opacity: 1; z-index: 999` via computed
style, and a screenshot confirmed it visually popping to full size in place.
The hand-art padding fix was confirmed both by computed style (`padding:
2px 8px` → `0px`) and a before/after cropped screenshot showing the art
reaching every edge. The mini-tile size bump was confirmed via a cropped
before/after screenshot of the same battlefield permanents.

### Phase 13 — Targeting banner removed, hand widened, text shrink-to-fit — DONE

1. **The targeting `.controls` banner is gone specifically when every legal
   option is a spell on the stack.** Since Phase 12 made stack entries
   directly clickable/highlighted as targets, the banner's `stackTargets`
   text-button list (`"Cyclonic Rift (on the stack)"`) duplicated the real,
   now-clickable cards right above it — confusing, not helpful. `App.tsx`'s
   `mode === 'targeting'` branch now computes `allStackTargets` (every
   option in the current slot is a stack object) and renders `controls =
   null` in that case; every other targeting case (creature/player targets,
   still not directly clickable everywhere) keeps the label+Cancel banner
   as before. Escape still cancels either way (the existing global keydown
   handler, untouched).
2. **Hand-strip width widened.** `.hand-strip.peekable` (the ordinary
   priority-mode browsing tray) was `width: min(78vw, 1100px)`; bumped to
   `min(94vw, 1500px)` -- more room means the hand's own overlap math (see
   `HAND_CARD_GAP`) needs less overlap to fit an ordinary hand before
   cards start squashing together. The mulligan popup's own width was left
   alone (still `min(90vw, 1100px)`) -- it's a centered modal dialog, not
   a persistent browsing tray, so matching the peekable tray's new width
   1:1 wasn't appropriate; only the comment explaining the two was
   updated since it referenced a now-inaccurate "same budget" claim.
3. **Hand-card rules text now shrinks to fit instead of silently clipping**
   (Wurmcoil Engine and other wordy cards). `CardTile.tsx` gained a
   `useLayoutEffect` (art-first/hand layout only) that measures `.ct-text`'s
   `scrollHeight` vs. `clientHeight` and, if it overflows, decrements a
   `--text-scale` custom property in 0.05 steps (floor 0.55) re-measuring
   after each step, until it fits or bottoms out -- a single ratio-based
   guess (`clientHeight/scrollHeight`) was considered and rejected, since
   font-size doesn't reduce wrapped line count linearly (over/undershoots).
   `.ct-text`'s `font-size` reads `calc(9.5px * var(--text-scale, 1))`
   (unset = 1 = unchanged everywhere else). Needed one supporting fix:
   `.card-tile.art-first .ct-text { min-height: 0; }` -- without it, a flex
   item's default `min-height: auto` lets `.ct-text` grow to fit its own
   content instead of respecting its flex-computed share, which would have
   made `scrollHeight > clientHeight` never true even while the card's own
   fixed height was visibly clipping the last lines. Scoped to `art-first`
   only so a stack/zone-viewer/board tile (no fixed card height) keeps
   growing taller to fit its text if it must, same as before.

Verified live via `scratch.mjs`: casting a real Counterspell (2 untapped
Islands) against two stack spells showed no `.controls` banner at all
(`document.querySelector('.controls')` → `null`) while both stack entries
stayed `highlight clickable` and a direct click still resolved the counter
correctly. The hand (10 cards) visibly spanned much more of the screen width
at the new cap. Wurmcoil Engine's card was checked by instrumenting the
effect (a temporary diagnostic, removed after) to confirm the shrink loop
actually runs and converges -- it settled at `--text-scale: 0.55` with
`scrollHeight === clientHeight` (65 === 65, an exact fit), confirmed with a
cropped screenshot showing the full ability text fitting inside the card
instead of being cut off mid-line.

### Phase 14 — Hover-to-grow hand cards, drop redundant keyword text — DONE

Two more user asks, both readability-driven follow-ups to Phase 13's
shrink-to-fit:

1. **Hand cards grow on hover, not just lift.** A card whose rules text got
   shrunk (see Phase 13) could still end up genuinely hard to read at the
   hand's normal on-screen size — a bigger fix than font-size alone.
   `.hand-cards .hand-card` gained `transform-origin: bottom center` (so
   growth expands upward/outward from the card's own base instead of also
   pushing down into the row below it) and a `scale` property (`1` at rest,
   part of the same standalone-property transition list as `rotate`/
   `translate` — not `transform`, for the same reason noted in this file's
   other hover work: a stylesheet `:hover` rule can't cleanly override an
   inline `transform`, but it can override standalone `rotate`/`translate`/
   `scale`). `:hover`/`:focus-within` (keyboard/touch parity, same
   convention as the stack's own hover reveal) sets `scale: 1.65` alongside
   the existing lift/de-rotate, growing the whole tile — its already-shrunk
   text included — well past normal size.
2. **Dropped the redundant keyword restatement in card body text.** The
   bold `.ct-kw` line (e.g. "Deathtouch, Lifelink") and the printed rules
   text both showed the same words — most cards restate their keywords as
   the first line/sentence of Oracle text, which `.ct-kw` already surfaces
   on its own. `CardTile.tsx`'s `bodyText(obj)` now strips a leading
   keyword-only segment from what's actually displayed in `.ct-rules`,
   terminated by either a real line break or (for some of this pool's
   hand-authored cards, e.g. Wurmcoil Engine's `"Deathtouch, lifelink. When
   ~ dies, …"`) a `". "` within one paragraph — both count, since this
   pool's card text doesn't consistently use one or the other. Only the
   *leading* segment is ever stripped; a later mention of the same word
   elsewhere in the text (Wurmcoil Engine's own sentence describes what
   abilities the *tokens it creates* have) is left untouched, since that's
   real content, not restatement. Applies to every `CardTile` (not just the
   hand's art-first layout) — the duplication was never layout-specific, it
   was just easiest to *see* once Phase 13 made the hand's own box tight
   enough to force shrinking around it. A nice side effect: less text to
   fit means Phase 13's shrink-to-fit needs a less aggressive `--text-scale`
   for the same card (Wurmcoil Engine went from 0.55, the shrink floor
   basically maxed out, to 0.7 with the duplicate line gone).

Verified live via `scratch.mjs`: hovering a hand card (confirmed both a
plain Forest and Wurmcoil Engine specifically) grew it well above its
fanned neighbors, upright and at full opacity, screenshot-confirmed both
times. Wurmcoil Engine's `.ct-rules` text was checked via computed
`textContent` before and after: no longer starts with "Deathtouch,
lifelink" (that now shows once, bold, via `.ct-kw`), and Craterhoof
Behemoth (a real-newline-separated keyword line, the other code path
through the same regex) was checked the same way and also deduplicated
correctly.

### Phase 15 — No hover-grow in the mulligan popup, no native tooltips — DONE

Two follow-ups from actually using Phase 14's hover-grow:

1. **Hand cards no longer grow on hover inside the mulligan popup.** The
   mulligan modal shows the whole hand at once purely to read it before a
   keep/mulligan decision — growing whichever card the mouse happens to
   cross while scanning the fan was distracting there, not helpful, unlike
   the ordinary browsing hand Phase 14's hover-grow was built for. Added
   `.mulligan-modal .hand-cards .hand-card:hover, :focus-within` resetting
   `translate`/`rotate`/`scale`/`z-index` back to the same values as the
   unhovered state — wins over Phase 14's general rule on specificity (one
   extra class) without needing `!important`. The ordinary hand-strip
   (outside the mulligan popup) is untouched and still grows on hover.
2. **Dropped the native browser title-attribute tooltip** on `CardTile`
   (`title={obj.text || face}`) and `MiniTile` (`title={face}`) — both were
   redundant with content the tile already shows (or, for `MiniTile`, with
   its own proper `.mini-tile-popover` hover reveal) and, being a plain OS/
   browser tooltip, couldn't be styled or suppressed short of removing the
   attribute; it was popping up over cards, hand and board alike, on any
   hover that lingered past the browser's own delay. `CardTile`'s handful of
   small, genuinely-clarifying tooltips on cryptic sub-elements (the
   multi-face "⇄" marker, the commander-tax badge, a planeswalker's
   "Loyalty" label) were left alone — those aren't full-card duplicates,
   just short glosses on an otherwise-unlabeled icon.

Verified live via `scratch.mjs` (`mulligans: true`): hovering a card inside
the "Keep your opening hand?" popup left the whole fan unchanged (screenshot
confirmed no growth), while keeping the hand and hovering the same way in
ordinary priority mode still grew the hovered card as before. Confirmed via
`hasAttribute('title')` that no hand-card `.card-tile` carries a `title`
attribute any more.

### Phase 16 — Board tiles get a real max size, shrink only when crowded — DONE

Final user ask to close out this redesign: `--mini-w` (battlefield permanent
tiles, via `MiniTile.tsx`) was a pure viewport-width clamp
(`clamp(46px,5.4vw,80px)`) with no relationship at all to how many
permanents were actually on a given board — a board with 2 creatures and a
board with 20 rendered tiles at the exact same (small) size, the 20-creature
board just wrapping to more rows. Bumped the ceiling substantially
(`clamp(56px, 7.2vw, 130px)`) so an ordinary, uncrowded board reads much
bigger by default.

**First cut (revised the same session, see below):** shrink to fit every
tile onto one row whenever a board's item count didn't fit the ceiling size
at the board's measured width. **User feedback: wrong tradeoff** —
multiple rows of creatures is normal (a physical table does the same), and
shrinking should only be the fallback once even wrapping can't keep a board
inside its own visible area, not the default response to "more than fits
one row." Reworked to match:

**Final implementation** (`App.tsx`): tiles wrap at the full ceiling size
by default — plain CSS `flex-wrap`, nothing new needed there — and only
shrink once that wrapped layout actually overflows the board's own
scrollable area (`.quadrant-body`'s `overflow-y:auto`, present at every
player count since Phase 10 unified 2-4 players onto the same quadrant-cell
structure). `recomputeBoardMiniW(boardEl)`: resets `--mini-w` to nothing
(natural ceiling), and if `.quadrant-body`'s `scrollHeight` still exceeds
its `clientHeight` after that reset — real overflow, not a guess — steps
`--mini-w` down (6px at a time, floor 40px) via direct
`boardEl.style.setProperty`, re-measuring after each step, until it fits or
bottoms out. Mirrors `CardTile.tsx`'s own text shrink-to-fit loop
(Phase 13) for the same reason: a single ratio-based guess
(`clientHeight/scrollHeight`) over/undershoots because reflowed wrap counts
don't scale linearly with tile size, so measuring after each step is worth
the extra cheap reflow reads.

Two independent triggers feed this, both needed: `.quadrant-body` *resizing*
(a window resize, a layout change) via a `ResizeObserver`, and a board's own
*tile count* changing (a permanent entering/leaving) via a `MutationObserver`
on each board's subtree — `overflow:auto` means content growing alone
doesn't resize `.quadrant-body`'s own box, so `ResizeObserver` alone
wouldn't catch that case. Same constraint as the first cut drove the
plumbing shape: up to 4 boards each need independent handling, and
`renderBoard` is a plain closure invoked in a `.map()`, so hooks can't be
one-per-board — a shared `Map<PlayerId, HTMLDivElement>` (`boardElsRef`)
plus one shared instance of each observer, fed by a `registerBoardEl(pid)`
ref-callback factory attached to each `.board` div, which also runs an
initial `recomputeBoardMiniW` and wires both observers up to that specific
board (and its ancestor `.quadrant-body`) when it mounts. Resetting to the
ceiling and re-measuring from scratch every time (rather than nudging
up/down from wherever a tile last landed) is also what makes a board grow
back once it's no longer crowded — a creature dying, say — not just shrink
further. No React state at all for the sizing itself (a deliberate change
from the first cut's `boardWidths` state) — `recomputeBoardMiniW` mutates
the DOM directly, same as `CardTile.tsx`'s text shrink-to-fit, sidestepping
any render-timing complexity around "reset, then measure the reset."

`naturalMiniW()` still duplicates `--mini-w`'s own `clamp()` bounds in JS
(floor/vw-factor/ceiling) rather than measuring an actual rendered tile —
the natural size only depends on viewport width, not on any container that
would need to render first to read from, so there's nothing to gain by
measuring instead; keep the two in sync if that token's `clamp()` in
index.css ever changes.

Verified live via a 4-player `scratch.mjs` game with three different board
densities at once: a sparse board (2 creatures) kept the raw
`clamp(56px, 7.2vw, 130px)` on `--mini-w` (no override — not needed); a
moderately crowded board (14 distinct real creatures, which never
auto-stack regardless of shared names — only tokens/lands do) also kept the
ceiling and simply **wrapped to two rows**, confirmed by screenshot; and an
extremely crowded board (40 copies of the same non-token creature, so 40
real separate tiles) computed a real override (`--mini-w: 64px`) and
wrapped to several rows at that shrunk size. `getComputedStyle` confirmed
`.quadrant-body`'s `scrollHeight === clientHeight` (`overflowing: false`)
for **all four** boards afterward, including the 40-tile one — the shrink
loop actually converges to eliminate the scrollbar it was watching for,
not just "shrinks some."

### Phase 17 — Hand card type line also shrinks to fit — DONE

Small follow-up to Phase 13's rules-text shrink-to-fit: the type line (e.g.
"Artifact Creature — Phyrexian Wurm") only ever ellipsis-truncated when it
didn't fit `.ct-type`'s fixed width, unlike the rules text below it, which
already shrinks to stay fully readable (Phase 13). Gave it the same
treatment: `CardTile.tsx` gained a second, near-identical `useLayoutEffect`
(art-first/hand layout only, same as the rules-text one) that measures
`.ct-type`'s `scrollWidth` vs. `clientWidth` — one dimension instead of the
rules text's two, since `.ct-type` is a single `white-space:nowrap` line —
and steps a `--type-scale` custom property down (same 0.05 step, 0.55 floor)
until it fits or bottoms out. `.ct-type`'s `font-size` reads
`calc(8.5px * var(--type-scale, 1))`; `overflow:hidden` +
`text-overflow:ellipsis` stay in place as the fallback for the (rare) case
where even the floor doesn't fully fit.

Verified live via `scratch.mjs`: three hand cards with type lines of
increasing length — Craterhoof Behemoth ("Creature — Beast"), Miirym,
Sentinel Wyrm ("Creature — Dragon Spirit"), Wurmcoil Engine ("Artifact
Creature — Phyrexian Wurm") — showed only Wurmcoil Engine's actually needed
shrinking (`--type-scale: 0.9`, converging to `scrollWidth === clientWidth`,
148 === 148), the other two staying unscaled since they already fit;
confirmed visually too via a hover screenshot showing the full unclipped
type line.

### Phase 18 — Large-hand fan: rotation cap, hover jitter, paint-order fix — DONE

User feedback from a large-hand stress test (a hand well past the mockup's
own tested range — its "many" preset tops out at 14 cards), three
independent bugs found and fixed together:

1. **Unbounded rotation.** `HAND_FAN_STEP_DEG`/`HAND_FAN_STEP_Y` are
   per-card constants with no ceiling on the *total* sweep — fine at the
   mockup's tested sizes (outermost card well under 30°), but a hand that
   draws well past that (easy before a cleanup-step discard) pushed the
   outermost card's rotation past 60-90°, which stops reading as a fan at
   all. Added `HAND_FAN_MAX_ROT_DEG`/`HAND_FAN_MAX_LIFT_PX` (32°/38px):
   `renderHand()` now computes an *effective* per-card step
   (`Math.min(step, cap / maxOffset)`) so the sweep only ever compresses
   below the tuned default, never exceeds it — an ordinary-sized hand
   (roughly ≤15 cards, where the natural sweep already sits under the cap)
   renders identically to before.
2. **Hover jitter on a heavily-overlapping hand.** Reported as "hovering a
   spot that touches the shrunk card but not the zoomed one makes it jitter
   like crazy," and reproduced: `.hand-cards .hand-card` was both the
   `:hover`-matching element *and* the element Phase 14's grow-on-hover
   transform moved — translating/scaling a hovered element out from under a
   stationary cursor makes `:hover` stop matching mid-transition, which
   un-hovers it, moves it back under the cursor, re-hovers, repeat. Fixed by
   splitting the two roles the same way `MiniTile.tsx`'s popover already
   does: `.hand-card` itself (the flex item, positioned by layout/margin
   only) never transforms and is the sole `:hover`/`:focus-within` target;
   the fan's baseline `rotate`/`translate` *and* the hover grow both moved
   onto `.hand-card .card-tile` (a child), driven by the parent's hover
   state (`.hand-card:hover .card-tile {...}`) rather than the child's own.
   `z-index` stays on the parent (a child's z-index doesn't reorder its
   *siblings*, only its own children) — verified stable via a 1.5s polling
   trace at a real overlap boundary (`element.matches(':hover')` sampled
   every 100ms) showing zero flicker, where the same trace before this fix
   would have shown the hovered index changing every transition tick.
3. **Cards look like they're fanning the wrong way once there's enough
   overlap to hide it (there isn't, at ordinary hand sizes).** Not a
   rotation-sign bug — verified byte-for-byte against the mockup's own
   `off = i-(N-1)/2; rotate:var(--r)` and by fetching the live mockup
   artifact and measuring its actual rendered corner positions, both
   matching this client exactly. The real cause: default stacking (no
   `.hand-card` had its own `z-index` outside `:hover`) paints a later
   sibling over an earlier one, i.e. each card's more-central neighbor
   always paints on top of it. For a left-of-center card that neighbor sits
   on its *right* — exactly where that card's own rotation lifts its inner
   corner — so the corner that's supposed to visibly tilt up toward center
   was getting buried under the neighbor, while the right half (where the
   more-central neighbor is earlier in DOM, i.e. already underneath) never
   had the problem. Invisible with a handful of cards (little/no overlap);
   glaring once overlap is heavy, which reads as "the rotation direction is
   backwards" even though the per-card angle never changed sign. Fixed with
   a `--z` custom property (`Math.abs(fanOffset) * 10`, same
   custom-property-feeds-a-real-property indirection as `--r`/`--y`, so a
   plain `:hover` rule can still win without a specificity fight): edges in
   front, center card at the back, symmetric on both sides, so every card's
   inward corner stays exposed regardless of which side of center it's on.
   Hover's own `z-index` bumped from 20 to 10000 to stay above any hand size
   (37 cards tops out around 180).

Verified live via a 37-card synthetic hand (`.scratch/stress-server.mjs`,
git-ignored, not part of the actual `scratch.mjs`): before this phase, the
collapsed peek showed near-illegible near-90° outer cards and the raised
view showed one enlarged card plus an indistinct sliver mess; after, the
peek shows a clean bounded arc and the raised view shows every card's name
legible in a coherent shingled fan on both sides, matching the mockup's own
shape. The hover-jitter fix and the rotation cap were each independently
confirmed not to regress a small (7-card) hand, which renders unchanged
(natural sweep already under the cap, negligible overlap so the paint-order
fix has nothing to correct).

## Cross-cutting notes

- **Mana pips**: everywhere the mockup shows a cost/pip, the real port must
  use the existing `<Symbols text={...} />` component (renders `{…}` tokens
  as `<img class="pip pip-img">` from sliced WotC artwork, falling back to a
  CSS pip only for symbols with no artwork) — never the mockup's placeholder
  colored circles. `CardTile.tsx` already does this correctly for the parts
  it renders; new UI (mana-available indicator, any new compact-tile cost
  display) must follow the same pattern, not reinvent it.
- **No fixed px** is the standing rule across every phase, same as Phase 1 —
  `clamp()`/`vw`/`vh`, derived from the shared `--card-w` token where it's
  card-sized content, not a new hardcoded number per phase.
- Client has no automated tests — verify every phase live in the browser
  (2-player *and* a 3-4 player room, since layouts diverge) before
  considering it done, per CLAUDE.md's UI-change instructions.
