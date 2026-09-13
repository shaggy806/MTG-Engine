import { defineCard } from "../define.js";

/** Overload (rule 702.126) — see Cyclonic Rift for the mechanism. Its
 * overloaded mode reuses the already-shipped `destroy-all` effect. */
export default defineCard({
  name: "Vandalblast",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Destroy target artifact you don't control.\n" +
    "Overload {4}{R} (You may cast this spell for its overload cost. If you do, change \"target\" in its text to \"each.\")",
  targets: ["artifact-an-opponent-controls"],
  effect: { kind: "destroy", target: 0 },
  overload: {
    cost: "{4}{R}",
    effect: { kind: "destroy-all", filter: { type: "artifact", controlledBy: "opponent" } },
  },
});
