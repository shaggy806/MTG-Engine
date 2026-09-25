import { defineCard } from "../define.js";

export default defineCard({
  name: "Hurler Cyclops",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cyclops"],
  power: 5,
  toughness: 4,
  text: "{1}, Sacrifice another creature: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}, Sacrifice another creature: This creature deals 1 damage to any target.",
      otherOnly: true,
    },
  ],
});
