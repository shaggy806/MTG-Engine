import { defineCard } from "../define.js";

// EDHREC rank 3795.
//
// Rulings:
//   [2020-06-23] Each Shrine has an ability that counts the number of Shrines you control. These
//     abilities include the Shrine they're printed on.
//   [2020-06-23] If Sanctum of Stone Fangs leaves the battlefield while its ability is on the
//     stack, you may control no Shrines as the ability resolves. In that case, no player gains or
//     loses any life.
//   [2020-06-23] Shrines count only enchantments with the subtype Shrine.

const SHRINES = { type: "enchantment", subtype: "Shrine", controlledBy: "you" } as const;
const TEXT =
  "At the beginning of your first main phase, each opponent loses X life and you gain X life, where X is the number of Shrines you control.";

export default defineCard({
  name: "Sanctum of Stone Fangs",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: { countOf: SHRINES }, who: "each-opponent" },
          { kind: "gain-life", amount: { countOf: SHRINES } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
