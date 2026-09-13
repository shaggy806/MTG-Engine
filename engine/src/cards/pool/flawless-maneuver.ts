import { defineCard } from "../define.js";

/** Conditional free-cast (`freeCastIf`) — see Fierce Guardianship for the
 * mechanism. Non-targeted (`grant-keyword-all`), so it needs nothing beyond
 * the free-cast plumbing itself. */
export default defineCard({
  name: "Flawless Maneuver",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "If you control a commander, you may cast this spell without paying its mana cost.\n" +
    "Creatures you control gain indestructible until end of turn.",
  freeCastIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 } },
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "indestructible",
    duration: "end-of-turn",
  },
});
