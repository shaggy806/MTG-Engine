import { defineCard } from "../define.js";

// Metalcraft is an "Activate only if" gate (rule 602.5) on the mana ability
// itself, so it is `ActivatedAbility.condition` — which also keeps the Mox out
// of the auto-payer while fewer than three artifacts are around. The source
// counts toward its own condition: Mox Opal is one of the three.
export default defineCard({
  name: "Mox Opal",
  manaCost: "{0}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text:
    "Metalcraft — {T}: Add one mana of any color. Activate only if you control three or more artifacts.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      condition: { kind: "metalcraft" },
      text:
        "Metalcraft — {T}: Add one mana of any color. Activate only if you control three or more artifacts.",
    },
  ],
});
