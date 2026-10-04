import { defineCard } from "../define.js";

// EDHREC rank 2788.
//
// Rulings:
//   [2024-11-08] If a creature card in your graveyard has {X} in its mana cost, X is 0 for the
//     purpose of determining its mana value.
export default defineCard({
  name: "Raise the Past",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return all creature cards with mana value 2 or less from your graveyard to the battlefield.",
  effect: {
    kind: "return-from-graveyard",
    filter: { type: "creature", manaValue: { op: "lte", n: 2 } },
    destination: "battlefield",
    count: "all",
  },
});
