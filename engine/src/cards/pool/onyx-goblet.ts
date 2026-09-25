import { defineCard } from "../define.js";

export default defineCard({
  name: "Onyx Goblet",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["artifact"],
  text: "{T}: Target player loses 1 life.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: Target player loses 1 life.",
    },
  ],
});
