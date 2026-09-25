import { defineCard } from "../define.js";

export default defineCard({
  name: "Sinister Starfish",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Starfish"],
  power: 0,
  toughness: 3,
  text: "{T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{T}: Surveil 1.",
    },
  ],
});
