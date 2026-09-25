import { defineCard } from "../define.js";

export default defineCard({
  name: "Fountain of Renewal",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "At the beginning of your upkeep, you gain 1 life.\n{3}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}, Sacrifice this artifact: Draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, you gain 1 life.",
    },
  ],
});
