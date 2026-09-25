import { defineCard } from "../define.js";

export default defineCard({
  name: "Friendly Teddy",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Bear", "Toy"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, each player draws a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "When this creature dies, each player draws a card.",
    },
  ],
});
