import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const DRAW =
  "{3}, {T}: Draw a card. Activate only if you control a creature with power 4 or greater.";

// Rule 602.5 — the power check is made only as the ability is activated,
// never again on resolution (2020-04-17 ruling).
export default defineCard({
  name: "Bonders' Enclave",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${DRAW}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{3}", tap: true },
      condition: {
        kind: "controls",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW,
    },
  ],
});
