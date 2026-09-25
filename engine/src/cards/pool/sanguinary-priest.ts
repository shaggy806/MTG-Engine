import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanguinary Priest",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Astartes", "Cleric"],
  power: 2,
  toughness: 4,
  keywords: ["lifelink"],
  text: "Lifelink\nBlood Chalice — Whenever another creature you control dies, this creature deals 1 damage to any target.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Blood Chalice — Whenever another creature you control dies, this creature deals 1 damage to any target.",
    },
  ],
});
