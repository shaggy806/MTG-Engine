import { defineCard } from "../define.js";

// EDHREC rank 6125.
//
// Rulings:
//   [2025-09-19] If your Agent Venom dies at the same time as one or more other nontoken creatures
//     you control, his ability triggers for each of those creatures.

const TEXT = "Whenever another nontoken creature you control dies, you draw a card and lose 1 life.";

export default defineCard({
  name: "Agent Venom",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Symbiote", "Soldier", "Hero"],
  power: 2,
  toughness: 3,
  keywords: ["flash", "menace"],
  text: `Flash\nMenace\n${TEXT}`,
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
