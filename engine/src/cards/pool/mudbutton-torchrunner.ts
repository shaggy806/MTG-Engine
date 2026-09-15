import { defineCard } from "../define.js";

export default defineCard({
  name: "Mudbutton Torchrunner",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "When Mudbutton Torchrunner dies, it deals 3 damage to any target.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "When Mudbutton Torchrunner dies, it deals 3 damage to any target.",
    },
  ],
});
