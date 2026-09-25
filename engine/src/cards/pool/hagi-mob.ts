import { defineCard } from "../define.js";

export default defineCard({
  name: "Hagi Mob",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Troll", "Berserker"],
  power: 5,
  toughness: 4,
  text: "Boast — {1}{R}: This creature deals 1 damage to any target. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Boast — {1}{R}: This creature deals 1 damage to any target.",
      boast: true,
    },
  ],
});
