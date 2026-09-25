import { defineCard } from "../define.js";

export default defineCard({
  name: "Orcish Vandal",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc", "Warrior"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice an artifact: This creature deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{T}, Sacrifice an artifact: This creature deals 2 damage to any target.",
    },
  ],
});
