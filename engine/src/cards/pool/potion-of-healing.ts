import { defineCard } from "../define.js";

export default defineCard({
  name: "Potion of Healing",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["artifact"],
  text: "When this artifact enters, draw a card.\n{W}, {T}, Sacrifice this artifact: You gain 3 life.",
  activated: [
    {
      cost: { mana: "{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{W}, {T}, Sacrifice this artifact: You gain 3 life.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this artifact enters, draw a card.",
    },
  ],
});
