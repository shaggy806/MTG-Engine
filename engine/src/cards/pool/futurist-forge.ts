import { defineCard } from "../define.js";

export default defineCard({
  name: "Futurist Forge",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: "When this artifact enters, draw a card.\n{3}{U}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{3}{U}, Sacrifice this artifact: Draw two cards.",
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
