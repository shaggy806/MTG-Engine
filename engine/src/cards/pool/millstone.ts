import { defineCard } from "../define.js";

export default defineCard({
  name: "Millstone",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: Target player mills two cards.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "{2}, {T}: Target player mills two cards.",
    },
  ],
});
