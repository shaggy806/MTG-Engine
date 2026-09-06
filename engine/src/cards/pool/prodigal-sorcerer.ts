import { defineCard } from "../define.js";

export default defineCard({
  name: "Prodigal Sorcerer",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{T}: Prodigal Sorcerer deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: Prodigal Sorcerer deals 1 damage to any target.",
    },
  ],
});
