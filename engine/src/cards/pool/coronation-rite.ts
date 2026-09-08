import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10 — emblems (rule 114). A made-up sorcery that leaves behind
 * a permanent, unremovable anthem for its caster.
 */
export default defineCard({
  name: "Coronation Rite",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "You get an emblem with \"Creatures you control get +1/+1 and have vigilance.\"",
  effect: {
    kind: "create-emblem",
    text: "Creatures you control get +1/+1 and have vigilance.",
    static: {
      affects: { scope: "creatures-you-control" },
      grantPt: [1, 1],
      grantKeywords: ["vigilance"],
      text: "Creatures you control get +1/+1 and have vigilance.",
    },
  },
});
