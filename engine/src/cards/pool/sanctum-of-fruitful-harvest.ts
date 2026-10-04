import { defineCard } from "../define.js";

// EDHREC rank 5254.
//
// Rulings:
//   [2020-06-23] Shrines count only enchantments with the subtype Shrine. Other cards with
//     “shrine” in their name (such as Jungle Shrine, Luxa River Shrine, and Nantuko Shrine) don't
//     count.
//   [2020-06-23] Each Shrine has an ability that counts the number of Shrines you control. These
//     abilities include the Shrine they're printed on.

export default defineCard({
  name: "Sanctum of Fruitful Harvest",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: "At the beginning of your first main phase, add X mana of any one color, where X is the number of Shrines you control.",
  triggered: [
    {
      // Sanctum of Stone Fangs' shape; X counts this Shrine too (the ruling).
      // "Any one color": all X mana is one colour, chosen as it resolves.
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: { countOf: { type: "enchantment", subtype: "Shrine", controlledBy: "you" } },
      },
      resolve: null,
      text: "At the beginning of your first main phase, add X mana of any one color, where X is the number of Shrines you control.",
    },
  ],
});
