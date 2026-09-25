import { defineCard } from "../define.js";

export default defineCard({
  name: "Blazing Hellhound",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 4,
  toughness: 3,
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
