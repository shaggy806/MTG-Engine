import { defineCard } from "../define.js";

export default defineCard({
  name: "Brindle Boar",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Boar"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: You gain 4 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "Sacrifice this creature: You gain 4 life.",
    },
  ],
});
