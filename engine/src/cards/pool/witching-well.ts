import { defineCard } from "../define.js";

export default defineCard({
  name: "Witching Well",
  manaCost: "{U}",
  colors: ["U"],
  types: ["artifact"],
  text: "When this artifact enters, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)\n{3}{U}, Sacrifice this artifact: Draw two cards.",
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
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this artifact enters, scry 2.",
    },
  ],
});
