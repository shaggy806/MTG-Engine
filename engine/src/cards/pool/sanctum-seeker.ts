import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanctum Seeker",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 3,
  toughness: 4,
  text: "Whenever a Vampire you control attacks, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Vampire" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever a Vampire you control attacks, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
