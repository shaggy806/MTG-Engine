import { defineCard } from "../define.js";

export default defineCard({
  name: "Xira Arien",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Insect", "Wizard"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{B}{R}{G}, {T}: Target player draws a card.",
  activated: [
    {
      cost: { mana: "{B}{R}{G}", tap: true },
      targets: ["player"],
      effect: { kind: "draw", amount: 1, target: 0 },
      resolve: null,
      text: "{B}{R}{G}, {T}: Target player draws a card.",
    },
  ],
});
