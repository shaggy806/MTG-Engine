import { defineCard } from "../define.js";

export default defineCard({
  name: "Stormfist Crusader",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace\nAt the beginning of your upkeep, each player draws a card and loses 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, who: "each-player" },
          { kind: "lose-life", amount: 1, who: "each-player" },
        ],
      },
      resolve: null,
      text: "At the beginning of your upkeep, each player draws a card and loses 1 life.",
    },
  ],
});
