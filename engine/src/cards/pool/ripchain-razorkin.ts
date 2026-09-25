import { defineCard } from "../define.js";

export default defineCard({
  name: "Ripchain Razorkin",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Berserker"],
  power: 5,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach\n{2}{R}, Sacrifice a land: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{R}, Sacrifice a land: Draw a card.",
    },
  ],
});
