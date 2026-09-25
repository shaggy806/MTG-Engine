import { defineCard } from "../define.js";

export default defineCard({
  name: "Jeska, Warrior Adept",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Barbarian", "Warrior"],
  power: 3,
  toughness: 1,
  keywords: ["first-strike", "haste"],
  text: "First strike, haste\n{T}: Jeska deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: Jeska deals 1 damage to any target.",
    },
  ],
});
