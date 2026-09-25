import { defineCard } from "../define.js";

export default defineCard({
  name: "Rage Thrower",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 4,
  toughness: 2,
  text: "Whenever another creature dies, this creature deals 2 damage to target player or planeswalker.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "Whenever another creature dies, this creature deals 2 damage to target player or planeswalker.",
    },
  ],
});
