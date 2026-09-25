import { defineCard } from "../define.js";

export default defineCard({
  name: "Benalish Heralds",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 4,
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
