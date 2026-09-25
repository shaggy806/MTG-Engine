import { defineCard } from "../define.js";

export default defineCard({
  name: "Merciless Enforcers",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary", "Villain"],
  power: 2,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink\n{3}{B}: This creature deals 1 damage to each opponent.",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{3}{B}: This creature deals 1 damage to each opponent.",
    },
  ],
});
