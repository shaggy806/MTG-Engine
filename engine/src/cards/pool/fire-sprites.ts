import { defineCard } from "../define.js";

export default defineCard({
  name: "Fire Sprites",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{G}, {T}: Add {R}.",
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{G}, {T}: Add {R}.",
    },
  ],
});
