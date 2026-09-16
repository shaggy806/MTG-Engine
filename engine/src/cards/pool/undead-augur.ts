import { defineCard } from "../define.js";

export default defineCard({
  name: "Undead Augur",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 2,
  toughness: 2,
  text:
    "Whenever Undead Augur or another Zombie you control dies, you draw a card and " +
    "you lose 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Zombie" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever Undead Augur or another Zombie you control dies, you draw a card and " +
        "you lose 1 life.",
    },
  ],
});
