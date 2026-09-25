import { defineCard } from "../define.js";

export default defineCard({
  name: "Stormcaller of Keranos",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\n{1}{U}: Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{1}{U}: Scry 1.",
    },
  ],
});
