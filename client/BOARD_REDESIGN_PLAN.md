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
- **Mulligan actions still render inline** in the `.hand-strip` flow rather than the fixed
  bottom-right `.priority-actions` corner the other priority actions moved to. Left as-is
  deliberately — a mulligan is a one-time, attention-demanding decision. Unify only if it
  starts to grate.

## Closed since

- **Non-land token stacking, live-verified 2026-09-23.** It had only been checked by
  inspection, because `debugSpawn` (what `scratch.mjs` and `dev-rooms` use) always makes a
  real card object, even for a card named "Beast Token". The `STACK` dev room puts token
  makers in hand to cast for real instead. White Sun's Zenith for 10 is one engine stack,
  drawn ×10, and Raise the Alarm's two Soldiers are two objects the board folds into one ×2
  tile. The check also found a bug. Jump on one Cat split that Cat off the stack with flying,
  and the board drew it under the stack's tile: ×9, one Cat short, and no flying icon.
  Tokens used to fold on name, tapped state, P/T and summoning sickness. The count was the
  larger of the tile's ids and its sample's own stack, on the assumption that the two never
  both exceed one. `board.ts` now folds only permanents identical in every field the view
  shows (`tileKey`), and counts every token in each compacted stack on a tile
  (`BoardEntry.count`).
