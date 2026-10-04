import { defineCard } from "../define.js";

// EDHREC rank 4446.

export default defineCard({
  name: "Dusk Legion Zealot",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, you draw a card and you lose 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "When this creature enters, you draw a card and you lose 1 life.",
    },
  ],
});
