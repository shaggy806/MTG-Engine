import { defineCard } from "../define.js";

export default defineCard({
  name: "Vengeful Ghoul",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "When Vengeful Ghoul dies, it deals 2 damage to any target.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "When Vengeful Ghoul dies, it deals 2 damage to any target.",
    },
  ],
});
