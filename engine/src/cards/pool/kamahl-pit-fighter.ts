import { defineCard } from "../define.js";

export default defineCard({
  name: "Kamahl, Pit Fighter",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Barbarian"],
  power: 6,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)\n{T}: Kamahl deals 3 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "{T}: Kamahl deals 3 damage to any target.",
    },
  ],
});
