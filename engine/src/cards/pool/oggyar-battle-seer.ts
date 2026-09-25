import { defineCard } from "../define.js";

export default defineCard({
  name: "Oggyar Battle-Seer",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Ogre", "Shaman"],
  power: 3,
  toughness: 4,
  keywords: ["haste"],
  text: "Haste\n{T}: Scry 1.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{T}: Scry 1.",
    },
  ],
});
