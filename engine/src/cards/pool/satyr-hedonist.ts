import { defineCard } from "../define.js";

export default defineCard({
  name: "Satyr Hedonist",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr"],
  power: 2,
  toughness: 1,
  text: "{R}, Sacrifice this creature: Add {R}{R}{R}.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 3 },
      resolve: null,
      text: "{R}, Sacrifice this creature: Add {R}{R}{R}.",
    },
  ],
});
