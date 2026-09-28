import { defineCard } from "../define.js";

/** Overload (rule 702.126) — see Cyclonic Rift for the mechanism. */
export default defineCard({
  name: "Damn",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Destroy target creature. A creature destroyed this way can't be regenerated.\n" +
    "Overload {2}{W}{W} (You may cast this spell for its overload cost. If you do, change \"target\" in its text to \"each.\")",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0, cantBeRegenerated: true },
  overload: {
    cost: "{2}{W}{W}",
    effect: { kind: "destroy-all", filter: { type: "creature" }, cantBeRegenerated: true },
  },
});
