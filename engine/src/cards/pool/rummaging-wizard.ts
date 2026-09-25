import { defineCard } from "../define.js";

export default defineCard({
  name: "Rummaging Wizard",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "{2}{U}: Surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{2}{U}: Surveil 1.",
    },
  ],
});
