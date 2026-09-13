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

**Status: Phases 1-6 done and committed. Phase 8 is next — approved by the
user, not yet started; read Phase 8 below before doing anything else.**
Phase 5 turned out to already be built before this plan started. Phase 7's
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

### Phase 8 — Visual reskin — TODO (approved, not yet started)

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

**Explicitly out of scope for this phase** (per the user, item 6 of their
list): no "available mana" indicator — see the note appended to Phase 7
above. A *floating*-mana upgrade (`PlayerPanel.tsx`'s existing `.pp-mana`,
currently plain text like `2{W}` via `manaString()`) to use real
`<Symbols>` pips instead was raised as an optional nice-to-have, not
requested — ask before doing it, don't fold it into this phase silently.

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
