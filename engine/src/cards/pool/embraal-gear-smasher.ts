import { defineCard } from "../define.js";

export default defineCard({
  name: "Embraal Gear-Smasher",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text: "{T}, Sacrifice an artifact: This creature deals 2 damage to each opponent.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "{T}, Sacrifice an artifact: This creature deals 2 damage to each opponent.",
    },
  ],
});
