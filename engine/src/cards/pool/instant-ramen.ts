import { defineCard } from "../define.js";

export default defineCard({
  name: "Instant Ramen",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Food"],
  keywords: ["flash"],
  text: "Flash\nWhen this artifact enters, draw a card.\n{2}, {T}, Sacrifice this artifact: You gain 3 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: You gain 3 life.",
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
