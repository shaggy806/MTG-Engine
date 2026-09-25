import { defineCard } from "../define.js";

export default defineCard({
  name: "Vigilante Justice",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Whenever a Human you control enters, this enchantment deals 1 damage to any target.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Human" } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever a Human you control enters, this enchantment deals 1 damage to any target.",
    },
  ],
});
