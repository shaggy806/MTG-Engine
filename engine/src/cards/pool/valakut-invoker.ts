import { defineCard } from "../define.js";

export default defineCard({
  name: "Valakut Invoker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 3,
  text: "{8}: This creature deals 3 damage to any target.",
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "{8}: This creature deals 3 damage to any target.",
    },
  ],
});
