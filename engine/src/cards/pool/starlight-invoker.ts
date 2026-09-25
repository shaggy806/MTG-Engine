import { defineCard } from "../define.js";

export default defineCard({
  name: "Starlight Invoker",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Mutant"],
  power: 1,
  toughness: 3,
  text: "{7}{W}: You gain 5 life.",
  activated: [
    {
      cost: { mana: "{7}{W}", tap: false },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "{7}{W}: You gain 5 life.",
    },
  ],
});
