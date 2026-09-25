import { defineCard } from "../define.js";

export default defineCard({
  name: "Scepter of Insight",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: "{3}{U}, {T}: Draw a card.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{3}{U}, {T}: Draw a card.",
    },
  ],
});
