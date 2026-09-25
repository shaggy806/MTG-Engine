import { defineCard } from "../define.js";

export default defineCard({
  name: "Sigiled Starfish",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Starfish"],
  power: 0,
  toughness: 3,
  text: "{T}: Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{T}: Scry 1.",
    },
  ],
});
