import { defineCard } from "../define.js";

export default defineCard({
  name: "Pendulum of Patterns",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, you gain 3 life.\n{5}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{5}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{5}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this artifact enters, you gain 3 life.",
    },
  ],
});
