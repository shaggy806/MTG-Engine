import { defineCard } from "../define.js";

export default defineCard({
  name: "Havoc Jester",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 5,
  toughness: 5,
  text: "Whenever you sacrifice a permanent, this creature deals 1 damage to any target.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever you sacrifice a permanent, this creature deals 1 damage to any target.",
    },
  ],
});
