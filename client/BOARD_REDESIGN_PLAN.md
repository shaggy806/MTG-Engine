# Board redesign — record

**Status: complete.** All 18 phases shipped and committed (see
`git log -- client/BOARD_REDESIGN_PLAN.md client/src/App.css` for the phase-by-phase
narrative, which used to live in this file). This is the design record kept for future
reference, not living documentation — see `CLAUDE.md`'s "Client architecture" section for
current shape.

**The visual reference** is a mockup iterated live as a Claude Artifact:
<https://claude.ai/code/artifact/5dddb3da-97e6-4773-8b2c-40bf1811d2a3> — read it with the
`artifact` tool if you need the exact intended look. Its details are *settled* decisions
reached over many rounds of feedback, not first drafts; don't second-guess them casually.

## What this redesign was for

The board UI was cluttered, pixel-based sizing didn't scale across monitors, there was no
way to see all 4 players' boards at once, and the hand took up too much permanent screen
space. The result: responsive `--card-w`-derived sizing, consolidated top chrome, a
peek-and-hover hand tray, compact art-first battlefield tiles with a hover popover, a
redesigned stack overlay, and a full visual reskin.

## The one lesson worth carrying forward

Phases 1-6 were each individually correct and the board still looked "very distant" from
the mockup. The gap was never structure or behavior — it was the **visual design system**
(colors, typography, decorative styling), which hadn't been ported at all. Phase 8 closed it
with a targeted, CSS-mostly pass; a full client rebuild was considered and rejected. If a
port feels wrong despite the structure matching, check the design system before rewriting
anything.

## Standing rules this established

These now live in `CLAUDE.md`'s "Standing UI rules" (repeated here because they came from
this work): no fixed px — derive from `--card-w` with `clamp()`/`vw`/`vh`; every mana symbol
goes through `<Symbols text={…} />`, never a hand-rolled coloured circle; and since the
client has no automated tests, verify every UI change live in *both* a 2-player and a 3-4
player room, because the layouts diverge.

## Known gaps

- **Mana-available indicator — descoped by the user, do not build.** The plan called for a
  per-quadrant "untapped sources by color" pip row. `Game.manaSources(player)` is private and
  exposed through neither `PlayerView` nor the wire protocol, so this needs a real engine +
  protocol feature (expose an untapped-mana-by-color summary from the same `manaSources`
  logic `payMana` uses, add the field to the wire protocol in the `protocol` workspace, then
  render it). The
  user's call: that's a lot of work for something that's the player's own job to track. A
  client-side heuristic is explicitly ruled out — inferring colour from a land's subtype is
  wrong for nonbasics, duals, rocks and dorks, and a visibly-wrong indicator is worse than
  none (see the "Rules accuracy is mandatory" standing rule).
- **Non-land token stacking is implemented but never live-verified.** In `board.ts`'s
  `computeBoardEntries` the stacking key includes power/toughness/summoningSick and the gate
  is `bucket === 'land' ? obj.power === null : obj.isToken`, so only tokens fold into a
  stack. `debugSpawn` (what `scratch.mjs` uses) always creates a real card object
  (`isToken: false`) even for a card named "Beast Token", so it cannot exercise this path —
  correctness was confirmed by inspection against `Game.mintTokenBatch`, the real minting
  site. To verify live, cast a token-making card in a real room rather than spawning one.
- **Mulligan actions still render inline** in the `.hand-strip` flow rather than the fixed
  bottom-right `.priority-actions` corner the other priority actions moved to. Left as-is
  deliberately — a mulligan is a one-time, attention-demanding decision. Unify only if it
  starts to grate.
