import { defineCard } from "../define.js";

export default defineCard({
  name: "Barrage Ogre",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Warrior"],
  power: 3,
  toughness: 3,
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
