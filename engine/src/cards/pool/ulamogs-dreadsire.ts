import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 3442.
//
// Rulings:
//   [2024-06-07] If a permanent on the battlefield has {X} in its mana cost, X is 0 when
//     determining its mana value.
//   [2024-06-07] The mana value of a face-down permanent is 0.
//   [2024-06-07] The mana value of a token that isn't a copy of another object is 0.

const WARD = ward({
  sacrifice: {
    filter: { manaValue: { op: "gte", n: 1 } },
    text: "Sacrifice a permanent with mana value 1 or greater",
  },
});

export default defineCard({
  name: "Ulamog's Dreadsire",
  manaCost: "{10}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 10,
  keywords: ["vigilance"],
  text: `Vigilance\n${WARD.text}\n{T}: Create a 10/10 colorless Eldrazi creature token.`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Token", count: 1 },
      resolve: null,
      text: "{T}: Create a 10/10 colorless Eldrazi creature token.",
    },
  ],
  triggered: [WARD],
});
