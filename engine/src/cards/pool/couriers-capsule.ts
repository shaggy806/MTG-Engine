import { defineCard } from "../define.js";

export default defineCard({
  name: "Courier's Capsule",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: "{1}{U}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{1}{U}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
