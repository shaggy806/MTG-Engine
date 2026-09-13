import { defineCard } from "../define.js";

/** Conditional free-cast (`freeCastIf`) — see Fierce Guardianship for the
 * mechanism. */
export default defineCard({
  name: "Deadly Rollick",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "If you control a commander, you may cast this spell without paying its mana cost.\n" +
    "Exile target creature.",
  freeCastIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 } },
  targets: ["creature"],
  effect: { kind: "exile", target: 0 },
});
