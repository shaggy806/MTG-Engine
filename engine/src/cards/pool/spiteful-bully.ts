import { defineCard } from "../define.js";

export default defineCard({
  name: "Spiteful Bully",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Zombie", "Mercenary"],
  power: 3,
  toughness: 3,
  text: "At the beginning of your upkeep, this creature deals 3 damage to target creature you control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "At the beginning of your upkeep, this creature deals 3 damage to target creature you control.",
    },
  ],
});
