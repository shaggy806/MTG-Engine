import { defineCard } from "../define.js";

export default defineCard({
  name: "Flamekin Spitfire",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Shaman"],
  power: 1,
  toughness: 1,
  text: "{3}{R}: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{3}{R}: This creature deals 1 damage to any target.",
    },
  ],
});
