import { defineCard } from "../define.js";

export default defineCard({
  name: "Cackling Imp",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}: Target player loses 1 life.",
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
