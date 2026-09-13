import { defineCard } from "../define.js";

/**
 * Overload (rule 702.126) — see Cyclonic Rift for the mechanism.
 * "A creature destroyed this way can't be regenerated" is dropped —
 * regenerate isn't modeled anywhere in the engine (same as Mortivore's
 * dropped Regenerate), so the clause is already vacuously true.
 */
export default defineCard({
  name: "Damn",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Destroy target creature.\n" +
    "Overload {2}{W}{W} (You may cast this spell for its overload cost. If you do, change \"target\" in its text to \"each.\")",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0 },
  overload: {
    cost: "{2}{W}{W}",
    effect: { kind: "destroy-all", filter: { type: "creature" } },
  },
});
