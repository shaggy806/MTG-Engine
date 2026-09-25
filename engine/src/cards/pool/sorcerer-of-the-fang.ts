import { defineCard } from "../define.js";

export default defineCard({
  name: "Sorcerer of the Fang",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard", "Sorcerer"],
  power: 1,
  toughness: 3,
  text: "{5}{B}, {T}: This creature deals 2 damage to target opponent or planeswalker.",
  activated: [
    {
      cost: { mana: "{5}{B}", tap: true },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{5}{B}, {T}: This creature deals 2 damage to target opponent or planeswalker.",
    },
  ],
});
