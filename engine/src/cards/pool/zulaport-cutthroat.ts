import { defineCard } from "../define.js";

export default defineCard({
  name: "Zulaport Cutthroat",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue", "Ally"],
  power: 1,
  toughness: 1,
  text:
    "Whenever Zulaport Cutthroat or another creature you control dies, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever Zulaport Cutthroat or another creature you control dies, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
