import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// EDHREC rank 6707.
//
// "For each player" is one optional slot per seat — you (seat 0) and each
// opponent (Windgrace's Judgment's shape, with yourself included): at most
// one target per player, and one that has come under anyone else's control
// since is an illegal target as the spell resolves (rule 608.2b), so its slot
// is blank. The legal ones are exiled together (one instruction over several
// targets), and only then does anyone cloak: for each slot whose permanent
// was exiled, its controller as it last existed (rule 608.2h — Reality
// Shift's `controllerOfTarget`) cloaks the top card of their own library
// (rule 701.58a) — a face-down 2/2 with ward {2}, turned face up for its mana
// cost if it's a creature card (701.58b). A blank slot cloaks nothing, so a
// player whose permanent wasn't exiled this way doesn't cloak.
const TEXT =
  "For each player, exile up to one target nonland permanent that player controls. For each permanent exiled this way, its controller cloaks the top card of their library. (To cloak a card, put it onto the battlefield face down as a 2/2 creature with ward {2}. Turn it face up any time for its mana cost if it's a creature card.)";

const perPlayer = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: { notTypes: ["land"] } },
});

export default defineCard({
  name: "Unexplained Absence",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  text: TEXT,
  targets: [perPlayer(0), perPlayer(1), perPlayer(2), perPlayer(3)],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "exile", target: 0 },
          { kind: "exile", target: 1 },
          { kind: "exile", target: 2 },
          { kind: "exile", target: 3 },
        ],
      },
      { kind: "manifest", who: { controllerOfTarget: 0 }, cloak: true },
      { kind: "manifest", who: { controllerOfTarget: 1 }, cloak: true },
      { kind: "manifest", who: { controllerOfTarget: 2 }, cloak: true },
      { kind: "manifest", who: { controllerOfTarget: 3 }, cloak: true },
    ],
  },
});
