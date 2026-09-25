import { defineCard } from "../define.js";

export default defineCard({
  name: "Tower of Murmurs",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{8}, {T}: Target player mills eight cards.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 8 },
      resolve: null,
      text: "{8}, {T}: Target player mills eight cards.",
    },
  ],
});
