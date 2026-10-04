import { defineCard } from "../define.js";

// EDHREC rank 5210.
// Makes Blood → use "Blood Token".
//
// Rulings:
//   [2025-01-24] Some triggered abilities trigger "whenever you sacrifice a Blood token." These
//     abilities trigger regardless of why you sacrificed that Blood token.
//   [2025-01-24] You can't sacrifice a Blood token to pay multiple costs.
//   [2025-01-24] If an effect refers to a Blood token, it means any artifact token with the
//     subtype Blood, even if it has gained other subtypes.

export default defineCard({
  name: "Voldaren Epicure",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, it deals 1 damage to each opponent. Create a Blood token. (It's an artifact with \"{1}, {T}, Discard a card, Sacrifice this token: Draw a card.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 1, who: "each-opponent" },
          { kind: "create-token", token: "Blood Token", count: 1 },
        ],
      },
      resolve: null,
      text: "When this creature enters, it deals 1 damage to each opponent. Create a Blood token.",
    },
  ],
});
