import { defineCard } from "../define.js";

// EDHREC rank 3654.
//
// "That player" is the one whose upkeep it is (`"active-player"` — Font of
// Mythos' shape).
const TEXT = "At the beginning of each player's upkeep, that player loses 2 life and draws two cards.";

export default defineCard({
  name: "Seizan, Perverter of Truth",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Spirit"],
  power: 6,
  toughness: 5,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "active-player" },
          { kind: "draw", amount: 2, who: "active-player" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
