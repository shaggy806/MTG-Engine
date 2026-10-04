import { defineCard } from "../define.js";

// EDHREC rank 4390.
//
// Rulings:
//   [2021-06-18] The Underworld Cookbook's last ability can target any creature card in your
//     graveyard, not just one discarded with its first ability.

const FOOD_TEXT =
  "{T}, Discard a card: Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")";
const RETURN_TEXT =
  "{4}, {T}, Sacrifice this artifact: Return target creature card from your graveyard to your hand.";

export default defineCard({
  name: "The Underworld Cookbook",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: `${FOOD_TEXT}\n${RETURN_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, discard: { count: 1 } },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: FOOD_TEXT,
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
