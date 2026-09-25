import { defineCard } from "../define.js";

export default defineCard({
  name: "Spare Supplies",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "This artifact enters tapped.\nWhen this artifact enters, draw a card.\n{2}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: Draw a card.",
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
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
});
