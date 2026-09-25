import { defineCard } from "../define.js";

export default defineCard({
  name: "Pyroclastic Elemental",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 4,
  text: "{1}{R}{R}: This creature deals 1 damage to target player.",
  activated: [
    {
      cost: { mana: "{1}{R}{R}", tap: false },
      targets: ["player"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}{R}{R}: This creature deals 1 damage to target player.",
    },
  ],
});
