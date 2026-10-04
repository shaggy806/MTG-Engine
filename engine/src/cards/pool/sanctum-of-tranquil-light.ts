import { defineCard } from "../define.js";

// EDHREC rank 6121.
//
// Rulings:
//   [2020-06-23] Each Shrine has an ability that counts the number of Shrines you control. These
//     abilities include the Shrine they're printed on.
//   [2020-06-23] The cost reduction applies only to generic mana in the cost of the activated
//     ability. It can't reduce the {W} requirement.
//
// Mirror of Galadriel's `costReduction` (generic mana only), counting Shrines.

const TEXT = "{5}{W}: Tap target creature. This ability costs {1} less to activate for each Shrine you control.";

export default defineCard({
  name: "Sanctum of Tranquil Light",
  manaCost: "{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{5}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      costReduction: { reduceGeneric: { countOf: { subtype: "Shrine", controlledBy: "you" } } },
      text: TEXT,
    },
  ],
});
