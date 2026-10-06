import { defineCard } from "../define.js";

// EDHREC rank 6614.
//
// Rulings:
//   [2020-06-23] Each Shrine has an ability that counts the number of Shrines you control. These
//     abilities include the Shrine they're printed on.
//   [2020-06-23] Shrines count only enchantments with the subtype Shrine. Other cards with
//     "shrine" in their name (such as Jungle Shrine, Luxa River Shrine, and Nantuko Shrine) don't
//     count.
//
// X is counted as the ability resolves (Sanctum of Calm Waters' count); the
// discarded card may be any land card or any Shrine card.

const TEXT =
  "{1}, Discard a land card or Shrine card: Sanctum of Shattered Heights deals X damage to target creature or planeswalker, where X is the number of Shrines you control.";

export default defineCard({
  name: "Sanctum of Shattered Heights",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  activated: [
    {
      cost: {
        mana: "{1}",
        tap: false,
        discard: { count: 1, filter: { anyOf: [{ type: "land" }, { subtype: "Shrine" }] } },
      },
      targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
      effect: {
        kind: "damage",
        amount: { countOf: { type: "enchantment", subtype: "Shrine", controlledBy: "you" } },
        target: 0,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
