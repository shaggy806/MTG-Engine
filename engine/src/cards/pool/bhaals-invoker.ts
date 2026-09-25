import { defineCard } from "../define.js";

export default defineCard({
  name: "Bhaal's Invoker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Shaman"],
  power: 4,
  toughness: 2,
  text: "Scorching Ray — {8}: This creature deals 4 damage to each opponent.",
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      targets: [],
      effect: { kind: "damage", amount: 4, who: "each-opponent" },
      resolve: null,
      text: "Scorching Ray — {8}: This creature deals 4 damage to each opponent.",
    },
  ],
});
