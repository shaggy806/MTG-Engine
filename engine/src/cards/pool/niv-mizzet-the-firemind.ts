import { defineCard } from "../define.js";

export default defineCard({
  name: "Niv-Mizzet, the Firemind",
  manaCost: "{2}{U}{U}{R}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Wizard"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever you draw a card, Niv-Mizzet deals 1 damage to any target.\n{T}: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}: Draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever you draw a card, Niv-Mizzet deals 1 damage to any target.",
    },
  ],
});
