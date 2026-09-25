import { defineCard } from "../define.js";

export default defineCard({
  name: "Soulmender",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{T}: You gain 1 life.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{T}: You gain 1 life.",
    },
  ],
});
