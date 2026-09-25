import { defineCard } from "../define.js";

export default defineCard({
  name: "Howling Golem",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 2,
  toughness: 3,
  text: "Whenever this creature attacks or blocks, each player draws a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "Whenever this creature attacks or blocks, each player draws a card.",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "Whenever this creature attacks or blocks, each player draws a card.",
    },
  ],
});
